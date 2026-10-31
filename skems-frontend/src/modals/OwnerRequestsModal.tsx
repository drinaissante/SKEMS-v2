import { useState } from "react"
import { formatWallClock } from "../utils/datetime"

export interface OwnerRequestRow {
  id: string
  equipment_name: string
  borrower_name: string
  student_number: string
  reason: string
  date_borrowed: string
  date_due: string
  status: string
  created_at: string
  quantity: number
  owner_status: string | null
  owner_reason: string | null
  position_department: string
  return_location: string
  pickup_location: string
}

interface OwnerRequestsModalProps {
  equipmentName: string
  requests: OwnerRequestRow[]
  decidingId: string | null
  onDecide: (requestId: string, decision: "approved" | "rejected", reason: string) => void
  onClose: () => void
}

const dtOpts: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}

export default function OwnerRequestsModal({
  equipmentName,
  requests,
  decidingId,
  onDecide,
  onClose,
}: OwnerRequestsModalProps) {
  const [reasons, setReasons] = useState<Record<string, string>>({})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="text-lg font-bold text-white">Requests for {equipmentName}</h3>
            <p className="text-xs text-[#a6a6a6] mt-0.5">
              You decide before an SK officer gives final approval.
            </p>
          </div>
          <button onClick={onClose} className="text-[#a6a6a6] hover:text-white cursor-pointer p-1 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {requests.length === 0 ? (
          <p className="text-sm text-[#a6a6a6] text-center py-10">
            No pending or approved requests for this equipment.
          </p>
        ) : (
          <div className="space-y-3 mt-4">
            {requests.map((r) => {
              const awaitingYou = r.owner_status === "pending" && r.status === "Pending"
              return (
                <div key={r.id} className="border border-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">{r.borrower_name}</p>
                      <p className="text-xs text-[#a6a6a6]">
                        {r.student_number || "No student #"} · {r.position_department || "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.status === "Pending" ? "bg-[#caa453] text-white" : "bg-green-600 text-white"
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-[10px] text-[#a6a6a6]">×{r.quantity}</span>
                    </div>
                  </div>

                  <div className="text-xs text-[#a6a6a6] space-y-0.5">
                    <p><span className="font-medium text-[#a6a6a6]">Reason:</span> <span className="text-white">{r.reason || "None"}</span></p>
                    <p><span className="font-medium">Borrow:</span> {formatWallClock(r.date_borrowed, dtOpts)}</p>
                    <p><span className="font-medium">Due:</span> {formatWallClock(r.date_due, dtOpts)}</p>
                    <p><span className="font-medium">Pickup / Return:</span> {r.pickup_location || "—"} / {r.return_location || "—"}</p>
                    <p><span className="font-medium">Requested on:</span> {formatWallClock(r.created_at, dtOpts)}</p>
                  </div>

                  {r.owner_status === "approved" && (
                    <p className="text-xs text-green-300 font-medium">You approved this request.</p>
                  )}
                  {r.owner_status === "rejected" && (
                    <p className="text-xs text-red-300 font-medium">
                      You rejected this request.{r.owner_reason ? ` Reason: ${r.owner_reason}` : ""}
                    </p>
                  )}

                  {awaitingYou && (
                    <div className="pt-2 border-t border-white/10">
                      <input
                        type="text"
                        value={reasons[r.id] ?? ""}
                        onChange={(e) => setReasons(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Reason (optional)"
                        maxLength={200}
                        className="dark-input w-full text-xs mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={decidingId === r.id}
                          onClick={() => onDecide(r.id, "approved", reasons[r.id] ?? "")}
                          className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {decidingId === r.id ? "Saving..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          disabled={decidingId === r.id}
                          onClick={() => onDecide(r.id, "rejected", reasons[r.id] ?? "")}
                          className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {decidingId === r.id ? "Saving..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
