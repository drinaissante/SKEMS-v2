import { useRef, useState, useCallback, useEffect } from "react"
import jsQR from "jsqr"

interface QRScannerProps {
  onScan: (code: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [status, setStatus] = useState<"idle" | "scanning" | "found" | "no-qr">("idle")
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
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.play()
      }
      setStatus("scanning")
    } catch {
      setError("Camera access was denied.")
    }
  }, [])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
      setStatus("found")
      stopCamera()
      onScan(code.data)
    } else {
      setStatus("no-qr")
    }
  }, [onScan, stopCamera])

  const retry = useCallback(() => {
    setStatus("scanning")
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  if (status === "found") {
    return (
      <div className="text-center py-8">
        <p className="text-green-600 font-bold mb-2">QR Code Detected!</p>
        <p className="text-sm text-[#666]">Redirecting...</p>
      </div>
    )
  }

  if (status === "scanning") {
    return (
      <div className="relative w-full h-[60vh] bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        <p className="absolute top-3 left-1/2 -translate-x-1/2 text-sm text-white/80">Camera ready</p>
        <button
          onClick={capture}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-full text-base transition-colors cursor-pointer shadow-lg"
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
    )
  }

  if (status === "no-qr") {
    return (
      <div className="relative w-full h-[60vh] bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        <p className="absolute top-3 left-1/2 -translate-x-1/2 text-sm text-red-400 bg-black/60 px-3 py-1 rounded">
          No QR code detected
        </p>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
          <button
            onClick={capture}
            className="px-8 py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-full text-base transition-colors cursor-pointer shadow-lg"
          >
            Try Again
          </button>
          <button
            onClick={retry}
            className="px-4 py-3 border border-white/40 text-white/80 hover:text-white hover:border-white/70 font-medium rounded-full text-sm transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
        <button
          onClick={stopCamera}
          className="absolute top-3 right-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors cursor-pointer"
        >
          Stop
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-70 aspect-square border-2 border-dashed border-[#a6a6a6] rounded-xl flex items-center justify-center text-[#a6a6a6]">
        <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      {error && <p className="text-sm text-red-600 text-center bg-red-50 px-3 py-2 rounded-lg w-full">{error}</p>}
      <button
        onClick={startCamera}
        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm sm:text-base"
      >
        Open Camera
      </button>
    </div>
  )
}
