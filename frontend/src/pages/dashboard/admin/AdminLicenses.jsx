import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key, Ban, RotateCcw, Search, RefreshCw,
  Monitor, Calendar, Infinity, ChevronDown, ChevronUp, X
} from 'lucide-react'
import api from '../../../lib/api'
import { toast } from '../../../store/toastStore'

const STATUS_META = {
  ACTIVE:  { label: 'Active',  cls: 'badge-green', dot: 'status-dot-green' },
  REVOKED: { label: 'Revoked', cls: 'badge-red',   dot: 'status-dot-red'   },
  EXPIRED: { label: 'Expired', cls: 'badge-gray',  dot: 'status-dot'       },
}

/* ── Revoke modal ── */
function RevokeModal({ license, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/admin/licenses/${license.id}/revoke`, { reason: reason || null })
      toast.success('License revoked')
      onDone()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-glass-lg border border-slate-100 w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Revoke License</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Revoking <span className="font-mono font-semibold text-slate-800 text-xs">{license.licenseKey}</span> for <strong>{license.userName}</strong>.
          This will immediately block the desktop app.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="input-label">Reason <span className="text-slate-400 font-normal">— optional</span></label>
            <input className="input" placeholder="e.g. Subscription cancelled" value={reason}
              onChange={e => setReason(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline flex-1 text-sm py-2.5">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 text-sm py-2.5 font-semibold bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors active:scale-[0.98]">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Revoke License'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ── Activation history row ── */
function ActivationHistory({ licenseId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/admin/licenses/${licenseId}/activations`)
      .then(r => setHistory(Array.isArray(r.data) ? r.data : (r.data.content ?? [])))
      .finally(() => setLoading(false))
  }, [licenseId])

  if (loading) return <div className="py-4 flex justify-center"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!history.length) return <p className="text-xs text-slate-400 py-3 text-center">No activation history</p>

  return (
    <div className="space-y-1.5 py-2">
      {history.map(a => (
        <div key={a.id} className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              a.result === 'SUCCESS' ? 'bg-emerald-400'
              : a.result === 'REACTIVATED' ? 'bg-brand-400'
              : 'bg-red-400'
            }`} />
            <span className="font-mono text-slate-600 truncate max-w-[120px]">{a.machineId?.slice(0, 12)}...</span>
            <span className="text-slate-400">{a.machineLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            {a.failureReason && <span className="text-red-500 text-[10px]">{a.failureReason}</span>}
            <span>{new Date(a.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Main component ── */
export default function AdminLicenses() {
  const [licenses, setLicenses] = useState([])
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('ALL')
  const [revoking, setRevoking] = useState(null)
  const [resetting,setResetting]= useState(null)
  const [expanded, setExpanded] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/licenses'),
      api.get('/admin/licenses/stats'),
    ]).then(([l, s]) => {
      setLicenses(Array.isArray(l.data) ? l.data : (l.data.content ?? []))
      setStats(s.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const resetMachine = async (id) => {
    if (!window.confirm('Reset machine binding? The user can re-activate on a new device.')) return
    setResetting(id)
    try {
      await api.post(`/admin/licenses/${id}/reset-machine`)
      toast.success('Machine binding reset')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset')
    } finally {
      setResetting(null)
    }
  }

  const filtered = licenses.filter(l => {
    const matchFilter = filter === 'ALL' || l.status === filter
    const matchSearch = !search ||
      l.userName?.toLowerCase().includes(search.toLowerCase()) ||
      l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      l.licenseKey?.toLowerCase().includes(search.toLowerCase()) ||
      l.planName?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total',     value: stats.total,     color: 'from-brand-500 to-brand-600'   },
            { label: 'Active',    value: stats.active,    color: 'from-emerald-500 to-emerald-600' },
            { label: 'Activated', value: stats.activated, color: 'from-cyan-500 to-cyan-600'     },
            { label: 'Revoked',   value: stats.revoked,   color: 'from-red-500 to-red-600'       },
          ].map(s => (
            <div key={s.label} className="glass-card p-4">
              <p className={`text-2xl font-extrabold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label} licenses</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search user, key, plan..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {['ALL', 'ACTIVE', 'REVOKED', 'EXPIRED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {f}
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
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No licenses found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="table-head">User</th>
                  <th className="table-head">License Key</th>
                  <th className="table-head">Plan</th>
                  <th className="table-head">Machine</th>
                  <th className="table-head">Expires</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const meta = STATUS_META[l.status] || STATUS_META.EXPIRED
                  const isExpanded = expanded === l.id
                  return (
                    <>
                      <motion.tr
                        key={l.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`table-row cursor-pointer ${isExpanded ? 'bg-brand-50/30' : ''}`}
                        onClick={() => setExpanded(isExpanded ? null : l.id)}
                      >
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-gradient-to-br from-brand-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {l.userName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{l.userName}</p>
                              <p className="text-xs text-slate-400">{l.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1.5">
                            <Key className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="font-mono text-xs text-slate-700">{l.licenseKey}</span>
                          </div>
                        </td>
                        <td className="table-cell text-sm text-slate-600">{l.planName || '—'}</td>
                        <td className="table-cell">
                          {l.bound ? (
                            <div className="flex items-center gap-1.5">
                              <Monitor className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                              <span className="text-xs text-slate-600 truncate max-w-[120px]">{l.machineLabel || l.machineId?.slice(0,12)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Not activated</span>
                          )}
                        </td>
                        <td className="table-cell text-xs text-slate-500">
                          {l.lifetime
                            ? <span className="flex items-center gap-1 text-violet-600 font-medium"><Infinity className="w-3 h-3" /> Forever</span>
                            : l.expiresAt ? new Date(l.expiresAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="table-cell">
                          <span className={`badge text-xs ${meta.cls}`}>
                            <div className={meta.dot} /> {meta.label}
                          </span>
                        </td>
                        <td className="table-cell" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            {l.status === 'ACTIVE' && (
                              <button
                                onClick={() => setRevoking(l)}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                              >
                                <Ban className="w-3 h-3" /> Revoke
                              </button>
                            )}
                            {l.bound && l.status === 'ACTIVE' && (
                              <button
                                onClick={() => resetMachine(l.id)}
                                disabled={resetting === l.id}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
                              >
                                {resetting === l.id
                                  ? <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                                  : <RotateCcw className="w-3 h-3" />}
                                Reset
                              </button>
                            )}
                            <button
                              onClick={() => setExpanded(isExpanded ? null : l.id)}
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded activation history */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            key={`${l.id}-history`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan={7} className="px-6 pb-4 bg-brand-50/20">
                              <div className="border border-brand-100 rounded-2xl p-4 bg-white">
                                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-brand-500" />
                                  Activation History
                                  {l.revokedReason && (
                                    <span className="ml-2 text-red-500 font-normal">Revoked: {l.revokedReason}</span>
                                  )}
                                </p>
                                <ActivationHistory licenseId={l.id} />
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke modal */}
      <AnimatePresence>
        {revoking && (
          <RevokeModal license={revoking} onClose={() => setRevoking(null)} onDone={load} />
        )}
      </AnimatePresence>
    </div>
  )
}
