import { createClient } from "@supabase/supabase-js";
import { toManilaIso } from "../utils/datetime";

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
    const { data, error: lookupError } = await supabase
      .rpc("lookup_email_by_student_number", { p_student_number: identifier });

    if (lookupError || !data?.length) {
      throw new Error("No account found with that student number");
    }
    email = data[0].email;
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
    link_code: string;
    position: string | null;
    approval_status: string;
  };
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export async function setApprovalStatus(userId: string, status: ApprovalStatus) {
  const { error } = await supabase
    .from("profiles")
    .update({ approval_status: status })
    .eq("id", userId);
  if (error) throw error;

  void insertNotifications([
    {
      user_id: userId,
      type: status === "approved" ? "account_approved" : "account_rejected",
      title: status === "approved" ? "Account approved" : "Account rejected",
      body:
        status === "approved"
          ? "Your registration was approved. Welcome to SKEMS!"
          : "Your registration was rejected by a Super Admin. Contact an officer if you believe this is a mistake.",
    },
  ]);

  void notifyDiscordDms([
    {
      userId,
      title: status === "approved" ? "Account Approved" : "Account Rejected",
      bodyText:
        status === "approved"
          ? "Your SKEMS registration was approved. You can now sign in and borrow equipment."
          : "Your SKEMS registration was rejected by a Super Admin. Contact an officer if you believe this is a mistake.",
    },
  ]);
}

