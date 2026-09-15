"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function ServiceWorkerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const refreshRequested = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" || !("serviceWorker" in navigator)) return;

    const showWaitingUpdate = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) setUpdateAvailable(true);
    };
    const onControllerChange = () => {
      if (refreshRequested.current) window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      showWaitingUpdate(registration);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") showWaitingUpdate(registration);
        });
      });
    }).catch((error: unknown) => {
      // A failed registration means offline mode silently stops working; leave a
      // breadcrumb instead of swallowing the error.
      console.error("Service worker registration failed:", error);
    });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  const applyUpdate = async () => {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration?.waiting) return;
    refreshRequested.current = true;
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <>
      {children}
      {updateAvailable && <aside className="update-banner" role="status" aria-live="polite">
        <span>Kemas kini panduan tersedia.</span>
        <button type="button" onClick={() => void applyUpdate()}>Muat semula untuk kemas kini</button>
      </aside>}
    </>
  );
}
