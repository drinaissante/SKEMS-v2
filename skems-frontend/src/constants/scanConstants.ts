import type { ScannedFormFields } from "./borrow"

export const fieldLabels: Record<keyof Omit<ScannedFormFields, "equipment_list">, string> = {
  full_name: "Full Name",
  date: "Date",
  position_department: "Position/Department",
  owner: "Owner",
  purpose_of_use: "Purpose of Use",
  date_time_borrowing: "Date & Time of Borrowing",
  date_time_return: "Date & Time of Return",
  pickup_location: "Pickup Location",
  return_location: "Return Location",
}

export function normalizeDate(raw: string): string {
  if (!raw) return ""
  const cleaned = raw.replace(/^(Date\s*[:of\s]*|Borrowed\s*[:on]*|Due\s*[:]*|Return\s*[:]*)/i, "").trim()
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return raw
}

export function conditionBadgeClass(condition: string) {
  const colors: Record<string, string> = {
    Working: "bg-green-500/15 text-green-300",
    "Needs Repair": "bg-[#ffd870] text-[#222]",
    Broken: "bg-red-500/15 text-red-300",
    "Not checked": "bg-white/10 text-[#a6a6a6]",
    Borrowed: "bg-purple-500/15 text-purple-300",
  }
  return colors[condition] ?? "bg-white/10 text-[#a6a6a6]"
}
