import { expect, test } from "@playwright/test";

test("home and the statically generated sample guide are readable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /panduan yang tenang/i })).toBeVisible();
  await page.screenshot({ path: "playwright/screenshots/phase-1-home.png", fullPage: true });
  await page.getByRole("link", { name: /contoh struktur panduan/i }).click();
  await expect(page.getByRole("heading", { name: "Contoh struktur panduan" })).toBeVisible();
  await expect(page.getByText(/jangan gunakan sebagai panduan ibadah/i)).toBeVisible();
  await page.screenshot({ path: "playwright/screenshots/phase-1-reader.png", fullPage: true });
});

test("home reflows without horizontal overflow on tablet and mobile", async ({ page }) => {
  for (const viewport of [
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 375, height: 812 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /panduan yang tenang/i })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `playwright/screenshots/phase-1-home-${viewport.name}.png`, fullPage: true });
  }
});

test("manifest and previously opened guide remain available offline", async ({ page, context }) => {
  await page.goto("/solat/contoh-struktur/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest/);
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.scriptURL.endsWith("/sw.js") ?? false;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Contoh struktur panduan" })).toBeVisible();
});

test("navigation and touch targets satisfy >=44px across viewports", async ({ page }) => {
  // Desktop viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const desktopNav = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(desktopNav).toBeVisible();
  for (const name of ["Utama", "Simpanan", "Alatan", "Tetapan"]) {
    const link = desktopNav.getByRole("link", { name });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
  // Bottom nav is hidden on desktop
  await expect(page.getByRole("navigation", { name: "Navigasi mudah alih" })).toBeHidden();

  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 812 });
  const bottomNav = page.getByRole("navigation", { name: "Navigasi mudah alih" });
  await expect(bottomNav).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeHidden();
  for (const name of ["Utama", "Simpanan", "Alatan", "Tetapan"]) {
    const tab = bottomNav.getByRole("link", { name });
    await expect(tab).toBeVisible();
    const box = await tab.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  }
});

test("mobile viewport displays guide card above the fold without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  // Discovery bar and category chips are visible
  await expect(page.getByRole("searchbox", { name: "Cari solat sunat" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Semua" })).toBeVisible();

  // Notice badge provides non-color text cue
  await expect(page.getByText("PERINGATAN STATUS")).toBeVisible();

  // Guide card is visible above the 812px viewport fold
  const guideCard = page.getByRole("link", { name: /contoh struktur panduan/i });
  await expect(guideCard).toBeVisible();
  const box = await guideCard.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThan(812);
});

test("suppresses hydration warnings when browser extensions inject attributes onto body", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.body && !document.body.hasAttribute("ap-style")) {
        document.body.setAttribute("ap-style", "");
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });

  await page.goto("/");
  const hydrationErrors = consoleErrors.filter(
    (err) => err.toLowerCase().includes("hydration") || err.toLowerCase().includes("hydrated")
  );
  expect(hydrationErrors).toHaveLength(0);
});

