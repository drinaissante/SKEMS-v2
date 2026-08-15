import { useMemo, useCallback, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchEquipments,
  addEquipment,
  updateEquipment,
  exportToSheets,
  type Equipment,
} from "../../services/api"
import { uploadImage, uploadQRCode, fetchBorrowedItems } from "../../services/supabase"
import { generateQRDoc } from "../../utils/qrExport"

import EquipmentFormModal from "../equipments/AddEquipmentModal"

import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useToast } from "../../hooks/useToast"
import { formatWallClock } from "../../utils/datetime"

const conditions = ["Working", "Borrowed", "Needs Repair", "Broken", "Not checked", "Unavailable"]

const sheetsUrl = import.meta.env.VITE_SHEETS_URL as string | undefined

function formatShortDate(iso: string) {
  return formatWallClock(iso, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export default function DashboardHome() {
  usePageTitle("Dashboard")

  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [editingEquipment, setEditingEquipment] = useState<Equipment | null | undefined>(undefined)
  const [syncing, setSyncing] = useState(false)
  const [exportingQR, setExportingQR] = useState(false)

  const { data: equipments = [] } = useQuery({
    queryKey: ["equipments"],
    queryFn: fetchEquipments,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["borrowed-items"],
    queryFn: fetchBorrowedItems,
  })

  const handleSync = useCallback(async () => {
    showToast("Updating...", "info")
    const fresh = await queryClient.fetchQuery({ queryKey: ["equipments"], queryFn: fetchEquipments })
    const result = await exportToSheets(fresh)
    if (result.ok) {
      showToast("Successfully synced!", "success")
    } else {
      showToast("Sync failed: " + (result.error ?? "Unknown error"), "error")
    }
  }, [showToast, queryClient])

  const saveMutation = useMutation({
    mutationFn: async ({ equipment, imageFile }: { equipment: Omit<Equipment, "id">; imageFile?: File | null }) => {
      const created = await addEquipment({ ...equipment, image: "" })
      if (imageFile) {
        const url = await uploadImage(imageFile)
        await updateEquipment(created.id, { image: url })
      }
      await uploadQRCode(created.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
      showToast("Equipment saved!", "info", { label: "Sync now?", onClick: handleSync })
    },
  })

  const handleSave = async (eq: Omit<Equipment, "id">, imageFile?: File | null) => {
    await saveMutation.mutateAsync({ equipment: eq, imageFile })
    setEditingEquipment(undefined)
  }

  const handleExport = async () => {
    try {
      setSyncing(true)
      const result = await exportToSheets(equipments)
      setSyncing(false)
      if (result.ok) {
        showToast("Successfully synced!", "success")
      } else {
        showToast("Sync failed: " + (result.error ?? "Unknown error"), "error")
      }
    } catch (err) {
      setSyncing(false)
      showToast("Sync failed: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    }
  }

  const handleExportQR = async () => {
    try {
      setExportingQR(true)
      await generateQRDoc(equipments)
      showToast("QR codes exported!", "success")
    } catch (err) {
      showToast("Export failed: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    } finally {
      setExportingQR(false)
    }
  }

  const statusSummary = {
    total: equipments.length,
    borrowed: equipments.filter((e) => e.borrowerName).length,
    unavailable: equipments.filter((e) => e.condition === "Unavailable").length,
  }

  const recentlyBorrowed = records.slice(0, 5)

  const mostBorrowed = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of records) {
      const key = r.equipment_requested || r.equipment_id
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [records])

  const topBorrowers = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of records) {
      counts.set(r.full_name, (counts.get(r.full_name) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [records])

  const maxBorrowedCount = mostBorrowed[0]?.count ?? 1
  const maxBorrowerCount = topBorrowers[0]?.count ?? 1

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
          Welcome, {user?.fullName ?? "Admin"}!
        </h1>
        <p className="text-sm sm:text-base text-[#a6a6a6] mb-4">What do you want to do today?</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total Items", value: statusSummary.total, color: "bg-[#222]" },
            { label: "Borrowed Items", value: statusSummary.borrowed, color: "bg-purple-600" },
            { label: "Unavailable Items", value: statusSummary.unavailable, color: "bg-gray-600" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} text-white rounded-xl p-3 sm:p-4 shadow`}>
              <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
              <p className="text-xs sm:text-sm opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-6">
          {sheetsUrl ? (
            <a
              href={sheetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-3 py-2 text-sm bg-green-500/15 hover:bg-green-500/25 text-green-300 font-bold rounded-lg transition-colors cursor-pointer border border-green-500/30 inline-flex items-center justify-center"
            >
              Open Sheets
            </a>
          ) : (
            <button
              disabled
              className="w-full sm:w-auto px-3 py-2 text-sm bg-green-500/15 text-green-300 font-bold rounded-lg border border-green-500/30 opacity-40 cursor-not-allowed"
            >
              Open Sheets
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={syncing}
            className="w-full sm:w-auto px-3 py-2 text-sm bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors cursor-pointer border border-[#5f5c5c93]"
          >
            {syncing ? "Preparing..." : "Export to Sheet"}
          </button>
          <button
            onClick={handleExportQR}
            disabled={exportingQR}
            className="w-full sm:w-auto px-3 py-2 text-sm bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors cursor-pointer border border-[#5f5c5c93]"
          >
            {exportingQR ? "Generating..." : "Export QR Codes"}
          </button>
          <button
            onClick={() => setEditingEquipment(null)}
            className="w-full sm:w-auto px-3 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Add Equipment
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <section className="dark-card p-4 sm:p-5 min-h-0">
            <h2 className="text-sm sm:text-base font-bold text-white mb-3">Recently Borrowed Equipment</h2>
            {recordsLoading ? (
              <p className="text-center text-[#a6a6a6] py-8 text-sm">Loading...</p>
            ) : recentlyBorrowed.length === 0 ? (
              <p className="text-center text-[#a6a6a6] py-8 text-sm">No borrow records yet.</p>
            ) : (
              <div className="space-y-2">
                {recentlyBorrowed.map((r) => (
                  <div key={r.equipment_id + r.created_at} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.equipment_requested}</p>
                      <p className="text-xs text-[#a6a6a6] truncate">
                        {r.full_name} · {formatShortDate(r.date_time_borrowing)}
                      </p>
                    </div>
                    {r.returned_on ? (
                      <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-300">
                        Returned
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="space-y-4">
            <section className="dark-card p-4 sm:p-5">
              <h2 className="text-sm sm:text-base font-bold text-white mb-3">Most Borrowed Item</h2>
              {recordsLoading ? (
                <p className="text-center text-[#a6a6a6] py-8 text-sm">Loading...</p>
              ) : mostBorrowed.length === 0 ? (
                <p className="text-center text-[#a6a6a6] py-8 text-sm">No borrow records yet.</p>
              ) : (
                <div className="space-y-3">
                  {mostBorrowed.map((item, i) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between gap-3 text-sm mb-1">
                        <span className="text-white truncate font-medium">
                          {i + 1}. {item.name}
                        </span>
                        <span className="text-[#a6a6a6] shrink-0">{item.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-[#c89116] to-[#fdb125]"
                          style={{ width: `${(item.count / maxBorrowedCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="dark-card p-4 sm:p-5">
              <h2 className="text-sm sm:text-base font-bold text-white mb-3">Who Borrows the Most</h2>
              {recordsLoading ? (
                <p className="text-center text-[#a6a6a6] py-8 text-sm">Loading...</p>
              ) : topBorrowers.length === 0 ? (
                <p className="text-center text-[#a6a6a6] py-8 text-sm">No borrow records yet.</p>
              ) : (
                <div className="space-y-3">
                  {topBorrowers.map((person, i) => (
                    <div key={person.name}>
                      <div className="flex items-center justify-between gap-3 text-sm mb-1">
                        <span className="text-white truncate font-medium">
                          {i + 1}. {person.name}
                        </span>
                        <span className="text-[#a6a6a6] shrink-0">{person.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-[#c89116] to-[#fdb125]"
                          style={{ width: `${(person.count / maxBorrowerCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <button
        onClick={() => setEditingEquipment(null)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-[#c89116] hover:bg-[#caa453] text-white rounded-full shadow-lg flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Add Equipment"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {editingEquipment !== undefined && (
        <EquipmentFormModal
          equipment={undefined}
          onSave={handleSave}
          onClose={() => setEditingEquipment(undefined)}
          conditions={conditions}
          defaultOwner={user?.fullName ?? ""}
        />
      )}
    </div>
  )
}
