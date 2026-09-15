import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  SolatGuideSchema,
  SourceItemSchema,
  validateSolatGuides,
} from "../lib/content-schema.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadJson(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  assert.ok(existsSync(fullPath), `Expected ${relativePath} to exist.`);
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

test("Phase 2: Source register is schema-valid and contains required Malaysian & Shafi'i authorities", () => {
  const sources = loadJson("content/sources.json");
  assert.ok(Array.isArray(sources));
  assert.ok(sources.length >= 8, "Expected at least 8 authoritative sources");

  const validatedSources = sources.map((s) => SourceItemSchema.parse(s));
  const sourceIds = new Set(validatedSources.map((s) => s.id));

  // Verify critical sources exist
  assert.ok(sourceIds.has("jakim-panduan-solat-sunat"), "Missing JAKIM solat sunat guide");
  assert.ok(sourceIds.has("al-fiqh-al-manhaji"), "Missing Al-Fiqh al-Manhaji");
  assert.ok(sourceIds.has("sahih-bukhari"), "Missing Sahih al-Bukhari");
  assert.ok(sourceIds.has("sahih-muslim"), "Missing Sahih Muslim");
});

test("Phase 2: All 19 individual solat JSON files exist and match canonical taxonomy", () => {
  const expectedSlugs = [
    "aidiladha",
    "aidilfitri",
    "awwabin",
    "dhuha",
    "gerhana-matahari",
    "hajat",
    "istikharah",
    "istisqa",
    "isyraq",
    "musafir",
    "mutlak",
    "rawatib",
    "tahajjud",
    "tahiyatul-masjid",
    "tarawih",
    "tasbih",
    "taubat",
    "witir",
    "wuduk",
  ];

  const solatDir = path.join(projectRoot, "content", "solat");
  const files = readdirSync(solatDir).filter((f) => f.endsWith(".json"));
  assert.equal(files.length, 19, "Expected exactly 19 JSON files in content/solat");

  for (const slug of expectedSlugs) {
    const filename = path.join(solatDir, `${slug}.json`);
    assert.ok(existsSync(filename), `Missing solat file: ${slug}.json`);
    const data = JSON.parse(readFileSync(filename, "utf8"));
    assert.equal(data.slug, slug);
  }
});

test("Phase 2: validateSolatGuides passes with all 19 guides and resolves every sourceRef", () => {
  const sources = loadJson("content/sources.json");
  const solatDir = path.join(projectRoot, "content", "solat");
  const files = readdirSync(solatDir).filter((f) => f.endsWith(".json"));
  const guides = files.map((f) => JSON.parse(readFileSync(path.join(solatDir, f), "utf8")));

  const result = validateSolatGuides(guides, sources);
  assert.equal(result.valid, true);
  assert.equal(result.guides.length, 19);
  assert.equal(result.sources.length, sources.length);
});

test("Phase 2: Arabic recitations have valid Unicode Arabic, rtl direction, and no OCR corruption", () => {
  const solatDir = path.join(projectRoot, "content", "solat");
  const files = readdirSync(solatDir).filter((f) => f.endsWith(".json"));
  const arabicRegex = /[\u0600-\u06FF]/; // Basic Arabic unicode block

  for (const file of files) {
    const guide = JSON.parse(readFileSync(path.join(solatDir, file), "utf8"));

    // Check titleArabic
    assert.match(guide.titleArabic, arabicRegex, `${guide.slug} titleArabic must contain Arabic characters`);

    // Check niat
    assert.ok(guide.niat.length >= 1, `${guide.slug} must have at least 1 niat variation`);
    for (const n of guide.niat) {
      assert.equal(n.dir, "rtl", `${guide.slug} niat dir must be rtl`);
      assert.match(n.arabic, arabicRegex, `${guide.slug} niat must contain Arabic text`);
      assert.ok(n.rumi && n.rumi.length > 5, `${guide.slug} niat must have transliteration`);
      assert.ok(n.translation && n.translation.length > 5, `${guide.slug} niat must have Malay translation`);
      // Check that erroneous PDF page numbers didn't corrupt the Malay text
      assert.doesNotMatch(n.translation, /\b\d{1,2}akat\b/i, `${guide.slug} has corrupted rakaat text`);
    }

    // Check doa
    for (const d of guide.doa) {
      assert.equal(d.dir, "rtl", `${guide.slug} doa dir must be rtl`);
      assert.match(d.arabic, arabicRegex, `${guide.slug} doa must contain Arabic text`);
      assert.ok(d.rumi && d.rumi.length > 5, `${guide.slug} doa must have transliteration`);
      assert.ok(d.translation && d.translation.length > 5, `${guide.slug} doa must have Malay translation`);
    }

    // Check essential steps have isRukun
    assert.ok(guide.essentialSteps.length >= 3, `${guide.slug} must have at least 3 steps`);
    const hasRukun = guide.essentialSteps.some((s) => s.isRukun === true);
    assert.ok(hasRukun, `${guide.slug} must have at least one rukun step marked`);
  }
});

