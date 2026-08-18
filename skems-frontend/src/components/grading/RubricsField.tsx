import { RUBRIC_OPTIONS, RUBRICS, type FormData } from "../../constants/gradingConstants";

interface RubricsFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function RubricsField({
    form,
    setForm
}: RubricsFieldProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {RUBRICS.map(([key, label]) => (
                <div key={key}>
                    <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                        {label}
                    </label>

                    <select
                        value={form[key]}
                        onChange={(e) =>
                            setForm((f) => ({
                            ...f,
                            [key]: parseInt(e.target.value),
                            }))
                        }
                        className="dark-input w-full"
                    >
                        {RUBRIC_OPTIONS.map((v) => (
                            <option key={v} value={v}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
        </div>
    )
}