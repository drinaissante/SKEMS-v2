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

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const
const MONTH_ABBR: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
}

export function normalizeDate(raw: string): string {
  if (!raw) return ""
  const cleaned = raw.replace(/^(Date\s*[:of\s]*|Borrowed\s*[:on]*|Due\s*[:]*|Return\s*[:]*)/i, "").trim()

  const toOutput = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const parseTime = (h: string | undefined, min: string | undefined, ap: string | undefined) => {
    let hour = parseInt(h || "0", 10)
    if (ap) {
      if (ap.toUpperCase() === "PM" && hour < 12) hour += 12
      if (ap.toUpperCase() === "AM" && hour === 12) hour = 0
    }
    return { hour, minute: parseInt(min || "0", 10) }
  }

  const named = cleaned.match(
    /([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})(?:\s*[-–—,;:]?\s*(\d{1,2}):(\d{2})\s*([APap][Mm])?)?/,
  )
  if (named) {
    const monthStr = named[1].toLowerCase()
    const fullIdx = MONTHS.indexOf(monthStr as (typeof MONTHS)[number])
    const monthIndex = fullIdx !== -1 ? fullIdx : MONTH_ABBR[monthStr]
    if (monthIndex !== undefined && monthIndex >= 0) {
      const { hour, minute } = parseTime(named[4], named[5], named[6])
      const d = new Date(parseInt(named[3], 10), monthIndex, parseInt(named[2], 10), hour, minute)
      return toOutput(d)
    }
  }

  const mdy = cleaned.match(
    /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm))?/,
  )
  if (mdy) {
    const [, mm, dd, yyyy, h, min, ap] = mdy
    const { hour, minute } = parseTime(h, min, ap)
    const d = new Date(
      parseInt(yyyy, 10),
      parseInt(mm, 10) - 1,
      parseInt(dd, 10),
      hour,
      minute,
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
