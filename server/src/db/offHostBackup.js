/**
 * Off-host catalog backup so a recycled local disk can auto-restore.
 * Push: GitHub Contents API (CATALOG_BACKUP_TOKEN / GITHUB_TOKEN / GH_TOKEN).
 * Pull: same API, CATALOG_BACKUP_URL (raw JSON), packaged catalog-backup/,
 * or the default public raw GitHub URL (no token).
 */
import fs from "fs";
import path from "path";
import { APP_ROOT } from "./connection.js";
import { catalogMatchesDefaults, isCustomAdminState } from "./catalogCompare.js";

export const DEFAULT_BACKUP_REPO = "Yunusbashashaik/Social_Store-Bahrain";
export const DEFAULT_BACKUP_PATH = "catalog-backup/admin-state.json";
const DEFAULT_BACKUP_FILE = "catalog-backup/admin-state.backup.json";
export const DEFAULT_BACKUP_BRANCH = "main";

let fetchImpl = (...args) => globalThis.fetch(...args);
let customFetch = false;
let lastStatus = {
  configured: false,
  pushConfigured: false,
  restoredThisBoot: false,
  savedAt: null,
  lastPushOk: false,
  lastError: null,
  source: null,
};

let cachedSha = null;
let pushChain = Promise.resolve();

export function setOffHostBackupFetch(fn) {
  if (fn) {
    fetchImpl = fn;
    customFetch = true;
  } else {
    fetchImpl = (...args) => globalThis.fetch(...args);
    customFetch = false;
  }
}

export function resetOffHostBackupStatus() {
  cachedSha = null;
  lastStatus = {
    configured: isOffHostBackupConfigured(),
    pushConfigured: isOffHostPushConfigured(),
    restoredThisBoot: false,
    savedAt: null,
    lastPushOk: false,
    lastError: null,
    source: null,
  };
}

export function getOffHostBackupStatus() {
  return {
    ...lastStatus,
    configured: isOffHostBackupConfigured(),
    pushConfigured: isOffHostPushConfigured(),
  };
}

export function markOffHostRestored(snapshot) {
  lastStatus.restoredThisBoot = true;
  lastStatus.savedAt = snapshot?.savedAt || lastStatus.savedAt;
  lastStatus.source = snapshot?.__path || lastStatus.source;
}

