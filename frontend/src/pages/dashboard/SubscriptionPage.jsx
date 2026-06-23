import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Check, Key, Infinity, Clock, Zap, AlertCircle,
  Copy, CheckCheck, RefreshCw, Wifi, Shield, Users, Gauge
} from 'lucide-react'
import api from '../../lib/api'
import { toast } from '../../store/toastStore'

const STATUS_META = {
  ACTIVE:    { label: 'Active',    cls: 'badge-green', dot: 'status-dot-green' },
  PENDING:   { label: 'Pending',   cls: 'badge-cyan',  dot: 'status-dot-blue'  },
  EXPIRED:   { label: 'Expired',   cls: 'badge-red',   dot: 'status-dot-red'   },
  CANCELLED: { label: 'Cancelled', cls: 'badge-gray',  dot: 'status-dot'       },
  DISABLED:  { label: 'Disabled',  cls: 'badge-red',   dot: 'status-dot-red'   },
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function daysLeft(expiresAt) {
  if (!expiresAt) return null
  return Math.ceil((new Date(expiresAt) - Date.now()) / 86400000)
}

export default function SubscriptionPage() {
  const [plan, setPlan] = useState(null)
  const [subs, setSubs] = useState([])
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setReq] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/subscriptions/plans'),
      api.get('/subscriptions'),
      api.get('/subscriptions/licenses'),
    ]).then(([p, s, l]) => {
      const activePlans = (p.data || []).filter(pl => pl.active !== false)
      setPlan(activePlans[0] || p.data?.[0] || null)
      setSubs(s.data)
      setLicenses(l.data)
    }).catch(() => toast.error('Failed to load subscription data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const requestPlan = async () => {
    if (!plan) return
    setReq(true)
    try {
      await api.post(`/subscriptions/request/${plan.id}`)
      toast.success('Plan activated! Your license key is ready.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed')
    } finally {
      setReq(false)
    }
  }

  const activeSub = subs.find(s => s.status === 'ACTIVE')
  const activeLicense = licenses.find(l => l.status === 'ACTIVE')
  const isCurrent = activeSub?.plan?.id === plan?.id

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">Subscription</p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Plan</h1>
          <p className="text-slate-500 mt-1">One simple plan — unlimited devices, renewed monthly.</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Active subscription */}
      {activeSub ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-8 border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 text-lg">{activeSub.plan?.name}</h3>
                <span className="badge-green text-xs">Active</span>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Infinity className="w-3.5 h-3.5" /> Unlimited devices · 30-day license
              </p>
            </div>
            {activeSub.expiresAt && (
              <div className="text-right">
                {(() => {
                  const d = daysLeft(activeSub.expiresAt)
                  return (
                    <>
                      <div className={`text-sm font-bold ${d <= 7 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {d > 0 ? `${d} days left` : 'Expired'}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Expires {new Date(activeSub.expiresAt).toLocaleDateString()}
                      </p>
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          {activeLicense && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-semibold text-slate-600">License Key</span>
                </div>
                <CopyButton text={activeLicense.licenseKey} />
              </div>
              <p className="font-mono text-sm text-slate-700 tracking-wider">{activeLicense.licenseKey}</p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-brand-50 border border-brand-100 rounded-3xl p-6 mb-8 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-brand-800 mb-1">No active subscription</h3>
            <p className="text-sm text-brand-700">Activate the Unlimited Monthly plan below to start your hotspot.</p>
          </div>
        </motion.div>
      )}

      {/* Single plan card */}
      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-600 via-brand-700 to-teal-700 p-8 text-white shadow-xl shadow-brand-500/20 mb-10"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-4">
              <Wifi className="w-3.5 h-3.5" /> Only plan you need
            </div>

            <h2 className="text-2xl font-extrabold mb-1">{plan.name}</h2>
            <p className="text-emerald-50 text-sm mb-6 max-w-md">{plan.description}</p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-extrabold">${plan.price}</span>
              <span className="text-emerald-200 text-sm">/ month</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {(plan.featureList || []).map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-emerald-50">
                  <Check className="w-4 h-4 text-teal-300 flex-shrink-0" />
                  {f}
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm text-emerald-50">
                <Users className="w-4 h-4 text-teal-300" /> Unlimited connected devices
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-50">
                <Gauge className="w-4 h-4 text-teal-300" /> Real-time bandwidth monitoring
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-50">
                <Shield className="w-4 h-4 text-teal-300" /> Device blocking & management
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-50">
                <Clock className="w-4 h-4 text-teal-300" /> 30-day license, auto-renewable
              </div>
            </div>

            <button
              onClick={requestPlan}
              disabled={requesting || isCurrent}
              className={`inline-flex items-center gap-2 font-semibold py-3 px-8 rounded-2xl text-sm transition-all ${
                isCurrent
                  ? 'bg-white/20 text-white cursor-default'
                  : 'bg-white text-brand-700 hover:bg-emerald-50 shadow-lg active:scale-[0.98]'
              }`}
            >
              {requesting ? (
                <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              ) : isCurrent ? (
                'Current plan'
              ) : (
                <><Zap className="w-4 h-4" /> Activate Unlimited Monthly</>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* History */}
      {subs.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-900">Subscription History</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="table-head">Plan</th>
                <th className="table-head">Started</th>
                <th className="table-head">Expires</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => {
                const meta = STATUS_META[s.status] || STATUS_META.CANCELLED
                return (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell font-semibold text-slate-800">{s.plan?.name}</td>
                    <td className="table-cell text-xs text-slate-500">
                      {s.startsAt ? new Date(s.startsAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="table-cell text-xs text-slate-500">
                      {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`badge text-xs ${meta.cls}`}>
                        <div className={meta.dot} /> {meta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
