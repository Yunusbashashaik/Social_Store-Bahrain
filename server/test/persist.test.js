import "./isolateDurablePaths.js";
import { isolatedHomeDir, isolatedLocalDir, isolatedRootDir } from "./isolateDurablePaths.js";
import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import fs from "fs";
import os from "os";
import path from "path";
import {
  closeDatabase,
  getDataDir,
  getDbEngine,
  getServiceUploadsDir,
  initDatabase,
  isInsideAppTree,
  migrateLegacyDataDir,
  resolveProductionDataDir,
} from "../src/db/connection.js";
import { getLastSeedResult, seedDatabase } from "../src/db/seed.js";
import { getHealthPayload } from "../src/health.js";
import {
  insertService,
  listPublicServices,
  listServices,
  updateService,
} from "../src/models/Service.js";
import { DEFAULT_SERVICES } from "../../shared/defaultServices.js";
import { DEFAULT_SETTINGS } from "../src/config/defaults.js";
import { getAllSettings, getSetting, setSetting, updateSettings } from "../src/models/Settings.js";
import {
  catalogMatchesDefaults,
  getSnapshotPaths,
  isCustomAdminState,
  pickBetterSnapshot,
  persistAdminState,
  readAdminSnapshot,
  writeAdminSnapshot,
} from "../src/db/persist.js";

