import { useEffect, useRef, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { supabase, fetchNotificationsForUser, markNotificationsRead, type NotificationRow } from "../services/supabase"

export interface NotificationsState {
  notifications: NotificationRow[]
  unreadCount: number
  markRead: (ids?: string[]) => Promise<void>
}

let notifyExternal: ((n: NotificationRow) => void) | null = null

export function subscribeToNewNotifications(cb: (n: NotificationRow) => void) {
  notifyExternal = cb
  return () => {
    if (notifyExternal === cb) notifyExternal = null
  }
}

export function useNotifications(): NotificationsState | null {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const arrivalRef = useRef(0)

  useEffect(() => {
    if (!user) return

    let active = true

    fetchNotificationsForUser(user.id)
      .then((rows) => {
        if (active) setNotifications(rows)
      })
      .catch((err) => console.error("notifications fetch failed:", err))

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow
          setNotifications((prev) => {
            if (prev.some((n) => n.id === row.id)) return prev
            arrivalRef.current++
            notifyExternal?.(row)
            return [row, ...prev]
          })
        },
      )
      .subscribe()

    return () => {
      active = false
      void channel.unsubscribe()
    }
  }, [user])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = async (ids?: string[]) => {
    if (!user) return
    setNotifications((prev) =>
      prev.map((n) => (ids && !ids.includes(n.id) ? n : { ...n, read: true })),
    )
    try {
      await markNotificationsRead(user.id, ids)
    } catch {
      // optimistic update stands; next load reconciles
    }
  }

  if (!user) return null
  return { notifications, unreadCount, markRead }
}
