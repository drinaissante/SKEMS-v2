import { supabase } from "./supabase";

export const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
export const SPREADSHEET_ID = import.meta.env.GOOGLE_SPREADSHEET_ID;

export interface Equipment {
  id: string;
  name: string;
  category: string;
  image: string;
  owner: string;
  dateGivenToSK: string;
  condition: string;
  comments: string;
  borrowerName: string;
  dateBorrowed: string;
  dateDue: string;
}

function mapRowToEquipment(row: Record<string, unknown>): Equipment {
  return {
    id: row.equipment_id as string,
    name: row.name as string,
    category: row.category as string,
    image: (row.image as string) ?? "",
    owner: row.owner as string,
    dateGivenToSK: (row.date_given_to_sk as string) ?? "",
    condition: row.condition as string,
    comments: (row.comments as string) ?? "",
    borrowerName: (row.borrower_name as string) ?? "",
    dateBorrowed: (row.date_borrowed as string) ?? "",
    dateDue: (row.date_due as string) ?? "",
  };
}

export async function fetchEquipments(): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from("equipments")
    .select("*")
    .order("equipment_id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRowToEquipment);
}

export async function addEquipment(
  equipment: Omit<Equipment, "id">,
): Promise<Equipment> {
  const { data: maxRow } = await supabase
    .from("equipments")
    .select("equipment_id")
    .order("equipment_id", { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (maxRow?.equipment_id) {
    const num = parseInt((maxRow.equipment_id as string).replace("SK-", ""), 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const newId = `SK-${String(nextNum).padStart(3, "0")}`;

  const { error } = await supabase.from("equipments").insert({
    equipment_id: newId,
    name: equipment.name,
    category: equipment.category,
    image: equipment.image,
    owner: equipment.owner,
    date_given_to_sk: equipment.dateGivenToSK || null,
    condition: equipment.condition,
    comments: equipment.comments,
    borrower_name: equipment.borrowerName || null,
    date_borrowed: equipment.dateBorrowed || null,
    date_due: equipment.dateDue || null,
  });
  if (error) throw error;

  return { id: newId, ...equipment };
}

export async function updateEquipment(
  id: string,
  data: Partial<Equipment>,
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.owner !== undefined) updateData.owner = data.owner;
  if (data.dateGivenToSK !== undefined) updateData.date_given_to_sk = data.dateGivenToSK;
  if (data.condition !== undefined) updateData.condition = data.condition;
  if (data.comments !== undefined) updateData.comments = data.comments;
  if (data.borrowerName !== undefined) updateData.borrower_name = data.borrowerName;
  if (data.dateBorrowed !== undefined) updateData.date_borrowed = data.dateBorrowed;
  if (data.dateDue !== undefined) updateData.date_due = data.dateDue;

  const { error } = await supabase
    .from("equipments")
    .update(updateData)
    .eq("equipment_id", id);
  if (error) throw error;
}

export async function deleteEquipment(id: string): Promise<void> {
  const { error } = await supabase
    .from("equipments")
    .delete()
    .eq("equipment_id", id);
  if (error) throw error;
}

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const PENDING_EXPORT_KEY = import.meta.env.PENDING_EXPORT_KEY;
const AUTH_STATE_KEY = import.meta.env.AUTH_STATE_KEY;
const TOKEN_KEY = import.meta.env.TOKEN_KEY;

function mapEquipmentToRow(eq: Equipment): string[] {
  return [
    eq.id,
    eq.name,
    eq.image ? `=IMAGE("${eq.image}")` : "",
    eq.category,
    eq.owner,
    eq.borrowerName,
    eq.condition,
    eq.dateGivenToSK,
    eq.dateBorrowed,
    eq.dateDue,
    eq.comments,
  ];
}

function generateState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function startGoogleAuth(items: Equipment[]): void {
  const state = generateState();
  localStorage.setItem(AUTH_STATE_KEY, state);
  localStorage.setItem(PENDING_EXPORT_KEY, JSON.stringify(items));
  const redirectUri = `${window.location.origin}/equipments`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SHEETS_SCOPE,
    state,
    include_granted_scopes: "true",
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function completeGoogleAuth(): {
  token: string;
  items: Equipment[];
} | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hash = window.location.hash || (window as any).__GOOGLE_AUTH_HASH || "";
  if (!hash || !hash.includes("access_token")) return null;

  const params = new URLSearchParams(hash.replace(/^#/, "?"));
  const state = params.get("state");
  const token = params.get("access_token");

  const storedState = localStorage.getItem(AUTH_STATE_KEY);
  if (!token || !state || state !== storedState) {
    clearGoogleAuth();
    return null;
  }

  const itemsJson = localStorage.getItem(PENDING_EXPORT_KEY);
  if (!itemsJson) {
    clearGoogleAuth();
    return null;
  }

  try {
    const items = JSON.parse(itemsJson) as Equipment[];
    localStorage.setItem(TOKEN_KEY, token);
    window.history.replaceState({}, "", window.location.pathname);
    return { token, items };
  } catch {
    clearGoogleAuth();
    return null;
  }
}

export function clearGoogleAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PENDING_EXPORT_KEY);
  localStorage.removeItem(AUTH_STATE_KEY);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function exportToSheets(
  items: Equipment[],
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!GOOGLE_CLIENT_ID || !SPREADSHEET_ID) {
    return {
      ok: false,
      error: "Google Client ID or Spreadsheet ID not configured in api.ts",
    };
  }

  try {
    const auth = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    } as const;

    // 1. Read existing sheet data
    const getRes = await fetch(
      `${SHEETS_API}/${SPREADSHEET_ID}/values/Inventory!A:K`,
      { headers: auth },
    );

    if (!getRes.ok) {
      return { ok: false, error: `Failed to read sheet (${getRes.status})` };
    }

    const getData: { values?: string[][] } = await getRes.json();
    const existingRows = getData.values ?? [];
    const headerRow = existingRows[1] ?? [];

    // 2. Locate the Item ID column
    const idCol = headerRow.indexOf("Item ID");
    if (idCol === -1) {
      return {
        ok: false,
        error:
          'Column "Item ID" not found — make sure Row 2 has the correct headers',
      };
    }

    // 3. Build ID → row-number map (1-based, row 1 = title, row 2 = header)
    const idToRow = new Map<string, number>();
    for (let i = 2; i < existingRows.length; i++) {
      const idVal = existingRows[i][idCol];
      if (idVal) idToRow.set(idVal, i + 1);
    }

    // 4. Separate items into updates and new rows
    const updates: { row: number; values: string[] }[] = [];
    const newRows: string[][] = [];

    for (const eq of items) {
      const row = idToRow.get(eq.id);
      const vals = mapEquipmentToRow(eq);
      if (row) {
        updates.push({ row, values: vals });
      } else {
        newRows.push(vals);
      }
    }

    // 5. Batch update existing rows
    if (updates.length > 0) {
      const data = updates.map((u) => ({
        range: `Inventory!A${u.row}:K${u.row}`,
        values: [u.values],
      }));
      const putRes = await fetch(
        `${SHEETS_API}/${SPREADSHEET_ID}/values:batchUpdate`,
        {
          method: "POST",
          headers: auth,
          body: JSON.stringify({ data, valueInputOption: "USER_ENTERED" }),
        },
      );
      if (!putRes.ok) {
        const body = await putRes.text();
        return {
          ok: false,
          error: `Batch update failed (${putRes.status}): ${body}`,
        };
      }
    }

    // 6. Append new rows
    if (newRows.length > 0) {
      const appendRes = await fetch(
        `${SHEETS_API}/${SPREADSHEET_ID}/values/Inventory!A:K:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: "POST",
          headers: auth,
          body: JSON.stringify({ values: newRows }),
        },
      );
      if (!appendRes.ok) {
        const body = await appendRes.text();
        return {
          ok: false,
          error: `Append failed (${appendRes.status}): ${body}`,
        };
      }
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
