import { FiEdit2, FiTrash2, FiChevronDown } from "react-icons/fi"
import { computeOutputQuality, type Grading } from "../../services/supabase"
import { formatGradingDate } from "../../utils/datetime"
import RubricChip from "./RubricChip"

interface GradingTableProps {
    paginatedItems: Grading[],
    openEdit: (g: Grading) => void,
    setConfirmDeleteId: React.Dispatch<React.SetStateAction<string | null>>,
    expandedRow: string | null,
    setExpandedRow: React.Dispatch<React.SetStateAction<string | null>>
}

export default function GradingTable({
    paginatedItems,
    openEdit,
    setConfirmDeleteId,
    expandedRow,
    setExpandedRow
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
                    <>
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
                            onClick={() => setExpandedRow((prev) => prev === g.id ? null : g.id)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                                expandedRow === g.id ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-[#a6a6a6]"
                            }`}
                            title="Details"
                        >
                            <FiChevronDown size={14} className={`transition-transform ${expandedRow === g.id ? "rotate-180" : ""}`} />
                        </button>
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
                    {expandedRow === g.id && (
                    <tr>
                        <td colSpan={10} className="px-3 py-3 bg-white/2">
                        <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
                            {g.status && (
                                <div>
                                    <span className="text-[#a6a6a6]">Status: </span>
                                    <span className="text-white">{g.status}</span>
                                </div>
                            )}
                            {g.role && (
                                <div>
                                    <span className="text-[#a6a6a6]">Role: </span>
                                    <span className="text-white">{g.role}</span>
                                </div>
                            )}
                            {g.duration && (
                                <div>
                                    <span className="text-[#a6a6a6]">Duration: </span>
                                    <span className="text-white">{g.duration}</span>
                                </div>
                            )}
                            {g.attendance && (
                                <div>
                                    <span className="text-[#a6a6a6]">Attendance: </span>
                                    <span className="text-white">{g.attendance}</span>
                                </div>
                            )}
                            {g.points != null && (
                                <div>
                                    <span className="text-[#a6a6a6]">Points: </span>
                                    <span className="text-white">{g.points}</span>
                                </div>
                            )}
                            {g.camera_used && (
                                <div>
                                    <span className="text-[#a6a6a6]">Camera: </span>
                                    <span className="text-white">{g.camera_used}</span>
                                </div>
                            )}
                            {g.lenses_used && (
                                <div>
                                    <span className="text-[#a6a6a6]">Lenses: </span>
                                    <span className="text-white">{g.lenses_used}</span>
                                </div>
                            )}
                            {g.notes && (
                                <div className="mt-1.5 text-xs">
                                    <span className="text-[#a6a6a6]">Notes: </span>
                                    <span className="text-white">{g.notes}</span>
                                </div>
                            )}
                        </div>
                        </td>
                    </tr>
                    )}
                    </>
                )
                })}
            </tbody>
            </table>
        </div>
    )
}