import { CONDITION_OPTIONS } from "../../../constants/borrowedConstants"
import ProofImage from "../../../components/ProofImage"
import type { ReturnProof } from "../../../services/supabase"

interface ProofReviewModalProps {
  proof: ReturnProof
  equipmentName: string
  borrowerName: string
  conditionAfter: string
  rejectReason: string
  onConditionChange: (value: string) => void
  onReasonChange: (value: string) => void
  onApprove: () => void
  onReject: () => void
  approvePending: boolean
  rejectPending: boolean
  onClose: () => void
}

export default function ProofReviewModal({
  proof,
  equipmentName,
  borrowerName,
  conditionAfter,
  rejectReason,
  onConditionChange,
  onReasonChange,
  onApprove,
  onReject,
  approvePending,
  rejectPending,
  onClose,
}: ProofReviewModalProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl py-6 px-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white text-center mb-1">Review Return Proof</h3>
        <p className="text-xs text-[#a6a6a6] text-center mb-4">
          <span className="text-white font-medium">{equipmentName}</span> · {borrowerName}
        </p>

        <ProofImage path={proof.storage_path} className="w-full h-56" />

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wide font-bold text-[#a6a6a6] mb-1">
              After Condition
            </label>
            <select
              value={conditionAfter}
              onChange={(e) => onConditionChange(e.target.value)}
              className="dark-input w-full text-sm"
            >
              <option value="" disabled>Select condition…</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wide font-bold text-[#a6a6a6] mb-1">
              Rejection Reason (optional)
            </label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="dark-input w-full text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={rejectPending}
              onClick={onReject}
              className="btn-ghost flex-1 py-2.5 rounded-lg text-sm disabled:opacity-40"
            >
              {rejectPending ? "Rejecting..." : "Reject"}
            </button>
            <button
              type="button"
              disabled={approvePending || !conditionAfter}
              onClick={onApprove}
              className="btn-gold flex-1 py-2.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {approvePending ? "Approving..." : "Approve Return"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
