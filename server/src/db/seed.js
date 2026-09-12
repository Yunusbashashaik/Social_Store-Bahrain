import { DEFAULT_SERVICES } from "../config/defaultServices.js";
import { deleteService, listServices, seedServicesIfEmpty } from "../models/Service.js";
import {
  getSetting,
  migrateWhatsAppNumbers,
  seedSettingsIfEmpty,
  setSetting,
} from "../models/Settings.js";

/** Wipe leftover built-in catalog rows once so only admin-added services remain. */
export function emptyBuiltInCatalogOnce() {
  if (getSetting("builtInCatalogPurged", false) === true) return false;
  for (const service of listServices()) {
    deleteService(service.id);
  }
  setSetting("builtInCatalogPurged", true);
  return true;
}

export function seedDatabase() {
  const settingsSeeded = seedSettingsIfEmpty();
  const whatsappMigrated = migrateWhatsAppNumbers();
  const catalogPurged = emptyBuiltInCatalogOnce();
  const servicesSeeded = seedServicesIfEmpty(DEFAULT_SERVICES);
  return { servicesSeeded, settingsSeeded, whatsappMigrated, catalogPurged };
}
