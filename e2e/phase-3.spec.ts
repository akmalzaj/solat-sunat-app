import { expect, test } from "@playwright/test";

test("Phase 3: discovery search and category filter work seamlessly with empty state recovery", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /panduan yang tenang/i })).toBeVisible();

  // Test recommendation card exists and has disclaimer
  await expect(page.getByText(/Cadangan berdasarkan waktu peranti; bukan penentu waktu ibadah tepat/i)).toBeVisible();

  // Test category filtering: click "Malam & Qiam"
  const malamChip = page.getByRole("button", { name: /Malam & Qiam/i });
  await malamChip.click();
  await expect(malamChip).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: /Panduan MALAM/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Solat Sunat Tahajjud/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Solat Sunat Witir/i })).toBeVisible();

  // Test search input: type "dhuha"
  const searchInput = page.getByLabel("Cari solat sunat");
  await searchInput.fill("dhuha");
  await expect(page.getByRole("heading", { name: /Hasil Carian/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Solat Sunat Dhuha/i })).toBeVisible();

  // Test search for unmatched query -> empty state
  await searchInput.fill("xyz999tidakwujud");
  await expect(page.getByRole("heading", { name: "Tiada Panduan Ditemui" })).toBeVisible();
  await expect(page.getByText(/Tiada padanan panduan solat sunat ditemui/i)).toBeVisible();

  // Click "Padam Carian & Papar Semua" to recover
  const resetBtn = page.getByRole("button", { name: "Padam Carian & Papar Semua" });
  await resetBtn.click();
  await expect(page.getByRole("heading", { name: "Semua Panduan Solat Sunat" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Solat Sunat Dhuha/i })).toBeVisible();
});

test("Phase 3: guide reader display controls, font scaling, and toggles", async ({ page }) => {
  await page.goto("/solat/dhuha/");
  await expect(page.getByRole("heading", { name: "Solat Sunat Dhuha" })).toBeVisible();

  const readerRoot = page.locator(".guide-reader-root");
  await expect(readerRoot).toBeVisible();

  // Font scaling: default is 'biasa'
  await expect(readerRoot).toHaveClass(/font-size-biasa/);

  // Click A+ (besar) on desktop toolbar
  const fontPlusBtn = page.getByTitle(/Saiz teks besar/i);
  if (await fontPlusBtn.isVisible()) {
    await fontPlusBtn.click();
    await expect(readerRoot).toHaveClass(/font-size-besar/);

    // Click A- (kecil)
    const fontMinusBtn = page.getByTitle(/Saiz teks kecil/i);
    await fontMinusBtn.click();
    await expect(readerRoot).toHaveClass(/font-size-kecil/);
  }

  // Toggling Rumi transliteration
  const rumiToggleBtn = page.getByTitle(/Papar\/Sorok Rumi/i);
  if (await rumiToggleBtn.isVisible()) {
    await expect(page.locator(".recitation-rumi").first()).toBeVisible();
    await rumiToggleBtn.click();
    await expect(page.locator(".recitation-rumi").first()).not.toBeVisible();
    await rumiToggleBtn.click();
    await expect(page.locator(".recitation-rumi").first()).toBeVisible();
  }

  // Toggling Terjemahan (Maksud)
  const transToggleBtn = page.getByTitle(/Papar\/Sorok Terjemahan/i);
  if (await transToggleBtn.isVisible()) {
    await expect(page.locator(".recitation-translation").first()).toBeVisible();
    await transToggleBtn.click();
    await expect(page.locator(".recitation-translation").first()).not.toBeVisible();
    await transToggleBtn.click();
    await expect(page.locator(".recitation-translation").first()).toBeVisible();
  }

  // Doa Accordion
  const doaSummary = page.locator(".doa-accordion-summary").first();
  await expect(doaSummary).toBeVisible();
});

