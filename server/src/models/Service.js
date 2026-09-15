import { persistAdminState } from "../db/persist.js";
import { getDb } from "../db/connection.js";
import {
  isExpiredOffer,
  normalizeOfferType,
  OFFER_TYPES,
  parseOfferExpiry,
} from "../../../shared/offers.js";

function rowToService(row) {
  if (!row) return null;
  const outOfStock = Boolean(row.out_of_stock);
  const month = outOfStock ? 0 : Number(row.price_month);
  const year = outOfStock ? 0 : Number(row.price_year);
  const offerType = normalizeOfferType(row.offer_type);
  return {
    id: row.id,
    icon: row.icon || "",
    accent: row.accent || "#38bdf8",
    typeEn: row.type_en,
    typeAr: row.type_ar,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    prices: { month, year },
    imageUrl: row.image_url || null,
    outOfStock,
    offerType,
    offerExpiresAt: offerType === OFFER_TYPES.NONE ? null : row.offer_expires_at || null,
    sortOrder: row.sort_order,
  };
}

function deriveOutOfStock(prices, explicit) {
  if (typeof explicit === "boolean") return explicit;
  const month = Number(prices?.month);
  const year = Number(prices?.year);
  return (
    (Number.isFinite(month) && month === 0) ||
    (Number.isFinite(year) && year === 0)
  );
}

function sanitizePrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Invalid price");
  }
  return Math.round(n * 1000) / 1000;
}

export function normalizeOfferFields(data, current = null) {
  const offered =
    data.offerType !== undefined || data.offerExpiresAt !== undefined;
  if (!offered && current) {
    return {
      offerType: normalizeOfferType(current.offerType),
      offerExpiresAt: current.offerExpiresAt || null,
    };
  }
  const offerType = normalizeOfferType(
    data.offerType !== undefined ? data.offerType : current?.offerType,
  );
  if (offerType === OFFER_TYPES.NONE) {
    return { offerType: OFFER_TYPES.NONE, offerExpiresAt: null };
  }
  const rawExpiry =
    data.offerExpiresAt !== undefined ? data.offerExpiresAt : current?.offerExpiresAt;
  const offerExpiresAt = parseOfferExpiry(rawExpiry);
  if (!offerExpiresAt) {
    throw new Error("Offer expiry date and time is required");
  }
  return { offerType, offerExpiresAt };
}

export function listServices() {
  const rows = getDb()
    .prepare("SELECT * FROM services ORDER BY sort_order ASC, name_en ASC")
    .all();
  return rows.map(rowToService);
}

export function listPublicServices(now = Date.now()) {
  return listServices().filter((service) => !isExpiredOffer(service, now));
}

export function getServiceById(id) {
  const row = getDb().prepare("SELECT * FROM services WHERE id = ?").get(id);
  return rowToService(row);
}

export function countServices() {
  return getDb().prepare("SELECT COUNT(*) AS n FROM services").get().n;
}

function maybePersist(options = {}) {
  if (options.persist === false) return;
  persistAdminState();
}

export function insertService(data, options = {}) {
  const db = getDb();
  const minOrder = db
    .prepare("SELECT COALESCE(MIN(sort_order), 0) AS m FROM services")
    .get().m;
  const sortOrder =
    data.sortOrder ?? (countServices() === 0 ? 0 : minOrder - 1);

  const outOfStock = deriveOutOfStock(data.prices, data.outOfStock);
  const month = outOfStock ? 0 : sanitizePrice(data.prices?.month ?? 0);
  const year = outOfStock ? 0 : sanitizePrice(data.prices?.year ?? 0);
  const offer = normalizeOfferFields(data);

  db.prepare(
    `INSERT INTO services (
      id, icon, accent, type_en, type_ar, name_en, name_ar,
      description_en, description_ar, price_month, price_year,
      image_url, out_of_stock, offer_type, offer_expires_at, sort_order, updated_at
    ) VALUES (
      @id, @icon, @accent, @typeEn, @typeAr, @nameEn, @nameAr,
      @descriptionEn, @descriptionAr, @priceMonth, @priceYear,
      @imageUrl, @outOfStock, @offerType, @offerExpiresAt, @sortOrder, datetime('now')
    )`,
  ).run({
    id: data.id,
    icon: data.icon || "✨",
    accent: data.accent || "#38bdf8",
    typeEn: data.typeEn || "Shared / Private",
    typeAr: data.typeAr || "مشترك / خاص",
    nameEn: data.nameEn,
    nameAr: data.nameAr || data.nameEn,
    descriptionEn: data.descriptionEn || "",
    descriptionAr: data.descriptionAr || "",
    priceMonth: month,
    priceYear: year,
    imageUrl: data.imageUrl || null,
    outOfStock: outOfStock ? 1 : 0,
    offerType: offer.offerType,
    offerExpiresAt: offer.offerExpiresAt,
    sortOrder,
  });

  maybePersist(options);
  return getServiceById(data.id);
}

