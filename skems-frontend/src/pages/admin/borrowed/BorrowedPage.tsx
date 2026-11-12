import { useState, useMemo, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../../../hooks/useToast"
import { useAuth } from "../../../context/AuthContext"
import { fetchEquipments, exportToSheets } from "../../../services/api"
import {
  fetchBorrowedItems,
  updateBorrowedItem,
  deleteBorrowedItem,
  fetchAllProfiles,
  fetchPendingReturnProofs,
  approveReturnProof,
  rejectReturnProof,
  getReturnProofUrl,
  type ReturnProof,
} from "../../../services/supabase"
import type { BorrowRecord } from "../../../constants/borrow"
import { CONDITION_OPTIONS } from "../../../constants/borrowedConstants"
import { FiSearch } from "react-icons/fi"
import { MOBILE_ITEMS, DESKTOP_ITEMS } from "../../../constants/borrowedConstants"
import BorrowedCards from "./BorrowedCards"
import PaginationNav from "../../../components/PaginationNav"
import { EditModal, DeleteModal } from "./BorrowedModals"
import { usePageTitle } from "../../../hooks/usePageTitle"

function ProofImage({ path }: { path: string }) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    let active = true
    getReturnProofUrl(path).then((u) => {
      if (active) setUrl(u)
    })
    return () => { active = false }
  }, [path])
  if (!url) return <div className="w-full h-40 bg-white/5 rounded-lg animate-pulse" />
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Return proof" className="w-full h-40 object-cover rounded-lg border border-white/10" loading="lazy" />
    </a>
  )
}

