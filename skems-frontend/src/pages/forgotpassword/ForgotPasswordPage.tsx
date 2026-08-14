import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { resetPassword } from "../../services/supabase"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { usePageTitle } from "../../hooks/usePageTitle"

export default function ForgotPasswordPage() {
  usePageTitle("Forgot Password")

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const captcha = useRef<HCaptcha | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string>()

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError("")
    setSent(false)

    if (!email) {
      setError("Please enter your email address.")
      return
    }

    if (!captchaToken) {
      setError("Please finish the CAPTCHA first.")
      return
    }

    setLoading(true)
    try {
      await resetPassword(email, `${window.location.origin}/change-password`, captchaToken)
      setSent(true)
      if (captcha.current)
        captcha.current.resetCaptcha()
    } catch {
      setError("Failed to send reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-fixed-black flex items-center justify-center px-3 py-8">
      <div className="w-full max-w-md dark-card p-5 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-white mb-5">
          Reset Password
        </h2>

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {sent ? (
          <div className="text-center py-6">
            <p className="text-green-400 font-medium mb-2">
              Password reset link sent!
            </p>

            <p className="text-sm text-[#a6a6a6] mb-4">
              Check your email for a link to reset your password.
            </p>

            <Link
              to="/login"
              className="btn-gold inline-block px-6 py-2 text-sm"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <p className="text-sm text-[#a6a6a6]">
              Enter your email to receive a password reset link.
            </p>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Email Address
              </label>

              <input
                required
                autoComplete="email"
                id="email"
                type="email"
                value={email}
                maxLength={254}
                onChange={(e) => setEmail(e.target.value)}
                className="dark-input w-full text-base"
              />
            </div>

            <HCaptcha
              ref={captcha}
              sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY}
              onVerify={(token: string) => {
                setCaptchaToken(token)
              }}
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full mt-5 sm:mt-6 py-3 text-sm sm:text-base"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        {!sent && (
          <p className="text-center text-sm text-[#a6a6a6] mt-4">
            Remembered your password?{" "}

            <Link to="/login" className="text-[#c89116] hover:text-[#fdb125] font-medium">
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
