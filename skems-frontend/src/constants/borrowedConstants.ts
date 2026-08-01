export const CONDITION_OPTIONS = ["Working", "Needs Repair", "Broken", "Not checked"] as const

export const conditionColors: Record<string, string> = {
  Working: "bg-green-100 text-green-700",
  "Needs Repair": "bg-[#ffd870] text-[#222]",
  Broken: "bg-red-100 text-red-700",
  "Not checked": "bg-gray-100 text-[#666]",
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
