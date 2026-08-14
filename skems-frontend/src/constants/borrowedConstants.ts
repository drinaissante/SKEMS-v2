import { formatWallClock, formatManila } from "../utils/datetime"

export const CONDITION_OPTIONS = ["Working", "Needs Repair", "Broken", "Not checked"] as const

export const conditionColors: Record<string, string> = {
  Working: "bg-green-500/15 text-green-300",
  "Needs Repair": "bg-[#ffd870] text-[#222]",
  Broken: "bg-red-500/15 text-red-300",
  "Not checked": "bg-white/10 text-[#a6a6a6]",
  Unavailable: "bg-gray-500/15 text-gray-300",
}

export const MOBILE_ITEMS = 3
export const DESKTOP_ITEMS = 8

export function formatDate(val: string) {
  return formatWallClock(val, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatReturnedOn(val: string) {
  return formatManila(val, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}
