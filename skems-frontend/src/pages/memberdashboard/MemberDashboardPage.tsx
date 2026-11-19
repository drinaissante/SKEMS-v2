import { useMemo, useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchMyRequests, fetchBorrowedItemsByUser } from "../../services/supabase"
import { fetchEquipments as fetchEquipmentsList, type Equipment } from "../../services/api"
import { useAuth } from "../../context/AuthContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useToast } from "../../hooks/useToast"
import { formatWallClock, formatManila, toManilaIso, nowMs } from "../../utils/datetime"
import { FiSearch, FiPlus, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import PaginationNav from "../../components/PaginationNav"
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

const SECTION_PAGE_SIZE = 4

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

function EmptyBlock({ children }: { children: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center italic text-[#a6a6a6]/70 text-sm">
      {children}
    </div>
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
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [borrowPage, setBorrowPage] = useState(1)
  const [pendingPage, setPendingPage] = useState(1)
  const [activePage, setActivePage] = useState(1)
  const [returnedPage, setReturnedPage] = useState(1)
  const [eventPage, setEventPage] = useState(1)
  const [archivesPage, setArchivesPage] = useState(1)
  const [proofModalTarget, setProofModalTarget] = useState<{ requestId?: string; eventItemId?: string; equipmentId: string; equipmentName: string } | null>(null)
  const overdueToastRef = useRef(false)
  const isMobile = window.innerWidth < 768

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
    () => myRequests.filter((r) => r.status === "Pending"),
    [myRequests],
  )

  const archives = useMemo(
    () => myRequests.filter((r) => r.status === "Denied" || r.status === "Canceled"),
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

  const sectionSlices = useMemo(() => {
    const slice = (items: unknown[], page: number) => {
      const totalPages = Math.max(1, Math.ceil(items.length / SECTION_PAGE_SIZE))
      const safePage = Math.min(page, totalPages)
      return { totalPages, safePage, items: items.slice((safePage - 1) * SECTION_PAGE_SIZE, safePage * SECTION_PAGE_SIZE) }
    }
    return {
      pending: slice(pendingRequests, pendingPage),
      active: slice(activeBorrows, activePage),
      returned: slice(returnedBorrows, returnedPage),
      event: slice(openEventItems, eventPage),
      archives: slice(archives, archivesPage),
    }
  }, [pendingRequests, pendingPage, activeBorrows, activePage, returnedBorrows, returnedPage, openEventItems, eventPage, archives, archivesPage])

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

  const BORROW_PAGE_SIZE = isMobile ? 1 : 3
  const borrowTotalPages = Math.max(1, Math.ceil(availableEquipments.length / BORROW_PAGE_SIZE))
  const borrowSafePage = Math.min(borrowPage, borrowTotalPages)
  const pagedBorrowEquipments = useMemo(
    () => availableEquipments.slice((borrowSafePage - 1) * BORROW_PAGE_SIZE, borrowSafePage * BORROW_PAGE_SIZE),
    [availableEquipments, borrowSafePage, BORROW_PAGE_SIZE],
  )

  if (!user) return null

  const detailRequest = myRequests.find(r => r.id === detailId) ?? null

  return (
    <div className="min-h-screen bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Dashboard
          </h1>
          {(isAdmin || isSuperAdmin) && (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="shrink-0 px-3 py-2 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white font-bold transition-colors cursor-pointer"
            >
              Officer Dashboard
            </button>
          )}
        </div>

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
            <EmptyBlock>Your pending requests show here.</EmptyBlock>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {sectionSlices.pending.items.map((r) => (
                  <RequestCard
                    key={(r as RequestLike).id}
                    request={r as RequestLike}
                    onClick={() => setDetailId((r as RequestLike).id)}
                    image={equipmentMap.get((r as RequestLike).equipment_id)?.image}
                    formatRequestDate={(iso) => formatManila(iso, dtOpts)}
                  />
                ))}
              </div>
              <PaginationNav
                page={sectionSlices.pending.safePage}
                totalPages={sectionSlices.pending.totalPages}
                onChange={setPendingPage}
              />
            </>
          )}
        </section>

        <section className="mb-8">
          <SectionTitle>Active</SectionTitle>
          {activeBorrows.length === 0 ? (
            <EmptyBlock>Your borrowed items show here.</EmptyBlock>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {(sectionSlices.active.items as BorrowedRecord[]).map((r) => {
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
              <PaginationNav
                page={sectionSlices.active.safePage}
                totalPages={sectionSlices.active.totalPages}
                onChange={setActivePage}
              />
            </>
          )}
        </section>

        <section className="mb-8">
          <SectionTitle>Returned</SectionTitle>
          {returnedBorrows.length === 0 ? (
            <EmptyBlock>No returned equipment yet. All borrowed items returned on time keep this clear.</EmptyBlock>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {(sectionSlices.returned.items as BorrowedRecord[]).map((r) => (
                  <BorrowCard key={`${r.equipment_id}:${r.created_at}`} r={r} />
                ))}
              </div>
              <PaginationNav
                page={sectionSlices.returned.safePage}
                totalPages={sectionSlices.returned.totalPages}
                onChange={setReturnedPage}
              />
            </>
          )}
        </section>

        {openEventItems.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Event Coverage</SectionTitle>
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {(sectionSlices.event.items as (typeof myEventItems)[number][]).map((it) => {
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
              <PaginationNav
                page={sectionSlices.event.safePage}
                totalPages={sectionSlices.event.totalPages}
                onChange={setEventPage}
              />
            </>
          </section>
        )}

        <section className="mb-8">
          <div className="bg-linear-to-r from-[#c89116] to-[#caa453] text-white rounded-xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm sm:text-base font-bold">Want to borrow equipment?</p>
            <button
              type="button"
              onClick={() => navigate("/request")}
              className="shrink-0 px-5 py-2 rounded-lg bg-white text-[#8a5d00] hover:bg-white/90 text-sm font-bold transition-colors cursor-pointer"
            >
              Borrow
            </button>
          </div>
        </section>

        <section className="mb-8">
          <SectionTitle>Borrow</SectionTitle>
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
            <input
              type="text"
              placeholder="Search available equipment..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setBorrowPage(1) }}
              className="dark-input w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>

          {availableEquipments.length === 0 ? (
            <EmptyBlock>
              {search ? "No available equipment matches your search." : "No equipment available to borrow."}
            </EmptyBlock>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBorrowPage(Math.max(1, borrowSafePage - 1))}
                disabled={borrowSafePage === 1}
                aria-label="Previous page"
                className="p-2 rounded-full border border-white/15 text-[#a6a6a6] hover:border-[#c89116] hover:text-[#c89116] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/15 disabled:hover:text-[#a6a6a6] shrink-0"
              >
                <FiChevronLeft size={20} />
              </button>

              <div className="flex-1 min-w-0">
                {pagedBorrowEquipments.length === 0 ? (
                  <EmptyBlock>No equipment on this page.</EmptyBlock>
                ) : (
                  <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
                    {pagedBorrowEquipments.map((eq) => (
                      <Link
                        key={eq.id}
                        to={`/request?id=${eq.id}`}
                        className="dark-card rounded-xl border border-white/10 p-3 flex flex-col justify-between gap-2 hover:border-[#c89116]/50 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{eq.name}</p>
                          <p className="text-xs text-[#a6a6a6] truncate">{eq.id}{eq.owner ? ` — ${eq.owner}` : ""}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-[#a6a6a6]">{eq.condition}</span>
                          <FiPlus className="text-[#c89116] shrink-0" size={16} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setBorrowPage(Math.min(borrowTotalPages, borrowSafePage + 1))}
                disabled={borrowSafePage === borrowTotalPages}
                aria-label="Next page"
                className="p-2 rounded-full border border-white/15 text-[#a6a6a6] hover:border-[#c89116] hover:text-[#c89116] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/15 disabled:hover:text-[#a6a6a6] shrink-0"
              >
                <FiChevronRight size={20} />
              </button>
            </div>
          )}
        </section>

        <section className="mb-4">
          <SectionTitle>Archives</SectionTitle>
          {archives.length === 0 ? (
            <EmptyBlock>Previous borrow requests show here.</EmptyBlock>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {(sectionSlices.archives.items as RequestLike[]).map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    onClick={() => setDetailId(r.id)}
                    image={equipmentMap.get(r.equipment_id)?.image}
                    formatRequestDate={(iso) => formatManila(iso, dtOpts)}
                  />
                ))}
              </div>
              <PaginationNav
                page={sectionSlices.archives.safePage}
                totalPages={sectionSlices.archives.totalPages}
                onChange={setArchivesPage}
              />
            </>
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