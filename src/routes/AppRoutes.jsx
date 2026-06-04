import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import GuestRoute from './GuestRoute'
import RoutePermissionGuard from './RoutePermissionGuard'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import SettingsPage from '../pages/settings/SettingsPage'
import NotFoundPage from '../pages/NotFoundPage'
import { MODULE_ROUTE_ELEMENTS } from './moduleRoutes'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route element={<RoutePermissionGuard />}>
          <Route path="dashboard" element={<DashboardPage />} />

          {MODULE_ROUTE_ELEMENTS.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          <Route path="settings/profile" element={<SettingsPage title="Profile Settings" section="profile" />} />
          <Route
            path="settings/notifications"
            element={<SettingsPage title="Notification Settings" section="notifications" />}
          />
          <Route path="settings/general" element={<SettingsPage title="General Settings" section="general" />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
