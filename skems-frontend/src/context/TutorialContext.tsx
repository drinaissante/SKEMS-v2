import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"
import { fetchMyRequests } from "../services/supabase"
import RequestTutorialModal from "../modals/RequestTutorialModal"
import TourOverlay, { type TourStep } from "../components/TourOverlay"

/* eslint-disable react-refresh/only-export-components */

export interface TutorialPromptDetail {
  userId: string
  isAdmin: boolean
}

const DISMISSED_KEY = "skems-tutorial-dismissed"
const CHECKING_DELAY_MS = 900
const TOUR_NAVIGATE_DELAY_MS = 500
const TOUR_GOTO_STEP = "skems-tour-goto-step"

function readDismissed(): Record<string, true> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persistDismissed(userId: string) {
  try {
    const map = readDismissed()
    map[userId] = true
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(map))
  } catch {
    // ignore storage errors
  }
}

interface TutorialContextType {
  openTutorial: (detail: TutorialPromptDetail, opts?: { force?: boolean }) => Promise<void>
}

const TutorialContext = createContext<TutorialContextType | null>(null)

const TOUR_STEPS: TourStep[] = [
  {
    target: "equipment-list",
    text: "This is the equipment list. Drag an item onto the form on the right, or simply tap one to add it.",
  },
  {
    target: "equipment-row",
    text: "Each card shows the equipment's ID, owner, and condition. Tap a card to add it to your request.",
  },
  {
    action: () => window.dispatchEvent(new CustomEvent(TOUR_GOTO_STEP, { detail: 1 })),
    target: "form-equipment",
    text: "Your added items live here — each with an adjustable quantity. The Review & Submit flow continues down the form.",
  },
  {
    action: () => window.dispatchEvent(new CustomEvent(TOUR_GOTO_STEP, { detail: 2 })),
    target: "form-details",
    text: "Your name, student number, and position are pre-filled automatically. Fill in your reason for borrowing plus pickup and return locations.",
  },
  {
    action: () => window.dispatchEvent(new CustomEvent(TOUR_GOTO_STEP, { detail: 3 })),
    target: "form-schedule",
    text: "Finally, set the date & time you'll borrow the equipment and the date & time you'll return it.",
  },
  {
    target: "form-next",
    text: "Review & Submit opens a final summary — confirm it and your request will be sent to an SK officer for approval.",
  },
  {
    icon: true,
    text: "You're all set! Return equipment on time to avoid penalties. You can relaunch this walkthrough anytime from your Profile page.",
  },
]

function buildTourSteps(): TourStep[] {
  const isMobile = window.innerWidth < 768
  const steps: TourStep[] = []

  if (!isMobile) {
    steps.push(TOUR_STEPS[0])
  } else {
    steps.push({
      target: "mobile-add",
      text: "Tap Add Equipment to open the equipment picker, then tap items to add them to your request.",
    })
  }

  steps.push(...TOUR_STEPS.slice(1))
  return steps
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourSteps, setTourSteps] = useState<TourStep[] | null>(null)
  const [checking, setChecking] = useState(false)
  const activeUserIdRef = useRef("")
  const navigate = useNavigate()

  const openTutorial = useCallback(async (detail: TutorialPromptDetail, opts?: { force?: boolean }) => {
    const force = opts?.force ?? false

    if (force) {
      activeUserIdRef.current = detail.userId
      setChecking(false)
      setWelcomeOpen(true)
      return
    }

    if (detail.isAdmin) return

    try {
      if (readDismissed()[detail.userId]) return
    } catch {
      // fail-open
    }

    activeUserIdRef.current = detail.userId
    setChecking(true)
    try {
      const requests = await fetchMyRequests(detail.userId)
      if (requests.length > 0) {
        setChecking(false)
        return
      }
    } catch {
      // fail-open
    }

    setTimeout(() => {
      setChecking(false)
      setWelcomeOpen(true)
    }, CHECKING_DELAY_MS)
  }, [])

  const startTour = useCallback(
    (dontShowAgain: boolean) => {
      if (dontShowAgain && activeUserIdRef.current) {
        persistDismissed(activeUserIdRef.current)
      }
      setWelcomeOpen(false)
      setTourSteps(buildTourSteps())
      navigate("/request")
      setTimeout(() => setTourOpen(true), TOUR_NAVIGATE_DELAY_MS)
    },
    [navigate],
  )

  const endTour = useCallback((dontShowAgain: boolean) => {
    setTourOpen(false)
    if (dontShowAgain && activeUserIdRef.current) {
      persistDismissed(activeUserIdRef.current)
    }
  }, [])

  const closeWelcome = useCallback((dontShowAgain: boolean) => {
    setWelcomeOpen(false)
    if (dontShowAgain && activeUserIdRef.current) {
      persistDismissed(activeUserIdRef.current)
    }
  }, [])

  return (
    <TutorialContext.Provider value={{ openTutorial }}>
      {children}
      {checking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl py-8 px-6 w-full max-w-sm text-center">
            <div className="w-10 h-10 mx-auto border-4 border-[#c89116] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-[#a6a6a6]">Checking your requests…</p>
          </div>
        </div>
      )}
      {welcomeOpen && (
        <RequestTutorialModal onStart={startTour} onClose={closeWelcome} />
      )}
      {tourOpen && tourSteps && <TourOverlay steps={tourSteps} onFinish={endTour} />}
    </TutorialContext.Provider>
  )
}

export function useTutorial(): TutorialContextType {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider")
  return ctx
}