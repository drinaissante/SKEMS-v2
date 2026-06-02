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
- Extract exactly what is written on the form
- Preserve numbers and punctuation exactly as written
- equipment_list: extract each equipment item as a separate object with "item" and "quantity" keys. For example: "Two (2) Bendiro Lights" → {"item": "Bendiro Lights", "quantity": "2"}; "One (1) Light Diffuser" → {"item": "Light Diffuser", "quantity": "1"}. If no quantity is specified, use "1".
- If the form uses a numbered/bulleted list (1., 2., a., b., •, etc.), extract ALL items as separate entries in the array.
- For each entry, strip quantity/count prefixes from the item name (e.g. "3x Light Stand" → "Light Stand"; "1.) Light Stands" → "Light Stands").`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    console.error("Method not allowed:", req.method);
    return res.status(405).json({ error: "Something went wrong. Please try again in a few minutes." });
  }

  const { image } = req.body;
  if (!image) {
    console.error("No image provided");
    return res.status(400).json({ error: "Something went wrong. Please try again in a few minutes." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not configured");
    return res.status(500).json({ error: "Something went wrong. Please try again in a few minutes." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const MODELS = ["gemini-2.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3-flash", "gemini-3.5-flash"];

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
      console.error("All models overloaded:", msg);
      return res.status(503).json({
        error: "Service is currently unavailable due to high demand. Please try again later.",
      });
    }
    console.error("All models failed:", msg);
    return res.status(500).json({ error: "Something went wrong. Please try again in a few minutes." });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again in a few minutes." });
  }
}
