import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { registerSW } from "virtual:pwa-register"

import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import ScrollToTop from './components/ScrollToTop.tsx'

import './index.css'

const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent("pwa-update-available"))
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent("pwa-offline-ready"))
  },
})
window.__pwaUpdateSW = updateSW

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
})

// Chunk-load failure self-heal: after a deploy, a stale service worker can
// serve HTML that references chunks which no longer exist. One guarded
// reload picks up the freshly activated service worker.
let chunkReloadAttempted = false
const CHUNK_ERROR_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module",
  "loading chunk",
]
const isChunkLoadError = (message: string) =>
  CHUNK_ERROR_PATTERNS.some((p) => message.toLowerCase().includes(p))

const handleChunkLoadFailure = () => {
  if (chunkReloadAttempted) return
  chunkReloadAttempted = true
  window.location.reload()
}

window.addEventListener("error", (event) => {
  if (isChunkLoadError(String(event.message ?? ""))) handleChunkLoadFailure()
})
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason
  const message =
    typeof reason === "string" ? reason : reason instanceof Error ? reason.message : ""
  if (isChunkLoadError(message)) handleChunkLoadFailure()
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "skems-query-cache",
  throttleTime: 1000,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        // Schema drift guard: the buster changes on every deploy (Vercel
        // commit SHA), invalidating persisted caches restored into newer
        // code shapes.
        buster: __APP_BUSTER__,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === "success",
        },
      }}
    >
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
)
