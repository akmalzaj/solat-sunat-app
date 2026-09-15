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

export const APP_STORAGE_KEYS = [
  STORAGE_KEYS.PREFERENCES,
  STORAGE_KEYS.BOOKMARKS,
  STORAGE_KEYS.TOOL_PROGRESS,
  "solat_sunat_theme",
  "solat_sunat_font_size",
  "solat_sunat_show_rumi",
  "solat_sunat_show_translation",
  "solat_sunat_haptics_enabled",
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
