import { DEFAULT_SERVICES } from "../config/defaultServices.js";
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
});

let lastSeedResult = {
  servicesSeeded: false,
  settingsSeeded: false,
  catalogSeededThisBoot: false,
  skippedFactorySeed: false,
  skippedFactorySeedReason: null,
  hydrated: { restored: false },
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

export function seedDatabase() {
  const settingsSeeded = withoutPersist(() => {
    if (hasAnyAdminSnapshot() || getSetting("catalogSeeded") === true) return false;
    return seedSettingsIfEmpty();
  });
  const hydrated = hydratePersistedAdminState();
  const seedAttempt = seedDefaultCatalogIfEmpty();
  const whatsappMigrated = withoutPersist(() => migrateWhatsAppNumbers());
  persistAdminState();

  lastSeedResult = {
    servicesSeeded: seedAttempt.seeded,
    settingsSeeded,
    catalogSeededThisBoot: seedAttempt.seeded,
    skippedFactorySeed: seedAttempt.skipped,
    skippedFactorySeedReason: seedAttempt.reason,
    hydrated,
    whatsappMigrated,
  };
  return lastSeedResult;
}
