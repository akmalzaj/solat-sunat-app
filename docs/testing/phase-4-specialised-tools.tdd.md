# Phase 4: Specialised tools and hardening — TDD evidence

## Source plan

[Implementation execution plan](/_ProjectDocs/implementation_execution_plan.md), Phase 4.

## User journeys

1. As a worshipper preparing to pray, I can review Tasbih, Takbir, Rawatib, and Kusuf configurations without an external service.
2. As a learner, I can move a preparation-only counter forwards/backwards, reset it, and keep its bounded progress on my device.
3. As a user, I can reset this app's data without deleting unrelated data stored by another app on the same origin.
4. As an installed PWA user, I am told about a waiting update and can explicitly refresh into it.

## RED → GREEN evidence

| Behaviour | RED evidence | GREEN evidence |
| --- | --- | --- |
| Tasbih transitions and scoped reset | `npm.cmd test -- test/phase-4-specialised-tools.test.mjs` failed because `lib/tool-progress.ts` did not exist (`ERR_MODULE_NOT_FOUND`). | The same command passed: 4/4 tests. |
| Config-driven aid UI, semantic progress, responsive containment | N/A after the unit RED gate; the first Playwright attempt correctly exposed two test-selector assumptions, then a real mobile overflow was detected in the new breakpoint test. | `npm.cmd run test:e2e -- e2e/phase-4.spec.ts` passed: 3/3 tests after constraining the Rawatib table container. |
| Build and revisioned worker | N/A after the unit RED gate. | `npm.cmd run build` succeeded and reported 160 precached static URLs. |

## Guarantees

| # | What is guaranteed | Test / command | Type | Result |
| --- | --- | --- | --- | --- |
| 1 | Tasbih progress follows reviewed positions, clamps at 300, retreats safely, and resets. | `test/phase-4-specialised-tools.test.mjs` | Unit | PASS |
| 2 | App reset deletes only `solat_sunat_*` data, including tools/haptic preference, leaving unrelated origin data intact. | `test/phase-4-specialised-tools.test.mjs`, `test/phase-3-core-reading.test.mjs` | Unit | PASS |
| 3 | The worker uses content-revisioned cache names and waits for explicit `SKIP_WAITING`. | `test/phase-4-specialised-tools.test.mjs` | Contract | PASS |
| 4 | Users can operate and reset the labelled Tasbih preparation aid; all four aid configurations render. | `e2e/phase-4.spec.ts` | E2E | PASS |
| 5 | The primary counter is at least 64×64px and the tools screen has no horizontal overflow at 375, 768, and 1440px. | `e2e/phase-4.spec.ts` | E2E / visual | PASS |

## Final validation

- `npm.cmd run lint` — PASS
- `npm.cmd run typecheck` — PASS
- `npm.cmd test` — PASS (44 tests)
- `npm.cmd run build` — PASS; static export and 160-URL precache generated.
- `npm.cmd run test:e2e -- e2e/phase-4.spec.ts` — PASS (3 tests, with mobile/tablet/desktop screenshots and live feedback assertions).

Visual evidence is stored in `playwright/screenshots/phase-4-tools-mobile.png`, `phase-4-tools-tablet.png`, and `phase-4-tools-desktop.png`.

## Gemini UI/UX Visual Review & Remediation

The Gemini UI/UX visual review was conducted using the project-local Gemini 3.8 Flash model, producing [phase-4-visual-review.json](../ui-reviews/phase-4-visual-review.json). All findings were resolved:
1. **Rawatib mobile presentation (HIGH):** Converted to responsive stacked cards (`.tool-rawatib-cards`) on mobile viewports (<640px) displaying both Sebelum (Qabliyyah) and Selepas (Ba'diyyah) without horizontal truncation, while preserving the full table for tablet/desktop viewports.
2. **Navigation active state (HIGH):** Made `BottomNav` and `SiteHeader` active states dynamic using `usePathname()`, properly setting `.active` and `aria-current="page"` on `Alatan` when browsing `/alatan/`.
3. **Takbir live count feedback (HIGH):** Added dynamic numerical and rakaat status label with `aria-live="polite"` (`getTakbirProgressLabel`), distinguishing Rakaat 1 (7 takbirs) from Rakaat 2 (5 takbirs).
4. **Tasbih active step highlight (MEDIUM):** Added active step indicators (`.tool-sequence-item.active`, `aria-current="step"`, and `.tool-active-badge` "SEMASA") via `getActiveTasbihPositionIndex`.
5. **Control alignment & ergonomics (MEDIUM):** Vertically aligned button rows with `align-items: center` and standardized button dimensions.
6. **Takbir guide selector styling (LOW):** Replaced unstyled browser radio inputs with segmented pill tabs (`.tool-choice-pill`) conforming to design system tokens.
7. **Urutan Kusuf breakdown (LOW):** Added numbered sub-step breakdown (1. Qiyam & Rukuk 1, 2. Iktidal & Qiyam 2, 3. Dua Sujud) reflecting reviewed Shafi'i fiqh practice.
