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
  const pad = (n: number) => String(n).padStart(2, "0")
  const h = d.getHours()
  const ampm = h >= 12 ? "PM" : "AM"
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}, ${h % 12 || 12}:${pad(d.getMinutes())} ${ampm}`
}
