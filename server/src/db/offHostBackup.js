/**
 * Off-host catalog backup so a recycled local disk can auto-restore.
 * Push: GitHub Contents API (CATALOG_BACKUP_TOKEN / GITHUB_TOKEN / GH_TOKEN).
 * Pull: same API, or CATALOG_BACKUP_URL (raw JSON).
 */
import { catalogMatchesDefaults, isCustomAdminState } from "./catalogCompare.js";

const DEFAULT_BACKUP_PATH = "catalog-backup/admin-state.json";

let fetchImpl = (...args) => globalThis.fetch(...args);
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
  fetchImpl = fn || ((...args) => globalThis.fetch(...args));
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
  return String(process.env.CATALOG_BACKUP_BRANCH || "main").trim() || "main";
}

function backupFetchUrl() {
  return String(process.env.CATALOG_BACKUP_URL || "").trim() || null;
}

export function isOffHostPushConfigured() {
  return Boolean(backupToken() && backupRepo());
}

export function isOffHostBackupConfigured() {
  return Boolean(backupFetchUrl() || isOffHostPushConfigured());
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

async function readUrlSnapshot() {
  const url = backupFetchUrl();
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

export async function fetchOffHostBackup() {
  lastStatus.configured = isOffHostBackupConfigured();
  lastStatus.pushConfigured = isOffHostPushConfigured();
  if (!lastStatus.configured) return null;
  try {
    const fromGithub = isOffHostPushConfigured() ? await readGithubSnapshot() : null;
    const fromUrl = await readUrlSnapshot();
    const snapshots = [fromGithub, fromUrl].filter(Boolean);
    let best = null;
    for (const item of snapshots) {
      if (!best) {
        best = item;
        continue;
      }
      if (isCustomAdminState(item) && !isCustomAdminState(best)) {
        best = item;
        continue;
      }
      const a = Date.parse(item.savedAt || 0) || 0;
      const b = Date.parse(best.savedAt || 0) || 0;
      if (a > b) best = item;
    }
    if (best?.savedAt) lastStatus.savedAt = best.savedAt;
    lastStatus.lastError = null;
    return best;
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

export function shouldHydrateFromOffHost(liveServices) {
  const list = Array.isArray(liveServices) ? liveServices : [];
  return list.length === 0 || catalogMatchesDefaults(list);
}
