import { useState } from "react"
import type { Equipment } from "../../services/api"

interface EquipmentFormModalProps {
  equipment?: Equipment
  onSave: (eq: Equipment) => Promise<void>
  onClose: () => void
  conditions: string[]
  imageUpload: (file: File) => Promise<string>
}

export default function EquipmentFormModal({
  equipment,
  onSave,
  onClose,
  conditions,
  imageUpload,
}: EquipmentFormModalProps) {
  const isEdit = !!equipment

  const [name, setName] = useState(equipment?.name ?? "")
  const [category, setCategory] = useState(equipment?.category ?? "Camera Gear")
  const [owner, setOwner] = useState(equipment?.owner ?? "")
  const [dateGivenToSK, setDateGivenToSK] = useState(
    equipment?.dateGivenToSK ?? "",
  )
  const [condition, setCondition] = useState(equipment?.condition ?? "Working")
  const [comments, setComments] = useState(equipment?.comments ?? "")
  const [imageUrl, setImageUrl] = useState(equipment?.image ?? "")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await imageUpload(file)
      setImageUrl(url)
    } catch {
      // upload failed — keep existing image
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        id: equipment?.id ?? "",
        name,
        category,
        image: imageUrl,
        owner,
        dateGivenToSK,
        condition,
        comments,
        borrowerName: equipment?.borrowerName ?? "",
        dateBorrowed: equipment?.dateBorrowed ?? "",
        dateDue: equipment?.dateDue ?? "",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-lg sm:text-xl font-bold text-[#222] mb-4">
          {isEdit ? "Edit Equipment" : "Add Equipment"}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg text-[#222]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-[#666] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#c89116] file:text-white file:cursor-pointer"
            />
            {uploading && (
              <p className="text-xs text-[#666] mt-1">Uploading...</p>
            )}
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg mt-2 border border-[#d9d9d9]"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg text-[#222] bg-white"
            >
              <option>Camera Gear</option>
              <option>Lighting Equipment</option>
              <option>Stands & Mounts</option>
              <option>Wireless Microphones</option>
              <option>Special Effects & Accessories</option>
              <option>Office Equipment</option>
              <option>Communication Equipment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">
              Owner
            </label>
            <input
              required
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg text-[#222]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">
              Date Given to SK
            </label>
            <input
              type="date"
              required
              value={dateGivenToSK}
              onChange={(e) => setDateGivenToSK(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg text-[#222]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg text-[#222] bg-white"
            >
              {conditions.map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">
              Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-lg text-[#222]"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2 text-sm border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add"}
          </button>
        </div>
      </form>
    </div>
  )
}