export async function fetchDiscordLink(userId: string) {
  const { data, error } = await supabase
    .from("discord_links")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as {
    user_id: string;
    discord_id: string;
    discord_username: string | null;
    discord_avatar: string | null;
    linked_at: string;
  } | null;
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

export async function uploadPartnershipFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `inquiries/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("sk-partnerships")
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage
    .from("sk-partnerships")
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string;
    student_number?: string;
    position?: string;
  },
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
    position: string | null;
    approval_status: string;
  }[];
}

export async function fetchAllDiscordLinks() {
  const { data, error } = await supabase
    .from("discord_links")
    .select("user_id, discord_id, discord_username, discord_avatar, linked_at");

  if (error) throw error;
  return data as {
    user_id: string;
    discord_id: string;
    discord_username: string | null;
    discord_avatar: string | null;
    linked_at: string;
  }[];
}

export interface DiscordMember {
  discord_id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

export async function lookupDiscordMembers(
  query: string,
  signal?: AbortSignal,
): Promise<DiscordMember[]> {
  let qb = supabase
    .from("discord_members")
    .select("discord_id, username, global_name, avatar")
    .ilike("username", `${query}%`)
    .order("username", { ascending: true })
    .limit(5);

  if (signal) qb = qb.abortSignal(signal);

  const { data, error } = await qb;

  if (error) throw error;
  return (data ?? []) as DiscordMember[];
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
  quantity: number;
  positionDepartment: string;
  pickupLocation: string;
  returnLocation: string;
  owner: string;
}) {
  const { data: inserted, error } = await supabase
    .from("requests")
    .insert({
      equipment_id: data.equipmentId,
      equipment_name: data.equipmentName,
      borrower_name: data.borrowerName,
      student_number: data.studentNumber,
      reason: data.reason,
      date_borrowed: toManilaIso(data.dateBorrowed),
      date_due: toManilaIso(data.dateDue),
      user_id: data.userId,
      status: "Pending",
      quantity: data.quantity,
      position_department: data.positionDepartment,
      pickup_location: data.pickupLocation,
      return_location: data.returnLocation,
      owner: data.owner,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (inserted?.id) {
    void notifyDiscordRequest(data, inserted.id);

    const updateOwnerProfileId = data.owner ? await fetchRegisteredOwnerId(data.owner) : null;
    void notifyRequestUsers({
      requestId: inserted.id,
      equipmentId: data.equipmentId,
      equipmentName: data.equipmentName,
      borrowerId: data.userId,
      ownerId: updateOwnerProfileId,
      type: "request_created",
      bodyTitle: "New borrow request",
      bodyText: `${data.borrowerName} requested ${data.equipmentName}.`,
      skipSelf: true,
    });

    void notifyDiscordDms(
      updateOwnerProfileId
        ? [{
            userId: updateOwnerProfileId,
            title: "New Borrow Request",
            bodyText: `${data.borrowerName} requested ${data.equipmentName} (quantity: ${data.quantity}). Review it under My Equipments to approve or reject.`,
          }]
        : [],
    );
  }
}

async function notifyDiscordRequest(
  data: {
    equipmentName: string;
    borrowerName: string;
    studentNumber: string;
    reason: string;
    dateBorrowed: string;
    dateDue: string;
    quantity: number;
    positionDepartment: string;
    pickupLocation: string;
    returnLocation: string;
    owner: string;
  },
  requestId: string,
) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const res = await fetch("/api/notify-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        equipmentName: data.equipmentName,
        quantity: data.quantity,
        borrowerName: data.borrowerName,
        studentNumber: data.studentNumber,
        positionDepartment: data.positionDepartment,
        reason: data.reason,
        dateBorrowed: data.dateBorrowed,
        dateDue: data.dateDue,
        pickupLocation: data.pickupLocation,
        returnLocation: data.returnLocation,
        owner: data.owner,
        requestId,
      }),
    });

    if (res.ok) {
      const json = await res.json().catch(() => null);
      const messageId = json?.messageId;
      if (messageId) {
        await supabase
          .from("requests")
          .update({ discord_message_id: messageId })
          .eq("id", requestId);
      }
    }
  } catch {
    // fire-and-forget; never block the request flow
  }
}

function toRequestEmbedData(row: Record<string, unknown>) {
  return {
    equipmentName: String(row.equipment_name ?? row.equipment_requested ?? ""),
    quantity: Number(row.quantity ?? 1),
    borrowerName: String(row.borrower_name ?? row.full_name ?? ""),
    studentNumber: String(row.student_number ?? ""),
    positionDepartment: String(row.position_department ?? ""),
    reason: String(row.reason ?? row.purpose_of_use ?? ""),
    dateBorrowed: String(row.date_borrowed ?? row.date_time_borrowing ?? ""),
    dateDue: String(row.date_due ?? row.date_time_return ?? ""),
    pickupLocation: String(row.pickup_location ?? ""),
    returnLocation: String(row.return_location ?? ""),
    owner: String(row.owner ?? ""),
  };
}

async function syncDiscordStatus(
  row: { discord_message_id?: string | null } & Record<string, unknown>,
  status: string,
  requestId?: string | null,
) {
  if (!row.discord_message_id) return;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch("/api/update-request-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        messageId: row.discord_message_id,
        requestId,
        status,
        ...toRequestEmbedData(row),
      }),
    });
  } catch {
    // fire-and-forget; never block the request flow
  }
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
    quantity: number;
    returned_on: string | null;
    position_department: string;
    pickup_location: string;
    return_location: string;
    owner: string;
    owner_status: string;
    owner_reason: string | null;
    discord_message_id: string | null;
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
    quantity: number;
    returned_on: string | null;
    position_department: string;
    pickup_location: string;
    return_location: string;
    owner: string;
    owner_status: string;
    owner_reason: string | null;
    discord_message_id: string | null;
  }[];
}

export async function approveAndMoveRequest(requestId: string, adminUserId: string) {
  const { data: request, error: fetchErr } = await supabase
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchErr || !request) throw new Error("Request not found");

  // Two-step approval: if the equipment owner is a registered user,
  // the owner's approve must come first.
  const ownerProfile = request.owner
    ? await fetchRegisteredOwnerId(request.owner)
    : null;

  if (ownerProfile && (request.owner_status ?? "pending") !== "approved") {
    throw new Error(
      (request.owner_status ?? "pending") === "rejected"
        ? "The equipment owner has already rejected this request."
        : "This request still needs the equipment owner's approval.",
    );
  }

  const { data: activeBorrow } = await supabase
    .from("borrow_records")
    .select("equipment_id")
    .eq("equipment_id", request.equipment_id)
    .is("returned_on", null)
    .maybeSingle();

  if (activeBorrow) {
    throw new Error("This equipment is currently borrowed out. Please wait for it to be returned before approving.");
  }

  const { data: equipment } = await supabase
    .from("equipments")
    .select("condition")
    .eq("equipment_id", request.equipment_id)
    .single()

  const equipmentCondition = equipment?.condition ?? ""

  await addBorrowedItem({
    equipment_id: request.equipment_id,
    quantity: request.quantity,
    full_name: request.borrower_name,
    date: request.date_borrowed?.split("T")[0] ?? "",
    position_department: request.position_department ?? "",
    owner: request.owner ?? "",
    equipment_requested: request.equipment_name,
    purpose_of_use: request.reason,
    date_time_borrowing: request.date_borrowed,
    date_time_return: request.date_due,
    pickup_location: request.pickup_location ?? "",
    return_location: request.return_location ?? "",
    scanned_by: adminUserId,
    user_id: request.user_id ?? null,
    discord_message_id: request.discord_message_id ?? null,
    condition_before: equipmentCondition,
  });

  const { error: statusErr } = await supabase
    .from("requests")
    .update({ status: "Approved" })
    .eq("id", requestId);

  if (statusErr) throw statusErr;

  void notifyRequestUsers({
    requestId,
    equipmentId: request.equipment_id ?? null,
    equipmentName: request.equipment_name ?? "",
    borrowerId: request.user_id ?? null,
    ownerId: request.owner ? await fetchRegisteredOwnerId(request.owner) : null,
    type: "admin_approved",
    bodyTitle: "Request approved",
    bodyText: `Your request for ${request.equipment_name} was approved by an SK officer.`,
  });

  if (request.user_id) {
    void notifyDiscordDms([{
      userId: request.user_id,
      title: "Request Approved",
      bodyText: ` your request for ${request.equipment_name} was approved. Please return the equipment on time to avoid penalties.`,
    }]);
  }

  void syncDiscordStatus(request, "Approved", request.id);
}

export async function updateRequestStatus(requestId: string, status: string) {
  const { data: row } = await supabase
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", requestId);
  if (error) throw error;

  if (row) {
    void syncDiscordStatus(row, status === "Denied" ? "Rejected" : status, row.id);

    if (status === "Denied") {
      void notifyRequestUsers({
        requestId,
        equipmentId: row.equipment_id ?? null,
        equipmentName: row.equipment_name ?? "",
        borrowerId: row.user_id ?? null,
        ownerId: row.owner ? await fetchRegisteredOwnerId(row.owner) : null,
        type: "admin_denied",
        bodyTitle: "Request denied",
        bodyText: `Your request for ${row.equipment_name} was denied by an SK officer.`,
      });
      void notifyDiscordDecision(row, "Rejected", "", false);
      if (row.user_id) {
        void notifyDiscordDms([{
          userId: row.user_id,
          title: "Request Denied",
          bodyText: `Your request for ${row.equipment_name} was denied by an SK officer.`,
        }]);
      }
    }
  }
}

export async function deleteRequest(requestId: string) {
  const { data: row } = await supabase
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await supabase
    .from("requests")
    .delete()
    .eq("id", requestId);
  if (error) throw error;

  if (row) {
    void syncDiscordStatus(row, "Deleted", row.id);
  }
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  request_id: string | null;
  equipment_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

async function fetchRegisteredOwnerId(ownerName: string): Promise<string | null> {
  if (!ownerName?.trim()) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .ilike("full_name", ownerName.trim())
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function hasRegisteredOwner(ownerName: string): Promise<boolean> {
  return (await fetchRegisteredOwnerId(ownerName)) !== null;
}

async function fetchAdminIds(): Promise<string[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .or("is_admin.eq.true,is_superadmin.eq.true");
  return (data ?? []).map((p: { id: string }) => p.id);
}

async function fetchMyAdminFlag(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin, is_superadmin")
    .eq("id", session.user.id)
    .maybeSingle();
  return !!data?.is_admin || !!data?.is_superadmin;
}

async function insertNotifications(rows: {
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  request_id?: string | null;
  equipment_id?: string | null;
}[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.error("Failed to insert notifications:", error);
}

interface RequestNotificationContext {
  requestId: string | null
  equipmentId: string | null
  equipmentName: string
  borrowerId: string | null
  ownerId: string | null
  type: string
  bodyTitle: string
  bodyText: string
  skipSelf?: boolean
}

async function notifyRequestUsers(ctx: RequestNotificationContext) {
  try {
    const targets = new Set<string>()
    if (ctx.borrowerId) targets.add(ctx.borrowerId)
    if (ctx.ownerId) targets.add(ctx.ownerId)

    if (
      ctx.type === "owner_approved" ||
      ctx.type === "owner_rejected" ||
      ctx.type === "request_created"
    ) {
      for (const adminId of await fetchAdminIds()) targets.add(adminId)
    }

    if (ctx.skipSelf) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) targets.delete(session.user.id)
    }
    targets.delete("")

    const rows = [...targets].map((user_id) => ({
      user_id,
      type: ctx.type,
      title: ctx.bodyTitle,
      body: ctx.bodyText,
      request_id: ctx.requestId,
      equipment_id: ctx.equipmentId,
    }))
    await insertNotifications(rows)
  } catch (err) {
    console.error("notifyRequestUsers failed:", err)
  }
}

async function notifyDiscordDecision(
  request: Record<string, unknown>,
  decision: "Approved" | "Rejected",
  reason: string,
  decidedByOwner: boolean,
) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch("/api/notify-decision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        equipmentId: String(request.equipment_id ?? ""),
        equipmentName: String(request.equipment_name ?? request.equipment_requested ?? ""),
        borrowerName: String(request.borrower_name ?? request.full_name ?? ""),
        studentNumber: String(request.student_number ?? ""),
        quantity: Number(request.quantity ?? 1),
        reason: reason,
        decision,
        decidedByOwner,
        requestId: String(request.id ?? ""),
      }),
    });
  } catch {
    // fire-and-forget; never block the decision flow
  }
}

export async function fetchNotificationsForUser(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as unknown as NotificationRow[];
}

export async function fetchAdminNotifications(adminIds: string[]): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .in("user_id", adminIds)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as unknown as NotificationRow[];
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const query = supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (ids && ids.length > 0) {
    return query.in("id", ids);
  }
  return query.eq("read", false);
}

// Fallback cleanup: users clear their own read+expired rows (7 days after
// read) even if pg_cron is not enabled. Mirrors the RLS delete policy.
export async function sweepExpiredNotifications(userId: string) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .eq("read", true)
    .lt("read_at", cutoff);
  if (error) console.error("Notification sweep failed:", error);
}

async function notifyDiscordDms(
  targets: { userId: string; title: string; bodyText: string }[],
) {
  if (targets.length === 0) return;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch("/api/notify-dm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ targets }),
    });
  } catch {
    // fire-and-forget; never block the decision flow
  }
}

export async function fetchRequestsForEquipments(equipmentIds: string[]) {
  if (equipmentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .in("equipment_id", equipmentIds)
    .in("status", ["Pending", "Approved"])
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
    quantity: number;
    returned_on: string | null;
    position_department: string;
    pickup_location: string;
    return_location: string;
    owner: string;
    owner_status: string;
    owner_reason: string | null;
    discord_message_id: string | null;
  }[];
}

export async function setOwnerDecision(
  requestId: string,
  decision: "approved" | "rejected",
  reason: string,
) {
  const { data: request, error: fetchErr } = await supabase
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchErr || !request) throw new Error("Request not found");

  const isMyAdminFlag = await fetchMyAdminFlag();
  const ownerProfile = request.owner
    ? await fetchRegisteredOwnerId(request.owner)
    : null;

  if (!isMyAdminFlag && ownerProfile) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user || session.user.id !== ownerProfile) {
      throw new Error("Only the equipment owner can decide on this request.");
    }
  }

  const updates =
    decision === "approved"
      ? { owner_status: "approved", owner_reason: reason || null }
      : { owner_status: "rejected", owner_reason: reason || null, status: "Denied" };

  const { error } = await supabase
    .from("requests")
    .update(updates)
    .eq("id", requestId);
  if (error) throw error;

  if (decision === "approved") {
    void notifyRequestUsers({
      requestId,
      equipmentId: request.equipment_id ?? null,
      equipmentName: request.equipment_name ?? "",
      borrowerId: request.user_id ?? null,
      ownerId: ownerProfile,
      type: "owner_approved",
      bodyTitle: "Owner approved a request",
      bodyText: `The equipment owner approved the borrow request for ${request.equipment_name}. Awaiting SK officer approval.`,
      skipSelf: true,
    });

    void notifyDiscordDms(
      request.user_id
        ? [{
            userId: request.user_id,
            title: "Owner Approved Your Request",
            bodyText: `The equipment owner approved your request for ${request.equipment_name}. An SK officer will give the final approval.`,
          }]
        : [],
    );
  } else {
    const rejectBody = reason
      ? `The equipment owner rejected this request. Reason: ${reason}`
      : "The equipment owner rejected this request.";

    void notifyRequestUsers({
      requestId,
      equipmentId: request.equipment_id ?? null,
      equipmentName: request.equipment_name ?? "",
      borrowerId: request.user_id ?? null,
      ownerId: ownerProfile,
      type: "owner_rejected",
      bodyTitle: "Request rejected by owner",
      bodyText: rejectBody,
      skipSelf: true,
    });

    if (request.user_id) {
      void notifyDiscordDms([
        {
          userId: request.user_id,
          title: "Request Rejected by Owner",
          bodyText: rejectBody,
        },
      ]);
    }

    void notifyDiscordDecision(request, "Rejected", reason, true);
  }
}

export async function returnBorrowedItem(equipmentId: string, conditionAfter: string) {
  const { data: record } = await supabase
    .from("borrow_records")
    .select("*")
    .eq("equipment_id", equipmentId)
    .maybeSingle();

  const returnedOn = new Date().toISOString();

  const { error: recordErr } = await supabase
    .from("borrow_records")
    .update({
      returned_on: returnedOn,
      condition_after: conditionAfter,
    })
    .eq("equipment_id", equipmentId);

  if (recordErr) throw recordErr;

  const { error: requestErr } = await supabase
    .from("requests")
    .update({ status: "Returned", returned_on: returnedOn })
    .eq("equipment_id", equipmentId)
    .eq("status", "Approved");

  if (requestErr) console.error("Failed to sync request status:", requestErr);

  const { error: equipErr } = await supabase
    .from("equipments")
    .update({
      condition: conditionAfter,
      borrower_name: null,
      date_borrowed: null,
      date_due: null,
    })
    .eq("equipment_id", equipmentId);

  if (equipErr) console.error("Failed to reset equipment:", equipErr);

  if (record) {
    void syncDiscordStatus(record, "Returned", null);
  }
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
  user_id: string | null
  discord_message_id?: string | null
  condition_before?: string
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
    returned_on: string | null
    notes: string
    scanned_by: string
    user_id: string | null
    created_at: string
    updated_at: string
    discord_message_id: string | null
  }[];
}

export async function fetchBorrowedItemsByUser(userId: string) {
  const { data, error } = await supabase
    .from("borrow_records")
    .select("*")
    .eq("user_id", userId)
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
    returned_on: string | null
    notes: string
    scanned_by: string
    user_id: string | null
    created_at: string
    updated_at: string
    discord_message_id: string | null
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
      user_id: data.user_id,
      discord_message_id: data.discord_message_id ?? null,
      returned_on: null,
      condition_before: data.condition_before ?? null,
      condition_after: null,
      notes: null,
    });

  if (error) throw error;

  const { error: updateErr } = await supabase
    .from("equipments")
    .update({
      borrower_name: data.full_name,
      date_borrowed: data.date_time_borrowing || null,
      date_due: data.date_time_return || null,
      condition: "Unavailable",
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

export async function deleteBorrowedItem(equipmentId: string) {
  const { data: records } = await supabase
    .from("borrow_records")
    .select("*")
    .eq("equipment_id", equipmentId);

  const record = records?.[0] ?? null;
  const conditionBefore = record?.condition_before ?? "";

  const { error } = await supabase
    .from("borrow_records")
    .delete()
    .eq("equipment_id", equipmentId);
  if (error) throw error;

  const { error: equipErr } = await supabase
    .from("equipments")
    .update({
      condition: conditionBefore || "Working",
      borrower_name: null,
      date_borrowed: null,
      date_due: null,
    })
    .eq("equipment_id", equipmentId);

  if (equipErr) console.error("Failed to sync equipment:", equipErr);

  if (record) {
    void syncDiscordStatus(record, "Deleted", null);
  }
}

export interface Grading {
  id: string;
  date: string;
  event_name: string;
  member_name: string;
  shots_posted: number;
  notes: string;
  tech_execution: number;
  creative_impact: number;
  brand_alignment: number;
  revision_factor: number;
  status: string | null;
  role: string | null;
  duration: string | null;
  attendance: string | null;
  points: number | null;
  camera_used: string | null;
  lenses_used: string | null;
  created_at: string;
  created_by: string;
}

export function computeOutputQuality(tech: number, creative: number, brand: number, revision: number): number {
  return ((tech + creative + brand + revision) / 16) * 0.3;
}

export async function fetchGradings(): Promise<Grading[]> {
  const { data, error } = await supabase
    .from("gradings")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Grading[];
}

export async function addGrading(
  row: Omit<Grading, "id" | "created_at" | "created_by">,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("gradings")
    .insert({ ...row, created_by: user?.id });
  if (error) throw error;
}

export async function updateGrading(
  id: string,
  row: Partial<Omit<Grading, "id" | "created_at" | "created_by">>,
): Promise<void> {
  const { error } = await supabase
    .from("gradings")
    .update(row)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGrading(id: string): Promise<void> {
  const { error } = await supabase.from("gradings").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadQRCode(equipmentId: string): Promise<string> {
  const path = `qr-codes/${equipmentId}.png`

  const { data: existing } = await supabase.storage
    .from("sk-equipments")
    .download(path)

  if (existing) {
    const { data: publicUrlData } = supabase.storage
      .from("sk-equipments")
      .getPublicUrl(path)
    return publicUrlData.publicUrl
  }

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin
  const qrContent = `${baseUrl}/equipment?id=${equipmentId}`

  const { default: QRCode } = await import("qrcode")
  const qrDataUrl = await QRCode.toDataURL(qrContent, {
    width: 300,
    margin: 2,
  })

  const base64 = qrDataUrl.split(",")[1]
  const byteString = atob(base64)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
  const blob = new Blob([ab], { type: "image/png" })

  const { error: uploadErr } = await supabase.storage
    .from("sk-equipments")
    .upload(path, blob, { contentType: "image/png", upsert: false })

  if (uploadErr) {
    const { data: publicUrlData } = supabase.storage
      .from("sk-equipments")
      .getPublicUrl(path)
    return publicUrlData.publicUrl
  }

  const { data: publicUrlData } = supabase.storage
    .from("sk-equipments")
    .getPublicUrl(path)
  return publicUrlData.publicUrl
}
