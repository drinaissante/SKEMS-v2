import { useState, useMemo, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchEquipments,
  addEquipment,
  updateEquipment,
  exportToSheets,
  type Equipment,
} from "../../services/api"
import { uploadImage, uploadQRCode } from "../../services/supabase"
import { generateQRDoc } from "../../utils/qrExport"

import EquipmentFormModal from "./AddEquipmentModal"
import EquipmentCard from "./EquipmentCard"
import EquipmentCardPlaceholder from "./EquipmentCardPlaceholder"

import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useToast } from "../../hooks/useToast"

import ShowDeleteModal from "../../modals/ShowDeleteModal"

const conditions = ["Working", "Borrowed", "Needs Repair", "Broken", "Not checked", "Unavailable"]
const MOBILE_ITEMS = 3
const DESKTOP_ITEMS = 8

export default function EquipmentsPage() {
  usePageTitle("Equipment")

  const { isAdmin, user } = useAuth()

  const queryClient = useQueryClient()

  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({})

  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  const [filterCondition, setFilterCondition] = useState("All")

  const [editingEquipment, setEditingEquipment] = useState<Equipment | null | undefined>(undefined)

  const [currentPage, setCurrentPage] = useState(1)

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const { showToast } = useToast()

  const [syncing, setSyncing] = useState(false)
  const [exportingQR, setExportingQR] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [deletingId, setDeletingId] = useState("")

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ["equipments"],
    queryFn: fetchEquipments,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
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
    mutationFn: async (params: { equipment: Omit<Equipment, "id">; isEdit: boolean; equipmentId?: string; imageFile?: File | null }) => {
      let id = params.equipmentId
      if (!params.isEdit) {
        const created = await addEquipment({ ...params.equipment, image: "" })
        id = created.id
      } else if (id) {
        await updateEquipment(id, params.equipment)
      }

      if (params.imageFile) {
        setUploadingImages((prev) => ({ ...prev, [id!]: true }))
        const url = await uploadImage(params.imageFile)
        await updateEquipment(id!, { image: url })
        setUploadingImages((prev) => ({ ...prev, [id!]: false }))
      }

      if (id) {
        await uploadQRCode(id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
      showToast("Equipment saved!", "info", { label: "Sync now?", onClick: handleSync })
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
    unavailable: equipments.filter((e) => e.condition === "Unavailable").length,
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

  const handleDelete = (id: string) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const handleSave = async (eq: Omit<Equipment, "id">, imageFile?: File | null) => {
    await saveMutation.mutateAsync({ equipment: eq, isEdit: !!editingEquipment, equipmentId: editingEquipment?.id, imageFile })
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
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          Equipment Management
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-4">
          {[
            { label: "Total Items", value: statusSummary.total, color: "bg-[#222]" },
            { label: "Working", value: statusSummary.working, color: "bg-green-600" },
            { label: "Needs Repair", value: statusSummary.needsRepair, color: "bg-[#caa453]" },
            { label: "Broken", value: statusSummary.broken ?? 0, color: "bg-red-600" },
            { label: "Not Checked", value: statusSummary.notChecked, color: "bg-[#a6a6a6]" },
            { label: "Unavailable", value: statusSummary.unavailable, color: "bg-gray-600" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} text-white rounded-xl p-3 sm:p-4 shadow`}>
              <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
              <p className="text-xs sm:text-sm opacity-80">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-2 mb-4 relative z-10">
          <input
            type="text"
            placeholder="Search by name or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dark-input w-full md:flex-1 min-w-35"
          />
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="dark-input flex-1 md:flex-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="dark-input flex-1 md:flex-none"
            >
              <option value="All">All Conditions</option>
              {conditions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              disabled={syncing}
              className="flex-1 md:flex-none px-3 py-2 text-sm bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors cursor-pointer border border-[#5f5c5c93]"
            >
              {syncing ? "Preparing..." : "Export to Sheet"}
            </button>
            <button
              onClick={handleExportQR}
              disabled={exportingQR}
              className="flex-1 md:flex-none px-3 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {exportingQR ? "Generating..." : "Export QR Codes"}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-[#a6a6a6] py-10">Loading equipment...</p>
          ) : equipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-62.5 text-center">
              <p className="text-[#a6a6a6] mb-4">There are no equipments.</p>
              <button
                onClick={() => setEditingEquipment(null)}
                className="btn-gold px-5 py-2.5 text-sm"
              >
                Add Equipment
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-[#a6a6a6] py-10">No equipment found.</p>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allPageItems.desktop.map((eq, i) =>
                  eq ? (
                    <EquipmentCard
                      key={eq.id}
                      eq={eq}
                      uploadingImages={uploadingImages}
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
                      uploadingImages={uploadingImages}
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
                    className="btn-gold px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-[#a6a6a6] font-medium">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-gold px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
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
          equipment={editingEquipment ?? undefined}
          onSave={handleSave}
          onClose={() => setEditingEquipment(undefined)}
          conditions={conditions}
          defaultOwner={user?.fullName ?? ""}
        />
      )}

      {/* TODO: remake this modal */}
      {showDeleteConfirm && <ShowDeleteModal 
        setShowDeleteConfirm={setShowDeleteConfirm}
        deletingId={deletingId}
        setDeletingId={setDeletingId}
        queryClient={queryClient}
        handleSync={handleSync}
      />}
    </div>
  )
}
