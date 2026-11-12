import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchEquipments, type Equipment } from "../../services/api"
import { submitRequest } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
  import { useToast } from "../../hooks/useToast"
  import { FiPlus, FiTrash2, FiSearch } from "react-icons/fi"
  import QRScanner from "../scan/QRScanner"
import { usePageTitle } from "../../hooks/usePageTitle"
import { formatWallClock } from "../../utils/datetime"
import PaginationNav from "../../components/PaginationNav"
import CategoryFolderGrid from "../../components/CategoryFolderGrid"
import EquipmentPickerList, { conditionChipClass } from "../../components/EquipmentPickerList"
import { FiArrowLeft } from "react-icons/fi"

function todayNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

interface FormItem {
  name: string
  equipmentId: string
  owner: string
  condition: string
  quantity: number
}

const PAGE_SIZE = 5

export default function RequestPage() {
  usePageTitle("Request")
  const { user } = useAuth()
  const { showToast } = useToast()

  const [formItems, setFormItems] = useState<FormItem[]>([])
  const [reason, setReason] = useState("")
  const [pickupLocation, setPickupLocation] = useState("")
  const [returnLocation, setReturnLocation] = useState("")
  const [dateBorrowed, setDateBorrowed] = useState("")
  const [dateDue, setDateDue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [scanEpoch, setScanEpoch] = useState(0)
  const [success, setSuccess] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const [search, setSearch] = useState("")
  const [listPage, setListPage] = useState(1)
  const [showMobilePicker, setShowMobilePicker] = useState(false)
  const [pickerCategory, setPickerCategory] = useState<string | null>(null)
  const [dragOverForm, setDragOverForm] = useState(false)
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

  useEffect(() => {
    const onTourGoto = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail
      if (typeof detail === "number" && detail >= 1 && detail <= 3) setFormStep(detail)
    }
    window.addEventListener("skems-tour-goto-step", onTourGoto)
    return () => window.removeEventListener("skems-tour-goto-step", onTourGoto)
  }, [])

  const getAvailableCount = (selectedId: string): number => {
    if (!selectedId) return 999
    const selected = equipments.find(e => e.id === selectedId)
    if (!selected) return 999
    return equipments.filter(e => e.name === selected.name).length
  }

  const availableEquipments = useMemo(() => {
    const lower = search.toLowerCase()
    return equipments.filter(e => !lower || e.name.toLowerCase().includes(lower) || e.id.toLowerCase().includes(lower))
  }, [equipments, search])

  const pickerCategories = useMemo(
    () => [...new Set(equipments.map(e => e.category))].sort((a, b) => a.localeCompare(b)),
    [equipments],
  )

  const pickerCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of equipments) counts[e.category] = (counts[e.category] ?? 0) + 1
    return counts
  }, [equipments])

  const folderEquipments = useMemo(() => {
    if (!pickerCategory || pickerCategory === "__all__") return availableEquipments
    return availableEquipments.filter(e => e.category === pickerCategory)
  }, [availableEquipments, pickerCategory])

  const totalPages = Math.max(1, Math.ceil(folderEquipments.length / PAGE_SIZE))
  const safePage = Math.min(listPage, totalPages)
  const pagedEquipments = useMemo(
    () => folderEquipments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [folderEquipments, safePage],
  )
  const inFormIds = useMemo(() => new Set(formItems.map(i => i.equipmentId)), [formItems])

  const paginationFooter = totalPages > 1 && (
    <PaginationNav
      page={safePage}
      totalPages={totalPages}
      onChange={setListPage}
    />
  )

  const stepLabels = ["Equipment", "Details", "Schedule"]

  const validateStep = (step: number): string | null => {
    if (step === 1 && formItems.length === 0) return "Add at least one equipment item."
    if (step === 2 && (!reason || !pickupLocation || !returnLocation)) return "Please fill in all fields."
    if (step === 3) {
      if (!dateBorrowed || !dateDue) return "Please fill in all fields."
      if (new Date(dateDue) < new Date(dateBorrowed)) return "Return date must be after borrow date."
    }
    return null
  }

  const goToStep = (step: number) => {
    if (step >= formStep) return
    setFormStep(step)
  }

  const handleNext = () => {
    const error = validateStep(formStep)
    if (error) {
      showToast(error, "error")
      return
    }
    if (formStep < 3) setFormStep(s => s + 1)
    else setShowModal(true)
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
      setPickupLocation("")
      setReturnLocation("")
      setDateBorrowed("")
      setDateDue("")
      setFormStep(1)
    } catch {
      showToast("Failed to submit request. Please try again.", "error")
    }

    setSubmitting(false)
  }

  if (!user) return null

  const positionDepartment = toTitleCase(user.position ?? "Trainee")

  const fmt = (v: string) =>
    formatWallClock(v, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="min-h-screen flex items-center justify-center px-3 py-8 bg-fixed-black">      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="md:w-2/5 flex flex-col gap-3 dark-card p-4">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-white mb-1">
            Equipment Request
          </h2>
          <p className="hidden sm:block text-xs text-[#a6a6a6] text-center -mt-3 mb-1">
            Drag equipment onto the form, or tap to add it.
          </p>

          <div className="hidden md:flex flex-col gap-3 flex-1 min-h-0">
            {pickerCategory !== null && (
              <button
                type="button"
                onClick={() => { setPickerCategory(null); setListPage(1) }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <FiArrowLeft size={12} />
                All Folders
              </button>
            )}

            {pickerCategory === null ? (
              <div className="flex-1 min-h-40 max-h-80 overflow-y-auto pr-1" data-tour="equipment-list">
                <CategoryFolderGrid
                  categories={pickerCategories}
                  counts={pickerCounts}
                  total={equipments.length}
                  allLabel="All Equipment"
                  onSelect={(c) => { setPickerCategory(c); setListPage(1) }}
                  compact
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a6a6a6] pointer-events-none" size={14} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setListPage(1) }}
                    placeholder="Search equipment..."
                    className="dark-input w-full text-sm pl-8"
                  />
                </div>

                <div className="flex-1 min-h-40 max-h-80 overflow-y-auto pr-1" data-tour="equipment-list">
                  <EquipmentPickerList
                    items={pagedEquipments}
                    loading={isLoading}
                    search={search}
                    inFormIds={inFormIds}
                    onAdd={addToFormItems}
                  />
                </div>
                {paginationFooter}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowMobilePicker(true)}
            data-tour="mobile-add"
            className="btn-gold w-full py-2.5 flex items-center justify-center gap-1 md:hidden"
          >
            <FiPlus size={18} />
            <span>Add Equipment</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrScanner(prev => !prev)}
            className="btn-ghost w-full py-2 text-sm flex items-center justify-center gap-2"
          >
            Scan QR Code
            <span className="text-xs text-[#a6a6a6]">{showQrScanner ? "▾" : "▸"}</span>
          </button>
          {showQrScanner && (
            <div className="flex-1">
              <QRScanner key={scanEpoch} onScan={handleQrScan} />
            </div>
          )}
        </div>

        <div className="md:w-3/5 dark-card p-5 sm:p-8">
          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base sm:text-lg font-bold text-green-300 mb-2">Request Submitted!</p>
              <p className="text-sm text-[#a6a6a6] mb-4">Please wait for approval from an SK officer.</p>
              <button
                onClick={() => setSuccess(false)}
                className="btn-gold inline-block px-6 py-2 text-sm"
              >
                New Request
              </button>
            </div>
          ) : (
            <form
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOverForm(true) }}
              onDragLeave={(e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) setDragOverForm(false) }}
              onDrop={(e) => {
                e.preventDefault()
                setDragOverForm(false)
                const eqId = e.dataTransfer.getData("text/plain")
                const eq = equipments.find(x => x.id === eqId)
                if (eq) {
                  setFormStep(1)
                  addToFormItems(eq)
                }
              }}
              className={`space-y-4 rounded-xl transition-colors ${
                dragOverForm ? "ring-2 ring-[#c89116] bg-[#c89116]/5" : ""
              }`}
            >
              <div className="flex flex-wrap gap-2 justify-center" data-tour="form-steps">
                {stepLabels.map((label, i) => {
                  const stepNum = i + 1
                  const active = formStep === stepNum
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => goToStep(stepNum)}
                      disabled={stepNum > formStep}
                      className={`text-[10px] font-bold px-2.5 py-1 sm:text-xs sm:px-3 sm:py-1.5 rounded-full transition-colors cursor-pointer ${
                        active
                          ? "bg-[#c89116] text-white"
                          : stepNum < formStep
                            ? "bg-white/10 text-[#a6a6a6] hover:text-white cursor-pointer"
                            : "bg-white/5 text-[#a6a6a6]/50 cursor-not-allowed"
                      }`}
                    >
                      {stepNum}. {label}
                    </button>
                  )
                })}
              </div>

              {formStep === 1 && (
                <div data-tour="form-equipment" className="space-y-2">
                  {formItems.length > 0 ? (
                    <div className="space-y-2">
                      {formItems.map((item, idx) => {
                        const max = getAvailableCount(item.equipmentId)
                        return (
                          <div key={idx} className="border border-white/10 rounded-lg p-3 flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{item.name}</p>
                              <p className="text-xs text-[#a6a6a6] sm:hidden">{item.equipmentId}</p>
                              <p className="text-xs text-[#a6a6a6] sm:hidden">{item.owner ? `Owner: ${item.owner}` : "No owner"}</p>
                              <p className="hidden sm:block text-xs text-[#a6a6a6]">{item.equipmentId}{item.owner ? ` — ${item.owner}` : ""}</p>
                              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${conditionChipClass(item.condition)}`}>
                                {item.condition}
                              </span>
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
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/15 rounded transition-colors cursor-pointer"
                            >
                              <FiTrash2 size={14} />
                              Remove
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/20 rounded-lg p-6 text-center" data-tour="form-equipment">
                      <p className="text-sm text-[#a6a6a6]">
                        Drag equipment here from the left, or tap an item to add it.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {formStep === 2 && (
                <div data-tour="form-details" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Name</label>
                    <input type="text" value={user.fullName} disabled className="dark-input w-full text-base opacity-60 cursor-not-allowed" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Student Number</label>
                    <input type="text" value={user.studentNumber} disabled className="dark-input w-full text-base opacity-60 cursor-not-allowed" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Position / Department</label>
                    <input type="text" value={positionDepartment} disabled className="dark-input w-full text-base opacity-60 cursor-not-allowed" />
                  </div>

                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-[#a6a6a6] mb-1">Reason for Borrowing <span className="text-red-500">*</span></label>
                    <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={200} placeholder="Describe why you need this equipment..." className="dark-input w-full text-base resize-none" />
                    <p className="text-xs text-right text-[#a6a6a6] mt-1">{reason.length}/200</p>
                  </div>

                  <div>
                    <label htmlFor="pickupLocation" className="block text-sm font-medium text-[#a6a6a6] mb-1">Pickup Location <span className="text-red-500">*</span></label>
                    <input id="pickupLocation" type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} maxLength={200} placeholder="e.g. SK Office" className="dark-input w-full text-base" />
                  </div>

                  <div>
                    <label htmlFor="returnLocation" className="block text-sm font-medium text-[#a6a6a6] mb-1">Return Location <span className="text-red-500">*</span></label>
                    <input id="returnLocation" type="text" value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} maxLength={200} placeholder="e.g. SK Office" className="dark-input w-full text-base" />
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div data-tour="form-schedule" className="space-y-4">
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
                </div>
              )}

              <div className="flex gap-3 pt-1">
                {formStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setFormStep(s => s - 1)}
                    className="btn-ghost flex-1 py-2.5 rounded-lg text-sm"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting}
                  data-tour="form-next"
                  className="btn-gold flex-1 py-2.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {formStep < 3 ? "Next" : submitting ? "Submitting..." : "Review & Submit"}
                </button>
              </div>
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

          {showMobilePicker && (
            <div
              className="fixed inset-0 bg-black/60 z-50 md:hidden"
              onClick={() => setShowMobilePicker(false)}
            >
              <div
                className="w-full bg-[#111] rounded-t-xl border-t border-white/10 p-4 max-h-[75vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base font-bold text-white">Add Equipment</p>
                  <button
                    type="button"
                    onClick={() => setShowMobilePicker(false)}
                    className="text-[#a6a6a6] hover:text-white cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {pickerCategory !== null && (
                  <button
                    type="button"
                    onClick={() => { setPickerCategory(null); setListPage(1) }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer mb-3"
                  >
                    <FiArrowLeft size={12} />
                    All Folders
                  </button>
                )}

                {pickerCategory === null ? (
                  <CategoryFolderGrid
                    categories={pickerCategories}
                    counts={pickerCounts}
                    total={equipments.length}
                    allLabel="All Equipment"
                    onSelect={(c) => { setPickerCategory(c); setListPage(1) }}
                    compact
                  />
                ) : (
                  <>
                    <div className="relative mb-3">
                      <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a6a6a6] pointer-events-none" size={14} />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setListPage(1) }}
                        placeholder="Search equipment..."
                        className="dark-input w-full text-sm pl-8"
                      />
                    </div>

                    <EquipmentPickerList
                      items={pagedEquipments}
                      loading={isLoading}
                      search={search}
                      inFormIds={inFormIds}
                      onAdd={(eq) => { addToFormItems(eq); setShowMobilePicker(false) }}
                    />
                    {paginationFooter}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
