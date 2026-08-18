import { computeOutputQuality, type Grading } from "../services/supabase";

export const exportCSV = (filtered: Grading[]) => {
  const header =
    "Date,Event,Member,Shots Posted,Notes,Tech Execution,Creative Impact,Brand Alignment,Revision Factor,Output Quality,Status,Role,Duration,Attendance,Points,Camera/Equipment,Lenses,Created At";
  const rows = filtered.map((g) =>
    [
      g.date,
      `"${g.event_name.replace(/"/g, '""')}"`,
      `"${g.member_name.replace(/"/g, '""')}"`,
      g.shots_posted,
      `"${g.notes.replace(/"/g, '""')}"`,
      g.tech_execution,
      g.creative_impact,
      g.brand_alignment,
      g.revision_factor,
      (
        computeOutputQuality(
          g.tech_execution,
          g.creative_impact,
          g.brand_alignment,
          g.revision_factor,
        ) * 100
      ).toFixed(1) + "%",
      `"${(g.status ?? "").replace(/"/g, '""')}"`,
      `"${(g.role ?? "").replace(/"/g, '""')}"`,
      `"${(g.duration ?? "").replace(/"/g, '""')}"`,
      `"${(g.attendance ?? "").replace(/"/g, '""')}"`,
      g.points ?? 0,
      `"${(g.camera_used ?? "").replace(/"/g, '""')}"`,
      `"${(g.lenses_used ?? "").replace(/"/g, '""')}"`,
      g.created_at?.slice(0, 10) || "",
    ].join(","),
  );
  const blob = new Blob([header + "\n" + rows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gradings_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
