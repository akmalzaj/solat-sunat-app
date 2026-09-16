import assert from "node:assert/strict";
import test from "node:test";
import robots from "../app/robots.ts";
import sitemap from "../app/sitemap.ts";
import { guides } from "../content/registry.ts";
import { SITE_URL } from "../lib/site.ts";

test("SEO: sitemap advertises every static surface and all approved guides with apex URLs", () => {
  // Registry contract the sitemap relies on: every canonical guide is approved,
  // so sitemap inclusion and the corpus stay in lockstep.
  assert.ok(
    guides.every((guide) => guide.reviewStatus === "approved"),
    "Every canonical guide must carry reviewStatus 'approved' for full sitemap inclusion",
  );

  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  // Static surfaces
  for (const path of ["", "/alatan/", "/bantuan/", "/simpanan/", "/tetapan/"]) {
    assert.ok(urls.includes(`${SITE_URL}${path}`), `Expected ${path} in sitemap`);
  }

  // All approved canonical guides carry a lastModified stamp
  for (const guide of guides) {
    const expected = `${SITE_URL}/solat/${guide.slug}/`;
    assert.ok(urls.includes(expected), `Expected ${expected} in sitemap`);
    const entry = entries.find((candidate) => candidate.url === expected);
    assert.ok(entry.lastModified instanceof Date, `Expected lastModified for ${guide.slug}`);
  }

  // Technical sample guide is hidden from discovery (audit commit 4a00b8f) — keep it out
  assert.ok(!urls.includes(`${SITE_URL}/solat/contoh-struktur/`), "Sample guide must not be in sitemap");

  // Internal offline fallback is a service-worker target, not content
  assert.ok(!urls.includes(`${SITE_URL}/~offline/`), "Offline fallback must not be in sitemap");

  // Every URL is apex-canonical (primary domain is solat.wiki, not www)
  assert.ok(urls.every((url) => url.startsWith(SITE_URL)), "All URLs must be under https://solat.wiki");
  assert.ok(urls.every((url) => url === SITE_URL || url.endsWith("/")), "URLs must respect trailingSlash: true");
});

test("SEO: robots.txt allows crawling content, blocks the offline fallback, and points at the apex sitemap", () => {
  const rules = robots();

  assert.equal(rules.sitemap, `${SITE_URL}/sitemap.xml`);
  assert.equal(rules.rules.userAgent, "*");
  assert.equal(rules.rules.allow, "/");
  assert.deepEqual(rules.rules.disallow, ["/~offline/"]);
  // The noindexed sample guide must stay crawlable so crawlers can see its
  // meta robots tag — blocking it in robots.txt would defeat the noindex.
  assert.ok(!rules.rules.disallow.includes("/solat/contoh-struktur/"));
});