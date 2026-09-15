import { expect, test } from "@playwright/test";

test("Phase 4: learning aids are config-driven, accessible, and make their preparation-only boundary clear", async ({ page }) => {
  await page.goto("/alatan/");

  await expect(page.getByRole("heading", { name: "Alatan Persediaan Ibadah" })).toBeVisible();
  await expect(page.getByText(/untuk pembelajaran dan persediaan sahaja/i)).toBeVisible();

  await page.getByRole("link", { name: /Pelan Tasbih/i }).click();
  await expect(page.getByRole("heading", { name: /Pelan Solat Tasbih/i })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /Kemajuan tasbih/i })).toHaveAttribute("max", "300");
  await expect(page.locator(".tool-sequence-item.active")).toHaveAttribute("aria-current", "step");

  const add = page.getByRole("button", { name: /Tambah satu tasbih/i });
  const addBox = await add.boundingBox();
  expect(addBox?.width).toBeGreaterThanOrEqual(64);
  expect(addBox?.height).toBeGreaterThanOrEqual(64);
  await add.click();
  await expect(page.getByRole("progressbar", { name: /Kemajuan tasbih/i })).toHaveAttribute("value", "1");

  await page.getByRole("button", { name: /Set semula kemajuan tasbih/i }).click();
  await expect(page.getByRole("progressbar", { name: /Kemajuan tasbih/i })).toHaveAttribute("value", "0");
});

test("Phase 4: Takbir, Rawatib and Kusuf reviewed configurations remain available without network data", async ({ page }) => {
  await page.goto("/alatan/");

  await expect(page.getByRole("heading", { name: /Takbir Hari Raya & Istisqa/i })).toBeVisible();
  await expect(page.getByText(/7 kali takbir tambahan/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Jadual Rawatib/i })).toBeVisible();
  await expect(page.getByRole("table", { name: /Jadual solat sunat rawatib/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Urutan Solat Kusuf/i })).toBeVisible();
  await expect(page.getByText(/2 kali Qiyam/i).first()).toBeVisible();

  // Verify Takbir live count feedback
  await expect(page.getByText(/Persediaan · Belum memulakan takbir tambahan/i)).toBeVisible();
  await page.getByRole("button", { name: /Tambah satu takbir/i }).click();
  await expect(page.getByText(/Rakaat 1 · Takbir tambahan ke-1 daripada 7/i)).toBeVisible();
  await page.getByRole("button", { name: /Set semula kemajuan takbir/i }).click();
  await expect(page.getByText(/Persediaan · Belum memulakan takbir tambahan/i)).toBeVisible();
});

test("Phase 4: tools remain contained at mobile, tablet, and desktop breakpoints", async ({ page }) => {
  for (const viewport of [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/alatan/");
    await expect(page.getByRole("heading", { name: "Alatan Persediaan Ibadah" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    if (viewport.name === "mobile") {
      // Verify mobile navigation highlights Alatan
      const alatanBottomNav = page.locator(".bottom-nav .bottom-nav-item.active");
      await expect(alatanBottomNav).toContainText("Alatan");
      // Verify mobile rawatib card presentation contains both Sebelum and Selepas
      await expect(page.getByLabel("Senarai solat sunat rawatib mudah alih")).toBeVisible();
      await expect(page.getByText("Sebelum (Qabliyyah):").first()).toBeVisible();
      await expect(page.getByText("Selepas (Ba'diyyah):").first()).toBeVisible();
    }

    await page.screenshot({ path: `playwright/screenshots/phase-4-tools-${viewport.name}.png`, fullPage: true });
  }
});
