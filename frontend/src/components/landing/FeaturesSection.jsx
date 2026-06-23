import { motion } from 'framer-motion'
import { Wifi, Shield, Monitor, BarChart2, Zap, Globe } from 'lucide-react'
import { FadeUp, StaggerContainer, StaggerItem } from '../ui/Motion'

const features = [
  { icon: Wifi,      title: 'One-Click Hotspot',   desc: 'Start sharing your internet in seconds. Configure SSID and password, then go live instantly.',          color: 'from-brand-500 to-brand-600',     glow: 'rgba(16,185,129,0.15)'   },
  { icon: Monitor,   title: 'Device Dashboard',   desc: 'See every connected device in real time — names, MAC addresses, IP, and live bandwidth.',              color: 'from-cyan-500 to-cyan-600',       glow: 'rgba(6,182,212,0.15)'    },
  { icon: Shield,    title: 'Block Intruders',     desc: 'Instantly block any device from your network with a single click. No technical knowledge needed.',     color: 'from-violet-500 to-violet-600',   glow: 'rgba(139,92,246,0.15)'   },
  { icon: BarChart2, title: 'Bandwidth Monitor',  desc: 'Track data usage per device. See upload and download stats updated in real time.',                      color: 'from-emerald-500 to-emerald-600', glow: 'rgba(16,185,129,0.15)'   },
  { icon: Zap,       title: 'Instant Setup',      desc: "Download the app, enter your license key, and you're live in under 60 seconds.",                       color: 'from-rose-500 to-rose-600',       glow: 'rgba(244,63,94,0.15)'    },
  { icon: Globe,     title: 'Web Dashboard',      desc: 'Manage everything from your browser. No app required for monitoring — works on any device.',           color: 'from-teal-500 to-teal-600',       glow: 'rgba(20,184,166,0.15)'   },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="section bg-white">
      <div className="container-lg">
        <FadeUp className="text-center mb-12">
          <span className="badge-blue text-xs mb-4 inline-flex">Features</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
            Everything you need to<br />
            <span className="gradient-text">share internet</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            A complete platform for managing your WiFi hotspot — from setup to monitoring to security.
          </p>
        </FadeUp>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto" stagger={0.05}>
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
