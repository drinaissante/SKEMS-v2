export const DISCORD_API = "https://discord.com/api/v10";

export const GOLD = 0xc89116;

export const STATUS_COLORS: Record<string, number> = {
  Pending: GOLD,
  Approved: 0x57f287,
  Rejected: 0xed4245,
  Deleted: 0x000000,
  Returned: 0x95a5a6,
};

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

function hasTimezoneIndicator(value: string): boolean {
  return /(Z|[+-]\d{2}:\d{2})$/.test(value.trim());
}

/**
 * Timezone-aware Discord date formatter.
 * - Naive strings ("YYYY-MM-DDTHH:mm") represent PH wall time and are
 *   formatted literally (legacy borrow_records text values).
 * - TZ-tagged values (canonical UTC ISO from timestamptz columns) are
 *   converted to Asia/Manila before formatting.
 */
export function formatDiscordDate(value?: string): string {
  if (!value) return "—";
  const trimmed = value.trim();

  if (hasTimezoneIndicator(trimmed)) {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return value;
    const parts = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const month = get("month");
    const day = get("day");
    const year = get("year");
    const hour12 = get("hour");
    const minute = get("minute");
    const dayPeriod = get("dayPeriod").toUpperCase();
    const hour = parseInt(hour12, 10) % 12 || 12;
    const paddedHour = String(hour).padStart(2, "0");
    return `${month} ${parseInt(day, 10)}, ${year} ${paddedHour}:${minute}${dayPeriod}`;
  }

  const m = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (!m) return value;
  const month = MONTHS[parseInt(m[2], 10) - 1];
  if (!month) return value;
  let hour = parseInt(m[4] || "0", 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  const minutes = String(parseInt(m[5] || "0", 10)).padStart(2, "0");
  return `${month} ${parseInt(m[3], 10)}, ${m[1]} ${hour}:${minutes}${suffix}`;
}

export interface RequestEmbedData {
  equipmentName: string;
  quantity: number;
  borrowerName: string;
  studentNumber: string;
  positionDepartment: string;
  reason: string;
  dateBorrowed: string;
  dateDue: string;
  pickupLocation: string;
  returnLocation: string;
  owner: string;
}

export interface BotUser {
  name: string;
  iconUrl: string | null;
}

let cachedBot: BotUser | null | undefined;

export async function getBotUser(botToken: string): Promise<BotUser | null> {
  if (cachedBot !== undefined) return cachedBot;
  try {
    const res = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) {
      cachedBot = null;
      return cachedBot;
    }
    const bot = await res.json();
    const name = typeof bot?.username === "string" ? bot.username : "Sine Kultura";
    let iconUrl: string | null = null;
    if (bot?.id && bot?.avatar) {
      const ext = String(bot.avatar).startsWith("a_") ? "gif" : "png";
      iconUrl = `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.${ext}?size=128`;
    }
    cachedBot = { name, iconUrl };
    return cachedBot;
  } catch {
    cachedBot = null;
    return cachedBot;
  }
}

export function buildRequestEmbed(
  data: RequestEmbedData,
  status: string,
  bot: BotUser | null,
): Record<string, unknown> {
  const embed: Record<string, unknown> = {
    title: `New Borrow Request - ${data.equipmentName} - ${status}`,
    color: STATUS_COLORS[status] ?? GOLD,
    fields: [
      { name: "Equipment", value: data.equipmentName, inline: true },
      { name: "Quantity", value: String(data.quantity ?? 1), inline: true },
      { name: "Owner", value: data.owner || "—", inline: true },
      { name: "Borrower", value: data.borrowerName, inline: true },
      { name: "Position / Dept", value: data.positionDepartment || "—", inline: true },
      { name: "Student #", value: data.studentNumber || "—", inline: true },
      { name: "Reason", value: data.reason || "—" },
      { name: "Borrowed", value: formatDiscordDate(data.dateBorrowed), inline: true },
      { name: "Due", value: formatDiscordDate(data.dateDue), inline: true },
      { name: "\u200b", value: "\u200b", inline: true },
      { name: "Pickup", value: data.pickupLocation || "—", inline: true },
      { name: "Return", value: data.returnLocation || "—", inline: true },
    ],
  };

  if (bot) {
    const author: Record<string, string> = { name: bot.name };
    if (bot.iconUrl) author.icon_url = bot.iconUrl;
    embed.author = author;
  }

  return embed;
}

export function buildViewRequestComponents(requestId?: string) {
  const baseUrl = (process.env.VITE_BASE_URL || "").replace(/\/+$/, "");
  if (!requestId || !/^https:\/\//i.test(baseUrl)) return undefined;
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "View Request",
          url: `${baseUrl}/dashboard/requests?id=${requestId}`,
        },
      ],
    },
  ];
}

export interface PartnershipEmbedData {
  name: string;
  email: string;
  details: string;
  fileUrl?: string;
}

export function buildPartnershipEmbed(
  data: PartnershipEmbedData,
  bot: BotUser | null,
): Record<string, unknown> {
  const embed: Record<string, unknown> = {
    title: "New Partnership Inquiry",
    color: GOLD,
    fields: [
      { name: "Organization / Name", value: data.name },
      { name: "Email", value: data.email },
      { name: "Project Details", value: data.details },
    ],
    timestamp: new Date().toISOString(),
  };
  if (bot) {
    const author: Record<string, string> = { name: bot.name };
    if (bot.iconUrl) author.icon_url = bot.iconUrl;
    embed.author = author;
  }
  return embed;
}

export function buildPartnershipComponents(fileUrl?: string) {
  if (!fileUrl || !/^https:\/\//i.test(fileUrl)) return undefined;
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "View Attachment",
          url: fileUrl,
        },
      ],
    },
  ];
}
