import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchBorrowedItems,
  updateBorrowedItem,
  deleteBorrowedItem,
  returnBorrowedItem,
} from "../../services/supabase"
import type { BorrowRecord } from "../../services/borrow"
import { FiChevronDown, FiSearch, FiCheckCircle, FiEdit2, FiTrash2 } from "react-icons/fi"

const CONDITION_OPTIONS = ["Good", "Fair", "Poor", "Damaged"] as const

const conditionColors: Record<string, string> = {
  Good: "bg-green-100 text-green-700",
  Fair: "bg-yellow-100 text-yellow-700",
  Poor: "bg-orange-100 text-orange-700",
  Damaged: "bg-red-100 text-red-700",
}

const MOBILE_ITEMS = 3
const DESKTOP_ITEMS = 8

function formatDate(val: string) {
  if (!val) return ""
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  const pad = (n: number) => String(n).padStart(2, "0")
  const h = d.getHours()
  const ampm = h >= 12 ? "PM" : "AM"
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}, ${h % 12 || 12}:${pad(d.getMinutes())} ${ampm}`
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
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<BorrowRecord | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [editConditionBefore, setEditConditionBefore] = useState<string[]>([])
  const [editConditionAfter, setEditConditionAfter] = useState<string[]>([])
  const [editNotes, setEditNotes] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [returnConfirmId, setReturnConfirmId] = useState<string | null>(null)
  const [returnCondition, setReturnCondition] = useState<string>("")

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["borrowed-items"],
    queryFn: fetchBorrowedItems,
  })

  const filtered = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter((r) =>
      r.full_name.toLowerCase().includes(q) ||
      r.equipment_requested.toLowerCase().includes(q) ||
      r.equipment_id.toLowerCase().includes(q) ||
      r.position_department?.toLowerCase().includes(q)
    )
  }, [records, search])

  const itemsPerPage = isMobile ? MOBILE_ITEMS : DESKTOP_ITEMS
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const updateMutation = useMutation({
    mutationFn: ({
      equipmentId,
      updates,
    }: {
      equipmentId: string
      updates: { condition_before?: string; condition_after?: string; notes?: string }
    }) => updateBorrowedItem(equipmentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (equipmentId: string) => deleteBorrowedItem(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
    },
  })

  const returnMutation = useMutation({
    mutationFn: ({ equipmentId, conditionAfter }: { equipmentId: string; conditionAfter: string }) =>
      returnBorrowedItem(equipmentId, conditionAfter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
    },
  })

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
    try {
      await updateMutation.mutateAsync({
        equipmentId: editing.equipment_id,
        updates: {
          condition_before: editConditionBefore.join(","),
          condition_after: editConditionAfter.join(","),
          notes: editNotes,
        },
      })
      setEditing(null)
    } catch {
      console.error("Something went wrong saving.");
    }
  }

  const handleDelete = async (equipmentId: string) => {
    try {
      await deleteMutation.mutateAsync(equipmentId)
      setShowDeleteConfirm(null)
    } catch {
      console.error("Something went wrong deleting.");
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-3 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-6">
          Borrowed Items
        </h1>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
          <input
            type="text"
            placeholder="Search by borrower, equipment, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-[#666] py-10">Loading borrowed items...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#666] py-10">
            {search ? "No items match your search." : "No borrowed items found."}
          </p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow border border-[#d9d9d9]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#222] text-white text-left">
                    <th className="px-4 py-3 font-medium">Borrower</th>
                    <th className="px-4 py-3 font-medium">Equipment ID</th>
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
                <tbody className="divide-y divide-[#d9d9d9]">
                  {paginatedItems.map((r) => (
                    <tr key={r.equipment_id} className="text-[#222]">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.full_name}</div>
                        <div className="text-xs text-[#a6a6a6]">{r.position_department}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#c89116] font-bold">{r.equipment_id}</td>
                      <td className="px-4 py-3 min-w-40">{r.equipment_requested}</td>
                      <td className="px-4 py-3 text-center font-medium">{r.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(r.date_time_borrowing)}</td>
                      <td className="px-4 py-3 text-center">{ConditionBadges(r.condition_before)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDate(r.date_time_return)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">{r.returned_on ? formatDate(r.returned_on) : "—"}</td>
                      <td className="px-4 py-3 text-center">{ConditionBadges(r.condition_after)}</td>
                      <td className="px-4 py-3 text-center text-xs text-[#666] min-w-24">{r.notes || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {!r.returned_on && (
                            <button
                              onClick={() => setReturnConfirmId(r.equipment_id)}
                              disabled={returnMutation.isPending && returnMutation.variables?.equipmentId === r.equipment_id}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#222] hover:bg-[#666] disabled:bg-[#a6a6a6] text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                              title="Mark as Returned"
                            >
                              {returnMutation.isPending && returnMutation.variables?.equipmentId === r.equipment_id ? <span className="text-xs">...</span> : <FiCheckCircle size={15} />}
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(r)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#c89116] hover:bg-[#caa453] text-white transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(r.equipment_id)}
                            disabled={deleteMutation.isPending && deleteMutation.variables === r.equipment_id}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-[#a6a6a6] text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            {deleteMutation.isPending && deleteMutation.variables === r.equipment_id ? <span className="text-xs">...</span> : <FiTrash2 size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {paginatedItems.map((r) => (
                <div key={r.equipment_id} className="bg-white rounded-xl shadow border border-[#d9d9d9] p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-[#222] text-sm sm:text-base truncate">
                        {r.equipment_requested}
                      </p>
                      <p className="text-xs text-[#a6a6a6] truncate">{r.full_name}{r.position_department ? ` — ${r.position_department}` : ""}</p>
                      <p className="text-xs font-mono text-[#c89116] font-bold mt-0.5">{r.equipment_id} ×{r.quantity}</p>
                    </div>
                    <button
                      onClick={() => setExpandedRow(expandedRow === r.equipment_id ? null : r.equipment_id)}
                      className="shrink-0 p-2 text-[#666] hover:text-[#222] transition-colors cursor-pointer"
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
                        <span className="text-[#666]">{formatDate(r.date_time_borrowing)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">Before</span>
                        {ConditionBadges(r.condition_before)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 shrink-0">Due</span>
                      <span className="text-[#666]">{formatDate(r.date_time_return)}</span>
                    </div>
                    {r.returned_on ? (
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="font-bold px-1.5 py-0.5 rounded bg-[#a6a6a6] text-white shrink-0">Returned</span>
                          <span className="text-[#666]">{formatDate(r.returned_on)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">After</span>
                          {ConditionBadges(r.condition_after)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">After</span>
                        {ConditionBadges(r.condition_after)}
                      </div>
                    )}
                  </div>

                  {expandedRow === r.equipment_id && (
                    <div className="mt-3 pt-3 border-t border-[#d9d9d9] space-y-2 text-xs text-[#666]">
                      <div className="flex justify-between">
                        <span>Owner</span>
                        <span className="font-medium text-[#222] text-right max-w-48">{r.owner || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Purpose</span>
                        <span className="font-medium text-[#222] text-right max-w-48">{r.purpose_of_use || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pickup</span>
                        <span className="font-medium text-[#222] text-right max-w-48">{r.pickup_location || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Return Loc.</span>
                        <span className="font-medium text-[#222] text-right max-w-48">{r.return_location || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Notes</span>
                        <span className="font-medium text-[#222] text-right max-w-48">{r.notes || "—"}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        {!r.returned_on && (
                          <button
                            onClick={() => setReturnConfirmId(r.equipment_id)}
                            disabled={returnMutation.isPending && returnMutation.variables?.equipmentId === r.equipment_id}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#222] hover:bg-[#666] disabled:bg-[#a6a6a6] text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                            title="Mark as Returned"
                          >
                            {returnMutation.isPending && returnMutation.variables?.equipmentId === r.equipment_id ? <span className="text-xs">...</span> : <FiCheckCircle size={16} />}
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(r)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#c89116] hover:bg-[#caa453] text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(r.equipment_id)}
                          disabled={deleteMutation.isPending && deleteMutation.variables === r.equipment_id}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-[#a6a6a6] text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          {deleteMutation.isPending && deleteMutation.variables === r.equipment_id ? <span className="text-xs">...</span> : <FiTrash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#d9d9d9] disabled:text-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#666] font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#d9d9d9] disabled:text-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
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
                disabled={updateMutation.isPending}
                className="flex-1 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm"
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
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
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {deleteMutation.isPending ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {returnConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm">
            <p className="text-base sm:text-lg font-bold text-[#222] mb-2 text-center">Mark as Returned</p>
            <p className="text-sm text-[#666] mb-4 text-center">
              Select the condition of the equipment after return.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {CONDITION_OPTIONS.map((c) => (
                <label
                  key={c}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer select-none transition-colors ${
                    returnCondition === c
                      ? "bg-[#c89116] text-white border-[#c89116]"
                      : "border-[#d9d9d9] text-[#666] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <input
                    type="radio"
                    name="returnCondition"
                    checked={returnCondition === c}
                    onChange={() => setReturnCondition(c)}
                    className="hidden"
                  />
                  {c}
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setReturnConfirmId(null); setReturnCondition("") }}
                className="flex-1 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!returnCondition) return
                  returnMutation.mutate({ equipmentId: returnConfirmId, conditionAfter: returnCondition })
                  setReturnConfirmId(null)
                  setReturnCondition("")
                }}
                disabled={!returnCondition || returnMutation.isPending}
                className="flex-1 py-2 bg-[#222] hover:bg-[#666] disabled:bg-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {returnMutation.isPending ? "..." : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
