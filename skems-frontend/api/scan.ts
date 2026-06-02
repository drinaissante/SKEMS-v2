import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const FIELDS = [
  { key: "full_name", label: "Full Name" },
  { key: "date", label: "Date" },
  { key: "position_department", label: "Position/Department" },
  { key: "owner", label: "Owner" },
  { key: "equipment_requested", label: "Equipment Requested" },
  { key: "purpose_of_use", label: "Purpose of Use" },
  { key: "date_time_borrowing", label: "Date & Time of Borrowing" },
  { key: "date_time_return", label: "Date & Time of Return" },
  { key: "pickup_location", label: "Pickup Location" },
  { key: "return_location", label: "Return Location" },
];

const PROMPT = `You are a form OCR system. Extract the following fields from this form image.
Return ONLY valid JSON with these exact keys (no markdown, no code fences, no extra text):

{
  "full_name": "",
  "date": "",
  "position_department": "",
  "owner": "",
  "equipment_requested": "",
  "purpose_of_use": "",
  "date_time_borrowing": "",
  "date_time_return": "",
  "pickup_location": "",
  "return_location": ""
}

Rules:
- Use proper spacing between words (e.g. "JamesGabrielDeLuna" → "James Gabriel De Luna")
- For dates use format like "March 30, 2026"
- If a field is not visible or empty, set it to null — do not guess
- Extract exactly what is written on the form
- Preserve numbers and punctuation exactly as written
- For equipment_requested: if the form uses a numbered/bulleted list (1., 2., a., b., •, etc.), extract ALL items, remove the numbering, and join them with semicolons — e.g. "1.) Light Stands 2.) Lights" becomes "Light Stands; Lights"
- For equipment_requested: strip quantity/count prefixes from each item — e.g. "Two (2) Bendiro Lights" → "Bendiro Lights"; "One (1) Light Diffuser" → "Light Diffuser"; "3x Microphone" → "Microphone"
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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
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
      return res.status(500).json({ error: "Gemini response did not contain valid JSON" });
    }

    const fields = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ fields });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}
