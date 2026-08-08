import { useNavigate } from "react-router-dom"
import { usePageTitle } from "../../hooks/usePageTitle"

interface RestrictedProps {
  title?: string
  description?: string
}

export default function Restricted({
  description = "You don't have permission to view this page.",
}: RestrictedProps) {
  usePageTitle("Restricted")
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-fixed-black flex flex-col items-center justify-center px-4">
      <div className="bg-[#111] rounded-xl shadow-xl border border-[#5f5c5c93] p-8 w-full max-w-md text-center">
        <h1 className="text-xl font-bold bg-linear-to-r from-[#cab453] to-[#ffd000] bg-clip-text text-transparent mb-10 uppercase">
          Restricted
        </h1>
        <p className="text-sm text-gray-400 mb-12">{description}</p>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 text-sm border-2 border-[#c89116] text-[#c89116] rounded-lg hover:bg-[#fdb125] hover:text-white transition-colors cursor-pointer"
          >
            Go Back
          </button>

          <button
            onClick={() => navigate("/")}
            className="flex-1 py-2.5 text-sm bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
