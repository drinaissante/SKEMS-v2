import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { supabase, updatePassword, signOut } from "../../services/supabase"
import skHeaderPng from "/sk_header.png"
import { usePageTitle } from "../../hooks/usePageTitle"

export default function ChangePasswordPage() {
  usePageTitle("Change Password")
  const navigate = useNavigate()
  const [sessionReady, setSessionReady] = useState(false)
  const [noSession, setNoSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true)
        }
      },
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        setNoSession(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!password || !confirm) {
      setError("Please fill in all fields")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      await updatePassword(password)
      setSuccess(true)
    } catch {
      setError("Failed to update password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoToLogin = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  if (noSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-3 bg-[#f5f5f5] relative">
        <img src={skHeaderPng} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg p-5 sm:p-8 border border-[#d9d9d9] text-center">
          <p className="text-[#222] font-bold text-lg mb-4">Link expired</p>
          <p className="text-sm text-[#666] mb-6">
            This password reset link is no longer valid. Request a new one from the login page.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <p className="text-[#666] text-sm">Checking...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-3 bg-[#f5f5f5] relative">
      <img src={skHeaderPng} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-lg p-5 sm:p-8 border border-[#d9d9d9]">
        <div className="flex items-center justify-center gap-2 mb-5 select-none">
          <img src="/sk_icon_no_bg.png" className="h-7 w-7" alt="" />
          <span className="text-[#fdb125] font-bold text-xl">Sine Kultura</span>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-green-600 mb-2">Password updated!</p>
            <p className="text-sm text-[#666] mb-6">Your password has been changed successfully.</p>
            <button
              onClick={handleGoToLogin}
              className="px-6 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-center text-[#222]">Reset Password</h2>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#666] mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  required
                  autoComplete="new-password"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  maxLength={128}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a6a6a6] hover:text-[#666] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-[#666] mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  required
                  autoComplete="new-password"
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  maxLength={128}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 pr-10 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a6a6a6] hover:text-[#666] cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
