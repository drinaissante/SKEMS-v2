import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  DISCORD_API,
  getBotUser,
} from "../lib/discord.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { fullName, studentNumber, email } = req.body || {};
  if (!fullName || !studentNumber || !email) {
    return res.status(400).json({ error: "Missing registration details." });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_LOGS_CHANNEL_ID;
  if (!botToken || !channelId) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const bot = await getBotUser(botToken);
  const now = new Date();

  const embed = {
    title: "New Registration (Pending Approval)",
    color: 0xc89116,
    author: bot?.iconUrl
      ? { name: bot.name, icon_url: bot.iconUrl }
      : undefined,
    fields: [
      { name: "Full Name", value: String(fullName), inline: false },
      { name: "Student Number", value: String(studentNumber), inline: true },
    ],
    footer: { text: "Awaiting Officer approval · Sine Kultura Equipment Management System" },
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
