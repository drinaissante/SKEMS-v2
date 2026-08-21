import { useMemo } from "react"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useTypewriter } from "../../hooks/useTypewriter"
import { useMemberNames, type Member } from "../../hooks/useMemberNames"

const texts: string[] = [
    "Same Passion.",
    "New  Vision.",
    "Our Story.",
]

export default function About() {
  usePageTitle("About")

  const { output, holding } = useTypewriter(texts, 80, 40, 2000)
  const { data: members = [], isLoading } = useMemberNames()

  const groupedMembers = useMemo(() => {
    const groups = new Map<string, Member[]>()

    for (const m of members) {
      if (!m.specialization) continue
      const list = groups.get(m.specialization) || []
      list.push(m)
      groups.set(m.specialization, list)
    }

    for (const list of groups.values()) {
      list.sort((a, b) => {
        const aHead = a.status.toLowerCase().includes("head") ? 0 : 1
        const bHead = b.status.toLowerCase().includes("head") ? 0 : 1
        if (aHead !== bHead) return aHead - bHead
        return a.fullName.localeCompare(b.fullName)
      })
    }

    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [members])

  return (
    <div className="min-h-screen bg-fixed-black flex flex-col items-center">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <p className="italic text-3xl text-center bg-linear-to-r from-[#cab453] to-[#ffd000] bg-clip-text text-transparent">
                {output}
                {!holding && <span className="animate-pulse text-white/80">|</span>}
            </p>
            <p className="max-w-57.5 sm:max-w-xl mt-5 text-center">
                Sine Kultura is the official media group of the BulSU Office of Culture and Arts. We are a collective of storytellers, technicians, and artists dedicated to documenting the spirit of the university.
            </p>
        </div>

        <div className="w-full max-w-6xl px-4 pb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Meet the Team</h2>

            {isLoading ? (
                <p className="text-center text-[#a6a6a6]">Loading members...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedMembers.map(([spec, list]) => (
                        <div key={spec} className="dark-card rounded-xl border border-white/10 p-4">
                            <h3 className="text-sm font-bold text-[#c89116] uppercase tracking-wide mb-3">{spec}</h3>
                            <div className="space-y-2">
                                {list.map((m) => (
                                    <div key={m.fullName} className="flex items-center justify-between gap-2">
                                        <span className="text-sm text-white truncate">{m.fullName}</span>
                                        <span className="text-[10px] text-[#a6a6a6] shrink-0">{m.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  )
}
