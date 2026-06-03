import { useNavigate } from "react-router-dom"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-0 px-4 py-12 bg-[#f5f5f5]">
      <div className="bg-white rounded-xl shadow border border-[#d9d9d9] p-8 sm:p-10 w-full max-w-md text-center">
        <h1 className="text-6xl sm:text-7xl font-bold text-[#c89116] mb-2">404</h1>
        <p className="text-lg sm:text-xl font-bold text-[#222] mb-1">Page not found</p>
        <p className="text-sm text-[#666] mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 text-sm border border-[#d9d9d9] text-[#666] rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer"
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
