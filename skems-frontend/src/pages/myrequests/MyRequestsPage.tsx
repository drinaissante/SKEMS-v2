import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { fetchMyRequests } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"

const statusColors: Record<string, string> = {
  Pending: "bg-[#caa453] text-white",
  Approved: "bg-green-600 text-white",
  Denied: "bg-red-600 text-white",
  Returned: "bg-[#a6a6a6] text-white",
}

function formatDateTime(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, "0")
  const h = d.getHours()
  const ampm = h >= 12 ? "PM" : "AM"
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}, ${h % 12 || 12}:${pad(d.getMinutes())} ${ampm}`
}

export default function MyRequestsPage() {
  usePageTitle("My Requests")
  const { user } = useAuth()

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: () => fetchMyRequests(user!.id),
    enabled: !!user,
  })

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-4">
          My Requests
        </h1>

        {isLoading ? (
          <p className="text-center text-[#666] py-10">Loading...</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[#666] mb-4">You haven't made any requests yet.</p>
            <Link
              to="/request"
              className="inline-block px-6 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors text-sm"
            >
              Borrow Equipment
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl shadow border border-[#d9d9d9] p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[#222] text-sm sm:text-base truncate">
                      {r.equipment_name} <span className="text-[#a6a6a6] font-normal">×{r.quantity}</span>
                    </p>
                    <p className="text-xs text-[#a6a6a6] truncate">{r.reason}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold ${
                      statusColors[r.status] ?? "bg-[#d9d9d9] text-[#666]"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-[#caa453]/20 text-[#caa453] shrink-0">
                      Borrowed
                    </span>
                    <span className="text-[#666]">{formatDateTime(r.date_borrowed)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 shrink-0">
                      Due
                    </span>
                    <span className="text-[#666]">{formatDateTime(r.date_due)}</span>
                  </div>
                  {r.status === "Returned" && r.returned_on && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
                        Returned
                      </span>
                      <span className="text-[#666]">{formatDateTime(r.returned_on)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
