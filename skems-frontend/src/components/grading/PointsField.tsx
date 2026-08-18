import { POINTS_OPTIONS, type FormData } from "../../constants/gradingConstants"

interface PointsFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function PointsField({
    form,
    setForm
}: PointsFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Points
            </label>
            <select
                required
                value={form.points}
                onChange={(e) =>
                    setForm((f) => ({ ...f, points: parseFloat(e.target.value) }))
                }
                className="dark-input w-full"
            >
                {POINTS_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                ))}
            </select>
        </div>
    )
}
