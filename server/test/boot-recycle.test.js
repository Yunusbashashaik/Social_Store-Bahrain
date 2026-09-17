import "./isolateDurablePaths.js";
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import fs from "fs";
import os from "os";
import path from "path";
import {
  closeDatabase,
  getDataDir,
  initDatabase,
} from "../src/db/connection.js";
import { getLastSeedResult, seedDatabase } from "../src/db/seed.js";
import { seedWithFactory } from "./factorySeedEnv.js";
import { getHealthPayload } from "../src/health.js";
import { listServices, updateService } from "../src/models/Service.js";
import { DEFAULT_SERVICES } from "../../shared/defaultServices.js";
import { DEFAULT_SETTINGS } from "../src/config/defaults.js";
import {
  persistAdminState,
  readAdminSnapshot,
  writeAdminSnapshot,
} from "../src/db/persist.js";

describe("production boot recycle (initDatabase with no explicit store)", { concurrency: 1 }, () => {
  const dirs = [];
  const envKeys = ["HOME", "LOCAL_HOST_DATA_DIR", "ROOT_HOST_DATA_DIR", "DATA_DIR"];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  function restoreEnv() {
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }

  function makeHostDirs() {
    const localDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-boot-local-"));
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-boot-root-"));
    const homeBase = fs.mkdtempSync(path.join(os.tmpdir(), "gs-boot-home-"));
    dirs.push(localDir, rootDir, homeBase);
    process.env.LOCAL_HOST_DATA_DIR = localDir;
    process.env.ROOT_HOST_DATA_DIR = rootDir;
    process.env.HOME = homeBase;
    delete process.env.DATA_DIR;
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

  function writeSnapshot(dir, state) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "admin-state.json"), `${JSON.stringify(state, null, 2)}\n`);
  }

  after(() => {
    closeDatabase();
    restoreEnv();
    for (const dir of dirs) {
      try {
        fs.chmodSync(dir, 0o755);
      } catch {
        /* ignore */
      }
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("wiped primary + custom snapshot only on /root restores names and does not reseed", async () => {
    const hosts = makeHostDirs();
    writeSnapshot(hosts.rootDir, customState("2026-09-14T08:00:00.000Z"));
    fs.chmodSync(hosts.rootDir, 0o555);

    initDatabase(undefined, { engine: "json" });
    const seeded = await seedDatabase();
    const youtube = listServices().find((s) => s.id === "youtube-premium");

    assert.equal(seeded.catalogSeededThisBoot, false);
    assert.equal(seeded.servicesSeeded, false);
    assert.equal(youtube.nameEn, "YouTube Bahrain Live");
    assert.equal(youtube.prices.month, 4);
    assert.equal(path.resolve(getDataDir()), path.resolve(hosts.localDir));

    const health = getHealthPayload();
    assert.equal(health.catalogSeededThisBoot, false);
    assert.equal(health.hydratedThisBoot, true);
    assert.equal(health.possibleOvernightWipe, true);
    assert.equal(health.primaryHasSnapshot, true);
    assert.ok(Array.isArray(health.durablePathStatus));
    assert.ok(health.durablePathStatus.some((item) => item.dir === hosts.rootDir && item.snapshotCustom));

    fs.chmodSync(hosts.rootDir, 0o755);
  });

  it("factory snapshot persist cannot overwrite a custom snapshot on $HOME", async () => {
    const hosts = makeHostDirs();
    writeSnapshot(hosts.homeDir, customState("2026-09-14T08:00:00.000Z"));
    initDatabase(undefined, { engine: "json" });
    writeAdminSnapshot({
      savedAt: "2026-09-15T21:45:00.000Z",
      services: DEFAULT_SERVICES,
      settings: DEFAULT_SETTINGS,
    });
    persistAdminState();
    const homeParsed = JSON.parse(
      fs.readFileSync(path.join(hosts.homeDir, "admin-state.json"), "utf8"),
    );
    assert.equal(
      homeParsed.services.find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
    assert.equal(readAdminSnapshot().services.find((s) => s.id === "youtube-premium").nameEn, "YouTube Bahrain Live");
  });

  it("true first boot stays empty unless ALLOW_FACTORY_SEED=1", async () => {
    makeHostDirs();
    initDatabase(undefined, { engine: "json" });
    const first = await seedDatabase();
    assert.equal(first.catalogSeededThisBoot, false);
    assert.equal(listServices().length, 0);
    assert.equal(getHealthPayload().factorySeedDisabled, true);

    closeDatabase();
    initDatabase(undefined, { engine: "json" });
    const allowed = await seedWithFactory(seedDatabase);
    assert.equal(allowed.catalogSeededThisBoot, true);
    assert.equal(listServices().length, DEFAULT_SERVICES.length);
    updateService("youtube-premium", { nameEn: "YouTube Bahrain Live" });

    closeDatabase();
    initDatabase(undefined, { engine: "json" });
    const second = await seedDatabase();
    assert.equal(second.catalogSeededThisBoot, false);
    assert.equal(getLastSeedResult().catalogSeededThisBoot, false);
    assert.equal(
      listServices().find((s) => s.id === "youtube-premium").nameEn,
      "YouTube Bahrain Live",
    );
  });
});
