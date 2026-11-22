import { useEffect, useState } from "react"
import { getReturnProofUrl } from "../services/supabase"
import ImageLightbox from "./ImageLightbox"

export default function ProofImage({ path, className = "w-full h-40" }: { path: string; className?: string }) {
  const [url, setUrl] = useState("")
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    let active = true
    getReturnProofUrl(path).then((u) => {
      if (active) setUrl(u)
    })
    return () => { active = false }
  }, [path])

  if (!url) return <div className={`${className} bg-white/5 rounded-lg animate-pulse`} />

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className={`block w-full cursor-zoom-in ${className}`}
        title="View proof"
      >
        <img src={url} alt="Return proof" className={`${className} object-cover rounded-lg border border-white/10`} loading="lazy" />
      </button>

      {lightboxOpen && (
        <ImageLightbox
          src={url}
          alt="Return proof"
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}
