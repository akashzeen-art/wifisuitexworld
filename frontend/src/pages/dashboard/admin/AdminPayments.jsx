import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, RefreshCw, DollarSign, TrendingUp, CreditCard, CheckCircle } from 'lucide-react'
import api from '../../../lib/api'

const STATUS_META = {
  SUCCESS:  { label: 'Success',  cls: 'badge-green', dot: 'status-dot-green' },
  PENDING:  { label: 'Pending',  cls: 'badge-cyan',  dot: 'status-dot-blue'  },
  FAILED:   { label: 'Failed',   cls: 'badge-red',   dot: 'status-dot-red'   },
  REFUNDED: { label: 'Refunded', cls: 'badge-gray',  dot: 'status-dot'       },
}

const GATEWAY_COLORS = {
  STRIPE:   'bg-violet-50 text-violet-700 border-violet-200',
  RAZORPAY: 'bg-blue-50 text-blue-700 border-blue-200',
  PAYPAL:   'bg-amber-50 text-amber-700 border-amber-200',
  MANUAL:   'bg-slate-100 text-slate-600 border-slate-200',
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('ALL')

  const load = () => {
    setLoading(true)
    api.get('/payments/admin')
      .then(r => setPayments(Array.isArray(r.data) ? r.data : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = payments.filter(p => {
    const matchFilter = filter === 'ALL' || p.status === filter
    const matchSearch = !search ||
      p.userName?.toLowerCase().includes(search.toLowerCase()) ||
      p.planName?.toLowerCase().includes(search.toLowerCase()) ||
      p.gatewayTxnId?.toLowerCase().includes(search.toLowerCase()) ||
      p.gateway?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalRevenue = payments.filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

  const stats = [
    { label: 'Total Revenue',    value: `$${totalRevenue.toFixed(2)}`, color: 'from-emerald-500 to-emerald-600', icon: DollarSign  },
    { label: 'Successful',       value: payments.filter(p => p.status === 'SUCCESS').length,  color: 'from-brand-500 to-brand-600',   icon: CheckCircle },
    { label: 'Pending',          value: payments.filter(p => p.status === 'PENDING').length,  color: 'from-amber-500 to-amber-600',   icon: CreditCard  },
    { label: 'Total Transactions',value: payments.length,                                      color: 'from-cyan-500 to-cyan-600',     icon: TrendingUp  },
  ]

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} className="glass-card p-5">
            <div className={`w-9 h-9 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search user, plan, txn ID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map(f => (
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
          <div className="py-16 text-center text-slate-400 text-sm">No payments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="table-head">User</th>
                  <th className="table-head">Plan</th>
                  <th className="table-head">Amount</th>
                  <th className="table-head">Gateway</th>
                  <th className="table-head">Transaction ID</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const meta = STATUS_META[p.status] || STATUS_META.PENDING
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {p.userName?.[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{p.userName}</span>
                        </div>
                      </td>
                      <td className="table-cell text-sm text-slate-600">{p.planName || '—'}</td>
                      <td className="table-cell">
                        <span className="text-sm font-bold text-slate-900">
                          {p.currency} {parseFloat(p.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs border ${GATEWAY_COLORS[p.gateway] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {p.gateway || '—'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-xs text-slate-500 truncate max-w-[140px] block">
                          {p.gatewayTxnId || '—'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${meta.cls}`}>
                          <div className={meta.dot} /> {meta.label}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-slate-400">
                        {p.paidAt ? new Date(p.paidAt).toLocaleString() : new Date(p.createdAt).toLocaleString()}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
