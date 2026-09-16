import { createRequire } from "module";
import fs from "fs";
import path from "path";
import {
  ADMIN_SNAPSHOT_NAME,
  flushActiveStore,
  getActiveStorePath,
  getDataDir,
  getHostMirrorDirs,
  getHostMirrorsEnabled,
  LEGACY_APP_DATA_DIR,
} from "./connection.js";
import {
  catalogMatchesDefaults,
  catalogSignature,
  isCustomAdminState,
  normalizeSnapshotServices,
  normalizeSnapshotSettings,
  pickBetterSnapshot,
  settingsMatchDefaults,
  settingsSignature,
  snapshotMarksCatalogInitialized,
  stateLooksDefaultOrEmpty,
} from "./catalogCompare.js";

export {
  catalogMatchesDefaults,
  isCustomAdminState,
  pickBetterSnapshot,
  settingsMatchDefaults,
  snapshotMarksCatalogInitialized,
};

const require = createRequire(import.meta.url);

let source = null;
let persistDisabled = 0;
let lastPersistResult = {
  wrote: false,
  skippedOverwrite: false,
  reason: "not-run",
  savedAt: null,
};

export function bindPersist(nextSource) {
  source = nextSource;
}

export function withoutPersist(fn) {
  persistDisabled += 1;
  try {
    return fn();
  } finally {
    persistDisabled -= 1;
  }
}

export function getLastPersistResult() {
  return lastPersistResult;
}

export function getSnapshotWritePaths() {
  const dirs = new Set();
  const storePath = getActiveStorePath();
  if (storePath) dirs.add(path.dirname(path.resolve(storePath)));
  dirs.add(path.resolve(getDataDir()));
  if (process.env.DATA_DIR) dirs.add(path.resolve(process.env.DATA_DIR));
  if (getHostMirrorsEnabled()) {
    for (const dir of getHostMirrorDirs()) dirs.add(dir);
  }
  return [...dirs].map((dir) => path.join(dir, ADMIN_SNAPSHOT_NAME));
}

export function getSnapshotPaths() {
  const paths = new Set(getSnapshotWritePaths());
  paths.add(path.join(path.resolve(LEGACY_APP_DATA_DIR), ADMIN_SNAPSHOT_NAME));
  paths.add(path.join(path.resolve(getDataDir()), ADMIN_SNAPSHOT_NAME));
  if (getHostMirrorsEnabled()) {
    for (const dir of getHostMirrorDirs()) {
      paths.add(path.join(dir, ADMIN_SNAPSHOT_NAME));
    }
  }
  return [...paths];
}

export function getBackupStoreDirs() {
  const dirs = new Set();
  for (const filePath of getSnapshotPaths()) dirs.add(path.dirname(filePath));
  if (getHostMirrorsEnabled()) {
    for (const dir of getHostMirrorDirs()) dirs.add(dir);
  }
  dirs.add(path.resolve(getDataDir()));
  return [...dirs];
}

function atomicWrite(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  const fd = fs.openSync(tmp, "w");
  try {
    fs.writeSync(fd, data);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, filePath);
  try {
    const dirFd = fs.openSync(path.dirname(filePath), "r");
    try {
      fs.fsyncSync(dirFd);
    } finally {
      fs.closeSync(dirFd);
    }
  } catch {
    /* some hosts cannot fsync directories */
  }
}

function tryReadSnapshot(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    parsed.services = normalizeSnapshotServices(parsed.services);
    if (parsed.settings && typeof parsed.settings === "object") {
      parsed.settings = normalizeSnapshotSettings(parsed.settings);
    }
    parsed.__path = filePath;
    return parsed;
  } catch {
    return null;
  }
}

function snapshotFromJsonStore(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    const services = normalizeSnapshotServices(parsed.services);
    const settings = normalizeSnapshotSettings(parsed.settings);
    if (!services.length && !Object.keys(settings).length) return null;
    return {
      version: 1,
      savedAt: parsed.savedAt || fs.statSync(filePath).mtime.toISOString(),
      services,
      settings,
      __path: filePath,
    };
  } catch {
    return null;
  }
}

function snapshotFromSqliteStore(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const Database = require("better-sqlite3");
    const sqlite = new Database(filePath, { readonly: true, fileMustExist: true });
    const rows = sqlite.prepare("SELECT * FROM services").all();
    const settingRows = sqlite.prepare("SELECT key, value FROM settings").all();
    sqlite.close();
    const settings = {};
    for (const row of settingRows) {
      settings[row.key] = row.value;
    }
    const services = normalizeSnapshotServices(rows);
    if (!services.length && !Object.keys(settings).length) return null;
    return {
      version: 1,
      savedAt: fs.statSync(filePath).mtime.toISOString(),
      services,
      settings: normalizeSnapshotSettings(settings),
      __path: filePath,
    };
  } catch {
    return null;
  }
}

