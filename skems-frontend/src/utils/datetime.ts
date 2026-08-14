const MANILA_TZ = "Asia/Manila"

export function hasTimezoneIndicator(value: string): boolean {
  return /(Z|[+-]\d{2}:\d{2})$/.test(value.trim())
}

export function formatWallClock(value: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString("en-PH", {
    ...opts,
    timeZone: hasTimezoneIndicator(value) ? "UTC" : undefined,
  })
}

export function formatManila(value: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString("en-PH", {
    ...opts,
    timeZone: MANILA_TZ,
  })
}
