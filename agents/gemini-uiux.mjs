import { readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync as readTextFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const severities = new Set(["blocker", "high", "medium", "low"]);
export const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export async function fetchWithRetry(
  url,
  options,
  {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 15000,
    fetchImpl = fetch,
    logger = undefined,
  } = {}
) {
  let lastResponse;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchImpl(url, options);
      if (response.ok) {
        return response;
      }

      lastResponse = response;

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === maxRetries) {
        let detail = "";
        if (typeof response.json === "function") {
          try {
            const errorBody = await response.json();
            detail = errorBody?.error?.message || errorBody?.error?.status || "";
          } catch {
            // ignore JSON parse error on non-json response
          }
        }
        const detailSuffix = detail ? ` - ${detail}.` : ".";
        throw new Error(`Gemini request failed with HTTP ${response.status}${detailSuffix}`);
      }

      if (logger && baseDelayMs > 0) {
        logger(`[Gemini API] Received HTTP ${response.status}. Retrying in exponential backoff (attempt ${attempt + 1}/${maxRetries})...`);
      }

      if (baseDelayMs > 0) {
        const jitter = Math.random() * 300;
        const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt)) + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (err) {
      lastError = err;
      if (err.message?.startsWith("Gemini request failed with HTTP")) {
        throw err;
      }
      if (attempt === maxRetries) {
        throw lastError;
      }
      if (baseDelayMs > 0) {
        const jitter = Math.random() * 300;
        const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt)) + jitter;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (lastResponse) {
    let detail = "";
    if (typeof lastResponse.json === "function") {
      try {
        const errorBody = await lastResponse.json();
        detail = errorBody?.error?.message || errorBody?.error?.status || "";
      } catch {
        // ignore
      }
    }
    const detailSuffix = detail ? ` - ${detail}.` : ".";
    throw new Error(`Gemini request failed with HTTP ${lastResponse.status}${detailSuffix}`);
  }

  throw lastError;
}

