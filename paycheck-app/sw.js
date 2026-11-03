// Keeps the app working with no signal. Bump VERSION each time you upload new files.
const VERSION = "paycheck-v2";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return; // fonts etc. go straight to the network
  if (req.mode === "navigate") {
    // Try for a fresh copy, but give up after 3 seconds and open the saved one.
    const fresh = fetch(req, { cache: "no-cache" }).then((res) => {
      if (res.ok) { const copy = res.clone(); e.waitUntil(caches.open(VERSION).then((c) => c.put("index.html", copy))); }
      return res;
    });
    const timeout = new Promise((r) => setTimeout(r, 3000)).then(() => caches.match("index.html"));
    e.respondWith(Promise.race([fresh.catch(() => caches.match("index.html")), timeout]).then((r) => r || fresh));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); e.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy))); }
    return res;
  })));
});
