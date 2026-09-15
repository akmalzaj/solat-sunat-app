# Phase 3 core reading experience — TDD evidence

## Source plan

[_ProjectDocs/implementation_execution_plan.md](/_ProjectDocs/implementation_execution_plan.md), Phase 3: Core reading experience (Home/search/category filtering, time-of-day recommendation card, guide reader route, reader display settings with font scaling and transliteration toggles, local bookmarks persistence, Mod Khusyuk focus view, dark/light theme switcher, and responsive mobile layout).

## User journeys

1. **Find & Filter Canonical Guides (Discovery):** As a user looking for a prayer, I can search by keyword, Malay title, or alias, filter by category (`Semua`, `Harian`, `Malam`, `Hajat & Doa`, `Raya & Khusus`), and view time-of-day contextual recommendations accompanied by an explicit, neutral religious disclaimer.
2. **Customised & Focused Reading (Reader & Mod Khusyuk):** As a worshipper reciting a prayer guide, I can adjust Arabic font size (`kecil`, `biasa`, `besar`), toggle Rumi transliteration or Malay translation, cycle through Niat variations, expand Doa & Wirid accordions, and enter "Mod Khusyuk" (distraction-free, high-contrast full-screen view) with single-touch exit and `Escape` key support.
3. **Bookmarks & Offline Persistence:** As a recurring user, I can bookmark frequently practiced prayers (e.g., Dhuha, Tahajjud, Witir) directly from cards or within the reader, and access them reliably at `/simpanan/` offline without requiring any server account or internet connection.
4. **Accessibility & Theme Customisation:** As a user with specific visual needs or dark environment preferences, I can toggle between Sistem, Terang, and Gelap modes in `/tetapan/` with pre-hydration zero-flash, verify reduced-motion support, and reset my local data at any time.

## RED → GREEN Record

| Stage | Command | Result |
| --- | --- | --- |
| RED | `node --test --experimental-strip-types test/phase-3-core-reading.test.mjs` | Failed as intended: `preferences.ts`, `recommendation.ts`, `storage.ts`, and reader components did not yet exist. |
| GREEN | `npm test` | All 38 unit & contract tests passed across Phase 1, Phase 2, and Phase 3. |
| Build | `npm run build` | Static export succeeded generating 29 static pages and precaching 158 static assets in `out/sw.js`. |
| E2E | `npm run test:e2e` | All 15 Playwright E2E tests passed (6 Phase 1 regression + 3 Phase 2 regression + 6 Phase 3 tests). |
| Coverage | `npm run test:coverage` | 95.36% lines, 81.82% branches, 77.59% functions across all executable test targets. |
| Typecheck | `npm run typecheck` | 0 TypeScript errors (`tsc --noEmit`). |
| Lint | `npm run lint` | 0 ESLint errors or warnings (`eslint .`). |

## Guarantees Under Test

| # | Guarantee | Test File | Test Type |
| --- | --- | --- | --- |
| 1 | `UserPreferences` default values are accessible and well-defined (`fontSize: "biasa"`, `showRumi: true`, `showTranslation: true`, `theme: "system"`). | `test/phase-3-core-reading.test.mjs` | Unit/contract |
| 2 | `toggleBookmark` adds or removes slug idempotently and `isBookmarked` reports accurate state. | `test/phase-3-core-reading.test.mjs` | Unit/contract |
| 3 | `clampFontSize` correctly clamps and cycles across `kecil`, `biasa`, and `besar`. | `test/phase-3-core-reading.test.mjs` | Unit/contract |
| 4 | `getTimeSlotFromHour` maps the 24-hour cycle deterministically to `subuh`, `pagi`, `siang`, `petang`, `malam`. | `test/phase-3-core-reading.test.mjs` | Unit/contract |
| 5 | `getRecommendationForSlot` returns Shafi'i recommendations with the mandatory neutral disclaimer: *"Cadangan berdasarkan waktu peranti; bukan penentu waktu ibadah tepat."* | `test/phase-3-core-reading.test.mjs` | Unit/contract |
| 6 | `searchGuides` correctly searches guides by title, slug, and keywords. | `test/phase-3-core-reading.test.mjs` | Unit/contract |
| 7 | Storage adapter is SSR-safe when `window` is undefined and handles corrupted localStorage payloads gracefully. | `test/phase-3-core-reading.test.mjs` | Unit/contract |
| 8 | Discovery catalog supports instant client search, category chips, clear button, and empty state with reset CTA. | `e2e/phase-3.spec.ts` | E2E |
| 9 | Reader toolbar dynamically scales Arabic recitation fonts (`.font-size-kecil`, `.font-size-besar`) and toggles Rumi/translation visibility. | `e2e/phase-3.spec.ts` | E2E |
| 10 | Mod Khusyuk provides a distraction-free view hiding all navigation chrome, and can be exited via `Escape` key or exit pill. | `e2e/phase-3.spec.ts` | E2E |
| 11 | Bookmarks persist across reloads and render on `/simpanan/` with quick unbookmarking and empty state. | `e2e/phase-3.spec.ts` | E2E |
| 12 | Theme switcher toggles `data-theme="dark"` on `document.documentElement` without page reload. | `e2e/phase-3.spec.ts` | E2E |
| 13 | Mobile above-the-fold constraint is preserved: first guide card is visible without scrolling on 375x812px viewport (`box.y < 812px`). | `e2e/phase-1.spec.ts` | E2E |

