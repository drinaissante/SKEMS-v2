import { Navigate, Route, Routes } from 'react-router-dom'

import Home from './pages/home/Home'
import LoginPage from './pages/login/LoginPage'
import RegisterPage from './pages/register/RegisterPage'
import ScanPage from './pages/scan/ScanPage'
import EquipmentsPage from './pages/equipments/EquipmentsPage'
import RequestPage from './pages/request/RequestPage'
import ProfilePage from './pages/profile/ProfilePage'
import UsersPage from './pages/admin/UsersPage'

import MainLayout from './layouts/MainLayout'

import { useAuth } from './context/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()

  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
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

function App() {
  return (
    <Routes>
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
            <ProtectedRoute>
              <RequestPage />
            </ProtectedRoute>
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
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />

      </Route>
    </Routes>
  )
}

export default App
