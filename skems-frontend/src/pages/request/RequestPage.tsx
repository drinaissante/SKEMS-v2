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
  equipmentId: string
  owner: string
  condition: string
  quantity: number
}

export default function RequestPage() {
  const { user } = useAuth()

  const [formItems, setFormItems] = useState<FormItem[]>([])
  const [newName, setNewName] = useState("")
  const [reason, setReason] = useState("")
  const [positionDepartment, setPositionDepartment] = useState("")
  const [pickupLocation, setPickupLocation] = useState("")
  const [returnLocation, setReturnLocation] = useState("")
  const [dateBorrowed, setDateBorrowed] = useState("")
  const [dateDue, setDateDue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const [selectorName, setSelectorName] = useState("")
  const [selectorMatches, setSelectorMatches] = useState<typeof equipments>([])
  const [selectorSelectedId, setSelectorSelectedId] = useState("")
  const [selectorQuantity, setSelectorQuantity] = useState(1)
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

  const getMatches = (query: string) => {
    const q = query.toLowerCase()
    return equipments.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    )
  }

  const getAvailableCount = (selectedId: string): number => {
    if (!selectedId) return 999
    const selected = equipments.find(e => e.id === selectedId)
    if (!selected) return 999
    return equipments.filter(e => e.name === selected.name).length
  }

  const handleAddClick = () => {
    if (!newName.trim()) return
    const matches = getMatches(newName.trim())
    if (matches.length === 0) {
      setError(`No matching equipment found for "${newName.trim()}".`)
      return
    }
    setError("")
    setSelectorName(newName.trim())
    setSelectorMatches(matches)
    setSelectorSelectedId(matches[0].id)
    setSelectorQuantity(1)
    setShowSelector(true)
  }

  const confirmAddItem = () => {
    const eq = equipments.find(e => e.id === selectorSelectedId)
    if (!eq) return
    const max = getAvailableCount(eq.id)
    setFormItems(prev => [...prev, {
      name: eq.name,
      equipmentId: eq.id,
      owner: eq.owner ?? "",
      condition: eq.condition,
      quantity: Math.min(selectorQuantity, max),
    }])
    setShowSelector(false)
    setNewName("")
  }

  const removeItem = (idx: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateQuantity = (idx: number, qty: number) => {
    setFormItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const max = getAvailableCount(item.equipmentId)
      return { ...item, quantity: Math.min(max, Math.max(1, qty)) }
    }))
  }

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault()
    setError("")

    if (formItems.length === 0) {
      setError("Add at least one equipment item.")
      return
    }
    if (!reason || !positionDepartment || !pickupLocation || !returnLocation || !dateBorrowed || !dateDue) {
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
        await submitRequest({
          equipmentId: item.equipmentId,
          equipmentName: item.name,
          borrowerName: user?.fullName ?? "",
          studentNumber: user?.studentNumber ?? "",
          reason,
          dateBorrowed,
          dateDue,
          userId: user?.id ?? "",
          quantity: item.quantity,
          positionDepartment,
          pickupLocation,
          returnLocation,
          owner: item.owner,
        })
      }

      setSuccess(true)
      setFormItems([])
      setReason("")
      setPositionDepartment("")
      setPickupLocation("")
      setReturnLocation("")
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

  const maxQty = getAvailableCount(selectorSelectedId)

  return (
    <div className="min-h-screen flex items-center justify-center px-3 py-8 bg-[#f5f5f5]">
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
              <label className="block text-sm font-medium text-[#666] mb-1">Add Equipment <span className="text-red-500">*</span></label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Equipment name..."
                  className="flex-1 px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
                <button
                  type="button"
                  onClick={handleAddClick}
                  className="px-3 py-2 bg-[#c89116] hover:bg-[#caa453] text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <FiPlus size={18} />
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {formItems.length > 0 && (
              <div className="space-y-2">
                {formItems.map((item, idx) => {
                  const max = getAvailableCount(item.equipmentId)
                  return (
                    <div key={idx} className="border border-[#d9d9d9] rounded-lg p-3 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#222] truncate">{item.name}</p>
                        <p className="text-xs text-[#a6a6a6]">{item.equipmentId}{item.owner ? ` — ${item.owner}` : ""}</p>
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${
                          item.condition === "Working" ? "bg-green-100 text-green-700" :
                          item.condition === "Needs Repair" ? "bg-[#ffd870] text-[#222]" :
                          item.condition === "Broken" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-[#666]"
                        }`}>{item.condition}</span>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={max}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border border-[#d9d9d9] rounded focus:outline-none focus:ring-1 focus:ring-[#fdb125] text-[#222] text-center"
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
              <label htmlFor="reason" className="block text-sm font-medium text-[#666] mb-1">Reason for Borrowing <span className="text-red-500">*</span></label>
              <textarea required id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={200} placeholder="Describe why you need this equipment..." className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222] resize-none" />
              <p className="text-xs text-right text-[#a6a6a6] mt-1">{reason.length}/200</p>
            </div>

            <div>
              <label htmlFor="positionDepartment" className="block text-sm font-medium text-[#666] mb-1">Position / Department <span className="text-red-500">*</span></label>
              <input required id="positionDepartment" type="text" value={positionDepartment} onChange={(e) => setPositionDepartment(e.target.value)} maxLength={100} placeholder="e.g. Student, SK Kagawad" className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]" />
            </div>

            <div>
              <label htmlFor="pickupLocation" className="block text-sm font-medium text-[#666] mb-1">Pickup Location <span className="text-red-500">*</span></label>
              <input required id="pickupLocation" type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} maxLength={200} placeholder="e.g. SK Office" className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]" />
            </div>

            <div>
              <label htmlFor="returnLocation" className="block text-sm font-medium text-[#666] mb-1">Return Location <span className="text-red-500">*</span></label>
              <input required id="returnLocation" type="text" value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} maxLength={200} placeholder="e.g. SK Office" className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#666]">Date & Time to be Borrowed <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setDateBorrowed(todayNow())} className="text-xs px-2 py-1 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded transition-colors cursor-pointer">Today</button>
              </div>
              <input type="datetime-local" value={dateBorrowed} onChange={(e) => setDateBorrowed(e.target.value)} className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#666]">Date & Time to be Returned / Due Date <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => setDateDue(todayNow())} className="text-xs px-2 py-1 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded transition-colors cursor-pointer">Today</button>
              </div>
              <input type="datetime-local" value={dateDue} onChange={(e) => setDateDue(e.target.value)} className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]" />
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
                {formItems.map((item, idx) => (
                  <div key={idx} className="border border-[#d9d9d9] rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#222] font-medium">{item.name}</span>
                      <span className="text-[#666]">×{item.quantity}</span>
                    </div>
                    <p className="text-xs text-[#a6a6a6]">{item.equipmentId}{item.owner ? ` — ${item.owner}` : ""}</p>
                  </div>
                ))}
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
                  <span className="text-[#222] font-medium text-right max-w-60 wrap-break-word">{reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Position/Dept</span>
                  <span className="text-[#222] font-medium text-right max-w-60">{positionDepartment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Pickup Loc.</span>
                  <span className="text-[#222] font-medium text-right max-w-60">{pickupLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Return Loc.</span>
                  <span className="text-[#222] font-medium text-right max-w-60">{returnLocation}</span>
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

        {showSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md mx-3">
              <p className="text-base sm:text-lg font-bold text-[#222] mb-4 text-center">
                Select Equipment
              </p>
              <p className="text-sm text-[#666] mb-4 text-center">
                Matching "<span className="font-medium text-[#222]">{selectorName}</span>"
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">Equipment</label>
                  <select
                    value={selectorSelectedId}
                    onChange={(e) => { setSelectorSelectedId(e.target.value); setSelectorQuantity(1) }}
                    className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222] bg-white"
                  >
                    {selectorMatches.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.id})
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const sel = selectorMatches.find(eq => eq.id === selectorSelectedId)
                    if (!sel) return null
                    return (
                      <div className="mt-2 p-2 bg-[#f5f5f5] rounded-lg text-sm space-y-1">
                        <p className="font-medium text-[#222]">{sel.name}</p>
                        <p className="text-xs text-[#a6a6a6]">{sel.id} — {sel.owner ?? "No owner"}</p>
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${sel.condition === "Working" ? "bg-green-100 text-green-700" : sel.condition === "Needs Repair" ? "bg-yellow-100 text-yellow-700" : sel.condition === "Broken" ? "bg-red-100 text-red-700" : sel.condition === "Not checked" ? "bg-gray-100 text-gray-700" : "bg-purple-100 text-purple-700"}`}>
                          {sel.condition}
                        </span>
                      </div>
                    )
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">
                    Quantity <span className="text-[#a6a6a6] font-normal">(max: {maxQty})</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={selectorQuantity}
                    onChange={(e) => setSelectorQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowSelector(false); setNewName("") }}
                  className="flex-1 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAddItem}
                  className="flex-1 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
                >
                  <span className="hidden sm:inline">Add to Request</span><span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
