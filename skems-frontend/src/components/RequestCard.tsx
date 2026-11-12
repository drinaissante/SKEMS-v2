/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react"
import { toManilaIso } from "../utils/datetime"

export const requestStatusColors: Record<string, string> = {
  Pending: "bg-[#caa453] text-white",
  Approved: "bg-green-600 text-white",
  Denied: "bg-red-600 text-white",
  Returned: "bg-white/10 text-[#a6a6a6]",
  "Returned Late": "bg-red-600 text-white",
  Canceled: "bg-white/10 text-[#a6a6a6]",
}

/** Returned after the due date → "Returned Late" display status. */
export function isLateRequest(r: {
  status: string
  returned_on: string | null
  date_due: string
}): boolean {
  if (r.status !== "Returned" || !r.returned_on || !r.date_due) return false
  return new Date(r.returned_on) > new Date(toManilaIso(r.date_due))
}

export function displayStatus(r: {
  status: string
  returned_on: string | null
  date_due: string
}): string {
  return isLateRequest(r) ? "Returned Late" : r.status
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
  owner_status?: string | null
  owner_reason?: string | null
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
      className={`dark-card rounded-xl border border-white/10 p-4 text-left cursor-pointer hover:border-[#c89116]/40 transition-colors w-full h-full flex flex-col ${
        highlighted ? "request-row-highlight" : ""
      }`}
    >
      <div className="flex items-start gap-3 mb-2">
        {image && (
          <img
            src={image}
            alt={r.equipment_name}
            className="w-24 h-16 sm:w-28 sm:h-20 rounded-lg object-cover shrink-0 bg-white/10 border border-white/10"
            loading="lazy"
            decoding="async"
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-[#c89116] font-bold">{r.equipment_id}</p>
          <h3 className="text-base font-bold text-white leading-snug truncate">{r.equipment_name}</h3>
          <p className="text-xs text-[#a6a6a6] mt-0.5 truncate">{r.owner || "No owner"}</p>
        </div>

        <StatusChip status={displayStatus(r)} />
      </div>

      <p className="text-[10px] uppercase tracking-wide text-[#a6a6a6] font-bold">
        Requested on {formatRequestDate(r.created_at)}
      </p>
    </button>
  )
}
