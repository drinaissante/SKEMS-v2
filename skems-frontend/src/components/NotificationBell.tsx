import { useEffect, useRef, useState } from "react"
import { useNotifications, subscribeToNewNotifications } from "../hooks/useNotifications"
import { useToast } from "../hooks/useToast"
import { useAuth } from "../context/AuthContext"
import type { NotificationRow } from "../services/supabase"

interface BellProps {
  className?: string
}

const NOTIFICATION_EMOJI: Record<string, string> = {
  request_created: "🔔",
  owner_approved: "🤝",
  owner_rejected: "⚠️",
  admin_approved: "✅",
  admin_denied: "❌",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotificationBellInner({ className }: BellProps) {
  const state = useNotifications()
  const { showToast } = useToast()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const subscribedRef = useRef(false)

  useEffect(() => {
    if (!user) return
    if (subscribedRef.current) return
    subscribedRef.current = true

    const unsubscribe = subscribeToNewNotifications((n: NotificationRow) => {
      showToast(n.title + (n.body ? ": " + n.body : ""), "info")
    })
    return unsubscribe
  }, [user, showToast])

  if (!state) return null

  const bellClass = className ?? "flex-none"

  return (
    <div className={`relative ${bellClass}`}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded hover:text-[#fdb125] transition-colors cursor-pointer"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h11zm-3 3a2 2 0 002-2h-4a2 2 0 002 2z" />
        </svg>
        {state.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 flex items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {state.unreadCount > 9 ? "9+" : state.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-[#222] border border-[#a6a6a6]/30 rounded-lg shadow-xl w-80 max-w-[90vw] max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wide text-[#a6a6a6]">Notifications</span>
              {state.unreadCount > 0 && (
                <button
                  onClick={() => void state.markRead()}
                  className="text-xs text-[#c89116] hover:text-[#fdb125] cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            {state.notifications.length === 0 ? (
              <p className="text-sm text-[#a6a6a6] text-center py-6">No notifications yet.</p>
            ) : (
              state.notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-2.5 border-b border-white/5 ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <p className="text-xs font-bold text-white">
                    {NOTIFICATION_EMOJI[n.type] ?? "🔔"} {n.title}
                  </p>
                  {n.body && <p className="text-xs text-[#a6a6a6] mt-0.5 wrap-break-word">{n.body}</p>}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-[#a6a6a6]/70">{timeAgo(n.created_at)}</span>
                    {!n.read && (
                      <button
                        onClick={() => void state.markRead([n.id])}
                        className="text-[10px] text-[#c89116] hover:text-[#fdb125] cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function NotificationBell(props: BellProps) {
  return <NotificationBellInner {...props} />
}
