import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env",
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  studentNumber: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, student_number: studentNumber },
    },
  })
  if (error) throw error
  return data
}

export async function signIn(identifier: string, password: string) {
  let email = identifier

  if (!identifier.includes("@")) {
    const { data: profile, error: lookupError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("student_number", identifier)
      .single()

    if (lookupError || !profile) {
      throw new Error("No account found with that student number")
    }
    email = profile.email
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) throw error
  return data as {
    id: string
    student_number: string
    full_name: string
    is_admin: boolean
    email: string
  }
}

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()
  const path = `equipments/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from("sk-equipments")
    .upload(path, file)
  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage
    .from("sk-equipments")
    .getPublicUrl(path)
  return publicUrlData.publicUrl
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; student_number?: string },
) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
  if (error) throw error
}

export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true })

  if (error) throw error
  return data as {
    id: string
    student_number: string
    full_name: string
    is_admin: boolean
    email: string
  }[]
}

export async function toggleAdmin(userId: string, isAdmin: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: isAdmin })
    .eq("id", userId)
  if (error) throw error
}
