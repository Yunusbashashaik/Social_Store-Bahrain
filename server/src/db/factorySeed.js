/** Factory catalog from `shared/defaultServices.js`. Production must never insert it. */
export function isFactorySeedAllowed() {
  return String(process.env.ALLOW_FACTORY_SEED || "").trim() === "1";
}
