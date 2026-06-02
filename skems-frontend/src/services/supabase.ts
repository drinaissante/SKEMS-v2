import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  studentNumber: string,
  captchaToken: string,
) {
  if (!email || !password || !fullName || !studentNumber) {
    throw new Error("All fields are required");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      captchaToken,
      data: {
        full_name: fullName,
        student_number: studentNumber,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(
  identifier: string,
  password: string,
  captchaToken: string,
) {
  let email = identifier;

  if (!identifier.includes("@")) {
    const { data: profile, error: lookupError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("student_number", identifier)
      .single();

    if (lookupError || !profile) {
      throw new Error("No account found with that student number");
    }
    email = profile.email;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) throw error ?? new Error("Profile not found");
  return data as {
    id: string;
    student_number: string;
    full_name: string;
    is_admin: boolean;
    is_superadmin: boolean;
    email: string;
  };
}

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `equipments/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("sk-equipments")
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from("sk-equipments")
    .getPublicUrl(path);
  return publicUrlData.publicUrl;
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; student_number?: string },
) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;
}

export async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function resetPassword(email: string, redirectTo: string, captchaToken?: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
    captchaToken,
  });
  if (error) throw error;
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data as {
    id: string;
    student_number: string;
    full_name: string;
    is_admin: boolean;
    is_superadmin: boolean;
    email: string;
  }[];
}

export async function toggleAdmin(
  targetUserId: string,
  isAdmin: boolean,
  currentUserId: string,
) {
  const { data: caller, error: callerError } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", currentUserId)
    .single();

  if (callerError || !caller?.is_superadmin) {
    throw new Error("Only super admins can toggle admin status");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_admin: isAdmin })
    .eq("id", targetUserId);
  if (error) throw error;
}

export async function submitRequest(data: {
  equipmentId: string;
  equipmentName: string;
  borrowerName: string;
  studentNumber: string;
  reason: string;
  dateBorrowed: string;
  dateDue: string;
  userId: string;
}) {
  const { error } = await supabase.from("requests").insert({
    equipment_id: data.equipmentId,
    equipment_name: data.equipmentName,
    borrower_name: data.borrowerName,
    student_number: data.studentNumber,
    reason: data.reason,
    date_borrowed: data.dateBorrowed,
    date_due: data.dateDue,
    user_id: data.userId,
    status: "Pending",
  });
  if (error) throw error;
}

export async function fetchMyRequests(userId: string) {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as {
    id: string;
    equipment_id: string;
    equipment_name: string;
    borrower_name: string;
    student_number: string;
    reason: string;
    date_borrowed: string;
    date_due: string;
    status: string;
    created_at: string;
    user_id: string;
  }[];
}

export async function fetchAllRequests() {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as {
    id: string;
    equipment_id: string;
    equipment_name: string;
    borrower_name: string;
    student_number: string;
    reason: string;
    date_borrowed: string;
    date_due: string;
    status: string;
    created_at: string;
    user_id: string;
  }[];
}

export async function updateRequestStatus(requestId: string, status: string) {
  const { error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", requestId);
  if (error) throw error;
}

export interface NewBorrowRecord {
  equipment_id: string
  quantity: number
  full_name: string
  date: string
  position_department: string
  owner: string
  equipment_requested: string
  purpose_of_use: string
  date_time_borrowing: string
  date_time_return: string
  pickup_location: string
  return_location: string
  scanned_by: string
}

export async function fetchBorrowedItems() {
  const { data, error } = await supabase
    .from("borrow_records")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as {
    equipment_id: string
    quantity: number
    full_name: string
    date: string
    position_department: string
    owner: string
    equipment_requested: string
    purpose_of_use: string
    date_time_borrowing: string
    date_time_return: string
    pickup_location: string
    return_location: string
    condition_before: string
    condition_after: string
    notes: string
    scanned_by: string
    created_at: string
    updated_at: string
  }[];
}

export async function addBorrowedItem(data: NewBorrowRecord) {
  const { error } = await supabase
    .from("borrow_records")
    .upsert({
      equipment_id: data.equipment_id,
      quantity: data.quantity,
      full_name: data.full_name,
      date: data.date,
      position_department: data.position_department,
      owner: data.owner,
      equipment_requested: data.equipment_requested,
      purpose_of_use: data.purpose_of_use,
      date_time_borrowing: data.date_time_borrowing,
      date_time_return: data.date_time_return,
      pickup_location: data.pickup_location,
      return_location: data.return_location,
      scanned_by: data.scanned_by,
    });

  if (error) throw error;

  const { error: updateErr } = await supabase
    .from("equipments")
    .update({
      borrower_name: data.full_name,
      date_borrowed: data.date_time_borrowing || null,
      date_due: data.date_time_return || null,
      condition: "Borrowed",
    })
    .eq("equipment_id", data.equipment_id);

  if (updateErr) console.error("Failed to sync equipment:", updateErr);
}

export async function updateBorrowedItem(
  equipmentId: string,
  updates: { condition_before?: string; condition_after?: string; notes?: string },
) {
  const updateData: Record<string, string> = {};
  if (updates.condition_before !== undefined) updateData.condition_before = updates.condition_before;
  if (updates.condition_after !== undefined) updateData.condition_after = updates.condition_after;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  const { error } = await supabase
    .from("borrow_records")
    .update(updateData)
    .eq("equipment_id", equipmentId);

  if (error) throw error;
}
