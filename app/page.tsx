import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CatalogView } from "@/components/discovery/catalog-view";
import { guides } from "@/content/registry";

// Declared on the page, not the layout: layout-level metadata is inherited by
// every route, and the noindex sample guide must not pick up a canonical
// (noindex + canonical to elsewhere is a conflicting indexing signal).
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="hero" aria-labelledby="page-title">
          <h1 id="page-title" className="eyebrow page-title">
            Panduan Solat Sunat Muktabar,
            <br />
            Fardhu Kifayah Beserta Doa Pilihan
          </h1>
        </section>

        {/* Carian pantas & kategori: Cari solat sunat, Semua, Waktu, Hajat/Doa, Rawatib, Khusus.
            Real guides only — the structural sample stays reachable at its route but is
            excluded from discovery (catalog, search, categories, bookmarking). */}
        <CatalogView initialGuides={guides} />
      </main>
    </>
  );
}
