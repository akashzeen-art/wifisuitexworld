import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wifi, WifiOff, Monitor, CreditCard, TrendingUp,
  ArrowUpRight, ArrowDownRight, ChevronRight, Download,
  Key, Calendar, Zap, Shield, Users, Activity,
  RefreshCw, Ban, Infinity, Clock, AlertTriangle
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts'
import api from '../../lib/api'
import useAuthStore from '../../store/authStore'
import {
  StatCard, GlassCard, SectionHeader, ProgressBar,
  LiveDot, SpeedArc, formatBytes, daysLeft
} from '../../components/dashboard/DashboardWidgets'
import { useLiveSpeed } from '../../hooks/useDashboard'

// ── Greeting ──────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-3 py-2.5 shadow-glass text-xs">
      <p className="font-semibold text-slate-500 mb-1.5">{label}</p>
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
  const user     = useAuthStore(s => s.user)
  const navigate = useNavigate()

  const [subs,     setSubs]     = useState([])
  const [devices,  setDevices]  = useState([])
  const [stats,    setStats]    = useState(null)
  const [licenses, setLicenses] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const { history: speedHistory, current: speed } = useLiveSpeed()

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [s, d, st, l] = await Promise.allSettled([
        api.get('/subscriptions'),
        api.get('/devices'),
        api.get('/devices/stats'),
        api.get('/subscriptions/licenses'),
      ])
      if (s.status  === 'fulfilled') setSubs(s.value.data)
      if (d.status  === 'fulfilled') setDevices(d.value.data)
      if (st.status === 'fulfilled') setStats(st.value.data)
      if (l.status  === 'fulfilled') setLicenses(l.value.data)
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

  // ── Derived values ──────────────────────────────────────────────────────────
  const activeSub     = subs.find(s => s.status === 'ACTIVE')
  const activeLicense = licenses.find(l => l.status === 'ACTIVE')
  const onlineDevices = devices.filter(d => d.online && !d.blocked)
  const blockedDevices= devices.filter(d => d.blocked)
  const totalBytes    = devices.reduce((a, d) => a + (d.totalBytes || 0), 0)
  const maxDevices    = activeSub?.plan?.maxDevices ?? 0
  const isUnlimited   = activeSub?.plan?.unlimitedDevices
  const remaining     = activeSub?.expiresAt ? daysLeft(activeSub.expiresAt) : null
  const isLifetime    = activeSub?.lifetime
  const urgentExpiry  = remaining !== null && remaining <= 7 && !isLifetime

  // ── Device type breakdown for pie chart ────────────────────────────────────
  const deviceTypes = devices.reduce((acc, d) => {
    const t = d.deviceType || 'UNKNOWN'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(deviceTypes).map(([name, value]) => ({ name, value }))
  const PIE_COLORS = ['#3b6ef5','#06b6d4','#8b5cf6','#10b981','#f59e0b','#94a3b8']

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 text-sm">Here's your hotspot overview.</p>
            <div className="flex items-center gap-1.5">
              <LiveDot active={!!activeSub} />
              <span className="text-xs text-slate-400">
                {activeSub ? 'Hotspot ready' : 'No active plan'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => load()}
          className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Expiry warning banner ── */}
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
              Your <strong>{activeSub?.plan?.name}</strong> plan expires in{' '}
              <strong>{remaining} day{remaining !== 1 ? 's' : ''}</strong>.{' '}
              <Link to="/dashboard/subscription" className="underline font-semibold">Renew now →</Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat cards row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Wifi}
          label="Hotspot Status"
          value={activeSub ? 'Active' : 'Inactive'}
          color={activeSub ? 'from-emerald-500 to-teal-500' : 'from-slate-400 to-slate-500'}
          delay={0}
          badge={
            <div className="flex items-center gap-1.5">
              <LiveDot active={!!activeSub} />
              <span className={`text-[10px] font-semibold ${activeSub ? 'text-emerald-600' : 'text-slate-400'}`}>
                {activeSub ? 'Live' : 'Off'}
              </span>
            </div>
          }
        />
        <StatCard
          icon={Users}
          label="Connected Devices"
          value={stats?.online ?? onlineDevices.length}
          sub={isUnlimited ? '∞ max' : maxDevices ? `of ${maxDevices}` : '—'}
          color="from-brand-500 to-brand-600"
          delay={0.07}
          onClick={() => navigate('/dashboard/devices')}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Bandwidth"
          value={formatBytes(totalBytes)}
          sub="All time"
          color="from-cyan-500 to-cyan-600"
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

      {/* ── Row 2: Speed meters + Bandwidth chart ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Speed meters */}
        <GlassCard delay={0.25} className="flex flex-col">
          <SectionHeader
            title="Live Speed"
            sub="Real-time network"
            action={<LiveDot active />}
          />
          <div className="flex items-center justify-around flex-1 py-2">
            <SpeedArc value={speed.down} max={200} label="Download" unit="Mbps" color="#3b6ef5" />
            <div className="w-px h-16 bg-slate-100" />
            <SpeedArc value={speed.up}   max={80}  label="Upload"   unit="Mbps" color="#06b6d4" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-50">
            <div className="bg-brand-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-brand-600 mb-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Download</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900">{speed.down}<span className="text-xs font-medium text-slate-400 ml-1">Mbps</span></p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-cyan-600 mb-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Upload</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900">{speed.up}<span className="text-xs font-medium text-slate-400 ml-1">Mbps</span></p>
            </div>
          </div>
        </GlassCard>

        {/* Bandwidth chart */}
        <GlassCard delay={0.3} className="lg:col-span-2">
          <SectionHeader
            title="Bandwidth Usage"
            sub="Live traffic — last 60 seconds"
            action={
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />Down</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />Up</span>
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={speedHistory} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b6ef5" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b6ef5" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="t" hide />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="down" stroke="#3b6ef5" strokeWidth={2} fill="url(#gD)" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="up"   stroke="#06b6d4" strokeWidth={2} fill="url(#gU)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* ── Row 3: Subscription + License + Device limit ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Subscription status */}
        <GlassCard delay={0.35}>
          <SectionHeader title="Subscription" sub="Plan validity" />
          {activeSub ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-extrabold text-slate-900">{activeSub.plan?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{activeSub.plan?.planType}</p>
                </div>
                <span className="badge-green text-xs flex items-center gap-1.5">
                  <LiveDot active /> Active
                </span>
              </div>

              {/* Validity bar */}
              {!isLifetime && remaining !== null && (
                <div className="space-y-2">
                  <ProgressBar
                    value={activeSub.plan?.durationDays - remaining}
                    max={activeSub.plan?.durationDays || 30}
                    label="Plan used"
                    color={urgentExpiry ? 'from-red-400 to-rose-500' : 'from-brand-500 to-cyan-400'}
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

              {isLifetime && (
                <div className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2.5 border border-violet-100">
                  <Infinity className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-semibold text-violet-700">Lifetime — never expires</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-slate-400 mb-0.5">Max devices</p>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    {isUnlimited ? <><Infinity className="w-3.5 h-3.5" /> Unlimited</> : activeSub.plan?.maxDevices}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-slate-400 mb-0.5">Expires</p>
                  <p className="font-bold text-slate-800">
                    {isLifetime ? 'Never' : activeSub.expiresAt ? new Date(activeSub.expiresAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>

              <Link to="/dashboard/subscription" className="btn-secondary w-full text-xs py-2 justify-center">
                Manage plan <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <CreditCard className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No active plan</p>
              <p className="text-xs text-slate-400 mb-4">Request a plan to get started</p>
              <Link to="/dashboard/subscription" className="btn-primary text-xs py-2 px-4">
                View plans <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </GlassCard>

        {/* License status */}
        <GlassCard delay={0.4}>
          <SectionHeader title="License" sub="Activation status" />
          {activeLicense ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="badge-green text-xs flex items-center gap-1.5"><LiveDot active /> Active</span>
                {activeLicense.bound && (
                  <span className="badge-blue text-xs flex items-center gap-1.5">
                    <Monitor className="w-3 h-3" /> Bound
                  </span>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">License Key</p>
                <p className="font-mono text-xs text-slate-700 break-all leading-relaxed">{activeLicense.licenseKey}</p>
              </div>

              {activeLicense.machineLabel && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-brand-50 rounded-xl px-3 py-2 border border-brand-100">
                  <Monitor className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                  <span className="truncate">{activeLicense.machineLabel}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-slate-400 mb-0.5">Activated</p>
                  <p className="font-bold text-slate-800">
                    {activeLicense.activatedAt ? new Date(activeLicense.activatedAt).toLocaleDateString() : 'Not yet'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <p className="text-slate-400 mb-0.5">Expires</p>
                  <p className="font-bold text-slate-800">
                    {activeLicense.lifetime ? 'Never' : activeLicense.expiresAt ? new Date(activeLicense.expiresAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>

              <Link to="/dashboard/download" className="btn-secondary w-full text-xs py-2 justify-center">
                <Download className="w-3.5 h-3.5" /> Download App
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <Key className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No license yet</p>
              <p className="text-xs text-slate-400 mb-4">Purchase a plan to get your license key</p>
              <Link to="/dashboard/subscription" className="btn-primary text-xs py-2 px-4">
                Get license <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </GlassCard>

        {/* Device limit widget */}
        <GlassCard delay={0.45}>
          <SectionHeader title="Device Usage" sub="Connected vs plan limit" />
          <div className="space-y-4">
            {/* Big number */}
            <div className="flex items-end gap-2">
              <span className="text-5xl font-extrabold text-slate-900">{stats?.online ?? onlineDevices.length}</span>
              <span className="text-slate-400 text-lg font-medium mb-1">
                / {isUnlimited ? '∞' : maxDevices || '—'}
              </span>
            </div>
            <p className="text-xs text-slate-400 -mt-2">devices currently online</p>

            {!isUnlimited && maxDevices > 0 && (
              <ProgressBar
                value={stats?.online ?? onlineDevices.length}
                max={maxDevices}
                label="Capacity used"
                color="from-brand-500 to-cyan-400"
              />
            )}

            {/* Breakdown */}
            <div className="space-y-2">
              {[
                { label: 'Online',   value: stats?.online   ?? onlineDevices.length,  color: 'bg-emerald-400' },
                { label: 'Blocked',  value: stats?.blocked  ?? blockedDevices.length, color: 'bg-red-400'     },
                { label: 'Offline',  value: stats?.offline  ?? 0,                     color: 'bg-slate-300'   },
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

            {/* Pie chart */}
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

      {/* ── Row 4: Recent devices ── */}
      <GlassCard delay={0.5} className="overflow-hidden !p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <div>
            <h3 className="font-semibold text-slate-900 text-[15px]">Recent Devices</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last seen on your hotspot</p>
          </div>
          <Link to="/dashboard/devices" className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {devices.length === 0 ? (
          <div className="py-14 text-center">
            <Activity className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No devices yet. Start your hotspot to see them here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="table-head">Device</th>
                  <th className="table-head">IP Address</th>
                  <th className="table-head">Bandwidth</th>
                  <th className="table-head">Connected</th>
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
                        <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${d.blocked ? 'bg-red-50' : d.online ? 'bg-brand-50' : 'bg-slate-100'}`}>
                          <Monitor className={`w-4 h-4 ${d.blocked ? 'text-red-400' : d.online ? 'text-brand-500' : 'text-slate-400'}`} />
                          <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${d.blocked ? 'bg-red-400' : d.online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
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
                          <ArrowUpRight className="w-3 h-3 text-cyan-500" />
                          {formatBytes(d.bytesSent)}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-slate-400">
                      {d.connectedAt ? new Date(d.connectedAt).toLocaleTimeString() : '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge text-xs ${d.blocked ? 'badge-red' : d.online ? 'badge-green' : 'badge-gray'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${d.blocked ? 'bg-red-400' : d.online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
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

      {/* ── Row 5: Quick actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.55 }}
      >
        <h3 className="font-semibold text-slate-900 text-[15px] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: Download,
              label: 'Download App',
              desc: 'Get the Windows desktop app',
              to: '/dashboard/download',
              color: 'from-brand-500 to-brand-600',
            },
            {
              icon: CreditCard,
              label: 'Manage Plan',
              desc: 'View or upgrade subscription',
              to: '/dashboard/subscription',
              color: 'from-violet-500 to-violet-600',
            },
            {
              icon: Monitor,
              label: 'View Devices',
              desc: 'Monitor connected devices',
              to: '/dashboard/devices',
              color: 'from-cyan-500 to-cyan-600',
            },
            {
              icon: Shield,
              label: 'Settings',
              desc: 'Account & preferences',
              to: '/dashboard/settings',
              color: 'from-emerald-500 to-emerald-600',
            },
          ].map(({ icon: Icon, label, desc, to, color }) => (
            <Link key={to} to={to}>
              <motion.div
                whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(59,110,245,0.10)' }}
                whileTap={{ scale: 0.98 }}
                className="glass-card p-4 flex items-start gap-3 cursor-pointer h-full"
              >
                <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── No subscription CTA ── */}
      {!activeSub && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-700 to-cyan-600 rounded-3xl p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
        >
          <div className="absolute inset-0 bg-dots opacity-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-300" />
              <span className="text-sm font-semibold text-amber-200">Get started today</span>
            </div>
            <h3 className="text-xl font-extrabold mb-1">Activate your WiFi hotspot</h3>
            <p className="text-blue-100 text-sm max-w-md">
              Request a plan to get your license key and start sharing your internet connection in under 60 seconds.
            </p>
          </div>
          <div className="relative flex gap-3 flex-shrink-0">
            <Link
              to="/dashboard/subscription"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold text-sm px-5 py-2.5 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              View plans <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}

    </div>
  )
}
