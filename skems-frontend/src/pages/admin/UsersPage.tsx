import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchAllProfiles, toggleAdmin } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { FiSearch } from "react-icons/fi"

const MOBILE_ITEMS = 8
const DESKTOP_ITEMS = 15

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
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
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

  const filtered = useMemo(
    () => profiles.filter((p) => {
      const q = search.toLowerCase()
      return (
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        p.student_number.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      )
    }),
    [profiles, search],
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
    <div className="min-h-screen bg-[#f5f5f5] px-3 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-6">
          User Management
        </h1>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
          <input
            type="text"
            placeholder="Search by name, student number, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-[#666] py-10">Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#666] py-10">
            {search ? "No users match your search." : "No users found."}
          </p>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow border border-[#d9d9d9] overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#222] text-white text-left">
                    <th className="px-4 py-3 font-medium">Full Name</th>
                    <th className="px-4 py-3 font-medium">Student Number</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 font-medium text-center">Admin</th>
                    <th className="px-4 py-3 font-medium text-center">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9d9d9]">
                  {paginatedItems.map((p) => (
                    <tr key={p.id} className="text-[#222]">
                      <td className="px-4 py-3 whitespace-nowrap">{p.full_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{p.student_number}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-[#666] whitespace-nowrap">
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
                          disabled={toggleMutation.isPending || p.id === user?.id}
                          className="px-4 py-2 text-xs font-bold rounded-lg bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#a6a6a6] text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
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
                  className="px-4 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#d9d9d9] disabled:text-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#666] font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#d9d9d9] disabled:text-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
