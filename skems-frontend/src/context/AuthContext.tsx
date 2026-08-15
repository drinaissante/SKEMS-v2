import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase, signUp, signIn, signOut, fetchProfile, updateProfile, updateEmail } from "../services/supabase"

export interface User {
  id: string
  fullName: string
  email: string
  studentNumber: string
  isAdmin: boolean
  isSuperAdmin: boolean
  linkCode: string
  position: string | null
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  login: (identifier: string, password: string, captchaToken: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  updateUser: (data: Partial<Omit<User, "id" | "isAdmin" | "isSuperAdmin">>) => Promise<void>
}

export interface RegisterData {
  fullName: string
  email: string
  studentNumber: string
  password: string
  captchaToken: string | undefined
}

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext<AuthContextType | null>(null)

const PROFILE_CACHE_KEY = "skems-profiles"

function readProfileCache(): Record<string, User> {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function cacheProfile(user: User) {
  try {
    const cache = readProfileCache()
    cache[user.id] = user
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore storage errors
  }
}

function getCachedProfile(authId: string): User | null {
  const cache = readProfileCache()
  return cache[authId] ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()
  const prevUserIdRef = useRef<string | null>(null)

  const applyUser = (next: User | null) => {
    const nextId = next?.id ?? null
    if (nextId === null) {
      queryClient.clear()
    } else if (
      prevUserIdRef.current !== null &&
      prevUserIdRef.current !== nextId
    ) {
      queryClient.clear()
    }
    prevUserIdRef.current = nextId
    setUser(next)
  }

  const resolveUser = async (authId: string) => {
    try {
      const profile = await fetchProfile(authId)
      const next: User = {
        id: authId,
        fullName: profile.full_name,
        email: profile.email,
        studentNumber: profile.student_number,
        isAdmin: profile.is_admin,
        isSuperAdmin: profile.is_superadmin,
        linkCode: profile.link_code,
        position: profile.position ?? null,
      }
      cacheProfile(next)
      applyUser(next)
    } catch (err) {
      console.error("buildUser failed:", err)
      if (!navigator.onLine) {
        const cached = getCachedProfile(authId)
        if (cached) {
          applyUser(cached)
          return
        }
      }
      applyUser(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await resolveUser(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "INITIAL_SESSION") return
        if (session?.user) {
          resolveUser(session.user.id).catch((err) => {
            console.error("buildUser failed:", err)
            applyUser(null)
          })
        } else {
          applyUser(null)
        }
      },
    )

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (identifier: string, password: string, captchaToken: string): Promise<boolean> => {
    try {
      const data = await signIn(identifier, password, captchaToken)
      if (data?.user) {
        await resolveUser(data.user.id)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      await signUp(data.email, data.password, data.fullName, data.studentNumber, data.captchaToken ?? '')
      return true
    } catch {
      return false
    }
  }

  const logout = async () => {
    try {
      await signOut()
    } catch {
      // sign out may fail offline; still clear local state
    }
    applyUser(null)
  }

  const updateUser = async (
    data: Partial<Omit<User, "id" | "isAdmin">>,
  ) => {
    if (!user) return
    if (
      data.fullName !== undefined ||
      data.studentNumber !== undefined
    ) {
      await updateProfile(user.id, {
        full_name: data.fullName,
        student_number: data.studentNumber,
      })
    }
    if (data.email !== undefined) {
      await updateEmail(data.email)
    }
    setUser((prev) => {
      const next = prev ? { ...prev, ...data } : null
      if (next) cacheProfile(next)
      return next
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: user?.isAdmin ?? false,
        isSuperAdmin: user?.isSuperAdmin ?? false,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
