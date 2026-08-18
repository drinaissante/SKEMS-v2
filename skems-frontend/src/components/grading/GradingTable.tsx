import { FiEdit2, FiTrash2 } from "react-icons/fi"
import { computeOutputQuality, type Grading } from "../../services/supabase"
import { formatGradingDate } from "../../utils/datetime"
import RubricChip from "./RubricChip"

interface GradingTableProps {
    paginatedItems: Grading[],
    openEdit: (g: Grading) => void,
    setConfirmDeleteId: React.Dispatch<React.SetStateAction<string | null>>
}

export default function GradingTable({
    paginatedItems,
    openEdit,
    setConfirmDeleteId
}: GradingTableProps) {
    return (
        <div className="hidden md:block overflow-x-auto dark-card">
            <table className="w-full text-sm">
            <thead>
                <tr className="bg-white/5 text-white text-left">
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                    Date
                </th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                    Event
                </th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                    Member
                </th>
                <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">
                    Shots
                </th>
                <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                    Notes
                </th>
                <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">
                    Tech
                </th>
                <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">
                    Creative
                </th>
                <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">
                    Brand
                </th>
                <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">
                    Revision
                </th>
                <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">
                    Output (30%)
                </th>
                <th className="px-3 py-2.5 font-medium text-center whitespace-nowrap">
                    Actions
                </th>
                </tr>
            </thead>
            <tbody>
                {paginatedItems.map((g) => {
                const oq = computeOutputQuality(
                    g.tech_execution,
                    g.creative_impact,
                    g.brand_alignment,
                    g.revision_factor,
                )
                return (
                    <tr
                    key={g.id}
                    className="border-t border-white/10 hover:bg-white/5"
                    >
                    <td className="px-3 py-2.5 text-[#a6a6a6] whitespace-nowrap">
                        {formatGradingDate(g.date)}
                    </td>
                    <td className="px-3 py-2.5 text-white whitespace-nowrap">
                        {g.event_name}
                    </td>
                    <td className="px-3 py-2.5 text-white whitespace-nowrap">
                        {g.member_name}
                    </td>
                    <td className="px-3 py-2.5 text-[#a6a6a6] text-center">
                        {g.shots_posted}
                    </td>
                    <td
                        className="px-3 py-2.5 text-[#a6a6a6] max-w-32 truncate"
                        title={g.notes}
                    >
                        {g.notes || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                        <RubricChip value={g.tech_execution} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                        <RubricChip value={g.creative_impact} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                        <RubricChip value={g.brand_alignment} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                        <RubricChip value={g.revision_factor} />
                    </td>
                    <td className="px-3 py-2.5 text-center font-medium text-[#fdb125]">
                        {(oq * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={() => openEdit(g)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                            title="Edit"
                        >
                            <FiEdit2 size={14} />
                        </button>
                        <button
                            onClick={() => setConfirmDeleteId(g.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                        >
                            <FiTrash2 size={14} />
                        </button>
                        </div>
                    </td>
                    </tr>
                )
                })}
            </tbody>
            </table>
        </div>
    )
}