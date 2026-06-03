import { useState, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchEquipments, updateEquipment, type Equipment } from "../../services/api"
import { uploadImage } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import EquipmentFormModal from "../equipments/AddEquipmentModal"
import skIconFallback from "../../assets/sk_icon.jpg"

const conditions = ["Working", "Borrowed", "Needs Repair", "Broken", "Not checked", "Unavailable"]

export default function EquipmentDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAdmin, user } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const equipmentId = searchParams.get("id")
  const [showEditModal, setShowEditModal] = useState(false)

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ["equipments"],
    queryFn: fetchEquipments,
  })

  const equipment = useMemo(
    () => equipments.find((eq) => eq.id === equipmentId) ?? null,
    [equipments, equipmentId],
  )

  const qrUrl = equipmentId
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/sk-equipments/qr-codes/${equipmentId}.png`
    : null

  const saveMutation = useMutation({
    mutationFn: async (params: {
      equipment: Omit<Equipment, "id">
      imageFile?: File | null
    }) => {
      if (!equipmentId) return
      await updateEquipment(equipmentId, params.equipment)
      if (params.imageFile) {
        const url = await uploadImage(params.imageFile)
        await updateEquipment(equipmentId, { image: url })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
      showToast("Equipment updated!", "success")
      setShowEditModal(false)
    },
  })

  const handleSave = async (
    eq: Omit<Equipment, "id">,
    imageFile?: File | null,
  ) => {
    await saveMutation.mutateAsync({ equipment: eq, imageFile })
  }

  if (!equipmentId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#666] px-4">
        <p className="text-lg font-bold mb-2">No equipment specified</p>
        <p className="text-sm">Scan a QR code to view equipment details.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[#666]">
        Loading...
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#666] px-4">
        <p className="text-lg font-bold mb-2">Equipment not found</p>
        <p className="text-sm">The equipment you're looking for doesn't exist.</p>
      </div>
    )
  }

  const isBorrowed = !!equipment.borrowerName

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <div className="flex flex-col flex-1 min-h-0 max-w-lg w-full mx-auto px-4 py-6 overflow-y-auto">
        <div className="bg-white rounded-xl shadow border border-[#d9d9d9] overflow-hidden">
          <div className="w-full h-56 bg-[#d9d9d9]">
            <img
              src={equipment.image || skIconFallback}
              alt={equipment.name}
              className="w-full h-full object-cover"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = skIconFallback
              }}
            />
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[#a6a6a6] font-mono">{equipment.id}</p>
                <h1 className="text-xl sm:text-2xl font-bold text-[#222]">
                  {equipment.name}
                </h1>
              </div>
              <span
                className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                  equipment.condition === "Working"
                    ? "bg-green-100 text-green-700"
                    : equipment.condition === "Borrowed"
                      ? "bg-[#c89116] text-white"
                      : equipment.condition === "Needs Repair"
                        ? "bg-[#ffd870] text-[#222]"
                        : equipment.condition === "Broken"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-[#666]"
                }`}
              >
                {equipment.condition}
              </span>
            </div>

            <div className="text-sm text-[#666] space-y-1.5">
              <p>
                <span className="font-medium text-[#222]">Category:</span>{" "}
                {equipment.category}
              </p>
              <p>
                <span className="font-medium text-[#222]">Owner:</span>{" "}
                {equipment.owner}
              </p>
              <p>
                <span className="font-medium text-[#222]">Date Given to SK:</span>{" "}
                {equipment.dateGivenToSK}
              </p>
              {equipment.comments && (
                <p>
                  <span className="font-medium text-[#222]">Comments:</span>{" "}
                  {equipment.comments}
                </p>
              )}
            </div>

            <div
              className={`text-sm font-bold px-3 py-2 rounded-lg ${
                isBorrowed
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {isBorrowed
                ? `Currently borrowed by ${equipment.borrowerName}`
                : "Available for request"}
            </div>

            {isBorrowed && (
              <div className="text-xs text-[#666] space-y-0.5 bg-[#f5f5f5] rounded-lg p-3">
                <p>
                  <span className="font-medium">Borrower:</span>{" "}
                  {equipment.borrowerName}
                </p>
                <p>
                  <span className="font-medium">Borrowed:</span>{" "}
                  {equipment.dateBorrowed}
                </p>
                <p>
                  <span className="font-medium">Due:</span>{" "}
                  {equipment.dateDue}
                </p>
              </div>
            )}

            {qrUrl && (
              <div className="pt-2">
                <p className="text-xs font-medium text-[#666] mb-1">QR Code</p>
                <img
                  src={qrUrl}
                  alt={`QR for ${equipment.id}`}
                  className="w-20 h-20 object-cover rounded-lg border border-[#d9d9d9]"
                  decoding="async"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          {isAdmin && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 py-2.5 text-sm bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => navigate(`/request?id=${equipment.id}`)}
            className={`py-2.5 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
              isAdmin ? "flex-1" : "w-full"
            } bg-[#222] hover:bg-[#666] text-white`}
          >
            Request
          </button>
        </div>
      </div>

      {showEditModal && equipment && (
        <EquipmentFormModal
          equipment={equipment}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
          conditions={conditions}
          defaultOwner={user?.fullName ?? ""}
        />
      )}
    </div>
  )
}
