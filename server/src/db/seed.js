import { DEFAULT_SERVICES } from "../config/defaultServices.js";
import { syncHardcodedServices } from "../models/Service.js";
import {
  migrateWhatsAppNumbers,
  seedSettingsIfEmpty,
} from "../models/Settings.js";

export function seedDatabase() {
  const settingsSeeded = seedSettingsIfEmpty();
  const whatsappMigrated = migrateWhatsAppNumbers();
  const servicesSeeded = syncHardcodedServices(DEFAULT_SERVICES);
  return { servicesSeeded, settingsSeeded, whatsappMigrated };
}
