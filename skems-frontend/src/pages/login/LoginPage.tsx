import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { resetPassword } from "../../services/supabase"
import { FiEye, FiEyeOff } from "react-icons/fi"
import loginMp4 from "/login.mp4"
import LoginModal from "../../modals/LoginModal"

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function LoginPage() {
  usePageTitle("Login")

  const [ captchaToken, setCaptchaToken ] = useState<string>();

  const captcha = useRef<HCaptcha | null>(null);

  const navigate = useNavigate()
  const { login, user } = useAuth()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showLoginSuccess, setShowLoginSuccess] = useState(false)

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const forgotCaptcha = useRef<HCaptcha | null>(null);
  const [forgotCaptchaToken, setForgotCaptchaToken] = useState<string>();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError("")

    if (!identifier || !password) {
      setError("Please fill in all fields.")
      return
    }
    if (!agreed) {
      setError("You must acknowledge the privacy policy & terms and conditions!")
      return
    }

    if (!captcha || !captchaToken) {
      setError("Please finish the CAPTCHA first.")
      return
    }

    setLoading(true)

    const ok = await login(identifier, password, captchaToken)

    setLoading(false)
    
    if (captcha.current)
      captcha.current.resetCaptcha()

    if (!ok) {
      setError("Invalid student number, email, or password. Please try again later.")
      return
    }

    setShowLoginSuccess(true)
  }

  const handleForgotSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError("")
    setForgotSent(false)

    if (!forgotEmail) {
      setError("Please enter your email address.")
      return
    }

    if (!forgotCaptchaToken) {
      setError("Please finish the CAPTCHA first.")
      return
    }

    setForgotLoading(true)
    try {
      await resetPassword(forgotEmail, `${window.location.origin}/change-password`, forgotCaptchaToken)
      setForgotSent(true)
      setShowForgot(false)
      if (forgotCaptcha.current)
        forgotCaptcha.current.resetCaptcha()
    } catch {
      setError("Failed to send reset email. Please try again.")
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen md:flex">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover md:hidden">
        <source src={loginMp4} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50 md:hidden" />

      <div className="relative z-10 w-full md:w-120 min-h-screen flex flex-col justify-center bg-white/0 md:bg-[#111] px-3 py-8 md:px-10 md:py-0">
        <div className="w-full max-w-md mx-auto md:mx-0 bg-[#111] rounded-xl shadow-lg border border-[#5f5c5c93] p-5 sm:p-8 md:rounded-none md:shadow-none md:border-0 md:p-0">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-white mb-5">Login</h2>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          {forgotSent && (
            <p className="text-green-400 text-sm mb-4 text-center">
              Password reset link sent! Check your email.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Student Number or Email
              </label>

              <input
                required
                autoComplete="username"
                id="identifier"
                type="text"
                value={identifier}
                maxLength={254}
                onChange={(e) => setIdentifier(e.target.value)}
                className="dark-input w-full text-base"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  required
                  autoComplete="current-password"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  maxLength={128}
                  onChange={(e) => setPassword(e.target.value)}
                  className="dark-input w-full pr-10 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a6a6a6] hover:text-[#fdb125] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgot(!showForgot)}
              className="text-sm text-[#c89116] hover:text-[#fdb125] hover:underline cursor-pointer"
            >
              {showForgot ? "Cancel" : "Forgot Password?"}
            </button>

            {showForgot && (
              <form onSubmit={handleForgotSubmit} className="space-y-2 p-3 bg-white/5 rounded-lg border border-[#5f5c5c93]">
                <p className="text-xs text-[#a6a6a6]">Enter your email to receive a password reset link.</p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your@email.com"
                  maxLength={254}
                  autoComplete="email"
                  className="dark-input w-full text-sm"
                />
                <HCaptcha
                  ref={forgotCaptcha}
                  sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY}
                  onVerify={(token: string) => {
                    setForgotCaptchaToken(token)
                  }}
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-gold w-full py-2 text-sm"
                >
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            )}

            <label htmlFor="checkbox" className="flex items-start gap-2 text-sm text-[#a6a6a6] cursor-pointer">
              <input
                required
                id="checkbox"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-[#c89116] shrink-0"
              />
              <span>
                I acknowledge the privacy policy & terms and conditions (for borrowing equipment)
              </span>
            </label>

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
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-[#a6a6a6] mt-4">
            No account yet?{" "}

            <Link to="/register" className="text-[#c89116] hover:text-[#fdb125] font-medium">
              Register account
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block flex-1 relative md:min-h-screen">
        <video autoPlay muted loop playsInline preload="auto" className="absolute inset-0 w-full h-full object-cover">
          <source src={loginMp4} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {showLoginSuccess && (
        <LoginModal
          userName={user?.fullName}
          onClose={() => { setShowLoginSuccess(false); navigate("/") }}
        />
      )}
    </div>
  )
}
