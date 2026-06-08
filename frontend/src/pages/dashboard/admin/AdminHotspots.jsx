import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, RefreshCw, Wifi, WifiOff, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import api from '../../../lib/api'

const STATUS_META = {
  ACTIVE:  { label: 'Active',  cls: 'badge-green', icon: Wifi,         iconCls: 'text-emerald-500' },
  STOPPED: { label: 'Stopped', cls: 'badge-gray',  icon: WifiOff,      iconCls: 'text-slate-400'   },
  ERROR:   { label: 'Error',   cls: 'badge-red',   icon: AlertCircle,  iconCls: 'text-red-400'     },
}

function fmt(bytes) {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const PAGE_SIZE = 10

export default function AdminHotspots() {
  const [hotspots, setHotspots] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('ALL')
  const [page,     setPage]     = useState(1)

  const load = () => {
    setLoading(true)
    api.get('/admin/hotspots')
      .then(r => setHotspots(Array.isArray(r.data) ? r.data : (r.data.content ?? [])))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = hotspots.filter(h => {
    const matchFilter = filter === 'ALL' || h.status === filter
    const matchSearch = !search ||
      h.ssid?.toLowerCase().includes(search.toLowerCase()) ||
      h.userName?.toLowerCase().includes(search.toLowerCase()) ||
      h.userEmail?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = {
    ALL:     hotspots.length,
    ACTIVE:  hotspots.filter(h => h.status === 'ACTIVE').length,
    STOPPED: hotspots.filter(h => h.status === 'STOPPED').length,
    ERROR:   hotspots.filter(h => h.status === 'ERROR').length,
  }

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Hotspots', value: counts.ALL,     color: 'from-brand-500 to-brand-600'     },
          { label: 'Active',         value: counts.ACTIVE,  color: 'from-emerald-500 to-emerald-600' },
          { label: 'Stopped',        value: counts.STOPPED, color: 'from-slate-400 to-slate-500'     },
          { label: 'Error',          value: counts.ERROR,   color: 'from-red-500 to-red-600'         },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className={`text-2xl font-extrabold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search SSID or user..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {['ALL','ACTIVE','STOPPED','ERROR'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {f} {f !== 'ALL' && <span className="ml-1 opacity-60">{counts[f]}</span>}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No hotspots found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="table-head">SSID</th>
                  <th className="table-head">Owner</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Devices</th>
                  <th className="table-head">Upload</th>
                  <th className="table-head">Download</th>
                  <th className="table-head">Started</th>
                  <th className="table-head">Stopped</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((h, i) => {
                  const meta = STATUS_META[h.status] || STATUS_META.STOPPED
                  const StatusIcon = meta.icon
                  return (
                    <motion.tr
                      key={h.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="table-row"
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 flex-shrink-0 ${meta.iconCls}`} />
                          <span className="text-sm font-semibold text-slate-800">{h.ssid}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm font-medium text-slate-700">{h.userName}</p>
                        <p className="text-xs text-slate-400">{h.userEmail}</p>
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className="table-cell text-sm text-slate-600 font-medium">
                        {h.connectedDevices ?? 0} / {h.maxClients}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-xs text-cyan-600 font-semibold">
                          <ArrowUpRight className="w-3 h-3" />{fmt(h.totalBytesUp)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-xs text-brand-600 font-semibold">
                          <ArrowDownRight className="w-3 h-3" />{fmt(h.totalBytesDown)}
                        </div>
                      </td>
                      <td className="table-cell text-xs text-slate-400">
                        {h.startedAt ? new Date(h.startedAt).toLocaleString() : '—'}
                      </td>
                      <td className="table-cell text-xs text-slate-400">
                        {h.stoppedAt ? new Date(h.stoppedAt).toLocaleString() : '—'}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-50">
            <span className="text-xs text-slate-400">{filtered.length} hotspots</span>
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
