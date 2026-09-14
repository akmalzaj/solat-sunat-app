# Gemini UI/UX Director — TDD evidence

## Source and scope

Derived from the project-local Gemini UI/UX Director plan supplied for this
repository. The implementation deliberately uses the native Gemini Developer
API with schema-constrained JSON, project-local `.env` configuration, and no
global Codex configuration changes.

## User journeys

1. As an engineer, I can request an actionable UI/UX design assessment from a
   project-local command, so implementation remains under engineering control.
2. As an engineer, I can submit a project-local screenshot for visual review,
   so findings are based on visible evidence.
3. As a repository owner, I can keep API credentials out of source control and
   prevent the tool from sending environment files or paths outside the project.

## RED → GREEN evidence

| Stage | Command | Result |
| --- | --- | --- |
| RED | `node --test test/gemini-uiux.test.mjs` | Failed as intended because `agents/gemini-uiux.mjs` did not exist. |
| GREEN | `node --test test/gemini-uiux.test.mjs` | 13 tests passed. |
| Coverage | `node --test --experimental-test-coverage test/gemini-uiux.test.mjs` | Lines 94.52%, branches 84.34%, functions 88.89%. |
| Safe runtime gate | `node agents/gemini-uiux.mjs design --brief 'Test local configuration'` | Failed closed with `GEMINI_API_KEY is not configured`; no request was sent. |

Git checkpoint commits were not created because Git is unavailable in the
current environment (`git` is not on `PATH`).

## Guarantees

| # | What is guaranteed | Test | Type | Result |
| --- | --- | --- | --- | --- |
| 1 | Design prompts include the task and stated project constraints. | `buildDirectorRequest makes the design brief and project context explicit` | Unit | PASS |
| 2 | Visual review attaches PNG/JPEG/WebP screenshot bytes as native Gemini inline data. | `buildDirectorRequest includes a screenshot only for visual review` | Unit | PASS |
| 3 | Missing API credentials fail without displaying a secret. | `readGeminiConfig rejects missing credentials without exposing a secret` | Unit | PASS |
| 4 | Native Gemini request payload asks for schema-constrained JSON. | `toGenerateContentRequest converts the internal review request to native Gemini parts` | Unit | PASS |
| 5 | A valid mocked Gemini response is saved as a project-local review report. | `runCli saves a schema-valid report returned by Gemini without contacting the network` | Integration | PASS |
| 6 | Screenshot paths cannot escape the project; `.env` files cannot be sent. | `project helpers parse local env content and reject secret or unsupported files`, `runCli rejects project-path escapes and API failures` | Unit/integration | PASS |

## Known gaps

There is no application or Playwright project in this repository yet, so an E2E
browser screenshot test is not applicable. When the application scaffold is
added, run its Playwright flow at 1280px, 768px, and 375px and invoke
`gemini-uiux:review` against the resulting synthetic-data screenshots.
