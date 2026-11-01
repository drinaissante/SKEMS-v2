import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import {
  DISCORD_API,
  getBotUser,
} from "../lib/discord.js";

interface DmTarget {
  userId: string
  title: string
  bodyText: string
}

interface DmUserResult {
  userId: string
  ok: boolean
  skipped?: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { targets } = (req.body || {}) as { targets?: DmTarget[] };
  if (!Array.isArray(targets) || targets.length === 0) {
    return res.status(400).json({ error: "Missing DM targets." });
  }
  if (targets.length > 20) {
    return res.status(400).json({ error: "Too many DM targets." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey || !serviceKey) {
    return res.status(500).json({ error: "Server not configured." });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const token = authHeader.slice(7);

  // lightweight auth check with the requester's token
  const authClient = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  // service-role client resolves discord ids for arbitrary users
  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const ids = [...new Set(targets.map((t) => t.userId).filter(Boolean))];
  if (ids.length === 0) {
    return res.status(200).json({ ok: true, results: [] });
  }

  const { data: links, error: linksError } = await serviceClient
    .from("discord_links")
    .select("user_id, discord_id")
    .in("user_id", ids);

  if (linksError) {
    console.error("discord_links lookup failed:", linksError.message);
    return res.status(500).json({ ok: false, error: "Lookup failed." });
  }

  const discordIdByUser = new Map<string, string>();
  for (const l of (links as { user_id: string; discord_id: string }[]) ?? []) {
    if (l.discord_id) discordIdByUser.set(l.user_id, String(l.discord_id));
  }

  const bot = await getBotUser(botToken);
  const now = new Date().toISOString();

  const results: DmUserResult[] = [];
  for (const target of targets) {
    const discordId = discordIdByUser.get(target.userId);
    if (!discordId) {
      results.push({ userId: target.userId, ok: true, skipped: true });
      continue;
    }
    try {
      const dmRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify({ recipient_id: discordId }),
      });
      if (!dmRes.ok) {
        console.error("DM channel open failed:", dmRes.status);
        results.push({ userId: target.userId, ok: false });
        continue;
      }
      const channel = await dmRes.json();
      if (!channel?.id) {
        results.push({ userId: target.userId, ok: false });
        continue;
      }

      const msgRes = await fetch(
        `${DISCORD_API}/channels/${channel.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${botToken}`,
          },
          body: JSON.stringify({
            embeds: [
              {
                title: target.title,
                description: String(target.bodyText ?? "").slice(0, 2000),
                color: 0xc89116,
                author: bot?.iconUrl
                  ? { name: bot.name, icon_url: bot.iconUrl }
                  : undefined,
                footer: { text: "Sine Kultura Equipment Management System" },
                timestamp: now,
              },
            ],
          }),
        },
      );
      results.push({ userId: target.userId, ok: msgRes.ok });
    } catch (error) {
      console.error("DM send error:", error);
      results.push({ userId: target.userId, ok: false });
    }
  }

  return res.status(200).json({ ok: true, results });
}
