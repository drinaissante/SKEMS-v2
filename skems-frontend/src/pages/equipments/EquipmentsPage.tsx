import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchEquipments,
  addEquipment,
  updateEquipment,
  deleteEquipment,
  exportToSheets,
  type Equipment,
} from "../../services/api"
import { uploadImage } from "../../services/supabase"
import EquipmentFormModal from "./AddEquipmentModal"
import EquipmentCard from "./EquipmentCard"
import EquipmentCardPlaceholder from "./EquipmentCardPlaceholder"
import { useAuth } from "../../context/AuthContext"

const conditions = ["Working", "Needs Repair", "Broken", "Not checked", "Unavailable"]
const MOBILE_ITEMS = 3
const DESKTOP_ITEMS = 8

export default function EquipmentsPage() {
  const { isAdmin, user } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  const [filterCondition, setFilterCondition] = useState("All")

  const [editingEquipment, setEditingEquipment] = useState<Equipment | null | undefined>(undefined)

  const [currentPage, setCurrentPage] = useState(1)

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState("")

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ["equipments"],
    queryFn: fetchEquipments,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (eq: Equipment) => {
      if (editingEquipment) {
        await updateEquipment(eq.id, eq)
      } else {
        await addEquipment(eq)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
    },
  })

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const categories = useMemo(
    () => ["All", ...new Set(equipments.map((e) => e.category))],
    [equipments],
  )

  const filtered = useMemo(() => {
    return equipments.filter((eq) => {
      const matchesSearch =
        eq.name.toLowerCase().includes(search.toLowerCase()) ||
        eq.owner.toLowerCase().includes(search.toLowerCase())

      const matchesCategory = filterCategory === "All" || eq.category === filterCategory

      const matchesCondition = filterCondition === "All" || eq.condition === filterCondition

      return matchesSearch && matchesCategory && matchesCondition
    })
  }, [equipments, search, filterCategory, filterCondition])

  const itemsPerPage = isMobile ? MOBILE_ITEMS : DESKTOP_ITEMS
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setCurrentPage(1) }, [search, filterCategory, filterCondition])

  const statusSummary = {
    total: equipments.length,
    borrowed: equipments.filter((e) => e.borrowerName).length,
    needsRepair: equipments.filter((e) => e.condition === "Needs Repair").length,
    broken: equipments.filter((e) => e.condition === "Broken").length,
    notChecked: equipments.filter((e) => e.condition === "Not checked").length,
    working: equipments.filter((e) => e.condition === "Working").length,
  }

  const handleExport = async () => {
    try {
      setSyncing(true)
      setSyncMessage("")
      const result = await exportToSheets(equipments)
      setSyncing(false)
      if (result.ok) {
        setSyncMessage("Synced!")
        setTimeout(() => setSyncMessage(""), 3000)
      } else {
        setSyncMessage(result.error ?? "Sync failed")
      }
    } catch (err) {
      setSyncing(false)
      setSyncMessage(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    await deleteMutation.mutateAsync(deletingId)
    setShowDeleteConfirm(false)
    setDeletingId("")
  }

  const handleSave = async (eq: Equipment) => {
    await saveMutation.mutateAsync(eq)
    setEditingEquipment(undefined)
  }

  const allPageItems = useMemo(() => {
    const desktop: (Equipment | null)[] = [...paginatedItems]
    while (desktop.length < DESKTOP_ITEMS) desktop.push(null)
    const mobile: (Equipment | null)[] = [...paginatedItems]
    while (mobile.length < MOBILE_ITEMS) mobile.push(null)
    return { desktop, mobile }
  }, [paginatedItems])

  return (
    <div className="flex flex-col h-full md:min-h-0 bg-[#f5f5f5]">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-4">
          Equipment Management
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          {[
            { label: "Total Items", value: statusSummary.total, color: "bg-[#222]" },
            { label: "Working", value: statusSummary.working, color: "bg-green-600" },
            { label: "Needs Repair", value: statusSummary.needsRepair, color: "bg-[#caa453]" },
            { label: "Broken", value: statusSummary.broken ?? 0, color: "bg-red-600" },
            { label: "Not Checked", value: statusSummary.notChecked, color: "bg-[#a6a6a6]" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} text-white rounded-xl p-3 sm:p-4 shadow`}>
              <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
              <p className="text-xs sm:text-sm opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4 items-center relative z-10">
          <input
            type="text"
            placeholder="Search by name or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-35 px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg text-[#222] bg-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg text-[#222] bg-white"
          >
            <option value="All">All Conditions</option>
            {conditions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={syncing}
            className="px-3 py-2 text-sm bg-[#222] hover:bg-[#666] disabled:bg-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {syncing ? "Preparing..." : "Export to Sheet"}
          </button>
          {syncMessage && (
            <span className="text-sm text-[#666] break-all max-w-full">{syncMessage}</span>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-[#666] py-10">Loading equipment...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-[#666] py-10">No equipment found.</p>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allPageItems.desktop.map((eq, i) =>
                  eq ? (
                    <EquipmentCard
                      key={eq.id}
                      eq={eq}
                      onEdit={isAdmin ? (e) => setEditingEquipment(e) : undefined}
                      onDelete={isAdmin ? handleDelete : undefined}
                    />
                  ) : (
                    <EquipmentCardPlaceholder key={`ph-${i}`} />
                  )
                )}
              </div>

              <div className="md:hidden space-y-4">
                {allPageItems.mobile.map((eq, i) =>
                  eq ? (
                    <EquipmentCard
                      key={eq.id}
                      eq={eq}
                      onEdit={isAdmin ? (e) => setEditingEquipment(e) : undefined}
                      onDelete={isAdmin ? handleDelete : undefined}
                    />
                  ) : (
                    <EquipmentCardPlaceholder key={`ph-${i}`} />
                  )
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#d9d9d9] disabled:text-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-[#666] font-medium">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#d9d9d9] disabled:text-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="h-16 md:hidden" />
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
          equipment={editingEquipment ?? undefined}
          onSave={handleSave}
          onClose={() => setEditingEquipment(undefined)}
          conditions={conditions}
          imageUpload={uploadImage}
          defaultOwner={user?.fullName ?? ""}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-base sm:text-lg font-bold text-[#222] mb-2 text-center">Remove Equipment</p>
            <p className="text-sm text-[#666] mb-6 text-center">
              Are you sure you want to remove this equipment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletingId("") }}
                className="flex-1 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
