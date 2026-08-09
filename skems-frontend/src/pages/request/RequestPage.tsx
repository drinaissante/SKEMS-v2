import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchEquipments, type Equipment } from "../../services/api"
import { submitRequest } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { FiPlus, FiTrash2 } from "react-icons/fi"
import QRScanner from "../scan/QRScanner"
import { usePageTitle } from "../../hooks/usePageTitle"

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
  usePageTitle("Request")
  const { user } = useAuth()
  const { showToast } = useToast()

  const [formItems, setFormItems] = useState<FormItem[]>([])
  const [reason, setReason] = useState("")
  const [positionDepartment, setPositionDepartment] = useState("")
  const [pickupLocation, setPickupLocation] = useState("")
  const [returnLocation, setReturnLocation] = useState("")
  const [dateBorrowed, setDateBorrowed] = useState("")
  const [dateDue, setDateDue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const [scanEpoch, setScanEpoch] = useState(0)
  const [selectorSelectedId, setSelectorSelectedId] = useState("")
  const [selectorQuantity, setSelectorQuantity] = useState(1)
  const [success, setSuccess] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const autoEquipId = searchParams.get("id")
  const hasAutoFilled = useRef(false)

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

  const addToFormItems = useCallback((eq: Equipment) => {
    if (formItems.some(i => i.equipmentId === eq.id)) {
      showToast(`${eq.name} already in request`, "error")
      return
    }

    const unavailable = ["Borrowed", "Broken", "Unavailable"]
    if (unavailable.includes(eq.condition)) {
      showToast(`${eq.name} is not available for request`, "error")
      return
    }

    setFormItems(prev => [...prev, {
      name: eq.name,
      equipmentId: eq.id,
      owner: eq.owner ?? "",
      condition: eq.condition,
      quantity: 1,
    }])
    showToast(`${eq.name} added from QR`, "success")
  }, [formItems, showToast])

  const handleQrScan = useCallback((code: string) => {
    let targetId = code

    if (code.startsWith("http://") || code.startsWith("https://")) {
      try {
        const url = new URL(code)
        const eqId = url.searchParams.get("id")
        if (url.pathname === "/equipment" && eqId) {
          targetId = eqId
        }
      } catch { /* noop */ }

      fetch(code)
        .then(res => res.json())
        .then(data => { targetId = data.item_id || targetId })
        .catch(() => { /* keep original */ })
    }

    const eq = allEquipments.find(e => e.id === targetId)
    if (!eq) {
      showToast("Equipment not found", "error")
      return
    }

    addToFormItems(eq)
    setScanEpoch(n => n + 1)
    setSearchParams({}, { replace: true })
  }, [allEquipments, addToFormItems, showToast, setSearchParams])

  useEffect(() => {
    if (hasAutoFilled.current || !autoEquipId || !equipments.length) return

    const eq = allEquipments.find(e => e.id === autoEquipId)
    if (!eq) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    addToFormItems(eq)
    hasAutoFilled.current = true
  }, [autoEquipId, equipments, allEquipments, addToFormItems])

  const getAvailableCount = (selectedId: string): number => {
    if (!selectedId) return 999
    const selected = equipments.find(e => e.id === selectedId)
    if (!selected) return 999
    return equipments.filter(e => e.name === selected.name).length
  }

  const handleAddClick = () => {
    if (equipments.length === 0) {
      showToast("No equipment available.", "error")
      return
    }
    setSelectorSelectedId(equipments[0].id)
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

    if (formItems.length === 0) {
      showToast("Add at least one equipment item.", "error")
      return
    }
    if (!reason || !positionDepartment || !pickupLocation || !returnLocation || !dateBorrowed || !dateDue) {
      showToast("Please fill in all fields.", "error")
      return
    }
    if (new Date(dateDue) < new Date(dateBorrowed)) {
      showToast("Return date must be after borrow date.", "error")
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
      showToast("Failed to submit request. Please try again.", "error")
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
    <div className="min-h-screen flex items-center justify-center px-3 py-8 bg-fixed-black">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-4">
        <div className="md:w-2/5 flex flex-col gap-3 dark-card p-4">
          <div className="flex-1">
            <QRScanner key={scanEpoch} onScan={handleQrScan} />
          </div>
          <button
            type="button"
            onClick={handleAddClick}
            className="btn-gold w-full py-2.5 flex items-center justify-center gap-1"
          >
            <FiPlus size={18} />
            <span>Add Equipment</span>
          </button>
        </div>

        <div className="md:w-3/5 dark-card p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-white mb-5">
            Equipment Request
          </h2>

          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base sm:text-lg font-bold text-green-300 mb-2">Request Submitted!</p>
              <p className="text-sm text-[#a6a6a6] mb-4">Please wait for approval from the SK officer.</p>
              <button
                onClick={() => setSuccess(false)}
                className="btn-gold inline-block px-6 py-2 text-sm"
              >
                New Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formItems.length > 0 && (
                <div className="space-y-2">
                  {formItems.map((item, idx) => {
                    const max = getAvailableCount(item.equipmentId)
                    return (
                      <div key={idx} className="border border-white/10 rounded-lg p-3 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.name}</p>
                          <p className="text-xs text-[#a6a6a6]">{item.equipmentId}{item.owner ? ` — ${item.owner}` : ""}</p>
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${
                            item.condition === "Working" ? "bg-green-500/15 text-green-300" :
                            item.condition === "Needs Repair" ? "bg-[#ffd870] text-[#222]" :
                            item.condition === "Broken" ? "bg-red-500/15 text-red-300" :
                            "bg-white/10 text-[#a6a6a6]"
                          }`}>{item.condition}</span>
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={max}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                          className="dark-input w-16 px-2 py-1 text-sm text-center"
                        />
                        <span className="text-xs text-[#a6a6a6]">×</span>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1.5 text-red-400 hover:bg-red-500/15 rounded transition-colors cursor-pointer"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Name</label>
                <input type="text" value={user.fullName} disabled className="dark-input w-full text-base opacity-60 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Student Number</label>
                <input type="text" value={user.studentNumber} disabled className="dark-input w-full text-base opacity-60 cursor-not-allowed" />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-[#a6a6a6] mb-1">Reason for Borrowing <span className="text-red-500">*</span></label>
                <textarea required id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={200} placeholder="Describe why you need this equipment..." className="dark-input w-full text-base resize-none" />
                <p className="text-xs text-right text-[#a6a6a6] mt-1">{reason.length}/200</p>
              </div>

              <div>
                <label htmlFor="positionDepartment" className="block text-sm font-medium text-[#a6a6a6] mb-1">Position / Department <span className="text-red-500">*</span></label>
                <select required id="positionDepartment" value={positionDepartment} onChange={(e) => setPositionDepartment(e.target.value)} className="dark-input w-full text-base">
                  <option value="" disabled>Select position...</option>
                  <option value="president">President</option>
                  <option value="vice president">Vice President</option>
                  <option value="treasurer">Treasurer</option>
                  <option value="videographer">Videographer</option>
                  <option value="videographer head">Videographer Head</option>
                  <option value="photographer">Photographer</option>
                  <option value="photographer head">Photographer Head</option>
                  <option value="graphics">Graphics</option>
                  <option value="graphics head">Graphics Head</option>
                </select>
              </div>

              <div>
                <label htmlFor="pickupLocation" className="block text-sm font-medium text-[#a6a6a6] mb-1">Pickup Location <span className="text-red-500">*</span></label>
                <input required id="pickupLocation" type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} maxLength={200} placeholder="e.g. SK Office" className="dark-input w-full text-base" />
              </div>

              <div>
                <label htmlFor="returnLocation" className="block text-sm font-medium text-[#a6a6a6] mb-1">Return Location <span className="text-red-500">*</span></label>
                <input required id="returnLocation" type="text" value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} maxLength={200} placeholder="e.g. SK Office" className="dark-input w-full text-base" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[#a6a6a6]">Date & Time to be Borrowed <span className="text-red-500">*</span></label>
                  <button type="button" onClick={() => setDateBorrowed(todayNow())} className="btn-gold text-xs px-2 py-1">Today</button>
                </div>
                <input type="datetime-local" value={dateBorrowed} onChange={(e) => setDateBorrowed(e.target.value)} className="dark-input w-full text-base" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[#a6a6a6]">Date & Time to be Returned / Due Date <span className="text-red-500">*</span></label>
                  <button type="button" onClick={() => setDateDue(todayNow())} className="btn-gold text-xs px-2 py-1">Today</button>
                </div>
                <input type="datetime-local" value={dateDue} onChange={(e) => setDateDue(e.target.value)} className="dark-input w-full text-base" />
              </div>

              <button
                type="submit"
                disabled={submitting || isLoading || formItems.length === 0}
                className="btn-gold w-full py-2.5 text-sm sm:text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
              <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-lg mx-3 max-h-[80vh] overflow-y-auto">
                <p className="text-base sm:text-lg font-bold text-white mb-4 text-center">Confirm Request</p>

                <div className="space-y-3 mb-4">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="border border-white/10 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white font-medium">{item.name}</span>
                        <span className="text-[#a6a6a6]">×{item.quantity}</span>
                      </div>
                      <p className="text-xs text-[#a6a6a6]">{item.equipmentId}{item.owner ? ` — ${item.owner}` : ""}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Borrower</span>
                    <span className="text-white font-medium">{user?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Student No.</span>
                    <span className="text-white font-medium">{user?.studentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Reason</span>
                    <span className="text-white font-medium text-right max-w-60 wrap-break-word">{reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Position/Dept</span>
                    <span className="text-white font-medium text-right max-w-60">{positionDepartment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Pickup Loc.</span>
                    <span className="text-white font-medium text-right max-w-60">{pickupLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Return Loc.</span>
                    <span className="text-white font-medium text-right max-w-60">{returnLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Borrow Date</span>
                    <span className="text-white font-medium">{fmt(dateBorrowed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a6]">Due Date</span>
                    <span className="text-white font-medium">{fmt(dateDue)}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 text-center">
                  <p className="text-sm text-[#a6a6a6] mb-5">
                    Date returned MUST be followed accordingly. Failure to return on time may result in penalties.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="btn-ghost flex-1 py-2 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmSubmit}
                      className="btn-gold flex-1 py-2 rounded-lg text-sm"
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
              <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md mx-3">
                <p className="text-base sm:text-lg font-bold text-white mb-4 text-center">
                  Select Equipment
                </p>
                <p className="text-sm text-[#a6a6a6] mb-4 text-center">
                  {equipments.length} available
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Equipment</label>
                    <select
                      value={selectorSelectedId}
                      onChange={(e) => { setSelectorSelectedId(e.target.value); setSelectorQuantity(1) }}
                      className="dark-input w-full text-sm"
                    >
                      {equipments.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} ({eq.id})
                        </option>
                      ))}
                    </select>
                    {(() => {
                      const sel = equipments.find(eq => eq.id === selectorSelectedId)
                      if (!sel) return null
                      return (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg text-sm space-y-1">
                          <p className="font-medium text-white">{sel.name}</p>
                          <p className="text-xs text-[#a6a6a6]">{sel.id} — {sel.owner ?? "No owner"}</p>
                          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${sel.condition === "Working" ? "bg-green-500/15 text-green-300" : sel.condition === "Needs Repair" ? "bg-yellow-500/15 text-yellow-300" : sel.condition === "Broken" ? "bg-red-500/15 text-red-300" : sel.condition === "Not checked" ? "bg-white/10 text-[#a6a6a6]" : "bg-purple-500/15 text-purple-300"}`}>
                            {sel.condition}
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                      Quantity <span className="text-[#a6a6a6] font-normal">(max: {maxQty})</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={selectorQuantity}
                      onChange={(e) => setSelectorQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
                      className="dark-input w-full text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSelector(false)}
                    className="btn-ghost flex-1 py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmAddItem}
                    className="btn-gold flex-1 py-2 rounded-lg text-sm"
                  >
                    <span className="hidden sm:inline">Add to Request</span><span className="sm:hidden">Add</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
