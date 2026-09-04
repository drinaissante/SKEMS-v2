import { FiChevronLeft, FiChevronRight } from "react-icons/fi"
import type { Member } from "../hooks/useMemberNames"
import { motion } from "motion/react"


type GroupedMembers = [string, [string, Member[]][]][]

export default function SpecCarousel({
  activeGroup,
  setActiveGroup,
  groupedMembers,
}: {
  activeGroup: string
  setActiveGroup: (spec: string | null) => void
  groupedMembers: GroupedMembers
}) {
  const specs = groupedMembers.map(([spec]) => spec)
  const index = specs.indexOf(activeGroup)
  const memberCount = groupedMembers.find(([spec]) => spec === activeGroup)?.[1].reduce(
    (acc, [, list]) => acc + list.length,
    0,
  ) ?? 0

  const go = (dir: 1 | -1) => {
    const next = (index + dir + specs.length) % specs.length
    setActiveGroup(specs[next])
  }

  const handleDragEnd = (_e: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -60) go(1)
    else if (info.offset.x > 60) go(-1)
  }

  const entry = groupedMembers[index]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3 w-full max-w-3xl">
        <motion.div
          key={activeGroup}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          className="relative flex-1 dark-card rounded-xl border border-white/10 overflow-hidden flex flex-col h-[min(60vh,34rem)] min-h-[22rem]"
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-[#cab453] to-[#ffd000]" />
          <div className="text-center mb-6 pt-8 shrink-0">
            <h4 className="text-lg font-bold text-[#c89116] uppercase tracking-wide mb-1">
              {activeGroup}
            </h4>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#a6a6a6]">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            {entry?.[1].map(([status, list]) => (
              <div key={status}>
                <p className="text-[10px] font-bold text-[#a6a6a6] uppercase tracking-wide wrap-break-word mb-1 text-center">
                  {status}
                </p>
                {list.length === 1 ? (
                  <div className="flex justify-center">
                    <span className="px-3 py-1.5 text-xs text-white bg-white/5 border border-white/10 rounded-full">
                      {list[0].fullName}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {list.map((m) => (
                      <span
                        key={m.fullName}
                        className="text-center justify-self-center px-3 py-1.5 text-xs text-white bg-white/5 border border-white/10 rounded-full"
                      >
                        {m.fullName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => go(-1)}
          aria-label="Previous group"
          className="p-2 rounded-full border border-white/15 text-[#a6a6a6] hover:border-[#c89116] hover:text-[#c89116] transition-colors cursor-pointer"
        >
          <FiChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-1.5">
          {specs.map((spec, i) => (
            <button
              key={spec}
              onClick={() => setActiveGroup(spec)}
              aria-label={`Go to ${spec}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === index ? "w-6 bg-[#c89116]" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => go(1)}
          aria-label="Next group"
          className="p-2 rounded-full border border-white/15 text-[#a6a6a6] hover:border-[#c89116] hover:text-[#c89116] transition-colors cursor-pointer"
        >
          <FiChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}