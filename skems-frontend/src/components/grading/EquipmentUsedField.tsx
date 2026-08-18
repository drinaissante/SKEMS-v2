import type { FormData } from "../../constants/gradingConstants"

interface EquipmentUsedFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function EquipmentUsedField({
    form,
    setForm
}: EquipmentUsedFieldProps) {
    return (
        <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Camera / Equipment Used
            </label>
            <input
                type="text"
                placeholder="Optional"
                value={form.camera_used}
                onChange={(e) =>
                    setForm((f) => ({ ...f, camera_used: e.target.value }))
                }
                className="dark-input w-full"
            />
        </div>
    )
}
