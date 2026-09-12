import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import fs from "fs";
import os from "os";
import path from "path";
import {
  closeDatabase,
  getDbEngine,
  getServiceUploadsDir,
  initDatabase,
  migrateLegacyDataDir,
} from "../src/db/connection.js";
import { seedDatabase } from "../src/db/seed.js";
import { insertService, listServices, updateService } from "../src/models/Service.js";
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

    const first = insertService({
      id: "persist-service",
      nameEn: "Persist Service",
      nameAr: "خدمة",
      descriptionEn: "en",
      descriptionAr: "ar",
      prices: { month: 1, year: 8 },
    });
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

  it("copies leftover upload files into a data folder that already exists", () => {
    const fromDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-legacy-up-"));
    const toDir = fs.mkdtempSync(path.join(os.tmpdir(), "gs-dest-up-"));
    dirs.push(fromDir, toDir);
    fs.mkdirSync(path.join(fromDir, "uploads", "services"), { recursive: true });
    fs.mkdirSync(path.join(toDir, "uploads", "services"), { recursive: true });
    fs.writeFileSync(path.join(fromDir, "uploads", "services", "netflix.jpg"), "img");
    fs.writeFileSync(path.join(toDir, "uploads", "keep.txt"), "x");
    migrateLegacyDataDir(fromDir, toDir);
    assert.ok(
      fs.existsSync(path.join(toDir, "uploads", "services", "netflix.jpg")),
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
});
