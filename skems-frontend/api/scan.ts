import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

interface EquipmentEntry {
  equipment_id: string;
  name: string;
}

function findBestMatch(
  itemName: string,
  equipmentList: EquipmentEntry[],
): { equipment_id: string; name: string; score: number } | null {
  const item = itemName.toLowerCase().trim();
  if (!item) return null;

  const itemTokens = item.split(/\s+/).filter((t) => t.length >= 3);
  let best: { equipment_id: string; name: string; score: number } | null = null;
  let bestScore = 0;

  for (const eq of equipmentList) {
    const name = eq.name.toLowerCase().trim();

    if (name === item)
      return { equipment_id: eq.equipment_id, name: eq.name, score: 1.0 };

    let score = 0;
    if (name.includes(item)) {
      score = 0.9;
    } else if (item.includes(name)) {
      score = 0.8;
    } else if (itemTokens.length > 0) {
      const dbTokens = name.split(/\s+/).filter((t) => t.length >= 3);
      const common = itemTokens.filter((t) => dbTokens.includes(t)).length;
      if (common > 0) {
        score = 0.7 * (common / Math.max(itemTokens.length, dbTokens.length));
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = { equipment_id: eq.equipment_id, name: eq.name, score };
    }
  }

  return bestScore >= 0.5 ? best : null;
}

const PROMPT = `You are a form OCR system. Extract the following fields from this form image.

CRITICAL: Respond with ONLY a raw JSON object. No markdown, no code fences, no backticks, no greetings, no explanations, no extra text before or after.

Use exactly these keys:
{
  "full_name": "",
  "student_number": "",
  "date": "",
  "position_department": "",
  "owner": "",
  "equipment_list": [],
  "purpose_of_use": "",
  "date_time_borrowing": "",
  "date_time_return": "",
  "pickup_location": "",
  "return_location": ""
}

Rules:
- Ignore the form header/title text (e.g. "Borrowing Form", "SK", "Sine Kultura Office", logos, etc.) — only extract the filled-in data
- Use proper spacing between words (e.g. "JamesGabrielDeLuna" → "James Gabriel De Luna")
- For dates use format like "March 30, 2026"
- If a field is not visible or empty, set it to null — do not guess
- If the image does not contain a borrowing form or any readable form data, return ALL fields as null and equipment_list as an empty array — do not hallucinate or guess values
- Extract exactly what is written on the form
- Preserve numbers and punctuation exactly as written
- Only extract the quantity and equipment name exactly as written on the form — do not infer or calculate quantities from inventory or context
- equipment_list: extract each equipment item as a separate object with "item" and "quantity" keys. For example: "Two (2) Bendiro Lights" → {"item": "Bendiro Lights", "quantity": "2"}; "One (1) Light Diffuser" → {"item": "Light Diffuser", "quantity": "1"}. If no quantity is specified, use "1".
- Also handle patterns where the quantity comes after the equipment name: "Bendiro Lights - 2" → {"item": "Bendiro Lights", "quantity": "2"}; "Light Stand: 1" → {"item": "Light Stand", "quantity": "1"}; "Lights (2)" → {"item": "Lights", "quantity": "2"}.
- If the form uses a numbered/bulleted list (1., 2., a., b., •, etc.), extract ALL items as separate entries in the array.
- For each entry, strip quantity/count prefixes from the item name (e.g. "3x Light Stand" → "Light Stand"; "1.) Light Stands" → "Light Stands").`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    console.error("Method not allowed:", req.method);
    return res.status(405).json({
      error: "Something went wrong. Please try again in a few minutes.",
    });
  }

  const { image } = req.body;
  if (!image) {
    console.error("No image provided");
    return res.status(400).json({
      error: "Something went wrong. Please try again in a few minutes.",
    });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase env vars not configured");
    return res.status(500).json({
      error: "Something went wrong. Please try again in a few minutes.",
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const token = authHeader.slice(7);

  const authClient = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const {
    data: { user: authUser },
    error: authError,
  } = await authClient.auth.getUser(token);
  if (authError || !authUser) {
    console.error("Auth check failed:", authError?.message);
    return res.status(401).json({ error: "Authentication required." });
  }

  const { data: profile, error: profileError } = await authClient
    .from("profiles")
    .select("is_admin, is_superadmin")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile?.is_admin) {
    console.error("Admin check failed:", profileError?.message);
    return res
      .status(403)
      .json({ error: "You do not have permission to scan forms." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not configured");
    return res.status(500).json({
      error: "Something went wrong. Please try again in a few minutes.",
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const MODELS = [
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-3-flash",
      "gemini-3.5-flash",
    ];

    let lastError: unknown;
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: 1000 },
        });

        const result = await model.generateContent([
          PROMPT,
          { inlineData: { mimeType: "image/jpeg", data: image } },
        ]);

        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(
            "Gemini response did not contain valid JSON:",
            text.substring(0, 500),
          );
          return res.status(500).json({
            error: "Something went wrong. Please try again in a few minutes.",
          });
        }

        const fields = JSON.parse(jsonMatch[0]);
        if (Array.isArray(fields.equipment_list)) {
          fields.equipment_list = fields.equipment_list.map(
            (e: { item?: string; quantity?: string }) => {
              let name = (e.item || "").trim();
              let qty = e.quantity || "";
              const trail = name.match(
                /\s*[—–\-:]\s*(\d+)\s*$|\((\d+)\)\s*$|\s*x(\d+)\s*$/i,
              );
              if (trail) {
                const n = trail[1] || trail[2] || trail[3];
                if (n && (!qty || qty === "1")) qty = n;
                name = name
                  .replace(/[—–\-:]\s*\d+\s*$/, "")
                  .replace(/\(\d+\)\s*$/, "")
                  .replace(/x\d+\s*$/i, "")
                  .trim();
              }
              return { item: name, quantity: qty || "1" };
            },
          );
        }

        try {
          if (Array.isArray(fields.equipment_list)) {
            const { data: equipData, error: equipErr } = await authClient
              .from("equipments")
              .select("equipment_id, name");

            if (!equipErr && equipData && equipData.length > 0) {
              fields.equipment_list = fields.equipment_list.map(
                (e: { item: string; quantity: string }) => {
                  const match = findBestMatch(e.item, equipData);

                  if (match) {
                    return { item: match.name, quantity: e.quantity };
                  }

                  return e;
                },
              );
            }
          }
        } catch (e) {
          console.error("Equipment matching failed:", e);
        }

        return res.status(200).json({ fields });
      } catch (err) {
        lastError = err;
      }
    }

    const msg =
      lastError instanceof Error ? lastError.message : "Unknown error";

    if (/spikes|high demand/i.test(msg)) {
      console.error("All models overloaded:", msg);
      return res.status(503).json({
        error:
          "Service is currently unavailable due to high demand. Please try again later.",
      });
    }

    console.error("All models failed:", msg);
    return res.status(500).json({
      error: "Something went wrong. Please try again in a few minutes.",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      error: "Something went wrong. Please try again in a few minutes.",
    });
  }
}
