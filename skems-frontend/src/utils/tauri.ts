import type { MouseEvent } from "react"

export const IS_TAURI =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

export function openExternalTab(e: MouseEvent<HTMLAnchorElement>, url: string) {
  if (!IS_TAURI) return
  e.preventDefault()
  window.location.href = url
}