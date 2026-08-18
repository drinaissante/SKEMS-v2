import { STATUS_OPTIONS_GRADING, type FormData } from "../../constants/gradingConstants"

interface StatusFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function StatusField({
    form,
    setForm
}: StatusFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Status
            </label>
            <select
                required
                value={form.status}
                onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                }
                className="dark-input w-full"
            >
                <option value="">Select...</option>
                {STATUS_OPTIONS_GRADING.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
        </div>
    )
}
