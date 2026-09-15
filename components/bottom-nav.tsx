"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname() || "/";

  const isUtama = pathname === "/";
  const isSimpanan = pathname.startsWith("/simpanan");
  const isAlatan = pathname.startsWith("/alatan");
  const isTetapan = pathname.startsWith("/tetapan");

  return (
    <nav className="bottom-nav" aria-label="Navigasi mudah alih">
      <Link
        href="/"
        className={`bottom-nav-item ${isUtama ? "active" : ""}`}
        aria-label="Utama"
        aria-current={isUtama ? "page" : undefined}
      >
        <svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Utama</span>
      </Link>
      <Link
        href="/simpanan/"
        className={`bottom-nav-item ${isSimpanan ? "active" : ""}`}
        aria-label="Simpanan"
        aria-current={isSimpanan ? "page" : undefined}
      >
        <svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
        <span>Simpanan</span>
      </Link>
      <Link
        href="/alatan/"
        className={`bottom-nav-item ${isAlatan ? "active" : ""}`}
        aria-label="Alatan"
        aria-current={isAlatan ? "page" : undefined}
      >
        <svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="m12 6 4 6h-8z" />
        </svg>
        <span>Alatan</span>
      </Link>
      <Link
        href="/tetapan/"
        className={`bottom-nav-item ${isTetapan ? "active" : ""}`}
        aria-label="Tetapan"
        aria-current={isTetapan ? "page" : undefined}
      >
        <svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span>Tetapan</span>
      </Link>
    </nav>
  );
}
