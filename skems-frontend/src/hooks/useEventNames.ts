import { useQuery } from "@tanstack/react-query";

export type EventOption = {
  event_name: string;
  start_date: string;
};

const SHEET_ID = "171tDcO9NzSrS37H1Hwo-kbjdwRcHwWYblsPpVgStTls";
const GID = "1617646139";

function parseSheetDate(raw: any): string {
  if (!raw) return "";
  const str = String(raw);

  // Handle Google GViz Date format: Date(YYYY,M,D)
  const gvizMatch = str.match(/Date\((\d+),(\d+),(\d+)/);
  if (gvizMatch) {
    const year = parseInt(gvizMatch[1], 10);
    const month = parseInt(gvizMatch[2], 10) + 1; // Months are 0-indexed in GViz
    const day = parseInt(gvizMatch[3], 10);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Handle standard date strings (e.g., MM/DD/YYYY)
  const datePart = str.split(" ")[0];
  const parts = datePart.split("/");
  if (parts.length < 3) return "";

    const [day, month, year] = parts;
  if (!year || !month || !day) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

async function fetchEventNames(): Promise<EventOption[]> {
  const query = encodeURIComponent("SELECT B, C");
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=${query}&gid=${GID}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch event list");

  const text = await response.text();
  const jsonString = text.substring(
    text.indexOf("{"),
    text.lastIndexOf("}") + 1,
  );
  const rawData = JSON.parse(jsonString);

  if (!rawData.table || !rawData.table.rows) {
    return [];
  }

  const events: EventOption[] = rawData.table.rows
    .map((row: { c: Array<{ v?: any; f?: string } | null> | null }) => {
      const c = row?.c;
      const name = c && c[0] && c[0].v != null ? String(c[0].v) : "";
      const rawDate = c && c[1] ? c[1].f || c[1].v || "" : "";
      return { event_name: name, start_date: parseSheetDate(rawDate) };
    })
    .filter((e: EventOption) => e.event_name)
    .sort((a: EventOption, b: EventOption) =>
      a.start_date.localeCompare(b.start_date),
    );

  if (events[0]?.event_name === "Event_Name") {
    events.shift();
  }

  return events;
}

export function useEventNames() {
  return useQuery({
    queryKey: ["event-names"],
    queryFn: fetchEventNames,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