export function updateService(id, patch, options = {}) {
  const current = getServiceById(id);
  if (!current) return null;

  const nextPrices = {
    month:
      patch.prices?.month !== undefined
        ? sanitizePrice(patch.prices.month)
        : current.prices.month,
    year:
      patch.prices?.year !== undefined
        ? sanitizePrice(patch.prices.year)
        : current.prices.year,
  };

  const outOfStock = deriveOutOfStock(
    nextPrices,
    typeof patch.outOfStock === "boolean" ? patch.outOfStock : undefined,
  );
  const offer = normalizeOfferFields(patch, current);

  const next = {
    nameEn: typeof patch.nameEn === "string" ? patch.nameEn : current.nameEn,
    nameAr: typeof patch.nameAr === "string" ? patch.nameAr : current.nameAr,
    descriptionEn:
      typeof patch.descriptionEn === "string"
        ? patch.descriptionEn
        : current.descriptionEn,
    descriptionAr:
      typeof patch.descriptionAr === "string"
        ? patch.descriptionAr
        : current.descriptionAr,
    icon: typeof patch.icon === "string" ? patch.icon : current.icon,
    accent: typeof patch.accent === "string" ? patch.accent : current.accent,
    typeEn: typeof patch.typeEn === "string" ? patch.typeEn : current.typeEn,
    typeAr: typeof patch.typeAr === "string" ? patch.typeAr : current.typeAr,
    imageUrl:
      patch.imageUrl !== undefined ? patch.imageUrl : current.imageUrl,
    priceMonth: outOfStock ? 0 : nextPrices.month,
    priceYear: outOfStock ? 0 : nextPrices.year,
    outOfStock: outOfStock ? 1 : 0,
    offerType: offer.offerType,
    offerExpiresAt: offer.offerExpiresAt,
    sortOrder:
      typeof patch.sortOrder === "number" ? patch.sortOrder : current.sortOrder,
  };

  getDb()
    .prepare(
      `UPDATE services SET
        name_en = @nameEn,
        name_ar = @nameAr,
        description_en = @descriptionEn,
        description_ar = @descriptionAr,
        icon = @icon,
        accent = @accent,
        type_en = @typeEn,
        type_ar = @typeAr,
        image_url = @imageUrl,
        price_month = @priceMonth,
        price_year = @priceYear,
        out_of_stock = @outOfStock,
        offer_type = @offerType,
        offer_expires_at = @offerExpiresAt,
        sort_order = @sortOrder,
        updated_at = datetime('now')
      WHERE id = @id`,
    )
    .run({ ...next, id });

  maybePersist(options);
  return getServiceById(id);
}

export function deleteService(id, options = {}) {
  const existing = getServiceById(id);
  if (!existing) return false;
  getDb().prepare("DELETE FROM services WHERE id = ?").run(id);
  maybePersist(options);
  return true;
}

export function replaceAllServices(services, options = {}) {
  const db = getDb();
  const apply = db.transaction((rows) => {
    db.prepare("DELETE FROM services").run();
    rows.forEach((service, index) => {
      insertService(
        {
          ...service,
          sortOrder: service.sortOrder ?? index,
        },
        { persist: false },
      );
    });
  });
  apply(Array.isArray(services) ? services : []);
  maybePersist(options);
  return listServices();
}
