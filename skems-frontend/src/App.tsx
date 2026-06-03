import { Navigate, Route, Routes } from 'react-router-dom'

import Home from './pages/home/Home'
import LoginPage from './pages/login/LoginPage'
import RegisterPage from './pages/register/RegisterPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import ScanPage from './pages/scan/ScanPage'
import EquipmentsPage from './pages/equipments/EquipmentsPage'
import RequestPage from './pages/request/RequestPage'
import MyRequestsPage from './pages/myrequests/MyRequestsPage'
import ProfilePage from './pages/profile/ProfilePage'
import UsersPage from './pages/admin/UsersPage'
import RequestsPage from './pages/admin/RequestsPage'
import BorrowedPage from './pages/admin/borrowed/BorrowedPage'

import MainLayout from './layouts/MainLayout'

import { Analytics } from '@vercel/analytics/react'

import { useAuth } from './context/AuthContext'
import { useEquipmentsRealtime } from './hooks/useEquipmentsRealtime'
import { useRequestsRealtime } from './hooks/useRequestsRealtime'
import { useBorrowedRealtime } from './hooks/useBorrowedRealtime'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()

  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()

  return isLoggedIn ? <>{children}</> : <Navigate to="/" replace />
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
    return <Navigate to="/" replace />

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
  return (
    <>
      <Routes>
        <Route path='/change-password' element={<ChangePasswordPage />} />

        <Route element={<MainLayout />}>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path='/register' element={<GuestRoute><RegisterPage /></GuestRoute>} />

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
            path='/equipments'
            element={
              <AdminRoute>
                <EquipmentsPage />
              </AdminRoute>
            }
          />

          <Route
            path='/admin/users'
            element={
              <SuperAdminRoute>
                <UsersPage />
              </SuperAdminRoute>
            }
          />

          <Route
            path='/admin/requests'
            element={
              <AdminRoute>
                <RequestsPage />
              </AdminRoute>
            }
          />

          <Route
            path='/admin/borrowed'
            element={
              <AdminRoute>
                <BorrowedPage />
              </AdminRoute>
            }
          />
          
        </Route>
      </Routes>
      
      <Analytics />
    </>

  )
}

export default App
