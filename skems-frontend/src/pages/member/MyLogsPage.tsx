import { useQuery } from "@tanstack/react-query"
import { fetchMyAuditLogs } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import AuditLogView from "../../components/AuditLogView"

export default function MyLogsPage() {
  usePageTitle("Logs")
  const { user } = useAuth()

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["my-audit-logs", user?.id],
    queryFn: () => fetchMyAuditLogs(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000,
  })

  return (
    <div className="min-h-screen bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          Logs
        </h1>

        <AuditLogView
          logs={logs}
          isLoading={isLoading}
          emptyText="No activity yet."
        />
      </div>
    </div>
  )
}
