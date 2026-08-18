import { useEffect, useState } from "react"

export default function PWAUpdatePrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onNeedRefresh = () => setShow(true)
    window.addEventListener("pwa-update-available", onNeedRefresh)
    return () => window.removeEventListener("pwa-update-available", onNeedRefresh)
  }, [])

  if (!show) return null

  const handleUpdate = () => {
    window.__pwaUpdateSW?.(true)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_-2px_8px_rgba(0,0,0,0.3)]">
      <span>A new version is available.</span>
      <div className="flex gap-2">
        <button
          onClick={() => setShow(false)}
          className="rounded bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30"
        >
          Later
        </button>
        <button
          onClick={handleUpdate}
          className="rounded bg-white px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-gray-100"
        >
          Update
        </button>
      </div>
    </div>
  )
}
