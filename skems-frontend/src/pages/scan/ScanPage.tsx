import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { fetchEquipments, type Equipment } from "../../services/api"
import { supabase, submitRequest } from "../../services/supabase"
import { useToast } from "../../hooks/useToast"
import { useAuth } from "../../context/AuthContext"
import type { ScannedFormFields } from "../../constants/borrow"
import { normalizeDate } from "../../constants/scanConstants"
import QRScanner from "./QRScanner"
import FormScanner from "./FormScanner"
import AiConsentModal from "./AiConsentModal"
import ResultModal from "./ResultModal"
import ItemSelectorModal from "./ItemSelectorModal"
import ScanSuccess from "./ScanSuccess"

type ScanMode = "qr" | "form"

export default function ScanPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<ScanMode>("qr")

  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isScanningForm, setIsScanningForm] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [editableFields, setEditableFields] = useState<ScannedFormFields | null>(null)
  const [aiAcknowledged, setAiAcknowledged] = useState(false)
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [showAiConsentModal, setShowAiConsentModal] = useState(false)

  const [selectedEquipments, setSelectedEquipments] = useState<
    Record<number, { id: string; name: string; owner: string; condition: string } | null>
  >({})

  const [showItemSelector, setShowItemSelector] = useState(false)
  const [selectorItemIndex, setSelectorItemIndex] = useState(0)

  const handleQrScan = useCallback((code: string) => {
    const goToEquipment = (id: string) => {
      navigate(`/equipment?id=${id}`)
    }

    if (code.startsWith("http://") || code.startsWith("https://")) {
      try {
        const url = new URL(code)
        const eqId = url.searchParams.get("id")
        if (url.pathname === "/equipment" && eqId) {
          goToEquipment(eqId)
          return
        }
      } catch { /* noop */ }

      fetch(code)
        .then(res => res.json())
        .then(data => goToEquipment(data.item_id || code))
        .catch(() => goToEquipment(code))
    } else {
      goToEquipment(code)
    }
  }, [navigate])

  const handleCapture = useCallback((dataUrl: string) => {
    setCapturedImage(dataUrl)
    setShowAiConsentModal(true)
  }, [])

  const scanFormImage = useCallback(async () => {
    if (!capturedImage) return
    setIsScanningForm(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      showToast("Authentication required", "error")
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
        date_time_borrowing: normalizeDate(data.fields.date_time_borrowing ?? ""),
        date_time_return: normalizeDate(data.fields.date_time_return ?? ""),
        pickup_location: data.fields.pickup_location ?? "",
        return_location: data.fields.return_location ?? "",
      }

      const hasContent =
        fields.full_name?.trim() ||
        fields.purpose_of_use?.trim() ||
        fields.date_time_borrowing?.trim() ||
        fields.date_time_return?.trim() ||
        (Array.isArray(fields.equipment_list) &&
          fields.equipment_list.length > 0 &&
          fields.equipment_list.some((e: { item?: string }) => e.item?.trim()))

      if (!hasContent) {
        showToast("No form detected. Please capture a clear image of the borrowing form.", "error")
        setIsScanningForm(false)
        return
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
        e => e.condition !== "Broken" && e.condition !== "Unavailable" && e.condition !== "Borrowed"
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
      showToast(err instanceof Error ? err.message : "Scan failed", "error")
      setIsScanningForm(false)
    }
  }, [capturedImage, queryClient, showToast])

  const openItemSelector = useCallback((idx: number) => {
    setSelectorItemIndex(idx)
    setShowItemSelector(true)
  }, [])

  const confirmItemSelection = useCallback((equipmentId: string, index: number) => {
    const equipData = queryClient.getQueryData<Equipment[]>(["equipments"]) ?? []
    const validEquipData = equipData.filter(
      e => e.condition !== "Broken" && e.condition !== "Unavailable" && e.condition !== "Borrowed"
    )
    const eq = validEquipData.find(e => e.id === equipmentId)
    if (!eq) return

    setSelectedEquipments(prev => ({
      ...prev,
      [index]: { id: eq.id, name: eq.name, owner: eq.owner ?? "", condition: eq.condition },
    }))
  }, [queryClient])

  const submitFormScan = useCallback(async () => {
    if (!editableFields || !user) return

    const fieldKeys = ["full_name", "date", "position_department", "owner", "purpose_of_use", "date_time_borrowing", "date_time_return", "pickup_location", "return_location"] as const
    const labels: Record<string, string> = {
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
    for (const key of fieldKeys) {
      if (!(editableFields[key] as string)?.trim()) {
        showToast(`"${labels[key]}" is required.`, "error")
        return
      }
    }

    for (let i = 0; i < editableFields.equipment_list.length; i++) {
      if (!selectedEquipments[i]) {
        showToast(`Select equipment for item "${editableFields.equipment_list[i].item}".`, "error")
        return
      }
    }

    setIsScanningForm(true)

    try {
      for (let i = 0; i < editableFields.equipment_list.length; i++) {
        const fi = editableFields.equipment_list[i]
        const sel = selectedEquipments[i]
        if (!sel) continue

        const qty = parseInt(fi.quantity) || 1

        await submitRequest({
          equipmentId: sel.id,
          equipmentName: sel.name,
          borrowerName: editableFields.full_name,
          studentNumber: user.studentNumber,
          reason: editableFields.purpose_of_use,
          dateBorrowed: editableFields.date_time_borrowing,
          dateDue: editableFields.date_time_return,
          userId: user.id,
          quantity: qty,
          positionDepartment: editableFields.position_department,
          pickupLocation: editableFields.pickup_location,
          returnLocation: editableFields.return_location,
          owner: sel.owner,
        })
      }

      setShowResultModal(false)
      setFormSuccess(true)
    } catch {
      showToast("Failed to submit. Please try again.", "error")
    } finally {
      setIsScanningForm(false)
    }
  }, [editableFields, user, showToast, selectedEquipments])

  const resetFormMode = useCallback(() => {
    setCapturedImage(null)
    setIsScanningForm(false)
    setShowResultModal(false)
    setEditableFields(null)
    setAiAcknowledged(false)
    setReviewConfirmed(false)
    setFormSuccess(false)
    setSelectedEquipments({})
    setShowAiConsentModal(false)
    setShowItemSelector(false)
  }, [])

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col items-center px-3 py-8 bg-[#f5f5f5]">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg px-3 py-2 sm:p-6 border border-[#d9d9d9]">
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

            {formSuccess && <ScanSuccess onScanAnother={resetFormMode} />}
          </>
        )}
      </div>

      <AiConsentModal
        open={showAiConsentModal}
        onCancel={() => setShowAiConsentModal(false)}
        onConfirm={() => { setShowAiConsentModal(false); scanFormImage() }}
      />

      {showResultModal && editableFields && (
        <ResultModal
          editableFields={editableFields}
          selectedEquipments={selectedEquipments}
          aiAcknowledged={aiAcknowledged}
          reviewConfirmed={reviewConfirmed}
          isSubmitting={isScanningForm}
          onChangeField={(key, value) => setEditableFields(prev => prev ? { ...prev, [key]: value } : prev!)}
          onChangeEquipmentItem={(idx, value) => {
            if (!editableFields) return
            const list = [...editableFields.equipment_list]
            list[idx] = { ...list[idx], item: value }
            setEditableFields({ ...editableFields, equipment_list: list })
          }}
          onChangeEquipmentQuantity={(idx, value) => {
            if (!editableFields) return
            const list = [...editableFields.equipment_list]
            list[idx] = { ...list[idx], quantity: value }
            setEditableFields({ ...editableFields, equipment_list: list })
          }}
          onRemoveEquipment={(idx) => {
            if (!editableFields) return
            const list = editableFields.equipment_list.filter((_, i) => i !== idx)
            setEditableFields({ ...editableFields, equipment_list: list })
            setSelectedEquipments(prev => {
              const next = { ...prev }
              delete next[idx]
              return next
            })
          }}
          onAddEquipment={() => {
            if (!editableFields) return
            setEditableFields({
              ...editableFields,
              equipment_list: [...editableFields.equipment_list, { item: "", quantity: "1" }],
            })
          }}
          onSelectEquipment={openItemSelector}
          onSetAiAcknowledged={setAiAcknowledged}
          onSetReviewConfirmed={setReviewConfirmed}
          onSubmit={submitFormScan}
          onCancel={() => { setShowResultModal(false); setCapturedImage(null) }}
        />
      )}

      <ItemSelectorModal
        open={showItemSelector}
        itemIndex={selectorItemIndex}
        itemName={editableFields?.equipment_list[selectorItemIndex]?.item ?? ""}
        onConfirm={confirmItemSelection}
        onClose={() => setShowItemSelector(false)}
      />
    </div>
  )
}
