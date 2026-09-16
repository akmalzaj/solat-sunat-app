"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { FontSizeScale } from "@/lib/preferences";

interface ReaderToolbarProps {
  fontSize: FontSizeScale;
  onChangeFontSize: (size: FontSizeScale) => void;
  showRumi: boolean;
  onToggleRumi: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isKhusyuk: boolean;
  onToggleKhusyuk: () => void;
}

export function ReaderToolbar({
  fontSize,
  onChangeFontSize,
  showRumi,
  onToggleRumi,
  showTranslation,
  onToggleTranslation,
  isBookmarked,
  onToggleBookmark,
  isKhusyuk,
  onToggleKhusyuk,
}: ReaderToolbarProps) {
  const [displayDrawerOpen, setDisplayDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const closeDisplayDrawer = useCallback(() => {
    setDisplayDrawerOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!displayDrawerOpen) return;
    // Move focus into the dialog so keyboard users are not stranded on the trigger.
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDisplayDrawer();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    // The trigger is hidden at >=640px; never leave a hidden dialog open.
    const desktopQuery = window.matchMedia("(min-width: 640px)");
    const onDesktopChange = () => setDisplayDrawerOpen(false);
    desktopQuery.addEventListener("change", onDesktopChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktopQuery.removeEventListener("change", onDesktopChange);
    };
  }, [displayDrawerOpen, closeDisplayDrawer]);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const displayDrawer = displayDrawerOpen && (
    <>
      <div
        className="display-popover-backdrop"
        onClick={closeDisplayDrawer}
        aria-hidden="true"
      />
      <div
        className="display-popover"
        role="dialog"
        aria-modal="true"
        aria-label="Tetapan paparan bacaan"
        ref={dialogRef}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="popover-row">
          <span className="popover-label">Saiz Fon Arab:</span>
          <div className="font-size-pills" role="group" aria-label="Saiz fon Arab">
            <button
              type="button"
              className={`pill-btn ${fontSize === "kecil" ? "active" : ""}`}
              onClick={() => onChangeFontSize("kecil")}
              aria-pressed={fontSize === "kecil"}
            >
              Kecil
            </button>
            <button
              type="button"
              className={`pill-btn ${fontSize === "biasa" ? "active" : ""}`}
              onClick={() => onChangeFontSize("biasa")}
              aria-pressed={fontSize === "biasa"}
            >
              Biasa
            </button>
            <button
              type="button"
              className={`pill-btn ${fontSize === "besar" ? "active" : ""}`}
              onClick={() => onChangeFontSize("besar")}
              aria-pressed={fontSize === "besar"}
            >
              Besar
            </button>
          </div>
        </div>

        <div className="popover-row">
          <span className="popover-label">Teks Rumi:</span>
          <button
            type="button"
            className={`toggle-switch-btn ${showRumi ? "active" : ""}`}
            onClick={onToggleRumi}
            aria-pressed={showRumi}
          >
            {showRumi ? "Dipaparkan" : "Disorok"}
          </button>
        </div>

        <div className="popover-row">
          <span className="popover-label">Terjemahan Melayu:</span>
          <button
            type="button"
            className={`toggle-switch-btn ${showTranslation ? "active" : ""}`}
            onClick={onToggleTranslation}
            aria-pressed={showTranslation}
          >
            {showTranslation ? "Dipaparkan" : "Disorok"}
          </button>
        </div>

        <button
          type="button"
          className="popover-close-btn"
          onClick={closeDisplayDrawer}
        >
          Tutup Pilihan
        </button>
      </div>
    </>
  );

  return (
    <header className="sticky-reader-toolbar" role="region" aria-label="Alat bantuan pembaca">
      <div className="shell reader-toolbar-inner">
        {/* Back Link */}
        <Link href="/" className="toolbar-back-link" aria-label="Kembali ke halaman utama">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="back-text">Kembali</span>
        </Link>

        {/* Action Controls */}
        <div className="toolbar-actions">
          {/* Mobile Display Drawer Trigger (< 640px) */}
          <div className="mobile-display-trigger-wrap">
            <button
              type="button"
              className={`toolbar-btn ${displayDrawerOpen ? "active" : ""}`}
              onClick={() => setDisplayDrawerOpen((prev) => !prev)}
              aria-label="Pilihan paparan dan saiz tulisan"
              aria-expanded={displayDrawerOpen}
              ref={triggerRef}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Paparan</span>
            </button>

            {/* Accessible modal, portaled to <body> so it escapes the sticky
                toolbar's stacking context (the bottom nav stays under it). */}
            {displayDrawer && createPortal(displayDrawer, document.body)}
          </div>

          {/* Desktop/Tablet Inline Display Controls (>= 640px) */}
          <div className="desktop-display-controls">
            <div className="font-size-group" role="group" aria-label="Saiz fon Arab">
              <button
                type="button"
                className={`toolbar-pill ${fontSize === "kecil" ? "active" : ""}`}
                onClick={() => onChangeFontSize("kecil")}
                title="Saiz teks kecil (1.5rem)"
              >
                A-
              </button>
              <button
                type="button"
                className={`toolbar-pill ${fontSize === "biasa" ? "active" : ""}`}
                onClick={() => onChangeFontSize("biasa")}
                title="Saiz teks biasa (2.0rem)"
              >
                A
              </button>
              <button
                type="button"
                className={`toolbar-pill ${fontSize === "besar" ? "active" : ""}`}
                onClick={() => onChangeFontSize("besar")}
                title="Saiz teks besar (2.8rem)"
              >
                A+
              </button>
            </div>

            <button
              type="button"
              className={`toolbar-pill ${showRumi ? "active" : ""}`}
              onClick={onToggleRumi}
              aria-pressed={showRumi}
              title="Papar/Sorok Rumi"
            >
              Rumi
            </button>

            <button
              type="button"
              className={`toolbar-pill ${showTranslation ? "active" : ""}`}
              onClick={onToggleTranslation}
              aria-pressed={showTranslation}
              title="Papar/Sorok Terjemahan"
            >
              Maksud
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            className={`toolbar-btn ${isBookmarked ? "bookmarked" : ""}`}
            onClick={onToggleBookmark}
            aria-label={isBookmarked ? "Padam dari simpanan" : "Simpan panduan ini"}
            aria-pressed={isBookmarked}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isBookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            <span className="btn-label">{isBookmarked ? "Tersimpan" : "Simpan"}</span>
          </button>

          {/* Mod Khusyuk Focus Toggle */}
          <button
            type="button"
            className={`toolbar-btn khusyuk-trigger ${isKhusyuk ? "active" : ""}`}
            onClick={onToggleKhusyuk}
            aria-label="Mod Khusyuk (Paparan Fokus Tenang)"
            aria-pressed={isKhusyuk}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
              <path d="M21 3l-7 7" />
              <path d="M3 21l7-7" />
            </svg>
            <span className="btn-label">Mod Khusyuk</span>
          </button>
        </div>
      </div>
    </header>
  );
}