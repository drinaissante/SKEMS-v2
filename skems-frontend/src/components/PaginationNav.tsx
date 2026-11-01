import { FiChevronLeft, FiChevronRight } from "react-icons/fi"

interface PaginationNavProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export default function PaginationNav({ page, totalPages, onChange }: PaginationNavProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-4 py-3">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="p-2 rounded-full border border-white/15 text-[#a6a6a6] hover:border-[#c89116] hover:text-[#c89116] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/15 disabled:hover:text-[#a6a6a6]"
      >
        <FiChevronLeft size={20} />
      </button>

      <span className="text-sm text-[#a6a6a6] font-medium">
        {page} / {totalPages}
      </span>

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="p-2 rounded-full border border-white/15 text-[#a6a6a6] hover:border-[#c89116] hover:text-[#c89116] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/15 disabled:hover:text-[#a6a6a6]"
      >
        <FiChevronRight size={20} />
      </button>
    </div>
  )
}
