import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchEventFolders,
  fetchAllEventItems,
  createEventFolder,
  addEventItem,
  removeEventItem,
  markEventItemReturned,
  markEventFolderReturned,
  fetchAllProfiles,
  fetchPendingReturnProofs,
  approveEventItemProof,
  rejectEventItemProof,
  type EventItem,
  type ReturnProof,
} from "../../../services/supabase"
import { useEventNames } from "../../../hooks/useEventNames"
import { fetchEquipments, type Equipment } from "../../../services/api"
import { useAuth } from "../../../context/AuthContext"
import { usePageTitle } from "../../../hooks/usePageTitle"
import { useToast } from "../../../hooks/useToast"
import { formatWallClock } from "../../../utils/datetime"
import { FiSearch, FiFolder, FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi"
import ProofImage from "../../../components/ProofImage"
import PaginationNav from "../../../components/PaginationNav"
import EquipmentPickerList from "../../../components/EquipmentPickerList"

const dtOpts: Intl.DateTimeFormatOptions = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}

const MOBILE_ITEMS = 6
const DESKTOP_ITEMS = 9

export default function EventCoveragePage() {
  usePageTitle("Event Coverage")
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEventName, setNewEventName] = useState("")
  const [eventBorrowTime, setEventBorrowTime] = useState("")
  const [eventReturnTime, setEventReturnTime] = useState("")
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("")
  const [addSearch, setAddSearch] = useState("")
  const [addListPage, setAddListPage] = useState(1)
  const [selectedBorrowerId, setSelectedBorrowerId] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const isMobile = window.innerWidth < 768
  const [itemConditions, setItemConditions] = useState<Record<string, string>>({})
  const [proofConditions, setProofConditions] = useState<Record<string, string>>({})
  const [proofReasons, setProofReasons] = useState<Record<string, string>>({})

  const { data: folders = [] } = useQuery({
    queryKey: ["event-folders"],
    queryFn: fetchEventFolders,
  })

  const { data: allItems = [] } = useQuery({
    queryKey: ["event-items"],
    queryFn: fetchAllEventItems,
  })

  const { data: pendingProofs = [] } = useQuery({
    queryKey: ["pending-return-proofs"],
    queryFn: fetchPendingReturnProofs,
  })

  const { data: equipments = [] } = useQuery({
    queryKey: ["equipments"],
    queryFn: fetchEquipments,
  })

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
  })

  const { data: eventOptions = [], isLoading: loadingEvents } = useEventNames()

  const sortedEvents = useMemo(
    () => [...eventOptions].sort((a, b) => b.start_date.localeCompare(a.start_date)),
    [eventOptions],
  )

  const itemsByFolder = useMemo(() => {
    const map = new Map<string, EventItem[]>()
    for (const it of allItems as EventItem[]) {
      const list = map.get(it.folder_id) ?? []
      list.push(it)
      map.set(it.folder_id, list)
    }
    return map
  }, [allItems])

  const proofsByItem = useMemo(() => {
    const map = new Map<string, ReturnProof>()
    for (const p of pendingProofs as ReturnProof[]) {
      if (p.event_item_id && !map.has(p.event_item_id)) map.set(p.event_item_id, p)
    }
    return map
  }, [pendingProofs])

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null
  const activeItems = activeFolderId ? (itemsByFolder.get(activeFolderId) ?? []) : []
  const allReturned = activeItems.length > 0 && activeItems.every((it) => it.returned)

  const filteredFolders = useMemo(() => {
    const q = search.toLowerCase()
    return folders.filter(
      (f) => !q || f.event_name.toLowerCase().includes(q),
    )
  }, [folders, search])

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["event-folders"] })
    queryClient.invalidateQueries({ queryKey: ["event-items"] })
    queryClient.invalidateQueries({ queryKey: ["pending-return-proofs"] })
    queryClient.invalidateQueries({ queryKey: ["equipments"] })
  }

  const createFolderMutation = useMutation({
    mutationFn: () => createEventFolder(newEventName.trim(), user!.id, eventBorrowTime, eventReturnTime),
    onSuccess: () => {
      invalidateAll()
      setShowCreateModal(false)
      setNewEventName("")
      setEventBorrowTime("")
      setEventReturnTime("")
      showToast("Event folder created.", "success")
    },
    onError: (err) => {
      showToast("Failed to create folder: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  const addItemMutation = useMutation({
    mutationFn: () => {
      const eq = (equipments as Equipment[]).find(e => e.id === selectedEquipmentId)
      const borrower = profiles.find(p => p.id === selectedBorrowerId)
      return addEventItem({
        folderId: activeFolderId!,
        equipmentId: selectedEquipmentId,
        equipmentName: eq?.name ?? selectedEquipmentId,
        borrowerId: selectedBorrowerId || null,
        borrowerName: borrower?.full_name ?? "Unknown",
      })
    },
    onSuccess: () => {
      invalidateAll()
      setShowAddItemModal(false)
      showToast("Equipment added to event.", "success")
    },
    onError: (err) => {
      showToast("Failed to add equipment: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => removeEventItem(itemId),
    onSuccess: () => {
      invalidateAll()
      showToast("Item removed.", "success")
    },
    onError: (err) => {
      showToast("Failed to remove item: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  const markItemReturnedMutation = useMutation({
    mutationFn: ({ itemId, conditionAfter }: { itemId: string; conditionAfter: string }) =>
      markEventItemReturned({ itemId, conditionAfter }),
    onSuccess: () => {
      invalidateAll()
      showToast("Item marked returned.", "success")
    },
    onError: (err) => {
      showToast("Failed to mark returned: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  const closeFolderMutation = useMutation({
    mutationFn: () => markEventFolderReturned(activeFolderId!),
    onSuccess: () => {
      invalidateAll()
      showToast("Event marked returned.", "success")
    },
    onError: (err) => {
      showToast("Failed to close event: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  const approveProofMutation = useMutation({
    mutationFn: ({ proof, conditionAfter }: { proof: ReturnProof; conditionAfter: string }) =>
      approveEventItemProof({
        proof,
        conditionAfter,
        adminUserId: user!.id,
        equipmentName: proof.equipment_id,
      }),
    onSuccess: () => {
      invalidateAll()
      showToast("Return approved!", "success")
    },
    onError: (err) => {
      showToast("Failed to approve: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  const rejectProofMutation = useMutation({
    mutationFn: ({ proof, reason }: { proof: ReturnProof; reason: string }) =>
      rejectEventItemProof({
        proof,
        reason,
        adminUserId: user!.id,
        equipmentName: proof.equipment_id,
      }),
    onSuccess: () => {
      invalidateAll()
      showToast("Proof rejected. The member has been notified.", "success")
    },
    onError: (err) => {
      showToast("Failed to reject: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  const availableEquipments = (equipments as Equipment[]).filter(
    (e) => e.condition !== "Borrowed" && e.condition !== "Broken" && e.condition !== "Unavailable",
  )

  const ADD_PAGE_SIZE = 5
  const addLower = addSearch.toLowerCase()
  const addPickerItems = useMemo(
    () => availableEquipments.filter(
      (e) => !addLower || e.name.toLowerCase().includes(addLower) || e.id.toLowerCase().includes(addLower),
    ),
    [availableEquipments, addLower],
  )
  const addTotalPages = Math.max(1, Math.ceil(addPickerItems.length / ADD_PAGE_SIZE))
  const addSafePage = Math.min(addListPage, addTotalPages)
  const pagedAddItems = useMemo(
    () => addPickerItems.slice((addSafePage - 1) * ADD_PAGE_SIZE, addSafePage * ADD_PAGE_SIZE),
    [addPickerItems, addSafePage],
  )
  const selectedPickerIds = useMemo(
    () => new Set(selectedEquipmentId ? [selectedEquipmentId] : []),
    [selectedEquipmentId],
  )

  if (!user) return null

  const itemsPerPage = isMobile ? MOBILE_ITEMS : DESKTOP_ITEMS
  const totalPages = Math.max(1, Math.ceil(filteredFolders.length / itemsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const pagedFolders = filteredFolders.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage)

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto">
        {activeFolder ? (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => { setActiveFolderId(null); setCurrentPage(1) }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <FiArrowLeft size={14} />
                All Events
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{activeFolder.event_name}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                activeFolder.status === "returned" ? "bg-green-600 text-white" : "bg-purple-500/15 text-purple-300"
              }`}>
                {activeFolder.status === "returned" ? "Returned" : "Open"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {activeFolder.status !== "returned" && (
              <button
                type="button"
                onClick={() => { setShowAddItemModal(true); setAddSearch(""); setAddListPage(1); setSelectedEquipmentId("") }}
                className="btn-gold px-4 py-2 text-sm flex items-center gap-1.5"
              >
                  <FiPlus size={16} />
                  Add Equipment
                </button>
              )}
              <button
                type="button"
                disabled={!allReturned || closeFolderMutation.isPending || activeFolder.status === "returned"}
                title={allReturned ? "Mark every item as returned and close the event." : "All items must be returned first."}
                onClick={() => closeFolderMutation.mutate()}
                className="px-4 py-2 text-sm rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Mark Event Returned
              </button>
            </div>

            {activeItems.length === 0 ? (
              <p className="text-center text-[#a6a6a6] py-10">No equipment added to this event yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {activeItems.map((it) => {
                  const proof = proofsByItem.get(it.id)
                  const condition = itemConditions[it.id] ?? ""
                  return (
                    <div key={it.id} id={`event-item-${it.id}`} className="dark-card rounded-xl border border-white/10 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-[#c89116] font-bold">{it.equipment_id}</p>
                          <h3 className="text-base font-bold text-white leading-snug truncate">{it.equipment_name ?? it.equipment_id}</h3>
                          <p className="text-xs text-[#a6a6a6] truncate">{it.borrower_name}</p>
                        </div>
                        <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          it.returned ? "bg-green-600 text-white" : "bg-purple-500/15 text-purple-300"
                        }`}>
                          {it.returned ? "Returned" : "Out"}
                        </span>
                      </div>

                      <div className="text-xs text-[#a6a6a6] space-y-0.5">
                        <p><span className="font-medium">Borrowed:</span> {formatWallClock(it.borrow_time, dtOpts)}</p>
                        {it.return_time && (
                          <p className="text-green-300"><span className="font-medium">Returned:</span> {formatWallClock(it.return_time, dtOpts)}</p>
                        )}
                        {it.after_condition && (
                          <p><span className="font-medium">After condition:</span> {it.after_condition}</p>
                        )}
                      </div>

                      {proof && (
                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <ProofImage path={proof.storage_path} />
                          <select
                            value={proofConditions[proof.id] ?? ""}
                            onChange={(e) => setProofConditions(prev => ({ ...prev, [proof.id]: e.target.value }))}
                            className="dark-input w-full text-sm"
                          >
                            <option value="" disabled>After condition…</option>
                            {["Working", "Needs Repair", "Broken", "Not checked"].map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Rejection reason (optional)"
                            value={proofReasons[proof.id] ?? ""}
                            onChange={(e) => setProofReasons(prev => ({ ...prev, [proof.id]: e.target.value }))}
                            className="dark-input w-full text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={approveProofMutation.isPending || !proofConditions[proof.id]}
                              onClick={() => approveProofMutation.mutate({ proof, conditionAfter: proofConditions[proof.id] })}
                              className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                              Approve Return
                            </button>
                            <button
                              type="button"
                              disabled={rejectProofMutation.isPending}
                              onClick={() => rejectProofMutation.mutate({ proof, reason: proofReasons[proof.id] ?? "" })}
                              className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {!it.returned && activeFolder.status !== "returned" && (
                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <select
                            value={condition}
                            onChange={(e) => setItemConditions(prev => ({ ...prev, [it.id]: e.target.value }))}
                            className="dark-input w-full text-sm"
                          >
                            <option value="" disabled>Mark returned — after condition…</option>
                            {["Working", "Needs Repair", "Broken", "Not checked"].map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={!condition || markItemReturnedMutation.isPending}
                              onClick={() => markItemReturnedMutation.mutate({ itemId: it.id, conditionAfter: condition })}
                              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                              Mark Returned
                            </button>
                            <button
                              type="button"
                              disabled={removeItemMutation.isPending}
                              onClick={() => removeItemMutation.mutate(it.id)}
                              className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
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
            )}

            {showAddItemModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowAddItemModal(false)}>
                <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-base font-bold text-white mb-4 text-center">Add Equipment to Event</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Equipment <span className="text-xs font-normal">(tap to select)</span></label>
                      <div className="relative mb-2">
                        <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a6a6a6] pointer-events-none" size={14} />
                        <input
                          type="text"
                          value={addSearch}
                          onChange={(e) => { setAddSearch(e.target.value); setAddListPage(1) }}
                          placeholder="Search equipment..."
                          className="dark-input w-full text-sm pl-8"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto pr-1">
                        <EquipmentPickerList
                          items={pagedAddItems}
                          loading={false}
                          search={addSearch}
                          inFormIds={selectedPickerIds}
                          onAdd={(eq) => setSelectedEquipmentId(eq.id)}
                        />
                      </div>
                      {addTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setAddListPage(Math.max(1, addSafePage - 1))}
                            disabled={addSafePage === 1}
                            className="btn-ghost px-3 py-1.5 text-xs rounded disabled:opacity-40"
                          >
                            Prev
                          </button>
                          <span className="text-xs text-[#a6a6a6]">{addSafePage} / {addTotalPages}</span>
                          <button
                            type="button"
                            onClick={() => setAddListPage(Math.min(addTotalPages, addSafePage + 1))}
                            disabled={addSafePage === addTotalPages}
                            className="btn-ghost px-3 py-1.5 text-xs rounded disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Borrower (member)</label>
                      <select
                        value={selectedBorrowerId}
                        onChange={(e) => setSelectedBorrowerId(e.target.value)}
                        className="dark-input w-full text-sm"
                      >
                        <option value="" disabled>Select member…</option>
                        {profiles.map((p) => (
                          <option key={p.id} value={p.id}>{p.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAddItemModal(false)} className="btn-ghost flex-1 py-2 rounded-lg text-sm">
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!selectedEquipmentId || !selectedBorrowerId || addItemMutation.isPending}
                        onClick={() => addItemMutation.mutate()}
                        className="btn-gold flex-1 py-2 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {addItemMutation.isPending ? "Adding..." : "Add to Event"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
              Event Coverage
            </h1>

            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-40">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  className="dark-input w-full pl-9 pr-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn-gold px-4 py-2 text-sm flex items-center gap-1.5"
              >
                <FiPlus size={16} />
                New Event Folder
              </button>
            </div>

            {filteredFolders.length === 0 ? (
              <p className="text-center text-[#a6a6a6] py-10">
                {search ? "No events match your search." : "No event folders yet."}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pagedFolders.map((f) => {
                    const items = itemsByFolder.get(f.id) ?? []
                    const outCount = items.filter((it) => !it.returned).length
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => { setActiveFolderId(f.id); setCurrentPage(1) }}
                        className="dark-card relative rounded-xl border border-white/10 p-4 text-left cursor-pointer hover:border-[#c89116]/50 transition-colors"
                      >
                        <FiFolder className="text-[#c89116] mb-2" size={22} />
                        <h3 className="text-sm font-bold text-white truncate">{f.event_name}</h3>
                        <p className="text-xs text-[#a6a6a6] mt-0.5">{items.length} items{outCount > 0 ? ` · ${outCount} out` : ""}</p>
                        {f.borrow_time && f.return_time && (
                          <p className="text-[10px] text-[#a6a6a6]/80 mt-1 truncate">
                            {formatWallClock(f.borrow_time, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            {" → "}
                            {formatWallClock(f.return_time, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                        <span className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          f.status === "returned" ? "bg-green-600 text-white" : "bg-purple-500/15 text-purple-300"
                        }`}>
                          {f.status === "returned" ? "Returned" : "Open"}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <PaginationNav
                  page={safePage}
                  totalPages={totalPages}
                  onChange={setCurrentPage}
                />
              </>
            )}

            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowCreateModal(false)}>
                <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-base font-bold text-white mb-4 text-center">New Event Folder</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Event</label>
                      {loadingEvents ? (
                        <div className="dark-input w-full text-sm text-[#a6a6a6]">
                          Loading event list...
                        </div>
                      ) : (
                        <select
                          value={sortedEvents.some((ev) => ev.event_name === newEventName) ? newEventName : ""}
                          onChange={(e) => setNewEventName(e.target.value)}
                          className="dark-input w-full text-sm"
                        >
                          <option value="" disabled>Select an event...</option>
                          {sortedEvents.map((ev) => (
                            <option key={ev.event_name} value={ev.event_name}>
                              {ev.start_date} | {ev.event_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#a6a6a6] mb-1">Or type a custom name</label>
                      <input
                        type="text"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="e.g. Intramurals 2026"
                        className="dark-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                        Date & Time to Borrow <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={eventBorrowTime}
                        onChange={(e) => setEventBorrowTime(e.target.value)}
                        className="dark-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                        Date & Time to Return <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={eventReturnTime}
                        onChange={(e) => setEventReturnTime(e.target.value)}
                        className="dark-input w-full text-sm"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => { setShowCreateModal(false); setNewEventName(""); setEventBorrowTime(""); setEventReturnTime("") }} className="btn-ghost flex-1 py-2 rounded-lg text-sm">
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!newEventName.trim() || !eventBorrowTime || !eventReturnTime || createFolderMutation.isPending}
                        onClick={() => {
                          if (new Date(eventReturnTime) < new Date(eventBorrowTime)) {
                            showToast("Return date must be after the borrow date.", "error")
                            return
                          }
                          createFolderMutation.mutate()
                        }}
                        className="btn-gold flex-1 py-2 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
