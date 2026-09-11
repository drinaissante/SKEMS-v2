interface QrExportModalProps {
  count: number
  onClose: () => void
}

export default function QrExportModal({ count, onClose }: QrExportModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base sm:text-lg font-bold text-white mb-2 text-center">QR Codes Exported</p>
        <p className="text-sm text-[#a6a6a6] mb-6 text-center">
          {count > 0
            ? `${count} QR code${count === 1 ? "" : "s"} saved to equipment-qr-codes.docx in your Downloads folder.`
            : "No equipment found to export."}
        </p>
        <button onClick={onClose} className="btn-gold w-full py-2 text-sm">
          Close
        </button>
      </div>
    </div>
  )
}