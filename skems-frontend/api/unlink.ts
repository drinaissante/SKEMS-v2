import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const safeEqual = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secret = process.env.LINK_SECRET;
  const authHeader = req.headers.authorization;
  if (
    !secret ||
    !authHeader?.startsWith("Bearer ") ||
    !safeEqual(authHeader.slice(7), secret)
  ) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const { discordId } = req.body ?? {};
  if (!discordId) {
    return res.status(400).json({ ok: false, error: "Missing discordId" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[unlink] Supabase env vars not configured");
    return res.status(500).json({ ok: false, error: "Server not configured" });
  }

  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const { data: existing, error: findErr } = await serviceClient
      .from("discord_links")
      .select("user_id")
      .eq("discord_id", discordId)
      .maybeSingle();

    if (findErr) {
      console.error("[unlink] Lookup failed:", findErr);
      return res.status(500).json({ ok: false, error: "Server error" });
    }

    if (!existing) {
      return res.status(404).json({ ok: false, error: "not linked" });
    }

    const { error: delErr } = await serviceClient
      .from("discord_links")
      .delete()
      .eq("discord_id", discordId);

    if (delErr) {
      console.error("[unlink] Delete failed:", delErr);
      return res.status(500).json({ ok: false, error: "Server error" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[unlink] Unexpected error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
