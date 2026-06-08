import { motion } from 'framer-motion'
import { UserPlus, CreditCard, Download, Wifi, ChevronRight } from 'lucide-react'
import { FadeUp, StaggerContainer, StaggerItem } from '../ui/Motion'

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create your account',
    desc: 'Sign up in seconds. No credit card required for the free trial. Just your email and a password.',
    color: 'from-brand-500 to-brand-600',
    connector: true,
  },
  {
    icon: CreditCard,
    step: '02',
    title: 'Choose a plan',
    desc: 'Pick Starter, Pro, or Business. Get your unique license key instantly after purchase.',
    color: 'from-cyan-500 to-cyan-600',
    connector: true,
  },
  {
    icon: Download,
    step: '03',
    title: 'Download the app',
    desc: 'Download the Windows desktop app. Install it and sign in with your account credentials.',
    color: 'from-violet-500 to-violet-600',
    connector: true,
  },
  {
    icon: Wifi,
    step: '04',
    title: 'Start your hotspot',
    desc: 'Enter your license key, set your SSID and password, and click Start. You\'re live in seconds.',
    color: 'from-emerald-500 to-emerald-600',
    connector: false,
  },
]

/* Animated step connector */
function Connector({ delay }) {
  return (
    <div className="hidden lg:flex items-center justify-center flex-1 px-2 mt-8">
      <div className="relative w-full h-px bg-slate-200 overflow-visible">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-400 to-cyan-400 h-px"
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full bg-cyan-400"
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
        <FadeUp className="text-center mb-16">
          <span className="badge-cyan text-xs mb-4 inline-flex">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
            Up and running in{' '}
            <span className="gradient-text">4 simple steps</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-lg mx-auto">
            From sign-up to live hotspot in under 60 seconds. No technical knowledge required.
          </p>
        </FadeUp>

        {/* Steps row */}
        <div className="flex flex-col lg:flex-row items-start gap-0">
          {steps.map((step, i) => (
            <div key={step.step} className="flex lg:flex-col items-start lg:items-center flex-1 gap-4 lg:gap-0 mb-8 lg:mb-0">
              <StaggerItem>
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="flex flex-col items-center text-center w-full"
                >
                  {/* Icon */}
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center shadow-button mb-5 relative`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.15, type: 'spring', stiffness: 200 }}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                    {/* Step number badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-slate-100 flex items-center justify-center shadow-sm">
                      <span className="text-[10px] font-extrabold text-slate-700">{i + 1}</span>
                    </div>
                  </motion.div>

                  <h3 className="font-bold text-slate-900 text-[15px] mb-2 px-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed px-4 max-w-[200px]">{step.desc}</p>
                </motion.div>
              </StaggerItem>

              {/* Connector between steps */}
              {step.connector && <Connector delay={0.4 + i * 0.2} />}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <FadeUp delay={0.4} className="text-center mt-14">
          <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-card">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-600">
              Average setup time: <span className="font-bold text-slate-900">47 seconds</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
