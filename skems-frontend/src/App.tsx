import { Navigate, Route, Routes } from 'react-router-dom'

import Home from './pages/home/Home'
import LoginPage from './pages/login/LoginPage'
import RegisterPage from './pages/register/RegisterPage'
import ForgotPasswordPage from './pages/forgotpassword/ForgotPasswordPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import ScanPage from './pages/scan/ScanPage'
import EquipmentDetailPage from './pages/equipment/EquipmentDetailPage'
import EquipmentsPage from './pages/equipments/EquipmentsPage'
import RequestPage from './pages/request/RequestPage'
import MyRequestsPage from './pages/myrequests/MyRequestsPage'
import ProfilePage from './pages/profile/ProfilePage'
import UsersPage from './pages/admin/UsersPage'
import RequestsPage from './pages/admin/RequestsPage'
import BorrowedPage from './pages/admin/borrowed/BorrowedPage'
import GradingPage from './pages/admin/GradingPage'
import NotFound from './pages/NotFound'

import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import { ToastProvider } from './components/Toast'

import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

import { useAuth } from './context/AuthContext'
import { useEquipmentsRealtime } from './hooks/useEquipmentsRealtime'
import { useRequestsRealtime } from './hooks/useRequestsRealtime'
import { useBorrowedRealtime } from './hooks/useBorrowedRealtime'
import { useGradingRealtime } from './hooks/useGradingRealtime'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import OfflineBanner from './components/OfflineBanner'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import About from './pages/about/About'
import Restricted from './pages/restricted/Restricted'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()

  return isLoggedIn ? <>{children}</> : <Navigate to="/restricted" replace />
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()

  return isLoggedIn ? <>{children}</> : <Navigate to="/restricted" replace />
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()

  return isLoggedIn ? <Navigate to="/" replace /> : <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin } = useAuth()

  if (!isLoggedIn) 
    return <Navigate to="/login" replace />

  if (!isAdmin) 
    return <Navigate to="/restricted" replace />

  return <>{children}</>
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isSuperAdmin } = useAuth()

  if (!isLoggedIn) 
    return <Navigate to="/login" replace />

  if (!isSuperAdmin) 
    return <Navigate to="/" replace />

  return <>{children}</>
}

function App() {
  useEquipmentsRealtime()
  useRequestsRealtime()
  useBorrowedRealtime()
  useGradingRealtime()
  const online = useOnlineStatus()
  return (
    <>
      {!online && <OfflineBanner />}
      <PWAUpdatePrompt />
      <ToastProvider>
      <Routes>
        <Route path='/change-password' element={<ChangePasswordPage />} />

        <Route element={<MainLayout />}>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path='/register' element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path='/reset-password' element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path='/about' element={<About />} />
          <Route path='/restricted' element={<Restricted />} />

          <Route
            path='/scan'
            element={
              <ProtectedRoute>
                <ScanPage />
              </ProtectedRoute>
            }
          />

          <Route
            path='/request'
            element={
              <UserRoute>
                <RequestPage />
              </UserRoute>
            }
          />

          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path='/my-requests'
            element={
              <ProtectedRoute>
                <MyRequestsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path='/equipment'
            element={
              <ProtectedRoute>
                <EquipmentDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path='/dashboard'
            element={
              <AdminRoute>
                <DashboardLayout />
              </AdminRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path='equipments' element={<EquipmentsPage />} />
            <Route path='requests' element={<RequestsPage />} />
            <Route path='borrowed' element={<BorrowedPage />} />
            <Route path='users' element={<SuperAdminRoute><UsersPage /></SuperAdminRoute>} />
            <Route path='grading' element={<SuperAdminRoute><GradingPage /></SuperAdminRoute>} />
          </Route>

          <Route path='/equipments' element={<Navigate to="/dashboard/equipments" replace />} />

          <Route path='/admin/requests' element={<Navigate to="/dashboard/requests" replace />} />

          <Route path='/admin/borrowed' element={<Navigate to="/dashboard/borrowed" replace />} />

          <Route path='/admin/users' element={<Navigate to="/dashboard/users" replace />} />

          <Route path='*' element={<NotFound />} />
          
        </Route>
      </Routes>
      
      <Analytics />
      <SpeedInsights />
      </ToastProvider>
    </>

  )
}

export default App
