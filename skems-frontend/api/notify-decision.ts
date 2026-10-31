import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import {
  DISCORD_API,
  buildViewRequestComponents,
  getBotUser,
  formatDiscordDate,
} from "../lib/discord.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const {
    equipmentId,
    equipmentName,
    borrowerName,
    studentNumber,
    quantity,
    reason,
    decision,
    decidedByOwner,
    requestId,
  } = req.body || {};

  if (!equipmentName || !borrowerName || (decision !== "Approved" && decision !== "Rejected")) {
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

  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_REQUESTS_CHANNEL_ID;
  if (!botToken || !channelId) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const isApproved = decision === "Approved";
  const now = new Date();
  const decidedOn = formatDiscordDate(now.toISOString());
  const decidedBy = decidedByOwner ? "Equipment Owner" : "SK Officer";
  const color = isApproved ? 0x22c55e : 0xef4444;
  const title = isApproved
    ? `Borrow Approved: ${equipmentName}`
    : `Borrow Rejected: ${equipmentName}`;

  const bot = await getBotUser(botToken);

  const embed = {
    title,
    color,
    author: bot?.iconUrl
      ? { name: bot.name, icon_url: bot.iconUrl }
      : undefined,
    fields: [
      { name: "Equipment ID", value: String(equipmentId || "N/A"), inline: true },
      { name: "Quantity", value: String(quantity || 1), inline: true },
      { name: "Borrower", value: `${borrowerName}${studentNumber ? ` (${studentNumber})` : ""}`, inline: false },
      { name: "Decision Reason", value: reason ? String(reason).slice(0, 1000) : "No reason provided", inline: false },
      { name: "Decided By", value: `${decidedBy} on ${decidedOn}`, inline: false },
    ],
    footer: { text: "Sine Kultura Equipment Management System" },
    timestamp: now.toISOString(),
  };

  const body: { embeds: unknown[]; components?: unknown[] } = {
    embeds: [embed],
  };
  const components = buildViewRequestComponents(requestId);
  if (components) body.components = components;

  try {
    const discordRes = await fetch(
      `${DISCORD_API}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify(body),
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
