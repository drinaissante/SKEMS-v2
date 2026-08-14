import type { BorrowRecord } from "../../../constants/borrow"
import { formatDate, CONDITION_OPTIONS } from "../../../constants/borrowedConstants"
import { FiX } from "react-icons/fi"

/* ───────── Edit Modal ───────── */
interface EditModalProps {
  editing: BorrowRecord | null
  editConditionBefore: string
  editConditionAfter: string
  editNotes: string
  onToggleBefore: (c: string) => void
  onToggleAfter: (c: string) => void
  onNotesChange: (v: string) => void
  onClose: () => void
  onSave: () => void
  updatePending: boolean
}

export function EditModal({
  editing, editConditionBefore, editConditionAfter, editNotes,
  onToggleBefore, onToggleAfter, onNotesChange,
  onClose, onSave, updatePending,
}: EditModalProps) {
  if (!editing) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#5f5c5c93] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Edit Borrow Record</h2>
          <button onClick={onClose} className="p-1 text-[#a6a6a6] hover:text-white transition-colors cursor-pointer"><FiX size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-[#a6a6a6] uppercase font-bold mb-1">Borrower</p>
            <p className="text-sm font-medium text-white">{editing.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-[#a6a6a6] uppercase font-bold mb-1">Equipment</p>
            <p className="text-sm font-mono text-[#c89116] font-bold">{editing.equipment_id}</p>
            <p className="text-sm text-white">×{editing.quantity} {editing.equipment_requested}</p>
          </div>
          <div>
            <p className="text-xs text-[#a6a6a6] uppercase font-bold mb-1">Borrowed</p>
            <p className="text-sm text-white">{formatDate(editing.date_time_borrowing)}</p>
          </div>
          <div>
            <p className="text-xs text-[#a6a6a6] uppercase font-bold mb-1">Due</p>
            <p className="text-sm text-white">{formatDate(editing.date_time_return)}</p>
          </div>

          <div>
            <label className="text-xs text-[#a6a6a6] uppercase font-bold mb-1 block">Condition Before</label>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map((c) => (
                <label
                  key={c}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer select-none transition-colors ${
                    editConditionBefore === c
                      ? "bg-[#c89116] text-white border-[#c89116]"
                      : "border-white/10 text-[#a6a6a6] hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="conditionBefore"
                    checked={editConditionBefore === c}
                    onChange={() => onToggleBefore(c)}
                    className="hidden"
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#a6a6a6] uppercase font-bold mb-1 block">Condition After</label>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTIONS.map((c) => (
                <label
                  key={c}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer select-none transition-colors ${
                    editConditionAfter === c
                      ? "bg-[#c89116] text-white border-[#c89116]"
                      : "border-white/10 text-[#a6a6a6] hover:bg-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="conditionAfter"
                    checked={editConditionAfter === c}
                    onChange={() => onToggleAfter(c)}
                    className="hidden"
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#a6a6a6] uppercase font-bold mb-1 block">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="dark-input w-full text-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={updatePending}
            className="btn-gold flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updatePending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────── Delete Modal ───────── */
interface DeleteModalProps {
  showDeleteConfirm: boolean
  deleteItemId: string | null
  deleteItemLabel: string
  onClose: () => void
  onDelete: () => void
  deletePending: boolean
}

export function DeleteModal({
  showDeleteConfirm, deleteItemId, deleteItemLabel,
  onClose, onDelete, deletePending,
}: DeleteModalProps) {
  if (!showDeleteConfirm || !deleteItemId) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#5f5c5c93] rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-2">Delete Record</h2>
        <p className="text-sm text-[#a6a6a6] mb-6">
          Are you sure you want to delete the borrow record for <span className="font-bold text-white">{deleteItemLabel}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-bold">Cancel</button>
          <button onClick={onDelete} disabled={deletePending} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-sm font-bold text-white transition-colors cursor-pointer disabled:cursor-not-allowed">
            {deletePending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ───────── Return Modal ───────── */
interface ReturnModalProps {
  returnConfirmId: string | null
  returnCondition: string
  returnItemLabel: string
  onConditionChange: (c: string) => void
  onClose: () => void
  onConfirm: () => void
  returnPending: boolean
}

export function ReturnModal({
  returnConfirmId, returnCondition, returnItemLabel,
  onConditionChange, onClose, onConfirm, returnPending,
}: ReturnModalProps) {
  if (!returnConfirmId) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#5f5c5c93] rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white mb-2">Mark as Returned</h2>
        <p className="text-sm text-[#a6a6a6] mb-4">
          Confirm return of <span className="font-bold text-white">{returnItemLabel}</span> and select its condition.
        </p>

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {CONDITION_OPTIONS.map((c) => (
            <label
              key={c}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer select-none transition-colors ${
                returnCondition === c
                  ? "bg-[#c89116] text-white border-[#c89116]"
                  : "border-white/10 text-[#a6a6a6] hover:bg-white/10"
              }`}
            >
              <input
                type="radio"
                name="returnCondition"
                checked={returnCondition === c}
                onChange={() => onConditionChange(c)}
                className="hidden"
              />
              {c}
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-bold">Cancel</button>
          <button onClick={onConfirm} disabled={returnPending} className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-40 text-sm font-bold text-white transition-colors cursor-pointer disabled:cursor-not-allowed">
            {returnPending ? "..." : "Confirm Return"}
          </button>
        </div>
      </div>
    </div>
  )
}