function collectBackupSnapshots() {
  const found = [];
  const seen = new Set();
  for (const filePath of getSnapshotPaths()) {
    const parsed = tryReadSnapshot(filePath);
    if (!parsed) continue;
    seen.add(path.resolve(filePath));
    found.push(parsed);
  }
  for (const dir of getBackupStoreDirs()) {
    const jsonPath = path.join(dir, "globalstore.json");
    const dbPath = path.join(dir, "globalstore.db");
    if (!seen.has(path.resolve(jsonPath))) {
      const fromJson = snapshotFromJsonStore(jsonPath);
      if (fromJson) {
        seen.add(path.resolve(jsonPath));
        found.push(fromJson);
      }
    }
    if (!seen.has(path.resolve(dbPath))) {
      const fromDb = snapshotFromSqliteStore(dbPath);
      if (fromDb) {
        seen.add(path.resolve(dbPath));
        found.push(fromDb);
      }
    }
  }
  return found;
}

function dirHasStoreArtifact(dir) {
  if (!dir || !fs.existsSync(dir)) return false;
  return ["admin-state.json", "globalstore.json", "globalstore.db"].some((name) =>
    fs.existsSync(path.join(dir, name)),
  );
}

function pathWritable(dir) {
  try {
    if (!fs.existsSync(dir)) return false;
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function inspectDurablePaths() {
  const primary = path.resolve(getDataDir());
  const dirs = new Set([primary, ...getBackupStoreDirs()]);
  return [...dirs].map((dir) => {
    const snapshotPath = path.join(dir, ADMIN_SNAPSHOT_NAME);
    const snapshot = tryReadSnapshot(snapshotPath) ||
      snapshotFromJsonStore(path.join(dir, "globalstore.json")) ||
      snapshotFromSqliteStore(path.join(dir, "globalstore.db"));
    return {
      dir,
      isPrimary: dir === primary,
      exists: fs.existsSync(dir),
      writable: pathWritable(dir),
      hasSnapshot: Boolean(tryReadSnapshot(snapshotPath)),
      hasStoreArtifact: dirHasStoreArtifact(dir),
      snapshotPath,
      snapshotSavedAt: snapshot?.savedAt || null,
      snapshotServices: Array.isArray(snapshot?.services) ? snapshot.services.length : 0,
      snapshotCustom: isCustomAdminState(snapshot),
      sourcePath: snapshot?.__path || null,
    };
  });
}

function persistableSettings(settings = {}) {
  const next = settings && typeof settings === "object" ? { ...settings } : {};
  const liveSeeded = source?.getSetting?.("catalogSeeded") === true;
  next.catalogSeeded = next.catalogSeeded === true || liveSeeded;
  return next;
}

function incomingWouldClobber(existing, payload) {
  if (!existing) return false;
  const incomingServices = Array.isArray(payload.services) ? payload.services : [];
  const existingServices = Array.isArray(existing.services) ? existing.services : [];
  const incomingEmptyOrDefault = stateLooksDefaultOrEmpty(incomingServices, payload.settings);
  if (isCustomAdminState(existing) && incomingEmptyOrDefault) return true;
  if (incomingServices.length === 0 && existingServices.length > 0) return true;
  return false;
}

export function writeAdminSnapshot(state) {
  if (!state) return null;
  const payload = {
    version: 1,
    savedAt: state.savedAt || new Date().toISOString(),
    services: Array.isArray(state.services) ? state.services : [],
    settings: persistableSettings(state.settings),
  };
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  let wrote = 0;
  let skipped = 0;
  const wrotePaths = [];
  for (const filePath of getSnapshotWritePaths()) {
    const existing = tryReadSnapshot(filePath);
    if (incomingWouldClobber(existing, payload)) {
      skipped += 1;
      continue;
    }
    try {
      atomicWrite(filePath, body);
      wrote += 1;
      wrotePaths.push(filePath);
    } catch (err) {
      console.error("Failed to write admin snapshot", filePath, err?.message || err);
    }
  }
  if (!wrote) {
    lastPersistResult = {
      wrote: false,
      skippedOverwrite: skipped > 0,
      reason: skipped > 0 ? "preserve-custom-snapshot" : "write-failed",
      savedAt: payload.savedAt,
    };
    if (!skipped) {
      console.error("Admin snapshot was not written to any durable path");
    }
    return skipped > 0 ? readAdminSnapshot() : null;
  }
  lastPersistResult = {
    wrote: true,
    skippedOverwrite: skipped > 0,
    reason: skipped > 0 ? "written-with-preserved-custom" : "written",
    savedAt: payload.savedAt,
    wrotePaths,
  };
  return payload;
}

export function persistAdminState() {
  if (persistDisabled || !source) return null;
  try {
    flushActiveStore();
    const next = {
      services: source.listServices(),
      settings: persistableSettings(source.getAllSettings()),
    };
    const existing = readAdminSnapshot();
    const nextEmptyOrDefault = stateLooksDefaultOrEmpty(next.services, next.settings);
    const existingHasCatalog =
      snapshotMarksCatalogInitialized(existing) || isCustomAdminState(existing);
    if (nextEmptyOrDefault && existingHasCatalog && isCustomAdminState(existing)) {
      lastPersistResult = {
        wrote: false,
        skippedOverwrite: true,
        reason: "preserve-custom-snapshot",
        savedAt: existing.savedAt || null,
      };
      return writeAdminSnapshot(existing);
    }
    if ((next.services || []).length === 0 && existingHasCatalog) {
      lastPersistResult = {
        wrote: false,
        skippedOverwrite: true,
        reason: "preserve-existing-snapshot",
        savedAt: existing.savedAt || null,
      };
      return existing;
    }
    return writeAdminSnapshot(next);
  } catch (err) {
    console.error("Failed to persist admin state", err?.message || err);
    lastPersistResult = {
      wrote: false,
      skippedOverwrite: false,
      reason: "persist-error",
      savedAt: null,
    };
    return null;
  }
}

export function readAdminSnapshot() {
  let best = null;
  for (const parsed of collectBackupSnapshots()) {
    best = pickBetterSnapshot(best, parsed);
  }
  return best;
}

export function hasAnyAdminSnapshot() {
  return collectBackupSnapshots().some((snapshot) => snapshotMarksCatalogInitialized(snapshot));
}

export function hydratePersistedAdminState() {
  if (!source) return { restored: false, reason: "unbound" };
  const snapshot = readAdminSnapshot();
  if (!snapshot) return { restored: false, reason: "no-snapshot" };

  const currentSettings = source.getAllSettings();
  const snapSettings =
    snapshot.settings && typeof snapshot.settings === "object" ? snapshot.settings : null;
    const snapServices = normalizeSnapshotServices(
      Array.isArray(snapshot.services) ? snapshot.services : [],
    );

  let restoredServices = false;
  let restoredSettings = false;

  withoutPersist(() => {
    const currentServices = source.listServices();
    const emptyCatalog = currentServices.length === 0;
    const currentCatalogCustom =
      currentServices.length > 0 && !catalogMatchesDefaults(currentServices);
    const snapshotDiffers =
      catalogSignature(currentServices) !== catalogSignature(snapServices);
    if (snapServices.length > 0 && snapshotDiffers && (emptyCatalog || !currentCatalogCustom)) {
      source.replaceAllServices(snapServices);
      restoredServices = true;
    }

    if (snapSettings) {
      const emptySettings = source.countSettings() === 0;
      const currentIsDefaultSettings = settingsMatchDefaults(currentSettings);
      const snapshotDiffersSettings =
        settingsSignature(currentSettings) !== settingsSignature(snapSettings);
      if (emptySettings || (currentIsDefaultSettings && snapshotDiffersSettings)) {
        source.replaceAllSettings(snapSettings);
        restoredSettings = true;
      }
    }
  });

  if (restoredServices || restoredSettings) {
    console.log(
      `Restored admin data from snapshot (services=${restoredServices}, settings=${restoredSettings}).`,
    );
    persistAdminState();
  }

  return {
    restored: restoredServices || restoredSettings,
    restoredServices,
    restoredSettings,
    savedAt: snapshot.savedAt || null,
    snapshotPath: snapshot.__path || null,
    snapshotCustom: isCustomAdminState(snapshot),
    reason: restoredServices || restoredSettings ? "restored" : "snapshot-not-applied",
  };
}

export function getPersistStatus() {
  const snapshot = readAdminSnapshot();
  const durablePathStatus = inspectDurablePaths();
  const primary = durablePathStatus.find((item) => item.isPrimary);
  const otherCustom = durablePathStatus.some((item) => !item.isPrimary && item.snapshotCustom);
  const existingSnapshotPaths = getSnapshotPaths().filter((filePath) => fs.existsSync(filePath));
  return {
    snapshotSavedAt: snapshot?.savedAt || null,
    snapshotServices: Array.isArray(snapshot?.services) ? snapshot.services.length : 0,
    snapshotPaths: getSnapshotPaths(),
    snapshotWritePaths: getSnapshotWritePaths(),
    existingSnapshotPaths,
    snapshotCustom: isCustomAdminState(snapshot),
    snapshotMatchesDefaults: snapshot
      ? catalogMatchesDefaults(snapshot.services || [])
      : null,
    preferredSnapshotPath: snapshot?.__path || null,
    lastPersist: lastPersistResult,
    durablePathStatus,
    primaryHasSnapshot: Boolean(primary?.hasSnapshot),
    possibleOvernightWipe: Boolean(primary && !primary.hasSnapshot && otherCustom),
  };
}
