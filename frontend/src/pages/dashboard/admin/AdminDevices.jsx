import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, RefreshCw, Smartphone, Laptop, Tv, Monitor, HelpCircle, Ban, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import api from '../../../lib/api'
import { toast } from '../../../store/toastStore'

const DEVICE_ICONS = {
  PHONE:   Smartphone,
  LAPTOP:  Laptop,
  TABLET:  Smartphone,
  TV:      Tv,
  DESKTOP: Monitor,
  UNKNOWN: HelpCircle,
}

function fmt(bytes) {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const PAGE_SIZE = 12

export default function AdminDevices() {
  const [devices,  setDevices]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('ALL')
  const [page,     setPage]     = useState(1)
  const [blocking, setBlocking] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/admin/devices')
      .then(r => setDevices(Array.isArray(r.data) ? r.data : (r.data.content ?? [])))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleBlock = async (id, blocked) => {
    setBlocking(id)
    try {
      await api.put(`/devices/${id}/block`)
      setDevices(prev => prev.map(d => d.id === id ? { ...d, blocked: !blocked } : d))
      toast.success(blocked ? 'Device unblocked' : 'Device blocked')
    } catch {
      toast.error('Failed to update device')
    } finally {
      setBlocking(null)
    }
  }

  const filtered = devices.filter(d => {
    const matchFilter = filter === 'ALL' ? true : filter === 'BLOCKED' ? d.blocked : !d.blocked
    const matchSearch = !search ||
      d.deviceName?.toLowerCase().includes(search.toLowerCase()) ||
      d.macAddress?.toLowerCase().includes(search.toLowerCase()) ||
      d.ipAddress?.toLowerCase().includes(search.toLowerCase()) ||
      d.userName?.toLowerCase().includes(search.toLowerCase()) ||
      d.ssid?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Devices', value: devices.length,                         color: 'from-brand-500 to-brand-600'     },
          { label: 'Active',        value: devices.filter(d => !d.blocked).length, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Blocked',       value: devices.filter(d => d.blocked).length,  color: 'from-red-500 to-red-600'         },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className={`text-2xl font-extrabold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search device, MAC, IP, user..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {['ALL','ACTIVE','BLOCKED'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No devices found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="table-head">Device</th>
                  <th className="table-head">Owner</th>
                  <th className="table-head">Hotspot</th>
                  <th className="table-head">MAC / IP</th>
                  <th className="table-head">Sent</th>
                  <th className="table-head">Received</th>
                  <th className="table-head">Last Seen</th>
                  <th className="table-head">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((d, i) => {
                  const Icon = DEVICE_ICONS[d.deviceType] || HelpCircle
                  return (
                    <motion.tr key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }} className={`table-row ${d.blocked ? 'opacity-60' : ''}`}>
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${d.blocked ? 'bg-red-50' : 'bg-brand-50'}`}>
                            <Icon className={`w-4 h-4 ${d.blocked ? 'text-red-400' : 'text-brand-500'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{d.deviceName || 'Unknown Device'}</p>
                            <p className="text-xs text-slate-400">{d.deviceType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm font-medium text-slate-700">{d.userName}</p>
                        <p className="text-xs text-slate-400">{d.userEmail}</p>
                      </td>
                      <td className="table-cell text-sm text-slate-600">{d.ssid || '—'}</td>
                      <td className="table-cell">
                        <p className="font-mono text-xs text-slate-700">{d.macAddress}</p>
                        <p className="text-xs text-slate-400">{d.ipAddress || '—'}</p>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-xs text-cyan-600 font-semibold">
                          <ArrowUpRight className="w-3 h-3" />{fmt(d.bytesSent)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-xs text-brand-600 font-semibold">
                          <ArrowDownRight className="w-3 h-3" />{fmt(d.bytesReceived)}
                        </div>
                      </td>
                      <td className="table-cell text-xs text-slate-400">
                        {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : '—'}
                      </td>
                      <td className="table-cell">
                        <button onClick={() => toggleBlock(d.id, d.blocked)} disabled={blocking === d.id}
                          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${d.blocked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                          {blocking === d.id
                            ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            : <Ban className="w-3 h-3" />}
                          {d.blocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">{filtered.length} devices</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${page === p ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
