import { useEffect } from "react"

interface FolderContextMenuProps {
  x: number
  y: number
  onEdit?: () => void
  onDelete: () => void
  onClose: () => void
}

export default function FolderContextMenu({ x, y, onEdit, onDelete, onClose }: FolderContextMenuProps) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [onClose])

  const left = Math.min(x, window.innerWidth - 180)
  const top = Math.min(y, window.innerHeight - 120)

  return (
    <div className="fixed inset-0 z-70" onContextMenu={(e) => { e.preventDefault(); onClose() }} onClick={onClose}>
      <div
        className="absolute bg-[#222] border border-[#a6a6a6]/30 rounded-lg shadow-xl py-1 min-w-40"
        style={{ left, top }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        {onEdit && (
          <button
            type="button"
            onClick={() => { onClose(); onEdit() }}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={() => { onClose(); onDelete() }}
          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
