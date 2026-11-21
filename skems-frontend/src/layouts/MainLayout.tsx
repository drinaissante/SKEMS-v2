import { Outlet, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import LogoutModalManager from "../components/LogoutModalManager"
import MobileTabBar from "../components/MobileTabBar"

export default function MainLayout() {
  const { pathname } = useLocation()
  const isDashboard = pathname.startsWith("/dashboard")

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </main>
      {!isDashboard && <Footer />}
      <LogoutModalManager />
      <div className="h-20 md:hidden shrink-0" />
      <MobileTabBar />
    </div>
  )
}
