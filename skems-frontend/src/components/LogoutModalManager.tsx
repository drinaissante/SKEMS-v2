import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import LogoutModal from "../modals/LogoutModal"
import { LOGOUT_EVENT } from "../utils/logoutEvent"

export default function LogoutModalManager() {
  const { logout } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = () => {
      logout()
      setShow(true)
    }
    window.addEventListener(LOGOUT_EVENT, handler)
    return () => window.removeEventListener(LOGOUT_EVENT, handler)
  }, [logout])

  return show ? <LogoutModal onClose={() => setShow(false)} /> : null
}
