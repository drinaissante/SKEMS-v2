import { useState, useMemo, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import {
  fetchAllRequests,
  updateRequestStatus,
  approveAndMoveRequest,
  deleteRequest,
  hasRegisteredOwner,
} from "../../services/supabase"
import { useToast } from "../../hooks/useToast"
import { useAuth } from "../../context/AuthContext"
import { FiSearch, FiTrash2, FiCheckCircle, FiXCircle } from "react-icons/fi"
import { usePageTitle } from "../../hooks/usePageTitle"
import { formatWallClock } from "../../utils/datetime"
import RequestCard, { type RequestLike } from "../../components/RequestCard"
import RequestInfoModal from "../../modals/RequestInfoModal"

const MOBILE_ITEMS = 5
const DESKTOP_ITEMS = 10

const dtOpts: Intl.DateTimeFormatOptions = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}

function formatDateTime(iso: string) {
  return formatWallClock(iso, dtOpts)
}

export default function RequestsPage() {
  usePageTitle("Manage Requests")
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const focusId = searchParams.get("id")
  const focusPageSet = useRef(false)
  const highlighted = useRef(false)

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

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveAndMoveRequest(requestId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] })
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
    },
    onError: (err) => {
      showToast("Failed to approve request: " + err.message, "error")
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (requestId: string) => deleteRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] })
    },
  })

  const statuses = useMemo(
    () => ["All", ...new Set(requests.map((r) => r.status))],
    [requests],
  )

  // Which equipment owners are registered users (owner pre-approval applies)?
  const ownersKey = useMemo(
    () => [...new Set(requests.map(r => (r.owner ?? "").trim()).filter(Boolean))].join("|"),
    [requests],
  )
  const { data: ownerGateMap = new Map() } = useQuery({
    queryKey: ["owner-gate", ownersKey],
    queryFn: async () => {
      const map = new Map<string, boolean>()
      for (const name of ownersKey.split("|").filter(Boolean)) {
        map.set(name.toLowerCase(), await hasRegisteredOwner(name))
      }
      return map
    },
    enabled: ownersKey.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        r.equipment_name.toLowerCase().includes(q) ||
        r.borrower_name.toLowerCase().includes(q) ||
        r.student_number.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
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

  useEffect(() => {
    if (!focusId || focusPageSet.current || requests.length === 0) return
    const idx = requests.findIndex((r) => r.id === focusId)
    if (idx < 0) {
      focusPageSet.current = true
      showToast("Request not found. It may have been deleted.", "error")
      return
    }
    focusPageSet.current = true
    setTimeout(() => setCurrentPage(Math.floor(idx / itemsPerPage) + 1), 0)
  }, [focusId, requests, itemsPerPage, showToast])

  useEffect(() => {
    if (!focusId || highlighted.current) return
    const el = document.getElementById(`request-${focusId}`)
    if (!el) return
    highlighted.current = true
    const show = setTimeout(() => {
      setDetailId(focusId)
      el.scrollIntoView({ block: "center", behavior: "smooth" })
      setHighlightId(focusId)
    }, 0)
    const hide = setTimeout(() => setHighlightId(null), 2600)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [focusId, currentPage, requests])

  const handleStatus = (id: string, status: string) => {
    if (status === "Approved") {
      setDetailId(null)
      setConfirmApproveId(id)
    } else {
      statusMutation.mutate({ id, status })
    }
  }

  const confirmApprove = () => {
    if (!confirmApproveId) return
    approveMutation.mutate(confirmApproveId)
    setConfirmApproveId(null)
  }

  const confirmDelete = () => {
    if (!confirmDeleteId) return
    deleteMutation.mutate(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  if (!user) return null

  const detailRequest = requests.find(r => r.id === detailId) ?? null

  const modalActions = (r: RequestLike) =>
    r.status !== "Approved" ? (
      <>
        {r.status === "Pending" && (
          <>
            {(() => {
              const ownerRequired = ownerGateMap.get((r.owner ?? "").trim().toLowerCase()) ?? false
              const ownerApproved = (r.owner_status ?? "pending") === "approved"
              const gated = ownerRequired && !ownerApproved
              if (gated) {
                return (
                  <button
                    disabled
                    title="The equipment owner must approve this request first."
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-[#a6a6a6] text-xs font-bold cursor-not-allowed"
                  >
                    Awaiting owner approval
                  </button>
                )
              }
              return (
                <button
                  onClick={() => handleStatus(r.id, "Approved")}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {approveMutation.isPending && approveMutation.variables === r.id ? <span className="text-xs">...</span> : <FiCheckCircle size={14} />}
                  Approve
                </button>
              )
            })()}
            <button
              onClick={() => handleStatus(r.id, "Denied")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <FiXCircle size={14} />
              Deny
            </button>
          </>
        )}
        <button
          onClick={() => { setDetailId(null); setConfirmDeleteId(r.id) }}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-40 text-red-400 text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {deleteMutation.isPending && deleteMutation.variables === r.id ? <span className="text-xs">...</span> : <FiTrash2 size={14} />}
          Delete
        </button>
      </>
    ) : (
      <>
        <button
          onClick={() => { setDetailId(null); setConfirmDeleteId(r.id) }}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-40 text-red-400 text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {deleteMutation.isPending && deleteMutation.variables === r.id ? <span className="text-xs">...</span> : <FiTrash2 size={14} />}
          Delete
        </button>
      </>
    )

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
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
              className="dark-input w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
            className="dark-input"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="text-center text-[#a6a6a6] py-10">Loading requests...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#a6a6a6] py-10">
            {search || filterStatus !== "All" ? "No requests match your filters." : "No requests found."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              {paginatedItems.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r as RequestLike}
                  onClick={() => setDetailId(r.id)}
                  highlighted={highlightId === r.id}
                  formatRequestDate={formatDateTime}
                />
              ))}
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

        {confirmApproveId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
              <h2 className="text-lg font-bold text-white mb-3">Confirm Approval</h2>
              <p className="text-sm text-[#a6a6a6] mb-6">
                This request will be moved to the borrowed items page.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmApproveId(null)}
                  className="btn-ghost px-5 py-2 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  className="px-5 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setConfirmDeleteId(null)}>
            <div
              className="bg-[#111] border border-[#5f5c5c93] rounded-2xl shadow-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-white mb-2">Delete Request</h2>
              <p className="text-sm text-[#a6a6a6] mb-6">
                Are you sure you want to delete this request? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-sm font-bold text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {detailRequest && (
        <RequestInfoModal
          request={detailRequest as RequestLike}
          onClose={() => setDetailId(null)}
          formatDateTime={formatDateTime}
          actions={modalActions(detailRequest as RequestLike)}
        />
      )}
    </div>
  )
}
