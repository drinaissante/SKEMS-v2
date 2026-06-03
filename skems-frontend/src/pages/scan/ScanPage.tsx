import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { fetchEquipments, type Equipment } from "../../services/api"
import { supabase, addBorrowedItem } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import type { ScannedFormFields } from "../../services/borrow"
import QRScanner from "./QRScanner"
import FormScanner from "./FormScanner"

type ScanMode = "qr" | "form"

export default function ScanPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<ScanMode>("qr")

  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isScanningForm, setIsScanningForm] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [editableFields, setEditableFields] = useState<ScannedFormFields | null>(null)
  const [aiAcknowledged, setAiAcknowledged] = useState(false)
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showAiConsentModal, setShowAiConsentModal] = useState(false)

  const [selectedEquipments, setSelectedEquipments] = useState<
    Record<number, { id: string; name: string; owner: string; condition: string } | null>
  >({})

  const [showItemSelector, setShowItemSelector] = useState(false)
  const [selectorItemIndex, setSelectorItemIndex] = useState(0)
  const [selectorMatches, setSelectorMatches] = useState<Equipment[]>([])
  const [selectorSelectedId, setSelectorSelectedId] = useState("")
  const [selectorSearch, setSelectorSearch] = useState("")

  const handleQrScan = useCallback((code: string) => {
    const goToRequest = (id: string, name?: string) => {
      const params = new URLSearchParams()
      params.set("equipment", id)
      if (name) params.set("name", name)
      navigate(`/request?${params.toString()}`)
    }

    if (code.startsWith("http://") || code.startsWith("https://")) {
      fetch(code)
        .then(res => res.json())
        .then(data => goToRequest(data.item_id || code, data.equipment_name))
        .catch(() => goToRequest(code))
    } else {
      goToRequest(code)
    }
  }, [navigate])

  const handleCapture = useCallback((dataUrl: string) => {
    setCapturedImage(dataUrl)
    setShowAiConsentModal(true)
  }, [])

  const scanFormImage = useCallback(async () => {
    if (!capturedImage) return
    setIsScanningForm(true)
    setError("")

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setError("Authentication required")
      setIsScanningForm(false)
      return
    }

    const base64 = capturedImage.split(",")[1]

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ image: base64 }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Scan failed")
      }

      const fields: ScannedFormFields = {
        full_name: data.fields.full_name ?? "",
        date: data.fields.date ?? "",
        position_department: data.fields.position_department ?? "",
        owner: data.fields.owner ?? "",
        equipment_list: Array.isArray(data.fields.equipment_list) ? data.fields.equipment_list : [],
        purpose_of_use: data.fields.purpose_of_use ?? "",
        date_time_borrowing: data.fields.date_time_borrowing ?? "",
        date_time_return: data.fields.date_time_return ?? "",
        pickup_location: data.fields.pickup_location ?? "",
        return_location: data.fields.return_location ?? "",
      }

      setEditableFields({ ...fields })
      setAiAcknowledged(false)
      setReviewConfirmed(false)

      let equipData = queryClient.getQueryData<Equipment[]>(["equipments"])
      if (!equipData) {
        equipData = await queryClient.fetchQuery({
          queryKey: ["equipments"],
          queryFn: fetchEquipments,
        }) ?? []
      }
      const validEquipData = equipData.filter(
        e => e.condition !== "Broken" && e.condition !== "Unavailable"
      )

      const initialSelection: Record<number, { id: string; name: string; owner: string; condition: string } | null> = {}
      for (let i = 0; i < fields.equipment_list.length; i++) {
        const itemName = fields.equipment_list[i].item?.toLowerCase() ?? ""
        if (!itemName) {
          initialSelection[i] = null
          continue
        }
        const match = validEquipData.find(e =>
          e.name.toLowerCase().includes(itemName) ||
          e.category.toLowerCase().includes(itemName)
        )
        initialSelection[i] = match
          ? { id: match.id, name: match.name, owner: match.owner ?? "", condition: match.condition }
          : null
      }
      setSelectedEquipments(initialSelection)

      setShowResultModal(true)
      setIsScanningForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed")
      setIsScanningForm(false)
    }
  }, [capturedImage, queryClient])

  const openItemSelector = useCallback((idx: number) => {
    if (!editableFields) return
    const itemName = editableFields.equipment_list[idx]?.item ?? ""
    setSelectorItemIndex(idx)
    setSelectorSearch(itemName)

    const equipData = queryClient.getQueryData<Equipment[]>(["equipments"]) ?? []
    const validEquipData = equipData.filter(
      e => e.condition !== "Broken" && e.condition !== "Unavailable"
    )
    const q = itemName.toLowerCase()
    const matches = validEquipData.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    )
    setSelectorMatches(matches)
    setSelectorSelectedId(matches.length > 0 ? matches[0].id : "")
    setShowItemSelector(true)
  }, [editableFields, queryClient])

  const confirmItemSelection = useCallback(() => {
    if (!selectorSelectedId) return
    const equipData = queryClient.getQueryData<Equipment[]>(["equipments"]) ?? []
    const validEquipData = equipData.filter(
      e => e.condition !== "Broken" && e.condition !== "Unavailable"
    )
    const eq = validEquipData.find(e => e.id === selectorSelectedId)
    if (!eq) return

    setSelectedEquipments(prev => ({
      ...prev,
      [selectorItemIndex]: { id: eq.id, name: eq.name, owner: eq.owner ?? "", condition: eq.condition },
    }))
    setShowItemSelector(false)
  }, [selectorSelectedId, selectorItemIndex, queryClient])

  const submitFormScan = useCallback(async () => {
    if (!editableFields || !user) return

    for (let i = 0; i < editableFields.equipment_list.length; i++) {
      if (!selectedEquipments[i]) {
        setError(`Select equipment for item "${editableFields.equipment_list[i].item}".`)
        return
      }
    }

    setIsScanningForm(true)
    setError("")

    try {
      for (let i = 0; i < editableFields.equipment_list.length; i++) {
        const fi = editableFields.equipment_list[i]
        const sel = selectedEquipments[i]
        if (!sel) continue

        const qty = parseInt(fi.quantity) || 1

        await addBorrowedItem({
          equipment_id: sel.id,
          quantity: qty,
          full_name: editableFields.full_name,
          date: editableFields.date,
          position_department: editableFields.position_department,
          owner: editableFields.owner,
          equipment_requested: sel.name,
          purpose_of_use: editableFields.purpose_of_use,
          date_time_borrowing: editableFields.date_time_borrowing,
          date_time_return: editableFields.date_time_return,
          pickup_location: editableFields.pickup_location,
          return_location: editableFields.return_location,
          scanned_by: user.id,
        })
      }

      setShowResultModal(false)
      setFormSuccess(true)
    } catch {
      setError("Failed to submit. Please try again.")
    } finally {
      setIsScanningForm(false)
    }
  }, [editableFields, user, selectedEquipments])

  const resetFormMode = useCallback(() => {
    setCapturedImage(null)
    setIsScanningForm(false)
    setShowResultModal(false)
    setEditableFields(null)
    setAiAcknowledged(false)
    setReviewConfirmed(false)
    setFormSuccess(false)
    setError("")
    setSelectedEquipments({})
    setShowAiConsentModal(false)
    setShowItemSelector(false)
  }, [])

  if (!user) return null

  const fieldLabels: Record<keyof Omit<ScannedFormFields, "equipment_list">, string> = {
    full_name: "Full Name",
    date: "Date",
    position_department: "Position/Department",
    owner: "Owner",
    purpose_of_use: "Purpose of Use",
    date_time_borrowing: "Date & Time of Borrowing",
    date_time_return: "Date & Time of Return",
    pickup_location: "Pickup Location",
    return_location: "Return Location",
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 py-8 bg-[#f5f5f5]">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-5 sm:p-6 border border-[#d9d9d9]">
        <div className="flex gap-1 mb-5 bg-[#f5f5f5] rounded-lg p-1">
          <button
            onClick={() => { resetFormMode(); setMode("qr") }}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors cursor-pointer ${
              mode === "qr" ? "bg-[#c89116] text-white" : "text-[#666] hover:text-[#222]"
            }`}
          >
            QR Scanner
          </button>
          <button
            onClick={() => { resetFormMode(); setMode("form") }}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors cursor-pointer ${
              mode === "form" ? "bg-[#c89116] text-white" : "text-[#666] hover:text-[#222]"
            }`}
          >
            Form Scanner
          </button>
        </div>

        {mode === "qr" && <QRScanner onScan={handleQrScan} />}

        {mode === "form" && (
          <>
            {!capturedImage && !isScanningForm && !formSuccess && (
              <FormScanner onCapture={handleCapture} />
            )}

            {isScanningForm && (
              <div className="flex flex-col items-center gap-4 py-10">
                <div className="w-10 h-10 border-4 border-[#c89116] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#666]">Scanning form with AI...</p>
              </div>
            )}

            {formSuccess && (
              <div className="text-center py-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base sm:text-lg font-bold text-green-600 mb-2">
                  Borrow Record Created!
                </p>
                <p className="text-sm text-[#666] mb-4">
                  The borrowed item has been recorded and equipment synced.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetFormMode}
                    className="px-4 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
                  >
                    Scan Another
                  </button>
                  <button
                    onClick={() => navigate("/admin/borrowed")}
                    className="px-4 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
                  >
                    View Borrowed Items
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {error && mode !== "qr" && (
          <p className="text-sm text-red-600 text-center mt-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>

      {showAiConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border border-[#d9d9d9]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-[#c89116]/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#c89116]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#222] text-center">AI Processing Notice</h3>
              <p className="text-sm text-[#666] text-center">
                By clicking <strong>OK</strong>, you acknowledge that the information and image captured will be used and processed by AI to extract form data.
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => setShowAiConsentModal(false)}
                  className="flex-1 px-4 py-2 border border-[#a6a6a6] text-[#666] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowAiConsentModal(false); scanFormImage() }}
                  className="flex-1 px-4 py-2 bg-[#c89116] hover:bg-[#caa453] text-white rounded-lg transition-colors cursor-pointer text-sm font-bold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResultModal && editableFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-[#222] mb-4">
              Extracted Form Data
            </h3>
            <p className="text-xs text-[#a6a6a6] mb-4">
              Review and edit the extracted information before submitting.
            </p>

            <div className="space-y-3">
              {(Object.keys(fieldLabels) as (keyof typeof fieldLabels)[]).map((key) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-[#666] mb-0.5">
                    {fieldLabels[key]}
                  </label>
                  <input
                    type="text"
                    value={editableFields[key] ?? ""}
                    onChange={(e) =>
                      setEditableFields({ ...editableFields, [key]: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#d9d9d9]">
              <label className="block text-xs font-medium text-[#666] mb-2">
                Equipment
              </label>
              {editableFields.equipment_list.map((eqItem, idx) => (
                <div key={idx} className="mb-3 p-3 bg-[#f5f5f5] rounded-lg border border-[#d9d9d9]">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={eqItem.item}
                      onChange={(e) => {
                        const list = [...editableFields.equipment_list]
                        list[idx] = { ...list[idx], item: e.target.value }
                        setEditableFields({ ...editableFields, equipment_list: list })
                      }}
                      placeholder="Equipment name"
                      className="flex-1 px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                    />
                    <input
                      type="number"
                      value={eqItem.quantity}
                      onChange={(e) => {
                        const list = [...editableFields.equipment_list]
                        list[idx] = { ...list[idx], quantity: e.target.value }
                        setEditableFields({ ...editableFields, equipment_list: list })
                      }}
                      min={1}
                      placeholder="Qty"
                      className="w-16 px-2 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222] text-center"
                    />
                    <button
                      onClick={() => {
                        const list = editableFields.equipment_list.filter((_, i) => i !== idx)
                        setEditableFields({ ...editableFields, equipment_list: list })
                        setSelectedEquipments(prev => {
                          const next = { ...prev }
                          delete next[idx]
                          return next
                        })
                      }}
                      className="px-2 py-2 text-red-500 hover:text-red-700 cursor-pointer"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-2">
                    <label className="block text-xs font-medium text-[#666] mb-1">Selected Equipment</label>
                    {selectedEquipments[idx] ? (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#d9d9d9]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-[#222] truncate">{selectedEquipments[idx]!.name}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            selectedEquipments[idx]!.condition === "Working" ? "bg-green-100 text-green-700" :
                            selectedEquipments[idx]!.condition === "Needs Repair" ? "bg-[#ffd870] text-[#222]" :
                            selectedEquipments[idx]!.condition === "Broken" ? "bg-red-100 text-red-700" :
                            selectedEquipments[idx]!.condition === "Not checked" ? "bg-gray-100 text-gray-700" :
                            "bg-purple-100 text-purple-700"
                          }`}>{selectedEquipments[idx]!.condition}</span>
                          <span className="text-xs text-[#a6a6a6]">{selectedEquipments[idx]!.id}</span>
                        </div>
                        <button
                          onClick={() => openItemSelector(idx)}
                          className="ml-2 px-2 py-1 text-xs bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded transition-colors cursor-pointer shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-200">
                        <span className="text-sm text-red-600">No equipment selected</span>
                        <button
                          onClick={() => openItemSelector(idx)}
                          className="px-2 py-1 text-xs bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded transition-colors cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setEditableFields({
                    ...editableFields,
                    equipment_list: [...editableFields.equipment_list, { item: "", quantity: "1" }],
                  })
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#c89116] font-medium hover:text-[#caa453] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            <div className="mt-5 border-t border-[#d9d9d9] pt-4 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiAcknowledged}
                  onChange={(e) => setAiAcknowledged(e.target.checked)}
                  className="mt-0.5 accent-[#c89116]"
                />
                <span className="text-sm text-[#666]">
                  I acknowledge that AI assisted in parsing this form and results may contain errors.
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewConfirmed}
                  onChange={(e) => setReviewConfirmed(e.target.checked)}
                  className="mt-0.5 accent-[#c89116]"
                />
                <span className="text-sm text-[#666]">
                  I have reviewed, verified, and confirmed that all details are correct.
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowResultModal(false)}
                className="flex-1 py-2.5 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitFormScan}
                disabled={!aiAcknowledged || !reviewConfirmed || isScanningForm || Object.values(selectedEquipments).some(v => v === null)}
                className="flex-1 py-2.5 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm"
              >
                {isScanningForm ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemSelector && editableFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md mx-3">
            <p className="text-base sm:text-lg font-bold text-[#222] mb-4 text-center">
              Select Equipment
            </p>
            <p className="text-sm text-[#666] mb-4 text-center">
              For "<span className="font-medium text-[#222]">{editableFields.equipment_list[selectorItemIndex]?.item ?? ""}</span>"
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#666] mb-1">Search</label>
                <input
                  type="text"
                  value={selectorSearch}
                  onChange={(e) => {
                    const q = e.target.value
                    setSelectorSearch(q)
                    const equipData = queryClient.getQueryData<Equipment[]>(["equipments"]) ?? []
                    const validEquipData = equipData.filter(
                      eq => eq.condition !== "Broken" && eq.condition !== "Unavailable"
                    )
                    const lq = q.toLowerCase()
                    setSelectorMatches(validEquipData.filter(eq =>
                      eq.name.toLowerCase().includes(lq) ||
                      eq.category.toLowerCase().includes(lq)
                    ))
                  }}
                  placeholder="Search equipment name or category..."
                  className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
              </div>

              {selectorMatches.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">Pick one</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectorMatches.map(eq => (
                      <label
                        key={eq.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                          selectorSelectedId === eq.id
                            ? "bg-[#c89116]/10 border-[#c89116]"
                            : "border-[#d9d9d9] hover:bg-[#f5f5f5]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selector-equipment"
                          checked={selectorSelectedId === eq.id}
                          onChange={() => setSelectorSelectedId(eq.id)}
                          className="accent-[#c89116]"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-[#222] truncate">{eq.name}</p>
                          <p className="text-xs text-[#a6a6a6]">{eq.id} — {eq.owner ?? "No owner"}</p>
                        </div>
                        <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          eq.condition === "Working" ? "bg-green-100 text-green-700" :
                          eq.condition === "Needs Repair" ? "bg-[#ffd870] text-[#222]" :
                          eq.condition === "Broken" ? "bg-red-100 text-red-700" :
                          eq.condition === "Not checked" ? "bg-gray-100 text-gray-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>{eq.condition}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectorMatches.length === 0 && (
                <p className="text-sm text-[#666] text-center py-4">
                  No matching equipment found. Try a different search term.
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowItemSelector(false)}
                className="flex-1 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmItemSelection}
                disabled={!selectorSelectedId}
                className="flex-1 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