test("Phase 2: Interactive tool configurations satisfy fiqh arithmetic rules", () => {
  const tasbih = loadJson("content/solat/tasbih.json");
  assert.ok(tasbih.interactiveTool);
  assert.equal(tasbih.interactiveTool.toolType, "tasbih-counter");
  assert.equal(tasbih.interactiveTool.totalTasbih, 300);
  assert.equal(tasbih.interactiveTool.rakaatCount, 4);
  assert.equal(tasbih.interactiveTool.tasbihPerRakaat, 75);
  const positionSum = tasbih.interactiveTool.positions.reduce((sum, p) => sum + p.count, 0);
  assert.equal(positionSum, 75, "Tasbih positions must sum exactly to 75");

  for (const slug of ["aidilfitri", "aidiladha", "istisqa"]) {
    const data = loadJson(`content/solat/${slug}.json`);
    assert.ok(data.interactiveTool);
    assert.equal(data.interactiveTool.toolType, "takbir-tracker");
    assert.equal(data.interactiveTool.rakaat1Takbir, 7);
    assert.equal(data.interactiveTool.rakaat2Takbir, 5);
    assert.ok(data.interactiveTool.intermediateTasbih.includes("سُبْحَانَ"));
  }

  const rawatib = loadJson("content/solat/rawatib.json");
  assert.ok(rawatib.interactiveTool);
  assert.equal(rawatib.interactiveTool.toolType, "rawatib-grid");
  assert.equal(rawatib.interactiveTool.schedule.length, 5);

  const kusuf = loadJson("content/solat/gerhana-matahari.json");
  assert.ok(kusuf.interactiveTool);
  assert.equal(kusuf.interactiveTool.toolType, "kusuf-visualizer");
  assert.equal(kusuf.interactiveTool.qiyamPerRakaat, 2);
  assert.equal(kusuf.interactiveTool.rukukPerRakaat, 2);
});

test("Phase 2: Generated registry exports helpers and preserves backward compatibility", async () => {
  const registryModule = await import("../content/registry.ts");
  const { guides, allGuides, sampleGuide, findGuide, findSource, getGuidesByCategory, searchGuides } =
    registryModule;

  assert.equal(guides.length, 19, "Canonical guides count must be 19");
  assert.equal(allGuides.length, 20, "allGuides must contain 19 guides + 1 sampleGuide");
  assert.equal(sampleGuide.slug, "contoh-struktur");

  // Lookup tests
  const dhuha = findGuide("dhuha");
  assert.ok(dhuha);
  assert.equal(dhuha.title, "Solat Sunat Dhuha");

  const sample = findGuide("contoh-struktur");
  assert.ok(sample);
  assert.equal(sample.slug, "contoh-struktur");

  const missing = findGuide("solat-tidak-wujud");
  assert.equal(missing, undefined);

  // Category tests
  const harian = getGuidesByCategory("harian");
  assert.equal(harian.length, 7);

  const malam = getGuidesByCategory("malam");
  assert.equal(malam.length, 4);

  const hajat = getGuidesByCategory("hajat");
  assert.equal(hajat.length, 3);

  const raya = getGuidesByCategory("raya_fenomena");
  assert.equal(raya.length, 5);

  // Search test
  const searchResults = searchGuides("tahajjud");
  assert.ok(searchResults.some((g) => g.slug === "tahajjud"));

  // Source test
  const sourceItem = findSource("jakim-panduan-solat-sunat");
  assert.ok(sourceItem);
  assert.equal(sourceItem.author, "Jabatan Kemajuan Islam Malaysia (JAKIM)");
});
