import "./isolateDurablePaths.js";
import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import fs from "fs";
import os from "os";
import path from "path";
import http from "http";
import {
  closeDatabase,
  initDatabase,
} from "../src/db/connection.js";
import { getHealthPayload } from "../src/health.js";
import { seedDatabase } from "../src/db/seed.js";
import { insertService, listServices } from "../src/models/Service.js";
import { DEFAULT_SERVICES } from "../../shared/defaultServices.js";
import { DEFAULT_SETTINGS } from "../src/config/defaults.js";
import { persistAdminState } from "../src/db/persist.js";
import { catalogMatchesDefaults } from "../src/db/catalogCompare.js";
import {
  getDefaultCatalogBackupUrl,
  isOffHostBackupConfigured,
  resetOffHostBackupStatus,
  setOffHostBackupFetch,
  shouldHydrateFromOffHost,
  waitForOffHostBackup,
} from "../src/db/offHostBackup.js";
import { fileURLToPath } from "url";

function factoryIds() {
  return new Set(DEFAULT_SERVICES.map((service) => service.id));
}

function factoryNames() {
  return new Set(DEFAULT_SERVICES.map((service) => service.nameEn));
}

function customState(savedAt) {
  return {
    version: 1,
    savedAt,
    services: DEFAULT_SERVICES.map((service) =>
      service.id === "youtube-premium"
        ? { ...service, nameEn: "YouTube Bahrain Live", prices: { month: 4, year: 30 } }
        : service,
    ),
    settings: {
      ...DEFAULT_SETTINGS,
      catalogSeeded: true,
      complaintEmail: "kept-admin@example.com",
    },
  };
}