## UI/UX Advisory Review & Visual Evidence

Per [AGENTS.md](/AGENTS.md), Gemini UI/UX Design Director advisory workflow was executed:

1. **Design Recommendation:** Requested brief `"Phase 3 core reading experience mobile & desktop layout"` with design system context (`docs/design/design-system.md`). Applied key recommendations:
   - Mobile reader toolbar ergonomics: On viewports `<640px`, grouped font scale, Rumi, and translation toggles inside an accessible "Paparan" popover drawer to avoid crowding and preserve >=44px touch targets.
   - High-contrast exit pill in Mod Khusyuk (`Keluar Mod Khusyuk`) with `aria-keyshortcuts="Escape"`.
   - Category reset on active search query to ensure unconstrained search results across all 19 guides.
   - Standardized zero-state cards with explicit reset CTAs on both Home and Simpanan views.
2. **Visual Review:** Executed `gemini-uiux:review` against reader screenshot (`playwright/screenshots/phase-3-reader.png`).
   - Outcome: **0 Blocker, 0 High, 0 Medium findings.**
   - All text and interactive targets meet WCAG 2.2 AA contrast standards and non-color reliance guidelines.
3. **Captured Visual Artifacts:**
   - Home catalog & discovery: `playwright/screenshots/phase-3-home.png`
   - Guide reader with toolbar: `playwright/screenshots/phase-3-reader.png`
   - Mod Khusyuk full-screen focus view: `playwright/screenshots/phase-3-mod-khusyuk.png`
   - Saved bookmarks list: `playwright/screenshots/phase-3-bookmarks.png`
   - Preferences & settings view: `playwright/screenshots/phase-3-settings.png`

## Key Technical Decisions & Invariants

1. **React 19 `useSyncExternalStore` for SSR Storage:** Next.js 16 with React 19 strictly flags `setState` inside `useEffect` via ESLint (`react-hooks/set-state-in-effect`). Implemented `useStorageState` in `lib/storage.ts` using React's native `useSyncExternalStore` backed by an in-memory cache and custom `storage` window events. This guarantees synchronous, tearing-free access without cascading renders or hydration mismatches.
2. **Zero-Flash Theme Hydration:** Added an inline `<script>` in `<head>` of `app/layout.tsx` that reads `localStorage.getItem("solat_sunat_prefs_v1")` and applies `data-theme` to `<html>` prior to CSS paint, completely eliminating dark/light theme flashing.
3. **Mod Khusyuk Chrome Concealment:** Rather than only hiding elements within the reader component, entering Mod Khusyuk adds `mod-khusyuk-active` to `document.body`. This cleanly conceals topbar header navigation and mobile bottom tab navigation (which reside in `app/layout.tsx`) without brittle prop drilling.
4. **Mobile Above-the-Fold Layout:** In `components/discovery/catalog-view.tsx`, the search bar and category tabs are positioned above the time-of-day recommendation card, with compact mobile padding (`@media (max-width: 639px)`). This ensures the first guide card on a standard 375x812px mobile screen sits at `y ≈ 760px`, maintaining compliance with Phase 1's strict above-the-fold E2E invariant.
