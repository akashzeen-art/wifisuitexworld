import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { FadeUp } from '../ui/Motion'

const faqs = [
  {
    q: 'What is WiFiExtender and how does it work?',
    a: 'WiFiExtender is a SaaS platform that turns your Windows laptop into a WiFi hotspot. You download our desktop app, activate your license key, and start sharing your internet connection with other devices — all managed from a beautiful web dashboard.',
  },
  {
    q: 'Do I need any special hardware?',
    a: 'No special hardware required. You just need a Windows 10 or 11 laptop with a WiFi adapter that supports hosted network mode (most modern laptops do). The app uses built-in Windows netsh commands under the hood.',
  },
  {
    q: 'How many devices can connect to my hotspot?',
    a: 'It depends on your plan. Starter allows 3 devices, Pro allows 10, and Business allows up to 25 simultaneous connections. You can upgrade your plan at any time from the dashboard.',
  },
  {
    q: 'Can I block specific devices from my hotspot?',
    a: 'Yes. From the Devices page in your dashboard or the desktop app, you can block any connected device with a single click. Blocked devices are immediately disconnected and cannot reconnect until you unblock them.',
  },
  {
    q: 'Is my hotspot connection secure?',
    a: 'Yes. WiFiExtender uses WPA2 encryption for your hotspot. You set your own password during configuration. We recommend using a strong, unique password for your hotspot network.',
  },
  {
    q: 'What happens when my subscription expires?',
    a: 'When your subscription expires, your license key becomes invalid and the desktop app will stop allowing new hotspot sessions. Your account and data remain intact. You can renew or upgrade your plan at any time.',
  },
  {
    q: 'Can I use WiFiExtender on multiple laptops?',
    a: 'Each license key is tied to one active session at a time. If you need to use it on multiple machines simultaneously, you\'ll need separate subscriptions. Contact us for team or enterprise pricing.',
  },
]

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white hover:border-brand-100 transition-colors duration-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
      >
        <span className="font-semibold text-slate-900 text-[15px]">{q}</span>
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${isOpen ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-6 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-50 pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqSection() {
  const [open, setOpen] = useState(0)

  return (
    <section className="section bg-surface-50">
      <div className="container-md">
        <FadeUp className="text-center mb-12">
          <span className="badge-blue text-xs mb-4 inline-flex">FAQ</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Common <span className="gradient-text">questions</span>
          </h2>
          <p className="text-lg text-slate-500">Everything you need to know about WiFiExtender.</p>
        </FadeUp>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
