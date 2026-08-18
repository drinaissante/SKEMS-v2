/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __pwaUpdateSW?: (reloadPage?: boolean) => Promise<void>
}
