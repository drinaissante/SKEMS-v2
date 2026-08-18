import { useMemo } from "react"
import { useEventNames } from "../../hooks/useEventNames"
import { CUSTOM_VALUE, type FormData } from "../../constants/gradingConstants"

interface EventFieldProps {
    form: FormData,
    setForm: React.Dispatch<React.SetStateAction<FormData>>
}

export default function EventField({
    form,
    setForm
}: EventFieldProps) {
    const { data: eventOptions = [], isLoading: loadingEvents } = useEventNames()

    const eventLookup = useMemo(
        () => new Map(eventOptions.map((e) => [e.event_name, e.start_date])),
        [eventOptions],
    )

  const sortedEvents = useMemo(
        () => [...eventOptions].sort((a, b) => b.start_date.localeCompare(a.start_date)),
        [eventOptions],
  )

  const eventSelectValue = form.event_name === "" ? "" 
        : eventLookup.has(form.event_name) 
            ? form.event_name : CUSTOM_VALUE

    return (
        <div>
            <label className="block text-sm font-medium text-[#a6a6a6] mb-1">
                Event
            </label>
            {loadingEvents ? (
                <div className="dark-input w-full text-sm text-[#a6a6a6]">
                Loading event list...
                </div>
            ) : (
                <select
                    required={eventSelectValue !== CUSTOM_VALUE}
                    value={eventSelectValue}
                    onChange={(e) => {
                        const val = e.target.value

                        if (val === CUSTOM_VALUE) {
                            setForm((f) => ({ ...f, event_name: "", date: "" }))
                        } else {
                            const startDate = eventLookup.get(val) || ""
                            setForm((f) => ({
                                ...f,
                                event_name: val,
                                ...(startDate ? { date: startDate } : {}),
                            }))
                        }
                    }}
                    className="dark-input w-full"
                >
                    <option value="">Select an event...</option>
                        {sortedEvents.map((ev) => (
                            <option key={ev.event_name} value={ev.event_name}>
                            {ev.start_date} | {ev.event_name}
                            </option>
                        ))}
                    <option value={CUSTOM_VALUE}>Other (Custom)</option>
                </select>
            )}

            {eventSelectValue === CUSTOM_VALUE && (
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Enter event name"
                        value={form.event_name}
                        onChange={(e) =>
                        setForm((f) => ({
                            ...f,
                            event_name: e.target.value,
                        }))
                        }
                        className="dark-input flex-1 min-w-0"
                    />
                    
                    <input
                        type="date"
                        required
                        value={form.date}
                        onChange={(e) =>
                        setForm((f) => ({ ...f, date: e.target.value }))
                        }
                        className="dark-input w-40 shrink-0"
                    />
                </div>
            )}
        </div>
    )
}