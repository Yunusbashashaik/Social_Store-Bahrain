import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import fs from "fs";
import os from "os";
import path from "path";
import {
  closeDatabase,
  getDbEngine,
  initDatabase,
  migrateLegacyDataDir,
} from "../src/db/connection.js";
import { seedDatabase } from "../src/db/seed.js";
import { listServices, updateService } from "../src/models/Service.js";
import { getAllSettings, updateSettings } from "../src/models/Settings.js";

describe("admin catalog persistence", () => {
  const dirs = [];

  after(() => {
    closeDatabase();
    for (const dir of dirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps edited prices and settings after close, reopen, and seed", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-persist-"));
    dirs.push(dir);
    const jsonPath = path.join(dir, "globalstore.json");
    initDatabase(path.join(dir, "unused.db"), { engine: "json", jsonPath });
    seedDatabase();

    const first = listServices()[0];
    updateService(first.id, { prices: { month: 7.77, year: 77.7 } });
    updateSettings({
      complaintEmail: "persist@example.com",
      aboutEn: "Kept about text",
    });

    closeDatabase();
    initDatabase(path.join(dir, "unused.db"), { engine: "json", jsonPath });
    seedDatabase();

    assert.equal(getDbEngine(), "json");
    const again = listServices().find((s) => s.id === first.id);
    assert.equal(again.prices.month, 7.77);
    assert.equal(again.prices.year, 77.7);
    const settings = getAllSettings();
    assert.equal(settings.complaintEmail, "persist@example.com");
    assert.equal(settings.aboutEn, "Kept about text");
    assert.ok(fs.existsSync(`${jsonPath}.bak`));
  });

  it("copies legacy server/data into the persistent folder once", () => {
    const fromDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-legacy-"));
    const toDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-dest-"));
    dirs.push(fromDir, toDir);
    fs.writeFileSync(path.join(fromDir, "globalstore.json"), "{}\n");
    const copied = migrateLegacyDataDir(fromDir, toDir);
    assert.equal(copied, true);
    assert.ok(fs.existsSync(path.join(toDir, "globalstore.json")));
    const second = migrateLegacyDataDir(fromDir, toDir);
    assert.equal(second, false);
  });
});
