import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Loader, Users, CreditCard, Key, Wifi, Monitor, BarChart3 } from 'lucide-react'
import api from '../../../lib/api'
import { toast } from '../../../store/toastStore'

const REPORTS = [
  {
    id:      'users',
    icon:    Users,
    color:   'from-brand-500 to-brand-600',
    title:   'Users Report',
    desc:    'All registered users with role, status, and join date.',
    endpoint: '/admin/reports/users',
  },
  {
    id:      'subscriptions',
    icon:    CreditCard,
    color:   'from-cyan-500 to-cyan-600',
    title:   'Subscriptions Report',
    desc:    'All subscriptions with plan, status, and expiry.',
    endpoint: '/admin/reports/subscriptions',
  },
  {
    id:      'licenses',
    icon:    Key,
    color:   'from-violet-500 to-violet-600',
    title:   'Licenses Report',
    desc:    'All license keys with activation and revocation details.',
    endpoint: '/admin/reports/licenses',
  },
  {
    id:      'hotspots',
    icon:    Wifi,
    color:   'from-emerald-500 to-emerald-600',
    title:   'Hotspots Report',
    desc:    'All hotspot sessions with traffic and device counts.',
    endpoint: '/admin/reports/hotspots',
  },
  {
    id:      'devices',
    icon:    Monitor,
    color:   'from-amber-500 to-amber-600',
    title:   'Devices Report',
    desc:    'All connected devices with bandwidth and block status.',
    endpoint: '/admin/reports/devices',
  },
  {
    id:      'revenue',
    icon:    BarChart3,
    color:   'from-rose-500 to-rose-600',
    title:   'Revenue Report',
    desc:    'Payment transactions with amounts and gateway details.',
    endpoint: '/admin/reports/revenue',
  },
]

export default function AdminReports() {
  const [loading,  setLoading]  = useState({})
  const [format,   setFormat]   = useState('csv')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')

  const download = async (report) => {
    setLoading(prev => ({ ...prev, [report.id]: true }))
    try {
      const params = new URLSearchParams({ format })
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo)   params.set('to',   dateTo)

      const res = await api.get(`${report.endpoint}?${params}`, { responseType: 'blob' })

      const ext  = format === 'csv' ? 'csv' : 'json'
      const mime = format === 'csv' ? 'text/csv' : 'application/json'
      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }))
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${report.id}-report-${new Date().toISOString().slice(0,10)}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${report.title} downloaded`)
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setLoading(prev => ({ ...prev, [report.id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-card p-5">
        <p className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-500" /> Report Options
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="input-label">Format</label>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {['csv','json'].map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${format === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="input-label">From</label>
            <input type="date" className="input text-sm py-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="input-label">To</label>
            <input type="date" className="input text-sm py-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo('') }}
              className="text-xs text-slate-400 hover:text-slate-600 pb-2 transition-colors">
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Report cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((report, i) => {
          const Icon = report.icon
          const isLoading = loading[report.id]
          return (
            <motion.div key={report.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card p-5 flex flex-col gap-4 hover:shadow-glass-lg transition-shadow duration-200">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${report.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{report.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{report.desc}</p>
                </div>
              </div>
              <button onClick={() => download(report)} disabled={isLoading}
                className="btn-primary text-sm py-2.5 flex items-center justify-center gap-2 mt-auto">
                {isLoading
                  ? <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
                  : <><Download className="w-4 h-4" /> Download {format.toUpperCase()}</>}
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
