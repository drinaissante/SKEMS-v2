import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiDownload,
} from "react-icons/fi"
import {
  fetchGradings,
  addGrading,
  updateGrading,
  deleteGrading,
  computeOutputQuality,
  type Grading,
} from "../../services/supabase"
import { useMemberNames } from "../../hooks/useMemberNames"
import { useEventNames } from "../../hooks/useEventNames"

const CUSTOM_VALUE = "__custom__"

const RUBRIC_COLORS: Record<number, string> = {
  4: "bg-green-500/20 text-green-400",
  3: "bg-yellow-500/20 text-yellow-400",
  2: "bg-sky-400/20 text-sky-400",
  1: "bg-orange-500/20 text-orange-400",
}

const RUBRIC_OPTIONS = [4, 3, 2, 1]

const STATUS_OPTIONS = [
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
]

const SPEC_OPTIONS = [
  "Photographer",
  "SWNG",
  "Videographer",
  "Graphics",
  "Editor",
  "Driver",
]

type FormData = {
  date: string
  event_name: string
  member_name: string
  shots_posted: number
  notes: string
  tech_execution: number
  creative_impact: number
  brand_alignment: number
  revision_factor: number
}

const EMPTY_FORM: FormData = {
  date: "",
  event_name: "",
  member_name: "",
  shots_posted: 0,
  notes: "",
  tech_execution: 4,
  creative_impact: 4,
  brand_alignment: 4,
  revision_factor: 4,
}

