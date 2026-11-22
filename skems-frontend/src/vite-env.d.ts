/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __pwaUpdateSW?: (reloadPage?: boolean) => Promise<void>
}

// Injected at build time via vite.config.ts `define`.
declare const __APP_BUSTER__: string
