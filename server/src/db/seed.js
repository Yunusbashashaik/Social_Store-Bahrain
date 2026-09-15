import { DEFAULT_SERVICES } from "../config/defaultServices.js";
import {
  bindPersist,
  hydratePersistedAdminState,
  persistAdminState,
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
  countSettings,
  countServices,
  replaceAllServices,
  replaceAllSettings,
});

let lastSeedResult = {
  servicesSeeded: false,
  settingsSeeded: false,
  catalogSeededThisBoot: false,
  hydrated: { restored: false },
};

export function getLastSeedResult() {
  return lastSeedResult;
}

function seedDefaultCatalogIfEmpty() {
  if (countServices() > 0) {
    setSetting("catalogSeeded", true);
    return false;
  }

  if (getSetting("catalogSeeded") === true) {
    return false;
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
  return true;
}

export function seedDatabase() {
  const settingsSeeded = withoutPersist(() => seedSettingsIfEmpty());
  const hydrated = hydratePersistedAdminState();
  const servicesSeeded = seedDefaultCatalogIfEmpty();
  const whatsappMigrated = withoutPersist(() => migrateWhatsAppNumbers());
  persistAdminState();

  lastSeedResult = {
    servicesSeeded,
    settingsSeeded,
    catalogSeededThisBoot: servicesSeeded,
    hydrated,
    whatsappMigrated,
  };
  return lastSeedResult;
}
