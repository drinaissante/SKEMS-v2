import type { BorrowRecord } from "../../../constants/borrow"
import { formatDate, formatReturnedOn } from "../../../constants/borrowedConstants"
import ConditionBadges from "./BorrowedUtils"
import { FiChevronDown, FiCheckCircle, FiEdit2, FiTrash2 } from "react-icons/fi"

interface Props {
  items: BorrowRecord[]
  expandedRow: string | null
  onToggleRow: (id: string) => void
  onReturn: (id: string) => void
  onEdit: (r: BorrowRecord) => void
  onDelete: (id: string) => void
  returnPending: boolean
  returnVariables: { equipmentId: string; conditionAfter: string } | undefined
  deletePending: boolean
  deleteVariables: string | undefined
}

export default function BorrowedMobileCards({
  items, expandedRow, onToggleRow,
  onReturn, onEdit, onDelete,
  returnPending, returnVariables,
  deletePending, deleteVariables,
}: Props) {
  return (
    <div className="md:hidden space-y-3">
      {items.map((r) => (
        <div key={r.equipment_id} className="dark-card p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <p className="text-xs font-mono text-[#c89116] font-bold">{r.equipment_id} ×{r.quantity}</p>
              <p className="font-bold text-white text-sm sm:text-base truncate">
                {r.equipment_requested}
              </p>
              <p className="text-xs text-[#a6a6a6] truncate">{r.full_name}{r.position_department ? ` — ${r.position_department}` : ""}</p>
            </div>
            <button
              onClick={() => onToggleRow(r.equipment_id)}
              className="shrink-0 p-2 text-[#a6a6a6] hover:text-white transition-colors cursor-pointer"
            >
              <FiChevronDown
                size={18}
                className={`transition-transform ${expandedRow === r.equipment_id ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5">
                <span className="font-bold px-1.5 py-0.5 rounded bg-[#caa453]/20 text-[#caa453] shrink-0">Borrowed</span>
                <span className="text-[#a6a6a6]">{formatDate(r.date_time_borrowing)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-300 shrink-0">Before</span>
                {ConditionBadges(r.condition_before)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 shrink-0">Due</span>
              <span className="text-[#a6a6a6]">{formatDate(r.date_time_return)}</span>
            </div>
            {r.returned_on && (
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#a6a6a6] shrink-0">Returned</span>
                  <span className="text-[#a6a6a6]">{formatReturnedOn(r.returned_on)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-300 shrink-0">After</span>
                  {ConditionBadges(r.condition_after)}
                </span>
              </div>
            )}
          </div>

          {expandedRow === r.equipment_id && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs text-[#a6a6a6]">
              <div className="flex justify-between">
                <span>Owner</span>
                <span className="font-medium text-white text-right max-w-48">{r.owner || "—"}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span>Purpose</span>
                <span className="font-medium text-white wrap-break-word">{r.purpose_of_use || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Pickup</span>
                <span className="font-medium text-white text-right max-w-48">{r.pickup_location || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Return Loc.</span>
                <span className="font-medium text-white text-right max-w-48">{r.return_location || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Notes</span>
                <span className="font-medium text-white text-right max-w-48">{r.notes || "—"}</span>
              </div>
              <div className="flex gap-2 pt-2">
                {!r.returned_on && (
                  <button
                    onClick={() => onReturn(r.equipment_id)}
                    disabled={returnPending && returnVariables?.equipmentId === r.equipment_id}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-40 text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Mark as Returned"
                  >
                    {returnPending && returnVariables?.equipmentId === r.equipment_id ? <span className="text-xs">...</span> : <FiCheckCircle size={16} />}
                  </button>
                )}
                <button
                  onClick={() => onEdit(r)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#c89116] hover:bg-[#caa453] text-white transition-colors cursor-pointer"
                  title="Edit"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(r.equipment_id)}
                  disabled={deletePending && deleteVariables === r.equipment_id}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Delete"
                >
                  {deletePending && deleteVariables === r.equipment_id ? <span className="text-xs">...</span> : <FiTrash2 size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
