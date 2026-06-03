import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { useAuth } from "../../context/AuthContext"
import skHeaderPng from "../../assets/sk_header.png"
import sinekulturaMp4 from "../../assets/sinekultura.mp4"
import HCaptcha from "@hcaptcha/react-hcaptcha";

// uses crypto to generate (built in in browser)
const generatePassword = (length: number): string => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = upper + lower + digits + special;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(n => all[n % all.length]).join('');
};

export default function RegisterPage() {
  const [ captchaToken, setCaptchaToken ] = useState<string>();

  const captcha = useRef<HCaptcha | null>(null);

  const { register } = useAuth()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [studentNumber, setStudentNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError] = useState("")

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError("")

    if (!fullName || !email || !studentNumber || !password) {
      setError("Please fill in all fields")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (!captcha || !captchaToken) {
      setError("Please finish the CAPTCHA first.")
      return
    }

    setLoading(true)

    const ok = await register({ fullName, email, studentNumber, password, captchaToken })

    setLoading(false)

    if (captcha.current)
      captcha.current.resetCaptcha()

    if (!ok) {
      setError("Registration failed. Please try again later.");
      return
    }

    setSuccess(true)
  }

  return (
    <div className="min-h-screen md:flex relative">
      <img src={skHeaderPng} alt="" className="absolute inset-0 w-full h-full object-cover md:hidden" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-black/50 md:hidden" />
      <div className="relative z-10 w-full md:w-120 min-h-screen flex flex-col justify-center bg-white/0 md:bg-white px-3 py-8 md:px-10 md:py-0">
        <div className="w-full max-w-md mx-auto md:mx-0 bg-white rounded-xl shadow-lg border border-[#d9d9d9] p-5 sm:p-8 md:rounded-none md:shadow-none md:border-0 md:p-0">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-[#222] mb-5">
            Register
          </h2>

          {error && (
            <p className="text-red-600 text-sm mb-4 text-center"> {error} </p>
          )}

          {success ? (
            <div className="text-center py-6">
              <p className="text-green-600 font-medium mb-2">
                Registration successful!
              </p>

              <p className="text-sm text-[#666] mb-4">
                Check your email for a confirmation link before logging in.
              </p>

              <Link
                to="/login"
                className="inline-block px-6 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor='name' className="block text-sm font-medium text-[#666] mb-1">
                  Full Name
                </label>

                  <input
                    required
                    autoComplete="name"
                    id="name"
                    type="text"
                    value={fullName}
                    maxLength={100}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                  />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#666] mb-1">
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
                    className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                  />
              </div>

              <div>
                <label htmlFor="student_number" className="block text-sm font-medium text-[#666] mb-1">
                  Student Number
                </label>

                  <input
                    required
                    autoComplete="off"
                    id="student_number"
                    type="text"
                    value={studentNumber}
                    maxLength={20}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                  />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-[#666]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pw = generatePassword(16)
                      setPassword(pw)
                      setConfirmPassword(pw)
                    }}
                    className="text-xs text-[#c89116] hover:text-[#fdb125] cursor-pointer font-medium"
                  >
                    Generate
                  </button>
                </div>

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
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    required
                    autoComplete="new-password"
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    maxLength={128}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                className="w-full mt-5 sm:mt-6 py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm sm:text-base"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          )}

          {!success && (
            <p className="text-center text-sm text-[#666] mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-[#c89116] hover:text-[#fdb125] font-medium">
                Login
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="hidden md:block flex-1 relative">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={sinekulturaMp4} type="video/mp4" />
        </video>
      </div>
    </div>
  )
}
