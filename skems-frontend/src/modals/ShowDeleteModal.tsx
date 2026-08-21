import { QueryClient, useMutation } from "@tanstack/react-query"
import { deleteEquipment } from "../services/api"
import { useToast } from "../hooks/useToast"

interface ShowDeleteModalProps {
    setShowDeleteConfirm: React.Dispatch<React.SetStateAction<boolean>>,
    deletingId: string,
    setDeletingId: React.Dispatch<React.SetStateAction<string>>,
    queryClient: QueryClient,
    handleSync: () => void,
}

export default function ShowDeleteModal({
    setShowDeleteConfirm,
    deletingId,
    setDeletingId,
    queryClient,
    handleSync,
}: ShowDeleteModalProps) {
  const { showToast } = useToast()
        
    const deleteMutation = useMutation({
        mutationFn: deleteEquipment,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["equipments"] })
        showToast("Equipment deleted!", "success")
        setTimeout(handleSync, 3500)
        },
    })
    
    const confirmDelete = async () => {
        await deleteMutation.mutateAsync(deletingId)
        setShowDeleteConfirm(false)
        setDeletingId("")
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-base sm:text-lg font-bold text-white mb-2 text-center">Remove Equipment</p>
            <p className="text-sm text-[#a6a6a6] mb-6 text-center">
              Are you sure you want to remove this equipment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletingId("") }}
                className="btn-ghost flex-1 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
    )
}