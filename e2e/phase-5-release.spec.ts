import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 5: Release validation — accessibility audit and release smoke checks.
 *
 * The plan's release criteria require automated accessibility checks with axe
 * (WCAG 2.2 AA baseline) plus manual keyboard verification on every release
 * surface. These scans run against the production static build served by
 * `npm run preview`, exactly as deployed.
 */

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

const RELEASE_ROUTES = [
  { name: "home", path: "/" },
  { name: "reader", path: "/solat/dhuha/" },
  { name: "alatan", path: "/alatan/" },
  { name: "simpanan", path: "/simpanan/" },
  { name: "tetapan", path: "/tetapan/" },
  { name: "bantuan", path: "/bantuan/" },
];

async function scanForViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target),
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toHaveLength(0);
}

test.describe("Phase 5: axe accessibility audit (WCAG 2.2 AA)", () => {
  for (const route of RELEASE_ROUTES) {
    test(`light theme has no axe violations on ${route.name}`, async ({ page }) => {
      await page.goto(route.path);
      await scanForViolations(page);
    });
  }

  // Emulate the system dark preference instead of flipping data-theme after
  // load: the token swap is what real users get at first paint, and it avoids
  // reading computed styles mid-way through the 150ms background/color
  // transitions (interpolated colors are transient, not WCAG-relevant).
  test.describe("dark system preference", () => {
    test.use({ colorScheme: "dark" });

    test("dark theme has no axe violations on home, reader, and alatan", async ({ page }) => {
      await page.goto("/");
      await scanForViolations(page);

      await page.goto("/solat/dhuha/");
      await scanForViolations(page);

      await page.goto("/alatan/");
      await scanForViolations(page);
    });
  });

  test("mobile viewport has no axe violations on home and reader", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/");
    await scanForViolations(page);

    await page.goto("/solat/dhuha/");
    await scanForViolations(page);
  });
});

test.describe("Phase 5: keyboard and focus management", () => {
  test("reader display popover traps attention safely and closes on Escape with focus restore", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/solat/dhuha/");

    const trigger = page.getByRole("button", { name: "Pilihan paparan dan saiz tulisan" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Tetapan paparan bacaan" });
    await expect(dialog).toBeVisible();

    // Focus moves into the dialog when it opens (not stranded on the trigger).
    const firstPill = dialog.getByRole("button", { name: "Kecil" });
    await expect(firstPill).toBeFocused();

    // Tab cycles within the dialog instead of escaping into the page behind it:
    // five tabs reach the last control, the sixth wraps back to the first.
    const closeButton = dialog.getByRole("button", { name: "Tutup Pilihan" });
    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press("Tab");
    }
    await expect(closeButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(firstPill).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(closeButton).toBeFocused();

    // Escape closes the dialog and returns focus to the trigger.
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("home page primary flows are keyboard reachable", async ({ page }) => {
    await page.goto("/");

    // Search input is reachable and operable by keyboard alone.
    const search = page.getByRole("searchbox", { name: "Cari solat sunat" });
    await search.focus();
    await expect(search).toBeFocused();
    await page.keyboard.type("dhuha");
    await expect(page.getByRole("link", { name: /buka panduan solat sunat dhuha/i })).toBeVisible();

    // The guide link is reachable by keyboard alone from the search input
    // (category chips and the reset button come first in the tab order).
    let guideLinkFocused = false;
    for (let i = 0; i < 12 && !guideLinkFocused; i += 1) {
      await page.keyboard.press("Tab");
      guideLinkFocused = await page.evaluate(
        (href) => document.activeElement?.getAttribute("href") === href,
        "/solat/dhuha/",
      );
    }
    expect(guideLinkFocused).toBe(true);
  });
});

test.describe("Phase 5: release PWA and SEO smoke", () => {
  test("manifest declares installable icons including a maskable PNG and serves correctly", async ({ page, request }) => {
    await page.goto("/");

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.webmanifest");

    const manifestRes = await request.get("/manifest.webmanifest");
    expect(manifestRes.status()).toBe(200);

    const manifest = (await manifestRes.json()) as { name: string; display: string; icons: Array<{ src: string; purpose?: string }> };
    expect(manifest.name).toContain("Solat");
    expect(manifest.display).toBe("standalone");

    const maskableIcons = manifest.icons.filter((icon) => icon.purpose === "maskable");
    expect(maskableIcons.length).toBeGreaterThan(0);
    for (const icon of maskableIcons) {
      const iconRes = await request.get(icon.src);
      expect(iconRes.status()).toBe(200);
    }
  });

  test("robots and sitemap are present for the production domain", async ({ request }) => {
    const robotsRes = await request.get("/robots.txt");
    expect(robotsRes.status()).toBe(200);
    const robots = await robotsRes.text();
    expect(robots).toContain("Sitemap: https://solat.wiki/sitemap.xml");

    const sitemapRes = await request.get("/sitemap.xml");
    expect(sitemapRes.status()).toBe(200);
    const sitemap = await sitemapRes.text();
    expect(sitemap).toContain("https://solat.wiki/solat/dhuha/");
  });

  test("offline fallback route is published and explains the offline state", async ({ page }) => {
    await page.goto("/~offline/");
    await expect(page.getByRole("heading", { name: /luar talian/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /halaman utama|ke halaman utama/i }).first()).toBeVisible();
  });

  test("RSC prefetch payloads are reachable at the flattened paths the router requests", async ({ request }) => {
    // next.js#85374: the router requests /route/__next.<segments>.__PAGE__.txt
    // (dots) while the export emits /route/__next/<segments>/__PAGE__.txt.
    // scripts/fix-static-export-rsc.mjs publishes the flattened copies after
    // `next build`; without it every client-side navigation prefetch 404s.
    const flattenedPayloads = [
      "/__next.__PAGE__.txt",
      "/alatan/__next.alatan.__PAGE__.txt",
      "/simpanan/__next.simpanan.__PAGE__.txt",
      "/tetapan/__next.tetapan.__PAGE__.txt",
      "/bantuan/__next.bantuan.__PAGE__.txt",
      "/solat/dhuha/__next.solat.$d$slug.__PAGE__.txt",
    ];
    for (const url of flattenedPayloads) {
      const res = await request.get(url);
      expect(res.status(), `expected ${url} to be published`).toBe(200);
    }
  });
});