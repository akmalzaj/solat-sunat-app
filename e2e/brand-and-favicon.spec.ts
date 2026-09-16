import { expect, test } from "@playwright/test";

test.describe("Brand Logo and Favicon Integration", () => {
  test("favicon and apple-touch-icon metadata are declared and fetchable", async ({ page, request }) => {
    await page.goto("/");

    // Favicon links exist in head
    const iconLinks = page.locator('link[rel*="icon"]');
    await expect(iconLinks.first()).toBeAttached();

    // Verify /favicon.ico responds with 200
    const faviconRes = await request.get("/favicon.ico");
    expect(faviconRes.status()).toBe(200);

    // Verify apple-touch-icon link exists
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveAttribute("href", "/apple-touch-icon.png");

    // Verify apple-touch-icon file responds with 200
    const appleRes = await request.get("/apple-touch-icon.png");
    expect(appleRes.status()).toBe(200);
  });

  test("app logo in menu header is responsive, accessible and correctly sized across viewports", async ({ page }) => {
    // Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const brandLink = page.locator("a.brand");
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toHaveAttribute("href", "/");
    await expect(brandLink).toHaveAttribute("aria-label", "Panduan Solat Sunat - Ke Laman Utama");

    const brandLogo = brandLink.locator("img.brand-logo");
    await expect(brandLogo).toBeVisible();
    await expect(brandLogo).toHaveAttribute("aria-hidden", "true");

    const desktopLogoBox = await brandLogo.boundingBox();
    expect(desktopLogoBox).not.toBeNull();
    expect(desktopLogoBox!.height).toBeCloseTo(36, 1);
    expect(desktopLogoBox!.width).toBeCloseTo(36, 1);

    // Check brand link touch target
    const desktopLinkBox = await brandLink.boundingBox();
    expect(desktopLinkBox!.height).toBeGreaterThanOrEqual(44);

    await page.screenshot({ path: "playwright/screenshots/brand-header-desktop.png" });

    // Tablet Viewport (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(brandLogo).toBeVisible();
    const tabletLogoBox = await brandLogo.boundingBox();
    expect(tabletLogoBox!.height).toBeCloseTo(36, 1);
    await page.screenshot({ path: "playwright/screenshots/brand-header-tablet.png" });

    // Mobile Viewport (375x812)
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(brandLogo).toBeVisible();
    const mobileLogoBox = await brandLogo.boundingBox();
    expect(mobileLogoBox!.height).toBeCloseTo(32, 1);
    expect(mobileLogoBox!.width).toBeCloseTo(32, 1);

    // Ensure no horizontal overflow
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= 375)).toBe(true);

    await page.screenshot({ path: "playwright/screenshots/brand-header-mobile.png" });

    // Dark Mode Viewport
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.screenshot({ path: "playwright/screenshots/brand-header-dark.png" });
  });
});
