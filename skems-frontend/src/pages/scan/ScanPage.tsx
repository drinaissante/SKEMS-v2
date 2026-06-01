import { useRef, useState, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import jsQR from "jsqr"

export default function ScanPage() {
  const navigate = useNavigate()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [showPermissionModal, setShowPermissionModal] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) 
      cancelAnimationFrame(animFrameRef.current)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const startScanning = useCallback(async () => {
    setError("")
    setResult("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      streamRef.current = stream

      if (!videoRef.current) 
        return

      videoRef.current.srcObject = stream
      videoRef.current.setAttribute("playsinline", "true")

      await videoRef.current.play()

      setScanning(true)

      const tick = () => {
        if (!videoRef.current || !canvasRef.current) 
          return

        const video = videoRef.current
        const canvas = canvasRef.current

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

            const params = new URLSearchParams()
            params.set("equipment", code.data)
            navigate(`/request?${params.toString()}`)
            return
          }
        }

        animFrameRef.current = requestAnimationFrame(tick)
      }

      animFrameRef.current = requestAnimationFrame(tick)
    } catch {
      setError("Camera access was denied. Please enable camera permissions in your browser settings and try again.")
      setShowPermissionModal(true)
    }
  }, [navigate, stopCamera])

  const handleOpenCamera = useCallback(() => {
    setShowPermissionModal(true)
  }, [])

  const handleContinue = useCallback(() => {
    setShowPermissionModal(false)
    startScanning()
  }, [startScanning])

  const handleCancel = useCallback(() => {
    setShowPermissionModal(false)
    setError("")
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 py-8 bg-[#f5f5f5]">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-5 sm:p-6 border border-[#d9d9d9]">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-[#222] mb-5">Scan QR Code</h2>

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
          <div className="relative">
            <video ref={videoRef} className="w-full rounded-lg" muted />
            <canvas ref={canvasRef} className="hidden" />
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
                To scan QR codes, SKEMS needs access to your camera. When your browser asks for permission, tap <strong>Allow</strong>.
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
    </div>
  )
}
