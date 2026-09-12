/** Admin-uploaded artwork is served from /api/uploads. Only the hero wallpaper is bundled. */

const assetBase = import.meta.env.BASE_URL || "/";

export function serviceImageUrl(_serviceId) {
  return null;
}

export function wallpaperUrl() {
  return `${assetBase}images/Social_Store_bg.JPG`;
}
