import { useMemo, useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchMyRequests, fetchBorrowedItemsByUser } from "../../services/supabase"
import { fetchEquipments as fetchEquipmentsList, type Equipment } from "../../services/api"
import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useToast } from "../../hooks/useToast"
import { formatWallClock, formatManila, toManilaIso, nowMs } from "../../utils/datetime"
import { FiSearch, FiPlus } from "react-icons/fi"
import RequestCard, { type RequestLike } from "../../components/RequestCard"
import RequestInfoModal from "../../modals/RequestInfoModal"
import ReturnProofModal from "../../modals/ReturnProofModal"
import { fetchMyReturnProofs, fetchMyEventItems, type ReturnProof } from "../../services/supabase"

const dtOpts: Intl.DateTimeFormatOptions = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}

interface BorrowedRecord {
  equipment_id: string
  equipment_requested: string
  owner: string
  quantity: number
  purpose_of_use: string
  date_time_borrowing: string
  date_time_return: string
  returned_on: string | null
  condition_after: string
  created_at: string
}

function isLateReturn(r: BorrowedRecord): boolean {
  if (!r.returned_on || !r.date_time_return) return false
  return new Date(r.returned_on) > new Date(toManilaIso(r.date_time_return))
}

function isOverdue(r: BorrowedRecord): boolean {
  if (r.returned_on || !r.date_time_return) return false
  return nowMs() > new Date(toManilaIso(r.date_time_return)).getTime()
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-bold text-[#c89116] uppercase tracking-wide mb-3">
      {children}
    </h2>
  )
}

