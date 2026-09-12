import {
  DEFAULT_SERVICES,
} from "@shared/defaultServices.js";
import { DEFAULT_SETTINGS } from "./defaultSettings.js";

let supportNumbers = [...DEFAULT_SETTINGS.whatsappNumbers];
let orderLineIndex = 0;

export function setSupportNumbers(numbers) {
  if (Array.isArray(numbers) && numbers.length) {
    supportNumbers = numbers.map((n) => String(n).replace(/\D/g, "")).filter(Boolean);
    if (!supportNumbers.length) {
      supportNumbers = [...DEFAULT_SETTINGS.whatsappNumbers];
    }
  }
}

export function getSupportNumbers() {
  return supportNumbers;
}

export function nextSupportNumber() {
  const num = supportNumbers[orderLineIndex % supportNumbers.length];
  orderLineIndex += 1;
  return num;
}

export function formatWhatsAppDisplay(num) {
  const digits = String(num || "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function serviceMatchesQuery(service, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return true;
  const fields = [
    service.nameEn,
    service.nameAr,
    service.typeEn,
    service.typeAr,
    service.icon,
  ];
  return fields.some((value) => {
    const text = String(value || "").toLowerCase();
    if (!text) return false;
    if (text.startsWith(needle)) return true;
    const parts = text.split(/[^a-z0-9\u0600-\u06ff+]+/i).filter(Boolean);
    return parts.some(
      (part) =>
        part.startsWith(needle) || (needle.length >= 3 && part.includes(needle)),
    );
  });
}

export function filterServices(services, query) {
  if (!Array.isArray(services)) return [];
  return services.filter((service) => serviceMatchesQuery(service, query));
}

export function buildWhatsAppUrl(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildOrderMessage(service, durationKey, priceBhd, lang) {
  const durationEn = durationKey === "month" ? "1 Month" : "1 Year";
  const durationAr = durationKey === "month" ? "شهر واحد" : "سنة واحدة";
  if (lang === "ar") {
    return `مرحباً فريق دعم Social Store، أود شراء الاشتراك التالي:

الدولة: البحرين
الخدمة: ${service.nameAr}
المدة: ${durationAr}
السعر: ${priceBhd} د.ب

يرجى تزويدي بتفاصيل الدفع وإتمام طلبي.`;
  }
  return `Hello Social Store Support Team, I would like to purchase the following subscription:

Country: Bahrain
Service: ${service.nameEn}
Duration: ${durationEn}
Price: ${priceBhd} BHD

Please provide payment details and complete my order.`;
}

/** Fallback catalog if the API is unavailable. */
export const SERVICES = structuredClone(DEFAULT_SERVICES);

/** Featured names shown in the Subscriptions dropdown (first 3). */
export const FEATURED_SERVICE_IDS = [];

export async function fetchServices() {
  const { fetchPublicServices } = await import("../lib/adminApi.js");
  return fetchPublicServices();
}

export function isOutOfStock(service) {
  if (!service) return false;
  if (service.outOfStock) return true;
  const month = Number(service.prices?.month);
  const year = Number(service.prices?.year);
  return month === 0 || year === 0;
}