function formatGradingDate(dateStr: string): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr + "T00:00:00")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function RubricChip({ value }: { value: number }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${RUBRIC_COLORS[value] ?? "bg-white/10 text-[#a6a6a6]"}`}
    >
      {value}
    </span>
  )
}

const MOBILE_ITEMS = 5
const DESKTOP_ITEMS = 10

export default function GradingPage() {
  const queryClient = useQueryClient()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editRow, setEditRow] = useState<Grading | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [memberStatusFilter, setMemberStatusFilter] = useState("")
  const [memberSpecFilter, setMemberSpecFilter] = useState("")
  const [memberSearch, setMemberSearch] = useState("")
  const [showCustomMemberInput, setShowCustomMemberInput] = useState(false)
  const [saveMode, setSaveMode] = useState<"save" | "again">("save")

  const { data: members = [], isLoading: loadingMembers } = useMemberNames()
  const { data: eventOptions = [], isLoading: loadingEvents } = useEventNames()

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

  const eventLookup = useMemo(
    () => new Map(eventOptions.map((e) => [e.event_name, e.start_date])),
    [eventOptions],
  )

  const sortedEvents = useMemo(
    () => [...eventOptions].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [eventOptions],
  )

  const eventSelectValue =
    form.event_name === ""
      ? ""
      : eventLookup.has(form.event_name)
        ? form.event_name
        : CUSTOM_VALUE

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data: gradings = [], isLoading } = useQuery({
    queryKey: ["gradings"],
    queryFn: fetchGradings,
  })

  const saveMutation = useMutation({
    mutationFn: (data: {
      id?: string
      values: Omit<Grading, "id" | "created_at" | "created_by">
    }) => (data.id ? updateGrading(data.id, data.values) : addGrading(data.values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradings"] })
      if (saveMode === "again") {
        const kept = { date: form.date, event_name: form.event_name }
        setForm({ ...EMPTY_FORM, ...kept })
        setShowCustomMemberInput(false)
      } else {
        setShowModal(false)
        setEditRow(null)
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGrading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradings"] })
      setConfirmDeleteId(null)
    },
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return gradings
    return gradings.filter(
      (g) =>
        g.date.includes(q) ||
        g.event_name.toLowerCase().includes(q) ||
        g.member_name.toLowerCase().includes(q) ||
        formatGradingDate(g.date).toLowerCase().includes(q),
    )
  }, [gradings, search])

  const itemsPerPage = isMobile ? MOBILE_ITEMS : DESKTOP_ITEMS
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedItems = filtered.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  )

  const openAdd = () => {
    setEditRow(null)
    setForm(EMPTY_FORM)
    setMemberStatusFilter("")
    setMemberSpecFilter("")
    setMemberSearch("")
    setShowCustomMemberInput(false)
    setShowModal(true)
  }

  const openEdit = (g: Grading) => {
    setEditRow(g)
    setForm({
      date: g.date,
      event_name: g.event_name,
      member_name: g.member_name,
      shots_posted: g.shots_posted,
      notes: g.notes,
      tech_execution: g.tech_execution,
      creative_impact: g.creative_impact,
      brand_alignment: g.brand_alignment,
      revision_factor: g.revision_factor,
    })
    const match = members.find((m) => m.fullName === g.member_name)
    if (match) {
      setMemberStatusFilter(match.status)
      setMemberSpecFilter(match.specialization)
      setShowCustomMemberInput(false)
    } else {
      setMemberStatusFilter("")
      setMemberSpecFilter("")
      setShowCustomMemberInput(true)
    }
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent, mode: "save" | "again" = "save") => {
    e.preventDefault()
    setSaveMode(mode)
    saveMutation.mutate({ id: editRow?.id, values: { ...form } })
  }

  const exportCSV = () => {
    const header = "Date,Event,Member,Shots Posted,Notes,Tech Execution,Creative Impact,Brand Alignment,Revision Factor,Output Quality,Created At"
    const rows = filtered.map((g) => [
      g.date,
      `"${g.event_name.replace(/"/g, '""')}"`,
      `"${g.member_name.replace(/"/g, '""')}"`,
      g.shots_posted,
      `"${g.notes.replace(/"/g, '""')}"`,
      g.tech_execution,
      g.creative_impact,
      g.brand_alignment,
      g.revision_factor,
      (computeOutputQuality(g.tech_execution, g.creative_impact, g.brand_alignment, g.revision_factor) * 100).toFixed(1) + "%",
      g.created_at?.slice(0, 10) || "",
    ].join(","))
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gradings_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col flex-1 min-h-0 max-w-7xl w-full mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Grading
          </h1>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="btn-ghost px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiDownload size={16} /> Export CSV
            </button>
            <button
              onClick={openAdd}
              className="btn-gold px-4 py-2 text-sm flex items-center gap-2"
            >
              <FiPlus size={16} /> Add Grading
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 min-w-0">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by date, event, or member..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="dark-input w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-[#a6a6a6] py-10">
            Loading gradings...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#a6a6a6] py-10">
            No gradings found.
          </p>
        ) : (
          <>
            {/* Desktop table */}
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

            {/* Mobile cards */}
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
                      onClick={() =>
                        setExpandedRow((prev) =>
                          prev === g.id ? null : g.id,
                        )
                      }
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="btn-gold px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#a6a6a6] font-medium">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safePage === totalPages}
                  className="btn-gold px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowModal(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="dark-card shadow-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-4">
              {editRow ? "Edit Grading" : "Add Grading"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                  Event
                </label>
                {loadingEvents ? (
                  <div className="dark-input w-full text-sm text-[#a6a6a6]">
                    Loading event list...
                  </div>
                ) : (
                  <select
                    required={eventSelectValue !== CUSTOM_VALUE}
                    value={eventSelectValue}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === CUSTOM_VALUE) {
                        setForm((f) => ({ ...f, event_name: "", date: "" }))
                      } else {
                        const startDate = eventLookup.get(val) || ""
                        setForm((f) => ({
                          ...f,
                          event_name: val,
                          ...(startDate ? { date: startDate } : {}),
                        }))
                      }
                    }}
                    className="dark-input w-full"
                  >
                    <option value="">Select an event...</option>
                    {sortedEvents.map((ev) => (
                      <option key={ev.event_name} value={ev.event_name}>
                        {ev.start_date} | {ev.event_name}
                      </option>
                    ))}
                    <option value={CUSTOM_VALUE}>Other (Custom)</option>
                  </select>
                )}
                {eventSelectValue === CUSTOM_VALUE && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Enter event name"
                      value={form.event_name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          event_name: e.target.value,
                        }))
                      }
                      className="dark-input flex-1 min-w-0"
                    />
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, date: e.target.value }))
                      }
                      className="dark-input w-40 shrink-0"
                    />
                  </div>
                )}
              </div>
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
              <div className="flex gap-2">
                <div className="w-24 shrink-0">
                  <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                    Shots
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.shots_posted}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        shots_posted: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="dark-input w-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className="dark-input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["tech_execution", "Tech Execution (1-4)"],
                    ["creative_impact", "Creative Impact (1-4)"],
                    ["brand_alignment", "Brand Alignment (1-4)"],
                    ["revision_factor", "Revision Factor (1-4)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                      {label}
                    </label>
                    <select
                      value={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          [key]: parseInt(e.target.value),
                        }))
                      }
                      className="dark-input w-full"
                    >
                      {RUBRIC_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="text-sm text-[#a6a6a6]">
                Output Quality:{" "}
                <span className="font-medium text-[#fdb125]">
                  {(
                    computeOutputQuality(
                      form.tech_execution,
                      form.creative_impact,
                      form.brand_alignment,
                      form.revision_factor,
                    ) * 100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-ghost flex-1 py-2 text-sm"
              >
                Cancel
              </button>
              {!editRow && (
                <button
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={(e) => handleSubmit(e, "again")}
                  className="flex-1 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  {saveMutation.isPending ? "Saving..." : "Again"}
                </button>
              )}
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="btn-gold flex-1 py-2 text-sm disabled:opacity-40"
              >
                {saveMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="dark-card shadow-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">
              Delete Grading?
            </h3>
            <p className="text-sm text-[#a6a6a6] mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn-ghost flex-1 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
