import { useRef, useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import jsQR from "jsqr"
import { fetchEquipments, type Equipment } from "../../services/api"
import { addBorrowedItem } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import type { ScannedFormFields } from "../../services/borrow"

type ScanMode = "qr" | "form"

export default function ScanPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement>(null)

  const [mode, setMode] = useState<ScanMode>("qr")

  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [showPermissionModal, setShowPermissionModal] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)

  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isScanningForm, setIsScanningForm] = useState(false)
  const [scanResult, setScanResult] = useState<ScannedFormFields | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [editableFields, setEditableFields] = useState<ScannedFormFields | null>(null)
  const [aiAcknowledged, setAiAcknowledged] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [matchedEquipments, setMatchedEquipments] = useState<Equipment[]>([])
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([])

  const stopCamera = useCallback(() => {
    if (animFrameRef.current)
      cancelAnimationFrame(animFrameRef.current)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setError("")
    setResult("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      setScanning(true)
    } catch {
      setError("Camera access was denied.")
      setShowPermissionModal(true)
    }
  }, [])

  useEffect(() => {
    if (mode === "form") {
      if (capturedImage || isScanningForm || scanResult) return
    }
    if (!scanning || !streamRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    video.srcObject = streamRef.current
    video.play()

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
          setResult(code.data)
          setScanning(false)
          stopCamera()

          const value = code.data

          const goToRequest = (id: string, name?: string) => {
            const params = new URLSearchParams()
            params.set("equipment", id)
            if (name) params.set("name", name)
            navigate(`/request?${params.toString()}`)
          }

          if (value.startsWith("http://") || value.startsWith("https://")) {
            fetch(value)
              .then((res) => res.json())
              .then((data) => goToRequest(data.item_id || value, data.equipment_name))
              .catch(() => goToRequest(value))
          } else {
            goToRequest(value)
          }
          return
        }
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [scanning, navigate, stopCamera, mode, capturedImage, isScanningForm, scanResult])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const captureCanvas = captureCanvasRef.current
    if (!video || !captureCanvas) return

    const container = video.parentElement
    const maxDim = 800

    const videoW = video.videoWidth
    const videoH = video.videoHeight

    if (container) {
      const containerW = container.clientWidth
      const containerH = container.clientHeight || containerW * 0.75
      const scale = Math.max(containerW / videoW, containerH / videoH)
      const visibleW = containerW / scale
      const visibleH = containerH / scale
      const sx = (videoW - visibleW) / 2
      const sy = (videoH - visibleH) / 2

      let outW = visibleW
      let outH = visibleH
      if (outW > maxDim || outH > maxDim) {
        const ratio = Math.min(maxDim / outW, maxDim / outH)
        outW = Math.round(outW * ratio)
        outH = Math.round(outH * ratio)
      }

      captureCanvas.width = outW
      captureCanvas.height = outH
      const ctx = captureCanvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(video, sx, sy, visibleW, visibleH, 0, 0, outW, outH)
    } else {
      let w = videoW
      let h = videoH
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      captureCanvas.width = w
      captureCanvas.height = h
      const ctx = captureCanvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(video, 0, 0, w, h)
    }

    const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.7)
    setCapturedImage(dataUrl)
    stopCamera()
    setScanning(false)
  }, [stopCamera])

  const retakeForm = useCallback(() => {
    setCapturedImage(null)
    setIsScanningForm(false)
    setScanResult(null)
    setShowResultModal(false)
    setError("")
    startCamera()
  }, [startCamera])

  const scanFormImage = useCallback(async () => {
    if (!capturedImage) return
    setIsScanningForm(true)
    setError("")

    const base64 = capturedImage.split(",")[1]

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      setScanResult(fields)
      setEditableFields({ ...fields })
      setAiAcknowledged(false)

      const equipData = await fetchEquipments()
      const itemNames = fields.equipment_list.map(e => e.item.toLowerCase()).filter(Boolean)
      const matches = equipData.filter((eq) => {
        const name = eq.name.toLowerCase()
        return itemNames.some((part) => name.includes(part))
      })
      setMatchedEquipments(matches)
      setSelectedEquipmentIds(matches.map((eq) => eq.id))

      setShowResultModal(true)
      setIsScanningForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed")
      setIsScanningForm(false)
    }
  }, [capturedImage])

  const submitFormScan = useCallback(async () => {
    if (!editableFields || !user) return
    if (selectedEquipmentIds.length === 0) return
    setIsScanningForm(true)
    setError("")

    try {
      const itemQtyMap = new Map<string, {item: string, quantity: string}>()
      for (const eqItem of editableFields.equipment_list) {
        const norm = eqItem.item.toLowerCase()
        for (const eq of matchedEquipments) {
          if (!itemQtyMap.has(eq.id) && eq.name.toLowerCase().includes(norm)) {
            itemQtyMap.set(eq.id, eqItem)
          }
        }
      }

      for (const eqId of selectedEquipmentIds) {
        const info = itemQtyMap.get(eqId)
        await addBorrowedItem({
          equipment_id: eqId,
          quantity: parseInt(info?.quantity || "1"),
          full_name: editableFields.full_name,
          date: editableFields.date,
          position_department: editableFields.position_department,
          owner: editableFields.owner,
          equipment_requested: info?.item || "",
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
  }, [editableFields, user, selectedEquipmentIds, matchedEquipments])

  const resetFormMode = useCallback(() => {
    setCapturedImage(null)
    setIsScanningForm(false)
    setScanResult(null)
    setShowResultModal(false)
    setEditableFields(null)
    setAiAcknowledged(false)
    setFormSuccess(false)
    setError("")
  }, [])

  const handleOpenCamera = useCallback(() => {
    setShowPermissionModal(true)
  }, [])

  const handleContinue = useCallback(() => {
    setShowPermissionModal(false)
    startCamera()
  }, [startCamera])

  const handleCancel = useCallback(() => {
    setShowPermissionModal(false)
    setError("")
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  if (!user) return null

  const fieldLabels: Record<string, string> = {
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
              mode === "qr"
                ? "bg-[#c89116] text-white"
                : "text-[#666] hover:text-[#222]"
            }`}
          >
            QR Scanner
          </button>
          <button
            onClick={() => { resetFormMode(); setMode("form") }}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors cursor-pointer ${
              mode === "form"
                ? "bg-[#c89116] text-white"
                : "text-[#666] hover:text-[#222]"
            }`}
          >
            Form Scanner
          </button>
        </div>

        {mode === "qr" && (
          <>
            {!scanning && !result && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-70 aspect-square border-2 border-dashed border-[#a6a6a6] rounded-xl flex items-center justify-center text-[#a6a6a6]">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <button
                  onClick={handleOpenCamera}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm sm:text-base"
                >
                  Open Camera
                </button>
              </div>
            )}

            {scanning && (
              <div className="relative w-full h-[60vh] bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
                <p className="text-center text-sm text-[#666] mt-3">Scanning for QR code...</p>
                <button
                  onClick={stopCamera}
                  className="mt-4 w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer text-sm"
                >
                  Stop Camera
                </button>
              </div>
            )}

            {result && (
              <div className="text-center">
                <p className="text-green-600 font-bold mb-2">QR Code Detected!</p>
                <p className="text-sm text-[#666] break-all">Redirecting...</p>
              </div>
            )}
          </>
        )}

        {mode === "form" && (
          <>
            {!capturedImage && !isScanningForm && !formSuccess && (
              <div className="flex flex-col items-center gap-4">
                {scanning ? (
                  <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
                    <button
                      onClick={captureFrame}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-full transition-colors cursor-pointer text-sm shadow-lg"
                    >
                      Capture
                    </button>
                    <button
                      onClick={stopCamera}
                      className="absolute top-3 right-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors cursor-pointer"
                    >
                      Stop
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="w-full max-w-70 aspect-[3/4] border-2 border-dashed border-[#a6a6a6] rounded-xl flex items-center justify-center text-[#a6a6a6]">
                      <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-[#666] text-center">
                      Capture a photo of the filled-out borrowing form
                    </p>
                    <button
                      onClick={handleOpenCamera}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm sm:text-base"
                    >
                      Open Camera
                    </button>
                    <div className="w-full">
                      <p className="text-xs text-[#a6a6a6] text-center mb-2">or upload an image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            const img = new Image()
                            img.onload = () => {
                              const c = document.createElement("canvas")
                              const maxDim = 800
                              let w = img.width
                              let h = img.height
                              if (w > maxDim || h > maxDim) {
                                const ratio = Math.min(maxDim / w, maxDim / h)
                                w = Math.round(w * ratio)
                                h = Math.round(h * ratio)
                              }
                              c.width = w
                              c.height = h
                              const ctx = c.getContext("2d")
                              if (!ctx) return
                              ctx.drawImage(img, 0, 0, w, h)
                              setCapturedImage(c.toDataURL("image/jpeg", 0.7))
                            }
                            img.src = ev.target?.result as string
                          }
                          reader.readAsDataURL(file)
                        }}
                        className="w-full text-sm text-[#666] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#c89116] file:text-white hover:file:bg-[#caa453] cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {capturedImage && !isScanningForm && !showResultModal && !formSuccess && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-full aspect-[3/4] bg-black rounded-lg overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured form"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={retakeForm}
                    className="flex-1 py-2.5 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm font-medium"
                  >
                    Retake
                  </button>
                  <button
                    onClick={scanFormImage}
                    className="flex-1 py-2.5 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
                  >
                    Scan Form
                  </button>
                </div>
              </div>
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
                    onClick={() => { resetFormMode(); startCamera() }}
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

      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border border-[#d9d9d9]">
            <div className="flex flex-col items-center gap-4">
              <svg className="w-12 h-12 text-[#c89116]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-bold text-[#222]">Camera Access Required</h3>
              <p className="text-sm text-[#666] text-center">
                To {mode === "qr" ? "scan QR codes" : "scan forms"}, SKEMS needs access to your camera. When your browser asks for permission, tap <strong>Allow</strong>.
              </p>
              {error && (
                <p className="text-sm text-red-600 text-center bg-red-50 px-3 py-2 rounded-lg w-full">{error}</p>
              )}
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-[#a6a6a6] text-[#666] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 px-4 py-2 bg-[#c89116] hover:bg-[#caa453] text-white rounded-lg transition-colors cursor-pointer text-sm font-bold"
                >
                  Continue
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
                    value={(editableFields as any)[key] ?? ""}
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
                <div key={idx} className="flex gap-2 mb-2">
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
                    type="text"
                    value={eqItem.quantity}
                    onChange={(e) => {
                      const list = [...editableFields.equipment_list]
                      list[idx] = { ...list[idx], quantity: e.target.value }
                      setEditableFields({ ...editableFields, equipment_list: list })
                    }}
                    placeholder="Qty"
                    className="w-16 px-2 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222] text-center"
                  />
                  <button
                    onClick={() => {
                      const list = editableFields.equipment_list.filter((_, i) => i !== idx)
                      setEditableFields({ ...editableFields, equipment_list: list })
                    }}
                    className="px-2 py-2 text-red-500 hover:text-red-700 cursor-pointer"
                    title="Remove item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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

            {matchedEquipments.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-medium text-green-700 mb-2">
                  Select equipment(s) from inventory to record:
                </p>
                <div className="space-y-1.5">
                  {matchedEquipments.map((eq) => (
                    <label
                      key={eq.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer select-none transition-colors ${
                        selectedEquipmentIds.includes(eq.id)
                          ? "bg-green-100 border-green-300 text-green-800"
                          : "border-[#d9d9d9] text-[#666] hover:bg-[#f5f5f5]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEquipmentIds.includes(eq.id)}
                        onChange={() =>
                          setSelectedEquipmentIds((prev) =>
                            prev.includes(eq.id)
                              ? prev.filter((id) => id !== eq.id)
                              : [...prev, eq.id],
                          )
                        }
                        className="accent-[#c89116]"
                      />
                      <span className="font-medium">{eq.name}</span>
                      <span className="text-xs text-[#a6a6a6]">({eq.id})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {matchedEquipments.length === 0 && editableFields.equipment_list.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs font-medium text-red-700">
                  No matching equipment found in inventory for "{editableFields.equipment_list.map(e => e.item).join(", ")}".<br />
                  You must add the equipment to inventory first before recording a borrow.
                </p>
              </div>
            )}

            <div className="mt-5 border-t border-[#d9d9d9] pt-4">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiAcknowledged}
                  onChange={(e) => setAiAcknowledged(e.target.checked)}
                  className="mt-0.5 accent-[#c89116]"
                />
                <span className="text-sm text-[#666]">
                  I acknowledge that AI was used to parse this form and the results may contain errors. I have reviewed and verified the information above.
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowResultModal(false)
                  setScanResult(null)
                }}
                className="flex-1 py-2.5 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitFormScan}
                disabled={!aiAcknowledged || isScanningForm || selectedEquipmentIds.length === 0}
                className="flex-1 py-2.5 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm"
              >
                {isScanningForm ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  )
}
