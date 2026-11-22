import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  FiAward,
  FiBox,
  FiCamera,
  FiClock,
  FiEdit3,
  FiFilm,
  FiGrid,
  FiInbox,
  FiList,
  FiMoreVertical,
  FiPlus,
  FiUser,
  FiUsers,
} from "react-icons/fi"
import { useAuth } from "../context/AuthContext"

interface TabItem {
  to: string
  label: string
  icon: typeof FiGrid
  match: (pathname: string) => boolean
}

function TabButton({
  item,
  active,
  onClick,
}: {
  item: TabItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-1 py-1.5 flex-1 cursor-pointer"
    >
      <Icon size={20} className={active ? "text-[#fdb125]" : "text-[#a6a6a6]"} />
      <span className={`text-[10px] leading-tight ${active ? "text-[#fdb125] font-bold" : "text-[#a6a6a6]"}`}>
        {item.label}
      </span>
    </button>
  )
}

export default function MobileTabBar() {
  const { isLoggedIn, isAdmin, isSuperAdmin, user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [centerOpen, setCenterOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  if (!isLoggedIn) return null

  const closeSheets = () => {
    setCenterOpen(false)
    setMoreOpen(false)
  }

  const go = (to: string) => {
    closeSheets()
    navigate(to)
  }

  const uid = user?.id ?? ""

  const leftTabs: TabItem[] = isAdmin
    ? ([
        { to: "/dashboard", label: "Dashboard", icon: FiGrid, match: (p: string) => p === "/dashboard" },
        { to: "/dashboard/requests", label: "Requests", icon: FiInbox, match: (p: string) => p.startsWith("/dashboard/requests") },
      ] as TabItem[])
    : ([
        { to: "/my-dashboard", label: "Dashboard", icon: FiGrid, match: (p: string) => p.startsWith("/my-dashboard") },
        { to: "/profile", label: "Profile", icon: FiUser, match: (p: string) => p === "/profile" },
      ] as TabItem[])

  const rightTabs: TabItem[] = isAdmin
    ? ([
        { to: "/dashboard/borrowed", label: "Borrowed", icon: FiClock, match: (p: string) => p.startsWith("/dashboard/borrowed") },
        { to: "/dashboard/events", label: "Events", icon: FiFilm, match: (p: string) => p.startsWith("/dashboard/events") },
      ] as TabItem[])
    : ([
        { to: `/profiles/${uid}/requests`, label: "My Requests", icon: FiInbox, match: (p: string) => p === `/profiles/${uid}/requests` },
        { to: `/profiles/${uid}/equipments`, label: "Equipment", icon: FiBox, match: (p: string) => p === `/profiles/${uid}/equipments` },
      ] as TabItem[])

  const moreItems: TabItem[] = [
    { to: "/profile", label: "Profile", icon: FiUser, match: (p: string) => p === "/profile" },
    ...(isAdmin
      ? ([
          { to: "/dashboard/audit", label: "Logs", icon: FiList, match: (p: string) => p.startsWith("/dashboard/audit") },
          { to: "/my-dashboard", label: "Member Dashboard", icon: FiGrid, match: (p: string) => p.startsWith("/my-dashboard") },
        ] as TabItem[])
      : []),
    ...(isSuperAdmin
      ? ([
          { to: "/dashboard/users", label: "Users", icon: FiUsers, match: (p: string) => p.startsWith("/dashboard/users") },
          { to: "/dashboard/grading", label: "Grading", icon: FiAward, match: (p: string) => p.startsWith("/dashboard/grading") },
        ] as TabItem[])
      : []),
  ]

  const moreActive = moreItems.some((item) => item.match(pathname))

  return (
    <>
      {(centerOpen || moreOpen) && (
        <div
          className="fixed inset-0 z-[45] md:hidden bg-black/50"
          onClick={closeSheets}
        />
      )}

      {centerOpen && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[46] md:hidden w-60 bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-2"
        >
          <button
            type="button"
            onClick={() => go("/scan")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FiCamera size={18} className="text-[#c89116]" />
            Scan
          </button>
          <button
            type="button"
            onClick={() => go("/request")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FiEdit3 size={18} className="text-[#c89116]" />
            Request
          </button>
        </div>
      )}

      {moreOpen && (
        <div
          className="fixed bottom-24 left-3 right-3 z-[46] md:hidden bg-[#111] border border-[#5f5c5c93] rounded-xl shadow-xl p-2 max-h-[60vh] overflow-y-auto"
        >
          {moreItems.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => go(item.to)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <item.icon size={18} className="text-[#c89116]" />
              {item.label}
            </button>
          ))}
        </div>
      )}

      <nav className="sk-tabbar fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 md:hidden w-[min(28rem,calc(100%-1.5rem))] rounded-[1.75rem] border border-white/10 bg-[#0c0c0c]/95 backdrop-blur shadow-xl px-3 pb-1 pt-1">
        <div className="relative flex items-end">
          {leftTabs.map((item) => (
            <TabButton
              key={item.to}
              item={item}
              active={item.match(pathname)}
              onClick={() => go(item.to)}
            />
          ))}

          <div className="w-16 shrink-0" />

          {rightTabs.map((item) => (
            <TabButton
              key={item.to}
              item={item}
              active={item.match(pathname)}
              onClick={() => go(item.to)}
            />
          ))}

          {isAdmin && (
            <TabButton
              item={{ to: "#more", label: "More", icon: FiMoreVertical, match: () => moreActive }}
              active={moreActive}
              onClick={() => { setMoreOpen((o) => !o); setCenterOpen(false) }}
            />
          )}

          <div className="absolute left-1/2 bottom-1.5 -translate-x-1/2 flex flex-col items-center">
            <button
              type="button"
              onClick={() => { setCenterOpen((o) => !o); setMoreOpen(false) }}
              aria-label="Borrow equipment"
              className="w-14 h-14 rounded-full bg-[#c89116] hover:bg-[#caa453] text-white border-4 border-gray-400/50 shadow-[0_0_14px_rgba(200,200,200,0.25)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiPlus size={26} />
            </button>
            <span className="text-[10px] text-[#a6a6a6] mt-0.5">Borrow</span>
          </div>
        </div>
      </nav>
    </>
  )
}
