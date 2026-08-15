import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import {
  DISCORD_API,
  buildRequestEmbed,
  buildViewRequestComponents,
  getBotUser,
} from "../lib/discord.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    console.error("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const {
    equipmentName,
    quantity,
    borrowerName,
    studentNumber,
    positionDepartment,
    reason,
    dateBorrowed,
    dateDue,
    pickupLocation,
    returnLocation,
    owner,
    requestId,
  } = req.body || {};

  if (!equipmentName || !borrowerName) {
    console.error("Missing request details");
    return res.status(400).json({ error: "Missing request details." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase env vars not configured");
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
    data: authData,
    error: authError,
  } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    console.error("Auth check failed:", authError?.message);
    return res.status(401).json({ error: "Authentication required." });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_REQUESTS_CHANNEL_ID;
  if (!botToken || !channelId) {
    console.error("Discord env vars not configured");
    return res.status(200).json({ ok: true, skipped: true });
  }

  const bot = await getBotUser(botToken);
  const embed = buildRequestEmbed(
    {
      equipmentName,
      quantity,
      borrowerName,
      studentNumber,
      positionDepartment,
      reason,
      dateBorrowed,
      dateDue,
      pickupLocation,
      returnLocation,
      owner,
    },
    "Pending",
    bot,
  );

  const body: {
    embeds: unknown[];
    components?: unknown[];
  } = {
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

    const discordJson = await discordRes.json();
    const messageId = typeof discordJson?.id === "string" ? discordJson.id : null;

    return res.status(200).json({ ok: true, messageId });
  } catch (error) {
    console.error("Discord send error:", error);
    return res.status(502).json({ ok: false, error: "Discord send failed." });
  }
}
