import { ATTENDANCE_OPTIONS, type FormData } from "../../constants/gradingConstants"

interface AttendanceFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function AttendanceField({
    form,
    setForm
}: AttendanceFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Attendance
            </label>
            <select
                required
                value={form.attendance}
                onChange={(e) =>
                    setForm((f) => ({ ...f, attendance: e.target.value }))
                }
                className="dark-input w-full"
            >
                <option value="">Select...</option>
                {ATTENDANCE_OPTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                ))}
            </select>
        </div>
    )
}
