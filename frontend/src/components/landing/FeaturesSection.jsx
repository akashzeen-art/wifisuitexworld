import { motion } from 'framer-motion'
import { Wifi, Shield, Activity, Monitor, Zap, Lock, BarChart2, Smartphone, Globe, Bell, RefreshCw, Layers } from 'lucide-react'
import { FadeUp, StaggerContainer, StaggerItem } from '../ui/Motion'

const features = [
  { icon: Wifi,       title: 'One-Click Hotspot',    desc: 'Start sharing your internet in seconds. Configure SSID and password, then go live instantly.',          color: 'from-brand-500 to-brand-600',     glow: 'rgba(59,110,245,0.15)'   },
  { icon: Monitor,    title: 'Device Dashboard',      desc: 'See every connected device in real time — names, MAC addresses, IP, and live bandwidth.',              color: 'from-cyan-500 to-cyan-600',       glow: 'rgba(6,182,212,0.15)'    },
  { icon: Shield,     title: 'Block Intruders',        desc: 'Instantly block any device from your network with a single click. No technical knowledge needed.',     color: 'from-violet-500 to-violet-600',   glow: 'rgba(139,92,246,0.15)'   },
  { icon: BarChart2,  title: 'Bandwidth Monitor',     desc: 'Track data usage per device. See upload and download stats updated in real time.',                      color: 'from-emerald-500 to-emerald-600', glow: 'rgba(16,185,129,0.15)'   },
  { icon: Lock,       title: 'License System',        desc: 'Secure license key activation. Each subscription generates a unique key tied to your account.',        color: 'from-amber-500 to-amber-600',     glow: 'rgba(245,158,11,0.15)'   },
  { icon: Zap,        title: 'Instant Setup',         desc: "Download the app, enter your license key, and you're live in under 60 seconds.",                       color: 'from-rose-500 to-rose-600',       glow: 'rgba(244,63,94,0.15)'    },
  { icon: Activity,   title: 'Live Status',           desc: 'Real-time connection indicators, uptime tracking, and instant alerts when devices connect.',            color: 'from-indigo-500 to-indigo-600',   glow: 'rgba(99,102,241,0.15)'   },
  { icon: Globe,      title: 'Web Dashboard',         desc: 'Manage everything from your browser. No app required for monitoring — works on any device.',           color: 'from-teal-500 to-teal-600',       glow: 'rgba(20,184,166,0.15)'   },
  { icon: Bell,       title: 'Smart Alerts',          desc: 'Get notified when new devices connect, when bandwidth spikes, or when your license is about to expire.', color: 'from-orange-500 to-orange-600',   glow: 'rgba(249,115,22,0.15)'   },
  { icon: RefreshCw,  title: 'Auto Refresh',          desc: 'Device list and bandwidth stats refresh automatically every 10 seconds — always up to date.',           color: 'from-sky-500 to-sky-600',         glow: 'rgba(14,165,233,0.15)'   },
  { icon: Smartphone, title: 'Multi-Device',          desc: 'Connect phones, tablets, smart TVs, and laptops simultaneously based on your plan.',                   color: 'from-pink-500 to-pink-600',       glow: 'rgba(236,72,153,0.15)'   },
  { icon: Layers,     title: 'Multi-Plan',            desc: 'Starter, Pro, and Business plans. Upgrade or downgrade at any time from your dashboard.',              color: 'from-slate-600 to-slate-700',     glow: 'rgba(71,85,105,0.15)'    },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="section bg-white">
      <div className="container-lg">
        <FadeUp className="text-center mb-16">
          <span className="badge-blue text-xs mb-4 inline-flex">Features</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
            Everything you need to<br />
            <span className="gradient-text">share internet</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            A complete platform for managing your WiFi hotspot — from setup to monitoring to security.
          </p>
        </FadeUp>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" stagger={0.05}>
          {features.map(({ icon: Icon, title, desc, color, glow }) => (
            <StaggerItem key={title}>
              <motion.div
                whileHover={{ y: -4, boxShadow: `0 20px 40px ${glow}` }}
                transition={{ duration: 0.25 }}
                className="group bg-white border border-slate-100 rounded-3xl p-6 h-full cursor-default shadow-card hover:border-slate-200 transition-colors duration-200"
              >
                <motion.div
                  className={`w-11 h-11 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </motion.div>
                <h3 className="font-semibold text-slate-900 mb-2 text-[15px]">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
