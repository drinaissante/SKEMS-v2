import { useQuery } from "@tanstack/react-query"
import { fetchAuditLogs } from "../../../services/supabase"
import { usePageTitle } from "../../../hooks/usePageTitle"
import AuditLogView from "../../../components/AuditLogView"

export default function AuditLogPage() {
  usePageTitle("Audit Log")

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: fetchAuditLogs,
    staleTime: 30 * 1000,
  })

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          Audit Log
        </h1>

        <AuditLogView logs={logs} isLoading={isLoading} />
      </div>
    </div>
  )
}
