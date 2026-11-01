import { useState } from "react"

interface RequestTutorialModalProps {
  onStart: (dontShowAgain: boolean) => void
  onClose: (dontShowAgain: boolean) => void
}

export default function RequestTutorialModal({ onStart, onClose }: RequestTutorialModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4 bg-black/60">
      <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl py-8 px-5 sm:py-8 sm:px-6 w-full max-w-lg text-center">
        <img
          src="/sk_icon_no_bg.png"
          alt="Sine Kultura"
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 p-1"
        />

        <h3 className="text-lg sm:text-xl font-bold text-white mb-3">
          Welcome to SKEMS!
        </h3>

        <div className="space-y-2 mb-5">
          <p className="text-sm text-[#a6a6a6]">
            SKEMS is Sine Kultura's equipment management system, the official way to borrow team equipment.
          </p>
          <p className="text-sm text-[#a6a6a6]">
            New here? Take a short guided walkthrough of the Request page to learn how to request equipment correctly.
          </p>
        </div>

        <label className="flex items-center justify-center gap-2 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="accent-[#c89116]"
          />
          <span className="text-xs text-[#a6a6a6]">Don't show this again</span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={() => onClose(dontShowAgain)}
            className="btn-ghost flex-1 py-2.5 rounded-lg text-sm"
          >
            Maybe Later
          </button>
          <button
            onClick={() => onStart(dontShowAgain)}
            className="btn-gold flex-1 py-2.5 rounded-lg text-sm"
          >
            Start Walkthrough
          </button>
        </div>
      </div>
    </div>
  )
}
