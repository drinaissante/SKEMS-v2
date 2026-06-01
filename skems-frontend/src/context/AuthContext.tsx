import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { supabase, signUp, signIn, signOut, fetchProfile, updateProfile, updateEmail } from "../services/supabase"

export interface User {
  id: string
  fullName: string
  email: string
  studentNumber: string
  isAdmin: boolean
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isAdmin: boolean
  login: (identifier: string, password: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  updateUser: (data: Partial<Omit<User, "id" | "isAdmin">>) => Promise<void>
}

export interface RegisterData {
  fullName: string
  email: string
  studentNumber: string
  password: string
}

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const buildUser = async (authId: string) => {
    const profile = await fetchProfile(authId)
    setUser({
      id: authId,
      fullName: profile.full_name,
      email: profile.email,
      studentNumber: profile.student_number,
      isAdmin: profile.is_admin,
    })
  }

  const initRef = useRef(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (initRef.current) return
        initRef.current = true
        if (session?.user) {
          buildUser(session.user.id).catch((err) => {
            console.error("buildUser failed:", err)
            setUser(null)
          })
        }
        setLoading(false)
      },
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      const data = await signIn(identifier, password)
      if (data?.user) {
        await buildUser(data.user.id)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      await signUp(data.email, data.password, data.fullName, data.studentNumber)
      return true
    } catch {
      return false
    }
  }

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  const updateUser = async (
    data: Partial<Omit<User, "id" | "isAdmin">>,
  ) => {
    if (!user) return
    if (data.fullName !== undefined || data.studentNumber !== undefined) {
      await updateProfile(user.id, {
        full_name: data.fullName,
        student_number: data.studentNumber,
      })
    }
    if (data.email !== undefined) {
      await updateEmail(data.email)
    }
    setUser((prev) => (prev ? { ...prev, ...data } : null))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: user?.isAdmin ?? false,
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
