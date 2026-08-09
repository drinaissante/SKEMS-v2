export const CONDITION_OPTIONS = ["Working", "Needs Repair", "Broken", "Not checked"] as const

export const conditionColors: Record<string, string> = {
  Working: "bg-green-500/15 text-green-300",
  "Needs Repair": "bg-[#ffd870] text-[#222]",
  Broken: "bg-red-500/15 text-red-300",
  "Not checked": "bg-white/10 text-[#a6a6a6]",
}

export const MOBILE_ITEMS = 3
export const DESKTOP_ITEMS = 8

export function formatDate(val: string) {
  if (!val) return ""
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })
}
