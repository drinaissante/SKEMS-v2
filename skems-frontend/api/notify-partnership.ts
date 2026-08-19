import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  DISCORD_API,
  buildPartnershipEmbed,
  buildPartnershipComponents,
  getBotUser,
} from "../lib/discord.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { name, email, details, fileUrl } = req.body || {};

  if (!name || !email || !details) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_PARTNERSHIPS_CHANNEL_ID;
  if (!botToken || !channelId) {
    console.error("Discord env vars not configured for partnerships");
    return res.status(200).json({ ok: true, skipped: true });
  }

  const bot = await getBotUser(botToken);
  const embed = buildPartnershipEmbed({ name, email, details, fileUrl }, bot);

  const body: {
    embeds: unknown[];
    components?: unknown[];
  } = {
    embeds: [embed],
  };

  const components = buildPartnershipComponents(fileUrl);
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
