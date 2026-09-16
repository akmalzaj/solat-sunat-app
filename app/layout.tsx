import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { ServiceWorkerProvider } from "@/components/service-worker-provider";
import { BottomNav } from "@/components/bottom-nav";
import { SITE_URL } from "@/lib/site";

// Public by design (visible in page source); must be set at build time.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    url: SITE_URL,
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
        {/* Load Microsoft Clarity (heatmaps + session recordings) on the same
            production-only gate as GA. Inline content is the official Clarity
            snippet with our build-time project ID interpolated — no user input
            flows into it. afterInteractive keeps it render-blocking-free. */}
        {process.env.NODE_ENV === "production" && CLARITY_PROJECT_ID && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_PROJECT_ID}");`,
            }}
          />
        )}
      </body>
    </html>
  );
}