describe("admin catalog persistence", { concurrency: 1 }, () => {
  const dirs = [];

  function wipeIsolatedMirrors() {
    for (const dir of [
      isolatedLocalDir,
      isolatedRootDir,
      path.join(isolatedHomeDir, "social-store-bahrain-data"),
    ]) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  beforeEach(() => {
    wipeIsolatedMirrors();
  });

  after(() => {
    closeDatabase();
    for (const dir of dirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps settings after close, reopen, and seed", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-persist-"));
    dirs.push(dir);
    const jsonPath = path.join(dir, "globalstore.json");
    initDatabase(path.join(dir, "unused.db"), { engine: "json", jsonPath });
    seedDatabase();

    updateSettings({
      complaintEmail: "persist@example.com",
      aboutEn: "Kept about text",
    });

    closeDatabase();
    initDatabase(path.join(dir, "unused.db"), { engine: "json", jsonPath });
    seedDatabase();

    assert.equal(getDbEngine(), "json");
    assert.equal(listServices().length, DEFAULT_SERVICES.length);
    const settings = getAllSettings();
    assert.equal(settings.complaintEmail, "persist@example.com");
    assert.equal(settings.aboutEn, "Kept about text");
    assert.equal(fs.existsSync(`${jsonPath}.bak`), false);
  });

  it("does not copy or keep JSON catalog backup files", () => {
    const fromDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-legacy-bak-"));
    const toDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-dest-bak-"));
    dirs.push(fromDir, toDir);
    fs.writeFileSync(path.join(fromDir, "globalstore.json"), '{"services":[]}\n');
    fs.writeFileSync(path.join(fromDir, "globalstore.json.bak"), '{"services":[{"id":"old"}]}\n');
    migrateLegacyDataDir(fromDir, toDir);
    assert.equal(fs.existsSync(path.join(toDir, "globalstore.json.bak")), false);
    assert.equal(fs.existsSync(path.join(fromDir, "globalstore.json.bak")), false);
    assert.ok(fs.existsSync(path.join(toDir, "globalstore.json")));
  });

  it("copies leftover upload files into a data folder that already exists", () => {
    const fromDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-legacy-up-"));
    const toDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-dest-up-"));
    dirs.push(fromDir, toDir);
    fs.mkdirSync(path.join(fromDir, "uploads", "services"), { recursive: true });
    fs.mkdirSync(path.join(toDir, "uploads", "services"), { recursive: true });
    fs.writeFileSync(path.join(fromDir, "uploads", "services", "sample.jpg"), "img");
    fs.writeFileSync(path.join(toDir, "uploads", "keep.txt"), "x");
    migrateLegacyDataDir(fromDir, toDir);
    assert.ok(
      fs.existsSync(path.join(toDir, "uploads", "services", "sample.jpg")),
    );
  });

  it("writes new service images into the active data directory", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-upload-"));
    dirs.push(dir);
    initDatabase(path.join(dir, "unused.db"), {
      engine: "json",
      jsonPath: path.join(dir, "globalstore.json"),
    });
    const dest = getServiceUploadsDir();
    assert.equal(dest, path.join(dir, "uploads", "services"));
    assert.ok(fs.existsSync(dest));
  });

  it("seeds the default catalog only when the store is empty", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-empty-hard-"));
    dirs.push(dir);
    initDatabase(path.join(dir, "unused.db"), {
      engine: "json",
      jsonPath: path.join(dir, "globalstore.json"),
    });
    insertService({
      id: "live-row",
      nameEn: "Live Row",
      nameAr: "حي",
      descriptionEn: "en",
      descriptionAr: "ar",
      prices: { month: 1, year: 8 },
    });
    const first = seedDatabase();
    assert.equal(first.catalogSeededThisBoot, false);
    assert.equal(listServices().length, 1);
    assert.equal(listServices()[0].id, "live-row");
    assert.equal(getSetting("catalogSeeded"), true);
  });

  it("keeps renamed services after close, reopen, and seed", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-rename-"));
    dirs.push(dir);
    const jsonPath = path.join(dir, "globalstore.json");
    initDatabase(path.join(dir, "unused.db"), { engine: "json", jsonPath });
    const seeded = seedDatabase();
    assert.equal(seeded.catalogSeededThisBoot, true);

    const original = listServices().find((s) => s.id === "youtube-premium");
    assert.ok(original);
    updateService("youtube-premium", { nameEn: "YouTube Bahrain Live" });

    closeDatabase();
    initDatabase(path.join(dir, "unused.db"), { engine: "json", jsonPath });
    const again = seedDatabase();
    assert.equal(again.catalogSeededThisBoot, false);
    assert.equal(getLastSeedResult().catalogSeededThisBoot, false);

    const renamed = listServices().find((s) => s.id === "youtube-premium");
    assert.equal(renamed.nameEn, "YouTube Bahrain Live");
    assert.ok(listServices().some((s) => s.id === "netflix-prime-combo"));
  });

  it("does not delete admin-added services on later seeds", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-extra-"));
    dirs.push(dir);
    initDatabase(path.join(dir, "unused.db"), {
      engine: "json",
      jsonPath: path.join(dir, "globalstore.json"),
    });
    seedDatabase();
    insertService({
      id: "extra-admin",
      nameEn: "Extra",
      nameAr: "إضافي",
      descriptionEn: "en",
      descriptionAr: "ar",
      prices: { month: 2, year: 9 },
    });
    seedDatabase();
    const listed = listServices();
    assert.ok(listed.some((s) => s.id === "extra-admin"));
    assert.ok(listed.length > DEFAULT_SERVICES.length);
  });

  it("reports durable health fields after seed-once", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-health-"));
    dirs.push(dir);
    initDatabase(path.join(dir, "unused.db"), {
      engine: "json",
      jsonPath: path.join(dir, "globalstore.json"),
    });
    seedDatabase();
    const health = getHealthPayload();
    assert.equal(health.ok, true);
    assert.equal(health.catalogSeeded, true);
    assert.equal(health.catalogSeededThisBoot, true);
    assert.equal(health.dataDir, getDataDir());
    assert.ok(health.storePath);
    assert.ok(health.snapshotSavedAt);
    assert.equal(typeof health.dataDirInsideApp, "boolean");
    assert.ok(Array.isArray(health.snapshotPaths));
    assert.ok(Array.isArray(health.snapshotWritePaths));
    assert.equal(typeof health.snapshotCustom, "boolean");
    assert.equal(typeof health.catalogMatchesDefaults, "boolean");
    assert.equal(typeof health.possibleOvernightWipe, "boolean");
    assert.ok(Array.isArray(health.durablePathStatus));
    assert.equal(isInsideAppTree(dir, dir), true);

    seedDatabase();
    assert.equal(getHealthPayload().catalogSeededThisBoot, false);
  });

  it("hides expired offers from the public catalog only", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-offer-"));
    dirs.push(dir);
    initDatabase(path.join(dir, "unused.db"), {
      engine: "json",
      jsonPath: path.join(dir, "globalstore.json"),
    });
    seedDatabase();
    insertService({
      id: "eid-offer-row",
      nameEn: "Eid Deal",
      nameAr: "عيد",
      descriptionEn: "en",
      descriptionAr: "ar",
      prices: { month: 1, year: 8 },
      offerType: "eid",
      offerExpiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    insertService({
      id: "special-offer-row",
      nameEn: "Special Deal",
      nameAr: "خاص",
      descriptionEn: "en",
      descriptionAr: "ar",
      prices: { month: 2, year: 9 },
      offerType: "special",
      offerExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    const adminList = listServices();
    const publicList = listPublicServices();
    assert.ok(adminList.some((s) => s.id === "eid-offer-row"));
    assert.equal(publicList.some((s) => s.id === "eid-offer-row"), false);
    assert.ok(publicList.some((s) => s.id === "special-offer-row"));
    assert.ok(publicList.some((s) => s.id === "netflix-prime-combo"));
  });
});

describe("multi-path durable catalog across host mounts", { concurrency: 1 }, () => {
  const dirs = [];
  const envKeys = ["HOME", "LOCAL_HOST_DATA_DIR", "ROOT_HOST_DATA_DIR", "DATA_DIR"];
  const previousEnv = {};

  function stashEnv() {
    for (const key of envKeys) {
      previousEnv[key] = process.env[key];
    }
  }

  function restoreEnv() {
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }

  function makeHostDirs() {
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-local-"));
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-root-"));
    const homeBase = fs.mkdtempSync(path.join(os.tmpdir(), "gs-home-"));
    dirs.push(localDir, rootDir, homeBase);
    process.env.LOCAL_HOST_DATA_DIR = localDir;
    process.env.ROOT_HOST_DATA_DIR = rootDir;
    process.env.HOME = homeBase;
    delete process.env.DATA_DIR;
    return { localDir, rootDir, homeDir: path.join(homeBase, "social-store-bahrain-data") };
  }

  function wipeDir(dir) {
    if (!dir || !fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      fs.rmSync(path.join(dir, name), { recursive: true, force: true });
    }
  }

  function customState(savedAt) {
    return {
      version: 1,
      savedAt,
      services: DEFAULT_SERVICES.map((service) =>
        service.id === "youtube-premium"
          ? { ...service, nameEn: "YouTube Bahrain Live" }
          : service,
      ),
      settings: {
        ...DEFAULT_SETTINGS,
        complaintEmail: "kept-admin@example.com",
      },
    };
  }

  function writeSnapshot(dir, state) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "admin-state.json"), `${JSON.stringify(state, null, 2)}\n`);
  }

  stashEnv();

  after(() => {
    closeDatabase();
    restoreEnv();
    for (const dir of dirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("prefers a custom snapshot over a newer factory snapshot", () => {
    const factory = {
      version: 1,
      savedAt: "2026-09-15T21:45:00.000Z",
      services: DEFAULT_SERVICES,
      settings: DEFAULT_SETTINGS,
    };
    const custom = customState("2026-09-14T08:00:00.000Z");
    assert.equal(isCustomAdminState(custom), true);
    assert.equal(catalogMatchesDefaults(factory.services), true);
    const best = pickBetterSnapshot(factory, custom);
    assert.equal(best.savedAt, custom.savedAt);
    assert.equal(
      best.services.find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
  });

  it("mirrors admin snapshots to /local, /root, and $HOME", () => {
    const hosts = makeHostDirs();
    initDatabase(undefined, { engine: "json" });
    seedDatabase();
    updateService("youtube-premium", { nameEn: "YouTube Bahrain Live" });

    const localSnap = path.join(hosts.localDir, "admin-state.json");
    const rootSnap = path.join(hosts.rootDir, "admin-state.json");
    const homeSnap = path.join(hosts.homeDir, "admin-state.json");
    assert.ok(fs.existsSync(localSnap), "local snapshot");
    assert.ok(fs.existsSync(rootSnap), "root snapshot");
    assert.ok(fs.existsSync(homeSnap), "home snapshot");
    assert.ok(getSnapshotPaths().includes(localSnap));
    const parsed = JSON.parse(fs.readFileSync(homeSnap, "utf8"));
    assert.equal(
      parsed.services.find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
  });

  it("restores custom catalog after /local is wiped like a GoDaddy recycle", () => {
    const hosts = makeHostDirs();
    initDatabase(undefined, { engine: "json" });
    seedDatabase();
    updateService("youtube-premium", { nameEn: "YouTube Bahrain Live" });
    updateSettings({ complaintEmail: "kept-admin@example.com" });
    closeDatabase();

    wipeDir(hosts.localDir);
    initDatabase(undefined, { engine: "json" });
    const seeded = seedDatabase();
    assert.equal(seeded.catalogSeededThisBoot, false);
    assert.equal(seeded.hydrated.restored, true);
    assert.equal(
      listServices().find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
    assert.equal(getAllSettings().complaintEmail, "kept-admin@example.com");
    const health = getHealthPayload();
    assert.equal(health.catalogSeededThisBoot, false);
    assert.equal(health.snapshotCustom, true);
    assert.equal(health.catalogMatchesDefaults, false);
    assert.equal(health.hydratedThisBoot, true);
    assert.ok(fs.existsSync(path.join(hosts.localDir, "admin-state.json")));
  });

  it("does not factory-seed or overwrite a custom snapshot that only exists on $HOME", () => {
    const hosts = makeHostDirs();
    writeSnapshot(hosts.homeDir, customState("2026-09-14T08:00:00.000Z"));
    initDatabase(undefined, { engine: "json" });
    const seeded = seedDatabase();
    assert.equal(seeded.catalogSeededThisBoot, false);
    assert.equal(isCustomAdminState(readAdminSnapshot()), true);
    assert.equal(
      listServices().find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
    const homeParsed = JSON.parse(
      fs.readFileSync(path.join(hosts.homeDir, "admin-state.json"), "utf8"),
    );
    assert.equal(
      homeParsed.services.find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
  });

  it("does not replace a custom $HOME snapshot with a newer factory snapshot on /local", () => {
    const hosts = makeHostDirs();
    writeSnapshot(
      hosts.localDir,
      {
        version: 1,
        savedAt: "2026-09-15T21:45:00.000Z",
        services: DEFAULT_SERVICES,
        settings: DEFAULT_SETTINGS,
      },
    );
    writeSnapshot(hosts.homeDir, customState("2026-09-14T08:00:00.000Z"));
    const chosen = resolveProductionDataDir();
    assert.equal(chosen, hosts.homeDir);
    initDatabase(undefined, { engine: "json" });
    const seeded = seedDatabase();
    assert.equal(seeded.catalogSeededThisBoot, false);
    assert.equal(
      listServices().find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
  });

  it("keeps offer type fields after persist and reopen", () => {
    makeHostDirs();
    initDatabase(undefined, { engine: "json" });
    seedDatabase();
    const expires = new Date(Date.now() + 60_000).toISOString();
    updateService("youtube-premium", {
      offerType: "eid",
      offerExpiresAt: expires,
    });
    closeDatabase();
    initDatabase(undefined, { engine: "json" });
    seedDatabase();
    const row = listServices().find((s) => s.id === "youtube-premium");
    assert.equal(row.offerType, "eid");
    assert.ok(row.offerExpiresAt);
    assert.equal(listPublicServices().some((s) => s.id === "youtube-premium"), true);
  });

  it("never factory-seeds again once catalogSeeded is set, even if the table is empty", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-seeded-empty-"));
    dirs.push(dir);
    initDatabase(path.join(dir, "unused.db"), {
      engine: "json",
      jsonPath: path.join(dir, "globalstore.json"),
    });
    setSetting("catalogSeeded", true);
    const seeded = seedDatabase();
    assert.equal(seeded.catalogSeededThisBoot, false);
    assert.equal(seeded.skippedFactorySeed, true);
    assert.equal(listServices().length, 0);
  });

  it("restores a backup snapshot without inserting DEFAULT_SERVICES", () => {
    const hosts = makeHostDirs();
    writeSnapshot(hosts.homeDir, customState("2026-09-14T08:00:00.000Z"));
    initDatabase(undefined, { engine: "json" });
    const seeded = seedDatabase();
    assert.equal(seeded.catalogSeededThisBoot, false);
    assert.equal(seeded.servicesSeeded, false);
    assert.equal(seeded.hydrated.restored, true);
    assert.equal(listServices().length, DEFAULT_SERVICES.length);
    assert.equal(
      listServices().find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
  });

  it("refuses to persist a factory catalog over a custom admin-state.json", () => {
    const hosts = makeHostDirs();
    const custom = customState("2026-09-14T08:00:00.000Z");
    writeSnapshot(hosts.homeDir, custom);
    initDatabase(undefined, { engine: "json" });
    writeAdminSnapshot({
      savedAt: "2026-09-15T21:45:00.000Z",
      services: DEFAULT_SERVICES,
      settings: DEFAULT_SETTINGS,
    });
    const homeParsed = JSON.parse(
      fs.readFileSync(path.join(hosts.homeDir, "admin-state.json"), "utf8"),
    );
    assert.equal(
      homeParsed.services.find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
    persistAdminState();
    const homeAgain = JSON.parse(
      fs.readFileSync(path.join(hosts.homeDir, "admin-state.json"), "utf8"),
    );
    assert.equal(
      homeAgain.services.find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
  });
});
