import path from "path";
import {
  APP_ROOT,
  getActiveStorePath,
  getDataDir,
  getDbEngine,
  getHostMirrorDirs,
  getHostMirrorsEnabled,
  isInsideAppTree,
  durableDataDirCandidates,
} from "./db/connection.js";
import { catalogMatchesDefaults } from "./db/catalogCompare.js";
import { isFactorySeedAllowed } from "./db/factorySeed.js";
import { getOffHostBackupStatus } from "./db/offHostBackup.js";
import { getPersistStatus } from "./db/persist.js";
import { getLastSeedResult } from "./db/seed.js";
import { countServices, listServices } from "./models/Service.js";
import { getAllSettings, getSetting } from "./models/Settings.js";

function wipeVersusEmpty({
  catalogEmpty,
  matchesDefaults,
  possibleOvernightWipe,
  replicaCustom,
  hydrated,
  offHost,
}) {
  if (offHost?.restored || hydrated?.restored) return "ok";
  if (!catalogEmpty && !matchesDefaults) return "ok";
  if (possibleOvernightWipe || replicaCustom) return "wipe";
  if (catalogEmpty) return "empty";
  return "ok";
}

export function getHealthPayload() {
  const persist = getPersistStatus();
  const seed = getLastSeedResult();
  const offHost = getOffHostBackupStatus();
  const dataDir = getDataDir();
  const storePath = getActiveStorePath();
  const services = listServices();
  const catalogEmpty = services.length === 0;
  const replicaCustom = persist.durablePathStatus.some(
    (item) => !item.isPrimary && item.snapshotCustom,
  );
  const possibleOvernightWipe = Boolean(
    persist.possibleOvernightWipe ||
      (seed.hydrated?.restored &&
        seed.hydrated?.snapshotPath &&
        path.resolve(path.dirname(seed.hydrated.snapshotPath)) !== path.resolve(dataDir)) ||
      seed.offHostHydrated?.restored,
  );
  const factorySeedDisabled = !isFactorySeedAllowed();
  return {
    ok: true,
    service: "global-store-api",
    db: getDbEngine(),
    dataDir,
    storePath,
    databasePath: storePath,
    services: countServices(),
    complaintEmail: getAllSettings().complaintEmail,
    catalogSeededThisBoot: Boolean(seed.catalogSeededThisBoot),
    catalogSeeded: getSetting("catalogSeeded") === true,
    catalogMatchesDefaults: catalogMatchesDefaults(services),
    catalogEmpty,
    skippedFactorySeed: Boolean(seed.skippedFactorySeed),
    skippedFactorySeedReason: seed.skippedFactorySeedReason || null,
    factorySeedAllowed: isFactorySeedAllowed(),
    factorySeedDisabled,
    hydratedThisBoot: Boolean(seed.hydrated?.restored),
    hydrateReason: seed.hydrated?.reason || null,
    offHostBackupConfigured: Boolean(offHost.configured),
    offHostBackupPushConfigured: Boolean(offHost.pushConfigured),
    offHostBackupRestoredThisBoot: Boolean(offHost.restoredThisBoot || seed.offHostHydrated?.restored),
    offHostBackupSavedAt: offHost.savedAt || seed.offHostHydrated?.savedAt || null,
    offHostBackupSource: offHost.source || seed.offHostHydrated?.snapshotPath || null,
    offHostBackupError: offHost.lastError || null,
    dataDirInsideApp: isInsideAppTree(dataDir, APP_ROOT),
    hostMirrorsEnabled: getHostMirrorsEnabled(),
    hostMirrorDirs: getHostMirrorDirs(),
    durableDataDirs: durableDataDirCandidates(),
    snapshotSavedAt: persist.snapshotSavedAt,
    snapshotServices: persist.snapshotServices,
    snapshotCustom: persist.snapshotCustom,
    snapshotMatchesDefaults: persist.snapshotMatchesDefaults,
    snapshotPaths: persist.snapshotPaths,
    snapshotWritePaths: persist.snapshotWritePaths,
    existingSnapshotPaths: persist.existingSnapshotPaths,
    preferredSnapshotPath: persist.preferredSnapshotPath,
    lastPersist: persist.lastPersist,
    durablePathStatus: persist.durablePathStatus,
    primaryHasSnapshot: persist.primaryHasSnapshot,
    replicaCustomAvailable: replicaCustom,
    possibleOvernightWipe,
    wipeVersusEmpty: wipeVersusEmpty({
      catalogEmpty,
      matchesDefaults: catalogMatchesDefaults(services),
      possibleOvernightWipe,
      replicaCustom,
      hydrated: seed.hydrated,
      offHost: seed.offHostHydrated,
    }),
    time: new Date().toISOString(),
  };
}
