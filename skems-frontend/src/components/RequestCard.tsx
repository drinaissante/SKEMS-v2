/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react"

export const requestStatusColors: Record<string, string> = {
  Pending: "bg-[#caa453] text-white",
  Approved: "bg-green-600 text-white",
  Denied: "bg-red-600 text-white",
  Returned: "bg-white/10 text-[#a6a6a6]",
}

export function StatusChip({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
        requestStatusColors[status] ?? "bg-white/10 text-[#a6a6a6]"
      }`}
    >
      {status}
    </span>
  )
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 w-28 sm:w-32 font-bold text-[#a6a6a6]">{label}</span>
      <span className="text-white text-right min-w-0 wrap-break-word flex-1">{children}</span>
    </div>
  )
}

export interface RequestLike {
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
  quantity: number
  returned_on: string | null
  position_department: string
  pickup_location: string
  return_location: string
  owner: string
}

interface RequestCardProps {
  request: RequestLike
  onClick: () => void
  image?: string
  highlighted?: boolean
  formatRequestDate: (iso: string) => string
}

export default function RequestCard({
  request: r,
  onClick,
  image,
  highlighted,
  formatRequestDate,
}: RequestCardProps) {
  return (
    <button
      onClick={onClick}
      id={`request-${r.id}`}
      className={`dark-card rounded-xl border border-white/10 p-4 text-left cursor-pointer hover:border-[#c89116]/40 transition-colors w-full ${
        highlighted ? "request-row-highlight" : ""
      }`}
    >
      {image && (
        <div className="w-full aspect-video mb-3 rounded-lg overflow-hidden bg-white/10 border border-white/10">
          <img
            src={image}
            alt={r.equipment_name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-mono text-xs text-[#c89116] font-bold">{r.equipment_id}</p>
          <h3 className="text-base font-bold text-white leading-snug truncate">{r.equipment_name}</h3>
          <p className="text-xs text-[#a6a6a6] mt-0.5 truncate">{r.owner || "No owner"}</p>
        </div>
        <StatusChip status={r.status} />
      </div>

      <p className="text-[10px] uppercase tracking-wide text-[#a6a6a6] font-bold">
        Requested on {formatRequestDate(r.created_at)}
      </p>
    </button>
  )
}
