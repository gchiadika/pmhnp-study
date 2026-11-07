/* PMHNP Board Prep service worker */
const VERSION = "20261107201544";
const CACHE = `pmhnp-${VERSION}`;
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./version.txt",
  "./app.js",
  "./app.css",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("pmhnp-") && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isNavOrShell(request, url) {
  if (request.mode === "navigate") return true;
  const path = url.pathname;
  return (
    path.endsWith("/") ||
    path.endsWith("/index.html") ||
    path.endsWith("/app.js") ||
    path.endsWith("/app.css") ||
    path.endsWith("/sw.js") ||
    path.endsWith("/version.txt")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isNavOrShell(req, url)) {
    // Network-first so updates show on next online open
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for icons and other static assets
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
