import { useEffect, useState } from "react"

export type Theme = "dark" | "rose"

const THEME_KEY = "skems-theme"

function applyTheme(theme: Theme) {
  if (theme === "rose") {
    document.documentElement.dataset.theme = "rose"
  } else {
    delete document.documentElement.dataset.theme
  }
}

function readInitialTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "rose" ? "rose" : "dark"
  } catch {
    return "dark"
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore storage errors
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === "dark" ? "rose" : "dark"))

  return { theme, toggle }
}
