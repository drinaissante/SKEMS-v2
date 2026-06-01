export default function EquipmentCardPlaceholder() {
  return (
    <div className="invisible bg-white rounded-xl shadow border border-[#d9d9d9] p-4">
      <div className="w-full h-32 bg-[#d9d9d9] rounded-lg mb-3" />

      <div className="h-4 bg-[#d9d9d9] rounded w-3/4 mb-2" />

      <div className="h-3 bg-[#d9d9d9] rounded w-1/2 mb-1" />

      <div className="space-y-1 mb-3">
        <div className="h-3 bg-[#d9d9d9] rounded w-full" />
        <div className="h-3 bg-[#d9d9d9] rounded w-2/3" />
        <div className="h-3 bg-[#d9d9d9] rounded w-4/5" />
      </div>

      <div className="h-5 bg-[#d9d9d9] rounded-full w-16 mt-3" />

      <div className="mt-2 pt-2 border-t border-[#d9d9d9] space-y-1">
        <div className="h-3 bg-[#d9d9d9] rounded w-3/5" />
        <div className="h-3 bg-[#d9d9d9] rounded w-1/2" />
        <div className="h-3 bg-[#d9d9d9] rounded w-2/5" />
      </div>
    </div>
  )
}
