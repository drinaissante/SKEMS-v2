import { useState, useEffect } from "react"
import {
  fetchAllRequests,
  updateRequestStatus,
} from "../../services/supabase"

interface Request {
  id: string
  equipment_id: string
  equipment_name: string
  borrower_name: string
  student_number: string
  reason: string
  date_borrowed: string
  date_due: string
  status: string
  created_at: string
  user_id: string
}

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
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await fetchAllRequests()
        setRequests(data)
      } catch {
        setRequests([])
      }
      setLoading(false)
    }
    
    loadRequests()
  }, [])

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateRequestStatus(id, status)
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r)),
      )
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-4">
          Borrow Requests
        </h1>

        {loading ? (
          <p className="text-center text-[#666] py-10">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-center text-[#666] py-10">No requests found.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-[#d9d9d9]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#222] text-white text-left">
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Equipment</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Borrower</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 hidden sm:table-cell">Student #</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 hidden md:table-cell">Reason</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Borrowed</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Due</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Status</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t border-[#d9d9d9] hover:bg-[#f5f5f5]">
                    <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-[#222]">
                      {r.equipment_name}
                      <span className="text-[#a6a6a6] text-xs ml-1">{r.equipment_id}</span>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666]">{r.borrower_name}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666] hidden sm:table-cell">
                      {r.student_number}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666] hidden md:table-cell max-w-48 truncate">
                      {r.reason}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666] whitespace-nowrap text-xs">
                      {formatDateTime(r.date_borrowed)}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-[#666] whitespace-nowrap text-xs">
                      {formatDateTime(r.date_due)}
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
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatus(r.id, "Denied")}
                            className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                      {r.status === "Approved" && (
                        <button
                          onClick={() => handleStatus(r.id, "Returned")}
                          className="px-2 py-1 text-xs bg-[#222] hover:bg-[#666] text-white rounded transition-colors cursor-pointer"
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
        )}
      </div>
    </div>
  )
}
