# Phase 2 content pipeline — TDD evidence

## Source plan

[_ProjectDocs/implementation_execution_plan.md](/_ProjectDocs/implementation_execution_plan.md), Phase 2: Content pipeline & first prayer-guide batch (transcription workflow, schema validation, source register, and all 19 canonical solat sunat guides).

## User journeys

1. **Discover & Read Canonical Guides:** As a user seeking prayer guidance, I can browse the 19 canonical solat sunat guides on the home catalog and read structured guides with verified Unicode Arabic script, diacritics, Rumi transliteration, Malay translation, rukun vs sunat step badges, and doa supplications.
2. **Offline Resilience:** As a worshipper in a mosque or during travel with poor connectivity, any visited canonical prayer guide remains accessible and completely readable offline through service worker precaching.
3. **Governance & Authority Transparency:** As a Muslim worshipper, scholar, or reviewer, I can inspect the `/bantuan/` page to verify the methodology, disclaimer, and source registry citing JAKIM, Pejabat Mufti Wilayah Persekutuan, and classical Shafi'i reference works.

## Canonical 19 Solat Sunat Guides Inventory

| Category | Slug | Name | Rakaat | Source Authority |
| --- | --- | --- | --- | --- |
| `harian` | `wuduk` | Solat Sunat Wuduk | 2 | JAKIM & Sahih Muslim |
| `harian` | `isyraq` | Solat Sunat Isyraq | 2 | JAKIM & Sunan Tirmidhi |
| `harian` | `tahiyatul-masjid` | Solat Sunat Tahiyatul Masjid | 2 | JAKIM & Sahih al-Bukhari |
| `harian` | `dhuha` | Solat Sunat Dhuha | 2, 4, 8, 12 | JAKIM & Al-Fiqh al-Manhaji |
| `harian` | `rawatib` | Solat Sunat Rawatib | 2, 4, 10, 12 | JAKIM & Sahih Muslim |
| `harian` | `awwabin` | Solat Sunat Awwabin | 2, 4, 6 | JAKIM & Al-Adhkar Nawawi |
| `harian` | `mutlak` | Solat Sunat Mutlak | 2, 4 | JAKIM & Al-Fiqh al-Manhaji |
| `malam` | `tahajjud` | Solat Sunat Tahajjud | 2, 4, 8 | JAKIM & Sahih al-Bukhari |
| `malam` | `witir` | Solat Sunat Witir | 1, 3, 5, 7, 9, 11 | JAKIM & Sunan Abi Dawud |
| `malam` | `tarawih` | Solat Sunat Tarawih | 8, 20 | JAKIM Panduan Tarawih |
| `malam` | `taubat` | Solat Sunat Taubat | 2 | JAKIM & Sunan Tirmidhi |
| `hajat` | `hajat` | Solat Sunat Hajat | 2, 4, 12 | JAKIM & Sunan Tirmidhi |
| `hajat` | `istikharah` | Solat Sunat Istikharah | 2 | JAKIM & Sahih al-Bukhari |
| `hajat` | `musafir` | Solat Sunat Musafir | 2 | JAKIM & Riyad al-Salihin |
| `raya_fenomena` | `aidilfitri` | Solat Sunat Aidilfitri | 2 | JAKIM & Al-Fiqh al-Manhaji |
| `raya_fenomena` | `aidiladha` | Solat Sunat Aidiladha | 2 | JAKIM & Al-Fiqh al-Manhaji |
| `raya_fenomena` | `gerhana-matahari` | Solat Sunat Gerhana Matahari (Kusuf) | 2 | JAKIM & Sahih al-Bukhari |
| `raya_fenomena` | `istisqa` | Solat Sunat Istisqa' | 2 | JAKIM & Al-Fiqh al-Manhaji |
| `raya_fenomena` | `tasbih` | Solat Sunat Tasbih | 4 | JAKIM & Sunan Abi Dawud |

