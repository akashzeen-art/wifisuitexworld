import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'

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
      {Math.round(display).toLocaleString()}{suffix}
    </span>
  )
}

function CountUp({ target, suffix = '', duration = 2 }) {
  return <AnimatedNumber target={target} duration={duration} suffix={suffix} />
}

const stats = [
  { value: 50000, suffix: '+',  label: 'Active users',       sub: 'Across 80+ countries',    color: 'from-brand-500 to-brand-600'   },
  { value: 99.9,  suffix: '%',  label: 'Uptime SLA',         sub: 'Guaranteed reliability',  color: 'from-cyan-500 to-cyan-600'     },
  { value: 2,     suffix: 'M+', label: 'Devices managed',    sub: 'And growing every day',   color: 'from-violet-500 to-violet-600' },
  { value: 60,    suffix: 's',  label: 'Avg setup time',     sub: 'From download to live',   color: 'from-emerald-500 to-emerald-600' },
]

export default function StatsSection() {
  return (
    <section className="py-16 px-6 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className={`text-4xl md:text-5xl font-extrabold bg-gradient-to-r ${s.color} bg-clip-text text-transparent mb-1 tabular-nums`}>
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