test("Phase 3: Mod Khusyuk distraction-free focus mode and Escape key recovery", async ({ page }) => {
  await page.goto("/solat/dhuha/");

  const khusyukBtn = page.getByRole("button", { name: /Mod Khusyuk/i });
  await expect(khusyukBtn).toBeVisible();
  await khusyukBtn.click();

  const readerRoot = page.locator(".guide-reader-root");
  await expect(readerRoot).toHaveClass(/mod-khusyuk-active/);

  // Exit pill must be visible
  const exitBtn = page.getByRole("button", { name: /Keluar daripada Mod Khusyuk/i });
  await expect(exitBtn).toBeVisible();

  // Chrome is concealed
  await expect(page.locator(".topbar")).toBeHidden();
  await expect(page.locator(".sticky-reader-toolbar")).toBeHidden();

  // Press Escape to exit
  await page.keyboard.press("Escape");
  await expect(readerRoot).not.toHaveClass(/mod-khusyuk-active/);
  await expect(page.locator(".topbar")).toBeVisible();
});

test("Phase 3: bookmarks toggle, persistence, and empty state", async ({ page }) => {
  // Clear any existing bookmarks in localStorage
  await page.goto("/simpanan/");
  await expect(page.getByRole("heading", { name: /Belum Ada Panduan Disimpan/i })).toBeVisible();

  // Click CTA to discover guides
  const ctaBtn = page.getByRole("link", { name: /Terokai Panduan Solat/i });
  await ctaBtn.click();
  await expect(page).toHaveURL(/\/$/);

  // Bookmark Dhuha from card
  const dhuhaBookmarkBtn = page.getByRole("button", { name: /Simpan tanda buku Solat Sunat Dhuha/i });
  await dhuhaBookmarkBtn.click();
  await expect(page.getByRole("button", { name: /Nyah tanda buku Solat Sunat Dhuha/i })).toBeVisible();

  // Navigate to Simpanan
  await page.goto("/simpanan/");
  await expect(page.getByRole("heading", { name: /1 Panduan Tersimpan/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Solat Sunat Dhuha/i })).toBeVisible();

  // Reload page to verify offline persistence
  await page.reload();
  await expect(page.getByRole("heading", { name: /1 Panduan Tersimpan/i })).toBeVisible();

  // Remove bookmark
  const removeBtn = page.getByRole("button", { name: /Padam tanda buku Solat Sunat Dhuha/i });
  await removeBtn.click();
  await expect(page.getByRole("heading", { name: /Belum Ada Panduan Disimpan/i })).toBeVisible();
});

test("Phase 3: settings theme switcher applies data-theme and persists", async ({ page }) => {
  await page.goto("/tetapan/");
  await expect(page.getByRole("heading", { name: /Tetapan & Sumber Fiqh/i })).toBeVisible();

  // Switch to Dark theme
  const darkBtn = page.getByRole("button", { name: /Gelap \(Forest Night\)/i });
  await darkBtn.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  // Switch to Light theme
  const lightBtn = page.getByRole("button", { name: /Terang \(Parchment\)/i });
  await lightBtn.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  // Switch back to System
  const systemBtn = page.getByRole("button", { name: /Ikut Sistem/i });
  await systemBtn.click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});

test("Phase 3: capture visual evidence screenshots for Gemini visual QA", async ({ page }) => {
  // 1. Home page with discovery and recommendations
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /panduan yang tenang/i })).toBeVisible();
  await page.screenshot({ path: "playwright/screenshots/phase-3-home.png", fullPage: true });

  // 2. Reader screen with toolbar and Arabic typography
  await page.goto("/solat/dhuha/");
  await expect(page.getByRole("heading", { name: "Solat Sunat Dhuha" })).toBeVisible();
  await page.screenshot({ path: "playwright/screenshots/phase-3-reader.png", fullPage: true });

  // 3. Mod Khusyuk focus view
  await page.getByRole("button", { name: /Mod Khusyuk/i }).click();
  await expect(page.locator(".guide-reader-root")).toHaveClass(/mod-khusyuk-active/);
  await page.screenshot({ path: "playwright/screenshots/phase-3-mod-khusyuk.png", fullPage: true });
  await page.keyboard.press("Escape");

  // 4. Bookmarks empty state
  await page.goto("/simpanan/");
  await expect(page.getByRole("heading", { name: /Belum Ada Panduan Disimpan/i })).toBeVisible();
  await page.screenshot({ path: "playwright/screenshots/phase-3-bookmarks.png", fullPage: true });

  // 5. Settings screen with dark theme
  await page.goto("/tetapan/");
  await page.getByRole("button", { name: /Gelap \(Forest Night\)/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: "playwright/screenshots/phase-3-settings.png", fullPage: true });
});

