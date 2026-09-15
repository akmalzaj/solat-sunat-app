import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ToolsView } from "@/components/tools/tools-view";

export const metadata: Metadata = {
  title: "Alatan",
  description: "Alatan visual dan bantuan persediaan ibadah.",
};

export default function AlatanPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell reader">
        <Link className="back" href="/">← Kembali ke halaman utama</Link>
        <p className="eyebrow">Alatan Pembelajaran</p>
        <h1>Alatan Persediaan Ibadah</h1>
        <p className="lede">Bantuan visual untuk pembelajaran dan semakan zikir serta takbir.</p>
        <ToolsView />
      </main>
    </>
  );
}
