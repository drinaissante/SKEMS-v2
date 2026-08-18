import { useQuery } from "@tanstack/react-query"

export type EventOption = {
  event_name: string
  start_date: string
}

const SHEET_ID = "171tDcO9NzSrS37H1Hwo-kbjdwRcHwWYblsPpVgStTls"
const GID = "1617646139"

function parseSheetDate(raw: string): string {
  const gvizMatch = raw.match(/Date\((\d+),(\d+),(\d+)/)
  if (gvizMatch) {
    const year = parseInt(gvizMatch[1])
    const month = parseInt(gvizMatch[2]) + 1
    const day = parseInt(gvizMatch[3])
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }
  const datePart = raw.split(" ")[0]
  const [month, day, year] = datePart.split("/")
  if (!year || !month || !day) return ""
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

async function fetchEventNames(): Promise<EventOption[]> {
  const query = encodeURIComponent("SELECT B, C")
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=${query}&gid=${GID}`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch event list")

  const text = await response.text()
  const jsonString = text.substring(
    text.indexOf("{"),
    text.lastIndexOf("}") + 1,
  )
  const rawData = JSON.parse(jsonString)

  const events: EventOption[] = rawData.table.rows
    .map(
      (row: { c: { v: string; f?: string }[] | null }) => {
        const name = row.c && row.c[0] ? row.c[0].v : ""
        const rawDate = row.c && row.c[1] ? (row.c[1].f || row.c[1].v || "") : ""
        return { event_name: name, start_date: parseSheetDate(rawDate) }
      },
    )
    .filter((e: EventOption) => e.event_name)
    .sort((a: EventOption, b: EventOption) => a.start_date.localeCompare(b.start_date))

  if (events[0]?.event_name === "Event_Name") {
    events.shift()
  }

  return events
}

export function useEventNames() {
  return useQuery({
    queryKey: ["event-names"],
    queryFn: fetchEventNames,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
