import type { BorrowRecord } from "../../../constants/borrow"
import { formatDate, formatReturnedOn } from "../../../constants/borrowedConstants"
import { FiChevronRight, FiEdit2, FiTrash2 } from "react-icons/fi"

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

interface Props {
  items: BorrowRecord[]
  getOwnerPosition: (ownerName: string) => string
  hasPendingProof: (equipmentId: string) => boolean
  onOpenInfo: (r: BorrowRecord) => void
  onEdit: (r: BorrowRecord) => void
  onDelete: (id: string) => void
  deletePending: boolean
  deleteVariables: string | undefined
}

export default function BorrowedCards({
  items, getOwnerPosition, hasPendingProof, onOpenInfo, onEdit, onDelete,
  deletePending, deleteVariables,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-start gap-4">
      {items.map((r) => {
        const recordKey = `${r.equipment_id}:${r.created_at}`
        const isReturned = Boolean(r.returned_on)
        const isLate = isReturned && r.returned_on && r.date_time_return &&
          new Date(r.returned_on) > new Date(`${r.date_time_return}${r.date_time_return.length === 16 ? ":00" : ""}+08:00`)
        const pendingProof = hasPendingProof(r.equipment_id)
        const ownerPosition = getOwnerPosition(r.owner)
        return (
          <div
            key={recordKey}
            onClick={() => onOpenInfo(r)}
            className="dark-card rounded-xl border border-white/10 p-4 text-left cursor-pointer hover:border-[#c89116]/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-mono text-xs text-[#c89116] font-bold">{r.equipment_id}</p>
                <h3 className="text-base font-bold text-white leading-snug truncate">{r.equipment_requested}</h3>
                <p className="text-xs text-[#a6a6a6] mt-0.5 truncate">
                  {r.full_name}{ownerPosition ? ` · ${toTitleCase(ownerPosition)}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  isLate ? "bg-red-600 text-white" : isReturned ? "bg-green-500/15 text-green-300" : "bg-purple-500/15 text-purple-300"
                }`}
              >
                {isLate ? "Returned Late" : isReturned ? "Returned" : "Active"}
              </span>
            </div>

            <div className="text-xs text-[#a6a6a6] space-y-0.5">
              <p><span className="font-medium">Owner:</span> {r.owner || "—"}</p>
              <p><span className="font-medium">Borrowed:</span> {formatDate(r.date_time_borrowing)}</p>
              <p><span className="font-medium">Due:</span> {formatDate(r.date_time_return)}</p>
              {isReturned && (
                <p className="text-green-300"><span className="font-medium">Returned:</span> {formatReturnedOn(r.returned_on as string)}</p>
              )}
            </div>

            {pendingProof && (
              <span className="mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                Proof pending review
              </span>
            )}

            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-white/10">
              <div className="flex gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(r) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <FiEdit2 size={12} />
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(r.equipment_id) }}
                  disabled={deletePending && deleteVariables === r.equipment_id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deletePending && deleteVariables === r.equipment_id ? <span className="text-xs">...</span> : <FiTrash2 size={12} />}
                  Delete
                </button>
              </div>
              <span className="text-xs text-[#c89116] font-bold inline-flex items-center gap-1">
                View Info
                <FiChevronRight size={14} />
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
