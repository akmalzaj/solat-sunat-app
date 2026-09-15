import assert from "node:assert/strict";
import test from "node:test";
import {
  trackAppDataReset,
  trackBookmarkAdded,
  trackBookmarksClearedAll,
  trackEvent,
  trackGuideOpen,
  trackKhusyukModeEnter,
  trackReadingComplete,
  trackSearch,
  trackTasbihComplete,
  trackBookmarkRemoved,
  trackTakbirComplete,
  trackPwaUpdateApply,
} from "../lib/analytics.ts";

const SAVED_ENV = {
  nodeEnv: process.env.NODE_ENV,
  gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
};

/** Run with production analytics env and a mock window capturing gtag commands. */
function withAnalyticsEnv(run) {
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST-ID";
  const mockWindow = { dataLayer: [] };
  // @ts-expect-error test mock
  globalThis.window = mockWindow;
  try {
    run(mockWindow);
  } finally {
    // @ts-expect-error cleanup mock
    delete globalThis.window;
    process.env.NODE_ENV = SAVED_ENV.nodeEnv;
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = SAVED_ENV.gaId;
  }
}

/** Read the pushed gtag commands: each dataLayer entry is an `arguments`
 * object of the form [command, eventName, params]. */
function readCommands(mockWindow) {
  return mockWindow.dataLayer.map((entry) => Array.from(entry));
}

const GUIDE = { slug: "dhuha", title: "Solat Sunat Dhuha", category: "harian" };

test("Analytics: trackEvent pushes a gtag command to the data layer in production", () => {
  withAnalyticsEnv((mockWindow) => {
    // Act
    trackEvent("custom_event", { slug: "dhuha", count: 2 });

    // Assert
    assert.deepEqual(readCommands(mockWindow), [
      ["event", "custom_event", { slug: "dhuha", count: 2 }],
    ]);
  });
});

test("Analytics: trackEvent is a no-op outside production builds", () => {
  withAnalyticsEnv(() => {
    process.env.NODE_ENV = "development";
    // @ts-expect-error reassigning global window for the missing-id scenario
    const mockWindow = { dataLayer: [] };
    globalThis.window = mockWindow;
    trackEvent("custom_event");
    assert.equal(mockWindow.dataLayer.length, 0);
  });
});

test("Analytics: trackEvent is a no-op without a configured measurement ID", () => {
  withAnalyticsEnv((mockWindow) => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    trackEvent("custom_event");
    assert.equal(mockWindow.dataLayer.length, 0);
  });
});

test("Analytics: trackEvent never throws when window is unavailable (SSR)", () => {
  withAnalyticsEnv(() => {
    // The mock window is not installed in this test.
    trackEvent("custom_event");
    // Reaching this line means no throw.
    assert.ok(true);
  });
});

test("Analytics: bookmark helpers carry guide context and source surface", () => {
  withAnalyticsEnv((mockWindow) => {
    // Act
    trackBookmarkAdded(GUIDE, "reader");
    trackBookmarkRemoved(GUIDE, "simpanan");

    // Assert
    const commands = readCommands(mockWindow);
    assert.equal(commands.length, 2);
    assert.deepEqual(commands[0], [
      "event",
      "bookmark_add",
      { slug: "dhuha", guide_title: "Solat Sunat Dhuha", category: "harian", source: "reader" },
    ]);
    assert.deepEqual(commands[1], [
      "event",
      "bookmark_remove",
      { slug: "dhuha", guide_title: "Solat Sunat Dhuha", category: "harian", source: "simpanan" },
    ]);
  });
});

test("Analytics: bookmarks_clear_all reports how many were removed", () => {
  withAnalyticsEnv((mockWindow) => {
    trackBookmarksClearedAll(3);
    assert.deepEqual(readCommands(mockWindow), [
      ["event", "bookmarks_clear_all", { count_removed: 3 }],
    ]);
  });
});

test("Analytics: search uses the GA4 recommended event shape", () => {
  withAnalyticsEnv((mockWindow) => {
    trackSearch("dhuha", 2);
    assert.deepEqual(readCommands(mockWindow), [
      ["event", "search", { search_term: "dhuha", result_count: 2 }],
    ]);
  });
});

test("Analytics: guide_open records the discovery entry point and time slot", () => {
  withAnalyticsEnv((mockWindow) => {
    trackGuideOpen("dhuha", "search");
    trackGuideOpen("witir", "recommendation", "malam");
    const commands = readCommands(mockWindow);
    assert.deepEqual(commands[0], ["event", "guide_open", { slug: "dhuha", entry: "search" }]);
    assert.deepEqual(commands[1], [
      "event",
      "guide_open",
      { slug: "witir", entry: "recommendation", time_slot: "malam" },
    ]);
  });
});

test("Analytics: reading_complete, khusyuk_mode_enter and tool completions report guide context", () => {
  withAnalyticsEnv((mockWindow) => {
    trackReadingComplete(GUIDE);
    trackKhusyukModeEnter("dhuha");
    trackTasbihComplete(33, 33);
    trackTakbirComplete("aidilfitri", 9, 9);
    const commands = readCommands(mockWindow);
    assert.deepEqual(commands[0], [
      "event",
      "reading_complete",
      { slug: "dhuha", guide_title: "Solat Sunat Dhuha", category: "harian" },
    ]);
    assert.deepEqual(commands[1], ["event", "khusyuk_mode_enter", { slug: "dhuha" }]);
    assert.deepEqual(commands[2], ["event", "tasbih_complete", { completed: 33, total: 33 }]);
    assert.deepEqual(commands[3], [
      "event",
      "takbir_complete",
      { slug: "aidilfitri", completed: 9, total: 9 },
    ]);
  });
});

test("Analytics: destructive and PWA lifecycle events are reported", () => {
  withAnalyticsEnv((mockWindow) => {
    trackAppDataReset(5);
    trackPwaUpdateApply();
    const commands = readCommands(mockWindow);
    assert.deepEqual(commands[0], ["event", "app_data_reset", { bookmarks_lost: 5 }]);
    assert.deepEqual(commands[1], ["event", "pwa_update_apply", {}]);
  });
});