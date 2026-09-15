import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDirectorRequest,
  fetchWithRetry,
  parseArgs,
  parseDotEnv,
  projectPath,
  readGeminiConfig,
  readScreenshot,
  RETRYABLE_STATUS_CODES,
  runCli,
  toGenerateContentRequest,
  validateDirectorReport,
} from "../agents/gemini-uiux.mjs";

test("buildDirectorRequest makes the design brief and project context explicit", () => {
  const request = buildDirectorRequest({
    mode: "design",
    brief: "Create a calm prayer-tracking home screen.",
    context: "Use the existing Malay language and do not add dependencies.",
  });

  assert.equal(request.model, "gemini-test-model");
  assert.match(request.messages[0].content, /UI\/UX Design Director/);
  assert.match(request.messages[1].content, /calm prayer-tracking/);
  assert.match(request.messages[1].content, /Malay language/);
  assert.equal(request.messages[1].content.includes("data:image"), false);
});

test("buildDirectorRequest includes a screenshot only for visual review", () => {
  const request = buildDirectorRequest({
    mode: "review",
    brief: "Review the dashboard.",
    image: { mimeType: "image/png", base64: "c2NyZWVuc2hvdA==" },
  });

  assert.equal(request.messages[1].content[1].type, "image_url");
  assert.match(request.messages[1].content[1].image_url.url, /^data:image\/png;base64,/);
});

test("readGeminiConfig rejects missing credentials without exposing a secret", () => {
  assert.throws(
    () => readGeminiConfig({ GEMINI_UIUX_MODEL: "gemini-test-model" }),
    /GEMINI_API_KEY is not configured/,
  );
});

test("readGeminiConfig supplies the documented default model", () => {
  const config = readGeminiConfig({ GEMINI_API_KEY: "test-key" });

  assert.equal(config.model, "gemini-3.8-flash");
});

test("validateDirectorReport accepts actionable findings and rejects vague output", () => {
  const valid = validateDirectorReport({
    summary: "The primary action needs stronger hierarchy.",
    issues: [{
      severity: "high",
      category: "visual-hierarchy",
      evidence: "The primary action is the same visual weight as secondary actions.",
      problem: "Users may miss the main next step.",
      recommendation: "Use the existing primary button treatment.",
      acceptanceCriteria: ["The primary action is visually dominant."],
    }],
  });

  assert.equal(valid.ok, true);
  assert.equal(validateDirectorReport({ summary: "Looks good", issues: [{}] }).ok, false);
});

test("toGenerateContentRequest converts the internal review request to native Gemini parts", () => {
  const request = buildDirectorRequest({
    mode: "review",
    brief: "Review a mobile layout.",
    image: { mimeType: "image/webp", base64: "aW1hZ2U=" },
  });
  const body = toGenerateContentRequest(request);

  assert.equal(body.generationConfig.responseMimeType, "application/json");
  assert.equal(body.contents[0].parts[1].inlineData.mimeType, "image/webp");
});

test("toGenerateContentRequest preserves text-only design requests", () => {
  const body = toGenerateContentRequest(buildDirectorRequest({ mode: "design", brief: "Plan a welcome screen." }));

  assert.equal(body.contents[0].parts.length, 1);
  assert.match(body.contents[0].parts[0].text, /welcome screen/);
});

test("the request builder rejects invalid modes, briefs, and image payloads", () => {
  assert.throws(() => buildDirectorRequest({ mode: "implement", brief: "Nope" }), /mode/);
  assert.throws(() => buildDirectorRequest({ mode: "design", brief: " " }), /brief/);
  assert.throws(
    () => toGenerateContentRequest({ messages: [{ content: "system" }, { content: [{ type: "image_url", image_url: { url: "not-a-data-url" } }] }] }),
    /valid base64/,
  );
});

test("project helpers parse local env content and reject secret or unsupported files", async () => {
  assert.deepEqual(parseDotEnv("# comment\nGEMINI_API_KEY='key'\nINVALID-LINE\nNAME=value"), { GEMINI_API_KEY: "key", NAME: "value" });
  assert.throws(() => projectPath(".env", "context"), /environment file/);
  assert.throws(() => projectPath("", "context"), /non-empty/);
  await assert.rejects(readScreenshot("docs/ui-reviews/not-an-image.txt"), /PNG, JPEG, or WebP/);
});

