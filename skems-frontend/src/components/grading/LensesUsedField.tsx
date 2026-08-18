import type { FormData } from "../../constants/gradingConstants"

interface LensesUsedFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function LensesUsedField({
    form,
    setForm
}: LensesUsedFieldProps) {
    return (
        <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Lenses Used
            </label>
            <input
                type="text"
                placeholder="Optional"
                value={form.lenses_used}
                onChange={(e) =>
                    setForm((f) => ({ ...f, lenses_used: e.target.value }))
                }
                className="dark-input w-full"
            />
        </div>
    )
}
