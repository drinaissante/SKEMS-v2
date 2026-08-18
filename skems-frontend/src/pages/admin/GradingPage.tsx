import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi"
import {
  fetchGradings,
  addGrading,
  updateGrading,
  deleteGrading,
  type Grading,
} from "../../services/supabase"
import { useMemberNames } from "../../hooks/useMemberNames"
import { 
  EMPTY_FORM,
  type FormData,
} from "../../constants/gradingConstants"
import { exportCSV } from "../../utils/exportCSV"
import { formatGradingDate } from "../../utils/datetime"
import GradingTable from "../../components/grading/GradingTable"
import MobileGradingCard from "../../components/grading/MobileGradingCard"
import EventField from "../../components/grading/EventField"
import MemberField from "../../components/grading/MemberField"
import ShotsField from "../../components/grading/ShotsField"
import RubricsField from "../../components/grading/RubricsField"
import OutputQualityField from "../../components/grading/OutputQualityField"
import StatusField from "../../components/grading/StatusField"
import RoleField from "../../components/grading/RoleField"
import DurationField from "../../components/grading/DurationField"
import AttendanceField from "../../components/grading/AttendanceField"
import PointsField from "../../components/grading/PointsField"
import EquipmentUsedField from "../../components/grading/EquipmentUsedField"
import LensesUsedField from "../../components/grading/LensesUsedField"

const MOBILE_ITEMS = 5
const DESKTOP_ITEMS = 10

export default function GradingPage() {
  const queryClient = useQueryClient()

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const [search, setSearch] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)

  const [editRow, setEditRow] = useState<Grading | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [memberStatusFilter, setMemberStatusFilter] = useState("")
  const [memberSpecFilter, setMemberSpecFilter] = useState("")
  const [memberSearch, setMemberSearch] = useState("")
  const [showCustomMemberInput, setShowCustomMemberInput] = useState(false)

  const [saveMode, setSaveMode] = useState<"save" | "again">("save")
  const [modalPage, setModalPage] = useState<1 | 2>(1)

  const { data: members = [], isLoading: loadingMembers } = useMemberNames()

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
        setModalPage(1)
      } else {
        setShowModal(false)
        setEditRow(null)
        setModalPage(1)
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
    setModalPage(1)
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
      status: g.status ?? "",
      role: g.role ?? "",
      duration: g.duration ?? "",
      attendance: g.attendance ?? "",
      points: g.points ?? 0,
      camera_used: g.camera_used ?? "",
      lenses_used: g.lenses_used ?? "",
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
    setModalPage(1)
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent, mode: "save" | "again" = "save") => {
    e.preventDefault()
    setSaveMode(mode)
    saveMutation.mutate({ id: editRow?.id, values: { ...form } })
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
              onClick={() => exportCSV(filtered)}
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
            <GradingTable paginatedItems={paginatedItems} openEdit={openEdit} setConfirmDeleteId={setConfirmDeleteId}/>

            {/* Mobile cards */}
            <MobileGradingCard paginatedItems={paginatedItems} openEdit={openEdit} setConfirmDeleteId={setConfirmDeleteId} />

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
              <span className="text-xs font-normal text-[#a6a6a6] ml-2">
                Page {modalPage} of 2
              </span>
            </h2>
            <div className="space-y-3">
              {modalPage === 1 && (
                <>
                  {/* Events */}
                  <EventField form={form} setForm={setForm}/>

                  {/* Member */}
                  <MemberField 
                    loadingMembers={loadingMembers} 
                    memberSearch={memberSearch} 
                    setMemberSearch={setMemberSearch}
                    memberStatusFilter={memberStatusFilter}
                    setMemberStatusFilter={setMemberStatusFilter}
                    memberSpecFilter={memberSpecFilter}
                    setMemberSpecFilter={setMemberSpecFilter}
                    members={members}
                    form={form}
                    setForm={setForm}
                    showCustomMemberInput={showCustomMemberInput}
                    setShowCustomMemberInput={setShowCustomMemberInput}
                  />

                  {/* Shots */}
                  <ShotsField form={form} setForm={setForm} />

                  {/* Rubrics */}
                  <RubricsField form={form} setForm={setForm} />

                  {/* Output Quality */}
                  <OutputQualityField form={form} />
                </>
              )}

              {modalPage === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatusField form={form} setForm={setForm} />
                    <RoleField form={form} setForm={setForm} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DurationField form={form} setForm={setForm} />
                    <AttendanceField form={form} setForm={setForm} />
                  </div>
                  <PointsField form={form} setForm={setForm} />
                  <div className="flex gap-2">
                    <EquipmentUsedField form={form} setForm={setForm} />
                    <LensesUsedField form={form} setForm={setForm} />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mt-5">
              <button
                type="button"
                onClick={() => setModalPage(1)}
                disabled={modalPage === 1}
                className="flex items-center gap-1 text-sm text-[#a6a6a6] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <FiChevronLeft size={16} /> Prev
              </button>

              <div className="flex gap-1.5">
                <span className={`w-2 h-2 rounded-full ${modalPage === 1 ? "bg-[#fdb125]" : "bg-white/20"}`} />
                <span className={`w-2 h-2 rounded-full ${modalPage === 2 ? "bg-[#fdb125]" : "bg-white/20"}`} />
              </div>

              <button
                type="button"
                onClick={() => setModalPage(2)}
                disabled={modalPage === 2}
                className="flex items-center gap-1 text-sm text-[#a6a6a6] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next <FiChevronRight size={16} />
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => { setShowModal(false); setModalPage(1) }}
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
