import { Link, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { requestLogout } from "../utils/logoutEvent"
import { FiBox, FiClock, FiGrid, FiInbox, FiLogOut, FiUsers } from "react-icons/fi"

export default function DashboardLayout() {
  const { isSuperAdmin } = useAuth()
  const { pathname } = useLocation()

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: FiGrid, active: pathname === "/dashboard" },
    { to: "/dashboard/equipments", label: "Equipment", icon: FiBox, active: pathname.startsWith("/dashboard/equipments") },
    { to: "/dashboard/requests", label: "Requests", icon: FiInbox, active: pathname.startsWith("/dashboard/requests") },
    { to: "/dashboard/borrowed", label: "Borrowed", icon: FiClock, active: pathname.startsWith("/dashboard/borrowed") },
    ...(isSuperAdmin
      ? [{ to: "/dashboard/users", label: "Users", icon: FiUsers, active: pathname.startsWith("/dashboard/users") }]
      : []),
  ]

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="hidden md:flex flex-col w-64 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] bg-[#0c0c0c] border-r border-white/10">
        <div className="px-5 py-4 border-b border-white/10 text-[#f7cf1ccb] text-xs uppercase font-bold">
          Dashboard
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon size={16} />
              {item.label}
              {item.active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={requestLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-fixed-black">
        <Outlet />
      </main>
    </div>
  )
}
