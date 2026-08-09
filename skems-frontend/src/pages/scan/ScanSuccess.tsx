import { useNavigate } from "react-router-dom"

interface Props {
  onScanAnother: () => void
}

export default function ScanSuccess({ onScanAnother }: Props) {
  const navigate = useNavigate()

  return (
    <div className="text-center py-6">
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-base sm:text-lg font-bold text-green-300 mb-2">
        Request Submitted!
      </p>
      <p className="text-sm text-[#a6a6a6] mb-4">
        The request has been submitted for approval.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onScanAnother}
          className="btn-ghost px-4 py-2 text-sm"
        >
          Scan Another
        </button>
        <button
          onClick={() => navigate("/admin/borrowed")}
          className="btn-gold px-4 py-2 text-sm"
        >
          View Borrowed Items
        </button>
      </div>
    </div>
  )
}
