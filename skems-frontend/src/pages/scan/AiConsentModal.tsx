interface Props {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function AiConsentModal({ open, onCancel, onConfirm }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
      <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#c89116]/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#c89116]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white text-center">AI Processing Notice</h3>
          <p className="text-sm text-[#a6a6a6] text-center">
            By clicking <strong>OK</strong>, you acknowledge that the information and image captured will be used and processed by AI to extract form data.
          </p>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="btn-ghost flex-1 px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="btn-gold flex-1 px-4 py-2 text-sm"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
