import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BookmarksView } from "@/components/bookmarks/bookmarks-view";
import { allGuides } from "@/content/registry";

export const metadata: Metadata = {
  title: "Simpanan Luar Talian",
  description: "Senarai panduan solat sunat yang disimpan untuk capaian pantas tanpa sambungan internet.",
};

export default function SimpananPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell reader">
        <Link className="back" href="/">← Kembali ke halaman utama</Link>
        <p className="eyebrow">Simpanan Luar Talian</p>
        <h1>Panduan yang Disimpan</h1>
        <p className="lede">
          Capaian pantas tanpa sambungan internet untuk panduan yang kerap anda amalkan di surau, masjid, atau ketika bermusafir.
        </p>

        <BookmarksView allGuides={allGuides} />
      </main>
    </>
  );
}
