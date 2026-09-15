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

test("Gap 1: Arabic fonts are self-hosted and configured in globals.css with line-height 2.0-2.2", () => {
  // Font files must exist locally
  assert.ok(existsSync(path.join(projectRoot, "public/fonts/amiri-arabic-400-normal.woff2")));
  assert.ok(existsSync(path.join(projectRoot, "public/fonts/amiri-arabic-700-normal.woff2")));

  const css = source("app/globals.css");
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
  const css = source("app/globals.css");
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /min-width:\s*44px/);
});

test("Gap 3: Mobile hero headline scales appropriately and discovery elements exist", () => {
  const css = source("app/globals.css");
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
  const css = source("app/globals.css");
  assert.match(css, /guide-grid/);
  assert.match(css, /grid-template-columns/);

  const home = source("app/page.tsx");
  // Category chip and rakaat badge
  assert.match(home, /chip|badge|rakaat/i);
});

test("Gap 5: Surface elevation tokens and WCAG 2.2 non-color status notices", () => {
  const css = source("app/globals.css");
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
  const home = source("app/page.tsx");
  assert.match(home, /notice-badge|PERINGATAN|STATUS/i);
});