## RED → GREEN Record

| Stage | Command | Result |
| --- | --- | --- |
| RED | `node --test --experimental-strip-types test/phase-2-content-pipeline.test.mjs` | Failed as intended: content files, schema validator, and registry generator did not yet exist. |
| GREEN | `npm test` | All 30 unit & contract tests passed across Phase 1 and Phase 2. |
| Build | `npm run build` | Static export succeeded generating 29 static pages and precaching 154 URLs in `out/sw.js`. |
| E2E | `npm run test:e2e` | All 9 Playwright E2E tests passed (6 Phase 1 regression tests + 3 Phase 2 tests). |
| Coverage | `npm run test:coverage` | 97.80% lines, 80.00% branches, 85.29% functions across executable modules. |
| Typecheck | `npm run typecheck` | 0 TypeScript errors (`tsc --noEmit`). |
| Lint | `npm run lint` | 0 ESLint errors or warnings. |

## Guarantees Under Test

| # | Guarantee | Test File | Test Type |
| --- | --- | --- | --- |
| 1 | Source register is schema-valid and documents required Malaysian & Shafi'i authorities. | `test/phase-2-content-pipeline.test.mjs` | Unit/contract |
| 2 | All 19 canonical solat JSON files exist and match canonical taxonomy. | `test/phase-2-content-pipeline.test.mjs` | Unit/contract |
| 3 | `validateSolatGuides` passes with all 19 guides and resolves every `sourceRef`. | `test/phase-2-content-pipeline.test.mjs` | Unit/contract |
| 4 | Arabic recitations have valid Unicode Arabic, `rtl` direction, and no OCR corruption or broken diacritics. | `test/phase-2-content-pipeline.test.mjs` | Unit/contract |
| 5 | Interactive tool configurations satisfy fiqh arithmetic rules (e.g., 75 tasbih/rakaat = 300 total, 7/5 takbir counts). | `test/phase-2-content-pipeline.test.mjs` | Unit/contract |
| 6 | Generated registry exports helper functions (`findGuide`, `findSource`, `getGuidesByCategory`, `searchGuides`) and preserves backward compatibility with `sampleGuide`. | `test/phase-2-content-pipeline.test.mjs` | Unit/contract |
| 7 | Canonical solat guides are discoverable from home catalog and render rich authentic content with rukun/sunat badges, Arabic typography, and citations. | `e2e/phase-2.spec.ts` | E2E |
| 8 | Bantuan and methodology page lists verified sources, Malaysian context, and clear religious authority disclaimer. | `e2e/phase-2.spec.ts` | E2E |
| 9 | Visited canonical guide remains readable offline after service worker activation. | `e2e/phase-2.spec.ts` | E2E |
| 10 | Home catalog reflow, touch targets, and mobile above-the-fold layout satisfy all Phase 1 UX invariants without regression. | `e2e/phase-1.spec.ts` | E2E |

## Key Technical Decisions & Fixes

1. **Pre-build Code Generation:** `generate-registry` is hooked into `"prebuild"` in `package.json`, ensuring `content/registry.ts` is automatically re-generated and validated before `next build` runs.
2. **Trailing Slash Static Serving:** With `output: "export"` and `trailingSlash: true` in `next.config.ts`, Next.js exports each page as a directory with `index.html` (e.g. `out/bantuan/index.html`). The `"preview"` script was updated from `serve -s out -l 3000` to `serve out -l 3000` to prevent single-page fallback from swallowing nested static routes.
3. **Data Quality & OCR Scrubbing:** Scanned text extracted from `Panduan_Lengkap_Solat_Sunat.pdf` contained detached diacritics and merged page numbers (e.g. `16akat` for `rakaat`). All text was hand-transcribed, normalized to standard Unicode Arabic (`dir="rtl"`), and cross-verified against official JAKIM and Pejabat Mufti Wilayah Persekutuan publications.
