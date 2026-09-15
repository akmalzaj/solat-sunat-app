import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PREFERENCES,
  toggleBookmark,
  isBookmarked,
  clampFontSize,
} from "../lib/preferences.ts";
import {
  getTimeSlotFromHour,
  getRecommendationForSlot,
  RECOMMENDATION_DISCLAIMER,
} from "../lib/recommendation.ts";
import { allGuides, searchGuides } from "../content/registry.ts";

test("Phase 3: UserPreferences default values are accessible and well-defined", () => {
  assert.equal(DEFAULT_PREFERENCES.fontSize, "biasa");
  assert.equal(DEFAULT_PREFERENCES.showRumi, true);
  assert.equal(DEFAULT_PREFERENCES.showTranslation, true);
  assert.equal(DEFAULT_PREFERENCES.theme, "system");
  assert.deepEqual(DEFAULT_PREFERENCES.bookmarks, []);
});

test("Phase 3: toggleBookmark adds or removes slug idempotently", () => {
  const initial = [];
  const afterAdd = toggleBookmark(initial, "dhuha");
  assert.deepEqual(afterAdd, ["dhuha"]);
  assert.equal(isBookmarked(afterAdd, "dhuha"), true);
  assert.equal(isBookmarked(afterAdd, "tahajjud"), false);

  const afterAddSecond = toggleBookmark(afterAdd, "tahajjud");
  assert.deepEqual(afterAddSecond, ["dhuha", "tahajjud"]);

  const afterRemove = toggleBookmark(afterAddSecond, "dhuha");
  assert.deepEqual(afterRemove, ["tahajjud"]);
  assert.equal(isBookmarked(afterRemove, "dhuha"), false);
});

test("Phase 3: clampFontSize scales properly across kecil, biasa, besar", () => {
  assert.equal(clampFontSize("kecil"), "kecil");
  assert.equal(clampFontSize("biasa"), "biasa");
  assert.equal(clampFontSize("besar"), "besar");
  // @ts-expect-error test fallback for invalid value
  assert.equal(clampFontSize("invalid"), "biasa");
});

test("Phase 3: getTimeSlotFromHour maps 24-hour cycle deterministically", () => {
  assert.equal(getTimeSlotFromHour(5), "subuh");
  assert.equal(getTimeSlotFromHour(8), "pagi");
  assert.equal(getTimeSlotFromHour(12), "siang");
  assert.equal(getTimeSlotFromHour(16), "petang");
  assert.equal(getTimeSlotFromHour(21), "malam");
  assert.equal(getTimeSlotFromHour(2), "malam");
});

test("Phase 3: getRecommendationForSlot returns relevant Shafi'i recommendations with disclaimer", () => {
  const morningRec = getRecommendationForSlot("pagi", allGuides);
  assert.ok(morningRec.guides.length > 0);
  assert.ok(
    morningRec.guides.some((g) => g.slug === "dhuha" || g.slug === "isyraq"),
    "Morning recommendation should include Dhuha or Isyraq"
  );
  assert.equal(morningRec.disclaimer, RECOMMENDATION_DISCLAIMER);
  assert.ok(morningRec.title.length > 0);

  const nightRec = getRecommendationForSlot("malam", allGuides);
  assert.ok(nightRec.guides.length > 0);
  assert.ok(
    nightRec.guides.some((g) => g.slug === "tahajjud" || g.slug === "witir" || g.slug === "awwabin"),
    "Night recommendation should include Tahajjud, Witir, or Awwabin"
  );
});

test("Phase 3: searchGuides finds guides by title, slug, and keywords", () => {
  const dhuhaResults = searchGuides("dhuha");
  assert.ok(dhuhaResults.some((g) => g.slug === "dhuha"));

  const tahajjudResults = searchGuides("tahajjud");
  assert.ok(tahajjudResults.some((g) => g.slug === "tahajjud"));

  const nonExistent = searchGuides("xyz999tidakwujud");
  assert.equal(nonExistent.length, 0);
});

import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearAllAppData,
} from "../lib/storage.ts";

test("Phase 3: Storage adapter is SSR safe when window is undefined", () => {
  const fallback = { test: 123 };
  assert.deepEqual(getStorageItem("some_key", fallback), fallback);
  assert.equal(setStorageItem("some_key", { a: 1 }), false);
  assert.equal(removeStorageItem("some_key"), false);
  assert.equal(clearAllAppData(), false);
});

test("Phase 3: Storage adapter safely reads, writes, and handles corrupted JSON with mock", () => {
  const store = new Map();
  const mockLocalStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };

  // Temporarily attach to globalThis
  // @ts-expect-error test mock
  globalThis.window = { localStorage: mockLocalStorage };

  try {
    assert.equal(setStorageItem("test_pref", { theme: "dark" }), true);
    assert.deepEqual(getStorageItem("test_pref", {}), { theme: "dark" });

    // Corrupted JSON test
    store.set("bad_json", "invalid-json{{");
    assert.deepEqual(getStorageItem("bad_json", { fallback: true }), { fallback: true });

    assert.equal(removeStorageItem("test_pref"), true);
    assert.deepEqual(getStorageItem("test_pref", null), null);

    setStorageItem("solat_sunat_theme", "dark");
    setStorageItem("another-app-key", { preserved: true });
    clearAllAppData();
    assert.equal(store.has("solat_sunat_theme"), false);
    assert.deepEqual(getStorageItem("another-app-key", {}), { preserved: true });
  } finally {
    // @ts-expect-error cleanup mock
    delete globalThis.window;
  }
});
