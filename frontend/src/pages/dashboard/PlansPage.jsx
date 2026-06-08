import { useEffect, useState } from 'react'
import { Check, Loader } from 'lucide-react'
import api from '../../lib/api'

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    api.get('/plans').then(r => setPlans(r.data)).finally(() => setLoading(false))
  }, [])

  const purchase = async (planId) => {
    setPurchasing(planId)
    try {
      const { data } = await api.post(`/subscriptions/purchase/${planId}`)
      setSuccess(data.licenseKey)
    } catch (err) {
      alert(err.response?.data?.message || 'Purchase failed')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
        <p className="text-slate-500 mt-1">Choose a plan to activate your WiFi extender license.</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-green-800 mb-2">🎉 Purchase successful!</h3>
          <p className="text-sm text-green-700 mb-2">Your license key:</p>
          <div className="bg-white rounded-xl p-3 font-mono text-sm text-slate-700 break-all border border-green-200">
            {success}
          </div>
          <p className="text-xs text-green-600 mt-2">Copy this key and use it in the desktop app to activate.</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="glass-card rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
            <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-slate-900">${plan.price}</span>
              <span className="text-slate-400 text-sm">/month</span>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> {plan.maxDevices} connected devices</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> {plan.durationDays}-day license</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Device monitoring</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Bandwidth tracking</li>
            </ul>
            <button
              onClick={() => purchase(plan.id)}
              disabled={purchasing === plan.id}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {purchasing === plan.id ? <><Loader className="w-4 h-4 animate-spin" /> Processing...</> : 'Purchase Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
