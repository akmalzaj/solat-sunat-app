import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { sources } from "@/content/registry";

export const metadata: Metadata = {
  title: "Bantuan, Metodologi & Sumber",
  description: "Metodologi penyusunan panduan ibadah, daftar sumber rujukan muktabar, dan saluran maklum balas.",
};

export default function BantuanPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell reader">
        <Link className="back" href="/">← Kembali ke halaman utama</Link>
        <p className="eyebrow">Tadbir Urus &amp; Metodologi</p>
        <h1>Bantuan, Sumber &amp; Metodologi Fiqh</h1>
        <p className="lede">
          SolatWiki dibangunkan khusus berpandukan Mazhab Syafi&apos;i yang menjadi amalan rasmi umat Islam di Malaysia.
        </p>

        <aside className="notice" aria-label="Penafian autoriti agama">
          <span className="notice-badge">PENAFIAN &amp; SKOP</span>
          <p>
            <strong>Bukan Pengeluar Fatwa.</strong> Aplikasi ini merupakan alat bantuan rujukan dan pembelajaran semata-mata. Ia sama sekali tidak menggantikan fatwa rasmi atau bimbingan langsung daripada alim ulama dan pihak berkuasa agama negeri.
          </p>
        </aside>

        <section aria-labelledby="methodology-title">
          <h2 id="methodology-title">Metodologi Penyusunan Kandungan (Fasa 2)</h2>
          <ol style={{ paddingLeft: "1.25rem" }}>
            <li style={{ marginBottom: "0.75rem" }}>
              <strong>Teks Arab Berbaris Sahih (Unicode):</strong> Setiap teks niat, zikir, dan doa disalin dan ditentusahkan daripada mashaf atau kitab hadith primer tanpa sebarang proses OCR automatik bagi mengelakkan kesilapan baris dan huruf.
            </li>
            <li style={{ marginBottom: "0.75rem" }}>
              <strong>Pemisahan Rukun &amp; Sunat:</strong> Tatacara pergerakan membezakan secara tegas antara rukun solat (yang membatalkan solat jika ditinggalkan) dan perkara sunat (sunat ab&apos;ad dan sunat hay&apos;ah).
            </li>
            <li style={{ marginBottom: "0.75rem" }}>
              <strong>Penghormatan Khilaf Fiqh:</strong> Sebarang kepelbagaian riwayat (contohnya rakaat Tarawih 8 atau 20, dan bilangan rakaat Dhuha) dijelaskan secara objektif tanpa membatalkan pandangan muktamad mazhab.
            </li>
            <li style={{ marginBottom: "0.75rem" }}>
              <strong>Pintu Semakan Berlapis:</strong> Kandungan ditranskripsi oleh editor, disemak silang bersama rujukan autoriti agama tempatan (JAKIM dan Pejabat Mufti Wilayah Persekutuan), dan ditandakan status semakannya secara telus.
            </li>
          </ol>
        </section>

        <section aria-labelledby="sources-list-title">
          <h2 id="sources-list-title">Daftar Sumber Rujukan Muktabar</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {sources.map((src) => (
              <div
                key={src.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "0.75rem",
                  padding: "1.25rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{src.title}</h3>
                  <span className="category-badge">{src.type.replace(/_/g, " ").toUpperCase()}</span>
                </div>
                <p className="meta" style={{ margin: "0.35rem 0" }}>
                  <strong>Pengarang/Penerbit:</strong> {src.author} · {src.publisher} ({src.year ?? "Klasik"})
                </p>
                <p style={{ margin: "0.35rem 0", fontSize: "0.9375rem" }}>
                  {src.notes}
                </p>
                <p className="meta" style={{ margin: "0.35rem 0", fontSize: "0.8125rem" }}>
                  <strong>Kebenaran/Lesen:</strong> {src.licenseOrPermission}
                </p>
                {src.url && (
                  <p style={{ margin: "0.25rem 0", fontSize: "0.8125rem" }}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--brand)", textDecoration: "underline" }}
                    >
                      Pautan Rujukan Rasmi ↗
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="contact-title">
          <h2 id="contact-title">Saluran Pembetulan &amp; Maklum Balas</h2>
          <p>
            Sekiranya anda mendapati sebarang kesilapan baris, ejaan Rumi, atau terjemahan, sila kemukakan maklum balas melalui repositori projek atau emel pasukan pentadbir kandungan.
          </p>
        </section>
      </main>
    </>
  );
}
