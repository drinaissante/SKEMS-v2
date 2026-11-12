import { FiPlus, FiCheck } from "react-icons/fi"
import type { Equipment } from "../services/api"

/* eslint-disable react-refresh/only-export-components */

interface PickerListProps {
  items: Equipment[]
  loading: boolean
  search: string
  inFormIds: Set<string>
  onAdd: (eq: Equipment) => void
  /** When true, tapping a selected row deselects it (multi-select flows). */
  allowDeselect?: boolean
}

export function conditionChipClass(condition: string) {
  return condition === "Working" ? "bg-green-500/15 text-green-300" :
    condition === "Needs Repair" ? "bg-[#ffd870] text-[#222]" :
    condition === "Broken" ? "bg-red-500/15 text-red-300" :
    "bg-white/10 text-[#a6a6a6]"
}

export default function EquipmentPickerList({ items, loading, search, inFormIds, onAdd, allowDeselect = false }: PickerListProps) {
  if (loading) {
    return <p className="text-sm text-[#a6a6a6] text-center py-6">Loading equipment…</p>
  }
  if (items.length === 0) {
    return (
      <p className="text-sm text-[#a6a6a6] text-center py-6">
        {search ? "No equipment matches your search." : "No equipment available."}
      </p>
    )
  }
  return (
    <div className="space-y-2">
      {items.map(eq => {
        const inForm = inFormIds.has(eq.id)
        return (
          <div
            key={eq.id}
            draggable
            data-tour="equipment-row"
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", eq.id)
              e.dataTransfer.effectAllowed = "copy"
            }}
            onClick={() => (!inForm || allowDeselect) && onAdd(eq)}
            className={`p-3 rounded-lg border transition-colors select-none ${
              inForm
                ? allowDeselect
                  ? "border-[#c89116] bg-[#c89116]/15 cursor-pointer"
                  : "border-white/10 bg-white/5 opacity-50 cursor-not-allowed"
                : "border-white/10 bg-white/5 hover:border-[#c89116]/50 hover:bg-white/10 cursor-grab active:cursor-grabbing"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{eq.name}</p>
                <p className="text-xs text-[#a6a6a6] sm:hidden">{eq.id}</p>
                <p className="text-xs text-[#a6a6a6] sm:hidden">{eq.owner ? `Owner: ${eq.owner}` : "No owner"}</p>
                <p className="hidden sm:block text-xs text-[#a6a6a6]">{eq.id}{eq.owner ? ` — ${eq.owner}` : ""}</p>
                {eq.comments && (
                  <p className="text-[11px] text-[#c89116]/80 wrap-anywhere leading-relaxed" title={eq.comments}>
                    {eq.comments}
                  </p>
                )}
              </div>
              {inForm && allowDeselect ? (
                <FiCheck className="shrink-0 text-[#c89116]" size={16} />
              ) : !inForm ? (
                <FiPlus className="shrink-0 text-[#c89116]" size={16} />
              ) : null}
            </div>
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${conditionChipClass(eq.condition)}`}>
              {eq.condition}
            </span>
          </div>
        )
      })}
    </div>
  )
}
