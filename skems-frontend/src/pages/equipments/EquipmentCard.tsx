import type { Equipment } from "../../services/api"
import skIconFallback from "../../assets/sk_icon.jpg"

export default function EquipmentCard({
  eq,
  onEdit,
  onDelete,
  uploadingImages = {},
}: {
  eq: Equipment
  onEdit?: (eq: Equipment) => void
  onDelete?: (id: string) => void
  uploadingImages?: Record<string, boolean>
}) {
  const uploading = uploadingImages[eq.id]
  return (
    <div className="bg-white rounded-xl shadow border border-[#d9d9d9] p-4 relative">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {onEdit && (
          <button
            onClick={() => onEdit(eq)}
            className="w-9 h-9 md:w-7 md:h-7 bg-white rounded-full shadow flex items-center justify-center text-[#666] hover:text-[#c89116] hover:shadow-md transition-all cursor-pointer"
            title="Edit equipment"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(eq.id)}
            className="w-9 h-9 md:w-7 md:h-7 bg-white rounded-full shadow flex items-center justify-center text-red-500 hover:text-red-700 hover:shadow-md transition-all cursor-pointer"
            title="Delete equipment"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="w-full h-32 bg-[#d9d9d9] rounded-lg mb-3 overflow-hidden">
        {uploading ? (
          <div className="w-full h-full bg-[#e0e0e0] animate-pulse rounded-lg" />
        ) : (
          <img src={eq.image || skIconFallback} alt={eq.name} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => { (e.target as HTMLImageElement).src = skIconFallback }} />
        )}
      </div>

      <p className="text-xs text-[#a6a6a6] font-mono mb-0.5">{eq.id}</p>
      <h3 className="font-bold text-[#222] text-sm sm:text-base">{eq.name}</h3>
      <p className="text-xs text-[#a6a6a6] mb-1">{eq.category}</p>

      <div className="text-xs text-[#666] space-y-0.5">
        <p><span className="font-medium">Owner:</span> {eq.owner}</p>
        <p><span className="font-medium">Given to SK:</span> {eq.dateGivenToSK}</p>
        {eq.comments && !eq.borrowerName && (
          <p><span className="font-medium">Comments:</span> {eq.comments}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          eq.condition === "Working" ? "bg-green-100 text-green-700" :
          eq.condition === "Borrowed" ? "bg-[#c89116] text-white" :
          eq.condition === "Needs Repair" ? "bg-[#ffd870] text-[#222]" :
          eq.condition === "Broken" ? "bg-red-100 text-red-700" :
          "bg-gray-100 text-[#666]"
        }`}>
          {eq.condition}
        </span>
      </div>

      {eq.borrowerName && (
        <div className="mt-2 pt-2 border-t border-[#d9d9d9] text-xs text-[#666]">
          <p><span className="font-medium">Borrower:</span> {eq.borrowerName}</p>
          <p><span className="font-medium">Borrowed:</span> {eq.dateBorrowed}</p>
          <p><span className="font-medium">Due:</span> {eq.dateDue}</p>
          {eq.comments && <p><span className="font-medium">Reason:</span> {eq.comments}</p>}
        </div>
      )}
    </div>
  )
}
