"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SolatGuide } from "@/lib/content-schema";
import {
  getTimeSlotFromHour,
  getRecommendationForSlot,
  type TimeSlot,
} from "@/lib/recommendation";
import {
  DEFAULT_PREFERENCES,
  STORAGE_KEYS,
  toggleBookmark,
} from "@/lib/preferences";
import { useStorageState } from "@/lib/storage";

type CategoryFilter = "semua" | "harian" | "malam" | "hajat" | "raya_fenomena";

const TIME_SLOT_REFRESH_MS = 30 * 60 * 1000;

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  semua: "Semua",
  harian: "Harian",
  malam: "Malam & Qiam",
  hajat: "Hajat & Doa",
  raya_fenomena: "Raya & Khusus",
};

interface CatalogViewProps {
  initialGuides: readonly SolatGuide[];
}

export function CatalogView({ initialGuides }: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("semua");
  const [bookmarks, setBookmarks] = useStorageState<string[]>(
    STORAGE_KEYS.BOOKMARKS,
    DEFAULT_PREFERENCES.bookmarks
  );
  // Computed after mount: the device time is unavailable during prerender, and
  // deriving it at build time would freeze the recommendation at the build hour.
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    const updateSlot = () => setTimeSlot(getTimeSlotFromHour(new Date().getHours()));
    updateSlot();
    const interval = setInterval(updateSlot, TIME_SLOT_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBookmark = (slug: string) => {
    const updated = toggleBookmark(bookmarks, slug);
    setBookmarks(updated);
  };

  const recommendation = useMemo(() => {
    if (!timeSlot) return null;
    return getRecommendationForSlot(timeSlot, initialGuides);
  }, [timeSlot, initialGuides]);

  const filteredGuides = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initialGuides.filter((guide) => {
      // Filter category
      if (selectedCategory !== "semua" && guide.category !== selectedCategory) {
        return false;
      }
      // Filter query
      if (!query) return true;
      return (
        guide.title.toLowerCase().includes(query) ||
        guide.slug.toLowerCase().includes(query) ||
        guide.shortPurpose.toLowerCase().includes(query) ||
        guide.category.toLowerCase().includes(query) ||
        guide.titleArabic.includes(query)
      );
    });
  }, [initialGuides, selectedCategory, searchQuery]);

  return (
    <div className="catalog-container">
      {/* Discovery & Filter Bar */}
      <section className="discovery-bar" aria-label="Carian dan kategori">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Cari solat sunat (cth. Dhuha, Tahajjud, Hajat, Witir)..."
            aria-label="Cari solat sunat"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedCategory !== "semua") {
                setSelectedCategory("semua");
              }
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-button"
              onClick={() => setSearchQuery("")}
              aria-label="Padam carian"
            >
              ✕
            </button>
          )}
        </div>

        <div className="category-chips" role="group" aria-label="Kategori solat">
          {(["semua", "harian", "malam", "hajat", "raya_fenomena"] as const).map((category) => (
            <button
              key={category}
              type="button"
              className={`chip ${selectedCategory === category ? "active" : ""}`}
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </section>

      {/* Time-of-day Discovery Suggestion Card (Compact below discovery bar) */}
      {!searchQuery && selectedCategory === "semua" && (
        recommendation ? (
          <section className="recommendation-card" aria-label="Cadangan masa kini">
            <div className="recommendation-header">
              <span className="recommendation-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                CADANGAN WAKTU PERANTI: {recommendation.title.toUpperCase()}
              </span>
            </div>
            <div className="recommendation-links">
              {recommendation.guides.map((g) => (
                <Link key={g.slug} href={`/solat/${g.slug}/`} className="recommendation-chip">
                  <span>{g.title}</span>
                  <span className="recommendation-arrow">→</span>
                </Link>
              ))}
            </div>
            <p className="recommendation-disclaimer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {recommendation.disclaimer}
            </p>
          </section>
        ) : (
          // The recommendation is computed after mount (device time is
          // unavailable during prerender). Reserving its slot keeps the guide
          // grid from shifting when the card appears (CLS above the fold).
          <div className="recommendation-card recommendation-card-placeholder" aria-hidden="true" />
        )
      )}

      {/* Guide Card Grid / Empty State */}
      <section aria-labelledby="catalog-heading">
        <div className="catalog-header-row">
          <h2 id="catalog-heading">
            {searchQuery
              ? `Hasil Carian (${filteredGuides.length})`
              : selectedCategory !== "semua"
              ? `Panduan ${CATEGORY_LABELS[selectedCategory].toUpperCase()} (${filteredGuides.length})`
              : "Semua Panduan Solat Sunat"}
          </h2>
          {searchQuery && (
            <button
              type="button"
              className="text-action-button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("semua");
              }}
            >
              Padam Carian
            </button>
          )}
        </div>

        {filteredGuides.length === 0 ? (
          <div className="empty-state" role="status">
            <div className="empty-state-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h3>Tiada Panduan Ditemui</h3>
            <p>
              Tiada padanan panduan solat sunat ditemui untuk carian &ldquo;{searchQuery}&rdquo;.
              Sila cuba kata kunci lain atau pilih kategori sedia ada.
            </p>
            <button
              type="button"
              className="cta-button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("semua");
              }}
            >
              Padam Carian &amp; Papar Semua
            </button>
          </div>
        ) : (
          <div className="guide-grid">
            {filteredGuides.map((guide) => {
              const bookmarked = bookmarks.includes(guide.slug);
              return (
                <article key={guide.slug} className="guide-card">
                  <div className="guide-card-header">
                    <span className="category-badge">
                      {guide.category.toUpperCase()}
                    </span>
                    <span className="rakaat-badge">{guide.rakaatOptions.join("/")} Rakaat</span>
                  </div>

                  <Link
                    className="guide-card-link"
                    href={`/solat/${guide.slug}/`}
                    aria-label={`Buka panduan ${guide.title}`}
                  >
                    <h3>{guide.title}</h3>
                    <p className="arabic-card-sub" lang="ar" dir="rtl">
                      {guide.titleArabic}
                    </p>
                    <p className="guide-card-summary">{guide.shortPurpose}</p>
                  </Link>

                  <div className="guide-card-footer">
                    <span className={`status-badge ${guide.reviewStatus}`}>
                      {guide.reviewStatus === "needs-review" ? "Belum disemak" : "Disemak"}
                    </span>
                    <div className="guide-card-actions">
                      <button
                        type="button"
                        className={`bookmark-card-button ${bookmarked ? "active" : ""}`}
                        aria-label={bookmarked ? `Nyah tanda buku ${guide.title}` : `Simpan tanda buku ${guide.title}`}
                        onClick={() => handleToggleBookmark(guide.slug)}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill={bookmarked ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                        </svg>
                      </button>
                      <span className="card-cta">Buka →</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
