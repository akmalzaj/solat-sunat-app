"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SolatGuide, SourceItem } from "@/lib/content-schema";
import {
  DEFAULT_PREFERENCES,
  type FontSizeScale,
  PREFERENCE_KEYS,
  STORAGE_KEYS,
  toggleBookmark,
} from "@/lib/preferences";
import { useStorageState } from "@/lib/storage";
import { ReaderToolbar } from "./reader-toolbar";

interface GuideReaderProps {
  guide: SolatGuide;
  primarySource?: SourceItem;
}

export function GuideReader({ guide, primarySource }: GuideReaderProps) {
  const [bookmarks, setBookmarks] = useStorageState<string[]>(
    STORAGE_KEYS.BOOKMARKS,
    DEFAULT_PREFERENCES.bookmarks
  );
  const [fontSize, setFontSize] = useStorageState<FontSizeScale>(
    PREFERENCE_KEYS.FONT_SIZE,
    DEFAULT_PREFERENCES.fontSize
  );
  const [showRumi, setShowRumi] = useStorageState<boolean>(
    PREFERENCE_KEYS.SHOW_RUMI,
    DEFAULT_PREFERENCES.showRumi
  );
  const [showTranslation, setShowTranslation] = useStorageState<boolean>(
    PREFERENCE_KEYS.SHOW_TRANSLATION,
    DEFAULT_PREFERENCES.showTranslation
  );

  const [isKhusyuk, setIsKhusyuk] = useState<boolean>(false);
  const [selectedNiatIndex, setSelectedNiatIndex] = useState<number>(0);

  const isBookmarked = bookmarks.includes(guide.slug);

  // Handle Escape key to exit Mod Khusyuk and toggle body class
  useEffect(() => {
    document.body.classList.toggle("mod-khusyuk-active", isKhusyuk);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isKhusyuk) {
        setIsKhusyuk(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("mod-khusyuk-active");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isKhusyuk]);

  const handleToggleBookmark = () => {
    const updated = toggleBookmark(bookmarks, guide.slug);
    setBookmarks(updated);
  };

  const handleChangeFontSize = (size: FontSizeScale) => {
    setFontSize(size);
  };

  const handleToggleRumi = () => {
    setShowRumi(!showRumi);
  };

  const handleToggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  const handleExitKhusyuk = () => {
    setIsKhusyuk(false);
  };

  const activeNiat = guide.niat[selectedNiatIndex] ?? guide.niat[0];

  return (
    <div className={`guide-reader-root font-size-${fontSize} ${isKhusyuk ? "mod-khusyuk-active" : ""}`}>
      {/* Live Region for Screen-Reader Announcements */}
      <div className="sr-only" aria-live="polite">
        {isKhusyuk ? "Mod Khusyuk diaktifkan. Paparan tenang tanpa gangguan. Tekan Escape untuk keluar." : ""}
      </div>

      {/* Floating High-Contrast Exit Pill in Mod Khusyuk */}
      {isKhusyuk && (
        <div className="khusyuk-exit-bar">
          <button
            type="button"
            className="khusyuk-exit-btn"
            onClick={handleExitKhusyuk}
            aria-label="Keluar daripada Mod Khusyuk"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Keluar Mod Khusyuk (Esc)</span>
          </button>
        </div>
      )}

      {/* Normal Sticky Reader Toolbar */}
      {!isKhusyuk && (
        <ReaderToolbar
          fontSize={fontSize}
          onChangeFontSize={handleChangeFontSize}
          showRumi={showRumi}
          onToggleRumi={handleToggleRumi}
          showTranslation={showTranslation}
          onToggleTranslation={handleToggleTranslation}
          isBookmarked={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
          isKhusyuk={isKhusyuk}
          onToggleKhusyuk={() => setIsKhusyuk(true)}
        />
      )}

      {/* Reader Content Shell */}
      <main className="shell reader">
        {/* Header Metadata */}
        <div className="reader-header">
          <p className="eyebrow">
            {guide.category.toUpperCase()} · {guide.hukum} · {guide.rakaatOptions.join(", ")} RAKAAT
          </p>
          <h1 className="guide-title">{guide.title}</h1>
          <p className="arabic guide-arabic-title" lang="ar" dir="rtl">
            {guide.titleArabic}
          </p>
          <p className="lede">{guide.shortPurpose}</p>
        </div>

        {/* Waktu Pelaksanaan Card */}
        <div className="metadata-banner">
          <svg className="metadata-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div>
            <strong>Waktu Pelaksanaan:</strong> {guide.timeGuidance.description}
          </div>
        </div>

        {/* Notice of Review Status */}
        <aside className="notice" aria-label="Status semakan kandungan">
          <span className="notice-badge">STATUS SEMAKAN</span>
          <p>
            <strong>Status: {guide.reviewStatus === "approved" ? "Telah Diluluskan" : "Dalam Semakan Autoriti"}</strong>.
            Teks ditranskripsi daripada rujukan muktabar Mazhab Syafi&apos;i (JAKIM / Mufti WP).
          </p>
        </aside>

        {/* Section 1: Lafaz Niat */}
        <section aria-labelledby="niat-title" className="reader-section">
          <div className="section-title-row">
            <h2 id="niat-title">Lafaz Niat</h2>
            {guide.niat.length > 1 && (
              <div className="niat-variation-selector" role="group" aria-label="Pilihan lafaz niat">
                {guide.niat.map((n, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-pressed={selectedNiatIndex === idx}
                    className={`variation-tab ${selectedNiatIndex === idx ? "active" : ""}`}
                    onClick={() => setSelectedNiatIndex(idx)}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="recitation-card">
            <div className="recitation-card-badge">
              <span className="rakaat-badge">{activeNiat.label}</span>
            </div>
            <p className="arabic" lang="ar" dir="rtl">
              {activeNiat.arabic}
            </p>
            {showRumi && (
              <p className="recitation-rumi">
                <strong>Rumi:</strong> {activeNiat.rumi}
              </p>
            )}
            {showTranslation && (
              <p className="recitation-translation">
                <strong>Maksud:</strong> &ldquo;{activeNiat.translation}&rdquo;
              </p>
            )}
          </div>
        </section>

        {/* Section 2: Tatacara Pelaksanaan Langkah Demi Langkah */}
        <section aria-labelledby="steps-title" className="reader-section">
          <h2 id="steps-title">Tatacara Pelaksanaan Langkah Demi Langkah</h2>
          <ol className="steps-list">
            {guide.essentialSteps.map((step) => (
              <li key={step.stepNumber} className="step-card">
                <div className="step-card-header">
                  <span className="step-number-indicator">{step.stepNumber}</span>
                  <div className="step-title-wrap">
                    <strong className="step-title-text">{step.title}</strong>
                    {step.isRukun ? (
                      <span className="badge-rukun">Rukun</span>
                    ) : (
                      <span className="badge-sunat">Sunat</span>
                    )}
                  </div>
                </div>

                <p className="step-description">{step.description}</p>

                {step.arabic && (
                  <div className="step-arabic-wrap">
                    <p className="arabic" lang="ar" dir="rtl">
                      {step.arabic}
                    </p>
                    {showRumi && step.rumi && (
                      <p className="recitation-rumi">
                        <strong>Rumi:</strong> {step.rumi}
                      </p>
                    )}
                    {showTranslation && step.translation && (
                      <p className="recitation-translation">
                        <strong>Maksud:</strong> &ldquo;{step.translation}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Section 3: Recommended Practice (Surah & Amalan) */}
        {guide.recommendedPractice.length > 0 && (
          <section aria-labelledby="recommended-title" className="reader-section">
            <h2 id="recommended-title">Amalan Sunat &amp; Surah Pilihan</h2>
            <div className="recommended-list">
              {guide.recommendedPractice.map((rec, idx) => (
                <div key={idx} className="recommended-card">
                  <strong className="recommended-title">{rec.title}</strong>
                  <p className="recommended-desc">{rec.description}</p>
                  {rec.recommendedSurahs.length > 0 && (
                    <div className="surah-chips-wrap">
                      {rec.recommendedSurahs.map((surah, sIdx) => (
                        <span key={sIdx} className="surah-chip">
                          {surah}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Doa & Zikir Khusus */}
        {guide.doa.length > 0 && (
          <section aria-labelledby="doa-title" className="reader-section">
            <h2 id="doa-title">Doa &amp; Zikir Khusus</h2>
            <div className="doa-list">
              {guide.doa.map((d, idx) => (
                <details key={idx} className="doa-accordion" open={idx === 0}>
                  <summary className="doa-accordion-summary">
                    <span className="doa-accordion-title">{d.title}</span>
                    <span className="accordion-chevron" aria-hidden="true">▾</span>
                  </summary>
                  <div className="doa-accordion-content">
                    <p className="arabic" lang="ar" dir="rtl">
                      {d.arabic}
                    </p>
                    {showRumi && (
                      <p className="recitation-rumi">
                        <strong>Rumi:</strong> {d.rumi}
                      </p>
                    )}
                    {showTranslation && (
                      <p className="recitation-translation">
                        <strong>Maksud:</strong> &ldquo;{d.translation}&rdquo;
                      </p>
                    )}
                    <p className="source-citation">
                      Rujukan: {d.sourcePage ?? d.sourceRef}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Amalan Tempatan & Catatan Fiqh */}
        <section aria-labelledby="notes-title" className="reader-section">
          <h2 id="notes-title">Amalan Tempatan &amp; Catatan Fiqh</h2>
          <div className="notes-block">
            <div className="note-row">
              <strong className="note-label">Amalan Tempatan (Malaysia):</strong>
              <p>{guide.commonLocalPractice}</p>
            </div>
            <div className="note-row">
              <strong className="note-label">Catatan &amp; Variasi:</strong>
              <p>{guide.variationsNotes}</p>
            </div>
          </div>
        </section>

        {/* Section 6: Sumber Rujukan & Autoriti */}
        <section aria-labelledby="source-title" className="reader-section">
          <h2 id="source-title">Sumber Rujukan &amp; Autoriti</h2>
          {primarySource ? (
            <div className="source-card">
              <p className="source-title">{primarySource.title}</p>
              <p className="source-meta">
                Pengarang/Penerbit: {primarySource.author} · {primarySource.publisher} ({primarySource.year ?? "Klasik"})
              </p>
              <p className="source-meta">
                Kebenaran/Lesen: {primarySource.licenseOrPermission}
              </p>
              <p className="source-meta">
                Catatan Fiqh: {primarySource.notes}
              </p>
            </div>
          ) : (
            <p>Rujukan Shafi&apos;i muktabar (JAKIM &amp; Pejabat Mufti Wilayah Persekutuan).</p>
          )}
          <p className="meta" style={{ marginTop: "1rem" }}>
            Versi Kandungan: {guide.contentVersion} · Semakan Terakhir: {guide.lastReviewedAt ?? "Belum disemak"} · Disemak oleh: {guide.reviewedBy ?? "Menunggu kelulusan"}
          </p>
          <div style={{ marginTop: "0.75rem" }}>
            <Link href="/bantuan/" className="text-link">
              Lihat Metodologi &amp; Senarai Lengkap Sumber →
            </Link>
          </div>
        </section>

        {/* Extra Bottom Spacing for Khusyuk Buffer */}
        <div className="reader-bottom-buffer" aria-hidden="true" />
      </main>
    </div>
  );
}
