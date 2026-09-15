"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  DEFAULT_PREFERENCES,
  type FontSizeScale,
  STORAGE_KEYS,
  type ThemeMode,
} from "@/lib/preferences";
import { clearAllAppData, useStorageState } from "@/lib/storage";

export function SettingsView() {
  const [theme, setTheme] = useStorageState<ThemeMode>("solat_sunat_theme", "system");
  const [fontSize, setFontSize] = useStorageState<FontSizeScale>(
    "solat_sunat_font_size",
    DEFAULT_PREFERENCES.fontSize
  );
  const [showRumi, setShowRumi] = useStorageState<boolean>(
    "solat_sunat_show_rumi",
    DEFAULT_PREFERENCES.showRumi
  );
  const [showTranslation, setShowTranslation] = useStorageState<boolean>(
    "solat_sunat_show_translation",
    DEFAULT_PREFERENCES.showTranslation
  );
  const [bookmarks, setBookmarks] = useStorageState<string[]>(STORAGE_KEYS.BOOKMARKS, []);
  const [hapticsEnabled, setHapticsEnabled] = useStorageState<boolean>("solat_sunat_haptics_enabled", true);
  const prefersReducedMotion = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => {
      if (typeof window === "undefined" || !window.matchMedia) return false;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
    () => false
  );
  const [resetMessage, setResetMessage] = useState<string>("");

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (newTheme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  const handleFontSizeChange = (size: FontSizeScale) => {
    setFontSize(size);
  };

  const handleToggleRumi = () => {
    setShowRumi(!showRumi);
  };

  const handleToggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Adakah anda pasti ingin memadam semua data tetapan dan penanda buku tempatan? Tindakan ini tidak boleh diundur."
      )
    ) {
      clearAllAppData();
      document.documentElement.removeAttribute("data-theme");
      setTheme("system");
      setFontSize("biasa");
      setShowRumi(true);
      setShowTranslation(true);
      setBookmarks([]);
      setResetMessage("Semua data tempatan telah berjaya dipadam.");
      setTimeout(() => setResetMessage(""), 4000);
    }
  };

  return (
    <div className="settings-container">
      {resetMessage && (
        <aside className="notice" role="status" aria-live="polite">
          <span className="notice-badge">PEMBERITAHUAN</span>
          <p>{resetMessage}</p>
        </aside>
      )}

      {/* Bahagian 1: Tema Paparan */}
      <section className="settings-section" aria-labelledby="theme-title">
        <h2 id="theme-title">Tema &amp; Paparan Warna</h2>
        <p className="meta">Pilih suasana visual mengikut keselesaan mata anda ketika membaca.</p>
        <div className="theme-toggle-group" role="group" aria-label="Pilihan tema">
          <button
            type="button"
            className={`theme-pill ${theme === "system" ? "active" : ""}`}
            onClick={() => handleThemeChange("system")}
          >
            Ikut Sistem
          </button>
          <button
            type="button"
            className={`theme-pill ${theme === "light" ? "active" : ""}`}
            onClick={() => handleThemeChange("light")}
          >
            Terang (Parchment)
          </button>
          <button
            type="button"
            className={`theme-pill ${theme === "dark" ? "active" : ""}`}
            onClick={() => handleThemeChange("dark")}
          >
            Gelap (Forest Night)
          </button>
        </div>
      </section>

      {/* Bahagian 2: Tipografi Arab & Bacaan */}
      <section className="settings-section" aria-labelledby="typography-title">
        <h2 id="typography-title">Tipografi Arab &amp; Lapisan Bacaan</h2>
        <p className="meta">Tetapan lalai untuk pembacaan teks Arab, Rumi, dan terjemahan.</p>

        <div className="setting-item">
          <div className="setting-info">
            <strong>Saiz Fon Arab Lalai</strong>
            <p className="meta">Saiz teks al-Quran dan zikir pada halaman panduan.</p>
          </div>
          <div className="font-size-pills" role="group" aria-label="Saiz fon Arab lalai">
            <button
              type="button"
              className={`pill-btn ${fontSize === "kecil" ? "active" : ""}`}
              onClick={() => handleFontSizeChange("kecil")}
            >
              Kecil (1.5rem)
            </button>
            <button
              type="button"
              className={`pill-btn ${fontSize === "biasa" ? "active" : ""}`}
              onClick={() => handleFontSizeChange("biasa")}
            >
              Biasa (2.0rem)
            </button>
            <button
              type="button"
              className={`pill-btn ${fontSize === "besar" ? "active" : ""}`}
              onClick={() => handleFontSizeChange("besar")}
            >
              Besar (2.8rem)
            </button>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <strong>Teks Rumi (Transliterasi)</strong>
            <p className="meta">Paparkan panduan sebutan rumi di bawah teks Arab secara lalai.</p>
          </div>
          <button
            type="button"
            className={`toggle-switch-btn ${showRumi ? "active" : ""}`}
            onClick={handleToggleRumi}
            aria-pressed={showRumi}
          >
            {showRumi ? "Aktif (Dipapar)" : "Dinyahaktif (Disorok)"}
          </button>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <strong>Terjemahan Bahasa Melayu</strong>
            <p className="meta">Paparkan maksud bacaan dan doa dalam Bahasa Melayu secara lalai.</p>
          </div>
          <button
            type="button"
            className={`toggle-switch-btn ${showTranslation ? "active" : ""}`}
            onClick={handleToggleTranslation}
            aria-pressed={showTranslation}
          >
            {showTranslation ? "Aktif (Dipapar)" : "Dinyahaktif (Disorok)"}
          </button>
        </div>
      </section>

      {/* Bahagian 3: Kebolehcapaian & Animasi */}
      <section className="settings-section" aria-labelledby="a11y-title">
        <h2 id="a11y-title">Kebolehcapaian &amp; Pergerakan</h2>
        <div className="setting-item">
          <div className="setting-info">
            <strong>Mod Kurang Pergerakan (Prefers Reduced Motion)</strong>
            <p className="meta">
              {prefersReducedMotion
                ? "Dikesan daripada peranti: Animasi peralihan dimatikan untuk ketenangan mata."
                : "Animasi ringkas dan lembut aktif. Aplikasi ini mengikut tetapan peranti anda."}
            </p>
          </div>
          <span className="category-badge">
            {prefersReducedMotion ? "Aktif" : "Standard"}
          </span>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <strong>Maklum Balas Getaran Alatan</strong>
            <p className="meta">Getaran ringkas hanya digunakan apabila peranti menyokongnya; ia tidak diperlukan untuk menggunakan alatan.</p>
          </div>
          <button type="button" className={`toggle-switch-btn ${hapticsEnabled ? "active" : ""}`} onClick={() => setHapticsEnabled(!hapticsEnabled)} aria-pressed={hapticsEnabled}>
            {hapticsEnabled ? "Aktif" : "Dinyahaktif"}
          </button>
        </div>
      </section>

      {/* Bahagian 4: Pengurusan Data Tempatan */}
      <section className="settings-section" aria-labelledby="storage-title">
        <h2 id="storage-title">Pengurusan Data Tempatan</h2>
        <p className="meta">
          Aplikasi ini beroperasi 100% di luar talian tanpa pelayan jauh atau akaun pengguna. Semua simpanan dan tetapan disimpan terus dalam peranti anda.
        </p>
        <div className="setting-item">
          <div className="setting-info">
            <strong>Panduan Disimpan</strong>
            <p className="meta">{bookmarks.length} panduan disimpan dalam simpanan luar talian.</p>
          </div>
          <Link href="/simpanan/" className="text-link">
            Buka Simpanan →
          </Link>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="danger-button"
            onClick={handleResetData}
          >
            Padam Semua Data &amp; Tetapan
          </button>
        </div>
      </section>

      {/* Bahagian 5: Metodologi & Tadbir Urus Fiqh */}
      <section className="settings-section" aria-labelledby="governance-title">
        <h2 id="governance-title">Metodologi Fiqh &amp; Maklumat Aplikasi</h2>
        <div className="governance-card">
          <p>
            <strong>Mazhab Rujukan:</strong> Mazhab Syafi&apos;i muktabar berpandukan penerbitan rasmi Jabatan Kemajuan Islam Malaysia (JAKIM) dan Pejabat Mufti Wilayah Persekutuan.
          </p>
          <p className="meta" style={{ marginTop: "0.5rem" }}>
            Versi Aplikasi: 1.0.0 (Fasa 3 Core Reading Experience) · Dilesenkan untuk bimbingan ibadah umum.
          </p>
          <div style={{ marginTop: "0.75rem" }}>
            <Link href="/bantuan/" className="cta-button secondary">
              Lihat Metodologi Penuh &amp; Rujukan Sumber →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
