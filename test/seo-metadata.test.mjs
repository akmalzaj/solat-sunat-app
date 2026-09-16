import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import robots from "../app/robots.ts";
import sitemap from "../app/sitemap.ts";
import { guides } from "../content/registry.ts";
import { SITE_URL } from "../lib/site.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("SEO: sitemap advertises every static surface and all approved guides with apex URLs", () => {
  // Registry contract the sitemap relies on: every canonical guide is approved,
  // so sitemap inclusion and the corpus stay in lockstep.
  assert.ok(
    guides.every((guide) => guide.reviewStatus === "approved"),
    "Every canonical guide must carry reviewStatus 'approved' for full sitemap inclusion",
  );

  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  // Static surfaces — "/" keeps the sitemap's home URL byte-identical to the
  // canonical the home page emits (https://solat.wiki/).
  for (const path of ["/", "/alatan/", "/bantuan/", "/simpanan/", "/tetapan/"]) {
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

test("SEO: every indexable page declares a canonical, resolved to the apex by metadataBase", async () => {
  // Canonical lives in tsx page metadata, which plain node can't execute —
  // assert at the source level, the same pattern audit-fixes.test.mjs uses.
  // Relative canonicals are fine: layout.tsx sets metadataBase to SITE_URL,
  // so Next emits absolute apex URLs.
  const readPage = async (...segments) =>
    readFile(path.join(projectRoot, "app", ...segments), "utf8");

  const layoutSource = await readPage("layout.tsx");
  assert.ok(layoutSource.includes("metadataBase: new URL(SITE_URL)"),
    "layout must keep metadataBase so relative canonicals resolve to the apex");
  // The home canonical lives on the page, deliberately not the layout: a
  // layout-level canonical would be inherited by the noindex sample guide.
  assert.ok(!layoutSource.includes("alternates:"),
    "layout must not declare canonical — it would leak onto noindex children");
  const homeSource = await readPage("page.tsx");
  assert.ok(homeSource.includes('alternates: { canonical: "/" }'),
    "home route must declare its own canonical");

  for (const pagePath of ["alatan", "bantuan", "simpanan", "tetapan"]) {
    const source = await readPage(pagePath, "page.tsx");
    assert.ok(source.includes(`alternates: { canonical: "/${pagePath}/" }`),
      `${pagePath} must canonicalize to itself with a trailing slash`);
  }

  // Sitemap membership and canonical must agree: each approved guide points
  // at its own URL, never at the home route.
  const guideSource = await readPage("solat", "[slug]", "page.tsx");
  assert.ok(guideSource.includes("alternates: { canonical: `/solat/${guide.slug}/` }"),
    "guide pages must declare a per-slug canonical with a trailing slash");
  assert.ok(guideSource.includes("canonical: `/solat/${guide.slug}/`"),
    "canonical must follow the sitemap URL shape exactly");
  // The noindex branch returns bare title + robots only — a self-referencing
  // canonical next to noindex would send conflicting indexing signals.
  assert.ok(
    guideSource.includes("return { title: guide.title, robots: { index: false, follow: false } };"),
    "noindex branch must not declare a canonical",
  );
});
