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
      <div className="bg-white rounded-xl shadow-xl py-8 px-5 sm:py-8 sm:px-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg sm:text-xl font-bold text-[#222] mb-4">
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
                <label className="block text-xs font-medium text-[#666] mb-0.5">
                  {fieldLabels[k]} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={v ?? ""}
                  onChange={(e) => onChangeField(k as string, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-[#d9d9d9]">
          <label className="block text-xs font-medium text-[#666] mb-2">
            Equipment
          </label>
          {editableFields.equipment_list.map((eqItem, idx) => (
            <div key={idx} className="mb-3 p-3 bg-[#f5f5f5] rounded-lg border border-[#d9d9d9]">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={eqItem.item}
                  onChange={(e) => onChangeEquipmentItem(idx, e.target.value)}
                  placeholder="Equipment name"
                  className="flex-1 px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
                <input
                  type="number"
                  value={eqItem.quantity}
                  onChange={(e) => onChangeEquipmentQuantity(idx, e.target.value)}
                  min={1}
                  placeholder="Qty"
                  className="w-16 px-2 py-2 text-sm border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222] text-center"
                />
                <button
                  onClick={() => onRemoveEquipment(idx)}
                  className="px-2 py-2 text-red-500 hover:text-red-700 cursor-pointer"
                  title="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-2">
                <label className="block text-xs font-medium text-[#666] mb-1">Selected Equipment</label>
                {selectedEquipments[idx] ? (
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#d9d9d9]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-[#222] truncate">{selectedEquipments[idx]!.name}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${conditionBadgeClass(selectedEquipments[idx]!.condition)}`}>
                        {selectedEquipments[idx]!.condition}
                      </span>
                      <span className="text-xs text-[#a6a6a6]">{selectedEquipments[idx]!.id}</span>
                    </div>
                    <button
                      onClick={() => onSelectEquipment(idx)}
                      className="ml-2 px-2 py-1 text-xs bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded transition-colors cursor-pointer shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-200">
                    <span className="text-sm text-red-600">No equipment selected</span>
                    <button
                      onClick={() => onSelectEquipment(idx)}
                      className="px-2 py-1 text-xs bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded transition-colors cursor-pointer"
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
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#c89116] font-medium hover:text-[#caa453] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        <div className="mt-5 border-t border-[#d9d9d9] pt-4 space-y-3">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={aiAcknowledged}
              onChange={(e) => onSetAiAcknowledged(e.target.checked)}
              className="mt-0.5 accent-[#c89116]"
            />
            <span className="text-sm text-[#666]">
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
            <span className="text-sm text-[#666]">
              I have reviewed, verified, and confirmed that all details are correct.
            </span>
          </label>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!aiAcknowledged || !reviewConfirmed || isSubmitting || editableFields.equipment_list.some((_, i) => selectedEquipments[i] == null)}
            className="flex-1 py-2.5 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
}
