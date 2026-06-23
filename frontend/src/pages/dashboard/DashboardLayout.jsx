import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wifi, LayoutDashboard, CreditCard, Monitor,
  Download, Settings, LogOut, ChevronRight, Shield, Radio,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import DashboardHeaderActions from '../../components/dashboard/DashboardHeaderActions'
import { useDashboardNotifications } from '../../hooks/useDashboardNotifications'

const navItems = [
  { to: '/dashboard',              icon: LayoutDashboard, label: 'Overview',     end: true },
  { to: '/dashboard/devices',      icon: Monitor,         label: 'Devices'              },
  { to: '/dashboard/subscription', icon: CreditCard,      label: 'Subscription'         },
  { to: '/dashboard/download',     icon: Download,        label: 'Download App'         },
  { to: '/dashboard/settings',     icon: Settings,        label: 'Settings'             },
]

const pageTitles = {
  '/dashboard': 'Overview',
  '/dashboard/devices': 'Devices',
  '/dashboard/subscription': 'Subscription',
  '/dashboard/download': 'Download App',
  '/dashboard/settings': 'Settings',
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const pageTitle = pageTitles[location.pathname] || 'Dashboard'

  const handleLogout = () => { logout(); navigate('/') }

  useDashboardNotifications()

  return (
    <div className="min-h-screen dashboard-bg flex">
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-64 dashboard-sidebar flex flex-col fixed h-full z-30"
      >
        <div className="px-5 h-16 flex items-center border-b border-brand-100/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-teal-500 rounded-xl flex items-center justify-center shadow-button">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-[15px] leading-tight block">WiFiExtender</span>
              <span className="text-[10px] text-brand-600 font-medium flex items-center gap-1">
                <Radio className="w-2.5 h-2.5" /> Network Hub
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
                </>
              )}
            </NavLink>
          ))}

          {user?.role === 'ADMIN' && (
            <>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mt-5 mb-2">Admin</p>
              <button onClick={() => navigate('/admin')} className="nav-item w-full">
                <Shield className="w-4 h-4 flex-shrink-0 text-slate-400" />
                <span className="flex-1">Admin Panel</span>
              </button>
            </>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-brand-100/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl mb-2 bg-gradient-to-r from-brand-50/80 to-emerald-50/50 border border-brand-100/60">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item w-full text-slate-500 hover:text-red-600 hover:bg-red-50/80"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-brand-100/50 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-20">
          <div>
            <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">Dashboard</p>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">{pageTitle}</h2>
          </div>
          <DashboardHeaderActions />
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
