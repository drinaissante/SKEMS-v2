import { RUBRIC_COLORS } from "../../constants/gradingConstants";

export default function RubricChip({value}: { value: number}) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${RUBRIC_COLORS[value] ?? "bg-white/10 text-[#a6a6a6]"}`}
    >
      {value}
    </span>
  )
}