function backupToken() {
  return (
    String(process.env.CATALOG_BACKUP_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim() ||
    null
  );
}

function backupRepo() {
  return String(process.env.CATALOG_BACKUP_REPO || process.env.GITHUB_REPOSITORY || "").trim() || null;
}

function backupPath() {
  return String(process.env.CATALOG_BACKUP_PATH || DEFAULT_BACKUP_PATH).replace(/^\/+/, "");
}

function backupBranch() {
  return String(process.env.CATALOG_BACKUP_BRANCH || DEFAULT_BACKUP_BRANCH).trim() || DEFAULT_BACKUP_BRANCH;
}

function backupUrlEnv() {
  return String(process.env.CATALOG_BACKUP_URL || "").trim() || null;
}

export function getDefaultCatalogBackupUrl(
  repo = DEFAULT_BACKUP_REPO,
  filePath = DEFAULT_BACKUP_PATH,
  branch = DEFAULT_BACKUP_BRANCH,
) {
  const encodedPath = String(filePath || DEFAULT_BACKUP_PATH)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://raw.githubusercontent.com/${repo || DEFAULT_BACKUP_REPO}/${branch || DEFAULT_BACKUP_BRANCH}/${encodedPath}`;
}

function backupFetchUrl() {
  return backupUrlEnv() || getDefaultCatalogBackupUrl();
}

function isTestProcess() {
  if (process.env.NODE_ENV === "test") return true;
  return process.argv.some((arg) => /(^|[\\/])test[\\/]|\.test\.js$/.test(String(arg)));
}

function usingCustomFetch() {
  return customFetch;
}

function shouldFetchDefaultRaw() {
  if (backupUrlEnv()) return false;
  if (process.env.CATALOG_BACKUP_DISABLE === "1") return false;
  if (!isTestProcess() || process.env.CATALOG_BACKUP_ALLOW_NETWORK === "1") return true;
  return usingCustomFetch();
}

function siblingBackupPath(filePath) {
  if (!filePath.endsWith(".json") || filePath.endsWith(".backup.json")) return null;
  return filePath.replace(/\.json$/, ".backup.json");
}

function repoRootCandidates() {
  const roots = [APP_ROOT, process.cwd()];
  try {
    roots.push(path.resolve(process.cwd(), ".."));
  } catch {
    /* ignore */
  }
  const unique = [];
  const seen = new Set();
  for (const root of roots) {
    const resolved = path.resolve(root);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    unique.push(resolved);
  }
  return unique;
}

function listPackagedBackupPaths(filePath = DEFAULT_BACKUP_PATH) {
  if (process.env.CATALOG_BACKUP_SKIP_PACKAGED === "1") return [];
  const relative = [filePath, siblingBackupPath(filePath), DEFAULT_BACKUP_PATH, DEFAULT_BACKUP_FILE].filter(
    Boolean,
  );
  const paths = [];
  const seen = new Set();
  for (const root of repoRootCandidates()) {
    for (const name of relative) {
      const full = path.join(root, name);
      if (seen.has(full)) continue;
      seen.add(full);
      paths.push(full);
    }
  }
  return paths;
}

function hasPackagedBackup() {
  return listPackagedBackupPaths(backupPath()).some((file) => {
    try {
      return fs.existsSync(file);
    } catch {
      return false;
    }
  });
}

function readPackagedSnapshot() {
  for (const filePath of listPackagedBackupPaths(backupPath())) {
    try {
      const snapshot = parseSnapshot(JSON.parse(fs.readFileSync(filePath, "utf8")));
      if (snapshot && Array.isArray(snapshot.services) && snapshot.services.length > 0) {
        snapshot.__path = filePath;
        lastStatus.savedAt = snapshot.savedAt || lastStatus.savedAt;
        lastStatus.source = filePath;
        return snapshot;
      }
    } catch {
      /* missing or unreadable */
    }
  }
  return null;
}

export function isOffHostPushConfigured() {
  return Boolean(backupToken() && backupRepo());
}

export function isOffHostBackupConfigured() {
  return Boolean(backupFetchUrl() || isOffHostPushConfigured() || hasPackagedBackup());
}

function githubContentsUrl() {
  const repo = backupRepo();
  if (!repo) return null;
  const encodedPath = backupPath()
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://api.github.com/repos/${repo}/contents/${encodedPath}`;
}

function authHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "social-store-bahrain-catalog-backup",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = backupToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function stripInternal(state) {
  if (!state || typeof state !== "object") return null;
  const rest = { ...state };
  delete rest.__path;
  return {
    version: rest.version || 1,
    savedAt: rest.savedAt || new Date().toISOString(),
    services: Array.isArray(rest.services) ? rest.services : [],
    settings: rest.settings && typeof rest.settings === "object" ? rest.settings : {},
  };
}

function parseSnapshot(raw) {
  if (!raw) return null;
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  if (!Array.isArray(parsed.services) && !parsed.settings) return null;
  return parsed;
}

async function readGithubSnapshot() {
  const url = githubContentsUrl();
  if (!url || !backupToken()) return null;
  const res = await fetchImpl(`${url}?ref=${encodeURIComponent(backupBranch())}`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!res || res.status === 404) {
    cachedSha = null;
    return null;
  }
  if (!res.ok) {
    const text = typeof res.text === "function" ? await res.text() : "";
    throw new Error(`GitHub backup GET failed (${res.status}) ${text}`.trim());
  }
  const data = await res.json();
  cachedSha = data.sha || null;
  const encoded = String(data.content || "").replace(/\s/g, "");
  if (!encoded) return null;
  const json = Buffer.from(encoded, "base64").toString("utf8");
  const snapshot = parseSnapshot(json);
  if (snapshot) {
    snapshot.__path = `github:${backupRepo()}/${backupPath()}`;
    lastStatus.savedAt = snapshot.savedAt || lastStatus.savedAt;
    lastStatus.source = snapshot.__path;
  }
  return snapshot;
}

async function readUrlSnapshot(url = backupUrlEnv()) {
  if (!url) return null;
  const headers = { Accept: "application/json", "User-Agent": "social-store-bahrain-catalog-backup" };
  const token = backupToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetchImpl(url, { method: "GET", headers });
  if (!res || !res.ok) return null;
  const data = await res.json();
  const snapshot = parseSnapshot(data);
  if (snapshot) {
    snapshot.__path = url;
    lastStatus.savedAt = snapshot.savedAt || lastStatus.savedAt;
    lastStatus.source = url;
  }
  return snapshot;
}

function snapshotUsableForRestore(snapshot) {
  return Array.isArray(snapshot?.services) && snapshot.services.length > 0;
}

export async function fetchOffHostBackup() {
  lastStatus.configured = isOffHostBackupConfigured();
  lastStatus.pushConfigured = isOffHostPushConfigured();
  if (!lastStatus.configured) return null;
  try {
    if (isOffHostPushConfigured()) {
      const fromGithub = await readGithubSnapshot();
      if (snapshotUsableForRestore(fromGithub)) {
        lastStatus.lastError = null;
        return fromGithub;
      }
    }
    if (backupUrlEnv()) {
      const fromUrl = await readUrlSnapshot(backupUrlEnv());
      if (snapshotUsableForRestore(fromUrl)) {
        lastStatus.lastError = null;
        return fromUrl;
      }
    }
    const packaged = readPackagedSnapshot();
    if (snapshotUsableForRestore(packaged)) {
      lastStatus.lastError = null;
      return packaged;
    }
    if (shouldFetchDefaultRaw()) {
      const fromDefault = await readUrlSnapshot(getDefaultCatalogBackupUrl());
      if (snapshotUsableForRestore(fromDefault)) {
        lastStatus.lastError = null;
        return fromDefault;
      }
    }
    lastStatus.lastError = null;
    return null;
  } catch (err) {
    lastStatus.lastError = err?.message || String(err);
    console.error("Off-host catalog backup fetch failed", lastStatus.lastError);
    return null;
  }
}

export async function pushOffHostBackup(state) {
  lastStatus.configured = isOffHostBackupConfigured();
  lastStatus.pushConfigured = isOffHostPushConfigured();
  const payload = stripInternal(state);
  if (!payload) return { ok: false, reason: "no-state" };
  if (!isCustomAdminState(payload)) {
    return { ok: false, reason: "refuse-non-custom" };
  }
  if (!isOffHostPushConfigured()) {
    return { ok: false, reason: "push-not-configured" };
  }
  const url = githubContentsUrl();
  try {
    if (!cachedSha) {
      try {
        await readGithubSnapshot();
      } catch {
        cachedSha = null;
      }
    }
    const existing = cachedSha ? await readGithubSnapshot().catch(() => null) : null;
    if (existing && isCustomAdminState(existing) && catalogMatchesDefaults(payload.services)) {
      return { ok: false, reason: "refuse-factory-over-custom" };
    }
    const body = {
      message: `chore: persist live catalog backup ${payload.savedAt}`,
      content: Buffer.from(`${JSON.stringify(payload, null, 2)}\n`).toString("base64"),
      branch: backupBranch(),
    };
    if (cachedSha) body.sha = cachedSha;
    const res = await fetchImpl(url, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res?.ok) {
      const text = typeof res?.text === "function" ? await res.text() : "";
      throw new Error(`GitHub backup PUT failed (${res?.status}) ${text}`.trim());
    }
    const data = await res.json().catch(() => ({}));
    cachedSha = data.content?.sha || data.sha || cachedSha;
    lastStatus.lastPushOk = true;
    lastStatus.savedAt = payload.savedAt;
    lastStatus.lastError = null;
    lastStatus.source = `github:${backupRepo()}/${backupPath()}`;
    return { ok: true, sha: cachedSha, savedAt: payload.savedAt };
  } catch (err) {
    lastStatus.lastPushOk = false;
    lastStatus.lastError = err?.message || String(err);
    console.error("Off-host catalog backup push failed", lastStatus.lastError);
    return { ok: false, reason: "push-failed", error: lastStatus.lastError };
  }
}

export function queueOffHostBackup(state) {
  if (!state || !isCustomAdminState(state) || !isOffHostPushConfigured()) {
    return pushChain;
  }
  pushChain = pushChain
    .then(() => pushOffHostBackup(state))
    .catch((err) => {
      console.error("Off-host catalog backup queue failed", err?.message || err);
    });
  return pushChain;
}

export function waitForOffHostBackup() {
  return pushChain;
}

/** Restore off-host only onto an empty live catalog. Never overwrite a non-empty one. */
export function shouldHydrateFromOffHost(liveServices) {
  const list = Array.isArray(liveServices) ? liveServices : [];
  return list.length === 0;
}
