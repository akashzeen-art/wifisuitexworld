import { motion } from 'framer-motion'
import { Download, Monitor, Key, Wifi, Shield, Check } from 'lucide-react'
import AndroidDownloadButton from '../components/ui/AndroidDownloadButton'
import WindowsDownloadButton from '../components/ui/WindowsDownloadButton'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { FadeUp, StaggerContainer, StaggerItem } from '../components/ui/Motion'

const steps = [
  { icon: Download, step: '01', title: 'Download the app', desc: 'Get the Android or Windows app using the buttons below.' },
  { icon: Key,      step: '02', title: 'Activate your license', desc: 'Open the app, sign in with your account, and enter your license key from the dashboard.' },
  { icon: Wifi,     step: '03', title: 'Start your hotspot', desc: 'Set your SSID and password, then click Start Hotspot. You\'re live in seconds.' },
  { icon: Monitor,  step: '04', title: 'Monitor devices', desc: 'Connected devices appear in real time. Block, monitor bandwidth, and stay in control.' },
]

const requirements = [
  'Windows 10 (version 1903+) or Windows 11',
  'WiFi adapter with hosted network support',
  'Administrator privileges (for netsh commands)',
  'Active internet connection',
  'Active WiFiExtender subscription',
]

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-hero-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <FadeUp>
            <span className="badge-blue text-xs mb-4 inline-flex">Mobile &amp; Desktop</span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
              Download <span className="gradient-text">WiFiExtender</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10">
              Choose your platform — Android phone or Windows PC — and start extending your WiFi in minutes.
            </p>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <AndroidDownloadButton variant="card" />
              <WindowsDownloadButton variant="card" />
            </div>

            <p className="text-xs text-slate-400 mt-6">Free with any active WiFiExtender subscription</p>
          </FadeUp>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Up and running in <span className="gradient-text">4 steps</span>
            </h2>
            <p className="text-slate-500">From download to live hotspot in under 60 seconds.</p>
          </FadeUp>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5" stagger={0.1}>
            {steps.map(({ icon: Icon, step, title, desc }) => (
              <StaggerItem key={step}>
                <div className="glass-card p-6 h-full relative overflow-hidden group">
                  <div className="absolute top-4 right-4 text-5xl font-black text-slate-100 group-hover:text-brand-100 transition-colors duration-300 leading-none select-none">
                    {step}
                  </div>
                  <div className="w-11 h-11 bg-gradient-to-br from-brand-600 to-signal-500 rounded-2xl flex items-center justify-center mb-4 shadow-button relative z-10">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 text-[15px] relative z-10">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed relative z-10">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Requirements + Security */}
      <section className="py-16 px-6 bg-surface-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <FadeUp>
            <div className="glass-card p-8 h-full">
              <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center mb-5">
                <Monitor className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">System Requirements</h3>
              <ul className="space-y-3">
                {requirements.map(r => (
                  <li key={r} className="flex items-start gap-3 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="glass-card p-8 h-full">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Safe &amp; Secure</h3>
              <div className="space-y-4">
                {[
                  { title: 'Code signed', desc: 'The installer is digitally signed and verified.' },
                  { title: 'No background services', desc: 'The app only runs when you open it. No hidden processes.' },
                  { title: 'WPA2 encryption', desc: 'Your hotspot uses WPA2 encryption by default.' },
                  { title: 'Open netsh commands', desc: 'Uses standard Windows netsh — no kernel drivers or exploits.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </div>
  )
}
