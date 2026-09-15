import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  advanceTasbihProgress,
  createTasbihProgress,
  resetTasbihProgress,
  retreatTasbihProgress,
  getTasbihProgressLabel,
  getActiveTasbihPositionIndex,
  getTakbirProgressLabel,
} from "../lib/tool-progress.ts";
import { clearAllAppData, getStorageItem, setStorageItem } from "../lib/storage.ts";
import { STORAGE_KEYS } from "../lib/preferences.ts";

const tasbihConfig = {
  toolType: "tasbih-counter",
  totalTasbih: 300,
  rakaatCount: 4,
  tasbihPerRakaat: 75,
  positions: [
    { positionIndex: 1, name: "Qiyam", count: 15 },
    { positionIndex: 2, name: "Rukuk", count: 10 },
    { positionIndex: 3, name: "Iktidal", count: 10 },
    { positionIndex: 4, name: "Sujud pertama", count: 10 },
    { positionIndex: 5, name: "Duduk", count: 10 },
    { positionIndex: 6, name: "Sujud kedua", count: 10 },
    { positionIndex: 7, name: "Duduk akhir", count: 10 },
  ],
};

test("Phase 4: Tasbih progress advances through a reviewed position and never exceeds 300", () => {
  let progress = createTasbihProgress(tasbihConfig);
  assert.deepEqual(progress, { completed: 0 });

  for (let count = 0; count < 15; count += 1) {
    progress = advanceTasbihProgress(progress, tasbihConfig);
  }
  assert.equal(progress.completed, 15);
  assert.equal(getTasbihProgressLabel(progress, tasbihConfig), "Rakaat 1 daripada 4 · Rukuk · 0 daripada 10");

  for (let count = 15; count < 310; count += 1) {
    progress = advanceTasbihProgress(progress, tasbihConfig);
  }
  assert.equal(progress.completed, 300);
});

test("Phase 4: Tasbih progress can retreat safely and reset without mutating the reviewed configuration", () => {
  const progress = { completed: 1 };
  assert.deepEqual(retreatTasbihProgress(progress), { completed: 0 });
  assert.deepEqual(retreatTasbihProgress({ completed: 0 }), { completed: 0 });
  assert.deepEqual(resetTasbihProgress(), { completed: 0 });
  assert.equal(tasbihConfig.positions[0].count, 15);
});

test("Phase 4: Reset removes only Solat Sunat data and preserves unrelated origin storage", () => {
  const store = new Map();
  const mockLocalStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
  // @ts-expect-error test mock
  globalThis.window = { localStorage: mockLocalStorage };

  try {
    setStorageItem(STORAGE_KEYS.BOOKMARKS, ["dhuha"]);
    setStorageItem(STORAGE_KEYS.TOOL_PROGRESS, { tasbih: { completed: 12 } });
    setStorageItem("solat_sunat_haptics_enabled", false);
    setStorageItem("another-app-key", { preserved: true });

    assert.equal(clearAllAppData(), true);
    assert.deepEqual(getStorageItem(STORAGE_KEYS.BOOKMARKS, []), []);
    assert.deepEqual(getStorageItem(STORAGE_KEYS.TOOL_PROGRESS, {}), {});
    assert.equal(getStorageItem("solat_sunat_haptics_enabled", true), true);
    assert.deepEqual(getStorageItem("another-app-key", {}), { preserved: true });
  } finally {
    // @ts-expect-error cleanup mock
    delete globalThis.window;
  }
});

test("Phase 4: Service worker creates versioned caches and waits for an explicit refresh command", () => {
  const worker = readFileSync(new URL("../app/sw.ts", import.meta.url), "utf8");
  const builder = readFileSync(new URL("../scripts/build-service-worker.mjs", import.meta.url), "utf8");

  assert.match(worker, /__CACHE_NAME__/);
  assert.match(worker, /SKIP_WAITING/);
  assert.doesNotMatch(worker, /\.then\(\(\) => self\.skipWaiting\(\)\)/);
  assert.match(builder, /createHash/);
  assert.match(builder, /__CACHE_NAME__/);
});

test("Phase 4: Active Tasbih posture index is correctly resolved and bounds-checked", () => {
  assert.equal(getActiveTasbihPositionIndex({ completed: 0 }, tasbihConfig), 1);
  assert.equal(getActiveTasbihPositionIndex({ completed: 14 }, tasbihConfig), 1);
  assert.equal(getActiveTasbihPositionIndex({ completed: 15 }, tasbihConfig), 2);
  assert.equal(getActiveTasbihPositionIndex({ completed: 25 }, tasbihConfig), 3);
  assert.equal(getActiveTasbihPositionIndex({ completed: 300 }, tasbihConfig), 7);
});

test("Phase 4: Takbir progress labels accurately reflect Rakaat 1 and Rakaat 2 boundaries", () => {
  const config = { rakaat1Takbir: 7, rakaat2Takbir: 5 };
  assert.equal(getTakbirProgressLabel(0, config), "Persediaan · Belum memulakan takbir tambahan (0 daripada 12)");
  assert.equal(getTakbirProgressLabel(1, config), "Rakaat 1 · Takbir tambahan ke-1 daripada 7");
  assert.equal(getTakbirProgressLabel(7, config), "Rakaat 1 · Takbir tambahan ke-7 daripada 7");
  assert.equal(getTakbirProgressLabel(8, config), "Rakaat 2 · Takbir tambahan ke-1 daripada 5");
  assert.equal(getTakbirProgressLabel(12, config), "Selesai · 12 daripada 12 takbir disemak");
});
