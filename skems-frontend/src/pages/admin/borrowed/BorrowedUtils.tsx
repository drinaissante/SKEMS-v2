import { conditionColors } from "../../../constants/borrowedConstants"

export default function ConditionBadges(value: string) {
  if (!value) return <span className="text-[#a6a6a6] text-xs">—</span>
  const items = value.split(",").map((s) => s.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((c) => (
        <span
          key={c}
          className={`text-xs font-bold px-1.5 py-0.5 rounded ${conditionColors[c] ?? "bg-white/10 text-[#a6a6a6]"}`}
        >
          {c}
        </span>
      ))}
    </div>
  )
}