test("parseArgs accepts paired named options and rejects malformed invocations", () => {
  assert.deepEqual(parseArgs(["design", "--brief", "Plan"]), { mode: "design", brief: "Plan" });
  assert.throws(() => parseArgs(["design", "brief"]), /named options/);
});

test("runCli saves a schema-valid report returned by Gemini without contacting the network", async () => {
  const output = "docs/ui-reviews/test-director-report.json";
  const report = {
    summary: "The layout is clear.",
    issues: [],
  };
  const fetchCalls = [];

  const savedPath = await runCli(
    { mode: "design", brief: "Assess a simple home screen.", output },
    {
      env: { GEMINI_API_KEY: "test-key", GEMINI_UIUX_MODEL: "gemini-test-model" },
      fetchImpl: async (url, init) => {
        fetchCalls.push({ url, init });
        return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(report) }] } }] }) };
      },
    },
  );

  assert.match(savedPath, /test-director-report\.json$/);
  assert.equal(fetchCalls.length, 1);
  await (await import("node:fs/promises")).unlink(savedPath);
});

test("runCli accepts a project-local screenshot for visual review", async () => {
  const { unlink, writeFile } = await import("node:fs/promises");
  const screenshot = "docs/ui-reviews/test-screenshot.png";
  const output = "docs/ui-reviews/test-visual-report.json";
  await writeFile(screenshot, "synthetic screenshot", "utf8");

  try {
    await runCli(
      { mode: "review", brief: "Review a generated screen.", screenshot, output },
      {
        env: { GEMINI_API_KEY: "test-key" },
        fetchImpl: async (_url, init) => ({
          ok: true,
          json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ summary: "Clear", issues: [] }) }] } }] }),
          init,
        }),
      },
    );
  } finally {
    await unlink(screenshot);
    await unlink(output);
  }
});

test("runCli rejects project-path escapes and API failures", async () => {
  await assert.rejects(
    runCli(
      { mode: "review", brief: "Review", screenshot: "../private.png" },
      { env: { GEMINI_API_KEY: "test-key" } },
    ),
    /inside this project/,
  );
  await assert.rejects(
    runCli(
      { mode: "design", brief: "Design" },
      { env: { GEMINI_API_KEY: "test-key" }, fetchImpl: async () => ({ ok: false, status: 429 }) },
    ),
    /HTTP 429/,
  );
});

test("fetchWithRetry retries on 503 and succeeds on subsequent recovery", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    if (callCount < 3) {
      return { ok: false, status: 503 };
    }
    return { ok: true, status: 200, text: async () => "recovered" };
  };

  const response = await fetchWithRetry(
    "https://example.com/api",
    {},
    { fetchImpl: mockFetch, maxRetries: 3, baseDelayMs: 0 }
  );

  assert.equal(response.ok, true);
  assert.equal(callCount, 3);
});

test("fetchWithRetry aborts immediately without retry on non-retryable 400 client error", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    return {
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid argument", status: "INVALID_ARGUMENT" } }),
    };
  };

  await assert.rejects(
    fetchWithRetry("https://example.com/api", {}, { fetchImpl: mockFetch, maxRetries: 3, baseDelayMs: 0 }),
    /HTTP 400 - Invalid argument\./
  );
  assert.equal(callCount, 1);
});

test("fetchWithRetry exhausts retries and includes detailed error message from response payload", async () => {
  let callCount = 0;
  const mockFetch = async () => {
    callCount++;
    return {
      ok: false,
      status: 503,
      json: async () => ({ error: { message: "The model is overloaded. Please try again later." } }),
    };
  };

  await assert.rejects(
    fetchWithRetry("https://example.com/api", {}, { fetchImpl: mockFetch, maxRetries: 2, baseDelayMs: 0 }),
    /HTTP 503 - The model is overloaded\. Please try again later\./
  );
  assert.equal(callCount, 3); // initial attempt + 2 retries
});
