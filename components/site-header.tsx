"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname() || "/";

  const isUtama = pathname === "/";
  const isSimpanan = pathname.startsWith("/simpanan");
  const isAlatan = pathname.startsWith("/alatan");
  const isTetapan = pathname.startsWith("/tetapan");

  return (
    <header className="topbar" role="banner">
      <div className="shell topbar-content">
        <Link className="brand" href="/" aria-label="Halaman Utama Panduan Solat Sunat">
          Panduan Solat Sunat
        </Link>
        <nav className="nav-desktop" aria-label="Navigasi utama">
          <Link href="/" className={`nav-link ${isUtama ? "active" : ""}`} aria-current={isUtama ? "page" : undefined}>Utama</Link>
          <Link href="/simpanan/" className={`nav-link ${isSimpanan ? "active" : ""}`} aria-current={isSimpanan ? "page" : undefined}>Simpanan</Link>
          <Link href="/alatan/" className={`nav-link ${isAlatan ? "active" : ""}`} aria-current={isAlatan ? "page" : undefined}>Alatan</Link>
          <Link href="/tetapan/" className={`nav-link ${isTetapan ? "active" : ""}`} aria-current={isTetapan ? "page" : undefined}>Tetapan</Link>
        </nav>
      </div>
    </header>
  );
}
