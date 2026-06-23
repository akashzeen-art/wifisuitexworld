import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, Smartphone, Laptop, Tv, Wifi, Ban,
  ArrowUpRight, ArrowDownRight, RefreshCw, Search,
  Activity, Clock, Zap, Radio
} from 'lucide-react'
import api from '../../lib/api'
import { useDeviceSocket } from '../../hooks/useDeviceSocket'
import { toast } from '../../store/toastStore'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(b) {
  if (!b || b <= 0) return '0 B'
  if (b < 1e6) return `${(b / 1e3).toFixed(1)} KB`
  if (b < 1e9) return `${(b / 1e6).toFixed(1)} MB`
  return `${(b / 1e9).toFixed(2)} GB`
}

function timeAgo(dt) {
  if (!dt) return '—'
  const secs = Math.floor((Date.now() - new Date(dt)) / 1000)
  if (secs < 60)   return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

function connectionDuration(connectedAt) {
  if (!connectedAt) return '—'
  const secs = Math.floor((Date.now() - new Date(connectedAt)) / 1000)
  if (secs < 60)   return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h ${m}m`
}

// ── Device icon ───────────────────────────────────────────────────────────────
function DeviceIcon({ type, blocked, online }) {
  const Icon = type === 'PHONE' ? Smartphone
             : type === 'LAPTOP' ? Laptop
             : type === 'TV' ? Tv
             : Monitor
  return (
    <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
      blocked ? 'bg-red-50' : online ? 'bg-brand-50' : 'bg-slate-100'
    }`}>
      <Icon className={`w-5 h-5 ${blocked ? 'text-red-400' : online ? 'text-brand-500' : 'text-slate-400'}`} />
      {/* Online indicator dot */}
      <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
        blocked ? 'bg-red-400' : online ? 'bg-emerald-400' : 'bg-slate-300'
      }`} />
    </div>
  )
}

// ── Signal bars ───────────────────────────────────────────────────────────────
function SignalBars({ strength }) {
  if (strength == null) return <span className="text-xs text-slate-300">—</span>
  const bars = [25, 50, 75, 100]
  const color = strength >= 75 ? 'bg-emerald-400'
              : strength >= 50 ? 'bg-amber-400'
              : 'bg-red-400'
  return (
    <div className="flex items-end gap-0.5 h-4">
      {bars.map((t, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm ${strength >= t ? color : 'bg-slate-200'}`}
          style={{ height: `${(i + 1) * 25}%` }}
        />
      ))}
    </div>
  )
}

