const MANILA_TZ = "Asia/Manila";

export function hasTimezoneIndicator(value: string): boolean {
  return /(Z|[+-]\d{2}:\d{2})$/.test(value.trim());
}

/** Opaque clock accessor — keeps render-time helpers lint-clean. */
export function nowMs(): number {
  return Date.now();
}

export function formatWallClock(
  value: string,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("en-PH", {
    ...opts,
    timeZone: hasTimezoneIndicator(value) ? MANILA_TZ : undefined,
  });
}

export function formatManila(
  value: string,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("en-PH", {
    ...opts,
    timeZone: MANILA_TZ,
  });
}

/**
 * Normalize a value for insertion into timestamptz columns.
 * Naive strings ("YYYY-MM-DDTHH:mm" from datetime-local inputs or the
 * scanned-form parser) represent Philippines wall time and must carry their
 * +08:00 offset, otherwise Postgres would misread them as UTC. Values that
 * already carry a timezone tag pass through unchanged.
 */
export function toManilaIso(value: string): string {
  if (!value) return value;
  const trimmed = value.trim();
  if (hasTimezoneIndicator(trimmed)) return trimmed;
  const d = new Date(`${trimmed}${trimmed.length === 16 ? ":00" : ""}+08:00`);
  return isNaN(d.getTime()) ? value : d.toISOString();
}

/** PH calendar-day label for a timestamp ("Nov 12, 2026") — folder identity. */
export function manilaDayLabel(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("en-PH", {
    timeZone: MANILA_TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** PH calendar-day key ("YYYY-MM-DD") — stable folder ordering. */
export function manilaDateKey(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: MANILA_TZ });
}

export function formatGradingDate(dateStr: string): string {  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
