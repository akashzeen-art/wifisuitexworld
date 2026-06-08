import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, CreditCard, BarChart3, TrendingUp, Clock,
  Wifi, Monitor, Key, FileText, RefreshCw, DollarSign
} from 'lucide-react'
import api from '../../lib/api'

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
    >
      <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-3xl font-extrabold text-white">{value ?? '—'}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </motion.div>
  )
}

export default function AdminOverview() {
  const navigate = useNavigate()
  const [stats,       setStats]       = useState(null)
  const [activeUsers, setActiveUsers] = useState([])
  const [loading,     setLoading]     = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/active-users'),
    ]).then(([s, u]) => {
      setStats(s.data)
      setActiveUsers(Array.isArray(u.data) ? u.data : (u.data.content ?? []))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const quickLinks = [
    { label: 'Users',         path: '/admin/users',         icon: Users,      color: 'bg-brand-500/20 text-brand-400'   },
    { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard, color: 'bg-cyan-500/20 text-cyan-400'     },
    { label: 'Hotspots',      path: '/admin/hotspots',      icon: Wifi,       color: 'bg-emerald-500/20 text-emerald-400'},
    { label: 'Devices',       path: '/admin/devices',       icon: Monitor,    color: 'bg-violet-500/20 text-violet-400' },
    { label: 'Licenses',      path: '/admin/licenses',      icon: Key,        color: 'bg-amber-500/20 text-amber-400'   },
    { label: 'Analytics',     path: '/admin/analytics',     icon: BarChart3,  color: 'bg-rose-500/20 text-rose-400'     },
    { label: 'Reports',       path: '/admin/reports',       icon: FileText,   color: 'bg-slate-700 text-slate-300'      },
    { label: 'Payments',      path: '/admin/payments',      icon: DollarSign, color: 'bg-green-500/20 text-green-400'   },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Overview</h1>
          <p className="text-slate-400 mt-1">Platform-wide statistics and quick actions.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}      label="Total Users"            value={stats?.totalUsers}           color="from-brand-500 to-brand-600"     delay={0}    />
            <StatCard icon={DollarSign} label="Total Revenue"          value={`$${Number(stats?.totalRevenue ?? 0).toFixed(2)}`} color="from-emerald-500 to-emerald-600" delay={0.07} />
            <StatCard icon={TrendingUp} label="Active Subscriptions"   value={stats?.activeSubscriptions}  color="from-cyan-500 to-cyan-600"       delay={0.14} />
            <StatCard icon={Wifi}       label="Active Hotspots"        value={stats?.activeHotspots}       color="from-violet-500 to-violet-600"   delay={0.21} />
            <StatCard icon={CreditCard} label="Total Plans"            value={stats?.totalPlans}           color="from-amber-500 to-amber-600"     delay={0.28} />
            <StatCard icon={Key}        label="Active Licenses"        value={stats?.activeLicenses}       color="from-rose-500 to-rose-600"       delay={0.35} />
            <StatCard icon={Monitor}    label="Connected Devices"      value={stats?.connectedDevices}     color="from-teal-500 to-teal-600"       delay={0.42} />
            <StatCard icon={Clock}      label="Pending Subscriptions"  value={stats?.pendingSubscriptions} color="from-slate-500 to-slate-600"     delay={0.49} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Active users */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <motion.div className="w-2 h-2 rounded-full bg-emerald-400"
                    animate={{ scale: [1,1.4,1], opacity: [1,0.5,1] }}
                    transition={{ duration: 1.5, repeat: Infinity }} />
                  <p className="text-sm font-bold text-slate-200">Active Users</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeUsers.length} online
                </span>
              </div>
              {activeUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">No active users right now</div>
              ) : (
                <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                  {activeUsers.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/50 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-emerald-400">{u.activeHotspots ?? 0} hotspot{u.activeHotspots !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-slate-500">{u.connectedDevices ?? 0} devices</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-sm font-bold text-slate-200 mb-4">Quick Actions</p>
              <div className="space-y-1.5">
                {quickLinks.map(({ label, path, icon: Icon, color }) => (
                  <button key={path} onClick={() => navigate(path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-left group">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
