import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchAuditLogs, type AuditRow } from "../../../services/supabase"
import { usePageTitle } from "../../../hooks/usePageTitle"
import { formatManila } from "../../../utils/datetime"
import { FiSearch } from "react-icons/fi"
import PaginationNav from "../../../components/PaginationNav"

const DESKTOP_ITEMS = 12

const ACTION_LABELS: Record<string, string> = {
  request_submitted: "Request Submitted",
  request_canceled: "Request Canceled",
  request_approved: "Request Approved",
  request_denied: "Request Denied",
  request_deleted: "Request Deleted",
  request_status_changed: "Status Changed",
  owner_approved: "Owner Approved",
  owner_rejected: "Owner Rejected",
  return_proof_submitted: "Proof Submitted",
  return_approved: "Return Approved",
  return_proof_rejected: "Proof Rejected",
  return_recorded: "Equipment Returned",
  equipment_added: "Equipment Added",
  equipment_updated: "Equipment Updated",
  equipment_deleted: "Equipment Deleted",
  event_folder_created: "Event Folder Created",
  event_folder_updated: "Event Folder Updated",
  event_folder_deleted: "Event Folder Deleted",
  event_folder_closed: "Event Closed",
  event_item_assigned: "Equipment Assigned",
  event_item_removed: "Assignment Removed",
  event_item_returned: "Event Item Returned",
  account_approved: "Account Approved",
  account_rejected: "Account Rejected",
}

const roleChip: Record<string, string> = {
  officer: "bg-[#c89116] text-white",
  owner: "bg-purple-500/20 text-purple-300",
  member: "bg-white/10 text-[#a6a6a6]",
  system: "bg-gray-600 text-white",
}

export default function AuditLogPage() {
  usePageTitle("Audit Log")

  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("All")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: fetchAuditLogs,
    staleTime: 30 * 1000,
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter((l: AuditRow) => {
      if (actionFilter !== "All" && l.action !== actionFilter) return false
      const dayKey = l.created_at.slice(0, 10)
      if (dateFrom && dayKey < dateFrom) return false
      if (dateTo && dayKey > dateTo) return false
      return (
        !q ||
        l.actor_name.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.target_summary.toLowerCase().includes(q)
      )
    })
  }, [logs, search, actionFilter, dateFrom, dateTo])

  const actions = useMemo(
    () => ["All", ...Object.keys(ACTION_LABELS)],
    [],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / DESKTOP_ITEMS))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedItems = filtered.slice((safePage - 1) * DESKTOP_ITEMS, safePage * DESKTOP_ITEMS)

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          Audit Log
        </h1>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-40">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
            <input
              type="text"
              placeholder="Search by actor, action, or target..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="dark-input w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1) }}
            className="dark-input"
          >
            {actions.map((a) => (
              <option key={a} value={a}>{a === "All" ? "All Actions" : ACTION_LABELS[a]}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
            className="dark-input w-auto text-sm"
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
            className="dark-input w-auto text-sm"
            title="To date"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-[#a6a6a6] py-10">Loading audit log...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#a6a6a6] py-10">No log entries match your filters.</p>
        ) : (
          <>
            <div className="dark-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 text-white text-left">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Time</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedItems.map((l) => (
                    <tr key={l.id} className="text-white align-top">
                      <td className="px-4 py-3 text-xs whitespace-nowrap text-[#a6a6a6]">
                        {formatManila(l.created_at, {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs whitespace-nowrap">{l.actor_name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${roleChip[l.actor_role] ?? "bg-white/10 text-[#a6a6a6]"}`}>
                            {l.actor_role}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{ACTION_LABELS[l.action] ?? l.action}</td>
                      <td className="px-4 py-3 text-xs">{l.target_summary}</td>
                      <td className="px-4 py-3 text-xs text-[#a6a6a6] hidden md:table-cell">{l.details ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationNav
              page={safePage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
