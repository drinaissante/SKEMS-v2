import { useMemo } from "react"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useTypewriter } from "../../hooks/useTypewriter"
import { useMemberNames, type Member } from "../../hooks/useMemberNames"

const texts: string[] = [
    "Same Passion.",
    "New  Vision.",
    "Our Story.",
]

const LEADERSHIP_GROUPS = [
  { title: "President", keywords: ["president", "pres"] },
  { title: "Vice President", keywords: ["vice pres", "vp"] },
  { title: "Secretary", keywords: ["secretary", "sec"
  ] },
  { title: "Treasurer", keywords: ["treasurer", "tres"] },
] as const

const memberMatchesKeywords = (status: string, keywords: readonly string[]) =>
  keywords.some((k) => status.toLowerCase().includes(k.toLowerCase()))

export default function About() {
  usePageTitle("About")

  const { output, holding } = useTypewriter(texts, 80, 40, 2000)
  const { data: members = [], isLoading } = useMemberNames()

  const { leadershipMembers, remainingMembers } = useMemo(() => {
    const leadership: Member[] = []
    const remaining: Member[] = []
    for (const m of members) {
      if (!m.status) continue
      const isLeadership = LEADERSHIP_GROUPS.some((g) => memberMatchesKeywords(m.status!, g.keywords))
      if (isLeadership) leadership.push(m)
      else remaining.push(m)
    }
    return { leadershipMembers: leadership, remainingMembers: remaining }
  }, [members])

  const groupedMembers = useMemo((): [string, [string, Member[]][]][] => {
    const groups = new Map<string, Map<string, Member[]>>()

    for (const m of remainingMembers) {
      if (!m.specialization || !m.status) continue
      if (!groups.has(m.specialization)) groups.set(m.specialization, new Map())
      const byStatus = groups.get(m.specialization)!
      if (!byStatus.has(m.status)) byStatus.set(m.status, [])
      byStatus.get(m.status)!.push(m)
    }

    for (const byStatus of groups.values()) {
      for (const list of byStatus.values()) {
        list.sort((a, b) => a.fullName.localeCompare(b.fullName))
      }
    }

    const sortStatuses = (a: string, b: string) => {
      const aHead = a.toLowerCase().includes("head") ? 0 : 1
      const bHead = b.toLowerCase().includes("head") ? 0 : 1
      if (aHead !== bHead) return aHead - bHead
      return a.localeCompare(b)
    }

    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([spec, byStatus]) => [
        spec,
        [...byStatus.entries()].sort(([a], [b]) => sortStatuses(a, b)),
      ])
  }, [remainingMembers])

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
            <h2 className="text-2xl font-bold text-white text-center mb-2">The Executive Board</h2>
            <p className="text-sm text-gray-400 text-center mb-8 max-w-xl mx-auto">
                The powerhouse crew of Sine Kultura.
            </p>

            {isLoading ? (
                <p className="text-center text-[#a6a6a6]">Loading members...</p>
            ) : (
                <>
                    {/* LEADERSHIP */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {LEADERSHIP_GROUPS.map(({ title, keywords }) => {
                            const list = leadershipMembers.filter((m) => (keywords as readonly string[]).some(k => m.status!.toLowerCase().includes(k.toLowerCase())))
                            if (list.length === 0) return null
                            list.sort((a, b) => a.fullName.localeCompare(b.fullName))
                            return (
                                <div key={title} className="dark-card rounded-xl border border-white/10 p-4">
                                    <h3 className="text-sm font-bold text-[#c89116] uppercase tracking-wide mb-3 text-center ">{title}</h3>
                                    <div className="space-y-1 pl-2">
                                        {list.map((m) => (
                                            <div key={m.fullName} className="text-center">
                                                <span className="text-sm text-white">{m.fullName}</span>
                                                
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {groupedMembers.length > 0 && (
                        <>
                            <h3 className="text-lg font-bold text-white text-center mb-6">Meet the Team</h3>
                            <p className="text-sm text-gray-400 text-center mb-8 max-w-xl mx-auto">
                                The visionary team behind every frame.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groupedMembers.map(([spec, statusEntries]) => (
                                    <div key={spec} className="dark-card rounded-xl border border-white/10 p-4">
                                        <h3 className="text-sm font-bold text-[#c89116] uppercase tracking-wide mb-3 text-center">{spec}</h3>
                                        <div className="space-y-3">
                                            {statusEntries.map(([status, list]) => (
                                                <div key={status}>
                                                    <p className="text-[10px] font-bold text-[#a6a6a6] uppercase tracking-wide wrap-break-word mb-1">
                                                        {status}
                                                    </p>
                                                    <div className="space-y-1 pl-2">
                                                        {list.map((m) => (
                                                            <p key={m.fullName} className="text-sm text-white">
                                                                {m.fullName}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    </div>
  )
}
