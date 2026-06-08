import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Key, Calendar, ChevronRight, Infinity,
  Clock, Zap, AlertCircle, Copy, CheckCheck, RefreshCw
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
    <button onClick={copy} className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function daysLeft(expiresAt) {
  if (!expiresAt) return null
  const diff = Math.ceil((new Date(expiresAt) - Date.now()) / 86400000)
  return diff
}

export default function SubscriptionPage() {
  const [plans,   setPlans]   = useState([])
  const [subs,    setSubs]    = useState([])
  const [licenses,setLicenses]= useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setReq]  = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/subscriptions/plans'),
      api.get('/subscriptions'),
      api.get('/subscriptions/licenses'),
    ]).then(([p, s, l]) => {
      setPlans(p.data)
      setSubs(s.data)
      setLicenses(l.data)
    }).catch(() => toast.error('Failed to load subscription data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const requestPlan = async (planId) => {
    setReq(planId)
    try {
      await api.post(`/subscriptions/request/${planId}`)
      toast.success('Plan activated! Your license key is ready.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed')
    } finally {
      setReq(null)
    }
  }

  const activeSub  = subs.find(s => s.status === 'ACTIVE')
  const activeLicense = licenses.find(l => l.status === 'ACTIVE')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Subscription</h1>
          <p className="text-slate-500 mt-1">Manage your plan and license keys.</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Active subscription status card ── */}
      {activeSub ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 text-lg">{activeSub.plan?.name}</h3>
                <span className="badge-green text-xs flex items-center gap-1">
                  <div className="status-dot-green" /> Active
                </span>
                {activeSub.lifetime && (
                  <span className="badge-cyan text-xs flex items-center gap-1">
                    <Infinity className="w-3 h-3" /> Lifetime
                  </span>
                )}
                {activeSub.inTrial && (
                  <span className="badge text-xs bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Trial
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {activeSub.plan?.unlimitedDevices
                  ? 'Unlimited devices'
                  : `Up to ${activeSub.plan?.maxDevices} devices`}
                {' · '}
                {activeSub.plan?.planType === 'MONTHLY' ? 'Monthly plan' : activeSub.plan?.planType}
              </p>
            </div>
            {activeSub.expiresAt && !activeSub.lifetime && (
              <div className="text-right">
                {(() => {
                  const d = daysLeft(activeSub.expiresAt)
                  return (
                    <div className={`text-sm font-bold ${d <= 7 ? 'text-red-500' : d <= 14 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {d > 0 ? `${d} days left` : 'Expired'}
                    </div>
                  )
                })()}
                <p className="text-xs text-slate-400 mt-0.5">
                  Expires {new Date(activeSub.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Expiry progress bar */}
          {activeSub.expiresAt && !activeSub.lifetime && (() => {
            const total = new Date(activeSub.expiresAt) - new Date(activeSub.startsAt)
            const used  = Date.now() - new Date(activeSub.startsAt)
            const pct   = Math.min(100, Math.max(0, (used / total) * 100))
            const d     = daysLeft(activeSub.expiresAt)
            return (
              <div className="mb-5">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${d <= 7 ? 'bg-red-400' : d <= 14 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })()}

          {/* License key */}
          {activeLicense && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-semibold text-slate-600">License Key</span>
                </div>
                <CopyButton text={activeLicense.licenseKey} />
              </div>
              <p className="font-mono text-sm text-slate-700 tracking-wider">{activeLicense.licenseKey}</p>
              {activeLicense.activatedAt && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Activated {new Date(activeLicense.activatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {activeSub.activatedByName && (
            <p className="text-xs text-slate-400 mt-3">
              Activated by <span className="font-medium text-slate-600">{activeSub.activatedByName}</span>
              {activeSub.activatedAt && ` on ${new Date(activeSub.activatedAt).toLocaleDateString()}`}
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-50 border border-brand-100 rounded-3xl p-6 mb-6 flex items-start gap-4"
        >
          <div className="w-10 h-10 bg-brand-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-brand-800 mb-1">No active subscription</h3>
            <p className="text-sm text-brand-700">Choose a plan below to get started instantly.</p>
          </div>
        </motion.div>
      )}

      {/* ── Plan cards ── */}
      <h2 className="text-lg font-bold text-slate-900 mb-4">
        {activeSub ? 'Upgrade your plan' : 'Choose a plan'}
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
        {plans.map((plan, i) => {
          const isCurrent  = activeSub?.plan?.id === plan.id
          const isLifetime = plan.planType === 'LIFETIME'
          const isTrial    = plan.planType === 'FREE_TRIAL'

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-3xl p-5 border flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                isCurrent
                  ? 'border-brand-300 bg-brand-50 shadow-glow'
                  : plan.popular
                    ? 'border-brand-200 bg-gradient-to-b from-brand-600 to-brand-700 shadow-xl shadow-brand-500/20'
                    : isLifetime
                      ? 'border-violet-200 bg-gradient-to-b from-violet-600 to-violet-700 shadow-xl shadow-violet-500/20'
                      : 'border-slate-200 bg-white shadow-card hover:shadow-card-hover'
              }`}
            >
              {isCurrent && <span className="badge-blue text-xs mb-3 self-start">Current plan</span>}

              <h3 className={`font-bold text-sm mb-1 ${plan.popular || isLifetime ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>

              <div className="flex items-baseline gap-0.5 mb-1">
                <span className={`text-3xl font-extrabold ${plan.popular || isLifetime ? 'text-white' : 'text-slate-900'}`}>${plan.price}</span>
                <span className={`text-xs ${plan.popular || isLifetime ? 'text-blue-200' : 'text-slate-400'}`}>
                  {isLifetime ? '' : isTrial ? ' free' : '/mo'}
                </span>
              </div>

              <p className={`text-xs font-semibold mb-4 ${plan.popular || isLifetime ? 'text-cyan-300' : 'text-brand-600'}`}>
                {plan.unlimitedDevices ? '∞ Unlimited' : `${plan.maxDevices} devices`}
              </p>

              <ul className="space-y-1.5 mb-5 flex-1">
                {plan.featureList.slice(0, 4).map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-xs">
                    <Check className={`w-3 h-3 flex-shrink-0 ${plan.popular || isLifetime ? 'text-cyan-300' : 'text-brand-500'}`} />
                    <span className={plan.popular || isLifetime ? 'text-blue-100' : 'text-slate-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => requestPlan(plan.id)}
                disabled={requesting === plan.id || isCurrent}
                className={`flex items-center justify-center gap-1.5 font-semibold py-2 rounded-xl text-xs transition-all duration-200 active:scale-[0.98] ${
                  isCurrent
                    ? 'bg-brand-100 text-brand-600 cursor-default'
                    : plan.popular || isLifetime
                      ? 'bg-white text-brand-700 hover:bg-blue-50'
                      : 'btn-primary'
                }`}
              >
                {requesting === plan.id
                  ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : isCurrent ? 'Current plan'
                  : isTrial   ? 'Start Free Trial'
                  : isLifetime ? <><Infinity className="w-3.5 h-3.5" /> Get Lifetime</>
                  : <><Zap className="w-3.5 h-3.5" /> Get Started</>
                }
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* ── Subscription history ── */}
      {subs.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h3 className="font-semibold text-slate-900">Subscription History</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/60">
                <th className="table-head">Plan</th>
                <th className="table-head">Type</th>
                <th className="table-head">Started</th>
                <th className="table-head">Expires</th>
                <th className="table-head">Activated by</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => {
                const meta = STATUS_META[s.status] || STATUS_META.CANCELLED
                return (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell font-semibold text-slate-800">{s.plan?.name}</td>
                    <td className="table-cell">
                      <span className="text-xs text-slate-500">{s.plan?.planType}</span>
                    </td>
                    <td className="table-cell text-xs text-slate-500">
                      {s.startsAt ? new Date(s.startsAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="table-cell text-xs text-slate-500">
                      {s.lifetime ? <span className="flex items-center gap-1 text-violet-600 font-medium"><Infinity className="w-3 h-3" /> Forever</span>
                        : s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="table-cell text-xs text-slate-500">{s.activatedByName || '—'}</td>
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
