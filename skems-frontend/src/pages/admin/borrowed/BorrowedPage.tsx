import { useState, useMemo, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../../../hooks/useToast"
import { fetchEquipments, exportToSheets } from "../../../services/api"
import {
  fetchBorrowedItems,
  updateBorrowedItem,
  deleteBorrowedItem,
  returnBorrowedItem,
  fetchAllProfiles,
} from "../../../services/supabase"
import type { BorrowRecord } from "../../../constants/borrow"
import { FiSearch } from "react-icons/fi"
import { MOBILE_ITEMS, DESKTOP_ITEMS } from "../../../constants/borrowedConstants"
import BorrowedCards from "./BorrowedCards"
import { EditModal, DeleteModal, ReturnModal } from "./BorrowedModals"
import { usePageTitle } from "../../../hooks/usePageTitle"

export default function BorrowedPage() {
  usePageTitle("Borrowed")
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
  const [returnConfirmId, setReturnConfirmId] = useState<string | null>(null)
  const [returnCondition, setReturnCondition] = useState<string>("")

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

  const returnMutation = useMutation({
    mutationFn: ({ equipmentId, conditionAfter }: { equipmentId: string; conditionAfter: string }) =>
      returnBorrowedItem(equipmentId, conditionAfter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
      showToast("Equipment returned!", "success")
      setTimeout(handleSync, 3500)
    },
  })

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

  const getReturnLabel = () => {
    if (!returnConfirmId) return ""
    const r = records.find((r) => r.equipment_id === returnConfirmId)
    return r ? r.equipment_requested : returnConfirmId
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-fixed-black px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col flex-1 min-h-0 max-w-6xl w-full mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
          Borrowed Items
        </h1>

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
              onReturn={(id) => { setReturnConfirmId(id); setReturnCondition("") }}
              onEdit={handleEdit}
              onDelete={(id) => setShowDeleteConfirm(id)}
              returnPending={returnMutation.isPending}
              returnVariables={returnMutation.variables}
              deletePending={deleteMutation.isPending}
              deleteVariables={deleteMutation.variables}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-gold px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#a6a6a6] font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-gold px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
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

      <ReturnModal
        returnConfirmId={returnConfirmId}
        returnCondition={returnCondition}
        returnItemLabel={getReturnLabel()}
        onConditionChange={setReturnCondition}
        onClose={() => { setReturnConfirmId(null); setReturnCondition("") }}
        onConfirm={() => {
          if (!returnConfirmId || !returnCondition) return
          returnMutation.mutate({ equipmentId: returnConfirmId, conditionAfter: returnCondition })
          setReturnConfirmId(null)
          setReturnCondition("")
        }}
        returnPending={returnMutation.isPending}
      />
    </div>
  )
}
