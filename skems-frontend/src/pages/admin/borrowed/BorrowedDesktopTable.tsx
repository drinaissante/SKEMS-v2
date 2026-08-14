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

export default function BorrowedDesktopTable({
  items, onReturn, onEdit, onDelete,
  returnPending, returnVariables,
  deletePending, deleteVariables,
}: Props) {
  return (
    <div className="hidden md:block overflow-x-auto dark-card rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 text-white text-left">
            <th className="px-4 py-3 font-medium">Borrower</th>
            <th className="px-4 py-3 font-medium">Equipment</th>
            <th className="px-4 py-3 font-medium text-center">Qty</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">Borrowed</th>
            <th className="px-4 py-3 font-medium text-center">Before</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">Due</th>
            <th className="px-4 py-3 font-medium whitespace-nowrap">Returned On</th>
            <th className="px-4 py-3 font-medium text-center">After</th>
            <th className="px-4 py-3 font-medium text-center">Notes</th>
            <th className="px-4 py-3 font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {items.map((r) => (
            <tr key={r.equipment_id} className="text-white">
              <td className="px-4 py-3">
                <div className="font-medium">{r.full_name}</div>
                <div className="text-xs text-[#a6a6a6]">{r.position_department}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-mono text-xs text-[#c89116] font-bold">{r.equipment_id}</div>
                <div className="text-sm text-white">{r.equipment_requested}</div>
              </td>
              <td className="px-4 py-3 text-center font-medium">{r.quantity}</td>
              <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(r.date_time_borrowing)}</td>
              <td className="px-4 py-3 text-center">{ConditionBadges(r.condition_before)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(r.date_time_return)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-xs">{r.returned_on ? formatReturnedOn(r.returned_on) : "—"}</td>
              <td className="px-4 py-3 text-center">{ConditionBadges(r.condition_after)}</td>
              <td className="px-4 py-3 text-center text-xs text-[#a6a6a6] min-w-24">{r.notes || "—"}</td>
              <td className="px-4 py-3 text-center">
                <div className="flex gap-1 justify-center">
                  {!r.returned_on && (
                    <button
                      onClick={() => onReturn(r.equipment_id)}
                      disabled={returnPending && returnVariables?.equipmentId === r.equipment_id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-40 text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title="Mark as Returned"
                    >
                      {returnPending && returnVariables?.equipmentId === r.equipment_id ? <span className="text-xs">...</span> : <FiCheckCircle size={15} />}
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(r)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#c89116] hover:bg-[#caa453] text-white transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <FiEdit2 size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(r.equipment_id)}
                    disabled={deletePending && deleteVariables === r.equipment_id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    {deletePending && deleteVariables === r.equipment_id ? <span className="text-xs">...</span> : <FiTrash2 size={15} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
