import { Component, type ReactNode } from "react"

const CACHE_KEY = "skems-query-cache"
const RECOVERY_FLAG = "skems-crash-recovered"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Top-level crash recovery. Persisted React Query data restored from an
 * older schema can crash renders (black screens, mostly on mobile where
 * stale localStorage lingers). This boundary clears the cache and reloads
 * once per crash so the app self-heals instead of blacking out.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error("App crashed:", error)
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem(CACHE_KEY)
      sessionStorage.removeItem(RECOVERY_FLAG)
    } catch {
      // ignore storage errors
    }
    window.location.reload()
  }

  autoRecover = () => {
    try {
      if (sessionStorage.getItem(RECOVERY_FLAG)) return false
      sessionStorage.setItem(RECOVERY_FLAG, "1")
      localStorage.removeItem(CACHE_KEY)
      window.location.reload()
      return true
    } catch {
      return false
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.autoRecover()) return null
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
          <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <h1 className="text-lg font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-[#a6a6a6] mb-6">
              The app hit an unexpected error — likely from stale cached data. Clear the cache and reload to recover.
            </p>
            <button
              onClick={this.handleClearCacheAndReload}
              className="btn-gold w-full py-2.5 text-sm"
            >
              Clear cache &amp; reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
