import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wifi, LayoutDashboard, CreditCard, Monitor,
  Download, Settings, LogOut, ChevronRight, Bell, Shield
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const navItems = [
  { to: '/dashboard',              icon: LayoutDashboard, label: 'Overview',     end: true },
  { to: '/dashboard/devices',      icon: Monitor,         label: 'Devices'              },
  { to: '/dashboard/subscription', icon: CreditCard,      label: 'Subscription'         },
  { to: '/dashboard/download',     icon: Download,        label: 'Download App'         },
  { to: '/dashboard/settings',     icon: Settings,        label: 'Settings'             },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-30 shadow-[1px_0_0_rgba(0,0,0,0.03)]"
      >
        {/* Logo */}
        <div className="px-5 h-16 flex items-center border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-button">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-[15px]">WiFiExtender</span>
          </div>
        </div>

        {/* Nav */}
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
              <button
                onClick={() => navigate('/admin')}
                className="nav-item w-full"
              >
                <Shield className="w-4 h-4 flex-shrink-0 text-slate-400" />
                <span className="flex-1">Admin Panel</span>
              </button>
            </>
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item w-full text-slate-400 hover:text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <div />
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-8">
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
