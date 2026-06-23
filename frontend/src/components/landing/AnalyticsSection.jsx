import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { FadeUp, SlideIn } from '../ui/Motion'

const bandwidthData = [
  { time: '00:00', down: 18, up: 8  },
  { time: '02:00', down: 12, up: 5  },
  { time: '04:00', down: 8,  up: 3  },
  { time: '06:00', down: 22, up: 10 },
  { time: '08:00', down: 65, up: 28 },
  { time: '10:00', down: 88, up: 35 },
  { time: '12:00', down: 94, up: 42 },
  { time: '14:00', down: 78, up: 31 },
  { time: '16:00', down: 85, up: 38 },
  { time: '18:00', down: 72, up: 29 },
  { time: '20:00', down: 60, up: 24 },
  { time: '22:00', down: 45, up: 18 },
]

const deviceUsage = [
  { name: "iPhone",   usage: 42 },
  { name: "MacBook",  usage: 78 },
  { name: "Smart TV", usage: 31 },
  { name: "Android",  usage: 55 },
  { name: "Dell XPS", usage: 89 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-glass text-xs">
      <p className="font-semibold text-slate-600 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value} Mbps</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsSection() {
  return (
    <section className="section bg-surface-50 overflow-hidden">
      <div className="container-lg">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — charts */}
          <FadeUp>
            <div className="space-y-4">
              {/* Bandwidth chart */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Bandwidth Usage</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Last 24 hours</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" /> Download
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" /> Upload
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={bandwidthData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gDown" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="down" stroke="#10b981" strokeWidth={2} fill="url(#gDown)" dot={false} />
                    <Area type="monotone" dataKey="up"   stroke="#14b8a6" strokeWidth={2} fill="url(#gUp)"   dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Device usage bar chart */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Per-Device Usage</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Today's data consumption</p>
                  </div>
                  <span className="badge-blue text-xs">5 devices</span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={deviceUsage} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(v) => [`${v} MB`, 'Usage']}
                    />
                    <Bar dataKey="usage" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mini stat row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Peak Speed',   value: '94.2 Mbps', icon: ArrowDownRight, color: 'text-brand-600',   bg: 'bg-brand-50'   },
                  { label: 'Avg Upload',   value: '24.8 Mbps', icon: ArrowUpRight,   color: 'text-teal-600',    bg: 'bg-teal-50'    },
                  { label: 'Total Today',  value: '18.4 GB',   icon: Activity,       color: 'text-emerald-600',  bg: 'bg-emerald-50'  },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-card">
                    <div className={`w-7 h-7 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                      <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                    </div>
                    <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Right — copy */}
          <SlideIn delay={0.1}>
            <span className="badge-blue text-xs mb-4 inline-flex">Analytics</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5 leading-tight">
              Full visibility into<br />
              <span className="gradient-text">your network</span>
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Beautiful real-time charts show you exactly how your bandwidth is being used — per device, per hour, and in total. Make informed decisions about who gets priority.
            </p>

            <div className="space-y-5">
              {[
                { title: 'Real-time bandwidth charts',  desc: 'Live area charts update every few seconds with download and upload speeds.',       color: 'from-brand-500 to-brand-600'   },
                { title: 'Per-device breakdown',        desc: 'See exactly how much data each connected device is consuming.',                    color: 'from-teal-500 to-emerald-600'     },
                { title: '24-hour history',             desc: 'Review bandwidth patterns over the last 24 hours to spot usage spikes.',          color: 'from-emerald-500 to-teal-600' },
              ].map(({ title, desc, color }) => (
                <motion.div
                  key={title}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-1 h-12 bg-gradient-to-b ${color} rounded-full flex-shrink-0 mt-1`} />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-1">{title}</p>
                    <p className="text-sm text-slate-500">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="mt-8 inline-flex items-center gap-3 bg-gradient-to-r from-brand-50 to-teal-50 border border-brand-100 rounded-2xl px-5 py-4"
            >
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <div>
                <p className="text-sm font-bold text-slate-900">Average bandwidth saved</p>
                <p className="text-xs text-slate-500">Users report 40% better network performance after blocking idle devices</p>
              </div>
            </motion.div>
          </SlideIn>
        </div>
      </div>
    </section>
  )
}
