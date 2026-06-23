import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { FadeUp } from '../ui/Motion'

const faqs = [
  {
    q: 'What is WiFiExtender and how does it work?',
    a: 'WiFiExtender turns your Windows PC or Android phone into a WiFi hotspot. Download the app, sign in, activate your license, and share your internet — manage everything from the web dashboard.',
  },
  {
    q: 'Do I need any special hardware?',
    a: 'No extra hardware. You need a Windows 10/11 laptop or an Android 8+ phone with hotspot support. On Windows, the app uses built-in WiFi tools — no router required.',
  },
  {
    q: 'Is my hotspot connection secure?',
    a: 'Yes. Your hotspot uses WPA2 encryption with a password you choose. Use a strong password and block unknown devices from your dashboard anytime.',
  },
  {
    q: 'What happens when my subscription expires?',
    a: 'Your license stops working and the hotspot won’t start until you renew. Your account and device history stay saved — renew anytime from the dashboard.',
  },
  {
    q: 'Can I use WiFiExtender on Android and Windows?',
    a: 'Yes. Download the Android APK or Windows EXE from our Download page. Use the same account and license key on either platform.',
  },
  {
    q: 'How do I manage connected devices?',
    a: 'Open your web dashboard to see every device in real time. Block unknown devices, track bandwidth, and monitor hotspot status from any browser.',
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
          <p className="text-lg text-slate-500">Quick answers to get you started.</p>
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
