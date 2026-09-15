"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="shell reader">
      <div className="empty-state" role="alert">
        <div className="empty-state-icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Maaf, Berlaku Ralat</h2>
        <p>
          Paparan ini menghadapi masalah yang tidak dijangka. Anda boleh mencuba
          memuat semula bahagian ini; simpanan anda tidak terjejas.
        </p>
        <button type="button" className="cta-button" onClick={reset}>
          Cuba Semula
        </button>
      </div>
    </main>
  );
}