import type { VercelRequest, VercelResponse } from "@vercel/node";

interface Equipment {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const serviceEmail = process.env.SERVICE_ACCOUNT_EMAIL;
  const serviceKey = process.env.SERVICE_ACCOUNT_KEY;
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!serviceEmail || !serviceKey || !spreadsheetId) {
    return res.status(500).json({ ok: false, error: "Server not configured" });
  }

  const items: Equipment[] = req.body.items;
  if (!Array.isArray(items)) {
    return res.status(400).json({ ok: false, error: "Missing items array" });
  }

  try {
    const keyJson = JSON.parse(
      Buffer.from(serviceKey, "base64").toString("utf-8"),
    );
    const { GoogleAuth } = await import("google-auth-library");
    const { google } = await import("googleapis");

    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceEmail,
        private_key: keyJson.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const range = "Inventory!A:K";

    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const existingRows = getRes.data.values ?? [];
    const headerRowIdx = existingRows.findIndex((r) => r.includes("Item ID"));

    if (headerRowIdx === -1) {
      return res.status(400).json({
        ok: false,
        error: 'Column "Item ID" not found in sheet',
      });
    }

    const idCol = existingRows[headerRowIdx].indexOf("Item ID");
    const dataStart = headerRowIdx + 1;

    const idToRow = new Map<string, number>();
    for (let i = dataStart; i < existingRows.length; i++) {
      const row = existingRows[i];
      if (!row || row.length === 0 || !row[idCol]) continue;
      const idVal = String(row[idCol]).trim();
      if (idVal) idToRow.set(idVal, i + 1);
    }

    const mapRow = (eq: Equipment) => [
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

    const updates: { range: string; values: string[][] }[] = [];
    const newRows: string[][] = [];

    for (const eq of items) {
      const row = idToRow.get(eq.id);
      const vals = mapRow(eq);
      if (row) {
        updates.push({ range: `Inventory!A${row}:K${row}`, values: [vals] });
      } else {
        newRows.push(vals);
      }
    }

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          data: updates,
          valueInputOption: "USER_ENTERED",
        },
      });
    }

    if (newRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Inventory!A:K",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: newRows },
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
