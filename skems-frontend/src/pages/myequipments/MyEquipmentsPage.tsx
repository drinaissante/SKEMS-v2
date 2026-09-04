import { useState, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchEquipmentsByOwner,
  addEquipment,
  updateEquipment,
  type Equipment,
} from "../../services/api"
import { uploadImage, uploadQRCode, fetchProfile } from "../../services/supabase"
import { fetchAllRequests } from "../../services/supabase"

import EquipmentFormModal from "../equipments/AddEquipmentModal"
import EquipmentCard from "../equipments/EquipmentCard"
import EquipmentCardPlaceholder from "../equipments/EquipmentCardPlaceholder"
import ImageLightbox from "../../components/ImageLightbox"
import skIconFallback from "/sk_icon.jpg"
import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useToast } from "../../hooks/useToast"

import ShowDeleteModal from "../../modals/ShowDeleteModal"
import { CONDITION_OPTIONS } from "../../constants/borrowedConstants"

const MOBILE_ITEMS = 3
const DESKTOP_ITEMS = 8

export default function MyEquipmentsPage() {
  usePageTitle("My Equipments")

  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const { isSuperAdmin, user } = useAuth()
  const queryClient = useQueryClient()

  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("All")
  const [filterCondition, setFilterCondition] = useState("All")
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState("")
  const [expandedImage, setExpandedImage] = useState<Equipment | null>(null)

  const { showToast } = useToast()

  const isOwn = user?.id === uuid
  const canAccess = isOwn || isSuperAdmin

  const { data: profile } = useQuery({
    queryKey: ["profile-by-id", uuid],
    queryFn: () => fetchProfile(uuid!),
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000,
  })

  const ownerName = canAccess ? (profile?.full_name ?? user?.fullName ?? "") : ""

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ["my-equipments", uuid, ownerName],
    queryFn: () => fetchEquipmentsByOwner(ownerName),
    enabled: canAccess && !!ownerName,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  const { data: requests = [] } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: fetchAllRequests,
    staleTime: 5 * 60 * 1000,
  })

  const requestMap = useMemo(() => {
    const map = new Map<string, { id: string; reason: string }>()
    for (const r of requests) {
      if (r.equipment_id && (r.status === "Pending" || r.status === "Approved")) {
        map.set(r.equipment_id, { id: r.id, reason: r.reason })
      }
    }
    return map
  }, [requests])

  useEffect(() => {
    if (!canAccess) {
      navigate("/restricted", { replace: true })
    }
  }, [canAccess, navigate])

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
      queryClient.invalidateQueries({ queryKey: ["my-equipments"] })
      showToast("Equipment saved!", "success")
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
          {isOwn ? "My Equipments" : `${profile?.full_name ?? "User"}'s Equipments`}
        </h1>

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
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-[#a6a6a6] py-10">Loading equipment...</p>
          ) : equipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-62.5 text-center">
              <p className="text-[#a6a6a6] mb-4">You have no equipments yet.</p>
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
                      onImageClick={setExpandedImage}
                      onEdit={(e) => setEditingEquipment(e)}
                      onDelete={handleDelete}
                      requestMap={requestMap}
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
                      onImageClick={setExpandedImage}
                      onEdit={(e) => setEditingEquipment(e)}
                      onDelete={handleDelete}
                      requestMap={requestMap}
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
          defaultOwner={user?.fullName ?? ""}
        />
      )}

      {/* TODO: remake this modal */}
      {showDeleteConfirm && <ShowDeleteModal
        setShowDeleteConfirm={setShowDeleteConfirm}
        deletingId={deletingId}
        setDeletingId={setDeletingId}
        queryClient={queryClient}
        handleSync={() => {}}
      />}

      {expandedImage && (
        <ImageLightbox
          src={expandedImage.image || skIconFallback}
          alt={expandedImage.name}
          onClose={() => setExpandedImage(null)}
        />
      )}
    </div>
  )
}
