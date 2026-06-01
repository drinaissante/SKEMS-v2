import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import loginMp4 from "../../assets/login.mp4"

import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function LoginPage() {
  const [ captchaToken, setCaptchaToken ] = useState<string>();

  const captcha = useRef<HCaptcha | null>(null);

  const navigate = useNavigate()
  const { login } = useAuth()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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

    navigate("/")
  }

  return (
    <div className="min-h-screen md:flex relative">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover md:hidden">
        <source src={loginMp4} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50 md:hidden" />
      
      <div className="relative z-10 w-full md:w-120 min-h-screen flex flex-col justify-center bg-white/0 md:bg-white px-3 py-8 md:px-10 md:py-0">
        <div className="w-full max-w-md mx-auto md:mx-0 bg-white rounded-xl shadow-lg border border-[#d9d9d9] p-5 sm:p-8 md:rounded-none md:shadow-none md:border-0 md:p-0">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-[#222] mb-5">Login</h2>

          {error && (
            <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-[#666] mb-1">
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
                className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#666] mb-1">
                Password
              </label>

              <input
                required
                autoComplete="current-password"
                id="password"
                type="password"
                value={password}
                maxLength={128}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
              />
            </div>

            <label htmlFor="checkbox" className="flex items-start gap-2 text-sm text-[#666] cursor-pointer">
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
              className="w-full mt-5 sm:mt-6 py-2.5 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm sm:text-base"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-[#666] mt-4">
            No account yet?{" "}

            <Link to="/register" className="text-[#c89116] hover:text-[#fdb125] font-medium">
              Register account
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block flex-1 relative">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={loginMp4} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </div>
    </div>
  )
}
