import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface RequestTutorialModalProps {
  onClose: (dontShowAgain: boolean) => void
}

const SLIDES: { title: string; body: string[]; icon: string }[] = [
  {
    title: "Welcome to SKEMS",
    icon: "👋",
    body: [
      "SKEMS is Sine Kultura's equipment management system — the official way to borrow team equipment like cameras, lenses, tripods, and more.",
      "This quick walkthrough shows you how to make a request correctly.",
    ],
  },
  {
    title: "1. Add Equipment to Your Request",
    icon: "🎥",
    body: [
      "Head to the Request page from the navigation bar.",
      "Drag an equipment item from the left list onto the form — or simply tap it to add (on mobile, use the Add Equipment button).",
      "Set the quantity (limit depends on available units).",
    ],
  },
  {
    title: "2. Fill Out the Form",
    icon: "📝",
    body: [
      "Your name, student number, and position are filled in automatically.",
      "Write your reason for borrowing, and set your pickup and return locations.",
      "Pick the date & time you will borrow the equipment and the time you will return it.",
    ],
  },
  {
    title: "3. Submit & Confirm",
    icon: "🚀",
    body: [
      "Review the summary and confirm your request.",
      "Your request starts as Pending until an SK officer approves it.",
      "Once approved, the equipment is reserved for you — keep an eye on it under My Requests.",
    ],
  },
  {
    title: "You're All Set!",
    icon: "✅",
    body: [
      "Remember: return the equipment on time to avoid penalties.",
      "You can review your requests anytime under My Requests in your profile.",
      "Need this walkthrough again? It's available on your Profile page.",
    ],
  },
]

export default function RequestTutorialModal({ onClose }: RequestTutorialModalProps) {
  const navigate = useNavigate()
  const [slide, setSlide] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const isLast = slide === SLIDES.length - 1
  const current = SLIDES[slide]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60">
      <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl py-8 px-5 sm:py-8 sm:px-6 w-full max-w-lg">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#c89116]/15 flex items-center justify-center text-3xl">
            {current.icon}
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 text-center">
          {current.title}
        </h3>

        <div className="space-y-2 mb-6">
          {current.body.map((line, i) => (
            <p key={i} className="text-sm text-[#a6a6a6] text-center">
              {line}
            </p>
          ))}
        </div>

        <div className="flex justify-center gap-1.5 mb-5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === slide ? "bg-[#c89116]" : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {isLast && (
          <label className="flex items-center justify-center gap-2 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-[#c89116]"
            />
            <span className="text-xs text-[#a6a6a6]">Don't show this again</span>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => (slide === 0 ? onClose(dontShowAgain) : setSlide(s => s - 1))}
            className="btn-ghost flex-1 py-2.5 rounded-lg text-sm"
          >
            {slide === 0 ? "Maybe Later" : "Back"}
          </button>
          {isLast ? (
            <button
              onClick={() => {
                onClose(dontShowAgain)
                navigate("/request")
              }}
              className="btn-gold flex-1 py-2.5 rounded-lg text-sm"
            >
              Go to Request
            </button>
          ) : (
            <button
              onClick={() => setSlide(s => s + 1)}
              className="btn-gold flex-1 py-2.5 rounded-lg text-sm"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
