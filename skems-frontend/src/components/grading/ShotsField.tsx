import type { FormData } from "../../constants/gradingConstants"

interface ShotsFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function ShotsField({
    form,
    setForm
}: ShotsFieldProps) {
    return (
        <div className="flex gap-2">
            <div className="w-24 shrink-0">
                <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                    Shots
                </label>

                <input
                    type="number"
                    min={0}
                    required
                    value={form.shots_posted}
                    onChange={(e) =>
                    setForm((f) => ({
                        ...f,
                        shots_posted: parseInt(e.target.value) || 0,
                    }))
                    }
                    className="dark-input w-full"
                />
            </div>

            <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                    Notes
                </label>
                <input
                    type="text"
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={(e) => 
                        setForm((f) => 
                            ({ ...f, notes: e.target.value })
                        )
                    }
                    className="dark-input w-full"
                />
            </div>
        </div>
    )
}