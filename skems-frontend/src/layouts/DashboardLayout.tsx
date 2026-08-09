import { useEffect, useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { requestLogout } from "../utils/logoutEvent"
import { FiBox, FiChevronLeft, FiChevronRight, FiClock, FiGrid, FiInbox, FiLogOut, FiUsers } from "react-icons/fi"

const COLLAPSE_KEY = "skems:dashboard-collapsed"

export default function DashboardLayout() {
  const { isSuperAdmin } = useAuth()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1"
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0")
    } catch {
      // ignore
    }
  }, [collapsed])

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
      <aside
        className={`hidden md:flex flex-col shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] bg-[#0c0c0c] border-r border-white/10 transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        <div className={`px-3 py-4 border-b border-white/10 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && <span className="text-[#f7cf1ccb] text-xs uppercase font-bold">Dashboard</span>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-[#a6a6a6] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                item.active ? "bg-white/10 text-[#fdb125]" : "text-[#a6a6a6] hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon size={16} />
              {!collapsed && item.label}
              {item.active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#fdb125] rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={requestLogout}
            title="Logout"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <FiLogOut size={16} />
            {!collapsed && "Logout"}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-fixed-black">
        <Outlet />
      </main>
    </div>
  )
}
