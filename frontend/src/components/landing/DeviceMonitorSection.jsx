import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Smartphone, Laptop, Tv, Ban, Wifi, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'
import { FadeUp, SlideIn } from '../ui/Motion'

const initialDevices = [
  { id: 1, name: "John's iPhone 14",  type: 'phone',  mac: 'A4:C3:F0:85:AC:C1', ip: '192.168.137.2', down: 12.4, up: 3.1,  blocked: false, signal: 92 },
  { id: 2, name: 'MacBook Pro M3',    type: 'laptop', mac: 'B8:27:EB:12:34:56', ip: '192.168.137.3', down: 8.1,  up: 1.8,  blocked: false, signal: 88 },
  { id: 3, name: 'Samsung Smart TV',  type: 'tv',     mac: 'DC:A6:32:AB:CD:EF', ip: '192.168.137.4', down: 4.2,  up: 0.4,  blocked: false, signal: 74 },
  { id: 4, name: "Sarah's Android",   type: 'phone',  mac: 'F0:18:98:45:67:89', ip: '192.168.137.5', down: 6.7,  up: 2.2,  blocked: false, signal: 81 },
  { id: 5, name: 'Dell XPS 15',       type: 'laptop', mac: '3C:22:FB:78:90:AB', ip: '192.168.137.6', down: 15.3, up: 4.5,  blocked: true,  signal: 65 },
]

const DeviceIcon = ({ type, blocked }) => {
  const Icon = type === 'phone' ? Smartphone : type === 'laptop' ? Laptop : Tv
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${blocked ? 'bg-red-50' : 'bg-brand-50'}`}>
      <Icon className={`w-4.5 h-4.5 ${blocked ? 'text-red-400' : 'text-brand-500'}`} />
    </div>
  )
}

function SignalBars({ strength }) {
  const bars = [25, 50, 75, 100]
  return (
    <div className="flex items-end gap-0.5 h-4">
      {bars.map((threshold, i) => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-colors duration-300 ${strength >= threshold ? 'bg-emerald-400' : 'bg-slate-200'}`}
          style={{ height: `${(i + 1) * 25}%` }}
        />
      ))}
    </div>
  )
}

export default function DeviceMonitorSection() {
  const [devices, setDevices] = useState(initialDevices)
  const [refreshing, setRefreshing] = useState(false)
  const [newDevice, setNewDevice] = useState(false)

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(d => ({
        ...d,
        down: d.blocked ? 0 : parseFloat((d.down + (Math.random() - 0.5) * 2).toFixed(1)),
        up:   d.blocked ? 0 : parseFloat((d.up   + (Math.random() - 0.5) * 0.5).toFixed(1)),
      })))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Simulate new device joining
  useEffect(() => {
    const t = setTimeout(() => setNewDevice(true), 4000)
    return () => clearTimeout(t)
  }, [])

  const handleBlock = (id) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, blocked: !d.blocked } : d))
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }

  const connected = devices.filter(d => !d.blocked).length

  return (
    <section className="section bg-white overflow-hidden">
      <div className="container-lg px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — copy */}
          <SlideIn className="px-1 sm:px-0">
            <span className="badge-blue text-xs mb-4 inline-flex">Device Monitoring</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5 leading-tight">
              See every device.<br />
              <span className="gradient-text">Block in one click.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-500 leading-relaxed mb-8">
              Real-time visibility into every device on your hotspot. Monitor bandwidth usage, see connection strength, and instantly block any device that shouldn't be there.
            </p>

            <div className="space-y-4">
              {[
                { icon: Monitor,    color: 'bg-brand-50 text-brand-600',   title: 'Live device list',       desc: 'Auto-refreshes every 10 seconds with current connection data.' },
                { icon: Ban,        color: 'bg-red-50 text-red-500',       title: 'One-click blocking',     desc: 'Block or unblock any device instantly from the dashboard.' },
                { icon: ArrowDownRight, color: 'bg-cyan-50 text-cyan-600', title: 'Per-device bandwidth',   desc: 'See exactly how much data each device is using in real time.' },
              ].map(({ icon: Icon, color, title, desc }) => (
                <motion.div
                  key={title}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors duration-150 cursor-default"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </SlideIn>

          {/* Right — live device panel */}
          <FadeUp delay={0.15} className="w-full px-2 sm:px-4 lg:px-0">
            <div className="bg-white border border-slate-100 rounded-3xl shadow-glass-lg overflow-hidden w-full max-w-lg mx-auto lg:max-w-none">
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-emerald-400"
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-xs font-bold text-slate-700">Live Devices</span>
                  </div>
                  <span className="badge-green text-xs">{connected} connected</span>
                </div>
                <button
                  onClick={handleRefresh}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Device rows */}
              <div className="divide-y divide-slate-50">
                <AnimatePresence>
                  {devices.map((device, i) => (
                    <motion.div
                      key={device.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/60 transition-colors duration-100 ${device.blocked ? 'opacity-60' : ''}`}
                    >
                      <DeviceIcon type={device.type} blocked={device.blocked} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">{device.name}</p>
                          {device.blocked && <span className="badge-red text-[10px] flex-shrink-0">Blocked</span>}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{device.ip}</p>
                      </div>

                      <div className="hidden sm:block shrink-0">
                        <SignalBars strength={device.signal} />
                      </div>

                      {/* Bandwidth */}
                      {!device.blocked && (
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1 text-[11px] text-brand-600 font-semibold">
                            <ArrowDownRight className="w-3 h-3" />
                            <motion.span
                              key={device.down}
                              initial={{ opacity: 0.5 }}
                              animate={{ opacity: 1 }}
                            >
                              {device.down}
                            </motion.span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-cyan-500 font-semibold">
                            <ArrowUpRight className="w-3 h-3" />
                            {device.up}
                          </div>
                        </div>
                      )}

                      {/* Block button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleBlock(device.id)}
                        className={`flex-shrink-0 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
                          device.blocked
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-500 hover:bg-red-100'
                        }`}
                      >
                        <Ban className="w-3 h-3" />
                        <span className="hidden min-[400px]:inline">{device.blocked ? 'Unblock' : 'Block'}</span>
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* New device joining notification */}
                <AnimatePresence>
                  {newDevice && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 sm:px-5 py-3 bg-brand-50/60 border-t border-brand-100"
                    >
                      <div className="flex items-center gap-2 text-xs text-brand-700">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-brand-400"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <Wifi className="w-3.5 h-3.5" />
                        <span className="font-semibold">New device connecting...</span>
                        <span className="text-brand-500">iPad Pro</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-5 py-3 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400">Auto-refreshes every 10s</span>
                <span className="text-xs font-semibold text-brand-600">{devices.length} total devices</span>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
