import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BookmarksView } from "@/components/bookmarks/bookmarks-view";
import { guides } from "@/content/registry";

export const metadata: Metadata = {
  alternates: { canonical: "/simpanan/" },
  title: "Simpanan Panduan Luar Talian (Offline)",
  description: "Senarai panduan solat sunat yang disimpan untuk capaian pantas tanpa sambungan internet.",
};

export default function SimpananPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell reader">
        <Link className="back" href="/">← Kembali ke halaman utama</Link>
        <h1 className="eyebrow page-title">Simpanan Panduan Luar Talian (Offline)</h1>
        <p className="lede">
          Capaian pantas tanpa internet untuk panduan yang kerap anda amalkan.
        </p>

        {/* Real guides only: a bookmark persisted before the sample was hidden
            from discovery is silently ignored instead of resurfacing it here. */}
        <BookmarksView guides={guides} />
      </main>
    </>
  );
}
