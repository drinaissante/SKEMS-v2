import { supabase, logAudit } from "./supabase";

export interface Equipment {
  id: string;
  name: string;
  category: string;
  image: string;
  owner: string;
  dateGivenToSK: string;
  condition: string;
  comments: string;
  borrowerName: string;
  dateBorrowed: string;
  dateDue: string;
}

function mapRowToEquipment(row: Record<string, unknown>): Equipment {
  return {
    id: row.equipment_id as string,
    name: row.name as string,
    category: row.category as string,
    image: (row.image as string) ?? "",
    owner: row.owner as string,
    dateGivenToSK: (row.date_given_to_sk as string) ?? "",
    condition: row.condition as string,
    comments: (row.comments as string) ?? "",
    borrowerName: (row.borrower_name as string) ?? "",
    dateBorrowed: (row.date_borrowed as string) ?? "",
    dateDue: (row.date_due as string) ?? "",
  };
}

export async function fetchEquipments(): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from("equipments")
    .select("*")
    .order("equipment_id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRowToEquipment);
}

export async function fetchEquipmentsByOwner(owner: string): Promise<Equipment[]> {
  const pattern = owner.trim().replace(/\s+/g, "%");
  const { data, error } = await supabase
    .from("equipments")
    .select("*")
    .ilike("owner", pattern)
    .order("equipment_id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRowToEquipment);
}

export async function addEquipment(
  equipment: Omit<Equipment, "id">,
): Promise<Equipment> {
  const { data: maxRow } = await supabase
    .from("equipments")
    .select("equipment_id")
    .order("equipment_id", { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (maxRow?.equipment_id) {
    const num = parseInt(
      (maxRow.equipment_id as string).replace("SK-", ""),
      10,
    );
    if (!isNaN(num)) nextNum = num + 1;
  }
  const newId = `SK-${String(nextNum).padStart(3, "0")}`;

  const { error } = await supabase.from("equipments").insert({
    equipment_id: newId,
    name: equipment.name,
    category: equipment.category,
    image: equipment.image,
    owner: equipment.owner,
    date_given_to_sk: equipment.dateGivenToSK || null,
    condition: equipment.condition,
    comments: equipment.comments,
    borrower_name: equipment.borrowerName || null,
    date_borrowed: equipment.dateBorrowed || null,
    date_due: equipment.dateDue || null,
  });
  if (error) throw error;

  void logAudit(
    "equipment_added",
    `${newId} — ${equipment.name} (owner: ${equipment.owner || "none"})`,
  )

  return { id: newId, ...equipment };
}

export async function updateEquipment(
  id: string,
  data: Partial<Equipment>,
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.owner !== undefined) updateData.owner = data.owner;
  if (data.dateGivenToSK !== undefined)
    updateData.date_given_to_sk = data.dateGivenToSK || null;
  if (data.condition !== undefined) updateData.condition = data.condition;
  if (data.comments !== undefined) updateData.comments = data.comments;
  if (data.borrowerName !== undefined)
    updateData.borrower_name = data.borrowerName;
  if (data.dateBorrowed !== undefined)
    updateData.date_borrowed = data.dateBorrowed || null;
  if (data.dateDue !== undefined) updateData.date_due = data.dateDue || null;

  // Fetch the previous row so the audit entry can diff the changes.
  const { data: before } = await supabase
    .from("equipments")
    .select("name, condition, comments, owner")
    .eq("equipment_id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("equipments")
    .update(updateData)
    .eq("equipment_id", id);
  if (error) throw error;

  const diffParts: string[] = []
  const asText = (v: unknown) => (v == null || v === "" ? "—" : String(v))
  if (data.name !== undefined && before && data.name !== (before as { name: string }).name) {
    diffParts.push(`name: ${asText((before as { name: string }).name)} → ${data.name}`)
  }
  if (data.condition !== undefined && before && data.condition !== (before as { condition: string }).condition) {
    diffParts.push(`condition: ${asText((before as { condition: string }).condition)} → ${data.condition}`)
  }
  if (data.comments !== undefined && before && data.comments !== (before as { comments: string }).comments) {
    diffParts.push("comment updated")
  }
  if (data.owner !== undefined && before && data.owner !== (before as { owner: string }).owner) {
    diffParts.push(`owner: ${asText((before as { owner: string }).owner)} → ${data.owner}`)
  }
  if (data.image !== undefined) {
    diffParts.push("image updated")
  }

  void logAudit(
    "equipment_updated",
    `${id} — ${data.name ?? (before as { name: string } | null)?.name ?? id}`,
    diffParts.length > 0 ? diffParts.join(", ") : undefined,
  )
}

export async function deleteEquipment(id: string): Promise<void> {
  const { data: before } = await supabase
    .from("equipments")
    .select("name")
    .eq("equipment_id", id)
    .maybeSingle();

  const { error } = await supabase.rpc("delete_equipment_and_renumber", {
    target_id: id,
  });
  if (error) throw error;

  void logAudit(
    "equipment_deleted",
    `${id} — ${before?.name ?? id}`,
  )
}

export async function exportToSheets(
  items: Equipment[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/export-to-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    return data as { ok: boolean; error?: string };
  } catch (err) {
    if (err instanceof Error) console.log(err.message);

    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
