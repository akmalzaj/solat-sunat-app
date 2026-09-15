import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { ServiceWorkerProvider } from "@/components/service-worker-provider";
import { BottomNav } from "@/components/bottom-nav";

// Public by design (visible in page source); must be set at build time.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL("https://solat.wiki"),
  applicationName: "SolatWiki",
  title: {
    default: "SolatWiki - Panduan Solat Sunat & Doa",
    template: "%s | SolatWiki",
  },
  description: "SolatWiki: Panduan Solat Sunat dan Doa Untuk Semua",
  appleWebApp: { capable: true, title: "SolatWiki", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "SolatWiki - Panduan Solat Sunat & Doa",
    description: "SolatWiki: Panduan Solat Sunat dan Doa Untuk Semua",
    url: "https://solat.wiki",
    siteName: "SolatWiki",
    locale: "ms_MY",
    type: "website",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#0f3d36",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            // setStorageItem persists JSON ("dark" with quotes); parse it, but also
            // accept a raw "dark"/"light" for values written by older versions.
            __html: `(function(){try{var r=localStorage.getItem("solat_sunat_theme");var t=r;try{t=JSON.parse(r)}catch(e){}if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ServiceWorkerProvider>
          {children}
          <BottomNav />
        </ServiceWorkerProvider>
        {/* Load GA only in production with an ID configured, keeping dev/preview
            traffic out of the reports. Pageviews on client-side navigations are
            tracked automatically via GA4 Enhanced Measurement. */}
        {process.env.NODE_ENV === "production" && GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
