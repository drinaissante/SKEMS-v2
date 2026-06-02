import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = `You are a form OCR system. Extract the following fields from this form image.

CRITICAL: Respond with ONLY a raw JSON object. No markdown, no code fences, no backticks, no greetings, no explanations, no extra text before or after.

Use exactly these keys:
{
  "full_name": "",
  "date": "",
  "position_department": "",
  "owner": "",
  "quantity": "",
  "equipment_requested": "",
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
- Extract exactly what is written on the form
- Preserve numbers and punctuation exactly as written
- quantity: extract the total count/number of items being borrowed (e.g. "Two (2) Bendiro Lights" → quantity: "2"); if not specified, set to "1"
- For equipment_requested: if the form uses a numbered/bulleted list (1., 2., a., b., •, etc.), extract ALL items, remove the numbering, and join them with semicolons — e.g. "1.) Light Stands 2.) Lights" becomes "Light Stands; Lights"
- For equipment_requested: remove any quantity/count prefixes from each item — e.g. "Two (2) Bendiro Lights" → "Bendiro Lights"; "One (1) Light Diffuser" → "Light Diffuser"
- List multiple equipment items separated by semicolons`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "No image provided" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const MODELS = ["gemini-2.5-flash", "gemini-3-flash", "gemini-1.5-flash"];

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
          console.error("Gemini response did not contain valid JSON:", text.substring(0, 500));
          return res.status(500).json({
            error: "Something went wrong. Please try again in a few minutes.",
          });
        }

        const fields = JSON.parse(jsonMatch[0]);
        return res.status(200).json({ fields });
      } catch (err) {
        lastError = err;
      }
    }

    const msg = lastError instanceof Error ? lastError.message : "Unknown error";
    if (/spikes|high demand/i.test(msg)) {
      return res.status(503).json({
        error: "Service is currently unavailable due to high demand. Please try again later.",
      });
    }
    return res.status(500).json({ error: msg });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
