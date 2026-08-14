import type { ReactNode } from "react"
import type { BorrowRecord } from "../../../constants/borrow"
import { formatDate, formatReturnedOn } from "../../../constants/borrowedConstants"
import ConditionBadges from "./BorrowedUtils"
import { FiCheckCircle, FiEdit2, FiTrash2 } from "react-icons/fi"

interface Props {
  items: BorrowRecord[]
  onReturn: (id: string) => void
  onEdit: (r: BorrowRecord) => void
  onDelete: (id: string) => void
  returnPending: boolean
  returnVariables: { equipmentId: string; conditionAfter: string } | undefined
  deletePending: boolean
  deleteVariables: string | undefined
}

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#a6a6a6] font-bold mb-1">{label}</p>
      <div className="text-sm text-white">{children}</div>
    </div>
  )
}

export default function BorrowedCards({
  items, onReturn, onEdit, onDelete,
  returnPending, returnVariables,
  deletePending, deleteVariables,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((r) => {
        const isReturned = Boolean(r.returned_on)
        return (
          <div key={r.equipment_id} className="dark-card rounded-xl border border-white/10 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-[#c89116] font-bold">{r.equipment_id}</p>
                <h3 className="text-base font-bold text-white leading-snug">{r.equipment_requested}</h3>
              </div>
              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  isReturned ? "bg-green-500/15 text-green-300" : "bg-purple-500/15 text-purple-300"
                }`}
              >
                {isReturned ? "Returned" : "Active"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#c89116]/15 border border-[#c89116]/40 text-[#fdb125] font-bold">
                ×{r.quantity}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoBlock label="Borrower">
                <div className="font-medium text-white">{r.full_name}</div>
                <div className="text-xs text-[#a6a6a6]">{r.position_department}</div>
              </InfoBlock>
              <InfoBlock label="Owner">
                <span className="text-[#a6a6a6]">{r.owner || "—"}</span>
              </InfoBlock>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoBlock label="Borrowed">
                <span className="whitespace-nowrap text-xs text-white">{formatDate(r.date_time_borrowing)}</span>
              </InfoBlock>
              <InfoBlock label="Due">
                <span className="whitespace-nowrap text-xs text-white">{formatDate(r.date_time_return)}</span>
              </InfoBlock>
              {isReturned && (
                <InfoBlock label="Returned On">
                  <span className="whitespace-nowrap text-xs text-green-300">{formatReturnedOn(r.returned_on as string)}</span>
                </InfoBlock>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoBlock label="Condition Before">{ConditionBadges(r.condition_before)}</InfoBlock>
              <InfoBlock label="Condition After">{isReturned ? ConditionBadges(r.condition_after) : <span className="text-xs text-[#a6a6a6]">—</span>}</InfoBlock>
            </div>

            {r.pickup_location || r.return_location ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoBlock label="Pickup">
                  <span className="text-xs text-white">{r.pickup_location || "—"}</span>
                </InfoBlock>
                <InfoBlock label="Return">
                  <span className="text-xs text-white">{r.return_location || "—"}</span>
                </InfoBlock>
              </div>
            ) : null}

            {r.purpose_of_use ? (
              <InfoBlock label="Purpose">
                <p className="text-sm text-white">{r.purpose_of_use}</p>
              </InfoBlock>
            ) : null}

            {r.notes ? (
              <InfoBlock label="Notes">
                <p className="text-sm text-[#a6a6a6]">{r.notes}</p>
              </InfoBlock>
            ) : null}

            <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-white/10">
              {!isReturned && (
                <button
                  onClick={() => onReturn(r.equipment_id)}
                  disabled={returnPending && returnVariables?.equipmentId === r.equipment_id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {returnPending && returnVariables?.equipmentId === r.equipment_id ? <span className="text-xs">...</span> : <FiCheckCircle size={14} />}
                  Return
                </button>
              )}
              <button
                onClick={() => onEdit(r)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#c89116] hover:bg-[#caa453] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <FiEdit2 size={14} />
                Edit
              </button>
              <button
                onClick={() => onDelete(r.equipment_id)}
                disabled={deletePending && deleteVariables === r.equipment_id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {deletePending && deleteVariables === r.equipment_id ? <span className="text-xs">...</span> : <FiTrash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
