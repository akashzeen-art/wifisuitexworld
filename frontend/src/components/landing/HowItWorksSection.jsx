import { motion } from 'framer-motion'
import { UserPlus, CreditCard, Download, Wifi, ChevronRight } from 'lucide-react'
import { FadeUp } from '../ui/Motion'

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create your account',
    desc: 'Sign up in seconds. No credit card required for the free trial.',
    color: 'from-brand-500 to-brand-600',
    connector: true,
  },
  {
    icon: CreditCard,
    step: '02',
    title: 'Choose your plan',
    desc: 'One simple monthly plan with unlimited devices and instant license key.',
    color: 'from-teal-500 to-emerald-600',
    connector: true,
  },
  {
    icon: Download,
    step: '03',
    title: 'Download the app',
    desc: 'Get WiFiExtender for Android or Windows. Install and sign in.',
    color: 'from-emerald-500 to-teal-600',
    connector: true,
  },
  {
    icon: Wifi,
    step: '04',
    title: 'Start your hotspot',
    desc: 'Enter your license key, set SSID and password, and go live.',
    color: 'from-emerald-500 to-emerald-600',
    connector: false,
  },
]

function Connector({ delay }) {
  return (
    <div className="hidden lg:flex items-center justify-center flex-1 px-2 mt-8">
      <div className="relative w-full h-px bg-slate-200 overflow-visible">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-400 to-teal-400 h-px"
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full bg-teal-400"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: delay + 0.8 }}
        />
      </div>
    </div>
  )
}

export default function HowItWorksSection() {
  return (
    <section className="section bg-surface-50">
      <div className="container-lg">
        <FadeUp className="text-center mb-10 sm:mb-16">
          <span className="badge-cyan text-xs mb-4 inline-flex">How It Works</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
            Up and running in{' '}
            <span className="gradient-text">4 simple steps</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-500 max-w-lg mx-auto px-2">
            From sign-up to live hotspot in under 60 seconds. No technical knowledge required.
          </p>
        </FadeUp>

        {/* Mobile: 2×2 grid · Desktop: horizontal row */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:flex lg:flex-row lg:items-start lg:gap-0">
          {steps.map((step, i) => (
            <div
              key={step.step}
              className="flex flex-col lg:flex-1 lg:flex-row lg:items-start"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex flex-col items-center text-center w-full h-full bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-card lg:bg-transparent lg:border-0 lg:shadow-none lg:rounded-none lg:p-0"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <motion.div
                  className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${step.color} rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-button mb-3 sm:mb-5 relative`}
                >
                  <step.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full border-2 border-slate-100 flex items-center justify-center shadow-sm">
                    <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-700">{i + 1}</span>
                  </div>
                </motion.div>

                <h3 className="font-bold text-slate-900 text-xs sm:text-[15px] mb-1.5 sm:mb-2 leading-snug px-1">
                  {step.title}
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-500 leading-relaxed px-0.5 sm:px-4 lg:max-w-[200px]">
                  {step.desc}
                </p>
              </motion.div>

              {step.connector && <Connector delay={0.4 + i * 0.2} />}
            </div>
          ))}
        </div>

        <FadeUp delay={0.4} className="text-center mt-10 sm:mt-14">
          <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 shadow-card mx-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm text-slate-600">
              Average setup time: <span className="font-bold text-slate-900">47 seconds</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
