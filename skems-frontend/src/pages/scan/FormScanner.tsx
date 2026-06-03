import { useRef, useState, useCallback, useEffect } from "react"

interface FormScannerProps {
  onCapture: (dataUrl: string) => void
}

export default function FormScanner({ onCapture }: FormScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const captureCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [status, setStatus] = useState<"idle" | "live" | "captured">("idle")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState("")

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      setStatus("live")
    } catch {
      setError("Camera access was denied.")
    }
  }, [])

  useEffect(() => {
    if (status !== "live" || !streamRef.current) return

    const video = videoRef.current
    if (!video) return

    video.srcObject = streamRef.current
    video.play()

    return () => stopCamera()
  }, [status, stopCamera])

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
    setPreviewUrl(dataUrl)
    setStatus("captured")
    stopCamera()
  }, [stopCamera])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
        const dataUrl = c.toDataURL("image/jpeg", 0.7)
        setPreviewUrl(dataUrl)
        setStatus("captured")
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  if (status === "live") {
    return (
      <div className="relative w-full aspect-3/4 bg-black rounded-lg overflow-hidden">
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
        <canvas ref={captureCanvasRef} className="hidden" />
      </div>
    )
  }

  if (status === "captured" && previewUrl) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="w-full aspect-3/4 bg-black rounded-lg overflow-hidden">
          <img src={previewUrl} alt="Captured form" className="w-full h-full object-contain" />
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => { setStatus("idle"); setPreviewUrl(null); setError("") }}
            className="flex-1 py-2.5 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm font-medium"
          >
            Retake
          </button>
          <button
            onClick={() => onCapture(previewUrl)}
            className="flex-1 py-2.5 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
          >
            Scan Form
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full max-w-70 aspect-3/4 border-2 border-dashed border-[#a6a6a6] rounded-xl flex items-center justify-center text-[#a6a6a6]">
        <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      {error && <p className="text-sm text-red-600 text-center bg-red-50 px-3 py-2 rounded-lg w-full">{error}</p>}
      <p className="text-sm text-[#666] text-center">
        Capture a photo of the filled-out borrowing form
      </p>
      <button
        onClick={startCamera}
        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm sm:text-base"
      >
        Open Camera
      </button>
      <div className="w-full">
        <p className="text-xs text-[#a6a6a6] text-center mb-2">or upload an image</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="w-full text-sm text-[#666] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#c89116] file:text-white hover:file:bg-[#caa453] cursor-pointer"
        />
      </div>
    </div>
  )
}
