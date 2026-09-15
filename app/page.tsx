import { SiteHeader } from "@/components/site-header";
import { CatalogView } from "@/components/discovery/catalog-view";
import { allGuides } from "@/content/registry";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Fasa 3 · Pengalaman Pembacaan Muktabar</p>
          <h1 id="page-title">Panduan yang tenang, jelas, dan tersedia selepas dimuat turun.</h1>
          <p className="lede">
            Panduan 19 solat sunat muktabar Mazhab Syafi&apos;i dengan lafaz niat, tatacara langkah demi langkah, bacaan bertanda baris, dan doa pilihan.
          </p>
          <aside className="notice" aria-label="Status kandungan">
            <span className="notice-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              PERINGATAN STATUS
            </span>
            <p>
              <strong>Belum untuk rujukan ibadah.</strong> Semua kandungan agama menunggu semakan sumber dan kelulusan pihak berautoriti seperti yang ditetapkan dalam pelan pelaksanaan.
            </p>
          </aside>
        </section>

        {/* Carian pantas & kategori: Cari solat sunat, Semua, Waktu, Hajat/Doa, Rawatib, Khusus */}
        <CatalogView initialGuides={allGuides} />
      </main>
    </>
  );
}
