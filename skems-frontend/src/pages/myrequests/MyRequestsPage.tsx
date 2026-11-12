import { useMemo, useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchMyRequests, fetchProfile } from "../../services/supabase"
import { fetchEquipments } from "../../services/api"
import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { formatWallClock, formatManila, toManilaIso, nowMs } from "../../utils/datetime"
import { useToast } from "../../hooks/useToast"
import RequestCard, { type RequestLike } from "../../components/RequestCard"
import RequestInfoModal from "../../modals/RequestInfoModal"
import { updateRequestStatus } from "../../services/supabase"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FiXCircle } from "react-icons/fi"
import { FiSearch } from "react-icons/fi"
import PaginationNav from "../../components/PaginationNav"
import skIconFallback from "/sk_icon.jpg"

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

const STATUS_ORDER: Record<string, number> = {
  Pending: 0,
  Approved: 1,
  Returned: 2,
  Denied: 3,
}

type SortOption = "newest" | "oldest" | "name" | "status"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Equipment A-Z" },
  { value: "status", label: "Status" },
]

export default function MyRequestsPage() {
  usePageTitle("My Requests")
  const { user, isSuperAdmin } = useAuth()
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [detailId, setDetailId] = useState<string | null>(null)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const isOwn = user?.id === uuid
  const canAccess = isOwn || isSuperAdmin

  const { data: profile } = useQuery({
    queryKey: ["profile-by-id", uuid],
    queryFn: () => fetchProfile(uuid!),
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!canAccess) {
      navigate("/restricted", { replace: true })
    }
  }, [canAccess, navigate])

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: () => fetchMyRequests(user!.id),
    enabled: !!user && canAccess,
  })

  const { data: equipments = [] } = useQuery({
    queryKey: ["equipments"],
    queryFn: fetchEquipments,
  })

  const equipmentMap = useMemo(() => {
    const map = new Map<string, { image: string }>()
    for (const eq of equipments) map.set(eq.id, { image: eq.image })
    return map
  }, [equipments])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const base = requests.filter((r) =>
      !q ||
      r.equipment_name.toLowerCase().includes(q) ||
      r.equipment_id.toLowerCase().includes(q) ||
      r.owner.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    )
    const sorted = [...base]
    switch (sortBy) {
      case "oldest":
        sorted.sort((a, b) => a.created_at.localeCompare(b.created_at))
        break
      case "name":
        sorted.sort((a, b) => a.equipment_name.localeCompare(b.equipment_name))
        break
      case "status":
        sorted.sort((a, b) =>
          (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
          b.created_at.localeCompare(a.created_at),
        )
        break
      default:
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
    }
    return sorted
  }, [requests, search, sortBy])

  const itemsPerPage = isMobile ? MOBILE_ITEMS : DESKTOP_ITEMS
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, safePage, itemsPerPage])

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => updateRequestStatus(requestId, "Canceled"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-requests"] })
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] })
      setDetailId(null)
      showToast("Request canceled.", "success")
    },
    onError: (err) => {
      showToast("Failed to cancel: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  if (!user) return null

  const detailRequest = requests.find(r => r.id === detailId) ?? null

  const canCancelRequest = (r: RequestLike): boolean => {
    if (r.status === "Pending") return true
    if (r.status === "Approved" && r.date_borrowed) {
      return nowMs() < new Date(toManilaIso(r.date_borrowed)).getTime()
    }
    return false
  }

  return (
    <div className="min-h-screen bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          {isOwn ? "My Requests" : `${profile?.full_name ?? "User"}'s Requests`}
        </h1>

        {requests.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-40">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                className="dark-input w-full pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as SortOption); setCurrentPage(1) }}
              className="dark-input w-auto"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {isLoading ? (
          <p className="text-center text-[#a6a6a6] py-10">Loading...</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[#a6a6a6] mb-4">You haven't made any requests yet.</p>
            <Link
              to="/request"
              className="btn-gold inline-block px-6 py-2 text-sm"
            >
              Borrow Equipment
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#a6a6a6] py-10">No requests match your filters.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {paginatedItems.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r as RequestLike}
                  onClick={() => setDetailId(r.id)}
                  image={equipmentMap.get(r.equipment_id)?.image || skIconFallback}
                  formatRequestDate={(iso) => formatManila(iso, dtOpts)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <PaginationNav
                page={safePage}
                totalPages={totalPages}
                onChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {detailRequest && (
        <RequestInfoModal
          request={detailRequest as RequestLike}
          onClose={() => setDetailId(null)}
          formatDateTime={formatDateTime}
          actions={
            canCancelRequest(detailRequest as RequestLike) ? (
              <button
                onClick={() => cancelMutation.mutate(detailRequest.id)}
                disabled={cancelMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <FiXCircle size={14} />
                {cancelMutation.isPending ? "Canceling..." : "Cancel Request"}
              </button>
            ) : detailRequest.status === "Approved" ? (
              <span className="text-xs text-[#a6a6a6] self-center">
                Borrow date has passed, this request can no longer be canceled.
              </span>
            ) : undefined
          }
        />
      )}
    </div>
  )
}
