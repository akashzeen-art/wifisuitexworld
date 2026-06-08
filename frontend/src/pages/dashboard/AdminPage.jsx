import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, CreditCard, BarChart3, TrendingUp, Clock,
  Activity, Wifi, Monitor, Key, FileText, RefreshCw,
  UserCheck, WifiOff, DollarSign
} from 'lucide-react'
import api from '../../lib/api'
import AdminUsers         from './admin/AdminUsers'
import AdminPlans         from './admin/AdminPlans'
import AdminSubscriptions from './admin/AdminSubscriptions'
import AdminLicenses      from './admin/AdminLicenses'
import AdminHotspots      from './admin/AdminHotspots'
import AdminDevices       from './admin/AdminDevices'
import AdminAnalytics     from './admin/AdminAnalytics'
import AdminReports       from './admin/AdminReports'
import AdminPayments      from './admin/AdminPayments'

const TABS = [
  { id: 'overview',       label: 'Overview',       icon: BarChart3   },
  { id: 'analytics',      label: 'Analytics',      icon: TrendingUp  },
  { id: 'users',          label: 'Users',          icon: Users       },
  { id: 'subscriptions',  label: 'Subscriptions',  icon: CreditCard  },
  { id: 'payments',       label: 'Payments',       icon: DollarSign  },
  { id: 'licenses',       label: 'Licenses',       icon: Key         },
  { id: 'plans',          label: 'Plans',          icon: Activity    },
  { id: 'hotspots',       label: 'Hotspots',       icon: Wifi        },
  { id: 'devices',        label: 'Devices',        icon: Monitor     },
  { id: 'reports',        label: 'Reports',        icon: FileText    },
]

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }} className="glass-card p-5">
      <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-3xl font-extrabold text-slate-900">{value ?? '—'}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

function ActiveUserRow({ user, i }) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04 }}
      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
      <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {user.name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
        <p className="text-xs text-slate-400 truncate">{user.email}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-emerald-600">{user.activeHotspots ?? 0} hotspot{user.activeHotspots !== 1 ? 's' : ''}</p>
        <p className="text-xs text-slate-400">{user.connectedDevices ?? 0} devices</p>
      </div>
    </motion.div>
  )
}

export default function AdminPage() {
  const [tab,         setTab]         = useState('overview')
  const [stats,       setStats]       = useState(null)
  const [activeUsers, setActiveUsers] = useState([])
  const [loading,     setLoading]     = useState(true)

  const loadOverview = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/active-users'),
    ]).then(([s, u]) => {
      setStats(s.data)
      setActiveUsers(Array.isArray(u.data) ? u.data : (u.data.content ?? []))
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'overview') loadOverview()
  }, [tab])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage users, plans, licenses, hotspots and more.</p>
        </div>
        {tab === 'overview' && (
          <button onClick={loadOverview} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
      </div>

      {/* Tab bar — scrollable on small screens */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 mb-8 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users}      label="Total Users"           value={stats?.totalUsers}           color="from-brand-500 to-brand-600"     delay={0}    />
              <StatCard icon={DollarSign} label="Total Revenue"         value={`$${stats?.totalRevenue?.toFixed(2) ?? '0.00'}`} color="from-emerald-500 to-emerald-600" delay={0.07} />
              <StatCard icon={TrendingUp} label="Active Subscriptions"  value={stats?.activeSubscriptions}  color="from-cyan-500 to-cyan-600"       delay={0.14} />
              <StatCard icon={Wifi}       label="Active Hotspots"       value={stats?.activeHotspots}       color="from-violet-500 to-violet-600"   delay={0.21} />
              <StatCard icon={CreditCard} label="Total Plans"           value={stats?.totalPlans}           color="from-amber-500 to-amber-600"     delay={0.28} />
              <StatCard icon={Key}        label="Active Licenses"       value={stats?.activeLicenses}       color="from-rose-500 to-rose-600"       delay={0.35} />
              <StatCard icon={Monitor}    label="Connected Devices"     value={stats?.connectedDevices}     color="from-teal-500 to-teal-600"       delay={0.42} />
              <StatCard icon={Clock}      label="Pending Subscriptions" value={stats?.pendingSubscriptions} color="from-slate-500 to-slate-600"     delay={0.49} />
            </div>

            {/* Active users + quick nav */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Active users */}
              <div className="lg:col-span-2 glass-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <motion.div className="w-2 h-2 rounded-full bg-emerald-400"
                      animate={{ scale: [1,1.4,1], opacity: [1,0.5,1] }}
                      transition={{ duration: 1.5, repeat: Infinity }} />
                    <p className="text-sm font-bold text-slate-800">Active Users</p>
                  </div>
                  <span className="badge-green text-xs">{activeUsers.length} online</span>
                </div>
                {activeUsers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">No active users right now</div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                    {activeUsers.map((u, i) => <ActiveUserRow key={u.id} user={u} i={i} />)}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="glass-card p-5">
                <p className="text-sm font-bold text-slate-800 mb-4">Quick Actions</p>
                <div className="space-y-2">
                  {[
                    { label: 'Manage Users',         tab: 'users',         icon: Users,      color: 'bg-brand-50 text-brand-600'     },
                    { label: 'View Subscriptions',   tab: 'subscriptions', icon: CreditCard, color: 'bg-cyan-50 text-cyan-600'       },
                    { label: 'Monitor Hotspots',     tab: 'hotspots',      icon: Wifi,       color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Connected Devices',    tab: 'devices',       icon: Monitor,    color: 'bg-violet-50 text-violet-600'   },
                    { label: 'Manage Licenses',      tab: 'licenses',      icon: Key,        color: 'bg-amber-50 text-amber-600'     },
                    { label: 'View Analytics',       tab: 'analytics',     icon: BarChart3,  color: 'bg-rose-50 text-rose-600'       },
                    { label: 'Generate Reports',     tab: 'reports',       icon: FileText,   color: 'bg-slate-100 text-slate-600'    },
                  ].map(({ label, tab: t, icon: Icon, color }) => (
                    <button key={t} onClick={() => setTab(t)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {tab === 'analytics'     && <AdminAnalytics />}
      {tab === 'users'         && <AdminUsers />}
      {tab === 'subscriptions' && <AdminSubscriptions />}
      {tab === 'payments'      && <AdminPayments />}
      {tab === 'licenses'      && <AdminLicenses />}
      {tab === 'plans'         && <AdminPlans />}
      {tab === 'hotspots'      && <AdminHotspots />}
      {tab === 'devices'       && <AdminDevices />}
      {tab === 'reports'       && <AdminReports />}
    </div>
  )
}
