import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import GradientLine from "./GradientLine"
import { requestLogout } from "../utils/logoutEvent"

export default function Navbar() {
  const { isLoggedIn, isAdmin, isSuperAdmin, user } = useAuth()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="select-none sticky top-0 z-50 shadow-2xl border-b border-white/10">
      <nav className="flex items-center justify-between gap-3 px-10 py-4 bg-[#080808a8] text-white font-bold">

        <Link to="/" className="flex items-center gap-3.5 shrink-0 select-none">
          <img src="/sk_icon_no_bg.png" className="h-10 w-10 md:h-8 md:w-8" alt="SK logo" decoding="async" fetchPriority="high" />
          
          <span className="text-[#f7cf1ccb] text-md uppercase">Sine Kultura</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xs">
          <div className="flex uppercase text-xs font-normal gap-7">
            <Link
              to="/"
              className={`relative transition-colors duration-200 hover:text-[#c89116] cursor-pointer ${pathname === "/" ? "text-[#fdb125]" : ""}`}
            >
              Home
              {pathname === "/" && <GradientLine className="absolute inset-x-0 -bottom-2" />}
            </Link>
            <Link
              to="/our-work"
              className={`relative transition-colors duration-200 hover:text-[#c89116] cursor-pointer ${pathname === "/our-work" ? "text-[#fdb125]" : ""}`}
            >
              Our Work
              {pathname === "/our-work" && <GradientLine className="absolute inset-x-0 -bottom-2" />}
            </Link>
            <Link
              to="/about"
              className={`relative transition-colors duration-200 hover:text-[#c89116] cursor-pointer ${pathname === "/about" ? "text-[#fdb125]" : ""}`}
            >
              About
              {pathname === "/about" && <GradientLine className="absolute inset-x-0 -bottom-2" />}
            </Link>
            <Link
              to="/#partnerships"
              className="relative transition-colors duration-200 hover:text-[#c89116] cursor-pointer"
            >
              Partnerships
            </Link>
          </div>

          {isLoggedIn ? (
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
              {isAdmin && (
                <Link
                  to="/dashboard"
                  className={`relative hover:text-[#fdb125] transition-colors ${pathname.startsWith("/dashboard") ? "text-[#fdb125]" : ""}`}
                >
                  Dashboard
                  {pathname.startsWith("/dashboard") && <GradientLine className="absolute inset-x-0 -bottom-2" />}
                </Link>
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
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        View Profile
                      </Link>
                      
                      <hr className="border-[#a6a6a6]/30" />

                      <Link
                        to="/my-requests"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        My Requests
                      </Link>

                      <hr className="border-[#a6a6a6]/30" />

                      <button
                        onClick={() => {
                           requestLogout(); 
                           setProfileOpen(false) 
                        }}
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
            <Link
              to="/login"
              className="px-3 py-2.5 rounded border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] transition-colors duration-300"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden hover:bg-white/10 rounded transition-colors cursor-pointer"
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
        className={`fixed top-0 right-0 h-full w-72 bg-[#222] text-white z-50 transform transition-transform duration-300 md:hidden flex flex-col ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#a6a6a6]/30">
          <img src="/sk_icon_no_bg.png" height={20} width={20} alt="SK logo" decoding="async" fetchPriority="high" />
          <span className="text-[#f7cf1ccb] text-xs uppercase">Sine Kultura</span>
          
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

        <div className="flex-1 flex flex-col gap-2 p-5 overflow-y-auto">
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
                    to="/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/equipments"
                    onClick={() => setSidebarOpen(false)}
                    className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
                  >
                    Equipment
                  </Link>
                  <Link
                    to="/dashboard/requests"
                    onClick={() => setSidebarOpen(false)}
                    className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
                  >
                    Manage Requests
                  </Link>
                  <Link
                    to="/dashboard/borrowed"
                    onClick={() => setSidebarOpen(false)}
                    className="px-4 py-3 rounded hover:bg-white/10 transition-colors"
                  >
                    Borrowed
                  </Link>
                  {isSuperAdmin && (
                    <Link
                      to="/dashboard/users"
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

              <hr className="border-[#a6a6a6]/30 my-2 mt-auto" />

              <button
                onClick={() => { 
                  requestLogout(); 
                  setSidebarOpen(false);
                }}
                className="px-4 py-3 rounded border border-[#a6a6a6] hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex-1 flex flex-col gap-4 text-center">
              <Link to="/" onClick={() => setSidebarOpen(false)} className="relative pb-1">
                Home
                {pathname === "/" ? (
                  <GradientLine className="absolute inset-x-0 bottom-0" />
                ) : (
                  <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                )}
              </Link>
              <Link to="/our-work" onClick={() => setSidebarOpen(false)} className="relative pb-1">
                Our Work
                {pathname === "/our-work" ? (
                  <GradientLine className="absolute inset-x-0 bottom-0" />
                ) : (
                  <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                )}
              </Link>
              <Link to="/about" onClick={() => setSidebarOpen(false)} className="relative pb-1">
                About
                {pathname === "/about" ? (
                  <GradientLine className="absolute inset-x-0 bottom-0" />
                ) : (
                  <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
                )}
              </Link>
              <Link to="/#partnerships" onClick={() => setSidebarOpen(false)} className="relative pb-1">
                Partnerships
                <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
              </Link>
              

              {/* <Link
                to="/register"
                onClick={() => setSidebarOpen(false)}
                className="rounded hover:bg-white/10 transition-colors"
              >
                Register
              </Link>

              <div className="h-px bg-linear-to-r from-transparent via-[#fdb125] to-transparent"/> */}

              <Link
                to="/login"
                onClick={() => setSidebarOpen(false)}
                className="mt-auto px-4 py-3 rounded border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125]  transition-colors text-center"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
