import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { NetworkFirst } from "workbox-strategies"
import { ExpirationPlugin } from "workbox-expiration"

declare const self: ServiceWorkerGlobalScope

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting()
})

cleanupOutdatedCaches()

// Navigation route is registered FIRST (workbox is first-match-wins) so
// navigations always try the network before any precached shell. A deploy
// makes old hashed chunks 404 — serving stale precached HTML here would
// black-screen the app, so non-OK network responses fall back to the
// cached shell only when the network answer is unusable.
registerRoute(
  ({ request, url }) =>
    request.mode === "navigate" && !url.pathname.startsWith("/api/"),
  async ({ event }) => {
    try {
      const response = await fetch(event.request)
      if (response.ok) return response
    } catch {
      // network failed - fall through to the cached shell
    }
    const fallback = await matchPrecache("index.html")
    if (fallback) return fallback
    return Response.error()
  },
)

precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ url }) =>
    url.hostname.endsWith("supabase.co") &&
    url.pathname.startsWith("/storage/v1/object"),
  new NetworkFirst({
    cacheName: "equipment-images",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
)
