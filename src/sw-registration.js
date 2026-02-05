// src/sw-registration.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    if (import.meta.env.DEV) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      return;
    }

    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed", err);
      });
    }
  });
}