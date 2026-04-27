/// <reference lib="webworker" />

const precacheManifest = self.__WB_MANIFEST || [];
const APP_CACHE = "mounja-app-v1";
const ASSET_CACHE = "mounja-assets-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => ![APP_CACHE, ASSET_CACHE].includes(key)).map((key) => caches.delete(key)))
      ),
    ])
  );
  void precacheManifest;
});

const isHtmlRequest = (request) => request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
const isMainJsRequest = (url) => /^\/assets\/index-[\w-]+\.js$/.test(url.pathname);
const isImmutableAsset = (request, url) =>
  ["image", "font", "style"].includes(request.destination) ||
  /^\/assets\/.+\.(png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf|otf|css)$/.test(url.pathname);

const networkFirst = async (request) => {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response?.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
};

const cacheFirst = async (request) => {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response?.ok) await cache.put(request, response.clone());
  return response;
};

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isHtmlRequest(event.request) || isMainJsRequest(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isImmutableAsset(event.request, url)) {
    event.respondWith(cacheFirst(event.request));
  }
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title || "Mounjá";
  const options = {
    body: payload.body || "Hora de cuidar do seu tratamento.",
    icon: payload.icon || "/pwa-192x192.png",
    badge: payload.badge || "/pwa-192x192.png",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});