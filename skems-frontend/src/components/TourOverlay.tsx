import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react"

export interface TourStep {
  text: string
  target?: string
  action?: () => void
  icon?: boolean
}

interface TourOverlayProps {
  steps: TourStep[]
  onFinish: (dontShowAgain: boolean) => void
}

const SPOTLIGHT_PAD = 8
const TOOLTIP_GAP = 14
const VIEWPORT_PAD = 12

function isVisibleTarget(el: HTMLElement): boolean {
  if (!el.isConnected || !el.hasAttribute("data-tour")) return false
  if (el.offsetParent === null) {
    const style = getComputedStyle(el)
    if (style.position === "fixed") {
      return style.display !== "none" && style.visibility !== "hidden"
    }
    return false
  }
  return true
}

export default function TourOverlay({ steps, onFinish }: TourOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [tooltipSize, setTooltipSize] = useState({ w: 384, h: 230 })
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const dirRef = useRef<1 | -1>(1)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const isLast = stepIndex === steps.length - 1
  const step = steps[stepIndex]
  const isMobile = window.innerWidth < 768

  const findTarget = useCallback((s: TourStep): HTMLElement | null => {
    if (!s.target) return null
    const selector = `[data-tour="${s.target}"]`
    const candidates = document.querySelectorAll<HTMLElement>(selector)
    for (const el of candidates) {
      if (isVisibleTarget(el)) return el
    }
    return null
  }, [])

  useEffect(() => {
    step.action?.()

    const measure = () => {
      const el = findTarget(step)
      if (!el) {
        setRect(null)
        return
      }
      el.scrollIntoView({ block: "center", behavior: "auto" })
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setRect(el.getBoundingClientRect())
        })
      })
    }

    const settleUp = (then: () => void) => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(then, 60)))
    }

    settleUp(() => {
      const i = stepIndex
      if (i < 0 || i >= steps.length) return
      const s = steps[i]
      if (s.target && !findTarget(s)) {
        const dir = dirRef.current
        if (dir === 1 && i + 1 < steps.length) setStepIndex(i + 1)
        else if (dir === -1 && i - 1 >= 0) setStepIndex(i - 1)
        return
      }
      measure()
    })

    measure()
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [stepIndex, steps, findTarget, step])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = tooltipRef.current
      if (el) {
        setTooltipSize(prev =>
          Math.abs(prev.w - el.offsetWidth) < 2 && Math.abs(prev.h - el.offsetHeight) < 2
            ? prev
            : { w: el.offsetWidth, h: el.offsetHeight },
        )
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [stepIndex, step, rect])

  const next = () => {
    if (isLast) return onFinish(dontShowAgain)
    dirRef.current = 1
    setStepIndex(i => Math.min(steps.length - 1, i + 1))
  }

  const back = () => {
    if (stepIndex === 0) return
    dirRef.current = -1
    setStepIndex(i => Math.max(0, i - 1))
  }

  const isCentered = !step.target || !rect

  const tooltipStyle: CSSProperties = isMobile
    ? { bottom: 16, left: 16, right: 16 }
    : isCentered
      ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
      : (() => {
          const vw = window.innerWidth
          const vh = window.innerHeight
          const halfW = Math.min(tooltipSize.w / 2 + 4, vw / 2 - VIEWPORT_PAD)
          const clampedLeft = Math.min(
            Math.max(rect!.left + rect!.width / 2, halfW + VIEWPORT_PAD),
            vw - halfW - VIEWPORT_PAD,
          )
          const fitsBelow = rect!.bottom + tooltipSize.h + TOOLTIP_GAP <= vh - VIEWPORT_PAD
          const fitsAbove = rect!.top - tooltipSize.h - TOOLTIP_GAP >= VIEWPORT_PAD

          if (fitsBelow) {
            return {
              top: rect!.bottom + TOOLTIP_GAP,
              left: clampedLeft,
              transform: "translateX(-50%)",
            }
          }
          if (fitsAbove) {
            return {
              bottom: vh - rect!.top + TOOLTIP_GAP,
              left: clampedLeft,
              transform: "translateX(-50%)",
            }
          }
          return {
            top: VIEWPORT_PAD + 4,
            left: Math.min(Math.max(clampedLeft, halfW + VIEWPORT_PAD), vw - halfW - VIEWPORT_PAD),
            transform: "translateX(-50%)",
          }
        })()

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/70" />

      {rect && (
        <div
          className="absolute rounded-xl border-2 border-[#c89116]/80 pointer-events-none transition-all duration-200"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.7), 0 0 18px rgba(200,145,22,0.45)",
            background: "rgba(200,145,22,0.06)",
          }}
        />
      )}

      <div
        ref={tooltipRef}
        className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl py-5 px-5 w-96 max-w-full text-center"
        style={{ position: "fixed", ...tooltipStyle }}
      >
        <p className="text-xs text-[#a6a6a6] mb-2">
          {stepIndex + 1} / {steps.length}
        </p>

        {step.icon && (
          <img
            src="/sk_icon_no_bg.png"
            alt="Sine Kultura"
            className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/5 p-1"
          />
        )}

        <p key={stepIndex} className="text-sm text-white mb-5 animate-tour-text">
          {step.text}
        </p>

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

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onFinish(dontShowAgain)}
            className="btn-ghost px-4 py-2 rounded-lg text-xs shrink-0"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0}
            className="btn-ghost flex-1 py-2 text-sm disabled:opacity-40 rounded-lg"
          >
            Back
          </button>
          <button
            type="button"
            onClick={next}
            className="btn-gold flex-1 py-2 text-sm rounded-lg"
          >
            {stepIndex >= steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}
