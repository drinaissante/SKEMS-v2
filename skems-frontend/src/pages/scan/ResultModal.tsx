import type { ScannedFormFields } from "../../constants/borrow"
import { fieldLabels, conditionBadgeClass } from "../../constants/scanConstants"

interface Props {
  editableFields: ScannedFormFields
  selectedEquipments: Record<number, { id: string; name: string; owner: string; condition: string } | null>
  aiAcknowledged: boolean
  reviewConfirmed: boolean
  isSubmitting: boolean
  onChangeField: (key: string, value: string) => void
  onChangeEquipmentItem: (index: number, value: string) => void
  onChangeEquipmentQuantity: (index: number, value: string) => void
  onRemoveEquipment: (index: number) => void
  onAddEquipment: () => void
  onSelectEquipment: (index: number) => void
  onSetAiAcknowledged: (v: boolean) => void
  onSetReviewConfirmed: (v: boolean) => void
  onSubmit: () => void
  onCancel: () => void
}

export default function ResultModal({
  editableFields,
  selectedEquipments,
  aiAcknowledged,
  reviewConfirmed,
  isSubmitting,
  onChangeField,
  onChangeEquipmentItem,
  onChangeEquipmentQuantity,
  onRemoveEquipment,
  onAddEquipment,
  onSelectEquipment,
  onSetAiAcknowledged,
  onSetReviewConfirmed,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
      <div className="bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl py-8 px-5 sm:py-8 sm:px-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
          Extracted Form Data
        </h3>
        <p className="text-xs text-[#a6a6a6] mb-4">
          Review and edit the extracted information before submitting.
        </p>

        <div className="space-y-3">
          {(Object.keys(fieldLabels) as Array<keyof typeof fieldLabels>).map((k) => {
            const v = editableFields[k] as string
            return (
              <div key={k}>
                <label className="block text-xs font-medium text-[#a6a6a6] mb-0.5">
                  {fieldLabels[k]} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={v ?? ""}
                  onChange={(e) => onChangeField(k as string, e.target.value)}
                  className="dark-input w-full text-sm"
                />
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <label className="block text-xs font-medium text-[#a6a6a6] mb-2">
            Equipment
          </label>
          {editableFields.equipment_list.map((eqItem, idx) => (
            <div key={idx} className="mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={eqItem.item}
                  onChange={(e) => onChangeEquipmentItem(idx, e.target.value)}
                  placeholder="Equipment name"
                  className="dark-input flex-1 text-sm"
                />
                <input
                  type="number"
                  value={eqItem.quantity}
                  onChange={(e) => onChangeEquipmentQuantity(idx, e.target.value)}
                  min={1}
                  placeholder="Qty"
                  className="dark-input w-16 px-2 text-sm text-center"
                />
                <button
                  onClick={() => onRemoveEquipment(idx)}
                  className="px-2 py-2 text-red-400 hover:text-red-300 cursor-pointer"
                  title="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-2">
                <label className="block text-xs font-medium text-[#a6a6a6] mb-1">Selected Equipment</label>
                {selectedEquipments[idx] ? (
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-white truncate">{selectedEquipments[idx]!.name}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${conditionBadgeClass(selectedEquipments[idx]!.condition)}`}>
                        {selectedEquipments[idx]!.condition}
                      </span>
                      <span className="text-xs text-[#a6a6a6]">{selectedEquipments[idx]!.id}</span>
                    </div>
                    <button
                      onClick={() => onSelectEquipment(idx)}
                      className="ml-2 px-2 py-1 text-xs btn-gold shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-red-500/30">
                    <span className="text-sm text-red-400">No equipment selected</span>
                    <button
                      onClick={() => onSelectEquipment(idx)}
                      className="px-2 py-1 text-xs btn-gold"
                    >
                      Select
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={onAddEquipment}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#fdb125] font-medium hover:text-[#c89116] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4 space-y-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={aiAcknowledged}
              onChange={(e) => onSetAiAcknowledged(e.target.checked)}
              className="mt-0.5 accent-[#c89116]"
            />
            <span className="text-sm text-[#a6a6a6]">
              I acknowledge that AI assisted in parsing this form and results may contain errors.
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reviewConfirmed}
              onChange={(e) => onSetReviewConfirmed(e.target.checked)}
              className="mt-0.5 accent-[#c89116]"
            />
            <span className="text-sm text-[#a6a6a6]">
              I have reviewed, verified, and confirmed that all details are correct.
            </span>
          </label>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1 py-2.5 rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!aiAcknowledged || !reviewConfirmed || isSubmitting || editableFields.equipment_list.some((_, i) => selectedEquipments[i] == null)}
            className="btn-gold flex-1 py-2.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
}
