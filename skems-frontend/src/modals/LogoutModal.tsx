interface LogoutModalProps {
  onClose: () => void
  onConfirm: () => void
  loggingOut?: boolean
}

export default function LogoutModal({ onClose, onConfirm, loggingOut = false }: LogoutModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <p className="text-base sm:text-lg font-bold text-white mb-2 text-center">Log out?</p>
        <p className="text-sm text-[#a6a6a6] mb-6 text-center">
          Are you sure you want to log out?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loggingOut}
            className="btn-ghost flex-1 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loggingOut}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
          >
            {loggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  )
}
