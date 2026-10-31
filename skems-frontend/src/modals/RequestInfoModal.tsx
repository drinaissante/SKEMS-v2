import type { ReactNode } from "react"
import { InfoRow, type RequestLike } from "../components/RequestCard"

interface RequestInfoModalProps {
  request: RequestLike
  onClose: () => void
  actions?: ReactNode
  formatDateTime: (iso: string) => string
}

export default function RequestInfoModal({ request: r, onClose, actions, formatDateTime }: RequestInfoModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-[#c89116] font-bold">{r.equipment_id}</p>
            <h3 className="text-lg font-bold text-white leading-snug">
              {r.equipment_name} <span className="text-[#a6a6a6] font-normal text-sm">×{r.quantity}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#a6a6a6] hover:text-white cursor-pointer p-1 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2 pt-3 border-t border-white/10">
          <InfoRow label="Borrower">{r.borrower_name}</InfoRow>
          <InfoRow label="Student No.">{r.student_number || "—"}</InfoRow>
          <InfoRow label="Position">{r.position_department || "—"}</InfoRow>
          <InfoRow label="Owner">{r.owner || "—"}</InfoRow>
          {r.owner_status === "approved" && (
            <InfoRow label="Owner Decision">
              <span className="text-green-300">Approved by owner</span>
            </InfoRow>
          )}
          {r.owner_status === "rejected" && (
            <InfoRow label="Owner Decision">
              <span className="text-red-300">
                Rejected by owner{r.owner_reason ? `, reason: ${r.owner_reason}` : ""}
              </span>
            </InfoRow>
          )}
          <InfoRow label="Reason">{r.reason || "—"}</InfoRow>
          <InfoRow label="Pickup Location">{r.pickup_location || "—"}</InfoRow>
          <InfoRow label="Return Location">{r.return_location || "—"}</InfoRow>
          <InfoRow label="Requested On">{formatDateTime(r.created_at)}</InfoRow>
          <InfoRow label="Borrowed">{formatDateTime(r.date_borrowed)}</InfoRow>
          <InfoRow label="Due">{formatDateTime(r.date_due)}</InfoRow>
          {r.returned_on && (
            <InfoRow label="Returned On">
              <span className="text-green-300">{formatDateTime(r.returned_on)}</span>
            </InfoRow>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-2 pt-4 mt-2 border-t border-white/10">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
