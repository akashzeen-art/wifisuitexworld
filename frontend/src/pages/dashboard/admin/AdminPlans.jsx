import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Loader, ToggleLeft, ToggleRight, Infinity } from 'lucide-react'
import api from '../../../lib/api'
import { toast } from '../../../store/toastStore'

const PLAN_TYPES = ['MONTHLY', 'LIFETIME', 'FREE_TRIAL']

const emptyForm = {
  name: '', description: '', price: '', planType: 'MONTHLY',
  durationDays: 30, trialDays: 0, maxDevices: 5,
  sortOrder: 0, popular: false,
  features: ''
}

export default function AdminPlans() {
  const [plans,   setPlans]   = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState(emptyForm)
  const [creating,setCreating]= useState(false)
  const [deleting,setDeleting]= useState(null)
  const [toggling,setToggling]= useState(null)

  const load = () => {
    api.get('/admin/plans')
      .then(r => setPlans(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: v }))
  }

  const createPlan = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/admin/plans', {
        ...form,
        price:       parseFloat(form.price),
        durationDays: form.planType === 'LIFETIME' ? null : parseInt(form.durationDays),
        trialDays:   parseInt(form.trialDays),
        maxDevices:  form.maxDevices === '-1' || form.maxDevices === -1 ? -1 : parseInt(form.maxDevices),
        sortOrder:   parseInt(form.sortOrder),
      })
      toast.success('Plan created!')
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create plan')
    } finally {
      setCreating(false)
    }
  }

  const deletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return
    setDeleting(id)
    try {
      await api.delete(`/admin/plans/${id}`)
      setPlans(prev => prev.filter(p => p.id !== id))
      toast.success('Plan deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete plan with active subscriptions')
    } finally {
      setDeleting(null)
    }
  }

  const togglePlan = async (id) => {
    setToggling(id)
    try {
      const { data } = await api.patch(`/admin/plans/${id}/toggle`)
      setPlans(prev => prev.map(p => p.id === id ? data : p))
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Plans list */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">All Plans</h3>
          <span className="badge-gray text-xs">{plans.length} plans</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors ${!plan.active ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-800">{plan.name}</p>
                    {plan.popular && <span className="badge-blue text-[10px]">Popular</span>}
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{plan.planType}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    ${plan.price}
                    {plan.planType !== 'LIFETIME' ? '/mo' : ' one-time'}
                    {' · '}
                    {plan.unlimitedDevices ? <span className="inline-flex items-center gap-0.5"><Infinity className="w-3 h-3" /> devices</span> : `${plan.maxDevices} devices`}
                    {plan.durationDays ? ` · ${plan.durationDays}d` : ' · Forever'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePlan(plan.id)}
                    disabled={toggling === plan.id}
                    className="text-slate-400 hover:text-brand-600 transition-colors"
                    title={plan.active ? 'Deactivate' : 'Activate'}
                  >
                    {toggling === plan.id
                      ? <div className="w-4 h-4 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                      : plan.active
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    disabled={deleting === plan.id}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-all"
                  >
                    {deleting === plan.id
                      ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create plan form */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-slate-900 mb-5">Create New Plan</h3>
        <form onSubmit={createPlan} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Name</label>
              <input className="input text-sm py-2" placeholder="e.g. Pro" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="input-label">Price (USD)</label>
              <input className="input text-sm py-2" type="number" step="0.01" min="0" placeholder="9.99" value={form.price} onChange={set('price')} required />
            </div>
          </div>

          <div>
            <label className="input-label">Description</label>
            <input className="input text-sm py-2" placeholder="Short description" value={form.description} onChange={set('description')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Plan Type</label>
              <select className="input text-sm py-2" value={form.planType} onChange={set('planType')}>
                {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Duration (days)</label>
              <input className="input text-sm py-2" type="number" min="1" placeholder="30"
                value={form.durationDays} onChange={set('durationDays')}
                disabled={form.planType === 'LIFETIME'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Max Devices (-1 = unlimited)</label>
              <input className="input text-sm py-2" type="number" min="-1" placeholder="5 or -1"
                value={form.maxDevices} onChange={set('maxDevices')} required />
            </div>
            <div>
              <label className="input-label">Trial Days</label>
              <input className="input text-sm py-2" type="number" min="0" placeholder="0"
                value={form.trialDays} onChange={set('trialDays')} />
            </div>
          </div>

          <div>
            <label className="input-label">Features (pipe-separated)</label>
            <input className="input text-sm py-2" placeholder="Feature 1|Feature 2|Feature 3"
              value={form.features} onChange={set('features')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Sort Order</label>
              <input className="input text-sm py-2" type="number" min="0" value={form.sortOrder} onChange={set('sortOrder')} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="popular" checked={form.popular} onChange={set('popular')}
                className="w-4 h-4 rounded accent-brand-600" />
              <label htmlFor="popular" className="text-sm font-medium text-slate-700">Mark as popular</label>
            </div>
          </div>

          <button type="submit" disabled={creating} className="btn-primary w-full text-sm py-2.5 mt-2">
            {creating
              ? <><Loader className="w-4 h-4 animate-spin" /> Creating...</>
              : <><Plus className="w-4 h-4" /> Create Plan</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
