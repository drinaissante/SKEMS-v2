import { useEffect, useState } from "react"
import { getReturnProofUrl } from "../services/supabase"

export default function ProofImage({ path, className = "w-full h-40" }: { path: string; className?: string }) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    let active = true
    getReturnProofUrl(path).then((u) => {
      if (active) setUrl(u)
    })
    return () => { active = false }
  }, [path])
  if (!url) return <div className={`${className} bg-white/5 rounded-lg animate-pulse`} />
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Return proof" className={`${className} object-cover rounded-lg border border-white/10`} loading="lazy" />
    </a>
  )
}
