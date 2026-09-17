import { DEFAULT_SERVICES } from "../config/defaultServices.js";
import { isCustomAdminState } from "./catalogCompare.js";
import { isFactorySeedAllowed } from "./factorySeed.js";
import {
  fetchOffHostBackup,
  markOffHostRestored,
  shouldHydrateFromOffHost,
  waitForOffHostBackup,
} from "./offHostBackup.js";
import {
  bindPersist,
  hasAnyAdminSnapshot,
  hydratePersistedAdminState,
  persistAdminState,
  readAdminSnapshot,
  snapshotMarksCatalogInitialized,
  withoutPersist,
} from "./persist.js";
import {
  countServices,
  insertService,
  listServices,
  replaceAllServices,
} from "../models/Service.js";
import {
  countSettings,
  getAllSettings,
  getSetting,
  migrateWhatsAppNumbers,
  replaceAllSettings,
  seedSettingsIfEmpty,
  setSetting,
} from "../models/Settings.js";

bindPersist({
  listServices,
  getAllSettings,
  getSetting,
  countSettings,
  countServices,
  replaceAllServices,
  replaceAllSettings,
  setSetting,
});

let lastSeedResult = {
  servicesSeeded: false,
  settingsSeeded: false,
  catalogSeededThisBoot: false,
  skippedFactorySeed: false,
  skippedFactorySeedReason: null,
  hydrated: { restored: false },
  offHostHydrated: { restored: false },
};

export function getLastSeedResult() {
  return lastSeedResult;
}

function catalogAlreadyInitialized() {
  if (getSetting("catalogSeeded") === true) {
    return { initialized: true, reason: "catalog-seeded-flag" };
  }
  const snapshot = readAdminSnapshot();
  if (snapshotMarksCatalogInitialized(snapshot)) {
    return { initialized: true, reason: "existing-snapshot" };
  }
  if (hasAnyAdminSnapshot()) {
    return { initialized: true, reason: "existing-snapshot" };
  }
  return { initialized: false, reason: null };
}

function seedDefaultCatalogIfEmpty() {
  if (countServices() > 0) {
    setSetting("catalogSeeded", true);
    return { seeded: false, skipped: false, reason: null };
  }

  const prior = catalogAlreadyInitialized();
  if (prior.initialized) {
    return { seeded: false, skipped: true, reason: prior.reason };
  }

  if (!isFactorySeedAllowed()) {
    return { seeded: false, skipped: true, reason: "factory-seed-disabled" };
  }

  withoutPersist(() => {
    DEFAULT_SERVICES.forEach((service, index) => {
      const imageUrl =
        service.imageUrl ||
        (service.imageFile ? `/images/${service.imageFile}` : null);
      insertService(
        {
          ...service,
          imageUrl,
          sortOrder: service.sortOrder ?? index,
        },
        { persist: false },
      );
    });
  });
  setSetting("catalogSeeded", true);
  return { seeded: true, skipped: false, reason: null };
}

function applySnapshot(snapshot) {
  if (!snapshot) return { restored: false, reason: "no-snapshot" };
  const snapServices = Array.isArray(snapshot.services) ? snapshot.services : [];
  const snapSettings =
    snapshot.settings && typeof snapshot.settings === "object" ? snapshot.settings : null;

  let restoredServices = false;
  let restoredSettings = false;

  withoutPersist(() => {
    if (snapServices.length > 0) {
      replaceAllServices(snapServices);
      restoredServices = true;
      setSetting("catalogSeeded", true);
    }
    if (snapSettings && Object.keys(snapSettings).length) {
      replaceAllSettings(snapSettings);
      restoredSettings = true;
    }
  });

  if (restoredServices || restoredSettings) persistAdminState();

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

async function hydrateOffHostIfNeeded() {
  if (!shouldHydrateFromOffHost(listServices())) {
    return { restored: false, reason: "live-custom" };
  }
  const remote = await fetchOffHostBackup();
  if (!remote) return { restored: false, reason: "no-off-host-backup" };
  if (!Array.isArray(remote.services) || remote.services.length === 0) {
    return { restored: false, reason: "off-host-empty" };
  }
  const result = applySnapshot(remote);
  if (result.restored) {
    markOffHostRestored(remote);
    result.reason = "off-host-restored";
  }
  return result;
}

export async function seedDatabase() {
  const settingsSeeded = withoutPersist(() => {
    if (hasAnyAdminSnapshot() || getSetting("catalogSeeded") === true) return false;
    return seedSettingsIfEmpty();
  });
  const hydrated = hydratePersistedAdminState();
  const offHostHydrated = await hydrateOffHostIfNeeded();
  const seedAttempt = seedDefaultCatalogIfEmpty();
  const whatsappMigrated = withoutPersist(() => migrateWhatsAppNumbers());
  persistAdminState();
  await waitForOffHostBackup();

  lastSeedResult = {
    servicesSeeded: seedAttempt.seeded,
    settingsSeeded,
    catalogSeededThisBoot: seedAttempt.seeded,
    skippedFactorySeed: seedAttempt.skipped,
    skippedFactorySeedReason: seedAttempt.reason,
    hydrated,
    offHostHydrated,
    whatsappMigrated,
    factorySeedAllowed: isFactorySeedAllowed(),
  };
  return lastSeedResult;
}
