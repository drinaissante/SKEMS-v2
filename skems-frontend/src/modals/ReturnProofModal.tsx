import { useRef, useState, useEffect, useCallback } from "react"
import { compressImage } from "../utils/compressImage"
import { uploadReturnProof, submitReturnProof } from "../services/supabase"

interface ReturnProofModalProps {
  requestId?: string
  eventItemId?: string
  equipmentId: string
  equipmentName: string
  userId: string
  borrowerName: string
  onClose: () => void
  onSubmitted: () => void
  showToast: (msg: string, type?: "success" | "error" | "info") => void
}

export default function ReturnProofModal({
  requestId,
  eventItemId,
  equipmentId,
  equipmentName,
  userId,
  borrowerName,
  onClose,
  onSubmitted,
  showToast,
}: ReturnProofModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<"idle" | "camera" | "preview">("idle")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cameraError, setCameraError] = useState("")

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const startCamera = async () => {
    setCameraError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      })
      streamRef.current = stream
      setMode("camera")
    } catch {
      setCameraError("Camera access was denied. You can upload a photo instead.")
    }
  }

  useEffect(() => {
    if (mode !== "camera" || !streamRef.current) return
    const video = videoRef.current
    if (!video) return
    video.srcObject = streamRef.current
    video.play()
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
    setPreviewUrl(dataUrl)
    canvas.toBlob(
      (blob) => setPendingBlob(blob),
      "image/jpeg",
      0.8,
    )
    setMode("preview")
    stopCamera()
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setPendingBlob(file)
    setMode("preview")
  }

  const submit = async () => {
    if (!pendingBlob) return
    const targetId = requestId ?? eventItemId
    if (!targetId) return
    setSubmitting(true)
    try {
      const compressed = await compressImage(pendingBlob)
      const path = await uploadReturnProof(compressed, userId, targetId)
      await submitReturnProof({
        userId,
        requestId,
        eventItemId,
        equipmentId,
        path,
        equipmentName,
        borrowerName,
      })
      showToast("Return proof submitted. Waiting for officer review.", "success")
      setSubmitting(false)
      onSubmitted()
    } catch (err) {
      showToast(
        "Failed to submit proof: " + (err instanceof Error ? err.message : "Unknown error"),
        "error",
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={submitting ? undefined : onClose}>
      <div
        className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl py-6 px-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white text-center mb-1">Proof of Return</h3>
        <p className="text-xs text-[#a6a6a6] text-center mb-4">
          Submit a photo of <span className="text-white font-medium">{equipmentName}</span> as returned.
          An SK officer will review it.
        </p>

        {mode === "idle" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={startCamera}
              className="btn-gold w-full py-2.5 text-sm"
            >
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-ghost w-full py-2.5 text-sm"
            >
              Upload Image
            </button>
            {cameraError && (
              <p className="text-xs text-red-300 text-center bg-red-500/15 px-3 py-2 rounded-lg">{cameraError}</p>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </div>
        )}

        {mode === "camera" && (
          <div className="space-y-3">
            <div className="w-full aspect-4/3 bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={stopCamera} className="btn-ghost flex-1 py-2.5 rounded-lg text-sm">
                Back
              </button>
              <button type="button" onClick={capture} className="btn-gold flex-1 py-2.5 rounded-lg text-sm">
                Capture
              </button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {mode === "preview" && previewUrl && (
          <div className="space-y-3">
            <div className="w-full max-h-72 flex items-center justify-center bg-black rounded-lg overflow-hidden">
              <img src={previewUrl} alt="Return proof preview" className="max-h-72 w-auto object-contain" />
            </div>
            <p className="text-[10px] text-[#a6a6a6] text-center">
              Photos are compressed automatically before upload.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => { setMode("idle"); setPreviewUrl(null); setPendingBlob(null) }}
                className="btn-ghost flex-1 py-2.5 rounded-lg text-sm disabled:opacity-40"
              >
                Retake
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="btn-gold flex-1 py-2.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
