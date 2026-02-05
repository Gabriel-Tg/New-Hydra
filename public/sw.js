// public/sw.js
const CACHE = "nh-assets-v3";
const CORE = [
  "/manifest.webmanifest"
  // Assets gerados em /assets/*.js e *.css serão armazenados via runtime cache
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

// Estratégia: cache-first apenas para assets estáticos; navegação/autenticado vai direto à rede (evita servir HTML antigo com dados sensíveis).
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const isGET = e.request.method === "GET";
  const isAsset = url.pathname.startsWith("/assets/") || url.pathname.endsWith(".css") || url.pathname.endsWith(".js") || url.pathname.endsWith(".png") || url.pathname.endsWith(".jpg") || url.pathname.endsWith(".webmanifest");
  if (!isGET) return;
  if (isAsset) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const net = await fetch(e.request);
        cache.put(e.request, net.clone());
        return net;
      })
    );
  }
  // demais requisições (HTML/API) passam direto (network-only)
});
