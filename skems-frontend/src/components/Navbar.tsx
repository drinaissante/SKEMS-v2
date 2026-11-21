import { useState } from "react"
import { useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import GradientLine from "./GradientLine"
import NavLink from "./NavLink"
import { requestLogout } from "../utils/logoutEvent"
import NotificationBell from "./NotificationBell"
import ThemeToggle from "./ThemeToggle"

export default function Navbar() {
  const { isLoggedIn, isAdmin, user } = useAuth()
  const { pathname } = useLocation()
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
              to="/portfolio"
              className={`relative transition-colors duration-200 hover:text-[#c89116] cursor-pointer ${pathname === "/portfolio" ? "text-[#fdb125]" : ""}`}
            >
              Portfolio
              {pathname === "/portfolio" && <GradientLine className="absolute inset-x-0 -bottom-2" />}
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

          <div className="w-px h-4 bg-white/20" />

          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3">
                <NavLink
                  to="/scan"
                  className="px-3 py-2.5 rounded border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] transition-colors duration-300"
                >
                  Scan
                </NavLink>
                <NavLink
                  to="/request"
                  className="px-3 py-2.5 rounded border-2 border-[#c89116] text-[#c89116] hover:bg-[#fdb125] hover:text-white hover:border-[#fdb125] transition-colors duration-300"
                >
                  Request
                </NavLink>
                <NotificationBell />
                <ThemeToggle compact />
              </div>

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

                      {!isAdmin && (
                        <NavLink
                          to="/my-dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                        >
                          My Dashboard
                        </NavLink>
                      )}

                      {isAdmin && (
                        <NavLink
                          to="/my-dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                        >
                          Member Dashboard
                        </NavLink>
                      )}

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
                        to={`/profiles/${user?.id}/requests`}
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        My Requests
                      </NavLink>

                      <NavLink
                        to={`/profiles/${user?.id}/equipments`}
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        My Equipments
                      </NavLink>

                      <NavLink
                        to="/my-logs"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                      >
                        Logs
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

        {/* Mobile: notifications + theme */}
        <div className="flex md:hidden items-center gap-1">
          <NotificationBell />
          <ThemeToggle compact />
        </div>
      </nav>
    </div>
  )
}
