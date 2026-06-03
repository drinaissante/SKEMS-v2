import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchAllRequests,
  updateRequestStatus,
} from "../../services/supabase"
import { FiSearch, FiChevronDown } from "react-icons/fi"

const MOBILE_ITEMS = 5
const DESKTOP_ITEMS = 10

const statusColors: Record<string, string> = {
  Pending: "bg-[#caa453] text-white",
  Approved: "bg-green-600 text-white",
  Denied: "bg-red-600 text-white",
  Returned: "bg-[#a6a6a6] text-white",
}

function formatDateTime(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  const h = d.getHours()
  const ampm = h >= 12 ? "PM" : "AM"
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}, ${h % 12 || 12}:${pad(d.getMinutes())} ${ampm}`
}

export default function RequestsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: fetchAllRequests,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] })
    },
  })

  const statuses = useMemo(
    () => ["All", ...new Set(requests.map((r) => r.status))],
    [requests],
  )

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        r.equipment_name.toLowerCase().includes(q) ||
        r.borrower_name.toLowerCase().includes(q) ||
        r.student_number.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)

      const matchesStatus = filterStatus === "All" || r.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [requests, search, filterStatus])

  const itemsPerPage = isMobile ? MOBILE_ITEMS : DESKTOP_ITEMS
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const handleStatus = (id: string, status: string) => {
    statusMutation.mutate({ id, status })
  }

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-4">
          Borrow Requests
        </h1>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-35">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
            <input
              type="text"
              placeholder="Search by name, student number, or reason..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg text-[#222] bg-white"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="text-center text-[#666] py-10">Loading requests...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#666] py-10">
            {search || filterStatus !== "All" ? "No requests match your filters." : "No requests found."}
          </p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow border border-[#d9d9d9]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#222] text-white text-left">
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Equipment</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Qty</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Borrower</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Student #</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Reason</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Borrowed</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Due</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Returned</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Status</th>
                    <th className="px-3 py-2 sm:px-4 sm:py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((r) => (
                    <tr key={r.id} className="border-t border-[#d9d9d9] hover:bg-[#f5f5f5]">
                      <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-[#222]">
                        {r.equipment_name}
                        <span className="text-[#a6a6a6] text-xs ml-1">{r.equipment_id}</span>
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666] text-center">{r.quantity}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666]">{r.borrower_name}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666]">{r.student_number}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666] max-w-48 truncate">{r.reason}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666] whitespace-nowrap text-xs">
                        {formatDateTime(r.date_borrowed)}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666] whitespace-nowrap text-xs">
                        {formatDateTime(r.date_due)}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666] whitespace-nowrap text-xs">
                        {r.returned_on ? formatDateTime(r.returned_on) : "—"}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            statusColors[r.status] ?? "bg-[#d9d9d9] text-[#666]"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3">
                        {r.status === "Pending" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleStatus(r.id, "Approved")}
                              className="px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatus(r.id, "Denied")}
                              className="px-3 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                        {r.status === "Approved" && (
                          <button
                            onClick={() => handleStatus(r.id, "Returned")}
                            className="px-3 py-2 text-xs bg-[#222] hover:bg-[#666] text-white rounded transition-colors cursor-pointer"
                          >
                            Mark Returned
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-2">
              {paginatedItems.map((r) => (
                <div key={r.id} className="bg-white rounded-xl shadow border border-[#d9d9d9]">
                  <button
                    onClick={() => toggleRow(r.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#222] text-sm truncate">
                        {r.equipment_name} <span className="text-[#a6a6a6] font-normal">×{r.quantity}</span>
                      </p>
                      <p className="text-xs text-[#a6a6a6] truncate">{r.borrower_name}</p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold ${
                        statusColors[r.status] ?? "bg-[#d9d9d9] text-[#666]"
                      }`}
                    >
                      {r.status}
                    </span>
                    <FiChevronDown
                      size={16}
                      className={`shrink-0 text-[#666] transition-transform ${
                        expandedRow === r.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedRow === r.id && (
                    <div className="px-3 pb-3 pt-1 border-t border-[#d9d9d9] space-y-2 text-xs text-[#666]">
                      <div className="flex justify-between">
                        <span>Equipment ID</span>
                        <span className="font-medium text-[#c89116]">{r.equipment_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Student #</span>
                        <span className="font-medium text-[#222]">{r.student_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reason</span>
                        <span className="font-medium text-[#222] text-right max-w-48">{r.reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Borrowed</span>
                        <span className="font-medium text-[#222]">{formatDateTime(r.date_borrowed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due</span>
                        <span className="font-medium text-[#222]">{formatDateTime(r.date_due)}</span>
                      </div>
                      {r.returned_on && (
                        <div className="flex justify-between">
                          <span>Returned</span>
                          <span className="font-medium text-[#222]">{formatDateTime(r.returned_on)}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        {r.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleStatus(r.id, "Approved")}
                              className="flex-1 py-2.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatus(r.id, "Denied")}
                              className="flex-1 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {r.status === "Approved" && (
                          <button
                            onClick={() => handleStatus(r.id, "Returned")}
                            className="flex-1 py-2.5 text-xs font-bold bg-[#222] hover:bg-[#666] text-white rounded-lg transition-colors cursor-pointer"
                          >
                            Mark Returned
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
