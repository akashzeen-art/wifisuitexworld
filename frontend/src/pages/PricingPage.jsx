import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Zap, Infinity, Wifi, Users, Shield, Gauge, ChevronRight } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { FadeUp } from '../components/ui/Motion'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { toast } from '../store/toastStore'

const INCLUDED = [
  { icon: Users, label: 'Unlimited connected devices' },
  { icon: Gauge, label: 'Real-time bandwidth monitoring' },
  { icon: Shield, label: 'Device blocking & management' },
  { icon: Wifi, label: 'WiFi hotspot extender license' },
  { icon: Zap, label: '30-day renewable license' },
  { icon: Infinity, label: 'Full dashboard access' },
]

export default function PricingPage() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setReq] = useState(false)
  const token = useAuthStore(s => s.token)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/subscriptions/plans')
      .then(r => {
        const active = (r.data || []).filter(p => p.active !== false)
        setPlan(active[0] || r.data?.[0] || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleRequest = async () => {
    if (!plan) return
    if (!token) { navigate('/register'); return }
    setReq(true)
    try {
      await api.post(`/subscriptions/request/${plan.id}`)
      toast.success('Plan activated! Head to your dashboard.')
      navigate('/dashboard/subscription')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed')
    } finally {
      setReq(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-32 pb-12 px-6 bg-hero-gradient text-center">
        <FadeUp>
          <span className="badge-blue text-xs mb-4 inline-flex">Pricing</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            One plan. <span className="gradient-text">Unlimited everything.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-lg mx-auto">
            Unlimited devices, full WiFi extender features, renewed every 30 days. No tiers, no limits.
          </p>
        </FadeUp>
      </section>

      <section className="py-12 px-6 pb-24">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : plan ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-600 via-brand-700 to-teal-700 p-8 text-white shadow-2xl shadow-brand-500/25"
            >
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />

              <div className="relative">
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-xs font-semibold px-3 py-1 rounded-full mb-5">
                  <Zap className="w-3.5 h-3.5" /> Most popular — only plan
                </span>

                <h2 className="text-2xl font-extrabold mb-1">{plan.name}</h2>
                <p className="text-emerald-50 text-sm mb-6">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-6xl font-extrabold">${plan.price}</span>
                  <span className="text-emerald-200">/ month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {INCLUDED.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 text-sm text-emerald-50">
                      <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-teal-300" />
                      </div>
                      {label}
                    </li>
                  ))}
                  {(plan.featureList || []).map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-emerald-50">
                      <Check className="w-4 h-4 text-teal-300 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleRequest}
                  disabled={requesting}
                  className="w-full flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold py-3.5 rounded-2xl hover:bg-emerald-50 shadow-lg transition-all active:scale-[0.98]"
                >
                  {requesting ? (
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Get Unlimited Monthly <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>

                {!token && (
                  <p className="text-center text-xs text-emerald-200 mt-4">
                    <Link to="/register" className="underline font-medium text-white">Create account</Link> to activate
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <p className="text-center text-slate-500">No plan available at the moment.</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
