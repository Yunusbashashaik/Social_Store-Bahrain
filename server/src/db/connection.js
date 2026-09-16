import { createRequire } from "module";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { isCustomAdminState, snapshotSavedAtMs } from "./catalogCompare.js";
import { JsonDatabase } from "./jsonDb.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Git checkout root (folder that contains `server/` and `app.js`). */
export const APP_ROOT = path.join(__dirname, "..", "..", "..");
const LEGACY_DATA_DIR = path.join(__dirname, "..", "..", "data");
export const LEGACY_APP_DATA_DIR = LEGACY_DATA_DIR;
export const DEFAULT_DURABLE_DIRNAME = "social-store-bahrain-data";
export const ROOT_HOST_DATA_DIR = `/root/${DEFAULT_DURABLE_DIRNAME}`;
export const LOCAL_HOST_DATA_DIR = `/local/${DEFAULT_DURABLE_DIRNAME}`;
export const ADMIN_SNAPSHOT_NAME = "admin-state.json";

export let DATA_DIR = LEGACY_DATA_DIR;
export let UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export let SERVICE_UPLOADS_DIR = path.join(UPLOADS_DIR, "services");

const STORE_NAMES = [
  "globalstore.db",
  "globalstore.json",
  "admin-state.json",
  "globalstore.db-wal",
];

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
      offer_type TEXT NOT NULL DEFAULT 'none',
      offer_expires_at TEXT,
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
let lastMigration = { migrated: false, reason: "not-run" };
let hostMirrorsEnabled = false;

export function getLocalHostDataDir() {
  return path.resolve(process.env.LOCAL_HOST_DATA_DIR || LOCAL_HOST_DATA_DIR);
}

export function getRootHostDataDir() {
  return path.resolve(process.env.ROOT_HOST_DATA_DIR || ROOT_HOST_DATA_DIR);
}

export function getHomeHostDataDir(homeDir = process.env.HOME || os.homedir()) {
  return path.join(path.resolve(homeDir), DEFAULT_DURABLE_DIRNAME);
}

export function getHostMirrorDirs(homeDir = process.env.HOME || os.homedir()) {
  const dirs = [
    getLocalHostDataDir(),
    getRootHostDataDir(),
    getHomeHostDataDir(homeDir),
  ];
  if (process.env.DATA_DIR) dirs.push(path.resolve(process.env.DATA_DIR));
  const unique = [];
  const seen = new Set();
  for (const dir of dirs) {
    const resolved = path.resolve(dir);
    if (seen.has(resolved) || isInsideAppTree(resolved)) continue;
    seen.add(resolved);
    unique.push(resolved);
  }
  return unique;
}

export function getHostMirrorsEnabled() {
  return hostMirrorsEnabled;
}

export function setHostMirrorsEnabled(enabled) {
  hostMirrorsEnabled = Boolean(enabled);
}

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
  if (destHasFiles) {
    mergeMissingFiles(from, to);
    return;
  }
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: false });
}

function removeJsonBackupFiles(dir) {
  if (!dir || !fs.existsSync(dir)) return;
  for (const name of ["globalstore.json.bak", "globalstore.json.tmp"]) {
    const target = path.join(dir, name);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
  }
}

function mergeMissingFiles(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      mergeMissingFiles(src, dest);
    } else if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  }
}

export function getDataDir() {
  return DATA_DIR;
}

export function getUploadsDir() {
  return UPLOADS_DIR;
}

export function getLastMigration() {
  return lastMigration;
}

