// public/sw.js
const CACHE = "prestador-v1";
const CORE = [
  "/",
  "/index.html",
  "/manifest.webmanifest"
  // Vite vai gerar assets em /assets/*.js e *.css – eles entram via runtime cache abaixo
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// Estratégia: network-first com fallback a cache para navegação e assets.
// Para requisições ao Supabase (API), se offline: deixamos falhar no fetch
// e tratamos no app (fila offline) – ver Dexie abaixo.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const isGET = e.request.method === "GET";
  const isAPI =
    url.hostname.endsWith("supabase.co") || url.pathname.startsWith("/api/");

  if (isGET && !isAPI) {
    e.respondWith(
      (async () => {
        try {
          const net = await fetch(e.request);
          const cache = await caches.open(CACHE);
          cache.put(e.request, net.clone());
          return net;
        } catch {
          const cached = await caches.match(e.request);
          if (cached) return cached;
          // fallback básico para navegação SPA
          if (e.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          throw new Error("Offline e sem cache.");
        }
      })()
    );
  }
});
