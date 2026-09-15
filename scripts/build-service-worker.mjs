import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "out");
const sourcePath = path.join(projectRoot, "app", "sw.ts");
const destinationPath = path.join(outputDirectory, "sw.js");
const placeholder = "self.__STATIC_ASSET_MANIFEST__";
const cacheNamePlaceholder = "__CACHE_NAME__";
const offlineUrl = "/~offline/";

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  }));
  return nested.flat();
}

function toPublicUrl(filename) {
  const relative = path.relative(outputDirectory, filename).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -"index.html".length)}`;
  return `/${relative}`;
}

const source = await readFile(sourcePath, "utf8");
const template = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2022 },
}).outputText;
const assetFiles = (await listFiles(outputDirectory))
  .filter((filename) => path.resolve(filename) !== path.resolve(destinationPath))
  .sort();
const assets = assetFiles.map(toPublicUrl);
const assetDigest = createHash("sha256")
  .update((await Promise.all(assetFiles.map(async (filename) => `${toPublicUrl(filename)}:${await readFile(filename)}`))).join("\n"))
  .digest("hex")
  .slice(0, 12);
const cacheName = `solat-sunat-precache-${assetDigest}`;

if (!assets.includes(offlineUrl)) {
  throw new Error(`Expected ${offlineUrl} in the static export before generating the worker.`);
}

await writeFile(
  destinationPath,
  template.replace(placeholder, JSON.stringify(assets)).replace(cacheNamePlaceholder, cacheName),
  "utf8"
);
process.stdout.write(`The service worker precaches ${assets.length} static URLs.\n`);
