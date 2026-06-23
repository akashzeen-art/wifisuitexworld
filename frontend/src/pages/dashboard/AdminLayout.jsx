import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wifi, BarChart3, Users, CreditCard, Key,
  Activity, Monitor, FileText, TrendingUp,
  LogOut, ChevronRight, Bell, Shield, DollarSign
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const adminNav = [
  { to: '/admin',               icon: BarChart3,   label: 'Overview',       end: true },
  { to: '/admin/analytics',     icon: TrendingUp,  label: 'Analytics'             },
  { to: '/admin/users',         icon: Users,       label: 'Users'                 },
  { to: '/admin/subscriptions', icon: CreditCard,  label: 'Subscriptions'         },
  { to: '/admin/payments',      icon: DollarSign,  label: 'Payments'              },
  { to: '/admin/licenses',      icon: Key,         label: 'Licenses'              },
  { to: '/admin/plans',         icon: Activity,    label: 'Plans'                 },
  { to: '/admin/hotspots',      icon: Wifi,        label: 'Hotspots'              },
  { to: '/admin/devices',       icon: Monitor,     label: 'Devices'               },
  { to: '/admin/reports',       icon: FileText,    label: 'Reports'               },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-30"
      >
        {/* Logo */}
        <div className="px-5 h-16 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-signal-500 rounded-xl flex items-center justify-center shadow-button">
              <Wifi className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-[15px]">WiFiExtender</span>
              <p className="text-[10px] text-slate-400 -mt-0.5">Admin Panel</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-semibold bg-brand-600/20 text-brand-400 border border-brand-600/30 px-2 py-0.5 rounded-full">
            <Shield className="w-2.5 h-2.5" /> ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">Management</p>
          {adminNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-brand-600/20 text-brand-400 border border-brand-600/20 cursor-pointer'
                  : 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-150 cursor-pointer'
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-500" />}
                </>
              )}
            </NavLink>
          ))}

          {/* Switch to user dashboard */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all w-full"
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              User Dashboard
            </button>
          </div>
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-semibold text-slate-300">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-slate-900" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-8 bg-slate-950">
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
