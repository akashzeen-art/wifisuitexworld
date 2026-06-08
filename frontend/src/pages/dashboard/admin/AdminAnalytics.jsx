import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, TrendingUp, Users, Wifi, DollarSign } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import api from '../../../lib/api'

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6']

function fmt(bytes) {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B','KB','MB','GB','TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-glass p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {prefix}{p.value?.toLocaleString()}{suffix}
        </p>
      ))}
    </div>
  )
}

export default function AdminAnalytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [range,   setRange]   = useState('30d')

  const load = () => {
    setLoading(true)
    api.get(`/admin/analytics?range=${range}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [range])

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const summary = [
    { icon: DollarSign, label: 'Total Revenue',      value: `$${data?.totalRevenue?.toFixed(2) ?? '0.00'}`, color: 'from-brand-500 to-brand-600'     },
    { icon: Users,      label: 'New Users',           value: data?.newUsers ?? 0,                            color: 'from-cyan-500 to-cyan-600'       },
    { icon: TrendingUp, label: 'New Subscriptions',   value: data?.newSubscriptions ?? 0,                    color: 'from-emerald-500 to-emerald-600' },
    { icon: Wifi,       label: 'Active Hotspots',     value: data?.activeHotspots ?? 0,                      color: 'from-violet-500 to-violet-600'   },
  ]

  return (
    <div className="space-y-6">
      {/* Range + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {['7d','30d','90d','1y'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${range === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={load} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} className="glass-card p-5">
            <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue + Subscriptions charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Revenue Over Time</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.revenueChart ?? []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip prefix="$" />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">New Subscriptions</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.subscriptionChart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Subscriptions" fill="#06b6d4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User growth + Device types + Traffic */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">User Growth</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.userChart ?? []}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="users" name="Users" stroke="#10b981" strokeWidth={2} fill="url(#userGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Device Types</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data?.deviceTypes ?? []} dataKey="count" nameKey="type"
                cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={3}>
                {(data?.deviceTypes ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm font-bold text-slate-800 mb-4">Traffic Usage</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.trafficChart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => fmt(v)} />
              <Tooltip formatter={(v) => [fmt(v)]} />
              <Bar dataKey="up"   name="Upload"   fill="#06b6d4" radius={[3,3,0,0]} stackId="a" />
              <Bar dataKey="down" name="Download" fill="#6366f1" radius={[3,3,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