// ── New device toast notification ─────────────────────────────────────────────
function useEventNotifications() {
  return useCallback((event) => {
    const name = event.device?.deviceName || 'Device'

    if (event.type === 'CONNECTED') {
      toast.info(`${name} connected`)
    } else if (event.type === 'BLOCKED') {
      toast.warning(`${name} blocked`)
    } else if (event.type === 'DISCONNECTED') {
      toast.info(`${name} disconnected`)
    }
  }, [])
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DevicesPage() {
  const [devices,     setDevices]     = useState([])
  const [stats,       setStats]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [toggling,    setToggling]    = useState(null)
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState('ALL')
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [wsConnected, setWsConnected] = useState(false)
  const timerRef = useRef(null)

  // ── REST fetch ──────────────────────────────────────────────────────────────
  const fetchDevices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [devRes, statsRes] = await Promise.all([
        api.get('/devices'),
        api.get('/devices/stats'),
      ])
      setDevices(devRes.data)
      setStats(statsRes.data)
      setLastRefresh(new Date())
    } catch {
      if (!silent) toast.error('Failed to load devices')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // ── WebSocket handlers ──────────────────────────────────────────────────────
  const handleWsList = useCallback((list) => {
    setDevices(list)
    setLastRefresh(new Date())
    setWsConnected(true)
  }, [])

  const handleWsEvent = useEventNotifications()

  useDeviceSocket(handleWsList, handleWsEvent)

  // ── Initial load + polling fallback ────────────────────────────────────────
  useEffect(() => {
    fetchDevices()
    // Fallback polling every 10s in case WS is not connected
    timerRef.current = setInterval(() => fetchDevices(true), 10000)
    return () => clearInterval(timerRef.current)
  }, [fetchDevices])

  // ── Block toggle ────────────────────────────────────────────────────────────
  const toggleBlock = async (id) => {
    setToggling(id)
    try {
      const { data } = await api.put(`/devices/${id}/block`)
      setDevices(prev => prev.map(d => d.id === id ? data : d))
      toast.success(data.blocked ? 'Device blocked' : 'Device unblocked')
    } catch {
      toast.error('Failed to update device')
    } finally {
      setToggling(null)
    }
  }

  // ── Filter + search ─────────────────────────────────────────────────────────
  const filtered = devices.filter(d => {
    const matchFilter = filter === 'ALL'
      || (filter === 'ONLINE'   && d.online && !d.blocked)
      || (filter === 'BLOCKED'  && d.blocked)
      || (filter === 'OFFLINE'  && !d.online && !d.blocked)
    const matchSearch = !search
      || d.deviceName?.toLowerCase().includes(search.toLowerCase())
      || d.macAddress?.toLowerCase().includes(search.toLowerCase())
      || d.ipAddress?.includes(search)
      || d.vendor?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalBandwidth = devices.reduce((a, d) => a + (d.totalBytes || 0), 0)

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Connected Devices</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 text-sm">Monitor and manage all devices on your hotspot.</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-xs text-slate-400">{wsConnected ? 'Live' : `Updated ${timeAgo(lastRefresh)}`}</span>
            </div>
          </div>
        </div>
        <button onClick={() => fetchDevices()} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Devices',   value: stats?.total    ?? devices.length,                          color: 'from-brand-500 to-brand-600',     icon: Monitor        },
          { label: 'Online',          value: stats?.online   ?? devices.filter(d => d.online && !d.blocked).length, color: 'from-emerald-500 to-emerald-600', icon: Wifi           },
          { label: 'Blocked',         value: stats?.blocked  ?? devices.filter(d => d.blocked).length,  color: 'from-red-500 to-red-600',         icon: Ban            },
          { label: 'Total Bandwidth', value: formatBytes(totalBandwidth),                                color: 'from-cyan-500 to-cyan-600',       icon: ArrowDownRight },
        ].map(s => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 flex items-center gap-4"
          >
            <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-50 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9 py-2 text-sm"
              placeholder="Search name, MAC, IP, vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {['ALL', 'ONLINE', 'BLOCKED', 'OFFLINE'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="badge-green text-xs">{devices.filter(d => d.online && !d.blocked).length} online</span>
            {devices.filter(d => d.blocked).length > 0 && (
              <span className="badge-red text-xs">{devices.filter(d => d.blocked).length} blocked</span>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Wifi className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 mb-1">
              {search || filter !== 'ALL' ? 'No devices match your filter' : 'No devices connected'}
            </h3>
            <p className="text-sm text-slate-400">
              {search || filter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Start your hotspot from the desktop app.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="table-head">Device</th>
                  <th className="table-head">IP Address</th>
                  <th className="table-head">Vendor</th>
                  <th className="table-head">Signal</th>
                  <th className="table-head">Download</th>
                  <th className="table-head">Upload</th>
                  <th className="table-head">Connected</th>
                  <th className="table-head">Last Seen</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((d, i) => (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ delay: i * 0.03 }}
                      className="table-row"
                    >
                      {/* Device */}
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <DeviceIcon type={d.deviceType} blocked={d.blocked} online={d.online} />
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{d.deviceName || 'Unknown'}</p>
                            <p className="text-xs text-slate-400 font-mono">{d.macAddress}</p>
                          </div>
                        </div>
                      </td>

                      {/* IP */}
                      <td className="table-cell font-mono text-xs text-slate-500">{d.ipAddress || '—'}</td>

                      {/* Vendor */}
                      <td className="table-cell text-xs text-slate-500 max-w-[100px] truncate">{d.vendor || '—'}</td>

                      {/* Signal */}
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <SignalBars strength={d.signalStrength} />
                          {d.signalStrength != null && (
                            <span className="text-xs text-slate-400">{d.signalStrength}%</span>
                          )}
                        </div>
                      </td>

                      {/* Download */}
                      <td className="table-cell">
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <ArrowDownRight className="w-3.5 h-3.5 text-brand-500" />
                          {formatBytes(d.bytesReceived)}
                        </span>
                      </td>

                      {/* Upload */}
                      <td className="table-cell">
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <ArrowUpRight className="w-3.5 h-3.5 text-cyan-500" />
                          {formatBytes(d.bytesSent)}
                        </span>
                      </td>

                      {/* Connection time */}
                      <td className="table-cell">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {connectionDuration(d.connectedAt)}
                        </span>
                      </td>

                      {/* Last seen */}
                      <td className="table-cell text-xs text-slate-400">{timeAgo(d.lastSeen)}</td>

                      {/* Status */}
                      <td className="table-cell">
                        <span className={`badge text-xs ${
                          d.blocked ? 'badge-red'
                          : d.online ? 'badge-green'
                          : 'badge-gray'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            d.blocked ? 'bg-red-400'
                            : d.online ? 'bg-emerald-400'
                            : 'bg-slate-400'
                          }`} />
                          {d.blocked ? 'Blocked' : d.online ? 'Online' : 'Offline'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="table-cell">
                        <button
                          onClick={() => toggleBlock(d.id)}
                          disabled={toggling === d.id}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                            d.blocked
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-500 hover:bg-red-100'
                          }`}
                        >
                          {toggling === d.id
                            ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            : <Ban className="w-3 h-3" />
                          }
                          {d.blocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
