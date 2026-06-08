import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Clock, Infinity, ChevronDown,
  UserCheck, CalendarPlus, Ban, Search, RefreshCw
} from 'lucide-react'
import api from '../../../lib/api'
import { toast } from '../../../store/toastStore'

const STATUS_META = {
  ACTIVE:    { label: 'Active',    cls: 'badge-green', dot: 'status-dot-green' },
  PENDING:   { label: 'Pending',   cls: 'badge-cyan',  dot: 'status-dot-blue'  },
  EXPIRED:   { label: 'Expired',   cls: 'badge-red',   dot: 'status-dot-red'   },
  CANCELLED: { label: 'Cancelled', cls: 'badge-gray',  dot: 'status-dot'       },
  DISABLED:  { label: 'Disabled',  cls: 'badge-red',   dot: 'status-dot-red'   },
}

/* ── Assign plan modal ── */
function AssignModal({ users, plans, onClose, onDone }) {
  const [form, setForm] = useState({ userId: '', planId: '', durationDays: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/admin/subscriptions/assign', {
        userId:      parseInt(form.userId),
        planId:      parseInt(form.planId),
        durationDays: form.durationDays ? parseInt(form.durationDays) : null,
        notes:       form.notes || null,
      })
      toast.success('Plan assigned and activated!')
      onDone()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-glass-lg border border-slate-100 w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900">Assign Plan to User</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="input-label">User</label>
            <select className="input" value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} required>
              <option value="">Select user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Plan</label>
            <select className="input" value={form.planId} onChange={e => setForm(f => ({ ...f, planId: e.target.value }))} required>
              <option value="">Select plan...</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price} ({p.planType})</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Duration override (days) <span className="text-slate-400 font-normal">— optional</span></label>
            <input className="input" type="number" min="1" placeholder="Leave blank to use plan default"
              value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Admin notes <span className="text-slate-400 font-normal">— optional</span></label>
            <input className="input" placeholder="e.g. Complimentary access" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 text-sm py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm py-2.5">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Assign & Activate'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ── Extend modal ── */
function ExtendModal({ sub, onClose, onDone }) {
  const [days, setDays]   = useState(30)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/admin/subscriptions/${sub.id}/extend`, { days: parseInt(days), notes: notes || null })
      toast.success(`Extended by ${days} days`)
      onDone()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to extend')
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
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900">Extend Subscription</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Extending <strong className="text-slate-800">{sub.userName}</strong>'s <strong className="text-slate-800">{sub.plan?.name}</strong> plan.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="input-label">Days to add</label>
            <input className="input" type="number" min="1" value={days}
              onChange={e => setDays(e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Notes <span className="text-slate-400 font-normal">— optional</span></label>
            <input className="input" placeholder="Reason for extension" value={notes}
              onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 text-sm py-2.5">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm py-2.5">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Extend'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

/* ── Main component ── */
export default function AdminSubscriptions() {
  const [subs,    setSubs]    = useState([])
  const [users,   setUsers]   = useState([])
  const [plans,   setPlans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('ALL')
  const [showAssign, setShowAssign] = useState(false)
  const [extendSub,  setExtendSub]  = useState(null)
  const [acting,  setActing]  = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/admin/subscriptions'),
      api.get('/admin/users'),
      api.get('/admin/plans'),
    ]).then(([s, u, p]) => {
      setSubs(Array.isArray(s.data) ? s.data : (s.data.content ?? []))
      setUsers(Array.isArray(u.data) ? u.data : (u.data.content ?? []))
      setPlans(Array.isArray(p.data) ? p.data : (p.data.content ?? []))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activate = async (id) => {
    setActing(id)
    try {
      await api.post(`/admin/subscriptions/${id}/activate`)
      toast.success('Subscription activated!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate')
    } finally {
      setActing(null)
    }
  }

  const disable = async (id) => {
    if (!window.confirm('Disable this subscription?')) return
    setActing(id)
    try {
      await api.post(`/admin/subscriptions/${id}/disable`)
      toast.success('Subscription disabled')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable')
    } finally {
      setActing(null)
    }
  }

  const filtered = subs.filter(s => {
    const matchFilter = filter === 'ALL' || s.status === filter
    const matchSearch = !search ||
      s.userName?.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      s.plan?.name?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search user or plan..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {['ALL','PENDING','ACTIVE','EXPIRED','DISABLED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {f}
            </button>
          ))}
        </div>

        <button onClick={load} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>

        <button onClick={() => setShowAssign(true)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Assign Plan
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No subscriptions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="table-head">User</th>
                  <th className="table-head">Plan</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Expires</th>
                  <th className="table-head">Activated by</th>
                  <th className="table-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const meta = STATUS_META[s.status] || STATUS_META.CANCELLED
                  const isActing = acting === s.id
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="table-row"
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {s.userName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{s.userName}</p>
                            <p className="text-xs text-slate-400">{s.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm font-semibold text-slate-800">{s.plan?.name}</p>
                        <p className="text-xs text-slate-400">{s.plan?.planType}</p>
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${meta.cls}`}>
                          <div className={meta.dot} /> {meta.label}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-slate-500">
                        {s.lifetime
                          ? <span className="flex items-center gap-1 text-violet-600 font-medium"><Infinity className="w-3 h-3" /> Forever</span>
                          : s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="table-cell text-xs text-slate-500">{s.activatedByName || '—'}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          {s.status === 'PENDING' && (
                            <button
                              onClick={() => activate(s.id)}
                              disabled={isActing}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                            >
                              {isActing ? <div className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
                              Activate
                            </button>
                          )}
                          {(s.status === 'ACTIVE' || s.status === 'EXPIRED') && !s.lifetime && (
                            <button
                              onClick={() => setExtendSub(s)}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all"
                            >
                              <CalendarPlus className="w-3 h-3" /> Extend
                            </button>
                          )}
                          {(s.status === 'ACTIVE' || s.status === 'PENDING') && (
                            <button
                              onClick={() => disable(s.id)}
                              disabled={isActing}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                            >
                              {isActing ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" /> : <Ban className="w-3 h-3" />}
                              Disable
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAssign && (
          <AssignModal users={users} plans={plans} onClose={() => setShowAssign(false)} onDone={load} />
        )}
        {extendSub && (
          <ExtendModal sub={extendSub} onClose={() => setExtendSub(null)} onDone={load} />
        )}
      </AnimatePresence>
    </div>
  )
}
