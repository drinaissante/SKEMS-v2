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
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  ({ request, url }) =>
    request.mode === "navigate" && !url.pathname.startsWith("/api/"),
  async ({ event }) => {
    try {
      return await fetch(event.request)
    } catch {
      const fallback = await matchPrecache("index.html")
      if (fallback) return fallback
      return Response.error()
    }
  },
)

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