describe("off-host GitHub catalog backup survives empty local disk", { concurrency: 1 }, () => {
  const dirs = [];
  const envKeys = [
    "HOME",
    "LOCAL_HOST_DATA_DIR",
    "ROOT_HOST_DATA_DIR",
    "DATA_DIR",
    "ALLOW_FACTORY_SEED",
    "CATALOG_BACKUP_TOKEN",
    "CATALOG_BACKUP_REPO",
    "CATALOG_BACKUP_PATH",
    "CATALOG_BACKUP_BRANCH",
    "CATALOG_BACKUP_URL",
    "CATALOG_BACKUP_SKIP_PACKAGED",
    "GITHUB_TOKEN",
    "GH_TOKEN",
  ];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  function restoreEnv() {
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }

  function makeHostDirs() {
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-oh-local-"));
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-oh-root-"));
    const homeBase = fs.mkdtempSync(path.join(os.tmpdir(), "gs-oh-home-"));
    dirs.push(localDir, rootDir, homeBase);
    process.env.LOCAL_HOST_DATA_DIR = localDir;
    process.env.ROOT_HOST_DATA_DIR = rootDir;
    process.env.HOME = homeBase;
    delete process.env.DATA_DIR;
    delete process.env.ALLOW_FACTORY_SEED;
    delete process.env.CATALOG_BACKUP_SKIP_PACKAGED;
    return {
      localDir,
      rootDir,
      homeDir: path.join(homeBase, "social-store-bahrain-data"),
    };
  }

  function wipeDir(dir) {
    if (!dir || !fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      fs.rmSync(path.join(dir, name), { recursive: true, force: true });
    }
  }

  function installGithubMock(initial = null) {
    const remote = { state: initial, sha: initial ? "sha-1" : null };
    setOffHostBackupFetch(async (url, options = {}) => {
      const method = String(options.method || "GET").toUpperCase();
      const isGithub = String(url).includes("api.github.com/repos/");
      if (isGithub && method === "GET") {
        if (!remote.state) {
          return { ok: false, status: 404, json: async () => ({ message: "Not Found" }) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            sha: remote.sha,
            encoding: "base64",
            content: Buffer.from(`${JSON.stringify(remote.state, null, 2)}\n`).toString("base64"),
          }),
        };
      }
      if (isGithub && method === "PUT") {
        const body = JSON.parse(options.body);
        remote.state = JSON.parse(Buffer.from(body.content, "base64").toString("utf8"));
        remote.sha = `sha-${Date.now()}`;
        return {
          ok: true,
          status: 200,
          json: async () => ({ content: { sha: remote.sha } }),
        };
      }
      if (method === "GET") {
        if (!remote.state) {
          return { ok: false, status: 404, json: async () => ({}) };
        }
        return { ok: true, status: 200, json: async () => remote.state };
      }
      return { ok: false, status: 500, json: async () => ({}) };
    });
    return remote;
  }

  after(() => {
    closeDatabase();
    restoreEnv();
    setOffHostBackupFetch(null);
    resetOffHostBackupStatus();
    for (const dir of dirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    resetOffHostBackupStatus();
    delete process.env.ALLOW_FACTORY_SEED;
  });

  it("pushes custom catalog to GitHub and restores it after a total local wipe without factory names", async () => {
    const hosts = makeHostDirs();
    process.env.CATALOG_BACKUP_TOKEN = "test-token";
    process.env.CATALOG_BACKUP_REPO = "Yunusbashashaik/Social_Store-Bahrain";
    process.env.CATALOG_BACKUP_PATH = "catalog-backup/admin-state.json";
    process.env.CATALOG_BACKUP_SKIP_PACKAGED = "1";
    const remote = installGithubMock();

    initDatabase(undefined, { engine: "json" });
    await seedDatabase();
    assert.equal(listServices().length, 0);

    insertService({
      id: "bahrain-live-custom",
      nameEn: "Bahrain Live Custom",
      nameAr: "بحرين",
      descriptionEn: "en",
      descriptionAr: "ar",
      prices: { month: 3, year: 20 },
    });
    persistAdminState();
    await waitForOffHostBackup();

    assert.equal(remote.state?.services?.[0]?.nameEn, "Bahrain Live Custom");

    closeDatabase();
    wipeDir(hosts.localDir);
    wipeDir(hosts.rootDir);
    wipeDir(hosts.homeDir);

    initDatabase(undefined, { engine: "json" });
    const seeded = await seedDatabase();
    const listed = listServices();
    const health = getHealthPayload();

    assert.equal(seeded.catalogSeededThisBoot, false);
    assert.equal(seeded.offHostHydrated.restored, true);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].nameEn, "Bahrain Live Custom");
    assert.equal(listed.some((row) => factoryIds().has(row.id)), false);
    assert.equal(listed.some((row) => factoryNames().has(row.nameEn)), false);
    assert.equal(health.offHostBackupConfigured, true);
    assert.equal(health.offHostBackupRestoredThisBoot, true);
    assert.ok(health.offHostBackupSavedAt);
    assert.equal(health.factorySeedDisabled, true);
    assert.equal(health.catalogMatchesDefaults, false);
    assert.equal(health.catalogSeededThisBoot, false);
  });

  it("hydrates from CATALOG_BACKUP_URL when local disks are empty", async () => {
    makeHostDirs();
    const snapshot = customState("2026-09-17T01:00:00.000Z");
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(snapshot));
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();
    process.env.CATALOG_BACKUP_URL = `http://127.0.0.1:${port}/admin-state.json`;
    delete process.env.CATALOG_BACKUP_TOKEN;
    delete process.env.CATALOG_BACKUP_REPO;
    setOffHostBackupFetch(null);

    try {
      initDatabase(undefined, { engine: "json" });
      const seeded = await seedDatabase();
      const youtube = listServices().find((row) => row.id === "youtube-premium");
      assert.equal(seeded.offHostHydrated.restored, true);
      assert.equal(youtube.nameEn, "YouTube Bahrain Live");
      assert.equal(youtube.prices.month, 4);
      assert.equal(getHealthPayload().offHostBackupRestoredThisBoot, true);
      assert.equal(getHealthPayload().factorySeedDisabled, true);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("hydrates from off-host only when the live catalog is empty", () => {
    assert.equal(shouldHydrateFromOffHost([]), true);
    assert.equal(shouldHydrateFromOffHost(null), true);
    assert.equal(shouldHydrateFromOffHost(DEFAULT_SERVICES), false);
    assert.equal(
      shouldHydrateFromOffHost(
        DEFAULT_SERVICES.map((service) =>
          service.id === "prime-video-shared"
            ? { ...service, prices: { month: 0.6, year: 4 } }
            : service,
        ),
      ),
      false,
    );
  });

  it("does not restore off-host backup over a non-empty factory catalog", async () => {
    makeHostDirs();
    process.env.ALLOW_FACTORY_SEED = "1";
    process.env.CATALOG_BACKUP_SKIP_PACKAGED = "1";
    process.env.CATALOG_BACKUP_TOKEN = "test-token";
    process.env.CATALOG_BACKUP_REPO = "Yunusbashashaik/Social_Store-Bahrain";
    const remote = installGithubMock(customState("2026-09-17T23:00:00.000Z"));

    initDatabase(undefined, { engine: "json" });
    await seedDatabase();
    assert.ok(listServices().length > 0);
    assert.equal(catalogMatchesDefaults(listServices()), true);

    const seeded = await seedDatabase();
    const youtube = listServices().find((row) => row.id === "youtube-premium");
    const primeShared = listServices().find((row) => row.id === "prime-video-shared");

    assert.equal(seeded.offHostHydrated.restored, false);
    assert.equal(seeded.offHostHydrated.reason, "live-custom");
    assert.notEqual(youtube.nameEn, "YouTube Bahrain Live");
    assert.equal(primeShared.prices.month, DEFAULT_SERVICES.find((s) => s.id === "prime-video-shared").prices.month);
    assert.equal(remote.state.services.find((s) => s.id === "youtube-premium").nameEn, "YouTube Bahrain Live");
    assert.equal(getHealthPayload().offHostBackupRestoredThisBoot, false);
  });

  it("default GitHub raw URL is configured without a token", () => {
    delete process.env.CATALOG_BACKUP_TOKEN;
    delete process.env.CATALOG_BACKUP_REPO;
    delete process.env.CATALOG_BACKUP_URL;
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    assert.equal(
      getDefaultCatalogBackupUrl(),
      "https://raw.githubusercontent.com/Yunusbashashaik/Social_Store-Bahrain/main/catalog-backup/admin-state.json",
    );
    assert.equal(isOffHostBackupConfigured(), true);
  });

  it("restores committed catalog-backup via default raw URL without a token or factory seed", async () => {
    makeHostDirs();
    process.env.CATALOG_BACKUP_SKIP_PACKAGED = "1";
    delete process.env.CATALOG_BACKUP_TOKEN;
    delete process.env.CATALOG_BACKUP_REPO;
    delete process.env.CATALOG_BACKUP_URL;
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
    const snapshot = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "catalog-backup", "admin-state.json"), "utf8"),
    );
    assert.ok(snapshot.services.length > 0);
    assert.equal(snapshot.version, 1);
    assert.ok(snapshot.services.every((service) => service.offerType));

    setOffHostBackupFetch(async (url) => {
      assert.equal(String(url), getDefaultCatalogBackupUrl());
      return {
        ok: true,
        status: 200,
        json: async () => snapshot,
      };
    });

    initDatabase(undefined, { engine: "json" });
    const seeded = await seedDatabase();
    assert.equal(seeded.catalogSeededThisBoot, false);
    assert.equal(seeded.offHostHydrated.restored, true);
    assert.equal(listServices().length, snapshot.services.length);
    const primeShared = listServices().find((row) => row.id === "prime-video-shared");
    assert.equal(primeShared.prices.month, 0.6);
    assert.equal(primeShared.prices.year, 4);

    const health = getHealthPayload();
    assert.equal(health.factorySeedDisabled, true);
    assert.equal(health.offHostBackupConfigured, true);
    assert.equal(health.offHostBackupRestoredThisBoot, true);
    assert.equal(health.catalogSeededThisBoot, false);
    assert.equal(health.catalogEmpty, false);
  });

  it("restores committed catalog-backup from the packaged path without a token", async () => {
    makeHostDirs();
    delete process.env.CATALOG_BACKUP_SKIP_PACKAGED;
    delete process.env.CATALOG_BACKUP_TOKEN;
    delete process.env.CATALOG_BACKUP_REPO;
    delete process.env.CATALOG_BACKUP_URL;
    setOffHostBackupFetch(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not Found" }),
    }));

    initDatabase(undefined, { engine: "json" });
    const seeded = await seedDatabase();
    assert.equal(seeded.catalogSeededThisBoot, false);
    assert.equal(seeded.offHostHydrated.restored, true);
    assert.ok(String(seeded.offHostHydrated.snapshotPath || "").includes("catalog-backup"));
    assert.equal(listServices().length, DEFAULT_SERVICES.length);
    const primeShared = listServices().find((row) => row.id === "prime-video-shared");
    assert.equal(primeShared.prices.month, 0.6);
    assert.equal(primeShared.prices.year, 4);

    const health = getHealthPayload();
    assert.equal(health.offHostBackupConfigured, true);
    assert.equal(health.offHostBackupRestoredThisBoot, true);
    assert.equal(health.catalogSeededThisBoot, false);
    assert.equal(health.factorySeedDisabled, true);
  });
});

