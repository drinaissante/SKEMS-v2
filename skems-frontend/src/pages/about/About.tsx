import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useTypewriter } from "../../hooks/useTypewriter"
import { useMemberNames, type Member } from "../../hooks/useMemberNames"
import Reveal from "../../components/Reveal"
import SpecCarousel from "../../components/GroupedMembers"
import MemberAvatar from "../../components/MemberAvatar"

const texts: string[] = [
    "Same Passion.",
    "New  Vision.",
    "Our Story.",
]

const LEADERSHIP_GROUPS = [
  { title: "President", keywords: ["president"] },
  { title: "Vice President", keywords: ["vice", "vp"] },
  { title: "Secretary", keywords: ["secretary"], exact: true },
  { title: "Treasurer", keywords: ["treasurer", "tres"] },
] as const

type LeadershipGroup = {
  title: string
  keywords: readonly string[]
  exact?: boolean
}

const memberMatchesKeywords = (status: string, g: LeadershipGroup) => {
  const lower = status.toLowerCase()
  return g.keywords.some((k) => g.exact ? lower === k.toLowerCase() : lower.includes(k.toLowerCase()))
}

export default function About() {
  usePageTitle("About")

  const { output, holding } = useTypewriter(texts, 80, 40, 2000)
  const { data: members = [], isLoading } = useMemberNames()

  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const { leadershipMembers, remainingMembers } = useMemo(() => {
    const leadership: Member[] = []
    const remaining: Member[] = []
    for (const m of members) {
      if (!m.status) continue
      const isLeadership = LEADERSHIP_GROUPS.some((g) => memberMatchesKeywords(m.status!, g))
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {LEADERSHIP_GROUPS.map((group, gi) => {
                            const list = leadershipMembers.filter((m) => memberMatchesKeywords(m.status!, group))
                            if (list.length === 0) return null
                            list.sort((a, b) => a.fullName.localeCompare(b.fullName))
                            return (
                                <Reveal key={group.title} delay={gi * 0.08}>
                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="h-full"
                                    >
                                        <div className="relative h-full dark-card rounded-xl border border-white/10 p-4 text-center overflow-hidden">
                                            <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-[#cab453] to-[#ffd000]" />
                                            <h3 className="text-sm font-bold text-[#c89116] uppercase tracking-wide mb-3 text-center">{group.title}</h3>
                                            <div className="space-y-2">
                                                {list.map((m) => (
                                                    <div key={m.fullName} className="flex flex-col items-center justify-center gap-2">
                                                        {/* Pass image={<url>} to MemberAvatar to add a photo; falls back to initials */}
                                                        <MemberAvatar name={m.fullName} size={80} image="/eb/ihman.jpg" />
                                                        <span className="text-sm text-white">{m.fullName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                </Reveal>
                            )
                        })}
                    </div>

                    {groupedMembers.length > 0 && (
                        <>
                            <h3 className="text-lg font-bold text-white text-center mb-6">Meet the Team</h3>
                            <p className="text-sm text-gray-400 text-center mb-8 max-w-xl mx-auto">
                                The visionary team behind every frame.
                            </p>

                            {/* Specialization tabs */}
                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                <button
                                    onClick={() => setActiveGroup(null)}
                                    className={`px-4 py-2 text-xs font-bold rounded-full border transition-colors cursor-pointer ${
                                        activeGroup === null
                                            ? "bg-[#c89116] border-[#c89116] text-white"
                                            : "border-white/15 text-[#a6a6a6] hover:border-[#c89116] hover:text-[#c89116]"
                                    }`}
                                >
                                    All
                                </button>
                                {groupedMembers.map(([spec]) => (
                                    <button
                                        key={spec}
                                        onClick={() => setActiveGroup(spec)}
                                        className={`px-4 py-2 text-xs font-bold rounded-full border transition-colors cursor-pointer ${
                                            activeGroup === spec
                                                ? "bg-[#c89116] border-[#c89116] text-white"
                                                : "border-white/15 text-[#a6a6a6] hover:border-[#c89116] hover:text-[#c89116]"
                                        }`}
                                    >
                                        {spec}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {activeGroup === null ? (
                                    <motion.div
                                        key="all"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                    >
                                        {groupedMembers.map(([spec, statusEntries], ci) => (
                                            <Reveal key={spec} delay={(ci % 3) * 0.08}>
                                                <div className="h-full dark-card rounded-xl border border-white/10 p-4">
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
                                            </Reveal>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <SpecCarousel
                                        activeGroup={activeGroup}
                                        setActiveGroup={setActiveGroup}
                                        groupedMembers={groupedMembers}
                                    />
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </>
            )}
        </div>
    </div>
  )
}
