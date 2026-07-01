/* Kiwiroute service worker — makes the trip usable offline (on the plane).
 *
 * Strategy:
 *  - App shell / navigations: network-first, fall back to the cached SPA
 *    (index.html) so the app opens without a connection.
 *  - GET /api/trip*: network-first, fall back to the last cached trip so the
 *    itinerary, map, stays and budget still render offline.
 *  - Other same-origin + font/leaflet assets: stale-while-revalidate.
 *  - Never touch /mcp, /sse, or write requests (POST/PATCH/DELETE).
 */

const VERSION = "kiwiroute-v1";
const SHELL = `${VERSION}-shell`;
const DATA = `${VERSION}-data`;
const ASSETS = `${VERSION}-assets`;

const SHELL_URLS = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg", "/icon-maskable.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isTripApi(url) {
  return url.pathname === "/api/trip" || url.pathname.startsWith("/api/trip/");
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetching = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === "opaque")) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetching;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never cache writes / MCP

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // MCP transport is never cached.
  if (sameOrigin && (url.pathname.startsWith("/mcp") || url.pathname.startsWith("/sse"))) return;

  // SPA navigations.
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, SHELL).catch(() => caches.match("/index.html")),
    );
    return;
  }

  // Trip data — keep the last copy for offline.
  if (sameOrigin && isTripApi(url)) {
    event.respondWith(networkFirst(request, DATA));
    return;
  }

  // Other API GETs: pass through (health etc.) — don't serve stale.
  if (sameOrigin && url.pathname.startsWith("/api/")) return;

  // Static assets (app JS/CSS) + cross-origin fonts & Leaflet CSS.
  const cacheable =
    sameOrigin ||
    /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) ||
    /unpkg\.com$/.test(url.hostname);
  if (cacheable) {
    event.respondWith(staleWhileRevalidate(request, ASSETS));
  }
  // Map tiles (cartocdn) fall through to the network and aren't cached.
});