export function isInsideAppTree(dir, appRoot = APP_ROOT) {
  const resolved = path.resolve(dir);
  const root = path.resolve(appRoot);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`);
}

export function defaultDurableDataDir(
  appRoot = APP_ROOT,
  homeDir = process.env.HOME || os.homedir(),
) {
  const parent = path.resolve(appRoot, "..");
  const fsRoot = path.parse(path.resolve(appRoot)).root;
  if (parent !== fsRoot && parent !== path.sep) {
    return path.join(parent, DEFAULT_DURABLE_DIRNAME);
  }
  const homeCandidate = path.join(path.resolve(homeDir), DEFAULT_DURABLE_DIRNAME);
  if (!isInsideAppTree(homeCandidate, appRoot)) {
    return homeCandidate;
  }
  return getLocalHostDataDir();
}

export function durableDataDirCandidates(appRoot = APP_ROOT, homeDir = process.env.HOME || os.homedir()) {
  const parent = path.resolve(appRoot, "..");
  const fsRoot = path.parse(path.resolve(appRoot)).root;
  const list = [
    getLocalHostDataDir(),
    getRootHostDataDir(),
    getHomeHostDataDir(homeDir),
    "/var/lib/social-store-bahrain-data",
    "/opt/social-store-bahrain-data",
    "/data/social-store-bahrain-data",
    "/mnt/social-store-bahrain-data",
  ];
  if (parent !== fsRoot && parent !== path.sep) {
    list.unshift(path.join(parent, DEFAULT_DURABLE_DIRNAME));
  }
  const unique = [];
  const seen = new Set();
  for (const item of list) {
    const resolved = path.resolve(item);
    if (seen.has(resolved)) continue;
    if (isInsideAppTree(resolved, appRoot)) continue;
    seen.add(resolved);
    unique.push(resolved);
  }
  return unique;
}

function canWriteDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    const probe = path.join(dir, `.write-probe-${process.pid}`);
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

function storeArtifactsPresent(dir) {
  if (!dir || !fs.existsSync(dir)) return false;
  return STORE_NAMES.some((name) => fs.existsSync(path.join(dir, name)));
}

function readDirSnapshotMeta(dir) {
  try {
    const parsed = JSON.parse(
      fs.readFileSync(path.join(dir, ADMIN_SNAPSHOT_NAME), "utf8"),
    );
    return {
      custom: isCustomAdminState(parsed),
      savedAt: snapshotSavedAtMs(parsed),
      count: Array.isArray(parsed.services) ? parsed.services.length : 0,
    };
  } catch {
    return { custom: false, savedAt: 0, count: 0 };
  }
}

function pickBestExistingWritableDir(candidates) {
  const ranked = [];
  for (const dir of candidates) {
    if (!storeArtifactsPresent(dir)) continue;
    if (!canWriteDir(dir)) continue;
    ranked.push({ dir, meta: readDirSnapshotMeta(dir) });
  }
  if (!ranked.length) return null;
  ranked.sort((a, b) => {
    const customDelta = Number(b.meta.custom) - Number(a.meta.custom);
    if (customDelta) return customDelta;
    if (b.meta.savedAt !== a.meta.savedAt) return b.meta.savedAt - a.meta.savedAt;
    return b.meta.count - a.meta.count;
  });
  return ranked[0].dir;
}

export function getServiceUploadsDir() {
  return SERVICE_UPLOADS_DIR;
}

/** Keep live catalog outside the git/app folder so deploys cannot wipe admin edits. */
export function resolveProductionDataDir(options = {}) {
  if (options.dataDir) return path.resolve(options.dataDir);
  if (options.dbPath) return path.dirname(path.resolve(options.dbPath));
  if (options.jsonPath) return path.dirname(path.resolve(options.jsonPath));

  const forcedEnv = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : process.env.DATABASE_PATH
      ? path.dirname(path.resolve(process.env.DATABASE_PATH))
      : process.env.JSON_DATABASE_PATH
        ? path.dirname(path.resolve(process.env.JSON_DATABASE_PATH))
        : null;

  const candidates = durableDataDirCandidates();
  if (forcedEnv) {
    const resolvedForced = path.resolve(forcedEnv);
    if (!candidates.includes(resolvedForced)) candidates.unshift(resolvedForced);
  }

  const bestExisting = pickBestExistingWritableDir(candidates);
  if (bestExisting) return bestExisting;
  if (forcedEnv && canWriteDir(forcedEnv)) return forcedEnv;
  for (const dir of candidates) {
    if (canWriteDir(dir)) return dir;
  }
  const preferred = defaultDurableDataDir();
  if (canWriteDir(preferred)) return preferred;
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
  ]) {
    const src = path.join(fromDir, name);
    const dest = path.join(toDir, name);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      copyIfMissing(src, dest);
      copied = true;
    }
  }
  copyDirIfMissing(path.join(fromDir, "uploads"), path.join(toDir, "uploads"));
  copyIfMissing(path.join(fromDir, "admin-state.json"), path.join(toDir, "admin-state.json"));
  removeJsonBackupFiles(fromDir);
  removeJsonBackupFiles(toDir);
  if (copied) {
    lastMigration = { migrated: true, reason: "copied-legacy", from: fromDir, to: toDir };
  } else if (lastMigration.reason === "not-run") {
    lastMigration = { migrated: false, reason: copied ? "copied-legacy" : "no-copy" };
  }
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

function migrateSqlite(sqlite) {
  const cols = sqlite
    .prepare("PRAGMA table_info(services)")
    .all()
    .map((col) => col.name);
  if (!cols.includes("offer_type")) {
    sqlite.exec("ALTER TABLE services ADD COLUMN offer_type TEXT NOT NULL DEFAULT 'none'");
  }
  if (!cols.includes("offer_expires_at")) {
    sqlite.exec("ALTER TABLE services ADD COLUMN offer_expires_at TEXT");
  }
}

function openSqlite(dbPath) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = FULL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(SCHEMA_SQL);
  migrateSqlite(sqlite);
  return sqlite;
}

export function getActiveStorePath() {
  return activeDbPath || getDbPath();
}

export function flushActiveStore() {
  if (!db) return;
  if (dbEngine === "sqlite") {
    try {
      db.pragma("wal_checkpoint(TRUNCATE)");
    } catch {
      /* ignore */
    }
  } else if (typeof db.save === "function") {
    db.save();
  }
}

/**
 * Production boot (app.js → index.js):
 * 1. initDatabase() with no explicit path
 * 2. resolveProductionDataDir prefers an existing custom catalog on
 *    /local, /root, $HOME (and DATA_DIR) over a wiped empty primary
 * 3. migrateLegacyDataDir copies missing files only (never overwrites)
 * 4. seed.js bindPersist (module load) then seedDatabase:
 *    hydratePersistedAdminState from every durable admin-state.json / store
 *    THEN factory-seed only on true first boot
 * 5. persistAdminState mirrors admin-state.json to /local, /root, $HOME
 */
export function initDatabase(dbPath, options = {}) {
  const explicitStore = Boolean(dbPath || options.jsonPath || options.dataDir);
  setHostMirrorsEnabled(options.hostMirrors ?? !explicitStore);
  if (explicitStore) {
    setDataDir(
      path.dirname(path.resolve(options.jsonPath || dbPath || options.dataDir)),
    );
    if (options.dataDir) setDataDir(path.resolve(options.dataDir));
    lastMigration = { migrated: false, reason: "explicit-store" };
  } else {
    setDataDir(resolveProductionDataDir(options));
    migrateLegacyDataDir(LEGACY_DATA_DIR, DATA_DIR);
  }

  if (!dbPath) dbPath = getDbPath();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(SERVICE_UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  removeJsonBackupFiles(DATA_DIR);

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
      flushActiveStore();
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
