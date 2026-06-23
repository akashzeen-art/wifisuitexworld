import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wifi, Monitor, CreditCard, TrendingUp,
  ArrowUpRight, ArrowDownRight, ChevronRight, Download,
  Key, Calendar, Zap, Shield, Users, Activity,
  RefreshCw, Infinity, AlertTriangle, Radio
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import {
  StatCard, GlassCard, SectionHeader, ProgressBar,
  LiveDot, SpeedArc, formatBytes, daysLeft
} from '../../components/dashboard/DashboardWidgets'
import { useBandwidthTracker } from '../../hooks/useDashboard'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-3 py-2.5 shadow-glass text-xs">
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value} Mbps</span>
        </div>
      ))}
    </div>
  )
}

export default function Overview() {
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()

  const [subs, setSubs] = useState([])
  const [devices, setDevices] = useState([])
  const [stats, setStats] = useState(null)
  const [licenses, setLicenses] = useState([])
  const [hotspot, setHotspot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const { history: speedHistory, current: speed } = useBandwidthTracker(api)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [s, d, st, l, hs] = await Promise.allSettled([
        api.get('/subscriptions'),
        api.get('/devices'),
        api.get('/devices/stats'),
        api.get('/subscriptions/licenses'),
        api.get('/hotspots/active'),
      ])
      if (s.status === 'fulfilled') setSubs(s.value.data)
      if (d.status === 'fulfilled') setDevices(d.value.data)
      if (st.status === 'fulfilled') setStats(st.value.data)
      if (l.status === 'fulfilled') setLicenses(l.value.data)
      if (hs.status === 'fulfilled' && hs.value.status === 200) setHotspot(hs.value.data)
      else setHotspot(null)
      setLastRefresh(new Date())
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(() => load(true), 12000)
    return () => clearInterval(id)
  }, [])

  const activeSub = subs.find(s => s.status === 'ACTIVE')
  const activeLicense = licenses.find(l => l.status === 'ACTIVE')
  const hotspotLive = hotspot?.status === 'ACTIVE'
  const onlineDevices = devices.filter(d => d.online && !d.blocked)
  const blockedDevices = devices.filter(d => d.blocked)
  const totalBytes = (stats?.totalBytesSent ?? 0) + (stats?.totalBytesReceived ?? 0)
  const isUnlimited = activeSub?.plan?.unlimitedDevices ?? true
  const maxDevices = activeSub?.plan?.maxDevices ?? -1
  const remaining = activeSub?.expiresAt ? daysLeft(activeSub.expiresAt) : null
  const isLifetime = activeSub?.lifetime
  const urgentExpiry = remaining !== null && remaining <= 7 && !isLifetime

  const deviceTypes = devices.reduce((acc, d) => {
    const t = (d.deviceType || 'UNKNOWN').replace(/_/g, ' ')
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(deviceTypes).map(([name, value]) => ({ name, value }))
  const PIE_COLORS = ['#10b981', '#14b8a6', '#059669', '#34d399', '#0d9488', '#94a3b8']

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading your network data…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Dashboard</p>
          <h1 className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <LiveDot active={hotspotLive} />
              <span className="text-sm text-slate-500">
                {hotspotLive ? `Hotspot live — ${hotspot.ssid}` : activeSub ? 'Hotspot stopped' : 'No active plan'}
              </span>
            </div>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button onClick={() => load()} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 self-start">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <AnimatePresence>
        {urgentExpiry && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-center gap-3"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              Your plan expires in <strong>{remaining} day{remaining !== 1 ? 's' : ''}</strong>.{' '}
              <Link to="/dashboard/subscription" className="underline font-semibold">Renew now →</Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Radio}
          label="Hotspot Status"
          value={hotspotLive ? 'Broadcasting' : 'Stopped'}
          color={hotspotLive ? 'from-emerald-500 to-teal-500' : 'from-slate-400 to-slate-500'}
          delay={0}
          badge={
            <div className="flex items-center gap-1.5">
              <LiveDot active={hotspotLive} />
              <span className={`text-[10px] font-semibold ${hotspotLive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {hotspotLive ? 'Live' : 'Off'}
              </span>
            </div>
          }
        />
        <StatCard
          icon={Users}
          label="Connected Devices"
          value={stats?.online ?? onlineDevices.length}
          sub={isUnlimited ? 'Unlimited plan' : maxDevices > 0 ? `of ${maxDevices}` : '—'}
          color="from-brand-500 to-brand-600"
          delay={0.07}
          onClick={() => navigate('/dashboard/devices')}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Bandwidth"
          value={formatBytes(totalBytes)}
          sub={`↓ ${formatBytes(stats?.totalBytesReceived ?? 0)} · ↑ ${formatBytes(stats?.totalBytesSent ?? 0)}`}
          color="from-teal-500 to-emerald-600"
          delay={0.14}
        />
        <StatCard
          icon={CreditCard}
          label="Current Plan"
          value={activeSub?.plan?.name || 'None'}
          sub={isLifetime ? 'Lifetime' : remaining !== null ? `${remaining}d left` : '—'}
          color={activeSub ? 'from-violet-500 to-violet-600' : 'from-slate-400 to-slate-500'}
          delay={0.21}
          onClick={() => navigate('/dashboard/subscription')}
        />
      </div>

      {/* Speed + chart */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard delay={0.25} className="flex flex-col">
          <SectionHeader
            title="Live Speed"
            sub="From real device traffic"
            action={<LiveDot active={hotspotLive && (speed.down > 0 || speed.up > 0)} />}
          />
          <div className="flex items-center justify-around flex-1 py-2">
            <SpeedArc value={speed.down} max={200} label="Download" unit="Mbps" color="#10b981" />
            <div className="w-px h-16 bg-slate-100" />
            <SpeedArc value={speed.up} max={80} label="Upload" unit="Mbps" color="#14b8a6" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-50">
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-brand-600 mb-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Download</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900">{speed.down}<span className="text-xs font-medium text-slate-400 ml-1">Mbps</span></p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-teal-600 mb-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Upload</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900">{speed.up}<span className="text-xs font-medium text-slate-400 ml-1">Mbps</span></p>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.3} className="lg:col-span-2">
          <SectionHeader
            title="Bandwidth Usage"
            sub="Live traffic from connected devices"
            action={
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" />Down</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-400" />Up</span>
              </div>
            }
          />
          {speedHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={speedHistory} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="t" hide />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="down" stroke="#10b981" strokeWidth={2} fill="url(#gD)" dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="up" stroke="#14b8a6" strokeWidth={2} fill="url(#gU)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-sm text-slate-400">
              Waiting for traffic data… Start your hotspot to see live speeds.
            </div>
          )}
        </GlassCard>
      </div>

      {/* Subscription + License + Devices */}
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard delay={0.35}>
          <SectionHeader title="Subscription" sub="Plan validity" />
          {activeSub ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-extrabold text-slate-900">{activeSub.plan?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Infinity className="w-3 h-3" /> Unlimited devices
                  </p>
                </div>
                <span className="badge-green text-xs flex items-center gap-1.5">
                  <LiveDot active /> Active
                </span>
              </div>

              {!isLifetime && remaining !== null && (
                <div className="space-y-2">
                  <ProgressBar
                    value={activeSub.plan?.durationDays - remaining}
                    max={activeSub.plan?.durationDays || 30}
                    label="Plan used"
                    color={urgentExpiry ? 'from-red-400 to-rose-500' : 'from-brand-500 to-teal-400'}
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Started {new Date(activeSub.startsAt).toLocaleDateString()}
                    </span>
                    <span className={urgentExpiry ? 'text-red-500 font-semibold' : ''}>
                      {remaining}d remaining
                    </span>
                  </div>
                </div>
              )}

              <Link to="/dashboard/subscription" className="btn-secondary w-full text-xs py-2 justify-center">
                Manage plan <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CreditCard className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">No active plan</p>
              <Link to="/dashboard/subscription" className="btn-primary text-xs py-2 px-4 mt-2">
                Get Unlimited Monthly <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </GlassCard>

        <GlassCard delay={0.4}>
          <SectionHeader title="License" sub="Activation status" />
          {activeLicense ? (
            <div className="space-y-4">
              <span className="badge-green text-xs inline-flex items-center gap-1.5"><LiveDot active /> Active</span>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">License Key</p>
                <p className="font-mono text-xs text-slate-700 break-all">{activeLicense.licenseKey}</p>
              </div>
              {activeLicense.machineLabel && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-brand-50 rounded-xl px-3 py-2 border border-brand-100">
                  <Monitor className="w-3.5 h-3.5 text-brand-500" />
                  <span className="truncate">{activeLicense.machineLabel}</span>
                </div>
              )}
              <Link to="/dashboard/download" className="btn-secondary w-full text-xs py-2 justify-center">
                <Download className="w-3.5 h-3.5" /> Download App
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Key className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm text-slate-500 mb-3">Activate your plan to get a license key</p>
              <Link to="/dashboard/subscription" className="btn-primary text-xs py-2 px-4">Get license</Link>
            </div>
          )}
        </GlassCard>

        <GlassCard delay={0.45}>
          <SectionHeader title="Device Usage" sub="Real-time breakdown" />
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-extrabold text-slate-900">{stats?.total ?? devices.length}</span>
              <span className="text-slate-400 text-lg font-medium mb-1">total devices</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Online', value: stats?.online ?? onlineDevices.length, color: 'bg-emerald-400' },
                { label: 'Blocked', value: stats?.blocked ?? blockedDevices.length, color: 'bg-red-400' },
                { label: 'Offline', value: stats?.offline ?? 0, color: 'bg-slate-300' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${row.color}`} />
                    <span className="text-slate-500">{row.label}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
            {pieData.length > 0 && (
              <div className="flex items-center gap-4 pt-2 border-t border-slate-50">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 flex-1">
                  {pieData.slice(0, 4).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-500">{d.name}</span>
                      </div>
                      <span className="font-semibold text-slate-700">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Recent devices */}
      <GlassCard delay={0.5} className="overflow-hidden !p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <div>
            <h3 className="font-semibold text-slate-900 text-[15px]">Recent Devices</h3>
            <p className="text-xs text-slate-400 mt-0.5">{devices.length} device{devices.length !== 1 ? 's' : ''} tracked</p>
          </div>
          <Link to="/dashboard/devices" className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {devices.length === 0 ? (
          <div className="py-14 text-center">
            <Activity className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No devices yet. Start your hotspot from the desktop app.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="table-head">Device</th>
                  <th className="table-head">IP Address</th>
                  <th className="table-head">Bandwidth</th>
                  <th className="table-head">Last seen</th>
                  <th className="table-head">Status</th>
                </tr>
              </thead>
              <tbody>
                {devices.slice(0, 6).map((d, i) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className="table-row"
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${d.blocked ? 'bg-red-50' : d.online ? 'bg-brand-50' : 'bg-slate-100'}`}>
                          <Monitor className={`w-4 h-4 ${d.blocked ? 'text-red-400' : d.online ? 'text-brand-500' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{d.deviceName || 'Unknown'}</p>
                          <p className="text-xs text-slate-400 font-mono">{d.macAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-500">{d.ipAddress || '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3 text-brand-500" />
                          {formatBytes(d.bytesReceived)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-teal-500" />
                          {formatBytes(d.bytesSent)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-400">
                      {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge text-xs ${d.blocked ? 'badge-red' : d.online ? 'badge-green' : 'badge-gray'}`}>
                        {d.blocked ? 'Blocked' : d.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Download, label: 'Download App', to: '/dashboard/download', color: 'from-brand-500 to-brand-600' },
          { icon: CreditCard, label: 'Subscription', to: '/dashboard/subscription', color: 'from-violet-500 to-violet-600' },
          { icon: Monitor, label: 'Devices', to: '/dashboard/devices', color: 'from-teal-500 to-emerald-600' },
          { icon: Shield, label: 'Settings', to: '/dashboard/settings', color: 'from-emerald-500 to-emerald-600' },
        ].map(({ icon: Icon, label, to, color }) => (
          <Link key={to} to={to}>
            <motion.div whileHover={{ y: -2 }} className="glass-card p-4 flex items-center gap-3 cursor-pointer h-full">
              <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-900">{label}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      {!activeSub && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-brand-600 to-teal-600 rounded-3xl p-7 flex flex-col md:flex-row items-center justify-between gap-5"
        >
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-300" />
              <span className="text-sm font-semibold text-amber-200">Unlimited Monthly — $9.99</span>
            </div>
            <h3 className="text-xl font-extrabold mb-1">Start your WiFi extender today</h3>
            <p className="text-emerald-50 text-sm">Unlimited devices, 30-day license, full monitoring included.</p>
          </div>
          <Link to="/dashboard/subscription" className="bg-white text-brand-700 font-semibold text-sm px-5 py-2.5 rounded-2xl hover:bg-emerald-50 shadow-lg flex items-center gap-2">
            Activate plan <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </div>
  )
}
