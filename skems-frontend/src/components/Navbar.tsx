import { useState } from "react"
import { useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import GradientLine from "./GradientLine"
import NavLink from "./NavLink"
import { requestLogout } from "../utils/logoutEvent"
import { FiLogOut } from "react-icons/fi"

export default function Navbar() {
  const { isLoggedIn, isAdmin, isSuperAdmin, user } = useAuth()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="select-none sticky top-0 z-50 shadow-2xl border-b border-white/10">
      <nav className="flex items-center justify-between gap-3 px-10 py-4 bg-[#080808a8] text-white font-bold">

        <NavLink to="/" className="flex items-center gap-3.5 shrink-0 select-none">
          <img src="/sk_icon_no_bg.png" className="h-10 w-10 md:h-8 md:w-8" alt="SK logo" decoding="async" fetchPriority="high" />
          
          <span className="text-[#f7cf1ccb] text-md uppercase">Sine Kultura</span>
        </NavLink>

        <div className="hidden md:flex items-center gap-8 text-xs">
          <div className="flex uppercase text-xs font-normal gap-7">
            <NavLink
              to="/"
              className={`relative transition-colors duration-200 hover:text-[#c89116] cursor-pointer ${pathname === "/" ? "text-[#fdb125]" : ""}`}
            >
              Home
              {pathname === "/" && <GradientLine className="absolute inset-x-0 -bottom-2" />}
            </NavLink>
            <NavLink
              to="/our-work"
              className={`relative transition-colors duration-200 hover:text-[#c89116] cursor-pointer ${pathname === "/our-work" ? "text-[#fdb125]" : ""}`}
            >
              Our Work
              {pathname === "/our-work" && <GradientLine className="absolute inset-x-0 -bottom-2" />}
            </NavLink>
            <NavLink
              to="/about"
              className={`relative transition-colors duration-200 hover:text-[#c89116] cursor-pointer ${pathname === "/about" ? "text-[#fdb125]" : ""}`}
            >
              About
              {pathname === "/about" && <GradientLine className="absolute inset-x-0 -bottom-2" />}
            </NavLink>
            <NavLink
              to="/#partnerships"
              className="relative transition-colors duration-200 hover:text-[#c89116] cursor-pointer"
            >
              Partnerships
            </NavLink>
          </div>

          {isLoggedIn ? (
            <>
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
                      <NavLink
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        View Profile
                      </NavLink>
                      
                      <hr className="border-[#a6a6a6]/30" />

                      {isAdmin && (
                        <NavLink
                          to="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                        >
                          Dashboard
                        </NavLink>
                      )}

                      <NavLink
                        to="/scan"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        Scan
                      </NavLink>

                      <NavLink
                        to="/request"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        Request
                      </NavLink>

                      <NavLink
                        to="/my-requests"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        My Requests
                      </NavLink>

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
            <NavLink
              to="/login"
              className="px-3 py-2.5 rounded border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] transition-colors duration-300"
            >
              Login
            </NavLink>
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
        className={`fixed top-0 right-0 h-full w-72 bg-[#0c0c0c] text-white z-50 transform transition-transform duration-300 md:hidden flex flex-col ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <img src="/sk_icon_no_bg.png" height={20} width={20} alt="SK logo" decoding="async" fetchPriority="high" />
          <span className="text-[#f7cf1ccb] text-xs uppercase font-bold">Sine Kultura</span>
          
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

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Public pages */}
          <NavLink
            to="/"
            onClick={() => setSidebarOpen(false)}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === "/" ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
            }`}
          >
            Home
            {pathname === "/" && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
          </NavLink>
          <NavLink
            to="/our-work"
            onClick={() => setSidebarOpen(false)}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === "/our-work" ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
            }`}
          >
            Our Work
            {pathname === "/our-work" && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
          </NavLink>
          <NavLink
            to="/about"
            onClick={() => setSidebarOpen(false)}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === "/about" ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
            }`}
          >
            About
            {pathname === "/about" && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
          </NavLink>
          <NavLink
            to="/#partnerships"
            onClick={() => setSidebarOpen(false)}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-[#a6a6a6] hover:text-white hover:bg-white/5"
          >
            Partnerships
          </NavLink>

          {isLoggedIn && (
            <>
              <div className="h-px bg-white/10 my-2" />

              <NavLink
                to="/scan"
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === "/scan" ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
                }`}
              >
                Scan
                {pathname === "/scan" && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
              </NavLink>
              <NavLink
                to="/request"
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === "/request" ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
                }`}
              >
                Request
                {pathname === "/request" && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
              </NavLink>

              {isAdmin && (
                <>
                  <NavLink
                    to="/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      pathname.startsWith("/dashboard") ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Dashboard
                    {pathname.startsWith("/dashboard") && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
                  </NavLink>
                  <NavLink
                    to="/dashboard/equipments"
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      pathname.startsWith("/dashboard/equipments") ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Equipment
                    {pathname.startsWith("/dashboard/equipments") && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
                  </NavLink>
                  <NavLink
                    to="/dashboard/requests"
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      pathname.startsWith("/dashboard/requests") ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Manage Requests
                    {pathname.startsWith("/dashboard/requests") && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
                  </NavLink>
                  <NavLink
                    to="/dashboard/borrowed"
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      pathname.startsWith("/dashboard/borrowed") ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Borrowed
                    {pathname.startsWith("/dashboard/borrowed") && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
                  </NavLink>
                  {isSuperAdmin && (
                    <NavLink
                      to="/dashboard/users"
                      onClick={() => setSidebarOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        pathname.startsWith("/dashboard/users") ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      Manage Users
                      {pathname.startsWith("/dashboard/users") && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
                    </NavLink>
                  )}
                </>
              )}

              <NavLink
                to="/my-requests"
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === "/my-requests" ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
                }`}
              >
                My Requests
                {pathname === "/my-requests" && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
              </NavLink>

              <NavLink
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  pathname === "/profile" ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
                }`}
              >
                {user?.fullName ?? "Profile"}
                {pathname === "/profile" && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />}
              </NavLink>
            </>
          )}
        </nav>

        {isLoggedIn ? (
          <div className="p-3 border-t border-white/10">
            <button
              onClick={() => { 
                requestLogout(); 
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <FiLogOut size={16} />
              Logout
            </button>
          </div>
        ) : (
          <div className="p-5 border-t border-white/10">
            <NavLink
              to="/login"
              onClick={() => setSidebarOpen(false)}
              className="block w-full px-4 py-3 rounded border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] transition-colors text-center"
            >
              Login
            </NavLink>
          </div>
        )}
      </div>
    </div>
  )
}
