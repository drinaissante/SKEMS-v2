import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchEquipments } from "../../services/api"
import { submitRequest } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { FiPlus, FiTrash2 } from "react-icons/fi"

function todayNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface FormItem {
  name: string
  quantity: number
  selectedId: string
}

export default function RequestPage() {
  const { user } = useAuth()

  const [formItems, setFormItems] = useState<FormItem[]>([])
  const [newName, setNewName] = useState("")
  const [newQuantity, setNewQuantity] = useState(1)
  const [reason, setReason] = useState("")
  const [dateBorrowed, setDateBorrowed] = useState("")
  const [dateDue, setDateDue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const { data: allEquipments = [], isLoading } = useQuery({
    queryKey: ["equipments"],
    queryFn: fetchEquipments,
  })
  const equipments = useMemo(
    () => allEquipments.filter(
      (e) => e.condition !== "Borrowed" && e.condition !== "Broken" && e.condition !== "Unavailable"
    ),
    [allEquipments],
  )

  const addItem = () => {
    if (!newName.trim()) return
    setFormItems(prev => [...prev, { name: newName.trim(), quantity: Math.max(1, newQuantity), selectedId: "" }])
    setNewName("")
    setNewQuantity(1)
  }

  const removeItem = (idx: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, patch: Partial<FormItem>) => {
    setFormItems(prev => prev.map((item, i) => i === idx ? { ...item, ...patch } : item))
  }

  const getMatches = (name: string) => {
    const q = name.toLowerCase()
    return equipments.filter(e => e.name.toLowerCase().includes(q))
  }

  const allSelected = formItems.length > 0 && formItems.every(item => item.selectedId)
  const hasUnmatched = formItems.some(item => getMatches(item.name).length === 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formItems.length === 0) {
      setError("Add at least one equipment item.")
      return
    }
    if (!allSelected) {
      setError("Select a matching equipment for each item.")
      return
    }
    if (hasUnmatched) {
      setError("Some items have no matching equipment in inventory.")
      return
    }
    if (!reason || !dateBorrowed || !dateDue) {
      setError("Please fill in all fields.")
      return
    }
    if (new Date(dateDue) < new Date(dateBorrowed)) {
      setError("Return date must be after borrow date.")
      return
    }

    setShowModal(true)
  }

  const confirmSubmit = async () => {
    setShowModal(false)
    setSubmitting(true)

    try {
      for (const item of formItems) {
        const eq = equipments.find(e => e.id === item.selectedId)
        if (!eq) continue
        await submitRequest({
          equipmentId: item.selectedId,
          equipmentName: eq.name,
          borrowerName: user?.fullName ?? "",
          studentNumber: user?.studentNumber ?? "",
          reason,
          dateBorrowed,
          dateDue,
          userId: user?.id ?? "",
          quantity: item.quantity,
        })
      }

      setSuccess(true)
      setFormItems([])
      setReason("")
      setDateBorrowed("")
      setDateDue("")
    } catch {
      setError("Failed to submit request. Please try again.")
    }

    setSubmitting(false)
  }

  if (!user) return null

  const fmt = (v: string) => {
    if (!v) return ""
    const d = new Date(v)
    return d.toLocaleString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-3 py-8 bg-[#f5f5f5]">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-5 sm:p-8 border border-[#d9d9d9]">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-[#222] mb-5">
          Equipment Request
        </h2>

        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base sm:text-lg font-bold text-green-600 mb-2">Request Submitted!</p>
            <p className="text-sm text-[#666] mb-4">Please wait for approval from the SK officer.</p>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-2 bg-[#c89116] hover:bg-[#caa453] text-white rounded-lg transition-colors cursor-pointer text-sm"
            >
              New Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Add Equipment</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Equipment name..."
                  className="flex-1 px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
                <input
                  type="number"
                  min={1}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  className="w-20 px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222] text-center"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-2 bg-[#c89116] hover:bg-[#caa453] text-white rounded-lg transition-colors cursor-pointer"
                >
                  <FiPlus size={18} />
                </button>
              </div>
            </div>

            {formItems.length > 0 && (
              <div className="space-y-3">
                {formItems.map((item, idx) => {
                  const matches = getMatches(item.name)
                  return (
                    <div key={idx} className="border border-[#d9d9d9] rounded-lg p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(idx, { name: e.target.value, selectedId: "" })}
                          className="flex-1 px-2 py-1.5 text-sm border border-[#d9d9d9] rounded focus:outline-none focus:ring-1 focus:ring-[#fdb125] text-[#222]"
                        />
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, { quantity: Math.max(1, Number(e.target.value)) })}
                          className="w-16 px-2 py-1.5 text-sm border border-[#d9d9d9] rounded focus:outline-none focus:ring-1 focus:ring-[#fdb125] text-[#222] text-center"
                        />
                        <span className="text-xs text-[#a6a6a6]">×</span>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>

                      {matches.length > 0 ? (
                        <select
                          value={item.selectedId}
                          onChange={(e) => updateItem(idx, { selectedId: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-[#d9d9d9] rounded focus:outline-none focus:ring-1 focus:ring-[#fdb125] text-[#222] bg-white"
                        >
                          <option value="">-- Select equipment --</option>
                          {matches.map(eq => (
                            <option key={eq.id} value={eq.id}>
                              {eq.name} ({eq.id}) — {eq.owner ?? "No owner"}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-red-500">No matching equipment found in inventory.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Name</label>
              <input type="text" value={user.fullName} disabled className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg bg-[#f5f5f5] text-[#666]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Student Number</label>
              <input type="text" value={user.studentNumber} disabled className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg bg-[#f5f5f5] text-[#666]" />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-[#666] mb-1">Reason for Borrowing</label>
              <textarea required id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Describe why you need this equipment..." className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Date & Time to be Borrowed</label>
              <div className="flex gap-2">
                <input type="datetime-local" value={dateBorrowed} onChange={(e) => setDateBorrowed(e.target.value)} className="flex-1 px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]" />
                <button type="button" onClick={() => setDateBorrowed(todayNow())} className="px-3 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0">Today</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Date & Time to be Returned / Due Date</label>
              <div className="flex gap-2">
                <input type="datetime-local" value={dateDue} onChange={(e) => setDateDue(e.target.value)} className="flex-1 px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]" />
                <button type="button" onClick={() => setDateDue(todayNow())} className="px-3 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0">Today</button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading || formItems.length === 0}
              className="w-full mt-2 py-2.5 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm sm:text-base"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-lg mx-3 max-h-[80vh] overflow-y-auto">
              <p className="text-base sm:text-lg font-bold text-[#222] mb-4 text-center">Confirm Request</p>

              <div className="space-y-3 mb-4">
                {formItems.map((item, idx) => {
                  const eq = equipments.find(e => e.id === item.selectedId)
                  return (
                    <div key={idx} className="border border-[#d9d9d9] rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#222] font-medium">{eq?.name ?? item.name}</span>
                        <span className="text-[#666]">×{item.quantity}</span>
                      </div>
                      <p className="text-xs text-[#a6a6a6]">{eq?.id} — {eq?.owner ?? "No owner"}</p>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-[#666]">Borrower</span>
                  <span className="text-[#222] font-medium">{user?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Student No.</span>
                  <span className="text-[#222] font-medium">{user?.studentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Reason</span>
                  <span className="text-[#222] font-medium text-right max-w-60 break-words">{reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Borrow Date</span>
                  <span className="text-[#222] font-medium">{fmt(dateBorrowed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Due Date</span>
                  <span className="text-[#222] font-medium">{fmt(dateDue)}</span>
                </div>
              </div>

              <div className="border-t border-[#d9d9d9] pt-4 text-center">
                <p className="text-sm text-[#666] mb-5">
                  Date returned MUST be followed accordingly. Failure to return on time may result in penalties.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSubmit}
                    className="flex-1 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
                  >
                    I Understand
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
