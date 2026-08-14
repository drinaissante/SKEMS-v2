import type { ScannedFormFields } from "./borrow"

export const fieldLabels: Record<keyof Omit<ScannedFormFields, "equipment_list">, string> = {
  full_name: "Full Name",
  student_number: "Student Number",
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

  const toOutput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const mdy = cleaned.match(
    /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm))?/,
  )
  if (mdy) {
    const [, mm, dd, yyyy, h, min, ap] = mdy
    let hour = parseInt(h || "0", 10)
    if (ap) {
      if (ap.toUpperCase() === "PM" && hour < 12) hour += 12
      if (ap.toUpperCase() === "AM" && hour === 12) hour = 0
    }
    const d = new Date(
      parseInt(yyyy, 10),
      parseInt(mm, 10) - 1,
      parseInt(dd, 10),
      hour,
      parseInt(min || "0", 10),
    )
    return toOutput(d)
  }

  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) return toOutput(d)
  return raw
}

export function conditionBadgeClass(condition: string) {
  const colors: Record<string, string> = {
    Working: "bg-green-500/15 text-green-300",
    "Needs Repair": "bg-[#ffd870] text-[#222]",
    Broken: "bg-red-500/15 text-red-300",
    "Not checked": "bg-white/10 text-[#a6a6a6]",
    Borrowed: "bg-purple-500/15 text-purple-300",
    Unavailable: "bg-gray-500/15 text-gray-300",
  }
  return colors[condition] ?? "bg-white/10 text-[#a6a6a6]"
}
