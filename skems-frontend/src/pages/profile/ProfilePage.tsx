import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { updatePassword, fetchDiscordLink } from "../../services/supabase"
import { usePageTitle } from "../../hooks/usePageTitle"

interface DiscordLink {
  user_id: string
  discord_id: string
  discord_username: string | null
  discord_avatar: string | null
  linked_at: string
}

export default function ProfilePage() {
  usePageTitle("Profile")
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
  const [discordLink, setDiscordLink] = useState<DiscordLink | null>(null)
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let active = true
    fetchDiscordLink(userId)
      .then((link) => {
        if (active) setDiscordLink(link)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [userId])

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(user.linkCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable; ignore
    }
  }

  const checkLinkStatus = async () => {
    setChecking(true)
    try {
      const link = await fetchDiscordLink(user.id)
      setDiscordLink(link)
    } catch {
      // ignore
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center px-3 py-25 bg-fixed-black">
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-5 md:items-start">
        <form
          onSubmit={handleSave}
          className="w-full md:flex-1 dark-card p-5 sm:p-8"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-center text-white mb-5">
            My Profile
          </h2>

          {saved && (
            <p className="text-green-300 text-sm text-center mb-4">Profile updated successfully!</p>
          )}
          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Full Name
              </label>

              <input
                type="text"
                value={fullName}
                maxLength={100}
                onChange={(e) => setFullName(e.target.value)}
                className="dark-input w-full text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Student Number
              </label>

              <input
                type="text"
                value={studentNumber}
                maxLength={20}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="dark-input w-full text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Position
              </label>

              <div className="w-full px-3 py-2 text-base border border-white/10 rounded-lg bg-white/5 text-[#a6a6a6]">
                {user.position || "—"}
              </div>
              <p className="text-xs text-[#a6a6a6] mt-1">
                Position is assigned by the administrator and cannot be edited here.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#a6a6a6]">
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
                className="dark-input w-full text-base"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-[#a6a6a6]">
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
                className="dark-input w-full text-base"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-gold w-full mt-5 sm:mt-6 py-3 text-sm sm:text-base disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <div className="w-full md:flex-1 flex flex-col gap-5">
          <div className="dark-card p-5 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-white mb-5">
              Discord Link
            </h2>

          {discordLink ? (
            <div className="text-center space-y-3">
              {discordLink.discord_avatar && (
                <img
                  src={discordLink.discord_avatar}
                  alt="Discord avatar"
                  className="w-16 h-16 rounded-full mx-auto"
                />
              )}
              <p className="font-semibold text-white">
                {discordLink.discord_username ?? discordLink.discord_id}
              </p>
              <p className="text-sm text-[#a6a6a6]">
                Linked since{" "}
                {new Date(discordLink.linked_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-[#a6a6a6]">
                To unlink, use <code className="text-[#c89116]">/unlink</code> in the Discord server.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-[#a6a6a6]">
                In the Discord server, run the command:
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[#fdb125] font-mono text-xs sm:text-sm select-all break-all max-w-[70%]">
                  /link {user.linkCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 px-3 py-2 text-xs font-semibold text-[#fdb125] border border-white/10 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-[#a6a6a6]">
                This is your personal link code, generated when you registered.
              </p>
              <button
                type="button"
                onClick={checkLinkStatus}
                disabled={checking}
                className="btn-gold w-full py-2 text-sm disabled:opacity-40"
              >
                {checking ? "Checking..." : "Check link status"}
              </button>
            </div>
          )}
          </div>

          <div className="dark-card p-5 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Join Discord
            </h2>
            <p className="text-sm text-[#a6a6a6] mb-4">
              Connect with the Sine Kultura community on Discord.
            </p>
            <a
              href="https://discord.gg/hkPTHrdKQq"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-block px-6 py-2.5 text-sm"
            >
              Join Server
            </a>
          </div>
        </div>
    </div>
  )
}
