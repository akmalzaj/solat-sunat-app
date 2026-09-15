import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath) {
  const filename = path.join(projectRoot, relativePath);
  assert.ok(existsSync(filename), `Expected ${relativePath} to exist.`);
  return readFileSync(filename, "utf8");
}

test("Phase 1 uses a static Next.js export and generates a deployable precache worker", () => {
  assert.match(source("next.config.ts"), /output:\s*["']export["']/);
  assert.match(source("package.json"), /"build": "next build && node scripts\/build-service-worker\.mjs"/);
  assert.match(source("scripts/build-service-worker.mjs"), /path\.join\(outputDirectory, "sw\.js"\)/);
  assert.match(source("app/sw.ts"), /__STATIC_ASSET_MANIFEST__/);
});

test("Phase 1 exposes an installable Malay manifest and offline fallback", () => {
  const manifest = source("app/manifest.ts");
  assert.match(manifest, /Panduan Solat Sunat/);
  assert.match(manifest, /display:\s*["']standalone["']/);
  assert.match(source("app/~offline/page.tsx"), /luar talian/i);
});

test("the sample guide is statically generated and clearly editorially unapproved", () => {
  const guide = source("app/solat/[slug]/page.tsx");
  assert.match(guide, /generateStaticParams/);
  assert.match(guide, /notFound/);
  assert.match(source("content/registry.ts"), /needs-review/);
});
