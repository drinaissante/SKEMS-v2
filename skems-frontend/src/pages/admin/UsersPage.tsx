import { useState, useEffect } from "react"
import { fetchAllProfiles, toggleAdmin } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"

interface Profile {
  id: string
  student_number: string
  full_name: string
  is_admin: boolean
  is_superadmin: boolean
  email: string
}

export default function UsersPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const loadProfiles = async () => {
    try {
      const data = await fetchAllProfiles()
      setProfiles(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadProfiles() }, [])

  const handleToggle = async (profile: Profile) => {
    if (profile.id === user?.id) return
    setToggling(profile.id)
    try {
      await toggleAdmin(profile.id, !profile.is_admin)
      await loadProfiles()
    } catch {
      // silently fail
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-3 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-6">
          User Management
        </h1>

        {loading ? (
          <p className="text-center text-[#666] py-10">Loading users...</p>
        ) : profiles.length === 0 ? (
          <p className="text-center text-[#666] py-10">No users found.</p>
        ) : (
          <div className="bg-white rounded-xl shadow border border-[#d9d9d9] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f5f5f5] text-[#666] text-left">
                  <th className="px-4 py-3 font-medium">Full Name</th>
                  <th className="px-4 py-3 font-medium">Student Number</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 font-medium text-center">Admin</th>
                  <th className="px-4 py-3 font-medium text-center">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d9d9d9]">
                {profiles.map((p) => (
                  <tr key={p.id} className="text-[#222]">
                    <td className="px-4 py-3">{p.full_name}</td>
                    <td className="px-4 py-3">{p.student_number}</td>
                    <td className="px-4 py-3 hidden sm:table-cell text-[#666]">
                      {p.email}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.is_admin ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Admin
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-[#666]">
                          Member
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(p)}
                        disabled={toggling === p.id || p.id === user?.id}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#a6a6a6] text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                        title={p.id === user?.id ? "Cannot modify your own role" : undefined}
                      >
                        {toggling === p.id
                          ? "..."
                          : p.is_admin
                            ? "Remove Admin"
                            : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
