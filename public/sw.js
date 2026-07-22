/* Excellon PWA — minimal service worker.
   Installable only: no offline/business-data caching by design. The passive
   fetch handler exists solely to satisfy PWA installability; it does not
   intercept or cache responses, so app data is always fetched live. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  /* no-op: fall through to the default network behaviour */
});
