import { useSyncExternalStore } from "react";

const APP_STORAGE_KEYS = [
  "solat_sunat_prefs_v1",
  "solat_sunat_bookmarks_v1",
  "solat_sunat_tool_progress_v1",
  "solat_sunat_theme",
  "solat_sunat_font_size",
  "solat_sunat_show_rumi",
  "solat_sunat_show_translation",
  "solat_sunat_haptics_enabled",
] as const;

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
    const parsed = JSON.parse(raw) as T;
    memoryCache.set(key, { raw, parsed });
    return parsed;
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
    setStorageItem(key, val);
  };

  return [value, setValue];
}