export default function BorrowedPage() {
  usePageTitle("Borrowed")
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<BorrowRecord | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [editConditionBefore, setEditConditionBefore] = useState<string>("")
  const [editConditionAfter, setEditConditionAfter] = useState<string>("")
  const [editNotes, setEditNotes] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [proofConditions, setProofConditions] = useState<Record<string, string>>({})
  const [proofReasons, setProofReasons] = useState<Record<string, string>>({})

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["borrowed-items"],
    queryFn: fetchBorrowedItems,
  })

  useQuery({
    queryKey: ["equipments"],
    queryFn: fetchEquipments,
  })

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchAllProfiles,
  })

  const ownerPositionMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of profiles) {
      const key = p.full_name.trim().toLowerCase()
      if (p.position && !map.has(key)) map.set(key, p.position)
    }
    return map
  }, [profiles])

  const handleSync = useCallback(async () => {
    showToast("Updating...", "info")
    const fresh = await queryClient.fetchQuery({ queryKey: ["equipments"], queryFn: fetchEquipments })
    const result = await exportToSheets(fresh)
    if (result.ok) {
      showToast("Successfully synced!", "success")
    } else {
      showToast("Sync failed: " + (result.error ?? "Unknown error"), "error")
    }
  }, [showToast, queryClient])

  const filtered = useMemo(() => {
    if (!search.trim()) return records
    const q = search.toLowerCase()
    return records.filter((r) =>
      r.full_name.toLowerCase().includes(q) ||
      r.equipment_requested.toLowerCase().includes(q) ||
      r.equipment_id.toLowerCase().includes(q) ||
      r.position_department?.toLowerCase().includes(q)
    )
  }, [records, search])

  const itemsPerPage = isMobile ? MOBILE_ITEMS : DESKTOP_ITEMS
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  const updateMutation = useMutation({
    mutationFn: ({
      equipmentId,
      updates,
    }: {
      equipmentId: string
      updates: { condition_before?: string; condition_after?: string; notes?: string }
    }) => updateBorrowedItem(equipmentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
      showToast("Changes saved!", "success")
      setTimeout(handleSync, 3500)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (equipmentId: string) => deleteBorrowedItem(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
      showToast("Record deleted!", "success")
      setTimeout(handleSync, 3500)
    },
  })

  const { data: pendingProofs = [] } = useQuery({
    queryKey: ["pending-return-proofs"],
    queryFn: fetchPendingReturnProofs,
  })

  const pendingProofIds = useMemo(
    () => new Set((pendingProofs as ReturnProof[]).map((p) => p.equipment_id)),
    [pendingProofs],
  )

  const recordNameMap = useMemo(() => {
    const map = new Map<string, { name: string; borrower: string }>()
    for (const r of records) {
      if (!map.has(r.equipment_id)) {
        map.set(r.equipment_id, { name: r.equipment_requested, borrower: r.full_name })
      }
    }
    return map
  }, [records])

  const approveProofMutation = useMutation({
    mutationFn: ({ proof, conditionAfter }: { proof: ReturnProof; conditionAfter: string }) =>
      approveReturnProof({
        proof,
        conditionAfter,
        adminUserId: user!.id,
        equipmentName: recordNameMap.get(proof.equipment_id)?.name ?? proof.equipment_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
      queryClient.invalidateQueries({ queryKey: ["pending-return-proofs"] })
      showToast("Return approved!", "success")
      setTimeout(handleSync, 3500)
    },
    onError: (err) => {
      showToast("Failed to approve return: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  const rejectProofMutation = useMutation({
    mutationFn: ({ proof, reason }: { proof: ReturnProof; reason: string }) =>
      rejectReturnProof({
        proof,
        reason,
        adminUserId: user!.id,
        equipmentName: recordNameMap.get(proof.equipment_id)?.name ?? proof.equipment_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-return-proofs"] })
      showToast("Proof rejected. The member has been notified.", "success")
    },
    onError: (err) => {
      showToast("Failed to reject proof: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    },
  })

  const handleReviewProof = (equipmentId: string) => {
    const el = document.getElementById(`proof-${equipmentId}`)
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" })
  }

  const handleEdit = (r: BorrowRecord) => {
    setEditing(r)
    setEditConditionBefore(r.condition_before || "")
    setEditConditionAfter(r.condition_after || "")
    setEditNotes(r.notes || "")
  }

  const handleSave = async () => {
    if (!editing) return
    try {
      await updateMutation.mutateAsync({
        equipmentId: editing.equipment_id,
        updates: {
          condition_before: editConditionBefore,
          condition_after: editConditionAfter,
          notes: editNotes,
        },
      })
      setEditing(null)
    } catch {
      showToast("Failed to save changes.", "error")
    }
  }

  const handleDelete = async (equipmentId: string) => {
    try {
      await deleteMutation.mutateAsync(equipmentId)
      setShowDeleteConfirm(null)
    } catch {
      showToast("Failed to delete record.", "error")
    }
  }

  const getDeleteLabel = () => {
    if (!showDeleteConfirm) return ""
    const r = records.find((r) => r.equipment_id === showDeleteConfirm)
    return r ? r.equipment_requested : showDeleteConfirm
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          Borrowed Items
        </h1>

        {(pendingProofs as ReturnProof[]).length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-[#c89116] uppercase tracking-wide mb-3">
              Return Proofs ({(pendingProofs as ReturnProof[]).length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(pendingProofs as ReturnProof[]).map((proof) => {
                const info = recordNameMap.get(proof.equipment_id)
                return (
                  <div
                    key={proof.id}
                    id={`proof-${proof.equipment_id}`}
                    className="dark-card rounded-xl border border-[#c89116]/40 p-4 space-y-3"
                  >
                    <ProofImage path={proof.storage_path} />
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-[#c89116] font-bold">{proof.equipment_id}</p>
                      <p className="text-sm font-bold text-white truncate">{info?.name ?? proof.equipment_id}</p>
                      <p className="text-xs text-[#a6a6a6] truncate">
                        {info?.borrower ?? "Member"} · submitted {new Date(proof.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wide font-bold text-[#a6a6a6] mb-1">
                        After Condition
                      </label>
                      <select
                        value={proofConditions[proof.id] ?? ""}
                        onChange={(e) => setProofConditions(prev => ({ ...prev, [proof.id]: e.target.value }))}
                        className="dark-input w-full text-sm"
                      >
                        <option value="" disabled>Select condition…</option>
                        {CONDITION_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
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
                        disabled={approveProofMutation.isPending || !(proofConditions[proof.id] ?? "")}
                        onClick={() => {
                          const conditionAfter = proofConditions[proof.id] ?? ""
                          if (!conditionAfter) {
                            showToast("Select the after-condition first.", "error")
                            return
                          }
                          approveProofMutation.mutate({ proof, conditionAfter })
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {approveProofMutation.isPending && approveProofMutation.variables?.proof.id === proof.id ? "Approving..." : "Approve Return"}
                      </button>
                      <button
                        type="button"
                        disabled={rejectProofMutation.isPending}
                        onClick={() => rejectProofMutation.mutate({ proof, reason: proofReasons[proof.id] ?? "" })}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        {rejectProofMutation.isPending && rejectProofMutation.variables?.proof.id === proof.id ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
          <input
            type="text"
            placeholder="Search by borrower, equipment, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="dark-input w-full pl-9 pr-3 py-2 text-sm"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-[#a6a6a6] py-10">Loading borrowed items...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#a6a6a6] py-10">
            {search ? "No items match your search." : "No borrowed items found."}
          </p>
        ) : (
          <>
            <BorrowedCards
              items={paginatedItems}
              getOwnerPosition={(name) => ownerPositionMap.get(name.trim().toLowerCase()) ?? ""}
              hasPendingProof={(equipmentId) => pendingProofIds.has(equipmentId)}
              onReviewProof={handleReviewProof}
              onEdit={handleEdit}
              onDelete={(id) => setShowDeleteConfirm(id)}
              deletePending={deleteMutation.isPending}
              deleteVariables={deleteMutation.variables}
            />

            <PaginationNav
              page={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <EditModal
        editing={editing}
        editConditionBefore={editConditionBefore}
        editConditionAfter={editConditionAfter}
        editNotes={editNotes}
        onToggleBefore={setEditConditionBefore}
        onToggleAfter={setEditConditionAfter}
        onNotesChange={setEditNotes}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        updatePending={updateMutation.isPending}
      />

      <DeleteModal
        showDeleteConfirm={showDeleteConfirm !== null}
        deleteItemId={showDeleteConfirm}
        deleteItemLabel={getDeleteLabel()}
        onClose={() => setShowDeleteConfirm(null)}
        onDelete={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        deletePending={deleteMutation.isPending}
      />
    </div>
  )
}
