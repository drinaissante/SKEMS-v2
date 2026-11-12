import { FiFolder } from "react-icons/fi"

interface CategoryFolderGridProps {
  categories: string[]
  counts: Record<string, number>
  total: number
  allLabel: string
  onSelect: (category: string) => void
  compact?: boolean
}

export default function CategoryFolderGrid({
  categories,
  counts,
  total,
  allLabel,
  onSelect,
  compact = false,
}: CategoryFolderGridProps) {
  return (
    <div className={`grid gap-4 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"}`}>
      <button
        type="button"
        onClick={() => onSelect("__all__")}
        className="dark-card rounded-xl border border-white/10 p-4 text-left cursor-pointer hover:border-[#c89116]/50 transition-colors"
      >
        <FiFolder className="text-[#c89116] mb-2" size={22} />
        <h3 className="text-sm font-bold text-white truncate">{allLabel}</h3>
        <p className="text-xs text-[#a6a6a6] mt-0.5">{total} total</p>
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          className="dark-card rounded-xl border border-white/10 p-4 text-left cursor-pointer hover:border-[#c89116]/50 transition-colors"
        >
          <FiFolder className="text-[#c89116] mb-2" size={22} />
          <h3 className="text-sm font-bold text-white truncate">{category}</h3>
          <p className="text-xs text-[#a6a6a6] mt-0.5">{counts[category] ?? 0} total</p>
        </button>
      ))}
    </div>
  )
}
