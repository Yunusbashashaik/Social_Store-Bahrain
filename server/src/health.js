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
import { getPersistStatus } from "./db/persist.js";
import { getLastSeedResult } from "./db/seed.js";
import { countServices, listServices } from "./models/Service.js";
import { getAllSettings, getSetting } from "./models/Settings.js";

export function getHealthPayload() {
  const persist = getPersistStatus();
  const seed = getLastSeedResult();
  const dataDir = getDataDir();
  const storePath = getActiveStorePath();
  const services = listServices();
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
    skippedFactorySeed: Boolean(seed.skippedFactorySeed),
    skippedFactorySeedReason: seed.skippedFactorySeedReason || null,
    hydratedThisBoot: Boolean(seed.hydrated?.restored),
    hydrateReason: seed.hydrated?.reason || null,
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
    time: new Date().toISOString(),
  };
}
