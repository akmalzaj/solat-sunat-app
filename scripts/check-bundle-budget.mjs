// Release budget gate (Phase 5): every published route must load at most
// INITIAL_JS_BUDGET_BYTES of JavaScript (gzipped), matching the app-page
// budget in the implementation plan's performance criteria. Runs after the
// export so it measures the real published HTML, and fails the build when a
// route crosses the line.
import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INITIAL_JS_BUDGET_BYTES = 300 * 1024;

const outputDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "out",
);

async function exists(filename) {
  try {
    await readFile(filename);
    return true;
  } catch {
    return false;
  }
}

// Collect every published route's index.html, including the "/" root.
async function findRouteHtmlFiles(directory) {
  const found = [];
  const routeHtml = path.join(directory, "index.html");
  if (await exists(routeHtml)) found.push(routeHtml);
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "_next") continue; // static assets, not routes
    found.push(...(await findRouteHtmlFiles(path.join(directory, entry.name))));
  }
  return found;
}

async function measureRoute(htmlPath) {
  const html = await readFile(htmlPath, "utf8");
  const srcs = [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]);
  let gzipped = 0;
  for (const src of srcs) {
    const chunk = await readFile(path.join(outputDirectory, src.slice(1)));
    gzipped += gzipSync(chunk).length;
  }
  const rel = path.relative(outputDirectory, htmlPath);
  const route = rel === "index.html" ? "/" : path.dirname(rel);
  return { route, gzipped, scripts: srcs.length };
}

const htmlFiles = await findRouteHtmlFiles(outputDirectory);
if (htmlFiles.length === 0) {
  console.error("Bundle budget: no route HTML found under out/ — did `next build` run?");
  process.exit(1);
}

const results = [];
let failed = false;
for (const htmlPath of htmlFiles) {
  const result = await measureRoute(htmlPath);
  results.push(result);
  const over = result.gzipped > INITIAL_JS_BUDGET_BYTES;
  if (over) failed = true;
  console.log(
    `${over ? "OVER" : "ok  "} ${result.route.padEnd(30)} ` +
      `${(result.gzipped / 1024).toFixed(1)} KB gzipped JS ` +
      `(${result.scripts} scripts, budget ${(INITIAL_JS_BUDGET_BYTES / 1024).toFixed(0)} KB)`,
  );
}

if (failed) {
  console.error("Bundle budget exceeded on at least one route.");
  process.exit(1);
}
console.log(`Bundle budget passed for ${results.length} routes.`);