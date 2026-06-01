import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import mainMp4 from "../../assets/main.mp4"

export default function Home() {
  const { isLoggedIn, user } = useAuth()

  return (
    <div className="relative min-h-screen">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src={mainMp4} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-widest mb-4">
          WELCOME!
        </h1>

        {isLoggedIn ? (
          <>
            <p className="text-white/80 text-sm sm:text-base mb-8 max-w-md">
              Welcome back, {user?.fullName}! What would you like to do today?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-lg">
              <Link
                to="/scan"
                className="w-full sm:flex-1 px-6 py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-xl transition-colors shadow text-sm sm:text-base"
              >
                Scan QR
              </Link>
              <Link
                to="/request"
                className="w-full sm:flex-1 px-6 py-3 border-2 border-[#c89116] text-[#c89116] bg-white/10 hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] font-bold rounded-xl transition-colors text-sm sm:text-base"
              >
                Borrow Equipment
              </Link>
              <Link
                to="/my-requests"
                className="w-full sm:flex-1 px-6 py-3 bg-[#222] hover:bg-[#666] text-white font-bold rounded-xl transition-colors shadow text-sm sm:text-base"
              >
                My Requests
              </Link>
              <Link
                to="/profile"
                className="w-full sm:flex-1 px-6 py-3 bg-[#222] hover:bg-[#666] text-white font-bold rounded-xl transition-colors shadow text-sm sm:text-base"
              >
                My Profile
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-white/80 text-sm sm:text-base mb-8 max-w-md">
              SK Equipment Management System. Register or log in to borrow
              cameras, lighting gear, and more.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full max-w-sm">
              <Link
                to="/register"
                className="w-full sm:flex-1 px-8 py-3 bg-[#c89116] hover:bg-[#caa453] text-white font-bold rounded-lg transition-colors shadow text-sm sm:text-base"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="w-full sm:flex-1 px-8 py-3 border-2 border-[#c89116] text-[#c89116] bg-white/10 hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] font-bold rounded-lg transition-colors text-sm sm:text-base"
              >
                Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
