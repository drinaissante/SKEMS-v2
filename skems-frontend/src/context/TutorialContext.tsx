import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { fetchMyRequests } from "../services/supabase"
import RequestTutorialModal from "../modals/RequestTutorialModal"

/* eslint-disable react-refresh/only-export-components */

export interface TutorialPromptDetail {
  userId: string
  isAdmin: boolean
}

const DISMISSED_KEY = "skems-tutorial-dismissed"
const CHECKING_DELAY_MS = 900

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

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false)
  const [checking, setChecking] = useState(false)
  const activeUserIdRef = useRef("")

  const openTutorial = useCallback(async (detail: TutorialPromptDetail, opts?: { force?: boolean }) => {
    const force = opts?.force ?? false

    if (force) {
      activeUserIdRef.current = detail.userId
      setChecking(false)
      setShow(true)
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
      setShow(true)
    }, CHECKING_DELAY_MS)
  }, [])

  const handleModalClose = useCallback((dontShowAgain: boolean) => {
    setShow(false)
    if (dontShowAgain && activeUserIdRef.current) {
      persistDismissed(activeUserIdRef.current)
      activeUserIdRef.current = ""
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
      {show && <RequestTutorialModal onClose={handleModalClose} />}
    </TutorialContext.Provider>
  )
}

export function useTutorial(): TutorialContextType {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider")
  return ctx
}
