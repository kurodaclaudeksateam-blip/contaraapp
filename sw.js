// Service worker de la versión web: guarda OpenCV (≈10 MB), las fuentes y la app
// la primera vez, para que las siguientes aperturas sean instantáneas y funcionen sin internet.
// (La APK no lo usa: allí todo viene incluido.)
const CACHE = "contador-tubos-v1";
const CORE = [
  "./",
  "./index.html",
  "./fonts/barlow-condensed-latin-600-normal.woff2",
  "./fonts/barlow-condensed-latin-700-normal.woff2",
  "./fonts/ibm-plex-sans-latin-400-normal.woff2",
  "./fonts/ibm-plex-sans-latin-500-normal.woff2",
  "./fonts/ibm-plex-sans-latin-600-normal.woff2",
  "./fonts/ibm-plex-mono-latin-500-normal.woff2"
];
const OPENCV = "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = req.url;
  // OpenCV y fuentes: versión fija → primero la caché (se descargan una sola vez)
  if(url === OPENCV || url.includes("/fonts/")){
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if(hit) return hit;
      const res = await fetch(req);
      if(res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  // la página: primero la red (para recibir mejoras) y si no hay conexión, la copia guardada
  if(req.mode === "navigate" || url.endsWith("/index.html")){
    e.respondWith(fetch(req).then(res => {
      if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); }
      return res;
    }).catch(() => caches.match("./index.html")));
  }
});
