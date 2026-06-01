import type { Equipment } from "../../services/api"

export default function EquipmentCard({
  eq,
  onEdit,
}: {
  eq: Equipment
  onEdit?: (eq: Equipment) => void
}) {
  return (
    <div className="bg-white rounded-xl shadow border border-[#d9d9d9] p-4 relative">
      {onEdit && (
        <button
          onClick={() => onEdit(eq)}
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-[#666] hover:text-[#c89116] hover:shadow-md transition-all cursor-pointer"
          title="Edit equipment"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      <div className="w-full h-32 bg-[#d9d9d9] rounded-lg mb-3 flex items-center justify-center text-[#a6a6a6] overflow-hidden">
        {eq.image ? (
          <img src={eq.image} alt={eq.name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
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
          eq.condition === "Needs Repair" ? "bg-[#ffd870] text-[#222]" :
          eq.condition === "Broken" ? "bg-red-100 text-red-700" :
          "bg-gray-100 text-[#666]"
        }`}>
          {eq.condition}
        </span>
        {eq.borrowerName && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#c89116] text-white">
            Borrowed
          </span>
        )}
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
