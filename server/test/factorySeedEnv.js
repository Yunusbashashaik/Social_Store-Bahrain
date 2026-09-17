export async function seedWithFactory(seedDatabase) {
  const previous = process.env.ALLOW_FACTORY_SEED;
  process.env.ALLOW_FACTORY_SEED = "1";
  try {
    return await seedDatabase();
  } finally {
    if (previous === undefined) delete process.env.ALLOW_FACTORY_SEED;
    else process.env.ALLOW_FACTORY_SEED = previous;
  }
}

export function isolateOffHostBackup() {
  process.env.CATALOG_BACKUP_SKIP_PACKAGED = "1";
}

export function restoreOffHostBackupEnv() {
  delete process.env.CATALOG_BACKUP_SKIP_PACKAGED;
}
