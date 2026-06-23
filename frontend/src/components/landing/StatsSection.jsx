import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Wifi, Shield, Zap, Users } from 'lucide-react'

function AnimatedNumber({ target, duration, suffix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const steps = 60
    const increment = target / steps
    const interval = (duration * 1000) / steps
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setDisplay(target); clearInterval(timer) }
      else setDisplay(start)
    }, interval)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return (
    <span ref={ref}>
      {target % 1 !== 0 ? display.toFixed(1) : Math.round(display).toLocaleString()}{suffix}
    </span>
  )
}

function CountUp({ target, suffix = '', duration = 2 }) {
  return <AnimatedNumber target={target} duration={duration} suffix={suffix} />
}

const stats = [
  { value: 50000, suffix: '+',  label: 'Active users',       sub: 'Worldwide',              icon: Users, color: 'from-brand-500 to-brand-600'   },
  { value: 99.9,  suffix: '%',  label: 'Uptime SLA',         sub: 'Reliable hotspots',      icon: Shield, color: 'from-emerald-500 to-teal-600' },
  { value: 2,     suffix: 'M+', label: 'Devices managed',    sub: 'Connected daily',        icon: Wifi, color: 'from-teal-500 to-emerald-600' },
  { value: 60,    suffix: 's',  label: 'Avg setup time',     sub: 'Download to live',       icon: Zap, color: 'from-brand-600 to-teal-500'   },
]

export default function StatsSection() {
  return (
    <section className="py-14 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-50/50 via-white to-teal-50/50" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-200/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-200/60 to-transparent" />

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass-card p-5 text-center group hover:border-brand-200/80"
            >
              <div className={`w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className={`text-3xl md:text-4xl font-extrabold bg-gradient-to-r ${s.color} bg-clip-text text-transparent mb-1 tabular-nums`}>
                <CountUp target={s.value} suffix={s.suffix} duration={1.8 + i * 0.2} />
              </div>
              <p className="font-semibold text-slate-800 text-sm mb-0.5">{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
