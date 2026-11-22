// Service worker: caches the game so it works offline once installed.
// Bump CACHE when you change any files so phones pick up the update.
const CACHE = "word-jumble-v2";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/style.css",
  "./src/words.js",
  "./src/game.js",
  "./assets/levels.dat",
  "./assets/images/icon-180.png",
  "./assets/images/icon-192.png",
  "./assets/images/icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Network first (so updates show up), fall back to cache when offline.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
