import { FiMoon, FiSun } from "react-icons/fi"
import { useTheme } from "../hooks/useTheme"

interface ThemeToggleProps {
  compact?: boolean
  full?: boolean
}

export default function ThemeToggle({ compact = false, full = false }: ThemeToggleProps) {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"
  const label = isDark ? "Switch to Rose theme" : "Switch to Dark theme"

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        title={label}
        aria-label={label}
        className="p-2 rounded-lg border border-white/15 text-[#a6a6a6] hover:text-[#fdb125] hover:border-[#c89116] transition-colors cursor-pointer"
      >
        {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-[#a6a6a6] hover:text-white hover:bg-white/5 cursor-pointer ${
        full ? "w-full" : ""
      }`}
    >
      {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
      {isDark ? "Rose Theme" : "Dark Theme"}
    </button>
  )
}
