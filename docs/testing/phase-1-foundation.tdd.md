# Phase 1 foundation — TDD evidence

## Source plan

[_ProjectDocs/implementation_execution_plan.md](/_ProjectDocs/implementation_execution_plan.md), Phase 1: establish a static Next.js/Tailwind foundation, an installable manifest, a service-worker proof of concept, and offline opening of Home plus one guide.

## User journeys

1. As a prospective user, I can open the home screen and a sample reader route without JavaScript or network-fetched content.
2. As an installed user, I can reopen a previously downloaded guide when offline.
3. As a content reviewer, I can see that Phase 1 contains no religious guidance presented as approved.

## RED → GREEN record

| Stage | Command | Result |
| --- | --- | --- |
| RED | `node --test test/phase-1-foundation.test.mjs` | Failed as intended: the Next config, manifest, worker, fallback, and guide route did not exist. |
| GREEN | `npm.cmd test` | 16 tests passed, including all three Phase 1 contract tests. |
| Build | `npm.cmd run build` | Static export completed and the source-owned worker generated a 37-URL precache. |
| E2E | `npm.cmd run test:e2e` with `PLAYWRIGHT_CHROME_EXECUTABLE_PATH` set to installed Chrome | 3 tests passed: discovery/reader, tablet/mobile reflow, and active-worker offline reload. |
| Coverage | `npm.cmd run test:coverage` | 94.52% lines, 84.52% branches, 88.89% functions for the executable Node test target. |

## Guarantees under test

| # | Guarantee | Test file | Test type |
| --- | --- | --- |
| 1 | Static export and Serwist source/destination are configured. | `test/phase-1-foundation.test.mjs` | Unit/contract |
| 2 | An installable Malay manifest and an offline fallback route exist. | `test/phase-1-foundation.test.mjs` | Unit/contract |
| 3 | The sample guide has static params and a visible `needs-review` governance state. | `test/phase-1-foundation.test.mjs` | Unit/contract |
| 4 | Home and sample reader are navigable; the sample is not presented as worship guidance. | `e2e/phase-1.spec.ts` | E2E |
| 5 | A visited sample guide remains readable offline after service-worker activation. | `e2e/phase-1.spec.ts` | E2E |
| 6 | Tablet and 375px mobile Home layouts have no horizontal overflow. | `e2e/phase-1.spec.ts` | E2E |

## Implementation notes and known gaps

- The Serwist configurator-mode spike compiled and produced a worker, but Chrome reported worker-script evaluation failure even with its documented minimal precache worker. Per the source plan's conditional adoption rule, it was removed rather than shipped. `scripts/build-service-worker.mjs` now transpiles the small source-owned `app/sw.ts` template and generates a revisioned static precache list directly from `out/`.
- Gemini UI/UX Director was invoked once for design advice and once for visual review. Both requests returned HTTP 503, so no Gemini finding was available to apply. Local desktop, tablet, and mobile screenshot evidence was captured and the responsive E2E checks passed.
- `npm.cmd audit --omit=dev --json` reports zero production vulnerabilities. The full audit reports seven high-severity, no-fix transitive development-only findings in the `eslint-config-next`/Browserslist chain; do not treat that as a production dependency finding, but revisit it when the lint stack receives an upstream fix.
