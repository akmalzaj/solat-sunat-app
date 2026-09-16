import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { guides, sampleGuide, allGuides } from "../content/registry.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath) {
  const filename = path.join(projectRoot, relativePath);
  assert.ok(existsSync(filename), `Expected ${relativePath} to exist.`);
  return readFileSync(filename, "utf8");
}

/**
 * Phase 5: Release validation contracts.
 *
 * These tests lock the release gate from the implementation plan:
 * - content freeze: all 19 canonical guides approved with reviewer provenance;
 * - no unreviewed guide appears in the published discovery set;
 * - deployment security headers and apex redirect stay configured;
 * - PWA icon assets referenced by metadata exist in the publish directory.
 */

test("content freeze: all 19 canonical guides are approved by a named reviewer with a review date", () => {
  assert.equal(guides.length, 19);
  for (const guide of guides) {
    assert.equal(
      guide.reviewStatus,
      "approved",
      `${guide.slug} must be approved before release (got "${guide.reviewStatus}")`,
    );
    assert.ok(guide.reviewedBy, `${guide.slug} must record reviewedBy`);
    assert.ok(guide.lastReviewedAt, `${guide.slug} must record lastReviewedAt`);
    assert.ok(guide.contentVersion, `${guide.slug} must record contentVersion`);
  }
});

test("content freeze: the technical sample guide is excluded from the canonical discovery set", () => {
  assert.equal(sampleGuide.reviewStatus, "needs-review");
  assert.equal(guides.length, allGuides.length - 1);
  assert.ok(
    !guides.some((guide) => guide.slug === sampleGuide.slug),
    "the needs-review sample guide must never enter the canonical set",
  );
});

test("release deployment: netlify.toml pins the host security headers required by the audit", () => {
  const config = source("netlify.toml");

  const requiredHeaders = [
    "X-Frame-Options = \"DENY\"",
    "X-Content-Type-Options = \"nosniff\"",
    "Referrer-Policy = \"strict-origin-when-cross-origin\"",
    "Permissions-Policy = \"camera=(), microphone=(), geolocation=()\"",
    "Strict-Transport-Security = \"max-age=31536000; includeSubDomains; preload\"",
  ];
  for (const header of requiredHeaders) {
    assert.ok(config.includes(header), `netlify.toml must contain ${header}`);
  }

  // The manifest must be served with its spec media type for strict install prompts.
  assert.ok(config.includes("Content-Type = \"application/manifest+json\""));

  // The default *.netlify.app hostname must 301 to the apex domain so pages
  // are never served from two origins (duplicate-content risk).
  assert.ok(config.includes("https://solatwiki.netlify.app/*"));
  assert.ok(config.includes("https://solat.wiki/:splat"));

  // Build environment must match the Node requirement of the prebuild script.
  assert.ok(config.includes('NODE_VERSION = "22"'));
});

test("release build: the static-export RSC payload adapter runs before the worker precache build", () => {
  // next.js#85374: the router requests flattened dotted RSC payload paths that
  // the export does not emit; the adapter publishes them and must run before
  // the service worker precache so the copies are precached too.
  const adapter = source("scripts/fix-static-export-rsc.mjs");
  assert.match(adapter, /__PAGE__\.txt/);
  const pkg = JSON.parse(source("package.json"));
  const build = pkg.scripts.build;
  const adapterIndex = build.indexOf("scripts/fix-static-export-rsc.mjs");
  const workerIndex = build.indexOf("scripts/build-service-worker.mjs");
  assert.ok(adapterIndex > -1, "build chain must run the RSC payload adapter");
  assert.ok(
    workerIndex > adapterIndex,
    "RSC payload adapter must run before the service worker build",
  );
});

test("release PWA: every icon referenced by app metadata exists in the publish directory", () => {
  const iconFiles = [
    "public/icons/app-icon.svg",
    "public/android-chrome-192x192.png",
    "public/android-chrome-512x512.png",
    "public/apple-touch-icon.png",
    "public/favicon.ico",
    "public/favicon-32x32.png",
    "public/favicon-16x16.png",
  ];
  for (const icon of iconFiles) {
    assert.ok(
      existsSync(path.join(projectRoot, icon)),
      `expected publish asset ${icon} to exist`,
    );
  }

  const manifestSource = source("app/manifest.ts");
  assert.match(manifestSource, /purpose: "maskable"/, "manifest must declare a maskable icon");
  assert.match(manifestSource, /android-chrome-512x512\.png/, "maskable icon must be the 512px PNG");
});