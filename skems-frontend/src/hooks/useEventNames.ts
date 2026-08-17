import { useQuery } from "@tanstack/react-query"

const SHEET_ID = "171tDcO9NzSrS37H1Hwo-kbjdwRcHwWYblsPpVgStTls"
const GID = "1617646139"

async function fetchEventNames(): Promise<string[]> {
  const query = encodeURIComponent("SELECT B")
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=${query}&gid=${GID}`

  const response = await fetch(url)
  if (!response.ok) throw new Error("Failed to fetch event list")

  const text = await response.text()
  const jsonString = text.substring(
    text.indexOf("{"),
    text.lastIndexOf("}") + 1,
  )
  const rawData = JSON.parse(jsonString)

  const events: string[] = rawData.table.rows.map(
    (row: { c: { v: string }[] | null }) => {
      return row.c && row.c[0] ? row.c[0].v : ""
    },
  )

  if (events[0] === "Event_Name") {
    events.shift()
  }

  return events.filter((name) => name).sort()
}

export function useEventNames() {
  return useQuery({
    queryKey: ["event-names"],
    queryFn: fetchEventNames,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}
