import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import LogoutModal from "../modals/LogoutModal"
import { LOGOUT_EVENT } from "../utils/logoutEvent"
import { useToast } from "../hooks/useToast"

export default function LogoutModalManager() {
  const { logout } = useAuth()
  const { showToast } = useToast()
  const [show, setShow] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const handler = () => {
      setShow(true)
    }
    window.addEventListener(LOGOUT_EVENT, handler)
    return () => window.removeEventListener(LOGOUT_EVENT, handler)
  }, [])

  const handleConfirm = async () => {
    setLoggingOut(true)
    await logout()
    setLoggingOut(false)
    setShow(false)
    showToast("You have been logged out.", "success")
  }

  return show ? (
    <LogoutModal
      onClose={() => setShow(false)}
      onConfirm={handleConfirm}
      loggingOut={loggingOut}
    />
  ) : null
}
