export const GOOGLE_CLIENT_ID =
  "324648609005-4ogad7i2cnfkti5rosnkf3qdfm75040v.apps.googleusercontent.com";
export const SPREADSHEET_ID = "1RzsD2H-uqNf1svnlaYiqNtwOk9iUEy3aeUZ0eVNeJgA";

const MOCK_EQUIPMENTS: Equipment[] = [
  {
    id: "SK-001",
    name: "Canon EOS R5",
    category: "Camera Gear",
    image: "/sk_icon.jpg",
    owner: "John Tan",
    dateGivenToSK: "2025-01-15",
    condition: "Working",
    comments: "Includes 24-105mm lens",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-002",
    name: "Sony A7 III",
    category: "Camera Gear",
    image: "/sk_icon.jpg",
    owner: "Sarah Lim",
    dateGivenToSK: "2025-02-01",
    condition: "Working",
    comments: "Needs battery replacement soon",
    borrowerName: "Ali Baba",
    dateBorrowed: "2025-03-10",
    dateDue: "2025-03-24",
  },
  {
    id: "SK-003",
    name: "Godox SL150W",
    category: "Lighting Equipment",
    image: "/sk_icon.jpg",
    owner: "SK Supply",
    dateGivenToSK: "2024-11-20",
    condition: "Needs Repair",
    comments: "Bulb needs replacement",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-004",
    name: "Rode NTG4+",
    category: "Wireless Microphones",
    image: "/sk_icon.jpg",
    owner: "Mike Chen",
    dateGivenToSK: "2025-03-01",
    condition: "Working",
    comments: "Shotgun microphone",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-005",
    name: "DJI RS 3 Pro",
    category: "Camera Gear",
    image: "/sk_icon.jpg",
    owner: "David Wong",
    dateGivenToSK: "2025-01-10",
    condition: "Working",
    comments: "Gimbal stabilizer",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-006",
    name: "Aputure 120D II",
    category: "Lighting Equipment",
    image: "/sk_icon.jpg",
    owner: "SK Supply",
    dateGivenToSK: "2024-09-05",
    condition: "Working",
    comments: "With softbox and stand",
    borrowerName: "Jane Doe",
    dateBorrowed: "2025-03-12",
    dateDue: "2025-03-26",
  },
  {
    id: "SK-007",
    name: "Fujifilm X-T5",
    category: "Camera Gear",
    image: "/sk_icon.jpg",
    owner: "Emily Ng",
    dateGivenToSK: "2025-04-01",
    condition: "Working",
    comments: "With 35mm f/1.4 lens",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-008",
    name: "Sennheiser MKH 416",
    category: "Wireless Microphones",
    image: "/sk_icon.jpg",
    owner: "SK Supply",
    dateGivenToSK: "2025-02-14",
    condition: "Not checked",
    comments: "Boom microphone kit",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-009",
    name: "Nanlite Forza 60C",
    category: "Lighting Equipment",
    image: "/sk_icon.jpg",
    owner: "Chris Lim",
    dateGivenToSK: "2025-03-20",
    condition: "Working",
    comments: "RGB full-color LED",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-010",
    name: "GoPro Hero 12",
    category: "Camera Gear",
    image: "/sk_icon.jpg",
    owner: "Alex Tan",
    dateGivenToSK: "2025-04-10",
    condition: "Working",
    comments: "With waterproof housing",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-011",
    name: "Shure SM7B",
    category: "Wireless Microphones",
    image: "/sk_icon.jpg",
    owner: "SK Supply",
    dateGivenToSK: "2024-12-01",
    condition: "Needs Repair",
    comments: "Needs XLR cable replacement",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-012",
    name: "Aputure MC Pro",
    category: "Lighting Equipment",
    image: "/sk_icon.jpg",
    owner: "Sarah Lim",
    dateGivenToSK: "2025-01-25",
    condition: "Working",
    comments: "Tiny RGB LED panel set",
    borrowerName: "Bob Lee",
    dateBorrowed: "2025-03-15",
    dateDue: "2025-03-29",
  },
  {
    id: "SK-013",
    name: "Blackmagic Pocket 6K",
    category: "Camera Gear",
    image: "/sk_icon.jpg",
    owner: "David Wong",
    dateGivenToSK: "2025-02-28",
    condition: "Working",
    comments: "With SSD recorder rig",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-014",
    name: "Hollyland Mars 400S",
    category: "Communication Equipment",
    image: "/sk_icon.jpg",
    owner: "SK Supply",
    dateGivenToSK: "2025-03-05",
    condition: "Working",
    comments: "Wireless video transmitter",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-015",
    name: "K&F Concept Tripod",
    category: "Stands & Mounts",
    image: "/sk_icon.jpg",
    owner: "Emily Ng",
    dateGivenToSK: "2024-10-15",
    condition: "Working",
    comments: "Carbon fiber, fluid head",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-016",
    name: "Rode Wireless GO II",
    category: "Wireless Microphones",
    image: "/sk_icon.jpg",
    owner: "Mike Chen",
    dateGivenToSK: "2025-04-05",
    condition: "Working",
    comments: "Dual-channel wireless mic",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-017",
    name: "Godox Softbox 120cm",
    category: "Lighting Equipment",
    image: "/sk_icon.jpg",
    owner: "SK Supply",
    dateGivenToSK: "2024-08-20",
    condition: "Not checked",
    comments: "Rodents chewed through fabric",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
  {
    id: "SK-018",
    name: 'SmallHD Focus 5"',
    category: "Special Effects & Accessories",
    image: "/sk_icon.jpg",
    owner: "Chris Lim",
    dateGivenToSK: "2025-03-18",
    condition: "Working",
    comments: "On-camera monitor",
    borrowerName: "",
    dateBorrowed: "",
    dateDue: "",
  },
];

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

export interface BorrowRequest {
  equipmentId: string;
  borrowerName: string;
  studentNumber: string;
  reason: string;
  dateBorrowed: string;
  dateDue: string;
}

async function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchEquipments(): Promise<Equipment[]> {
  await delay();
  return [...MOCK_EQUIPMENTS];
}

export async function submitBorrowRequest(
  data: BorrowRequest,
): Promise<{ success: boolean }> {
  await delay();

  const idx = MOCK_EQUIPMENTS.findIndex((e) => e.id === data.equipmentId);

  if (idx !== -1) {
    MOCK_EQUIPMENTS[idx] = {
      ...MOCK_EQUIPMENTS[idx],
      borrowerName: data.borrowerName,
      dateBorrowed: data.dateBorrowed,
      dateDue: data.dateDue,
      comments: data.reason,
    };
  }
  return { success: true };
}

export async function addEquipment(
  equipment: Omit<Equipment, "id">,
): Promise<Equipment> {
  await delay();
  const numbers = MOCK_EQUIPMENTS.map((e) =>
    parseInt(e.id.replace("SK-", ""), 10),
  ).filter((n) => !isNaN(n));
  const nextNum = numbers.length ? Math.max(...numbers) + 1 : 1;
  const newId = `SK-${String(nextNum).padStart(3, "0")}`;
  const newEq: Equipment = { id: newId, ...equipment };
  MOCK_EQUIPMENTS.push(newEq);
  return newEq;
}

export async function updateEquipment(
  id: string,
  data: Partial<Equipment>,
): Promise<void> {
  await delay();
  const idx = MOCK_EQUIPMENTS.findIndex((e) => e.id === id);
  if (idx !== -1) {
    MOCK_EQUIPMENTS[idx] = { ...MOCK_EQUIPMENTS[idx], ...data };
  }
}

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const PENDING_EXPORT_KEY = "skems_pending_export";
const AUTH_STATE_KEY = "skems_auth_state";
const TOKEN_KEY = "skems_google_token";

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
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("")
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
