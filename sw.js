/* HUZUR service worker — çevrimdışı destek */
"use strict";
const CACHE = "huzur-v9";
const ASSETS = [
  "./index.html",
  "./style.css?v=8",
  "./data.js?v=8",
  "./app.js?v=8",
  "./tts_meta.json?v=5",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./sounds/rain.mp3",
  "./sounds/ocean.mp3",
  "./sounds/selale.mp3",
  "./sounds/wind.mp3",
  "./sounds/fire.mp3",
  "./sounds/forest.mp3",
  "./sounds/ciftlik.mp3",
  "./sounds/moo1.mp3",
  "./sounds/moo2.mp3",
  "./sounds/moo3.mp3",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) => hit || fetch(e.request).then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        } catch (err) {}
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
