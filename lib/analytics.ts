/**
 * GA4 custom event tracking for SolatWiki.
 *
 * Event registry (keep this list in sync with the GA4 Admin custom dimensions):
 * - bookmark_add / bookmark_remove  { slug, guide_title, category, source }
 * - bookmarks_clear_all             { count_removed }
 * - search (GA4 recommended event)  { search_term, result_count }
 * - guide_open                      { slug, entry, time_slot? }
 * - reading_complete                { slug, guide_title, category }
 * - khusyuk_mode_enter              { slug }
 * - tasbih_complete                 { completed, total }
 * - takbir_complete                 { slug, completed, total }
 * - app_data_reset                  { bookmarks_lost }
 * - pwa_update_apply                {}
 *
 * Events are queued on window.dataLayer in the gtag command format consumed by
 * gtag.js (loaded via the GoogleAnalytics component in app/layout.tsx).
 */

/** Parameter values GA4 accepts; string values are truncated at 100 chars server-side. */
type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

interface TrackableGuide {
  slug: string;
  title: string;
  category: string;
}

export type BookmarkSource = "reader" | "catalog" | "simpanan";
export type GuideOpenEntry = "browse" | "category" | "recommendation" | "search" | "simpanan";

const GA_EVENT_NAMES = {
  appDataReset: "app_data_reset",
  bookmarkAdd: "bookmark_add",
  bookmarkRemove: "bookmark_remove",
  bookmarksClearAll: "bookmarks_clear_all",
  guideOpen: "guide_open",
  khusyukModeEnter: "khusyuk_mode_enter",
  pwaUpdateApply: "pwa_update_apply",
  readingComplete: "reading_complete",
  search: "search",
  takbirComplete: "takbir_complete",
  tasbihComplete: "tasbih_complete",
} as const;

function isAnalyticsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
  );
}

/**
 * Queue a GA4 event. No-op outside production or without a measurement ID;
 * must never throw — analytics must not break the user experience.
 */
export function trackEvent(name: string, params: AnalyticsEventParams = {}): void {
  if (!isAnalyticsEnabled() || typeof window === "undefined") return;
  try {
    const w = window as Window & { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    // Mirrors the official gtag snippet: gtag.js consumes dataLayer entries
    // pushed as the `arguments` object of a gtag() call, not plain arrays.
    function gtag(..._args: unknown[]): void {
      w.dataLayer?.push(arguments);
    }
    gtag("event", name, params);
  } catch {
    // Swallow intentionally: a tracking failure must never surface in the UI.
  }
}

export function trackBookmarkAdded(guide: TrackableGuide, source: BookmarkSource): void {
  trackEvent(GA_EVENT_NAMES.bookmarkAdd, {
    slug: guide.slug,
    guide_title: guide.title,
    category: guide.category,
    source,
  });
}

export function trackBookmarkRemoved(guide: TrackableGuide, source: BookmarkSource): void {
  trackEvent(GA_EVENT_NAMES.bookmarkRemove, {
    slug: guide.slug,
    guide_title: guide.title,
    category: guide.category,
    source,
  });
}

export function trackBookmarksClearedAll(countRemoved: number): void {
  trackEvent(GA_EVENT_NAMES.bookmarksClearAll, { count_removed: countRemoved });
}

/** Uses the GA4 recommended `search` event so its `search_term` reporting works out of the box. */
export function trackSearch(searchTerm: string, resultCount: number): void {
  trackEvent(GA_EVENT_NAMES.search, {
    search_term: searchTerm,
    result_count: resultCount,
  });
}

export function trackGuideOpen(slug: string, entry: GuideOpenEntry, timeSlot?: string): void {
  trackEvent(GA_EVENT_NAMES.guideOpen, {
    slug,
    entry,
    ...(timeSlot ? { time_slot: timeSlot } : {}),
  });
}

export function trackReadingComplete(guide: TrackableGuide): void {
  trackEvent(GA_EVENT_NAMES.readingComplete, {
    slug: guide.slug,
    guide_title: guide.title,
    category: guide.category,
  });
}

export function trackKhusyukModeEnter(slug: string): void {
  trackEvent(GA_EVENT_NAMES.khusyukModeEnter, { slug });
}

export function trackTasbihComplete(completed: number, total: number): void {
  trackEvent(GA_EVENT_NAMES.tasbihComplete, { completed, total });
}

export function trackTakbirComplete(slug: string, completed: number, total: number): void {
  trackEvent(GA_EVENT_NAMES.takbirComplete, { slug, completed, total });
}

export function trackAppDataReset(bookmarksLost: number): void {
  trackEvent(GA_EVENT_NAMES.appDataReset, { bookmarks_lost: bookmarksLost });
}

export function trackPwaUpdateApply(): void {
  trackEvent(GA_EVENT_NAMES.pwaUpdateApply, {});
}