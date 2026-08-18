export const CUSTOM_VALUE = "__custom__" as const;

export const RUBRIC_COLORS: Record<number, string> = {
  4: "bg-green-500/20 text-green-400",
  3: "bg-yellow-500/20 text-yellow-400",
  2: "bg-sky-400/20 text-sky-400",
  1: "bg-orange-500/20 text-orange-400",
} as const;

export const RUBRIC_OPTIONS = [4, 3, 2, 1] as const;

export const STATUS_OPTIONS = [
  "Trainee",
  "Member",
  "Photo Head",
  "Driver",
  "Dept. Social Media Head",
  "Dept. Graphics Head",
  "Vice President",
  "Treasurer",
  "Video Head",
  "President",
  "Event Coordinator",
  "Secretary",
  "Creatives Director",
  "Video Editing Head",
  "Dept. Photo Head",
  "SWNG Head",
] as const;

export const SPEC_OPTIONS = [
  "Photographer",
  "SWNG",
  "Videographer",
  "Graphics",
  "Editor",
  "Driver",
] as const;

export const STATUS_OPTIONS_GRADING = ["Completed", "Unfinished"] as const;
export const ROLE_OPTIONS = [
  "Creatives / Moving Videographer",
  "Main Camera Videographer",
  "BTS Videographer",
  "Reactions / Candid Videographer",
] as const;

export const DURATION_OPTIONS = ["Half", "Full"] as const;

export const ATTENDANCE_OPTIONS = ["On-time", "Late", "Absent"] as const;

export const POINTS_OPTIONS = [0, 0.25, 0.5, 0.75, 1, 1.25] as const;

export type FormData = {
  date: string;
  event_name: string;
  member_name: string;
  shots_posted: number;
  notes: string;
  tech_execution: number;
  creative_impact: number;
  brand_alignment: number;
  revision_factor: number;
  status: string;
  role: string;
  duration: string;
  attendance: string;
  points: number;
  camera_used: string;
  lenses_used: string;
};

export const EMPTY_FORM: FormData = {
  date: "",
  event_name: "",
  member_name: "",
  shots_posted: 0,
  notes: "",
  tech_execution: 4,
  creative_impact: 4,
  brand_alignment: 4,
  revision_factor: 4,
  status: "",
  role: "",
  duration: "",
  attendance: "",
  points: 0,
  camera_used: "",
  lenses_used: "",
} as const;

export const RUBRICS = [
  ["tech_execution", "Tech Execution (1-4)"],
  ["creative_impact", "Creative Impact (1-4)"],
  ["brand_alignment", "Brand Alignment (1-4)"],
  ["revision_factor", "Revision Factor (1-4)"],
] as const;
