import { usePageTitle } from "../../hooks/usePageTitle"
import { useTypewriter } from "../../hooks/useTypewriter"

const texts: string[] = [
    "The Archives.",
    "Our Portfolio.",
    "Featured Works.",
]

export default function Portfolio() {
  usePageTitle("Portfolio")

  const { output, holding } = useTypewriter(texts, 80, 40, 2000)

  return (
    <div className="min-h-screen bg-fixed-black flex flex-col items-center justify-center">
        <p className="italic text-3xl text-center bg-linear-to-r from-[#cab453] to-[#ffd000] bg-clip-text text-transparent">
            {output}
            {!holding && <span className="animate-pulse text-white/80">|</span>}
        </p>
        <p className="max-w-57.5 sm:max-w-xl mt-5">
            A collection of cinematic visions and captured moments.
        </p>
    </div>
  )
}
