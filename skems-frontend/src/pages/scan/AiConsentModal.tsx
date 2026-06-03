interface Props {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function AiConsentModal({ open, onCancel, onConfirm }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border border-[#d9d9d9]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#c89116]/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#c89116]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#222] text-center">AI Processing Notice</h3>
          <p className="text-sm text-[#666] text-center">
            By clicking <strong>OK</strong>, you acknowledge that the information and image captured will be used and processed by AI to extract form data.
          </p>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-[#a6a6a6] text-[#666] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-[#c89116] hover:bg-[#caa453] text-white rounded-lg transition-colors cursor-pointer text-sm font-bold"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
