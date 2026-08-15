import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const GOLD = 0xc89116;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDiscordDate(value?: string): string {
  if (!value) return "—";
  const m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (!m) return value;
  const month = MONTHS[parseInt(m[2], 10) - 1];
  if (!month) return value;
  let hour = parseInt(m[4] || "0", 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  const minutes = String(parseInt(m[5] || "0", 10)).padStart(2, "0");
  return `${month} ${parseInt(m[3], 10)}, ${m[1]} ${hour}:${minutes}${suffix}`;
}

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

  const fields = [
    { name: "Equipment", value: equipmentName, inline: true },
    { name: "Quantity", value: String(quantity ?? 1), inline: true },
    { name: "Owner", value: owner || "—", inline: true },
    { name: "Borrower", value: borrowerName, inline: true },
    { name: "Position / Dept", value: positionDepartment || "—", inline: true },
    { name: "Student #", value: studentNumber || "—", inline: true },
    { name: "Reason", value: reason || "—" },
    { name: "Borrowed", value: formatDiscordDate(dateBorrowed), inline: true },
    { name: "Due", value: formatDiscordDate(dateDue), inline: true },
    { name: "\u200b", value: "\u200b", inline: true },
    { name: "Pickup", value: pickupLocation || "—", inline: true },
    { name: "Return", value: returnLocation || "—", inline: true },
  ];

  const body: {
    embeds: unknown[];
    components?: unknown[];
  } = {
    embeds: [
      {
        title: "New Borrow Request",
        color: GOLD,
        fields,
      },
    ],
  };

  const baseUrl = (process.env.VITE_BASE_URL || "").replace(/\/+$/, "");
  const viewUrl =
    requestId && /^https:\/\//i.test(baseUrl)
      ? `${baseUrl}/dashboard/requests?id=${requestId}`
      : null;

  if (viewUrl) {
    body.components = [
      {
        type: 1,
        components: [{ type: 2, style: 5, label: "View Request", url: viewUrl }],
      },
    ];
  }

  try {
    const discordRes = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
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
