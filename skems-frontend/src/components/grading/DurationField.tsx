import { DURATION_OPTIONS, type FormData } from "../../constants/gradingConstants"

interface DurationFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function DurationField({
    form,
    setForm
}: DurationFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Duration
            </label>
            <select
                required
                value={form.duration}
                onChange={(e) =>
                    setForm((f) => ({ ...f, duration: e.target.value }))
                }
                className="dark-input w-full"
            >
                <option value="">Select...</option>
                {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                ))}
            </select>
        </div>
    )
}
