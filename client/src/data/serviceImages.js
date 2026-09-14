import { DEFAULT_SERVICES } from "@shared/defaultServices.js";

const assetBase = import.meta.env.BASE_URL || "/";

const FILE_BY_ID = Object.fromEntries(
  DEFAULT_SERVICES.filter((service) => service.imageFile).map((service) => [
    service.id,
    service.imageFile,
  ]),
);

export function serviceImageUrl(serviceId) {
  const file = FILE_BY_ID[serviceId];
  if (!file) return null;
  return `${assetBase}images/${file}`;
}

export function wallpaperUrl() {
  return `${assetBase}images/Social_Store_bg.JPG`;
}
