import { useMemo } from "react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchMyRequests } from "../../services/supabase"
import { fetchEquipments } from "../../services/api"
import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { formatWallClock, formatManila } from "../../utils/datetime"
import skIconFallback from "/sk_icon.jpg"

const statusColors: Record<string, string> = {
  Pending: "bg-[#caa453] text-white",
  Approved: "bg-green-600 text-white",
  Denied: "bg-red-600 text-white",
  Returned: "bg-white/10 text-[#a6a6a6]",
}

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

function formatDateTimeManila(iso: string) {
  return formatManila(iso, dtOpts)
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 w-28 sm:w-32 font-bold text-[#a6a6a6]">{label}</span>
      <span className="text-white text-right min-w-0 wrap-break-word flex-1">{children}</span>
    </div>
  )
}

export default function MyRequestsPage() {
  usePageTitle("My Requests")
  const { user } = useAuth()

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: () => fetchMyRequests(user!.id),
    enabled: !!user,
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

  if (!user) return null

  return (
    <div className="min-h-screen bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          My Requests
        </h1>

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
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const image = equipmentMap.get(r.equipment_id)?.image || skIconFallback
              return (
                <div key={r.id} className="dark-card p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[10px] uppercase tracking-wide text-[#a6a6a6] font-bold">
                      Requested on {formatDateTimeManila(r.created_at)}
                    </span>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded text-xs font-bold ${
                        statusColors[r.status] ?? "bg-white/10 text-[#a6a6a6]"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4 mb-3">
                    <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white/10 border border-white/10">
                      <img
                        src={image}
                        alt={r.equipment_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { (e.target as HTMLImageElement).src = skIconFallback }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-base sm:text-lg leading-snug">
                        {r.equipment_name} <span className="text-[#a6a6a6] font-normal text-sm">×{r.quantity}</span>
                      </p>
                      <p className="text-xs text-[#a6a6a6] mt-0.5">{r.reason}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-3 border-t border-white/10">
                    <InfoRow label="Borrower">{r.borrower_name}</InfoRow>
                    <InfoRow label="Student No.">{r.student_number || "—"}</InfoRow>
                    <InfoRow label="Position">{toTitleCase(r.position_department || "") || "—"}</InfoRow>
                    <InfoRow label="Owner">{r.owner || "—"}</InfoRow>
                    <InfoRow label="Pickup Location">{r.pickup_location || "—"}</InfoRow>
                    <InfoRow label="Return Location">{r.return_location || "—"}</InfoRow>
                    <InfoRow label="Borrowed">{formatDateTime(r.date_borrowed)}</InfoRow>
                    <InfoRow label="Due">{formatDateTime(r.date_due)}</InfoRow>
                    {r.status === "Returned" && r.returned_on && (
                      <InfoRow label="Returned On">{formatDateTimeManila(r.returned_on)}</InfoRow>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
