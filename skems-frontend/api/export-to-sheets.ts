import type { VercelRequest, VercelResponse } from "@vercel/node";

const SK_ICON_URL = "https://mlsupahnubyokjczsevp.supabase.co/storage/v1/object/public/sk-equipments/sk_icon.jpg";

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

    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: ["Inventory"],
      fields: "sheets.properties(sheetId,title)",
    });
    const sheetId = sheetRes.data.sheets?.[0]?.properties?.sheetId;
    if (sheetId === undefined) {
      return res.status(500).json({ ok: false, error: "Sheet not found" });
    }

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

    const dataStartRow = headerRowIdx + 2;

    const mapRow = (eq: Equipment) => [
      eq.id,
      eq.name,
      eq.image ? `=IMAGE("${eq.image}")` : `=IMAGE("${SK_ICON_URL}")`,
      eq.category,
      eq.owner,
      eq.borrowerName,
      eq.condition,
      eq.dateGivenToSK,
      eq.dateBorrowed,
      eq.dateDue,
      eq.comments,
    ];

    const dataRows = items.map(mapRow);

    const clearRange = `Inventory!A${dataStartRow}:K${headerRowIdx + existingRows.length}`;
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: clearRange,
    });

    if (dataRows.length > 0) {
      const writeEndRow = dataStartRow + dataRows.length - 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Inventory!A${dataStartRow}:K${writeEndRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: dataRows },
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: dataStartRow - 1,
                endIndex: dataStartRow + dataRows.length - 1,
              },
              properties: { pixelSize: 80 },
              fields: "pixelSize",
            },
          }],
        },
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
