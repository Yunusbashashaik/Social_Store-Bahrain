import { DEFAULT_SERVICES } from "../config/defaultServices.js";
import { seedServicesIfEmpty } from "../models/Service.js";
import { migrateWhatsAppNumbers, seedSettingsIfEmpty } from "../models/Settings.js";

export function seedDatabase() {
  const servicesSeeded = seedServicesIfEmpty(DEFAULT_SERVICES);
  const settingsSeeded = seedSettingsIfEmpty();
  const whatsappMigrated = migrateWhatsAppNumbers();
  return { servicesSeeded, settingsSeeded, whatsappMigrated };
}
