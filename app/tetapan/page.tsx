import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  alternates: { canonical: "/tetapan/" },
  title: "Tetapan Sistem & Sumber Fiqh",
  description: "Tetapan paparan, metodologi fiqh, dan maklumat sumber rujukan.",
};

export default function TetapanPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell reader">
        <Link className="back" href="/">← Kembali ke halaman utama</Link>
        <h1 className="eyebrow page-title">Tetapan Sistem &amp; Sumber Fiqh</h1>
        <p className="lede">Pengurusan saiz fon, tema paparan, dan rujukan autoriti fiqh Shafi&apos;i.</p>

        <SettingsView />
      </main>
    </>
  );
}
