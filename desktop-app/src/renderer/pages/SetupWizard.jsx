import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wifi, WifiOff, Radio, Network, ChevronRight, ChevronLeft,
  Check, Loader, Eye, EyeOff, RefreshCw, Signal, AlertTriangle
} from 'lucide-react'
import useAppStore from '../store/appStore'

const MODES = [
  {
    id: 'REPEATER',
    icon: Radio,
    title: 'Repeater Mode',
    desc: 'Connect to existing WiFi and rebroadcast it with extended range. Requires 2 WiFi adapters.',
    badge: 'Recommended',
    badgeColor: 'bg-brand-100 text-brand-700',
    color: 'from-brand-500 to-cyan-500',
  },
  {
    id: 'BRIDGE',
    icon: Network,
    title: 'Bridge Mode',
    desc: 'Connect via Ethernet cable upstream, broadcast WiFi downstream. Best performance.',
    badge: 'Best Speed',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'SHARING',
    icon: Wifi,
    title: 'Sharing Mode',
    desc: 'Share your existing internet connection as a hotspot. Works with 1 adapter.',
    badge: 'Simple',
    badgeColor: 'bg-slate-100 text-slate-600',
    color: 'from-slate-500 to-slate-600',
  },
]

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            i < current ? 'bg-brand-600 text-white'
            : i === current ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400'
            : 'bg-slate-100 text-slate-400'
          }`}>
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 rounded-full transition-all duration-300 ${i < current ? 'bg-brand-500' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function SetupWizard({ onComplete }) {
  const { setExtenderConfig } = useAppStore()
  const [step,          setStep]          = useState(0)
  const [mode,          setMode]          = useState('SHARING')
  const [networks,      setNetworks]      = useState([])
  const [adapters,      setAdapters]      = useState([])
  const [scanning,      setScanning]      = useState(false)
  const [selectedNet,   setSelectedNet]   = useState(null)
  const [upstreamPass,  setUpstreamPass]  = useState('')
  const [showPass,      setShowPass]      = useState(false)
  const [connecting,    setConnecting]    = useState(false)
  const [connectResult, setConnectResult] = useState(null)
  const [hotspotSsid,   setHotspotSsid]  = useState('MyExtender')
  const [hotspotPass,   setHotspotPass]  = useState('password123')
  const [upstreamAdapter, setUpstreamAdapter] = useState('')
  const [hotspotAdapter,  setHotspotAdapter]  = useState('')
  const [icsResult,     setIcsResult]     = useState(null)
  const [finishing,     setFinishing]     = useState(false)

  const totalSteps = mode === 'SHARING' ? 3 : 4

  // Step 1: scan networks when entering repeater mode
  useEffect(() => {
    if (step === 1 && mode === 'REPEATER') scanNetworks()
    if (step === 1 && mode !== 'SHARING') loadAdapters()
  }, [step, mode])

  const scanNetworks = async () => {
    setScanning(true)
    const nets = await window.electron.wifi.scan()
    setNetworks(nets.sort((a, b) => b.signal - a.signal))
    setScanning(false)
  }

  const loadAdapters = async () => {
    const ads = await window.electron.wifi.adapters()
    setAdapters(ads)
    if (ads.length > 0) setUpstreamAdapter(ads[0].name)
    if (ads.length > 1) setHotspotAdapter(ads[1].name)
  }

  const connectUpstream = async () => {
    if (!selectedNet) return
    setConnecting(true)
    setConnectResult(null)
    const result = await window.electron.wifi.connectUpstream({
      ssid:    selectedNet.ssid,
      password: upstreamPass,
      adapter: upstreamAdapter,
    })
    setConnectResult(result)
    setConnecting(false)
  }

  const finish = async () => {
    setFinishing(true)
    const config = {
      mode,
      upstreamSsid:    selectedNet?.ssid || '',
      upstreamAdapter,
      hotspotAdapter,
      icsEnabled:      false,
    }

    // Enable ICS for repeater/bridge mode
    if (mode === 'REPEATER' || mode === 'BRIDGE') {
      const ics = await window.electron.ics.enable({ upstreamAdapter, hotspotAdapter })
      config.icsEnabled = ics.success
      setIcsResult(ics)
    }

    await window.electron.extender.saveConfig(config)
    await window.electron.store.set('hotspot', { ssid: hotspotSsid, password: hotspotPass })
    await window.electron.store.set('setupComplete', true)

    setFinishing(false)
    onComplete({ mode, hotspotSsid, hotspotPass, ...config })
  }

  const canProceed = () => {
    if (step === 0) return !!mode
    if (step === 1 && mode === 'REPEATER') return connectResult?.success
    if (step === 1 && mode === 'BRIDGE')   return !!upstreamAdapter && !!hotspotAdapter
    if (step === (mode === 'SHARING' ? 1 : 2)) return hotspotSsid.length >= 1 && hotspotPass.length >= 8
    return true
  }

  const nextStep = () => {
    if (mode === 'SHARING' && step === 0) { setStep(1); return }
    setStep(s => s + 1)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 px-6">
      <div className="w-full max-w-lg">

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-button">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">WiFiExtender Setup</h1>
          <p className="text-slate-500 text-sm mt-1">Configure your extender in a few steps</p>
        </div>

        <StepIndicator current={step} total={totalSteps} />

        <AnimatePresence mode="wait">

          {/* ── Step 0: Mode selection ── */}
          {step === 0 && (
            <motion.div key="step0"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h2 className="text-base font-bold text-slate-900 mb-4">Choose extender mode</h2>
              {MODES.map(m => (
                <motion.button key={m.id} whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(m.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    mode === m.id
                      ? 'border-brand-500 bg-brand-50 shadow-glow'
                      : 'border-slate-200 bg-white hover:border-brand-200'
                  }`}
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${m.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <m.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-slate-900 text-sm">{m.title}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.badgeColor}`}>{m.badge}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    mode === m.id ? 'border-brand-500 bg-brand-500' : 'border-slate-300'
                  }`}>
                    {mode === m.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ── Step 1: Upstream (Repeater) ── */}
          {step === 1 && mode === 'REPEATER' && (
            <motion.div key="step1r"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="card p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Select upstream WiFi</h2>
                <button onClick={scanNetworks} className="btn-ghost text-xs">
                  <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                  {scanning ? 'Scanning...' : 'Rescan'}
                </button>
              </div>

              {scanning ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {networks.map(net => (
                    <button key={net.ssid} onClick={() => setSelectedNet(net)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedNet?.ssid === net.ssid
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-slate-200 bg-white hover:border-brand-200'
                      }`}
                    >
                      <Wifi className={`w-4 h-4 flex-shrink-0 ${net.signal >= 60 ? 'text-emerald-500' : net.signal >= 30 ? 'text-amber-500' : 'text-red-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{net.ssid}</p>
                        <p className="text-xs text-slate-400">{net.auth}</p>
                      </div>
                      <span className={`text-xs font-semibold ${net.signal >= 60 ? 'text-emerald-600' : net.signal >= 30 ? 'text-amber-600' : 'text-red-500'}`}>
                        {net.signal}%
                      </span>
                    </button>
                  ))}
                  {networks.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-6">No networks found. Click Rescan.</p>
                  )}
                </div>
              )}

              {selectedNet && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-600">Password for <strong>{selectedNet.ssid}</strong></p>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input-field pr-10 text-sm"
                      placeholder="WiFi password" value={upstreamPass}
                      onChange={e => setUpstreamPass(e.target.value)} />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={connectUpstream} disabled={connecting || !upstreamPass}
                    className="btn-primary w-full text-sm py-2.5">
                    {connecting ? <><Loader className="w-4 h-4 animate-spin" /> Connecting...</> : 'Connect to Upstream'}
                  </button>
                  {connectResult && (
                    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${
                      connectResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {connectResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {connectResult.message || connectResult.error}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Step 1: Adapter selection (Bridge) ── */}
          {step === 1 && mode === 'BRIDGE' && (
            <motion.div key="step1b"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="card p-5 space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">Select network adapters</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Upstream adapter (Ethernet / WiFi connected to router)</label>
                <select className="input-field text-sm" value={upstreamAdapter} onChange={e => setUpstreamAdapter(e.target.value)}>
                  {adapters.map(a => <option key={a.name} value={a.name}>{a.name} {a.ssid ? `(${a.ssid})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Hotspot adapter (broadcasts extended WiFi)</label>
                <select className="input-field text-sm" value={hotspotAdapter} onChange={e => setHotspotAdapter(e.target.value)}>
                  {adapters.map(a => <option key={a.name} value={a.name}>{a.name} {a.ssid ? `(${a.ssid})` : ''}</option>)}
                </select>
              </div>
              {upstreamAdapter === hotspotAdapter && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  Upstream and hotspot adapters should be different for bridge mode.
                </div>
              )}
            </motion.div>
          )}

          {/* ── Hotspot config step ── */}
          {((mode === 'SHARING' && step === 1) || (mode !== 'SHARING' && step === 2)) && (
            <motion.div key="stepHotspot"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="card p-5 space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">Configure your hotspot</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Network name (SSID)</label>
                <input className="input-field text-sm" placeholder="MyExtender"
                  value={hotspotSsid} onChange={e => setHotspotSsid(e.target.value)} maxLength={32} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password (min 8 characters)</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input-field text-sm pr-10"
                    placeholder="Min 8 characters" value={hotspotPass}
                    onChange={e => setHotspotPass(e.target.value)} minLength={8} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 text-xs text-brand-700">
                <p className="font-semibold mb-1">Mode: {mode}</p>
                {mode === 'REPEATER' && <p>Upstream: <strong>{selectedNet?.ssid}</strong> → Extended as: <strong>{hotspotSsid}</strong></p>}
                {mode === 'BRIDGE'   && <p>Ethernet upstream → WiFi hotspot: <strong>{hotspotSsid}</strong></p>}
                {mode === 'SHARING'  && <p>Sharing internet connection as: <strong>{hotspotSsid}</strong></p>}
              </div>
            </motion.div>
          )}

          {/* ── Final confirm step ── */}
          {step === totalSteps - 1 && (
            <motion.div key="stepFinal"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="card p-5 space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900">Ready to start</h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Mode',     value: mode },
                  { label: 'SSID',     value: hotspotSsid },
                  { label: 'Password', value: '••••••••' },
                  mode !== 'SHARING' && { label: 'Upstream', value: selectedNet?.ssid || upstreamAdapter },
                  mode !== 'SHARING' && { label: 'ICS Bridge', value: 'Will be enabled automatically' },
                ].filter(Boolean).map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
              {icsResult && !icsResult.success && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  ICS setup failed — hotspot will work in sharing mode. Run as Administrator for full repeater functionality.
                </div>
              )}
              <button onClick={finish} disabled={finishing} className="btn-primary w-full py-3">
                {finishing
                  ? <><Loader className="w-4 h-4 animate-spin" /> Setting up...</>
                  : <><Check className="w-4 h-4" /> Complete Setup & Start</>
                }
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : null}
            disabled={step === 0}
            className="btn-ghost text-sm disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step < totalSteps - 1 && (
            <button onClick={nextStep} disabled={!canProceed()} className="btn-primary text-sm py-2.5 px-6 disabled:opacity-40">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
