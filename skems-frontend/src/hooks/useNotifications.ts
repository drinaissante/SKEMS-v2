import { useEffect, useRef, useState } from "react"
import { useAuth } from "../context/AuthContext"
import {
  supabase,
  fetchNotificationsForUser,
  markNotificationsRead,
  sweepExpiredNotifications,
  type NotificationRow,
} from "../services/supabase"

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

type RowHandler = (row: NotificationRow) => void

interface ChannelEntry {
  channel: ReturnType<typeof supabase.channel>
  subs: Set<RowHandler>
}

const channelRegistry = new Map<string, ChannelEntry>()

function fanOut(entry: ChannelEntry, row: NotificationRow) {
  for (const cb of entry.subs) {
    try {
      cb(row)
    } catch (err) {
      console.error("notification callback failed:", err)
    }
  }
}

function joinNotificationsChannel(userId: string, cb: RowHandler): () => void {
  const key = `notifications-${userId}`
  let entry = channelRegistry.get(key)

  if (!entry) {
    const channel = supabase
      .channel(key)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow
          if (entry) fanOut(entry, row)
        },
      )
      .subscribe()

    entry = { channel, subs: new Set() }
    channelRegistry.set(key, entry)
  }

  entry.subs.add(cb)

  return () => {
    const current = channelRegistry.get(key)
    if (!current) return
    current.subs.delete(cb)
    if (current.subs.size === 0) {
      channelRegistry.delete(key)
      void supabase.removeChannel(current.channel)
    }
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
        void sweepExpiredNotifications(user.id)
      })
      .catch((err) => console.error("notifications fetch failed:", err))

    const leave = joinNotificationsChannel(user.id, (row) => {
      if (!active) return
      arrivalRef.current++
      notifyExternal?.(row)
      setNotifications((prev) =>
        prev.some((n) => n.id === row.id) ? prev : [row, ...prev],
      )
    })

    return () => {
      active = false
      leave()
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
      void sweepExpiredNotifications(user.id)
    } catch {
      // optimistic update stands; next load reconciles
    }
  }

  if (!user) return null
  return { notifications, unreadCount, markRead }
}