export const DIRECTOR_REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "issues"],
  properties: {
    summary: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "severity",
          "category",
          "evidence",
          "problem",
          "recommendation",
          "acceptanceCriteria",
        ],
        properties: {
          severity: { type: "string", enum: [...severities] },
          category: { type: "string" },
          evidence: { type: "string" },
          problem: { type: "string" },
          recommendation: { type: "string" },
          acceptanceCriteria: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

function readPrompt(mode) {
  const filename = mode === "review" ? "gemini-visual-review.md" : "gemini-uiux.md";
  return readTextFileSync(path.join(projectRoot, "prompts", filename), "utf8").trim();
}

function asText(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

export function readGeminiConfig(env = process.env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Add it to this project's .env file.");
  }

  return {
    apiKey,
    model: env.GEMINI_UIUX_MODEL || "gemini-3.8-flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta",
  };
}

export function buildDirectorRequest({ mode, brief, context = "", image, model = "gemini-test-model" }) {
  if (mode !== "design" && mode !== "review") {
    throw new Error("mode must be either design or review.");
  }

  const requestContext = [
    `Task: ${asText(brief, "brief")}`,
    context ? `Project context:\n${context.trim()}` : "",
    "Return only JSON matching the requested review report schema.",
  ].filter(Boolean).join("\n\n");

  const content = image
    ? [
        { type: "text", text: requestContext },
        { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
      ]
    : requestContext;

  return {
    model,
    messages: [
      { role: "system", content: readPrompt(mode) },
      { role: "user", content },
    ],
  };
}

export function toGenerateContentRequest(request) {
  const userContent = request.messages[1].content;
  const parts = typeof userContent === "string"
    ? [{ text: userContent }]
    : userContent.map((part) => {
        if (part.type === "text") return { text: part.text };
        const match = /^data:([^;]+);base64,(.+)$/.exec(part.image_url.url);
        if (!match) throw new Error("Screenshot data is not a valid base64 data URL.");
        return { inlineData: { mimeType: match[1], data: match[2] } };
      });

  return {
    systemInstruction: { parts: [{ text: request.messages[0].content }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: DIRECTOR_REPORT_SCHEMA,
      temperature: 0.2,
    },
  };
}

export function validateDirectorReport(report) {
  if (!report || typeof report !== "object" || typeof report.summary !== "string" || !Array.isArray(report.issues)) {
    return { ok: false, error: "Report must contain a summary and issues array." };
  }

  for (const issue of report.issues) {
    if (!issue || !severities.has(issue.severity) || ["category", "evidence", "problem", "recommendation"].some((key) => typeof issue[key] !== "string") || !Array.isArray(issue.acceptanceCriteria) || issue.acceptanceCriteria.some((criterion) => typeof criterion !== "string")) {
      return { ok: false, error: "Each issue must be actionable and include severity, evidence, and acceptance criteria." };
    }
  }
  return { ok: true };
}

export function parseDotEnv(text) {
  const result = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
    result[match[1]] = value;
  }
  return result;
}

function loadProjectEnv() {
  const envPath = path.join(projectRoot, ".env");
  return existsSync(envPath) ? parseDotEnv(readTextFileSync(envPath, "utf8")) : {};
}

export function projectPath(inputPath, label) {
  const resolved = path.resolve(projectRoot, asText(inputPath, label));
  if (resolved !== projectRoot && !resolved.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error(`${label} must be inside this project.`);
  }
  if (path.basename(resolved).startsWith(".env")) {
    throw new Error(`${label} cannot reference an environment file.`);
  }
  return resolved;
}

export async function readScreenshot(screenshotPath) {
  const resolved = projectPath(screenshotPath, "screenshot");
  const extension = path.extname(resolved).toLowerCase();
  const mimeType = extension === ".png" ? "image/png" : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : extension === ".webp" ? "image/webp" : undefined;
  if (!supportedImageTypes.has(mimeType)) throw new Error("Screenshot must be a PNG, JPEG, or WebP file.");
  return { mimeType, base64: (await readFile(resolved)).toString("base64") };
}

export function parseArgs(argv) {
  const [mode, ...args] = argv;
  const options = { mode };
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error("Use named options such as --brief <text>.");
    options[key.slice(2)] = value;
  }
  return options;
}

export async function runCli(options, { env = {}, fetchImpl = fetch } = {}) {
  const mode = options.mode;
  if (mode !== "design" && mode !== "review") throw new Error("Usage: node agents/gemini-uiux.mjs <design|review> --brief <text> [--context <file>] [--screenshot <file>] [--output <file>]");
  if (mode === "design" && options.screenshot) throw new Error("Screenshots are only accepted in review mode.");
  if (mode === "review" && !options.screenshot) throw new Error("Review mode requires --screenshot <project-relative-file>.");

  const localEnv = loadProjectEnv();
  const config = readGeminiConfig({ ...process.env, ...localEnv, ...env });
  const context = options.context ? await readFile(projectPath(options.context, "context"), "utf8") : "";
  const image = options.screenshot ? await readScreenshot(options.screenshot) : undefined;
  const request = buildDirectorRequest({ mode, brief: options.brief, context, image, model: config.model });
  const response = await fetchWithRetry(
    `${config.endpoint}/models/${encodeURIComponent(config.model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey },
      body: JSON.stringify(toGenerateContentRequest(request)),
    },
    {
      fetchImpl,
      baseDelayMs: fetchImpl === fetch ? 1000 : 0,
      maxRetries: 3,
      logger: (msg) => process.stderr.write(`${msg}\n`),
    },
  );
  const responseBody = await response.json();
  const text = responseBody?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  if (!text) throw new Error("Gemini returned no review content.");
  const report = JSON.parse(text);
  const validation = validateDirectorReport(report);
  if (!validation.ok) throw new Error(`Gemini returned an invalid director report: ${validation.error}`);

  const output = options.output ? projectPath(options.output, "output") : path.join(projectRoot, "docs", "ui-reviews", `${mode}-review.json`);
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return output;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const output = await runCli(options);
  process.stdout.write(`Gemini ${options.mode} report saved to ${path.relative(projectRoot, output)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
