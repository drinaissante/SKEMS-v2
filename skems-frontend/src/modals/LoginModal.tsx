interface LoginModalProps {
  userName?: string
  onClose: () => void
}

export default function LoginModal({ userName, onClose }: LoginModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-base sm:text-lg font-bold text-white mb-2 text-center">Login Successful</p>
        <p className="text-sm text-[#a6a6a6] mb-6 text-center">
          Welcome{userName ? `, ${userName}` : ""}!
        </p>
        <button
          onClick={onClose}
          className="btn-gold w-full py-2 text-sm"
        >
          OK
        </button>
      </div>
    </div>
  )
}
