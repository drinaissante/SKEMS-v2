import { useQuery } from "@tanstack/react-query";

export type Member = {
  fullName: string;
  status: string;
  specialization: string;
};

const SHEET_ID = "171tDcO9NzSrS37H1Hwo-kbjdwRcHwWYblsPpVgStTls";
const GID = "0";

async function fetchMembers(): Promise<Member[]> {
  const query = encodeURIComponent("SELECT C, D, E");
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tq=${query}&gid=${GID}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch member list");

  const text = await response.text();
  const jsonString = text.substring(
    text.indexOf("{"),
    text.lastIndexOf("}") + 1,
  );
  const rawData = JSON.parse(jsonString);

  const members: Member[] = rawData.table.rows.map(
    (row: { c: { v: string }[] | null }) => {
      const getVal = (index: number) =>
        row.c && row.c[index] ? row.c[index].v : "";
      return {
        fullName: getVal(0),
        status: getVal(1),
        specialization: getVal(2),
      };
    },
  );

  if (members[0]?.specialization === "specialization") {
    members.shift();
  }

  return members.filter((m) => m.fullName);
}

export function useMemberNames() {
  return useQuery({
    queryKey: ["member-names"],
    queryFn: fetchMembers,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
