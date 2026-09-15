export type FontSizeScale = "kecil" | "biasa" | "besar";
export type ThemeMode = "system" | "light" | "dark";

export interface UserPreferences {
  fontSize: FontSizeScale;
  showRumi: boolean;
  showTranslation: boolean;
  theme: ThemeMode;
  bookmarks: string[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  fontSize: "biasa",
  showRumi: true,
  showTranslation: true,
  theme: "system",
  bookmarks: [],
};

export const STORAGE_KEYS = {
  PREFERENCES: "solat_sunat_prefs_v1",
  BOOKMARKS: "solat_sunat_bookmarks_v1",
  TOOL_PROGRESS: "solat_sunat_tool_progress_v1",
} as const;

export const PREFERENCE_KEYS = {
  THEME: "solat_sunat_theme",
  FONT_SIZE: "solat_sunat_font_size",
  SHOW_RUMI: "solat_sunat_show_rumi",
  SHOW_TRANSLATION: "solat_sunat_show_translation",
  HAPTICS_ENABLED: "solat_sunat_haptics_enabled",
} as const;

/** Single source of truth for every local storage key this app owns. */
export const APP_STORAGE_KEYS = [
  STORAGE_KEYS.PREFERENCES,
  STORAGE_KEYS.BOOKMARKS,
  STORAGE_KEYS.TOOL_PROGRESS,
  PREFERENCE_KEYS.THEME,
  PREFERENCE_KEYS.FONT_SIZE,
  PREFERENCE_KEYS.SHOW_RUMI,
  PREFERENCE_KEYS.SHOW_TRANSLATION,
  PREFERENCE_KEYS.HAPTICS_ENABLED,
] as const;

export function clampFontSize(val: unknown): FontSizeScale {
  if (val === "kecil" || val === "biasa" || val === "besar") {
    return val;
  }
  return "biasa";
}

export function isBookmarked(bookmarks: string[], slug: string): boolean {
  return bookmarks.includes(slug);
}

export function toggleBookmark(bookmarks: string[], slug: string): string[] {
  if (bookmarks.includes(slug)) {
    return bookmarks.filter((s) => s !== slug);
  }
  return [...bookmarks, slug];
}
