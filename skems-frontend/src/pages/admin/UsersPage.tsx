import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchAllProfiles, fetchAllDiscordLinks, toggleAdmin, updateProfile } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { FiSearch, FiCheck, FiX } from "react-icons/fi"

const MOBILE_ITEMS = 8
const DESKTOP_ITEMS = 15

interface DiscordLink {
  user_id: string
  discord_id: string
  discord_username: string | null
  discord_avatar: string | null
  linked_at: string
}

interface Profile {
  id: string
  student_number: string
  full_name: string
  is_admin: boolean
  is_superadmin: boolean
  email: string
  position: string | null
  discordLink: DiscordLink | null
}

export default function UsersPage() {
  usePageTitle("Manage Users")
  const { user, isSuperAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [positionDraft, setPositionDraft] = useState("")
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
  })

  const { data: discordLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ["discord-links"],
    queryFn: fetchAllDiscordLinks,
  })

  const toggleMutation = useMutation({
    mutationFn: ({
      profileId,
      isAdmin,
      currentUserId,
    }: {
      profileId: string
      isAdmin: boolean
      currentUserId: string
    }) => toggleAdmin(profileId, isAdmin, currentUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
    },
  })

  const positionMutation = useMutation({
    mutationFn: ({ profileId, position }: { profileId: string; position: string }) =>
      updateProfile(profileId, { position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
      setEditingProfile(null)
    },
  })

  const profilesWithDiscord = useMemo(() => {
    const map = new Map(discordLinks.map((l) => [l.user_id, l]))
    return profiles.map((p) => ({ ...p, discordLink: map.get(p.id) ?? null }))
  }, [profiles, discordLinks])

  const filtered = useMemo(
    () => profilesWithDiscord.filter((p) => {
      const q = search.toLowerCase()
      return (
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        p.student_number.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      )
    }),
    [profilesWithDiscord, search],
  )

  const itemsPerPage = isMobile ? MOBILE_ITEMS : DESKTOP_ITEMS
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const handleToggle = (profile: Profile) => {
    if (profile.id === user?.id || toggleMutation.isPending) return
    toggleMutation.mutate({
      profileId: profile.id,
      isAdmin: !profile.is_admin,
      currentUserId: user!.id,
    })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          User Management
        </h1>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
          <input
            type="text"
            placeholder="Search by name, student number, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="dark-input w-full pl-9 pr-3 py-2 text-sm"
          />
        </div>

        {isLoading || linksLoading ? (
          <p className="text-center text-[#a6a6a6] py-10">Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#a6a6a6] py-10">
            {search ? "No users match your search." : "No users found."}
          </p>
        ) : (
          <>
            <div className="dark-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-white text-left">
                    <th className="px-4 py-3 font-medium">Full Name</th>
                    <th className="px-4 py-3 font-medium">Student Number</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 font-medium text-center">Discord</th>
                    <th className="px-4 py-3 font-medium text-center">Position</th>
                    <th className="px-4 py-3 font-medium text-center">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedItems.map((p) => (
                    <tr key={p.id} className="text-white">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profiles/${p.id}/equipments`}
                            className="hover:text-[#fdb125] hover:underline transition-colors cursor-pointer"
                            title="View equipments"
                          >
                            {p.full_name}
                          </Link>
                          {p.is_superadmin ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300" title="Super Admin">SA</span>
                          ) : p.is_admin ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-300" title="Admin">A</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.student_number}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-[#a6a6a6] whitespace-nowrap">
                        {p.email}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.discordLink ? (
                          <span
                            className="inline-flex items-center justify-center text-green-400"
                            title={p.discordLink.discord_username ?? p.discordLink.discord_id}
                          >
                            <FiCheck size={18} />
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center justify-center text-red-500"
                            title="Not linked"
                          >
                            <FiX size={18} />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#a6a6a6]">
                            {p.position || "—"}
                          </span>
                          {isSuperAdmin && (
                            <button
                              onClick={() => { setEditingProfile(p); setPositionDraft(p.position ?? "") }}
                              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[#fdb125] transition-colors cursor-pointer"
                              title="Edit position"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(p)}
                          disabled={toggleMutation.isPending || p.id === user?.id}
                          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#c89116] hover:bg-[#caa453] disabled:opacity-40 text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                          title={p.id === user?.id ? "Cannot modify your own role" : undefined}
                        >
                          {toggleMutation.isPending && toggleMutation.variables?.profileId === p.id
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-gold px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#a6a6a6] font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-gold px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">Edit Position</h3>
            <p className="text-sm text-[#a6a6a6] mb-3">{editingProfile.full_name}</p>
            <input
              type="text"
              value={positionDraft}
              onChange={(e) => setPositionDraft(e.target.value)}
              placeholder="e.g. President, Trainee..."
              className="dark-input w-full text-sm"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditingProfile(null)}
                className="btn-ghost flex-1 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => positionMutation.mutate({ profileId: editingProfile.id, position: positionDraft.trim() })}
                disabled={positionMutation.isPending}
                className="flex-1 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm disabled:opacity-40"
              >
                {positionMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
