import fs from "fs";
import os from "os";
import path from "path";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "gs-durable-iso-"));
const home = path.join(root, "home");
fs.mkdirSync(home, { recursive: true });
process.env.HOME = home;
process.env.LOCAL_HOST_DATA_DIR = path.join(root, "local-data");
process.env.ROOT_HOST_DATA_DIR = path.join(root, "root-data");
delete process.env.DATA_DIR;
delete process.env.DATABASE_PATH;
delete process.env.JSON_DATABASE_PATH;

export const isolatedDurableRoot = root;
export const isolatedHomeDir = home;
export const isolatedLocalDir = process.env.LOCAL_HOST_DATA_DIR;
export const isolatedRootDir = process.env.ROOT_HOST_DATA_DIR;
