import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Tetapan & Metodologi",
  description: "Tetapan paparan, metodologi fiqh, dan maklumat sumber rujukan.",
};

export default function TetapanPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell reader">
        <Link className="back" href="/">← Kembali ke halaman utama</Link>
        <p className="eyebrow">Tetapan &amp; Metodologi</p>
        <h1>Tetapan &amp; Sumber Fiqh</h1>
        <p className="lede">Pengurusan saiz fon, tema paparan, dan rujukan autoriti fiqh Shafi&apos;i.</p>

        <SettingsView />
      </main>
    </>
  );
}
