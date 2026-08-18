import { FiChevronDown, FiTrash2 } from "react-icons/fi"
import { computeOutputQuality, type Grading } from "../../services/supabase"
import { formatGradingDate } from "../../utils/datetime"
import RubricChip from "./RubricChip"

interface MobileGradingCardProps {
    paginatedItems: Grading[],
    openEdit: (g: Grading) => void,
    setConfirmDeleteId: React.Dispatch<React.SetStateAction<string | null>>,
    expandedRow: string | null,
    setExpandedRow: React.Dispatch<React.SetStateAction<string | null>>
}

export default function MobileGradingCard({
    paginatedItems,
    openEdit,
    setConfirmDeleteId,
    expandedRow,
    setExpandedRow
}: MobileGradingCardProps) {

    return (
        <div className="md:hidden space-y-2">
            {paginatedItems.map((g) => {
                const oq = computeOutputQuality(
                    g.tech_execution,
                    g.creative_impact,
                    g.brand_alignment,
                    g.revision_factor,
                )
                return (
                <div key={g.id} className="dark-card">
                    <button
                    onClick={() => setExpandedRow((prev) => prev === g.id ? null : g.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left cursor-pointer"
                    >
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                        {g.event_name}
                        </p>
                        <p className="text-xs text-[#a6a6a6] truncate">
                        {g.member_name} · {formatGradingDate(g.date)}
                        </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-[#fdb125]">
                        {(oq * 100).toFixed(1)}%
                    </span>
                    <FiChevronDown
                        size={16}
                        className={`shrink-0 text-[#a6a6a6] transition-transform ${
                        expandedRow === g.id ? "rotate-180" : ""
                        }`}
                    />
                    </button>
                    {expandedRow === g.id && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/10 space-y-2 text-xs text-[#a6a6a6]">
                        <div className="flex justify-between">
                        <span>Shots Posted</span>
                        <span className="font-medium text-white">
                            {g.shots_posted}
                        </span>
                        </div>
                        {g.notes && (
                        <div className="flex justify-between">
                            <span>Notes</span>
                            <span className="font-medium text-white text-right max-w-48">
                            {g.notes}
                            </span>
                        </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between">
                            <span>Tech</span>
                            <RubricChip value={g.tech_execution} />
                        </div>
                        <div className="flex justify-between">
                            <span>Creative</span>
                            <RubricChip value={g.creative_impact} />
                        </div>
                        <div className="flex justify-between">
                            <span>Brand</span>
                            <RubricChip value={g.brand_alignment} />
                        </div>
                        <div className="flex justify-between">
                            <span>Revision</span>
                            <RubricChip value={g.revision_factor} />
                        </div>
                        </div>
                        <div className="flex justify-between pt-1">
                        <span>Output Quality</span>
                        <span className="font-medium text-[#fdb125]">
                            {(oq * 100).toFixed(1)}%
                        </span>
                        </div>
                        {g.status && (
                        <div className="flex justify-between">
                            <span>Status</span>
                            <span className="font-medium text-white">{g.status}</span>
                        </div>
                        )}
                        {g.role && (
                        <div className="flex justify-between">
                            <span>Role</span>
                            <span className="font-medium text-white">{g.role}</span>
                        </div>
                        )}
                        {g.duration && (
                        <div className="flex justify-between">
                            <span>Duration</span>
                            <span className="font-medium text-white">{g.duration}</span>
                        </div>
                        )}
                        {g.attendance && (
                        <div className="flex justify-between">
                            <span>Attendance</span>
                            <span className="font-medium text-white">{g.attendance}</span>
                        </div>
                        )}
                        {g.points != null && (
                        <div className="flex justify-between">
                            <span>Points</span>
                            <span className="font-medium text-white">{g.points}</span>
                        </div>
                        )}
                        {g.camera_used && (
                        <div className="flex justify-between">
                            <span>Camera</span>
                            <span className="font-medium text-white">{g.camera_used}</span>
                        </div>
                        )}
                        {g.lenses_used && (
                        <div className="flex justify-between">
                            <span>Lenses</span>
                            <span className="font-medium text-white">{g.lenses_used}</span>
                        </div>
                        )}
                        <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => openEdit(g)}
                            className="flex-1 py-2.5 text-xs font-bold bg-white/10 border border-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => setConfirmDeleteId(g.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shrink-0"
                            title="Delete"
                        >
                            <FiTrash2 size={14} />
                        </button>
                        </div>
                    </div>
                    )}
                </div>
                )
            })}
            </div>
    )
}