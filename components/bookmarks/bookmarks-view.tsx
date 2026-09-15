"use client";

import Link from "next/link";
import type { SolatGuide } from "@/lib/content-schema";
import {
  DEFAULT_PREFERENCES,
  STORAGE_KEYS,
  toggleBookmark,
} from "@/lib/preferences";
import { useStorageState } from "@/lib/storage";

interface BookmarksViewProps {
  allGuides: readonly SolatGuide[];
}

export function BookmarksView({ allGuides }: BookmarksViewProps) {
  const [bookmarks, setBookmarks] = useStorageState<string[]>(
    STORAGE_KEYS.BOOKMARKS,
    DEFAULT_PREFERENCES.bookmarks
  );

  const handleToggleBookmark = (slug: string) => {
    const updated = toggleBookmark(bookmarks, slug);
    setBookmarks(updated);
  };

  const handleClearAll = () => {
    if (window.confirm("Adakah anda pasti ingin mengosongkan semua panduan yang disimpan?")) {
      setBookmarks([]);
    }
  };

  const bookmarkedGuides = allGuides.filter((g) => bookmarks.includes(g.slug));

  if (bookmarkedGuides.length === 0) {
    return (
      <div className="empty-state" role="status">
        <div className="empty-state-icon" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
        </div>
        <h2>Belum Ada Panduan Disimpan</h2>
        <p>
          Tekan ikon bintang pada mana-mana panduan solat sunat untuk menyimpannya ke dalam peranti ini bagi capaian pantas tanpa sambungan internet.
        </p>
        <Link href="/" className="cta-button">
          Terokai Panduan Solat →
        </Link>
      </div>
    );
  }

  return (
    <div className="bookmarks-container">
      <div className="catalog-header-row">
        <h2>{bookmarkedGuides.length} Panduan Tersimpan</h2>
        <button
          type="button"
          className="text-action-button danger"
          onClick={handleClearAll}
        >
          Kosongkan Semua
        </button>
      </div>

      <div className="guide-grid">
        {bookmarkedGuides.map((guide) => (
          <article key={guide.slug} className="guide-card">
            <div className="guide-card-header">
              <span className="category-badge">{guide.category.toUpperCase()}</span>
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
              <button
                type="button"
                className="bookmark-card-button active"
                aria-label={`Padam tanda buku ${guide.title}`}
                onClick={() => handleToggleBookmark(guide.slug)}
                title="Padam daripada simpanan"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                </svg>
              </button>
              <span className="card-cta">Buka panduan →</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
