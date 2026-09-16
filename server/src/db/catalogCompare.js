import { DEFAULT_SERVICES } from "../config/defaultServices.js";
import { DEFAULT_SETTINGS } from "../config/defaults.js";

export function settingsSignature(settings) {
  const value = settings || {};
  return JSON.stringify({
    complaintEmail: value.complaintEmail,
    whatsappNumbers: value.whatsappNumbers,
    aboutEn: value.aboutEn,
    aboutAr: value.aboutAr,
    ownersEn: value.ownersEn,
    ownersAr: value.ownersAr,
    socialLinks: value.socialLinks,
  });
}

export function settingsMatchDefaults(settings) {
  return settingsSignature(settings) === settingsSignature(DEFAULT_SETTINGS);
}

function serviceSignature(service) {
  const month = Number(service.prices?.month);
  const year = Number(service.prices?.year);
  const outOfStock =
    service.outOfStock ||
    (Number.isFinite(month) && month === 0) ||
    (Number.isFinite(year) && year === 0)
      ? 1
      : 0;
  return [
    service.id,
    outOfStock ? 0 : month,
    outOfStock ? 0 : year,
    String(service.nameEn || ""),
    String(service.nameAr || ""),
    String(service.descriptionEn || ""),
    String(service.descriptionAr || ""),
    outOfStock,
    String(service.offerType || "none"),
    String(service.offerExpiresAt || ""),
  ].join("|");
}

export function catalogSignature(services) {
  return (services || [])
    .map(serviceSignature)
    .sort()
    .join("\n");
}

export function catalogMatchesDefaults(services) {
  return catalogSignature(services) === catalogSignature(DEFAULT_SERVICES);
}

export function isCustomAdminState(state) {
  if (!state || typeof state !== "object") return false;
  const services = Array.isArray(state.services) ? state.services : [];
  const settings = state.settings && typeof state.settings === "object" ? state.settings : {};
  if (services.length > 0 && !catalogMatchesDefaults(services)) return true;
  if (Object.keys(settings).length > 0 && !settingsMatchDefaults(settings)) return true;
  return false;
}

/** Any prior catalog (factory snapshot, custom snapshot, or catalogSeeded flag). */
export function snapshotMarksCatalogInitialized(state) {
  if (!state || typeof state !== "object") return false;
  if (state.settings?.catalogSeeded === true) return true;
  if (Array.isArray(state.services) && state.services.length > 0) return true;
  return isCustomAdminState(state);
}

export function snapshotSavedAtMs(state) {
  const ms = Date.parse(state?.savedAt || 0);
  return Number.isFinite(ms) ? ms : 0;
}

export function pickBetterSnapshot(current, candidate) {
  if (!candidate) return current;
  if (!current) return candidate;
  const currentCustom = isCustomAdminState(current);
  const candidateCustom = isCustomAdminState(candidate);
  if (candidateCustom !== currentCustom) {
    return candidateCustom ? candidate : current;
  }
  const currentSaved = snapshotSavedAtMs(current);
  const candidateSaved = snapshotSavedAtMs(candidate);
  if (candidateSaved !== currentSaved) {
    return candidateSaved > currentSaved ? candidate : current;
  }
  const currentCount = Array.isArray(current.services) ? current.services.length : 0;
  const candidateCount = Array.isArray(candidate.services) ? candidate.services.length : 0;
  if (candidateCount !== currentCount) {
    return candidateCount > currentCount ? candidate : current;
  }
  return current;
}

export function rowToAdminService(row) {
  if (!row || typeof row !== "object") return null;
  if (row.nameEn !== undefined || row.prices) {
    return {
      ...row,
      nameEn: String(row.nameEn || row.name_en || ""),
      nameAr: String(row.nameAr || row.name_ar || ""),
      descriptionEn: String(row.descriptionEn || row.description_en || ""),
      descriptionAr: String(row.descriptionAr || row.description_ar || ""),
      prices: {
        month: Number(row.prices?.month ?? row.price_month ?? 0),
        year: Number(row.prices?.year ?? row.price_year ?? 0),
      },
      outOfStock: Boolean(row.outOfStock ?? row.out_of_stock),
      offerType: row.offerType || row.offer_type || "none",
      offerExpiresAt: row.offerExpiresAt || row.offer_expires_at || null,
      imageUrl: row.imageUrl ?? row.image_url ?? null,
      sortOrder: row.sortOrder ?? row.sort_order,
    };
  }
  return {
    id: row.id,
    icon: row.icon || "",
    accent: row.accent || "#38bdf8",
    typeEn: row.type_en || row.typeEn || "Shared / Private",
    typeAr: row.type_ar || row.typeAr || "مشترك / خاص",
    nameEn: String(row.name_en || ""),
    nameAr: String(row.name_ar || ""),
    descriptionEn: String(row.description_en || ""),
    descriptionAr: String(row.description_ar || ""),
    prices: {
      month: Number(row.price_month ?? 0),
      year: Number(row.price_year ?? 0),
    },
    imageUrl: row.image_url || null,
    outOfStock: Boolean(row.out_of_stock),
    offerType: row.offer_type || "none",
    offerExpiresAt: row.offer_expires_at || null,
    sortOrder: row.sort_order,
  };
}

export function normalizeSnapshotServices(services) {
  return (Array.isArray(services) ? services : []).map(rowToAdminService).filter(Boolean);
}

export function normalizeSnapshotSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return {};
  const out = {};
  for (const [key, value] of Object.entries(settings)) {
    if (value === undefined) continue;
    if (typeof value === "string") {
      try {
        out[key] = JSON.parse(value);
      } catch {
        out[key] = value;
      }
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function stateLooksDefaultOrEmpty(services, settings) {
  const list = Array.isArray(services) ? services : [];
  if (list.length === 0) return true;
  const settingsObj = settings && typeof settings === "object" ? settings : {};
  return catalogMatchesDefaults(list) && settingsMatchDefaults(settingsObj);
}
