import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { fetchEquipments, type Equipment } from "../../services/api"
import { submitRequest } from "../../services/supabase"
import { useAuth } from "../../context/AuthContext"

function todayNow(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function RequestPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get("equipment")

  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [equipmentId, setEquipmentId] = useState(preselectedId || "")
  const [reason, setReason] = useState("")
  const [dateBorrowed, setDateBorrowed] = useState("")
  const [dateDue, setDateDue] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const loadEquipments = async () => {
    const data = await fetchEquipments()
    setEquipments(data.filter((e) => e.condition !== "Borrowed"))
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEquipments() }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (preselectedId) setEquipmentId(preselectedId) }, [preselectedId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!equipmentId || !reason || !dateBorrowed || !dateDue) {
      setError("Please fill in all fields.")
      return
    }
    if (new Date(dateDue) < new Date(dateBorrowed)) {
      setError("Return date must be after borrow date.")
      return
    }

    setShowModal(true)
  }

  const confirmSubmit = async () => {
    setShowModal(false)
    setSubmitting(true)

    const selected = equipments.find((e) => e.id === equipmentId)

    try {
      await submitRequest({
        equipmentId,
        equipmentName: selected?.name ?? "",
        borrowerName: user?.fullName ?? "",
        studentNumber: user?.studentNumber ?? "",
        reason,
        dateBorrowed,
        dateDue,
        userId: user?.id ?? "",
      })

      setSuccess(true)
      setEquipmentId("")
      setReason("")
      setDateBorrowed("")
      setDateDue("")
    } catch {
      setError("Failed to submit request. Please try again.")
    }

    setSubmitting(false)
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-3 py-8 bg-[#f5f5f5]">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-5 sm:p-8 border border-[#d9d9d9]">

        <h2 className="text-xl sm:text-2xl font-bold text-center text-[#222] mb-5">
          Equipment Request
        </h2>

        {success ? (
          <div className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <p className="text-base sm:text-lg font-bold text-green-600 mb-2">
              Request Submitted!
            </p>

            <p className="text-sm text-[#666] mb-4">
              Please wait for approval from the SK officer.
            </p>

            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-2 bg-[#c89116] hover:bg-[#caa453] text-white rounded-lg transition-colors cursor-pointer text-sm"
            >
              New Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <div>
              <label htmlFor="equipment" className="block text-sm font-medium text-[#666] mb-1">
                Equipment
              </label>

              {loading ? (
                <p className="text-sm text-[#a6a6a6]">Loading equipment...</p>
              ) : (
                <select
                  id="equipment"
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222] bg-white"
                >
                  <option value=""> -- Select Equipment -- </option>

                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.category}) - {eq.condition}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Name</label>
              <input
                type="text"
                value={user.fullName}
                disabled
                className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg bg-[#f5f5f5] text-[#666]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Student Number</label>
              <input
                type="text"
                value={user.studentNumber}
                disabled
                className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg bg-[#f5f5f5] text-[#666]"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-[#666] mb-1">
                Reason for Borrowing
              </label>
              <textarea
                required
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Describe why you need this equipment..."
                className="w-full px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">Date & Time to be Borrowed</label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={dateBorrowed}
                  onChange={(e) => setDateBorrowed(e.target.value)}
                  className="flex-1 px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
                <button
                  type="button"
                  onClick={() => setDateBorrowed(todayNow())}
                  className="px-3 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Today
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-1">
                Date & Time to be Returned / Due Date
              </label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={dateDue}
                  onChange={(e) => setDateDue(e.target.value)}
                  className="flex-1 px-3 py-2 text-base border border-[#d9d9d9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fdb125] text-[#222]"
                />
                <button
                  type="button"
                  onClick={() => setDateDue(todayNow())}
                  className="px-3 py-2 text-sm bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Today
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full mt-2 py-2.5 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-sm sm:text-base"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 w-full max-w-sm text-center mx-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ffd870] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#c89116]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-base sm:text-lg font-bold text-[#222] mb-2">Important Notice</p>
              <p className="text-sm text-[#666] mb-5">
                Date returned MUST be followed accordingly. Failure to return on time may result in penalties.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  className="flex-1 py-2 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer text-sm"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
