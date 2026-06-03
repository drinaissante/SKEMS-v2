import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const iconMap: Record<ToastType, ReactNode> = {
    success: <FiCheckCircle size={18} />,
    error: <FiAlertCircle size={18} />,
    info: <FiInfo size={18} />,
  }

  const colorMap: Record<ToastType, string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed sm:top-4 sm:right-4 sm:bottom-auto bottom-4 left-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-in ${colorMap[t.type]}`}
          >
            <span className="shrink-0 mt-0.5">{iconMap[t.type]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 mt-0.5 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
