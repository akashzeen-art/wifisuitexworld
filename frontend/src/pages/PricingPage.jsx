import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Zap, Infinity, Clock, ChevronRight, Star } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { FadeUp, StaggerContainer, StaggerItem } from '../components/ui/Motion'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { toast } from '../store/toastStore'

const TYPE_META = {
  FREE_TRIAL: { label: 'Free Trial', icon: Clock,    color: 'from-emerald-500 to-teal-500',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  MONTHLY:    { label: 'Monthly',    icon: Zap,      color: 'from-brand-500 to-brand-600',    badge: 'bg-brand-50 text-brand-700 border-brand-200'       },
  LIFETIME:   { label: 'Lifetime',   icon: Infinity, color: 'from-violet-500 to-violet-600',  badge: 'bg-violet-50 text-violet-700 border-violet-200'    },
}

const COMPARISON = [
  { feature: 'Connected devices',  starter: '3',         basic: '10',        premium: 'Unlimited', lifetime: 'Unlimited' },
  { feature: 'License duration',   starter: '30 days',   basic: '30 days',   premium: '30 days',   lifetime: 'Forever'   },
  { feature: 'Device monitoring',  starter: 'Basic',     basic: 'Advanced',  premium: 'Full',      lifetime: 'Full'      },
  { feature: 'Device blocking',    starter: false,       basic: true,        premium: true,        lifetime: true        },
  { feature: 'Bandwidth tracking', starter: true,        basic: true,        premium: true,        lifetime: true        },
  { feature: 'Admin panel',        starter: false,       basic: false,       premium: true,        lifetime: true        },
  { feature: 'API access',         starter: false,       basic: false,       premium: true,        lifetime: true        },
  { feature: 'Priority support',   starter: false,       basic: true,        premium: true,        lifetime: true        },
  { feature: '24/7 support',       starter: false,       basic: false,       premium: true,        lifetime: true        },
]

function CheckCell({ val }) {
  if (val === true)  return <Check className="w-4 h-4 text-emerald-500 mx-auto" />
  if (val === false) return <span className="text-slate-300 text-lg mx-auto block text-center">—</span>
  return <span className="text-sm font-medium text-slate-700">{val}</span>
}

export default function PricingPage() {
  const [plans, setPlans]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [requesting, setReq]    = useState(null)
  const token = useAuthStore(s => s.token)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/subscriptions/plans')
      .then(r => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleRequest = async (planId) => {
    if (!token) { navigate('/register'); return }
    setReq(planId)
    try {
      await api.post(`/subscriptions/request/${planId}`)
      toast.success('Plan requested! An admin will activate it shortly.')
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

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-hero-gradient text-center">
        <FadeUp>
          <span className="badge-blue text-xs mb-4 inline-flex">Pricing</span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
            Simple, transparent<br /><span className="gradient-text">pricing</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-lg mx-auto mb-4">
            No hidden fees. No payment required upfront. Request a plan and an admin will activate it for you.
          </p>
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2 rounded-full">
            <Star className="w-3.5 h-3.5 fill-current" />
            Admin-activated subscriptions — no billing system
          </div>
        </FadeUp>
      </section>

      {/* Plan cards */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5" stagger={0.08}>
              {plans.map((plan) => {
                const meta = TYPE_META[plan.planType] || TYPE_META.MONTHLY
                const Icon = meta.icon
                const isLifetime = plan.planType === 'LIFETIME'
                const isTrial    = plan.planType === 'FREE_TRIAL'

                return (
                  <StaggerItem key={plan.id}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className={`relative rounded-3xl flex flex-col h-full border transition-all duration-300 overflow-hidden ${
                        plan.popular
                          ? 'bg-gradient-to-b from-brand-600 to-brand-700 border-brand-500 shadow-2xl shadow-brand-500/25'
                          : isLifetime
                            ? 'bg-gradient-to-b from-violet-600 to-violet-700 border-violet-500 shadow-xl shadow-violet-500/20'
                            : 'bg-white border-slate-200 shadow-card hover:shadow-card-hover'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                      )}
                      {plan.popular && (
                        <div className="absolute -top-px left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-3 py-1 rounded-b-xl shadow">
                            <Zap className="w-2.5 h-2.5" /> POPULAR
                          </span>
                        </div>
                      )}

                      <div className="p-6 flex-1 flex flex-col">
                        {/* Type badge */}
                        <span className={`self-start text-[10px] font-bold px-2.5 py-1 rounded-full border mb-4 ${
                          plan.popular || isLifetime ? 'bg-white/15 text-white border-white/20' : meta.badge
                        }`}>
                          {meta.label}
                        </span>

                        <h3 className={`text-lg font-bold mb-1 ${plan.popular || isLifetime ? 'text-white' : 'text-slate-900'}`}>
                          {plan.name}
                        </h3>
                        <p className={`text-xs mb-5 leading-relaxed ${plan.popular || isLifetime ? 'text-blue-200' : 'text-slate-500'}`}>
                          {plan.description}
                        </p>

                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className={`text-4xl font-extrabold tracking-tight ${plan.popular || isLifetime ? 'text-white' : 'text-slate-900'}`}>
                            ${plan.price}
                          </span>
                          <span className={`text-xs font-medium ${plan.popular || isLifetime ? 'text-blue-200' : 'text-slate-400'}`}>
                            {isLifetime ? ' one-time' : isTrial ? ' free' : '/mo'}
                          </span>
                        </div>

                        {/* Device limit */}
                        <div className={`text-xs font-semibold mb-5 ${plan.popular || isLifetime ? 'text-cyan-300' : 'text-brand-600'}`}>
                          {plan.unlimitedDevices ? '∞ Unlimited devices' : `Up to ${plan.maxDevices} devices`}
                        </div>

                        {/* Features */}
                        <ul className="space-y-2 mb-6 flex-1">
                          {plan.featureList.map(f => (
                            <li key={f} className="flex items-start gap-2 text-xs">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                plan.popular || isLifetime ? 'bg-white/20' : 'bg-brand-50'
                              }`}>
                                <Check className={`w-2.5 h-2.5 ${plan.popular || isLifetime ? 'text-white' : 'text-brand-600'}`} />
                              </div>
                              <span className={plan.popular || isLifetime ? 'text-blue-100' : 'text-slate-600'}>{f}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handleRequest(plan.id)}
                          disabled={requesting === plan.id}
                          className={`flex items-center justify-center gap-2 font-semibold py-2.5 rounded-2xl text-sm transition-all duration-200 active:scale-[0.98] ${
                            plan.popular || isLifetime
                              ? 'bg-white text-brand-700 hover:bg-blue-50 shadow-lg'
                              : 'btn-primary'
                          }`}
                        >
                          {requesting === plan.id
                            ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : isTrial
                              ? 'Start Free Trial'
                              : isLifetime
                                ? <><Infinity className="w-4 h-4" /> Get Lifetime</>
                                : <><ChevronRight className="w-4 h-4" /> Request Plan</>
                          }
                        </button>
                      </div>
                    </motion.div>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Plan comparison</h2>
            <p className="text-slate-500">See exactly what's included in each plan.</p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 w-1/3">Feature</th>
                    {['Starter', 'Basic', 'Premium', 'Lifetime'].map(n => (
                      <th key={n} className="px-4 py-4 text-center text-sm font-semibold text-slate-700">{n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.feature} className={`border-b border-slate-50 ${i % 2 === 0 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-6 py-3.5 text-sm text-slate-600">{row.feature}</td>
                      <td className="px-4 py-3.5 text-center"><CheckCell val={row.starter} /></td>
                      <td className="px-4 py-3.5 text-center"><CheckCell val={row.basic} /></td>
                      <td className="px-4 py-3.5 text-center"><CheckCell val={row.premium} /></td>
                      <td className="px-4 py-3.5 text-center"><CheckCell val={row.lifetime} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* How activation works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <FadeUp>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">How activation works</h2>
            <p className="text-slate-500 mb-10">No payment gateway. No credit card. Simple admin-controlled activation.</p>
            <div className="grid grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Request a plan', desc: 'Click "Request Plan" and select the plan you want.' },
                { step: '02', title: 'Admin activates', desc: 'An admin reviews and activates your subscription manually.' },
                { step: '03', title: 'Get your license', desc: 'Receive your license key and start using the desktop app.' },
              ].map(s => (
                <div key={s.step} className="glass-card p-6 relative overflow-hidden">
                  <div className="absolute top-3 right-4 text-5xl font-black text-slate-100 leading-none select-none">{s.step}</div>
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-2xl flex items-center justify-center mb-3 shadow-sm relative z-10">
                    <span className="text-white font-bold text-sm">{s.step}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1.5 relative z-10">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed relative z-10">{s.desc}</p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  )
}
