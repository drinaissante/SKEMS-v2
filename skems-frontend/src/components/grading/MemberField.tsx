import { FiSearch } from "react-icons/fi"
import { SPEC_OPTIONS, STATUS_OPTIONS, type FormData } from "../../constants/gradingConstants"
import { useMemo } from "react"
import type { Member } from "../../hooks/useMemberNames"

interface MemberFieldProps {
    loadingMembers: boolean,
    memberSearch: string,
    setMemberSearch: React.Dispatch<React.SetStateAction<string>>,
    memberStatusFilter: string,
    setMemberStatusFilter: React.Dispatch<React.SetStateAction<string>>,
    memberSpecFilter: string,
    setMemberSpecFilter: React.Dispatch<React.SetStateAction<string>>,
    members: NoInfer<Member[]> ,
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
    showCustomMemberInput: boolean,
    setShowCustomMemberInput: React.Dispatch<React.SetStateAction<boolean>>,
}

export default function MemberField({
    loadingMembers,
    memberSearch,
    setMemberSearch,
    memberStatusFilter,
    setMemberStatusFilter,
    memberSpecFilter,
    setMemberSpecFilter,
    members,
    form,
    setForm,
    showCustomMemberInput,
    setShowCustomMemberInput,
}: MemberFieldProps) {
    const filteredMembers = useMemo(() => {
        return members
            .filter((m) => {
                if (memberStatusFilter && !m.status.toLowerCase().includes(memberStatusFilter.toLowerCase())) return false
                if (memberSpecFilter && !m.specialization.toLowerCase().includes(memberSpecFilter.toLowerCase())) return false
                if (memberSearch && !m.fullName.toLowerCase().includes(memberSearch.toLowerCase())) return false
                return true
            })
            .sort((a, b) => a.fullName.localeCompare(b.fullName))
    }, [members, memberStatusFilter, memberSpecFilter, memberSearch])

    return (
        <div>
            <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Member Name
            </label>

            {loadingMembers ? (
                <div className="dark-input w-full text-sm text-[#a6a6a6]">
                Loading member list...
                </div>
            ) : (
                <>
                    <div className="relative mb-2">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={14} />
                            <input
                            type="text"
                            placeholder="Search by name..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="dark-input w-full pl-8 pr-3 py-1.5 text-sm"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                        <select
                            value={memberStatusFilter}
                            onChange={(e) => setMemberStatusFilter(e.target.value)}
                            className="dark-input flex-1 text-sm"
                        >
                            <option value="">All Status</option>
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        <select
                            value={memberSpecFilter}
                            onChange={(e) => setMemberSpecFilter(e.target.value)}
                            className="dark-input flex-1 text-sm"
                        >
                            <option value="">All Specialization</option>
                            {SPEC_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border border-white/10 rounded-lg max-h-40 overflow-y-auto">
                        {filteredMembers.length === 0 ? (
                            <p className="text-xs text-[#a6a6a6] px-3 py-2">
                                No members match the selected filters.
                            </p>
                        ) : (
                            filteredMembers.map((m) => (
                                <button
                                key={m.fullName}
                                type="button"
                                onClick={() => {
                                    if (form.member_name === m.fullName && !showCustomMemberInput) {
                                        setForm((f) => ({ ...f, member_name: "" }))
                                        } else {
                                            setForm((f) => ({ ...f, member_name: m.fullName }))
                                            setShowCustomMemberInput(false)
                                    }
                                }}
                                className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors border-b border-white/5 last:border-b-0 ${
                                    form.member_name === m.fullName && !showCustomMemberInput
                                    ? "bg-[#fdb125]/20 text-[#fdb125] font-bold"
                                    : "text-white hover:bg-white/5"
                                }`}
                                >
                                {m.fullName}
                                <span className="text-[10px] text-[#a6a6a6] ml-2">
                                    {m.status}
                                </span>
                                </button>
                            ))
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowCustomMemberInput((prev) => {
                                if (!prev) setForm((f) => ({ ...f, member_name: "" }))
                                return !prev
                            })
                        }}
                        className={`mt-2 px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                        showCustomMemberInput
                            ? "bg-[#fdb125]/20 border-[#fdb125]/40 text-[#fdb125]"
                            : "bg-white/5 border-white/10 text-[#a6a6a6] hover:text-white"
                        }`}
                    >
                        {showCustomMemberInput ? "Cancel Custom" : "Other (Custom)"}
                    </button>
                </>
            )}

            {showCustomMemberInput && (
                <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter member name"
                    value={form.member_name}
                    onChange={(e) =>
                        setForm((f) => ({
                        ...f,
                        member_name: e.target.value,
                        }))
                    }
                    className="dark-input w-full mt-2"
                />
            )}

            {!showCustomMemberInput && form.member_name && (
                <p className="text-xs text-[#a6a6a6] mt-1">
                    Selected: <span className="text-white font-medium">{form.member_name}</span>
                    <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, member_name: "" }))}
                        className="ml-2 text-red-400 hover:text-red-300 cursor-pointer"
                    >
                        ×
                    </button>
                </p>
            )}
        </div>
    )
}