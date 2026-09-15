import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function OfflinePage() {
  return (
    <>
      <SiteHeader />
      <main className="shell reader">
        <p className="eyebrow">Luar talian</p>
        <h1>Halaman ini belum tersedia di luar talian.</h1>
        <p className="lede">Buka halaman ini sekali ketika bersambung ke internet, kemudian cuba semula. Kandungan yang telah dimuat turun kekal tersedia.</p>
        <Link className="back" href="/">Kembali ke halaman utama</Link>
      </main>
    </>
  );
}
