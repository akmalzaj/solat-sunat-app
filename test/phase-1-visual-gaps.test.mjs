import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ENTRY = "app/globals.css";

// The partial order the entry must declare. Same-specificity overrides in the
// cascade depend on this order — it is the core invariant of the split, so a
// reorder anywhere must fail the structural test below.
const EXPECTED_PARTIAL_ORDER = [
  "app/styles/tokens.css",
  "app/styles/base.css",
  "app/styles/navigation.css",
  "app/styles/hero.css",
  "app/styles/catalog.css",
  "app/styles/reader-core.css",
  "app/styles/tools.css",
  "app/styles/discovery-actions.css",
  "app/styles/reader-ui.css",
  "app/styles/khusyuk.css",
  "app/styles/settings.css",
];

function source(relativePath) {
  const filename = path.join(projectRoot, relativePath);
  assert.ok(existsSync(filename), `Expected ${relativePath} to exist.`);
  return readFileSync(filename, "utf8");
}

// The styles partials in the order the entry file actually imports them.
function partialImports(entry) {
  return [...entry.matchAll(/@import "\.\/styles\/([\w-]+\.css)";/g)].map(
    (match) => `app/styles/${match[1]}`
  );
}

function allStyles() {
  const entry = source(ENTRY);
  // Read in the entry's own import order, so the concatenated source mirrors
  // the emitted stylesheet by construction.
  return [entry, ...partialImports(entry).map(source)].join("\n");
}

test("Structure: globals.css is an ordered import entry for the style partials", () => {
  const entry = source(ENTRY);
  // The entry may carry a leading explanatory comment; imports follow it.
  const importsOnly = entry.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  // Tailwind first, then every partial in dependency order, and nothing else.
  assert.match(importsOnly, /^@import "tailwindcss";/);
  assert.deepEqual(partialImports(entry), EXPECTED_PARTIAL_ORDER);
  const ruleCount = importsOnly.replace(/@import[^;]+;/g, "").trim();
  assert.equal(ruleCount, "", "globals.css must contain only comments and imports.");
});

test("Gap 1: Arabic fonts are self-hosted and configured with line-height 2.0-2.2", () => {
  // Font files must exist locally
  assert.ok(existsSync(path.join(projectRoot, "public/fonts/amiri-arabic-400-normal.woff2")));
  assert.ok(existsSync(path.join(projectRoot, "public/fonts/amiri-arabic-700-normal.woff2")));

  const css = allStyles();
  // Font-face declaration
  assert.match(css, /@font-face\s*\{[^}]*font-family:\s*["']Amiri["']/);
  assert.match(css, /url\(["']?\/fonts\/amiri-arabic-400-normal\.woff2["']?\)/);
  // Dignified Latin system font stack
  assert.match(css, /font-family:[^;]*-apple-system,\s*BlinkMacSystemFont,\s*["']Segoe UI["']/);
  // Arabic line-height between 2.0 and 2.2
  assert.match(css, /\.arabic\s*\{[^}]*line-height:\s*(2|2\.0|2\.1|2\.2)\b/);
});

test("Gap 2: Navigation architecture provides accessible desktop header and mobile bottom navigation bar with >=44px targets", () => {
  const header = source("components/site-header.tsx");
  assert.match(header, /aria-label=["']Navigasi utama["']/);
  assert.match(header, /Simpanan/);
  assert.match(header, /Alatan/);
  assert.match(header, /Tetapan/);

  // Bottom navigation component must exist
  const bottomNav = source("components/bottom-nav.tsx");
  assert.match(bottomNav, /aria-label=["']Navigasi mudah alih["']/);
  assert.match(bottomNav, /Utama/);
  assert.match(bottomNav, /Simpanan/);
  assert.match(bottomNav, /Alatan/);
  assert.match(bottomNav, /Tetapan/);

  // Layout includes BottomNav and suppressHydrationWarning for browser extensions (ap-style)
  const layout = source("app/layout.tsx");
  assert.match(layout, /BottomNav/);
  assert.match(layout, /<html[^>]*suppressHydrationWarning/);
  assert.match(layout, /<body[^>]*suppressHydrationWarning/);

  // CSS guarantees touch target minimum 44px
  const css = allStyles();
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /min-width:\s*44px/);
});

test("Gap 3: Mobile hero headline scales appropriately and discovery elements exist", () => {
  const css = allStyles();
  // H1 scales clamp(1.75rem, 5vw, 2.5rem)
  assert.match(css, /clamp\(1\.75rem,\s*5vw,\s*2\.5rem\)/);

  const home = source("app/page.tsx");
  // Quick search input and category chips exist
  assert.match(home, /Cari/);
  assert.match(home, /Semua/);
  assert.match(home, /Waktu/);
  assert.match(home, /Hajat\/Doa/);
});

test("Gap 4: Guide card uses responsive grid and structured metadata badges", () => {
  const css = allStyles();
  assert.match(css, /guide-grid/);
  assert.match(css, /grid-template-columns/);

  const discovery = source("components/discovery/catalog-view.tsx");
  // Category chip and rakaat badge
  assert.match(discovery, /chip|badge|rakaat/i);
});

test("Gap 5: Surface elevation tokens and WCAG 2.2 non-color status notices", () => {
  const css = allStyles();
  assert.match(css, /--surface-elevated:\s*#ffffff/);
  assert.match(css, /--surface-subtle:\s*#f0f3f0/);
  assert.match(css, /--brand-subtle:\s*#e7efe9/);
  assert.match(css, /--danger:\s*#b91c1c/);

  // Dark mode tokens
  assert.match(css, /--surface-elevated:\s*#213831/);
  assert.match(css, /--surface-subtle:\s*#142520/);
  assert.match(css, /--brand-subtle:\s*#1d3d34/);
  assert.match(css, /--danger:\s*#f87171/);

  // Status notice has text badge indicator, not color alone
  const noticeSource = source("app/bantuan/page.tsx");
  assert.match(noticeSource, /notice-badge|PENAFIAN|STATUS/i);
});