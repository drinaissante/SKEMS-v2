import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { type Equipment } from "../../services/api"
import { conditionBadgeClass } from "../../constants/scanConstants"

interface Props {
  open: boolean
  itemIndex: number
  itemName: string
  onConfirm: (equipmentId: string, index: number) => void
  onClose: () => void
}

export default function ItemSelectorModal({ open, itemIndex, itemName, onConfirm, onClose }: Props) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState(itemName)
  const [selectedId, setSelectedId] = useState("")

  const equipData = queryClient.getQueryData<Equipment[]>(["equipments"]) ?? []
  const validEquipData = equipData.filter(
    e => e.condition !== "Broken" && e.condition !== "Unavailable" && e.condition !== "Borrowed"
  )
  const q = search.toLowerCase()
  const matches = validEquipData.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q)
  )

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    const lq = value.toLowerCase()
    const match = validEquipData.find(e =>
      e.name.toLowerCase().includes(lq) ||
      e.category.toLowerCase().includes(lq)
    )
    if (match && matches.length > 0 && !selectedId) {
      setSelectedId(match.id)
    }
  }, [validEquipData, matches.length, selectedId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md mx-3">
        <p className="text-base sm:text-lg font-bold text-[#222] mb-4 text-center">
          Select Equipment
        </p>
        <p className="text-sm text-[#666] mb-4 text-center">
          For "<span className="font-medium text-[#222]">{itemName || "[unnamed]"}</span>"
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search equipment name or category..."
              className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
            />
          </div>

          {matches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Pick one</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {matches.map(eq => (
                  <label
                    key={eq.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      selectedId === eq.id
                        ? "bg-[#c89116]/10 border-[#c89116]"
                        : "border-[#d9d9d9] hover:bg-[#f5f5f5]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="selector-equipment"
                      checked={selectedId === eq.id}
                      onChange={() => setSelectedId(eq.id)}
                      className="accent-[#c89116]"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-[#222] truncate">{eq.name}</p>
                      <p className="text-xs text-[#a6a6a6]">{eq.id} — {eq.owner ?? "No owner"}</p>
                    </div>
                    <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${conditionBadgeClass(eq.condition)}`}>
                      {eq.condition}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {matches.length === 0 && (
            <p className="text-sm text-[#666] text-center py-4">
              No matching equipment found. Try a different search term.
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedId) {
                onConfirm(selectedId, itemIndex)
                onClose()
              }
            }}
            disabled={!selectedId}
            className="flex-1 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  )
}
