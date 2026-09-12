/** Last catalog/settings the API (or admin) successfully returned. Survives API downtime. */

const SERVICES_KEY = "gs_live_catalog";
const SETTINGS_KEY = "gs_live_settings";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readLiveServices() {
  if (!canUseStorage()) return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SERVICES_KEY) || "null");
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeLiveServices(services) {
  if (!canUseStorage() || !Array.isArray(services)) return;
  try {
    window.localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  } catch {
    /* quota / private mode */
  }
}

export function readLiveSettings() {
  if (!canUseStorage()) return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "null");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeLiveSettings(settings) {
  if (!canUseStorage() || !settings || typeof settings !== "object") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* quota / private mode */
  }
}
