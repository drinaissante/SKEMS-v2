import { useState, useCallback, type ReactNode } from "react"
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi"
import { ToastContext, type ToastType, type ToastAction } from "../context/ToastContext"

interface Toast {
  id: number
  message: string
  type: ToastType
  action?: ToastAction
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "info", action?: ToastAction) => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type, action }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, action ? 10000 : 3500)
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
    info: "bg-black",
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed sm:top-25 sm:right-4 sm:left-auto sm:w-80 sm:bottom-auto bottom-4 left-4 right-4 z-9999 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto relative flex items-start gap-2.5 px-4 pt-3 pb-2.5 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-in overflow-hidden ${colorMap[t.type]}`}
          >
            <span className="shrink-0 mt-0.5">{iconMap[t.type]}</span>
            <span className="flex-1">
              {t.message}
              {t.action && (
                <button
                  onClick={() => {
                    removeToast(t.id)
                    t.action!.onClick()
                  }}
                  className="underline ml-1 text-[#c89116] hover:opacity-80 cursor-pointer"
                >
                  {t.action.label}
                </button>
              )}
            </span>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 mt-0.5 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <FiX size={16} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg overflow-hidden">
              <div className="h-full bg-white/30 rounded-b-lg animate-shrink-bar" />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}



