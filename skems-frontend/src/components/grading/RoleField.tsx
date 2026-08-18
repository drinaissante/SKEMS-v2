import { ROLE_OPTIONS, type FormData } from "../../constants/gradingConstants"

interface RoleFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function RoleField({
    form,
    setForm
}: RoleFieldProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Role
            </label>
            <select
                required
                value={form.role}
                onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                }
                className="dark-input w-full"
            >
                <option value="">Select...</option>
                {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                ))}
            </select>
        </div>
    )
}
