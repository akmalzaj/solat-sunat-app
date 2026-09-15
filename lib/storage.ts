import { useSyncExternalStore } from "react";
import { z } from "zod";
import { APP_STORAGE_KEYS, PREFERENCE_KEYS, STORAGE_KEYS } from "./preferences.ts";

/**
 * Per-key runtime schemas. localStorage is an untrusted boundary (corruption,
 * older app versions, other tabs): structurally invalid values fall back to the
 * provided default instead of reaching render code.
 */
const STORED_VALUE_SCHEMAS: Record<string, z.ZodType> = {
  [STORAGE_KEYS.PREFERENCES]: z.object({
    fontSize: z.enum(["kecil", "biasa", "besar"]),
    showRumi: z.boolean(),
    showTranslation: z.boolean(),
    theme: z.enum(["system", "light", "dark"]),
    bookmarks: z.array(z.string()),
  }),
  [STORAGE_KEYS.BOOKMARKS]: z.array(z.string()),
  // Partial-shape by design: unknown keys pass through (never stripped), so
  // progress written by a newer app version survives an older build. One
  // invalid field falls back to the default for the whole key.
  [STORAGE_KEYS.TOOL_PROGRESS]: z.object({
    tasbih: z.object({ completed: z.number().int().min(0) }).optional(),
    takbir: z.record(z.string(), z.number().int().min(0)).optional(),
  }),
  [PREFERENCE_KEYS.THEME]: z.enum(["system", "light", "dark"]),
  [PREFERENCE_KEYS.FONT_SIZE]: z.enum(["kecil", "biasa", "besar"]),
  [PREFERENCE_KEYS.SHOW_RUMI]: z.boolean(),
  [PREFERENCE_KEYS.SHOW_TRANSLATION]: z.boolean(),
  [PREFERENCE_KEYS.HAPTICS_ENABLED]: z.boolean(),
};

/**
 * Safe local storage adapter for client-side persistence.
 * SSR-safe, gracefully handles exceptions (quota exceeded, private browsing, corrupted json).
 */

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const memoryCache = new Map<string, { raw: string | null; parsed: unknown }>();

export function getStorageItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const cached = memoryCache.get(key);
    if (cached && cached.raw === raw) {
      return cached.parsed as T;
    }
    if (raw === null) {
      memoryCache.set(key, { raw: null, parsed: fallback });
      return fallback;
    }
    const parsed: unknown = JSON.parse(raw);
    const schema = STORED_VALUE_SCHEMAS[key];
    if (schema && !schema.safeParse(parsed).success) {
      // Structurally invalid stored value: fall back rather than render untrusted data.
      memoryCache.set(key, { raw, parsed: fallback });
      return fallback;
    }
    memoryCache.set(key, { raw, parsed });
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    memoryCache.set(key, { raw: serialized, parsed: value });
    if (typeof window.dispatchEvent === "function") {
      try {
        window.dispatchEvent(new CustomEvent("solat_sunat_storage", { detail: { key } }));
      } catch {
        // ignore in test or non-dom environments
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(key: string): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.removeItem(key);
    memoryCache.delete(key);
    if (typeof window.dispatchEvent === "function") {
      try {
        window.dispatchEvent(new CustomEvent("solat_sunat_storage", { detail: { key } }));
      } catch {
        // ignore in test or non-dom environments
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function clearAllAppData(): boolean {
  if (!isBrowser()) return false;
  try {
    for (const key of APP_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
      memoryCache.delete(key);
    }
    if (typeof window.dispatchEvent === "function") {
      try {
        window.dispatchEvent(new CustomEvent("solat_sunat_storage", { detail: { key: "*" } }));
      } catch {
        // ignore in test or non-dom environments
      }
    }
    return true;
  } catch {
    return false;
  }
}

function subscribe(callback: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("solat_sunat_storage", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("solat_sunat_storage", callback);
  };
}

export function useStorageState<T>(key: string, fallback: T): [T, (val: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => getStorageItem<T>(key, fallback),
    () => fallback
  );

  const setValue = (val: T) => {
    const persisted = setStorageItem(key, val);
    if (!persisted) {
      // Surface persistence failures (quota exceeded, private browsing) instead of
      // letting the UI state silently diverge from what is actually stored.
      console.error(`Failed to persist "${key}" to local storage; the change will be lost on reload.`);
    }
  };

  return [value, setValue];
}
