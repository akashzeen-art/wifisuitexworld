import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wifi, WifiOff, Monitor, Users, Eye, EyeOff,
  ArrowDownRight, ArrowUpRight, Activity, Zap,
  Shield, Clock, Signal
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import { useSpeedMonitor, formatSpeed } from '../../hooks/useSpeedMonitor'

function SpeedTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <div className="flex items-center gap-1.5 text-brand-400">
        <ArrowDownRight className="w-3 h-3" />
        {formatSpeed(payload[0]?.value || 0).value} {formatSpeed(payload[0]?.value || 0).unit}
      </div>
      <div className="flex items-center gap-1.5 text-teal-400 mt-0.5">
        <ArrowUpRight className="w-3 h-3" />
        {formatSpeed(payload[1]?.value || 0).value} {formatSpeed(payload[1]?.value || 0).unit}
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, icon: Icon, gradient, sub, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl p-4 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 ${gradient}`} />
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${gradient} shadow-sm`}>
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-slate-900">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-semibold">{unit}</span>}
      </div>
      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-slate-300 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

export default function DashboardTab({
  hotspotActive, hotspotStatus, config, setConfig,
  devices, starting, stopping, startHotspot, stopHotspot, licenseData
}) {
  const { history, upFormatted, downFormatted } = useSpeedMonitor(2000)
  const [showPass, setShowPass] = useState(false)
  const [startError, setStartError] = useState('')

  const handleStart = async () => {
    setStartError('')
    const result = await startHotspot()
    if (!result?.success && result?.error) setStartError(result.error)
  }

  const connected = hotspotStatus.clients || devices.filter(d => !d.blocked).length
  const maxDevices = licenseData?.unlimitedDevices ? '∞' : (licenseData?.maxDevices ?? '—')
  const planName = licenseData?.planName || 'Free Trial'

  return (
    <div className="p-5 space-y-4 min-h-full bg-slate-50">

      {/* ── Hero status banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${
          hotspotActive
            ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600'
            : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900'
        }`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-6 w-24 h-24 rounded-full bg-white blur-2xl" />
          <div className="absolute bottom-2 left-10 w-16 h-16 rounded-full bg-white blur-xl" />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              hotspotActive ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {hotspotActive
                ? <Wifi className="w-7 h-7 text-white" />
                : <WifiOff className="w-7 h-7 text-white/70" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <motion.div
                  className={`w-2 h-2 rounded-full ${hotspotActive ? 'bg-white' : 'bg-white/40'}`}
                  animate={hotspotActive ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-sm font-bold">
                  {hotspotActive ? 'Hotspot Active' : 'Hotspot Inactive'}
                </span>
              </div>
              <p className="text-white/70 text-xs mt-1">
                {hotspotActive
                  ? `Broadcasting "${hotspotStatus.ssid || config.ssid}" · ${connected} device${connected !== 1 ? 's' : ''} connected`
                  : 'Configure and start your WiFi hotspot below'
                }
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Shield className="w-3 h-3 text-white/60" />
                <span className="text-[10px] text-white/60">{planName} · {maxDevices} devices max</span>
              </div>
            </div>
          </div>

          {hotspotActive && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-white/80 text-xs">
                <Signal className="w-3 h-3" />
                <span>Live</span>
              </div>
              <div className="flex items-center gap-1 text-white/60 text-[10px] mt-1">
                <ArrowDownRight className="w-3 h-3 text-brand-300" />
                <span>{downFormatted.value} {downFormatted.unit}</span>
              </div>
              <div className="flex items-center gap-1 text-white/60 text-[10px]">
                <ArrowUpRight className="w-3 h-3 text-teal-300" />
                <span>{upFormatted.value} {upFormatted.unit}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Connected Devices"
          value={connected}
          icon={Users}
          gradient="bg-gradient-to-br from-brand-500 to-brand-600"
          sub={`of ${maxDevices} max`}
          delay={0.05}
        />
        <StatCard
          label="Download Speed"
          value={downFormatted.value}
          unit={downFormatted.unit}
          icon={ArrowDownRight}
          gradient="bg-gradient-to-br from-teal-500 to-signal-600"
          sub="per second"
          delay={0.1}
        />
        <StatCard
          label="Upload Speed"
          value={upFormatted.value}
          unit={upFormatted.unit}
          icon={ArrowUpRight}
          gradient="bg-gradient-to-br from-violet-500 to-violet-600"
          sub="per second"
          delay={0.15}
        />
      </div>

      {/* ── Speed chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">Live Network Speed</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" /> Download
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> Upload
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={history} margin={{ top: 2, right: 0, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="gDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" hide />
            <YAxis hide />
            <Tooltip content={<SpeedTooltip />} />
            <Area type="monotone" dataKey="down" stroke="#3b82f6" strokeWidth={2} fill="url(#gDown)" dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="up"   stroke="#06b6d4" strokeWidth={2} fill="url(#gUp)"   dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Config + Start/Stop ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800">Hotspot Configuration</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Network Name (SSID)
            </label>
            <input
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              value={config.ssid}
              onChange={e => setConfig(c => ({ ...c, ssid: e.target.value }))}
              disabled={hotspotActive}
              maxLength={32}
              placeholder="Extendra-WiFi"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all disabled:opacity-50 pr-9"
                value={config.password}
                onChange={e => setConfig(c => ({ ...c, password: e.target.value }))}
                disabled={hotspotActive}
                minLength={8}
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {startError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700 flex items-start gap-2"
            >
              <span className="text-red-500 mt-0.5">⚠</span>
              {startError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={hotspotActive ? stopHotspot : handleStart}
          disabled={starting || stopping}
          className={`relative w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden shadow-lg ${
            hotspotActive
              ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/25 hover:shadow-red-500/40'
              : 'bg-gradient-to-r from-brand-600 to-teal-500 text-white shadow-brand-500/25 hover:shadow-brand-500/40'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {hotspotActive && !starting && !stopping && (
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          {starting || stopping ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : hotspotActive ? (
            <WifiOff className="w-5 h-5" />
          ) : (
            <Wifi className="w-5 h-5" />
          )}
          <span>
            {starting ? 'Starting Hotspot...' : stopping ? 'Stopping...' : hotspotActive ? 'Stop Hotspot' : 'Start Hotspot'}
          </span>
        </motion.button>
      </motion.div>
    </div>
  )
}
