import { useEffect, useState } from "react"

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(!isOffline())

  useEffect(() => {
    const apply = () => {
      const nowOnline = !isOffline()
      setOnline(nowOnline)
      document.body.classList.toggle("offline", !nowOnline)
    }

    const blockSubmit = (event: Event) => {
      if (isOffline()) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }

    apply()

    window.addEventListener("online", apply)
    window.addEventListener("offline", apply)
    document.addEventListener("submit", blockSubmit, true)

    return () => {
      window.removeEventListener("online", apply)
      window.removeEventListener("offline", apply)
      document.removeEventListener("submit", blockSubmit, true)
      document.body.classList.remove("offline")
    }
  }, [])

  return online
}
