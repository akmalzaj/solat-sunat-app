import { expect, test } from "@playwright/test";

test("Phase 2: canonical solat guides are discoverable and render rich authentic content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /panduan yang tenang/i })).toBeVisible();

  // Verify canonical guide cards are displayed
  const dhuhaCard = page.getByRole("link", { name: /solat sunat dhuha/i });
  await expect(dhuhaCard).toBeVisible();

  // Click on Solat Sunat Dhuha
  await dhuhaCard.click();
  await expect(page.getByRole("heading", { name: "Solat Sunat Dhuha" })).toBeVisible();

  // Verify Arabic title, Niat and Doa sections
  await expect(page.locator("p.arabic").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lafaz Niat" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tatacara Pelaksanaan Langkah Demi Langkah" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Doa & Zikir Khusus" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sumber Rujukan & Autoriti" })).toBeVisible();

  // Verify Rukun badges exist in steps
  await expect(page.getByText("Rukun").first()).toBeVisible();
});

test("Phase 2: bantuan and methodology page lists verified sources", async ({ page }) => {
  await page.goto("/bantuan/");
  await expect(page.getByRole("heading", { name: /bantuan, sumber & metodologi fiqh/i })).toBeVisible();

  // Verify authoritative sources are listed
  await expect(page.getByText("Panduan Sembahyang Sunat").first()).toBeVisible();
  await expect(page.getByText("Al-Fiqh al-Manhaji").first()).toBeVisible();
  await expect(page.getByText("Jabatan Kemajuan Islam Malaysia (JAKIM)").first()).toBeVisible();
});

test("Phase 2: visited canonical guide remains readable offline after service worker activation", async ({
  page,
  context,
}) => {
  await page.goto("/solat/dhuha/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest/);
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.scriptURL.endsWith("/sw.js") ?? false;
  });

  // Switch to offline mode and reload
  await context.setOffline(true);
  await page.reload();

  // Content remains fully readable
  await expect(page.getByRole("heading", { name: "Solat Sunat Dhuha" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lafaz Niat" })).toBeVisible();
});
