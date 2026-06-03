import { useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { updatePassword } from "../../services/supabase"

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [fullName, setFullName] = useState(user?.fullName ?? "")
  const [studentNumber, setStudentNumber] = useState(user?.studentNumber ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [password, setPassword] = useState("")
  const [showEmail, setShowEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  if (!user) return null

  const handleSave = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      if (password && password.length < 8) {
        setError("Password must be at least 8 characters")
        setSaving(false)
        return
      }
      await updateUser({ fullName, studentNumber, email })
      if (password) {
        await updatePassword(password)
        setPassword("")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-3 py-25 bg-[#f5f5f5]">
      <form
        onSubmit={handleSave}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-5 sm:p-8 border border-[#d9d9d9]"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-center text-[#222] mb-5">
          My Profile
        </h2>

        {saved && (
          <p className="text-green-600 text-sm text-center mb-4">Profile updated successfully!</p>
        )}
        {error && (
          <p className="text-red-600 text-sm text-center mb-4">{error}</p>
        )}

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              maxLength={100}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">
              Student Number
            </label>

            <input
              type="text"
              value={studentNumber}
              maxLength={20}
              onChange={(e) => setStudentNumber(e.target.value)}
              className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[#666]">
                Email
              </label>

              <button
                type="button"
                onClick={() => setShowEmail(!showEmail)}
                className="text-xs text-[#c89116] hover:text-[#fdb125] cursor-pointer"
              >
                {showEmail ? "Hide" : "Show"}
              </button>
            </div>

            <input
              type={showEmail ? "text" : "password"}
              value={email}
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[#666]">
                Password
              </label>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-[#c89116] hover:text-[#fdb125] cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              autoComplete="new-password"
              maxLength={128}
              placeholder="Enter new password..."
              className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full mt-5 sm:mt-6 py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm sm:text-base"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  )
}
