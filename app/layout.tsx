import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ServiceWorkerProvider } from "@/components/service-worker-provider";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  applicationName: "Panduan Solat Sunat",
  title: {
    default: "Panduan Solat Sunat",
    template: "%s | Panduan Solat Sunat",
  },
  description: "Panduan solat sunat yang boleh diakses selepas dimuat turun.",
  appleWebApp: { capable: true, title: "Solat Sunat", statusBarStyle: "default" },
  formatDetection: { telephone: false },
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
            __html: `(function(){try{var t=localStorage.getItem("solat_sunat_theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ServiceWorkerProvider>
          {children}
          <BottomNav />
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
