import { SiteHeader } from "@/components/site-header";
import { CatalogView } from "@/components/discovery/catalog-view";
import { guides } from "@/content/registry";

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
