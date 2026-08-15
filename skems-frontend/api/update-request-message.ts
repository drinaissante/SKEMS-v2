import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import {
  DISCORD_API,
  buildRequestEmbed,
  buildViewRequestComponents,
  getBotUser,
} from "./discord";
import type { RequestEmbedData } from "./discord";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    console.error("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { messageId, status, requestId, ...embedData } = req.body || {};

  if (!messageId || !status) {
    console.error("Missing messageId or status");
    return res.status(400).json({ error: "Missing messageId or status." });
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
    embedData as unknown as RequestEmbedData,
    status,
    bot,
  );

  const body: {
    embeds: unknown[];
    components?: unknown[];
  } = {
    embeds: [embed],
  };

  if (status === "Pending" || status === "Rejected") {
    const components = buildViewRequestComponents(requestId);
    if (components) body.components = components;
  }

  try {
    const discordRes = await fetch(
      `${DISCORD_API}/channels/${channelId}/messages/${messageId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord update failed:", discordRes.status, errText);
      return res.status(502).json({ ok: false, error: "Discord update failed." });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Discord update error:", error);
    return res.status(502).json({ ok: false, error: "Discord update failed." });
  }
}