function BorrowCard({
  r,
  onReturn,
  proofStatus,
}: {
  r: BorrowedRecord
  onReturn?: () => void
  proofStatus?: string
}) {
  const late = isLateReturn(r)
  return (
    <div className="dark-card rounded-xl border border-white/10 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-mono text-xs text-[#c89116] font-bold">{r.equipment_id}</p>
          <h3 className="text-base font-bold text-white leading-snug truncate">{r.equipment_requested}</h3>
          <p className="text-xs text-[#a6a6a6] mt-0.5 truncate">{r.owner || "No owner"}</p>
        </div>
        <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
          r.returned_on
            ? late
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
            : "bg-purple-500/15 text-purple-300"
        }`}>
          {!r.returned_on ? "Active" : late ? "Returned Late" : "Returned"}
        </span>
      </div>
      <div className="text-xs text-[#a6a6a6] space-y-0.5">
        <p><span className="font-medium">Borrowed:</span> {formatWallClock(r.date_time_borrowing, dtOpts)}</p>
        <p><span className="font-medium">Due:</span> {formatWallClock(r.date_time_return, dtOpts)}</p>
        {r.returned_on && (
          <p className={late ? "text-red-300" : "text-green-300"}>
            <span className="font-medium">Returned:</span> {formatManila(r.returned_on, dtOpts)}
          </p>
        )}
      </div>

      {onReturn && !r.returned_on && (
        <div className="mt-3 pt-2 border-t border-white/10">
          {proofStatus === "pending" ? (
            <p className="text-xs text-purple-300 font-bold">Return proof pending officer review.</p>
          ) : proofStatus === "rejected" ? (
            <button
              type="button"
              onClick={onReturn}
              className="w-full px-3 py-2 rounded-lg bg-[#c89116] hover:bg-[#caa453] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Resubmit Return Proof
            </button>
          ) : (
            <button
              type="button"
              onClick={onReturn}
              className="w-full px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Return Equipment
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function MemberDashboardPage() {
  usePageTitle("Dashboard")
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [proofModalTarget, setProofModalTarget] = useState<{ requestId?: string; eventItemId?: string; equipmentId: string; equipmentName: string } | null>(null)
  const overdueToastRef = useRef(false)

  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: () => fetchMyRequests(user!.id),
    enabled: !!user,
  })

  const { data: myBorrows = [] } = useQuery({
    queryKey: ["my-borrows", user?.id],
    queryFn: () => fetchBorrowedItemsByUser(user!.id),
    enabled: !!user,
  })

  const { data: myProofs = [] } = useQuery({
    queryKey: ["my-return-proofs", user?.id],
    queryFn: () => fetchMyReturnProofs(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000,
  })

  const proofByRequest = useMemo(() => {
    const map = new Map<string, ReturnProof>()
    for (const p of myProofs) {
      if (p.request_id && !map.has(p.request_id)) map.set(p.request_id, p)
    }
    return map
  }, [myProofs])

  const { data: myEventItems = [] } = useQuery({
    queryKey: ["my-event-items", user?.id],
    queryFn: () => fetchMyEventItems(user!.id),
    enabled: !!user,
    staleTime: 30 * 1000,
  })

  const openEventItems = useMemo(
    () => myEventItems.filter((it) => !it.returned),
    [myEventItems],
  )

  const proofByEventItem = useMemo(() => {
    const map = new Map<string, ReturnProof>()
    for (const p of myProofs) {
      if (p.event_item_id && !map.has(p.event_item_id)) map.set(p.event_item_id, p)
    }
    return map
  }, [myProofs])

  const { data: equipments = [] } = useQuery({
    queryKey: ["equipments"],
    queryFn: fetchEquipmentsList,
  })

  const equipmentMap = useMemo(() => {
    const map = new Map<string, { image: string }>()
    for (const eq of equipments) map.set(eq.id, { image: eq.image })
    return map
  }, [equipments])

  const pendingRequests = useMemo(
    () => myRequests.filter((r) => r.status === "Pending" || r.status === "Approved"),
    [myRequests],
  )

  const borrows = useMemo(() => myBorrows as BorrowedRecord[], [myBorrows])

  const approvedRequestByEquipment = useMemo(() => {
    const map = new Map<string, RequestLike>()
    for (const r of myRequests as RequestLike[]) {
      if (r.status === "Approved") map.set(r.equipment_id, r)
    }
    return map
  }, [myRequests])

  const activeBorrows = useMemo(() => borrows.filter((r) => !r.returned_on), [borrows])
  const returnedBorrows = useMemo(() => borrows.filter((r) => !!r.returned_on), [borrows])
  const overdueBorrows = useMemo(() => activeBorrows.filter(isOverdue), [activeBorrows])

  useEffect(() => {
    if (overdueBorrows.length === 0 || overdueToastRef.current) return
    overdueToastRef.current = true
    const t = setTimeout(
      () => showToast(`You have ${overdueBorrows.length} overdue equipment to return`, "error"),
      0,
    )
    return () => clearTimeout(t)
  }, [overdueBorrows.length, showToast])

  const availableEquipments = useMemo(() => {
    const lower = search.toLowerCase()
    const seen = new Set<string>()
    return equipments.filter((e: Equipment) => {
      if (e.condition === "Borrowed" || e.condition === "Broken" || e.condition === "Unavailable") return false
      if (seen.has(e.name)) return false
      seen.add(e.name)
      return !lower || e.name.toLowerCase().includes(lower) || e.id.toLowerCase().includes(lower)
    })
  }, [equipments, search])

  if (!user || isAdmin || isSuperAdmin) return null

  const detailRequest = myRequests.find(r => r.id === detailId) ?? null

  return (
    <div className="min-h-screen bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          Dashboard
        </h1>

        {overdueBorrows.length > 0 && (
          <div className="bg-red-600 text-white rounded-xl p-4 mb-5 shadow-lg">
            <p className="text-sm sm:text-base font-bold text-center">
              ⚠ You have {overdueBorrows.length} overdue equipment to return
            </p>
            <p className="text-xs sm:text-sm text-center opacity-90 mt-0.5">
              Please return them as soon as possible to avoid penalties.
            </p>
          </div>
        )}

        <section className="mb-8">
          <SectionTitle>Pending</SectionTitle>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-[#a6a6a6]">No pending requests.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {pendingRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r as RequestLike}
                  onClick={() => setDetailId(r.id)}
                  image={equipmentMap.get(r.equipment_id)?.image}
                  formatRequestDate={(iso) => formatManila(iso, dtOpts)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <SectionTitle>Currently Borrowed Items</SectionTitle>
          {activeBorrows.length === 0 ? (
            <p className="text-sm text-[#a6a6a6]">No borrowed items.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {activeBorrows.map((r) => {
                const req = approvedRequestByEquipment.get(r.equipment_id)
                const proof = req ? proofByRequest.get(req.id) : undefined
                return (
                  <BorrowCard
                    key={`${r.equipment_id}:${r.created_at}`}
                    r={r}
                    onReturn={req ? () => setProofModalTarget({
                      requestId: req.id,
                      equipmentId: r.equipment_id,
                      equipmentName: r.equipment_requested,
                    }) : undefined}
                    proofStatus={proof?.status}
                  />
                )
              })}
            </div>
          )}
        </section>

        <section className="mb-8">
          <SectionTitle>Returned</SectionTitle>
          {returnedBorrows.length === 0 ? (
            <p className="text-sm text-[#a6a6a6]">
              No returned equipment yet. All borrowed items returned on time keep this clear.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {returnedBorrows.map((r) => (
                <BorrowCard key={`${r.equipment_id}:${r.created_at}`} r={r} />
              ))}
            </div>
          )}
        </section>

        {openEventItems.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Event Coverage</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {openEventItems.map((it) => {
                const proof = proofByEventItem.get(it.id)
                return (
                  <div key={it.id} className="dark-card rounded-xl border border-white/10 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide font-bold text-[#c89116]">{it.event_name ?? "Event"}</p>
                        <h3 className="text-base font-bold text-white leading-snug truncate">{it.equipment_name ?? it.equipment_id}</h3>
                        <p className="font-mono text-xs text-[#a6a6a6]">{it.equipment_id}</p>
                      </div>
                      <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300">
                        {it.borrow_time ? "Assigned" : ""}
                      </span>
                    </div>
                    <div className="text-xs text-[#a6a6a6] space-y-0.5">
                      <p><span className="font-medium">Borrowed:</span> {formatWallClock(it.borrow_time, dtOpts)}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/10">
                      {proof?.status === "pending" ? (
                        <p className="text-xs text-purple-300 font-bold">Return proof pending officer review.</p>
                      ) : proof?.status === "rejected" ? (
                        <>
                          <p className="text-xs text-red-300 mb-2">
                            Proof rejected{proof.reject_reason ? `: ${proof.reject_reason}` : ""}. Please resubmit.
                          </p>
                          <button
                            type="button"
                            onClick={() => setProofModalTarget({
                              eventItemId: it.id,
                              equipmentId: it.equipment_id,
                              equipmentName: it.equipment_name ?? it.equipment_id,
                            })}
                            className="w-full px-3 py-2 rounded-lg bg-[#c89116] hover:bg-[#caa453] text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Resubmit Return Proof
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setProofModalTarget({
                            eventItemId: it.id,
                            equipmentId: it.equipment_id,
                            equipmentName: it.equipment_name ?? it.equipment_id,
                          })}
                          className="w-full px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Submit Return Proof
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section className="mb-4">
          <SectionTitle>Borrow</SectionTitle>
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
            <input
              type="text"
              placeholder="Search available equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="dark-input w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>

          {availableEquipments.length === 0 ? (
            <p className="text-sm text-[#a6a6a6] text-center py-6">
              {search ? "No available equipment matches your search." : "No equipment available to borrow."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableEquipments.map((eq) => (
                <Link
                  key={eq.id}
                  to={`/request?id=${eq.id}`}
                  className="dark-card rounded-xl border border-white/10 p-3 flex items-center justify-between gap-2 hover:border-[#c89116]/50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{eq.name}</p>
                    <p className="text-xs text-[#a6a6a6] truncate">{eq.id}{eq.owner ? ` — ${eq.owner}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[#a6a6a6]">{eq.condition}</span>
                    <FiPlus className="text-[#c89116]" size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {detailRequest && (
        <RequestInfoModal
          request={detailRequest as RequestLike}
          onClose={() => setDetailId(null)}
          formatDateTime={(iso) => formatWallClock(iso, dtOpts)}
        />
      )}

      {proofModalTarget && user && (
        <ReturnProofModal
          requestId={proofModalTarget.requestId}
          eventItemId={proofModalTarget.eventItemId}
          equipmentId={proofModalTarget.equipmentId}
          equipmentName={proofModalTarget.equipmentName}
          userId={user.id}
          borrowerName={user.fullName}
          onClose={() => setProofModalTarget(null)}
          onSubmitted={() => {
            setProofModalTarget(null)
            void queryClient.invalidateQueries({ queryKey: ["my-return-proofs", user.id] })
            void queryClient.invalidateQueries({ queryKey: ["my-borrows", user.id] })
            void queryClient.invalidateQueries({ queryKey: ["my-requests", user.id] })
            void queryClient.invalidateQueries({ queryKey: ["my-event-items", user.id] })
          }}
          showToast={showToast}
        />
      )}
    </div>
  )
}