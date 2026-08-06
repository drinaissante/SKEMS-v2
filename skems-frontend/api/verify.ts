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

  const { code, discordId, discordUsername, discordGlobalName, discordAvatar } =
    req.body ?? {};
  if (!code || !discordId) {
    return res.status(400).json({ ok: false, error: "Missing code or discordId" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[verify] Supabase env vars not configured");
    return res.status(500).json({ ok: false, error: "Server not configured" });
  }

  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const { data: profile, error: profileErr } = await serviceClient
      .from("profiles")
      .select("id, full_name")
      .eq("link_code", code)
      .maybeSingle();

    if (profileErr) {
      console.error("[verify] Profile lookup failed:", profileErr);
      return res.status(500).json({ ok: false, error: "Server error" });
    }

    if (!profile) {
      return res.status(200).json({ valid: false });
    }

    const { data: existing, error: existingErr } = await serviceClient
      .from("discord_links")
      .select("user_id")
      .eq("discord_id", discordId)
      .maybeSingle();

    if (existingErr) {
      console.error("[verify] Existing link check failed:", existingErr);
      return res.status(500).json({ ok: false, error: "Server error" });
    }

    if (existing && existing.user_id !== profile.id) {
      return res.status(200).json({ valid: false });
    }

    const { error: upsertErr } = await serviceClient.from("discord_links").upsert(
      {
        user_id: profile.id,
        discord_id: discordId,
        discord_username: discordGlobalName ?? discordUsername ?? null,
        discord_avatar: discordAvatar ?? null,
        linked_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) {
      console.error("[verify] Upsert failed:", upsertErr);
      return res.status(500).json({ ok: false, error: "Server error" });
    }

    return res.status(200).json({
      valid: true,
      websiteUserId: profile.id,
      websiteUsername: profile.full_name,
    });
  } catch (error) {
    console.error("[verify] Unexpected error:", error);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
