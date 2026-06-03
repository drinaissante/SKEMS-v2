import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export default function Navbar() {
  const { isLoggedIn, isAdmin, isSuperAdmin, user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="sticky top-0 z-50 shadow-xl">
      <nav className="flex items-center justify-between gap-3 px-5 py-3 bg-[#222] text-white font-bold">

        <Link to="/" className="flex items-center gap-2 shrink-0 select-none">
          <img src="/sk_icon_no_bg.png" height={30} width={30} alt="SK logo" decoding="async" fetchPriority="high" />
          <span className="text-[#fdb125] text-lg">SKEMS</span>
        </Link>

        <div className="hidden md:flex items-center gap-4 text-sm">
          {isLoggedIn && (
            <>
              <Link
                to="/scan"
                className="px-3 py-2.5 rounded bg-[#c89116] hover:bg-[#caa453] transition-colors"
              >
                Scan
              </Link>
              <Link
                to="/request"
                className="px-3 py-2.5 rounded bg-[#c89116] hover:bg-[#caa453] transition-colors"
              >
                Request
              </Link>
            </>
          )}

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <>
                  <Link to="/equipments" className="hover:text-[#fdb125] transition-colors">
                    Equipment
                  </Link>
                  <Link to="/admin/requests" className="hover:text-[#fdb125] transition-colors">
                    Manage Requests
                  </Link>
                  <Link to="/admin/borrowed" className="hover:text-[#fdb125] transition-colors">
                    Borrowed
                  </Link>
                  {isSuperAdmin && (
                    <Link to="/admin/users" className="hover:text-[#fdb125] transition-colors">
                      Manage Users
                    </Link>
                  )}
                </>
              )}

              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1 hover:text-[#fdb125] transition-colors cursor-pointer"
                >
                  {user?.fullName ?? "Profile"}
                  <svg className={`w-4 h-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-[#222] border border-[#a6a6a6]/30 rounded-lg shadow-xl py-1 min-w-40">
                      <Link
                        to="/my-requests"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        My Requests
                      </Link>
                      <hr className="border-[#a6a6a6]/30" />
                      <button
                        onClick={() => { logout(); setProfileOpen(false) }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/register" className="hover:text-[#fdb125] transition-colors">
                Register
              </Link>
              <Link
                to="/login"
                className="px-3 py-2.5 rounded bg-[#c89116] hover:bg-[#caa453] transition-colors"
              >
                Login
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden p-3 hover:bg-white/10 rounded transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[#222] text-white z-50 transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#a6a6a6]/30">
          <span className="text-[#fdb125] font-bold text-lg">Menu</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2 p-5">
          {isLoggedIn ? (
            <>
              <Link
                to="/scan"
                onClick={() => setSidebarOpen(false)}
                className="px-4 py-3 rounded bg-[#c89116] hover:bg-[#caa453] transition-colors text-center"
              >
                Scan
              </Link>
              <Link
                to="/request"
                onClick={() => setSidebarOpen(false)}
                className="px-4 py-3 rounded bg-[#c89116] hover:bg-[#caa453] transition-colors text-center"
              >
                Request
              </Link>

                  {isAdmin && (
                <>
                  <Link
                    to="/equipments"
                    onClick={() => setSidebarOpen(false)}
                    className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
                  >
                    Equipment
                  </Link>
                  <Link
                    to="/admin/requests"
                    onClick={() => setSidebarOpen(false)}
                    className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
                  >
                    Manage Requests
                  </Link>
                  <Link
                    to="/admin/borrowed"
                    onClick={() => setSidebarOpen(false)}
                    className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
                  >
                    Borrowed
                  </Link>
                  {isSuperAdmin && (
                    <Link
                      to="/admin/users"
                      onClick={() => setSidebarOpen(false)}
                      className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
                    >
                      Manage Users
                    </Link>
                  )}
                </>
              )}

              <Link
                to="/my-requests"
                onClick={() => setSidebarOpen(false)}
                className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
              >
                My Requests
              </Link>

              <Link
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
              >
                {user?.fullName ?? "Profile"}
              </Link>

              <hr className="border-[#a6a6a6]/30 my-2" />

              <button
                onClick={() => { logout(); setSidebarOpen(false) }}
                className="px-4 py-3 rounded border border-[#a6a6a6] hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                onClick={() => setSidebarOpen(false)}
                className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
              >
                Register
              </Link>
              <Link
                to="/login"
                onClick={() => setSidebarOpen(false)}
                className="px-4 py-3 rounded bg-[#c89116] hover:bg-[#caa453] transition-colors text-center"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
