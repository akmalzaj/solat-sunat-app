declare const self: ServiceWorkerGlobalScope & {
  __STATIC_ASSET_MANIFEST__: readonly string[];
};

const cacheName = "__CACHE_NAME__";
const offlineUrl = "/~offline/";
const precacheUrls = self.__STATIC_ASSET_MANIFEST__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => cache.addAll(precacheUrls)),
  );
});

self.addEventListener("message", (event) => {
  // Only honour activation requests from same-origin clients. Compare parsed
  // origins: a prefix check would also accept e.g. https://origin.attacker.com.
  const sourceUrl = event.source && "url" in event.source ? event.source.url : "";
  let isSameOriginClient = false;
  try {
    isSameOriginClient = new URL(sourceUrl).origin === self.location.origin;
  } catch {
    // Unparseable source URL: refuse rather than guess.
  }
  if (event.data?.type === "SKIP_WAITING" && isSameOriginClient) {
    void self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("solat-sunat-precache-") && key !== cacheName)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      if (event.request.mode === "navigate") return caches.match(offlineUrl);
      return fetch(event.request);
    }),
  );
});
