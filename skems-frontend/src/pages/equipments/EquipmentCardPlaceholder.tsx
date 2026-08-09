export default function EquipmentCardPlaceholder() {
  return (
    <div className="invisible bg-[#111] border border-[#5f5c5c93] rounded-xl p-4">
      <div className="w-full h-32 bg-white/10 rounded-lg mb-3" />

      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />

      <div className="h-3 bg-white/10 rounded w-1/2 mb-1" />

      <div className="space-y-1 mb-3">
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/10 rounded w-4/5" />
      </div>

      <div className="h-5 bg-white/10 rounded-full w-16 mt-3" />

      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
        <div className="h-3 bg-white/10 rounded w-3/5" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="h-3 bg-white/10 rounded w-2/5" />
      </div>
    </div>
  )
}
