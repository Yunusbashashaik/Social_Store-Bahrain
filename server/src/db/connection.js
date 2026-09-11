import { createRequire } from "module";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { JsonDatabase } from "./jsonDb.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_DATA_DIR = path.join(__dirname, "..", "..", "data");

export let DATA_DIR = LEGACY_DATA_DIR;
export let UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export let SERVICE_UPLOADS_DIR = path.join(UPLOADS_DIR, "services");

const SCHEMA_SQL = `
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      icon TEXT NOT NULL DEFAULT '',
      accent TEXT NOT NULL DEFAULT '#38bdf8',
      type_en TEXT NOT NULL DEFAULT 'Shared / Private',
      type_ar TEXT NOT NULL DEFAULT 'مشترك / خاص',
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description_en TEXT NOT NULL DEFAULT '',
      description_ar TEXT NOT NULL DEFAULT '',
      price_month REAL NOT NULL DEFAULT 0,
      price_year REAL NOT NULL DEFAULT 0,
      image_url TEXT,
      out_of_stock INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      subject TEXT NOT NULL,
      details TEXT NOT NULL,
      screenshot_path TEXT,
      original_filename TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
`;

let db;
let activeDbPath;
let dbEngine = "none";

function setDataDir(dir) {
  DATA_DIR = dir;
  UPLOADS_DIR = path.join(DATA_DIR, "uploads");
  SERVICE_UPLOADS_DIR = path.join(UPLOADS_DIR, "services");
}

function copyIfMissing(from, to) {
  if (!fs.existsSync(from) || fs.existsSync(to)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDirIfMissing(from, to) {
  if (!fs.existsSync(from)) return;
  const destHasFiles =
    fs.existsSync(to) && fs.readdirSync(to, { withFileTypes: true }).length > 0;
  if (destHasFiles) return;
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: false });
}

/** Keep live catalog outside the git/app folder so deploys cannot wipe admin edits. */
export function resolveProductionDataDir() {
  if (process.env.DATA_DIR) return path.resolve(process.env.DATA_DIR);
  if (process.env.DATABASE_PATH) {
    return path.dirname(path.resolve(process.env.DATABASE_PATH));
  }
  const home = os.homedir();
  if (home && home !== "/") {
    return path.join(home, "social-store-bahrain-data");
  }
  return LEGACY_DATA_DIR;
}

export function migrateLegacyDataDir(fromDir, toDir) {
  if (!fromDir || !toDir || path.resolve(fromDir) === path.resolve(toDir)) return false;
  if (!fs.existsSync(fromDir)) return false;
  fs.mkdirSync(toDir, { recursive: true });
  let copied = false;
  for (const name of [
    "globalstore.db",
    "globalstore.db-wal",
    "globalstore.db-shm",
    "globalstore.json",
    "globalstore.json.bak",
  ]) {
    const src = path.join(fromDir, name);
    const dest = path.join(toDir, name);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      copyIfMissing(src, dest);
      copied = true;
    }
  }
  copyDirIfMissing(path.join(fromDir, "uploads"), path.join(toDir, "uploads"));
  return copied;
}

export function getDbPath() {
  return process.env.DATABASE_PATH || path.join(DATA_DIR, "globalstore.db");
}

export function getDbEngine() {
  return dbEngine;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

function openSqlite(dbPath) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = FULL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(SCHEMA_SQL);
  return sqlite;
}

export function initDatabase(dbPath, options = {}) {
  if (dbPath || options.jsonPath) {
    setDataDir(path.dirname(path.resolve(options.jsonPath || dbPath)));
  } else {
    setDataDir(resolveProductionDataDir());
    migrateLegacyDataDir(LEGACY_DATA_DIR, DATA_DIR);
    dbPath = getDbPath();
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(SERVICE_UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (db) {
    try {
      db.close();
    } catch {
      /* ignore */
    }
    db = undefined;
  }

  const engine = options.engine || process.env.DATABASE_ENGINE;
  const forceJson = engine === "json";
  if (!forceJson) {
    try {
      db = openSqlite(dbPath);
      dbEngine = "sqlite";
      activeDbPath = dbPath;
      return db;
    } catch (err) {
      console.error(
        "SQLite native module failed; using JSON file store instead.",
        err?.message || err,
      );
    }
  }

  const jsonPath =
    options.jsonPath ||
    process.env.JSON_DATABASE_PATH ||
    path.join(DATA_DIR, "globalstore.json");
  db = new JsonDatabase(jsonPath);
  dbEngine = "json";
  activeDbPath = jsonPath;
  return db;
}

export function closeDatabase() {
  if (db) {
    try {
      db.close();
    } catch {
      /* ignore */
    }
    db = undefined;
  }
  activeDbPath = undefined;
  dbEngine = "none";
}

export { activeDbPath, LEGACY_DATA_DIR };
