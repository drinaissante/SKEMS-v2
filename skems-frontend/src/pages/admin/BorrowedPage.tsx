import { useState, useEffect } from "react"
import {
  fetchBorrowedItems,
  updateBorrowedItem,
  deleteBorrowedItem,
} from "../../services/supabase"
import type { BorrowRecord } from "../../services/borrow"

const CONDITION_OPTIONS = ["Good", "Fair", "Poor", "Damaged"] as const

const conditionColors: Record<string, string> = {
  Good: "bg-green-100 text-green-700",
  Fair: "bg-yellow-100 text-yellow-700",
  Poor: "bg-orange-100 text-orange-700",
  Damaged: "bg-red-100 text-red-700",
}

function formatDate(val: string) {
  if (!val) return ""
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function ConditionBadges(value: string) {
  if (!value) return <span className="text-[#a6a6a6] text-xs">—</span>
  const items = value.split(",").map((s) => s.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((c) => (
        <span
          key={c}
          className={`text-xs font-bold px-1.5 py-0.5 rounded ${conditionColors[c] ?? "bg-gray-100 text-[#666]"}`}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

export default function BorrowedPage() {
  const [records, setRecords] = useState<BorrowRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BorrowRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [editConditionBefore, setEditConditionBefore] = useState<string[]>([])
  const [editConditionAfter, setEditConditionAfter] = useState<string[]>([])
  const [editNotes, setEditNotes] = useState("")

  const loadRecords = async () => {
    try {
      const data = await fetchBorrowedItems()
      setRecords(data)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecords() }, [])

  const handleEdit = (r: BorrowRecord) => {
    setEditing(r)
    setEditConditionBefore(r.condition_before ? r.condition_before.split(",").map((s) => s.trim()).filter(Boolean) : [])
    setEditConditionAfter(r.condition_after ? r.condition_after.split(",").map((s) => s.trim()).filter(Boolean) : [])
    setEditNotes(r.notes || "")
  }

  const toggleCondition = (
    list: string[],
    setter: (v: string[]) => void,
    value: string,
  ) => {
    setter(
      list.includes(value)
        ? list.filter((c) => c !== value)
        : [...list, value],
    )
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await updateBorrowedItem(editing.equipment_id, {
        condition_before: editConditionBefore.join(","),
        condition_after: editConditionAfter.join(","),
        notes: editNotes,
      })
      setRecords((prev) =>
        prev.map((r) =>
          r.equipment_id === editing.equipment_id
            ? {
                ...r,
                condition_before: editConditionBefore.join(","),
                condition_after: editConditionAfter.join(","),
                notes: editNotes,
              }
            : r,
        ),
      )
      setEditing(null)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (equipmentId: string) => {
    setDeleting(equipmentId)
    try {
      await deleteBorrowedItem(equipmentId)
      setRecords((prev) => prev.filter((r) => r.equipment_id !== equipmentId))
    } catch {
      // silently fail
    } finally {
      setDeleting(null)
      setShowDeleteConfirm(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-3 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-6">
          Borrowed Items
        </h1>

        {loading ? (
          <p className="text-center text-[#666] py-10">Loading borrowed items...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-[#666] py-10">No borrowed items found.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-[#d9d9d9]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f5f5f5] text-[#666] text-left">
                  <th className="px-4 py-3 font-medium">Borrower</th>
                  <th className="px-4 py-3 font-medium">Equipment ID</th>
                  <th className="px-4 py-3 font-medium">Equipment</th>
                  <th className="px-4 py-3 font-medium text-center">Qty</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Date Borrowed</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Date Due</th>
                  <th className="px-4 py-3 font-medium text-center">Before</th>
                  <th className="px-4 py-3 font-medium text-center">After</th>
                  <th className="px-4 py-3 font-medium text-center">Notes</th>
                  <th className="px-4 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9d9d9]">
                {records.map((r) => (
                  <tr key={r.equipment_id} className="text-[#222]">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-xs text-[#a6a6a6]">{r.position_department}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#c89116] font-bold">{r.equipment_id}</td>
                    <td className="px-4 py-3 min-w-40">{r.equipment_requested}</td>
                    <td className="px-4 py-3 text-center font-medium">{r.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(r.date_time_borrowing)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(r.date_time_return)}</td>
                    <td className="px-4 py-3 text-center">{ConditionBadges(r.condition_before)}</td>
                    <td className="px-4 py-3 text-center">{ConditionBadges(r.condition_after)}</td>
                    <td className="px-4 py-3 text-center text-xs text-[#666] min-w-24">{r.notes || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleEdit(r)}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-[#c89116] hover:bg-[#caa453] text-white transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(r.equipment_id)}
                          disabled={deleting === r.equipment_id}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-[#a6a6a6] text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {deleting === r.equipment_id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-[#222] mb-4">
              Edit Borrowed Item
            </h3>

            <div className="space-y-3 mb-4 pb-4 border-b border-[#d9d9d9] text-sm text-[#666]">
              <div className="flex justify-between">
                <span>Equipment ID:</span>
                <span className="font-medium text-[#c89116]">{editing.equipment_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-medium text-[#222]">{editing.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Borrower:</span>
                <span className="font-medium text-[#222]">{editing.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Equipment:</span>
                <span className="font-medium text-[#222] text-right max-w-60">{editing.equipment_requested}</span>
              </div>
              <div className="flex justify-between">
                <span>Date Borrowed:</span>
                <span className="font-medium text-[#222]">{formatDate(editing.date_time_borrowing) || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Date Due:</span>
                <span className="font-medium text-[#222]">{formatDate(editing.date_time_return) || "—"}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#666] mb-2">
                  Condition Before Borrowing
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map((c) => (
                    <label
                      key={c}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer select-none transition-colors ${
                        editConditionBefore.includes(c)
                          ? "bg-[#c89116] text-white border-[#c89116]"
                          : "border-[#d9d9d9] text-[#666] hover:bg-[#f5f5f5]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editConditionBefore.includes(c)}
                        onChange={() => toggleCondition(editConditionBefore, setEditConditionBefore, c)}
                        className="hidden"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666] mb-2">
                  Condition After Borrowing
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map((c) => (
                    <label
                      key={c}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer select-none transition-colors ${
                        editConditionAfter.includes(c)
                          ? "bg-[#c89116] text-white border-[#c89116]"
                          : "border-[#d9d9d9] text-[#666] hover:bg-[#f5f5f5]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editConditionAfter.includes(c)}
                        onChange={() => toggleCondition(editConditionAfter, setEditConditionAfter, c)}
                        className="hidden"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="Add admin notes here..."
                  className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <p className="text-base sm:text-lg font-bold text-[#222] mb-2 text-center">Delete Borrow Record</p>
            <p className="text-sm text-[#666] mb-6 text-center">
              Are you sure you want to delete this borrow record for <strong>{showDeleteConfirm}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleting === showDeleteConfirm}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {deleting === showDeleteConfirm ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
