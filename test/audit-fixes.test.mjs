import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PREFERENCE_KEYS,
  STORAGE_KEYS,
} from "../lib/preferences.ts";
import { getStorageItem, setStorageItem } from "../lib/storage.ts";
import { SourceItemSchema } from "../lib/content-schema.ts";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function withMockLocalStorage(run) {
  const store = new Map();
  const mockLocalStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };

  // @ts-expect-error test mock
  globalThis.window = { localStorage: mockLocalStorage };
  try {
    run(store);
  } finally {
    // @ts-expect-error cleanup mock
    delete globalThis.window;
  }
}

test("Audit: structurally invalid stored values fall back to defaults instead of reaching render", () => {
  withMockLocalStorage((store) => {
    // Bookmarks stored as a non-array would make bookmarks.includes() throw during render.
    store.set(STORAGE_KEYS.BOOKMARKS, JSON.stringify(42));
    assert.deepEqual(getStorageItem(STORAGE_KEYS.BOOKMARKS, []), []);

    store.set(STORAGE_KEYS.BOOKMARKS, JSON.stringify(["dhuha", "witir"]));
    assert.deepEqual(getStorageItem(STORAGE_KEYS.BOOKMARKS, []), ["dhuha", "witir"]);

    // Tool progress with junk values must not leak arbitrary shapes into tool state.
    store.set(STORAGE_KEYS.TOOL_PROGRESS, JSON.stringify({ tasbih: { completed: "banyak" } }));
    assert.deepEqual(getStorageItem(STORAGE_KEYS.TOOL_PROGRESS, {}), {});

    store.set(STORAGE_KEYS.TOOL_PROGRESS, JSON.stringify({ tasbih: { completed: 5 }, takbir: { aidilfitri: 3 } }));
    assert.deepEqual(getStorageItem(STORAGE_KEYS.TOOL_PROGRESS, {}), {
      tasbih: { completed: 5 },
      takbir: { aidilfitri: 3 },
    });

    // Theme stored with an unknown mode falls back; valid modes pass through.
    store.set(PREFERENCE_KEYS.THEME, JSON.stringify("sepia"));
    assert.equal(getStorageItem(PREFERENCE_KEYS.THEME, "system"), "system");
    store.set(PREFERENCE_KEYS.THEME, JSON.stringify("dark"));
    assert.equal(getStorageItem(PREFERENCE_KEYS.THEME, "system"), "dark");

    // Font size enum is enforced.
    store.set(PREFERENCE_KEYS.FONT_SIZE, JSON.stringify("maximum"));
    assert.equal(getStorageItem(PREFERENCE_KEYS.FONT_SIZE, "biasa"), "biasa");
  });
});

test("Audit: theme bootstrap script in layout accepts the exact bytes setStorageItem writes", async () => {
  const layoutSource = await readFile(path.join(projectRoot, "app", "layout.tsx"), "utf8");
  const match = layoutSource.match(/__html:\s*`([^`]+)`/);
  assert.ok(match, "layout.tsx must contain an inline bootstrap script string");
  const script = match[1];

  const runScript = (storedRaw) => {
    const attributes = new Map();
    const document = {
      documentElement: { setAttribute: (name, value) => attributes.set(name, value) },
    };
    // Test harness: execute the shipped bootstrap against mocks.
    new Function("localStorage", "document", script)(
      { getItem: () => storedRaw },
      document,
    );
    return attributes.get("data-theme");
  };

  // The storage adapter serializes via JSON.stringify, so "dark" is stored with quotes.
  const store = new Map();
  withMockLocalStorage((mockStore) => {
    setStorageItem(PREFERENCE_KEYS.THEME, "dark");
    mockStore.forEach((value, key) => store.set(key, value));
  });

  assert.equal(runScript(store.get(PREFERENCE_KEYS.THEME)), "dark", "bootstrap must parse the JSON-quoted theme");
  assert.equal(runScript(JSON.stringify("light")), "light");
  assert.equal(runScript('"dark"'), "dark");
  assert.equal(runScript("dark"), "dark", "raw legacy value is still accepted");
  assert.equal(runScript(JSON.stringify("system")), undefined, "system mode must not set data-theme");
  assert.equal(runScript("sepia"), undefined);
  assert.equal(runScript(null), undefined);
});

test("Audit: source URLs must use https to be valid content", () => {
  const validSource = {
    id: "test-source",
    title: "Rujukan Ujian",
    author: "Pengarang",
    publisher: "Penerbit",
    year: 2024,
    type: "government_religious_authority",
    url: "https://example.com/rujukan",
    licenseOrPermission: "Sumber awam",
    notes: "Nota",
  };
  assert.equal(SourceItemSchema.safeParse(validSource).success, true);

  const javascriptUrlSource = { ...validSource, url: "javascript:alert(1)" };
  assert.equal(
    SourceItemSchema.safeParse(javascriptUrlSource).success,
    false,
    "javascript: scheme must be rejected by the content trust boundary",
  );

  const httpUrlSource = { ...validSource, url: "http://example.com/rujukan" };
  assert.equal(
    SourceItemSchema.safeParse(httpUrlSource).success,
    false,
    "plain http must be rejected so no insecure source links ship",
  );
});

test("Audit: guide pages let the layout title template append the site suffix", async () => {
  const pageSource = await readFile(
    path.join(projectRoot, "app", "solat", "[slug]", "page.tsx"),
    "utf8",
  );
  assert.ok(
    pageSource.includes("return { title: guide.title };"),
    "generateMetadata must return the bare title; the root layout template adds '| Panduan Solat Sunat'",
  );
  assert.ok(!pageSource.includes("${guide.title} | Panduan Solat Sunat"));
});