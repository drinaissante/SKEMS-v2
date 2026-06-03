import { useState, useMemo, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "../../../hooks/useToast"
import { fetchEquipments, exportToSheets } from "../../../services/api"
import {
  fetchBorrowedItems,
  updateBorrowedItem,
  deleteBorrowedItem,
  returnBorrowedItem,
} from "../../../services/supabase"
import type { BorrowRecord } from "../../../constants/borrow"
import { FiSearch } from "react-icons/fi"
import { MOBILE_ITEMS, DESKTOP_ITEMS } from "../../../constants/borrowedConstants"
import BorrowedDesktopTable from "./BorrowedDesktopTable"
import BorrowedMobileCards from "./BorrowedMobileCards"
import { EditModal, DeleteModal, ReturnModal } from "./BorrowedModals"

export default function BorrowedPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<BorrowRecord | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [editConditionBefore, setEditConditionBefore] = useState<string[]>([])
  const [editConditionAfter, setEditConditionAfter] = useState<string[]>([])
  const [editNotes, setEditNotes] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
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
      showToast("Changes saved!", "info", { label: "sync now?", onClick: handleSync })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (equipmentId: string) => deleteBorrowedItem(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
      showToast("Record deleted!", "info", { label: "sync now?", onClick: handleSync })
    },
  })

  const returnMutation = useMutation({
    mutationFn: ({ equipmentId, conditionAfter }: { equipmentId: string; conditionAfter: string }) =>
      returnBorrowedItem(equipmentId, conditionAfter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
      queryClient.invalidateQueries({ queryKey: ["equipments"] })
      showToast("Equipment returned!", "info", { label: "sync now?", onClick: handleSync })
    },
  })

  const handleEdit = (r: BorrowRecord) => {
    setEditing(r)
    setEditConditionBefore(r.condition_before ? r.condition_before.split(",").map((s) => s.trim()).filter(Boolean) : [])
    setEditConditionAfter(r.condition_after ? r.condition_after.split(",").map((s) => s.trim()).filter(Boolean) : [])
    setEditNotes(r.notes || "")
  }

  const toggleCondition = (
    list: string[],
    setter: (v: string[]) => void,
    value: string,
  ) => {
    setter(
      list.includes(value)
        ? list.filter((c) => c !== value)
        : [...list, value],
    )
  }

  const handleSave = async () => {
    if (!editing) return
    try {
      await updateMutation.mutateAsync({
        equipmentId: editing.equipment_id,
        updates: {
          condition_before: editConditionBefore.join(","),
          condition_after: editConditionAfter.join(","),
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
    <div className="min-h-screen bg-[#f5f5f5] px-3 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#222] mb-6">
          Borrowed Items
        </h1>

        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a6a6a6]" size={16} />
          <input
            type="text"
            placeholder="Search by borrower, equipment, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-[#666] py-10">Loading borrowed items...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#666] py-10">
            {search ? "No items match your search." : "No borrowed items found."}
          </p>
        ) : (
          <>
            <BorrowedDesktopTable
              items={paginatedItems}
              onReturn={(id) => { setReturnConfirmId(id); setReturnCondition("") }}
              onEdit={handleEdit}
              onDelete={(id) => setShowDeleteConfirm(id)}
              returnPending={returnMutation.isPending}
              returnVariables={returnMutation.variables}
              deletePending={deleteMutation.isPending}
              deleteVariables={deleteMutation.variables}
            />

            <BorrowedMobileCards
              items={paginatedItems}
              expandedRow={expandedRow}
              onToggleRow={(id) => setExpandedRow(expandedRow === id ? null : id)}
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
                  className="px-4 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#d9d9d9] disabled:text-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#666] font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] disabled:bg-[#d9d9d9] disabled:text-[#a6a6a6] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
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
        onToggleBefore={(c) => toggleCondition(editConditionBefore, setEditConditionBefore, c)}
        onToggleAfter={(c) => toggleCondition(editConditionAfter, setEditConditionAfter, c)}
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
