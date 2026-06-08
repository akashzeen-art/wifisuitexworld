import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

import LandingPage      from './pages/LandingPage'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import PricingPage      from './pages/PricingPage'
import DownloadPage     from './pages/DownloadPage'
import PaymentPage      from './pages/PaymentPage'

import DashboardLayout  from './pages/dashboard/DashboardLayout'
import Overview         from './pages/dashboard/Overview'
import DevicesPage      from './pages/dashboard/DevicesPage'
import SubscriptionPage from './pages/dashboard/SubscriptionPage'
import DownloadDash     from './pages/dashboard/DownloadPage'
import SettingsPage     from './pages/dashboard/SettingsPage'

import AdminLayout      from './pages/dashboard/AdminLayout'
import AdminOverview    from './pages/dashboard/AdminOverview'
import AdminUsers       from './pages/dashboard/admin/AdminUsers'
import AdminPlans       from './pages/dashboard/admin/AdminPlans'
import AdminSubscriptions from './pages/dashboard/admin/AdminSubscriptions'
import AdminPayments    from './pages/dashboard/admin/AdminPayments'
import AdminLicenses    from './pages/dashboard/admin/AdminLicenses'
import AdminHotspots    from './pages/dashboard/admin/AdminHotspots'
import AdminDevices     from './pages/dashboard/admin/AdminDevices'
import AdminAnalytics   from './pages/dashboard/admin/AdminAnalytics'
import AdminReports     from './pages/dashboard/admin/AdminReports'

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'ADMIN' ? children : <Navigate to="/dashboard" replace />
}

function GuestRoute({ children }) {
  const token = useAuthStore(s => s.token)
  return !token ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>

      {/* ── Public ── */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/pricing"  element={<PricingPage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/payment"  element={<PrivateRoute><PaymentPage /></PrivateRoute>} />

      {/* ── Auth ── */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* ── User Dashboard ── */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index               element={<Overview />} />
        <Route path="devices"      element={<DevicesPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="download"     element={<DownloadDash />} />
        <Route path="settings"     element={<SettingsPage />} />
        <Route path="plans"        element={<Navigate to="/dashboard/subscription" replace />} />
      </Route>

      {/* ── Admin Dashboard (separate layout + routes) ── */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index                 element={<AdminOverview />} />
        <Route path="analytics"      element={<AdminAnalytics />} />
        <Route path="users"          element={<AdminUsers />} />
        <Route path="subscriptions"  element={<AdminSubscriptions />} />
        <Route path="payments"       element={<AdminPayments />} />
        <Route path="licenses"       element={<AdminLicenses />} />
        <Route path="plans"          element={<AdminPlans />} />
        <Route path="hotspots"       element={<AdminHotspots />} />
        <Route path="devices"        element={<AdminDevices />} />
        <Route path="reports"        element={<AdminReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
