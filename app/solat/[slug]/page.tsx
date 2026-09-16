import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { GuideReader } from "@/components/reader/guide-reader";
import { allGuides, findGuide, findSource } from "@/content/registry";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allGuides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const guide = findGuide((await params).slug);
  if (!guide) return { title: "Panduan tidak ditemui" };
  // The root layout template appends "| SolatWiki"; supply the bare title.
  // The structural sample is a test fixture, and unreviewed guidance must not
  // surface in search indexes — keep both out even though their routes stay
  // statically generated for the tests (sitemap.ts excludes them the same way).
  if (guide.slug === "contoh-struktur" || guide.reviewStatus !== "approved") {
    return { title: guide.title, robots: { index: false, follow: false } };
  }
  return { title: guide.title };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  // Phase 1 technical sample backward compatibility
  if (guide.slug === "contoh-struktur") {
    return (
      <>
        <SiteHeader />
        <main className="shell reader">
          <Link className="back" href="/">← Kembali ke halaman utama</Link>
          <p className="eyebrow">Sampel teknikal · {guide.reviewStatus}</p>
          <h1>{guide.title}</h1>
          <aside className="notice" aria-label="Amaran semakan kandungan">
            <span className="notice-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              PERINGATAN
            </span>
            <p>
              <strong>Jangan gunakan sebagai panduan ibadah.</strong> Halaman ini sengaja tidak mengandungi niat, bacaan, hukum, rakaat, atau waktu kerana tiada kandungan telah melalui semakan yang diwajibkan.
            </p>
          </aside>
          <section aria-labelledby="legibility-title">
            <h2 id="legibility-title">Ujian keterbacaan Arab</h2>
            <p className="arabic" lang="ar" dir="rtl">نص تجريبي للعرض فقط</p>
            <p className="meta">Teks Arab ini hanyalah pemegang tempat visual, bukan petikan atau bacaan ibadah.</p>
          </section>
          <section aria-labelledby="source-title">
            <h2 id="source-title">Status sumber</h2>
            <p>Belum mempunyai sumber atau kelulusan editorial.</p>
            <p className="meta">Versi kandungan: belum dicipta · Semakan terakhir: belum tersedia</p>
          </section>
        </main>
      </>
    );
  }

  const primarySource = guide.niat[0]?.sourceRef
    ? findSource(guide.niat[0].sourceRef)
    : undefined;

  return (
    <>
      <SiteHeader />
      <GuideReader guide={guide} primarySource={primarySource} />
    </>
  );
}
