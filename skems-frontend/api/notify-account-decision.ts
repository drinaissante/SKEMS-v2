import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import {
  DISCORD_API,
  getBotUser,
} from "../lib/discord.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { decision, fullName, studentNumber } = req.body || {};
  if ((decision !== "approved" && decision !== "rejected") || !fullName) {
    return res.status(400).json({ error: "Missing decision details." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Server not configured." });
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
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  // Only admins/superadmins may post account decisions.
  const { data: caller } = await authClient
    .from("profiles")
    .select("is_admin, is_superadmin")
    .eq("id", user.id)
    .maybeSingle();
  if (!caller?.is_admin && !caller?.is_superadmin) {
    return res.status(403).json({ error: "Admins only." });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_LOGS_CHANNEL_ID;
  if (!botToken || !channelId) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const approved = decision === "approved";
  const bot = await getBotUser(botToken);
  const now = new Date();

  const embed = {
    title: approved
      ? `Registration Approved: ${fullName}`
      : `Registration Rejected: ${fullName}`,
    color: approved ? 0x22c55e : 0xed4245,
    author: bot?.iconUrl
      ? { name: bot.name, icon_url: bot.iconUrl }
      : undefined,
    fields: [
      { name: "Full Name", value: String(fullName), inline: false },
      { name: "Student Number", value: String(studentNumber || "N/A"), inline: true },
      { name: "Decision", value: approved ? "Approved by an officer" : "Rejected by an officer", inline: false },
    ],
    footer: { text: "Sine Kultura Equipment Management System" },
    timestamp: now.toISOString(),
  };

  try {
    const discordRes = await fetch(
      `${DISCORD_API}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify({ embeds: [embed] }),
      },
    );

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord send failed:", discordRes.status, errText);
      return res.status(502).json({ ok: false, error: "Discord send failed." });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Discord send error:", error);
    return res.status(502).json({ ok: false, error: "Discord send failed." });
  }
}
