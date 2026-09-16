// Build adapter for next.js#85374 (Next.js 16 static export):
// the client router prefetches RSC payloads from flattened dotted paths
// (/route/__next.<segments>.__PAGE__.txt) while `next build` emits them as
// nested directories (/route/__next/<segments>/__PAGE__.txt). Without these
// copies every client-side navigation prefetch 404s on a static host.
// See https://github.com/vercel/next.js/issues/85374
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outputDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "out",
);

// Collect __PAGE__.txt files inside a payload directory as segment lists,
// e.g. ["$d$slug", "__PAGE__.txt"] for __next.solat/$d$slug/__PAGE__.txt.
async function collectPagePayloads(directory, prefix, found) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectPagePayloads(entryPath, [...prefix, entry.name], found);
    } else if (entry.name === "__PAGE__.txt") {
      found.push([...prefix, entry.name]);
    }
  }
}

async function flattenRoutePayloads(routeDirectory) {
  const entries = await readdir(routeDirectory, { withFileTypes: true });
  let written = 0;
  for (const entry of entries) {
    // A payload directory sits next to the route's index.html and its name
    // starts with __next. (e.g. __next.solat); everything inside it belongs
    // at the flattened dotted name in this route directory.
    if (!entry.isDirectory() || !entry.name.startsWith("__next.")) continue;
    const payloadDirectory = path.join(routeDirectory, entry.name);
    const payloads = [];
    await collectPagePayloads(payloadDirectory, [], payloads);
    for (const segments of payloads) {
      const source = path.join(payloadDirectory, ...segments);
      const flattenedName = [entry.name, ...segments].join(".");
      await writeFile(path.join(routeDirectory, flattenedName), await readFile(source));
      written += 1;
    }
  }
  return written;
}

async function walkRouteDirectories(directory) {
  let written = 0;
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "_next") continue; // static assets, not route payloads
    const entryPath = path.join(directory, entry.name);
    written += await flattenRoutePayloads(entryPath);
    written += await walkRouteDirectories(entryPath);
  }
  return written;
}

const total = await walkRouteDirectories(outputDirectory);
process.stdout.write(`Published ${total} flattened RSC page payloads.\n`);