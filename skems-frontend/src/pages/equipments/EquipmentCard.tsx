import { Link } from "react-router-dom"
import type { Equipment } from "../../services/api"
import skIconFallback from "/sk_icon.jpg"
import { formatManila } from "../../utils/datetime"

export default function EquipmentCard({
  eq,
  onEdit,
  onDelete,
  onImageClick,
  uploadingImages = {},
  requestMap,
  onOpenRequests,
  requestsCount = 0,
}: {
  eq: Equipment
  onEdit?: (eq: Equipment) => void
  onDelete?: (id: string) => void
  onImageClick?: (eq: Equipment) => void
  uploadingImages?: Record<string, boolean>
  requestMap?: Map<string, { id: string; reason: string }>
  onOpenRequests?: (eq: Equipment) => void
  requestsCount?: number
}) {
  const uploading = uploadingImages[eq.id]
  const dateFormat = { month: "short" as const, day: "numeric" as const, year: "numeric" as const, hour: "2-digit" as const, minute: "2-digit" as const }
  const isBorrowed = eq.condition === "Borrowed" || (!!eq.borrowerName)
  const conditionText = eq.condition || "Not checked"
  const requestId = requestMap?.get(eq.id)?.id

  return (
    <div className="dark-card p-3 relative h-full flex flex-col">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {onEdit && (
          <button
            onClick={() => onEdit(eq)}
            className="w-7 h-7 bg-[#222] border border-[#5f5c5c93] rounded-full shadow flex items-center justify-center text-[#a6a6a6] hover:text-[#fdb125] hover:shadow-md transition-all cursor-pointer"
            title="Edit equipment"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(eq.id)}
            className="w-7 h-7 bg-[#222] border border-[#5f5c5c93] rounded-full shadow flex items-center justify-center text-red-500 hover:text-red-700 hover:shadow-md transition-all cursor-pointer"
            title="Delete equipment"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div
        className={`w-full h-24 bg-white/10 rounded-lg mb-2.5 overflow-hidden relative ${onImageClick && !uploading ? "cursor-zoom-in" : ""}`}
        onClick={onImageClick && !uploading ? () => onImageClick(eq) : undefined}
      >
        {uploading ? (
          <div className="w-full h-full bg-[#2a2a2a] animate-pulse rounded-lg" />
        ) : (
          <img src={eq.image || skIconFallback} alt={eq.name} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => { (e.target as HTMLImageElement).src = skIconFallback }} />
        )}
        <span className={`absolute top-1.5 left-1.5 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full shadow ${
          isBorrowed ? "bg-[#c89116]/30 text-[#fdb125]" :
          eq.condition === "Working" ? "bg-green-500/30 text-green-200" :
          eq.condition === "Needs Repair" ? "bg-[#ffd870]/25 text-[#ffd870]" :
          eq.condition === "Broken" ? "bg-red-500/30 text-red-200" :
          "bg-white/15 text-[#a6a6a6]"
        }`}>
          {isBorrowed ? "Borrowed" : conditionText}
        </span>
      </div>

      <Link
        to={`/equipment?id=${eq.id}`}
        className="block cursor-pointer group"
      >
        <p className="font-mono text-xs text-[#c89116] font-bold mb-0.5 group-hover:text-[#fdb125] transition-colors">{eq.id}</p>
        <h3 className="font-bold text-white text-sm group-hover:text-[#fdb125] transition-colors leading-snug">{eq.name}</h3>
        <p className="text-xs text-[#a6a6a6] mb-1.5">{eq.category}</p>

        <div className="text-xs text-[#a6a6a6] space-y-0.5">
          <p className="truncate" title={eq.owner}><span className="font-medium">Owner:</span> {eq.owner}</p>
          <p><span className="font-medium">Given to SK:</span> {eq.dateGivenToSK}</p>
        </div>

        <div className="mt-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
          <p className="text-[10px] uppercase tracking-wide font-bold text-[#a6a6a6] mb-0.5">Comment:</p>
          {eq.comments ? (
            <p className="text-xs leading-snug text-[#a6a6a6] line-clamp-2" title={eq.comments}>
              {eq.comments}
            </p>
          ) : (
            <p className="text-xs leading-snug italic text-[#a6a6a6]/50">No comment</p>
          )}
        </div>

      </Link>

      <div className="mt-auto pt-2 border-t border-white/10 text-xs text-[#a6a6a6]">
        {isBorrowed && eq.borrowerName ? (
          <>
            <p><span className="font-medium">Borrower:</span> {eq.borrowerName}</p>
            <p><span className="font-medium">Borrowed:</span> {formatManila(eq.dateBorrowed, dateFormat)}</p>
            <p><span className="font-medium">Due:</span> {formatManila(eq.dateDue, dateFormat)}</p>
            {(() => {
              const req = requestMap?.get(eq.id)
              return req?.reason ? (
                <p className="truncate" title={req.reason}><span className="font-medium">Reason:</span> {req.reason}</p>
              ) : null
            })()}
          </>
        ) : (
          <>
          <div className="italic text-[#a6a6a6]/50">
            <span>Not currently borrowed</span>
            </div>
          </>
           
        )}
      </div>

      {(isBorrowed && requestId) && (
        <div className="mt-2 flex justify-end">
          <Link
            to={`/dashboard/requests?id=${requestId}`}
            className="inline-block px-3 py-1.5 rounded-lg border border-[#c89116] text-[#c89116] hover:bg-[#c89116] hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            View Request →
          </Link>
        </div>
      )}

      {onOpenRequests && (
        <button
          onClick={() => onOpenRequests(eq)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border border-[#c89116]/40 text-[#c89116] hover:bg-[#c89116] hover:text-white text-xs font-bold transition-colors cursor-pointer"
        >
          {requestsCount > 0 ? `Requests (${requestsCount})` : "Requests"}
        </button>
      )}
    </div>
  )
}
