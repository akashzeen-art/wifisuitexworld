import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wifi, LayoutDashboard, Monitor, Settings,
  LogOut, Key, AlertTriangle, ChevronRight
} from 'lucide-react'
import useAppStore from '../store/appStore'
import api from '../lib/api'
import TitleBar from '../components/TitleBar'
import DashboardTab from '../components/tabs/DashboardTab'
import DevicesTab from '../components/tabs/DevicesTab'
import SettingsTab from '../components/tabs/SettingsTab'

const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'devices',   icon: Monitor,         label: 'Devices'   },
  { id: 'settings',  icon: Settings,        label: 'Settings'  },
]

export default function HotspotScreen() {
  const { user, licenseKey, licenseData, logout, setLicense } = useAppStore()
  const [tab,            setTab]            = useState('dashboard')
  const [hotspotActive,  setHotspotActive]  = useState(false)
  const [hotspotStatus,  setHotspotStatus]  = useState({ running: false, clients: 0, ssid: '' })
  const [config,         setConfig]         = useState({ ssid: 'Extendra-WiFi', password: 'extendra123' })
  const [devices,        setDevices]        = useState([])
  const [licenseWarning, setLicenseWarning] = useState(null)
  const [starting,       setStarting]       = useState(false)
  const [stopping,       setStopping]       = useState(false)

  useEffect(() => {
    window.electron.store.get('hotspot').then(saved => {
      if (saved?.ssid)     setConfig(c => ({ ...c, ssid: saved.ssid }))
      if (saved?.password) setConfig(c => ({ ...c, password: saved.password }))
    })
  }, [])

  const fetchStatus = useCallback(async () => {
    const s = await window.electron.hotspot.status()
    setHotspotStatus(s)
    setHotspotActive(s.running)
  }, [])

  const fetchDevices = useCallback(async () => {
    try {
      const { data } = await api.get('/devices')
      setDevices(data)
    } catch {}
  }, [])

  const validateLicense = useCallback(async () => {
    if (!licenseKey) return
    try {
      const machineId = await window.electron.machine.id()
      await api.post('/licenses/validate', { licenseKey, machineId })
      setLicenseWarning(null)
    } catch (err) {
      const msg = err.response?.data?.message || 'License validation failed'
      setLicenseWarning(msg)
      if (msg.includes('revoked') || msg.includes('expired')) {
        if (hotspotActive) await window.electron.hotspot.stop()
        await window.electron.store.set('licenseValid', false)
        setLicense(null, false, null)
      }
    }
  }, [licenseKey, hotspotActive, setLicense])

  useEffect(() => {
    fetchStatus()
    fetchDevices()
    validateLicense()
    const statusInterval  = setInterval(fetchStatus,     5000)
    const devicesInterval = setInterval(fetchDevices,    8000)
    const licenseInterval = setInterval(validateLicense, 30 * 60 * 1000)
    return () => {
      clearInterval(statusInterval)
      clearInterval(devicesInterval)
      clearInterval(licenseInterval)
    }
  }, [fetchStatus, fetchDevices, validateLicense])

  const startHotspot = async () => {
    setStarting(true)
    const result = await window.electron.hotspot.start(config)
    if (result.success) {
      setHotspotActive(true)
      await fetchStatus()
    }
    setStarting(false)
    return result
  }

  const stopHotspot = async () => {
    setStopping(true)
    await window.electron.hotspot.stop()
    setHotspotActive(false)
    setStopping(false)
  }

  const toggleBlock = async (id) => {
    try {
      const { data } = await api.put(`/devices/${id}/block`)
      setDevices(prev => prev.map(d => d.id === id ? data : d))
    } catch {}
  }

  const handleLogout = async () => {
    if (hotspotActive) await window.electron.hotspot.stop()
    await window.electron.store.set('token', null)
    await window.electron.store.set('user', null)
    await window.electron.store.set('licenseKey', null)
    await window.electron.store.set('licenseValid', false)
    setLicense(null, false, null)
    logout()
  }

  const sharedProps = {
    hotspotActive, hotspotStatus, config, setConfig,
    devices, setDevices, starting, stopping,
    startHotspot, stopHotspot, toggleBlock,
    licenseKey, licenseData,
  }

  return (
    <div className="h-screen flex flex-col dashboard-bg overflow-hidden">
      <TitleBar />

      {/* License warning */}
      <AnimatePresence>
        {licenseWarning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">{licenseWarning}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 shadow-sm">

          {/* Logo */}
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">WiFiExtender</p>
                <p className="text-[10px] text-slate-400">Desktop App</p>
              </div>
            </div>
          </div>

          {/* User */}
          <div className="px-3 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-50">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-3 space-y-1">
            {NAV.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  tab === id
                    ? 'bg-gradient-to-r from-brand-600 to-teal-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
                {tab === id && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </button>
            ))}
          </nav>

          {/* License */}
          <div className="px-3 py-3 border-t border-slate-100 space-y-2">
            <div className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 border border-brand-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Key className="w-3 h-3 text-brand-500" />
                <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">License Key</span>
              </div>
              <p className="font-mono text-[9px] text-slate-500 truncate">{licenseKey}</p>
              {licenseData?.planName && (
                <div className="mt-1.5 inline-flex items-center gap-1 bg-brand-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                  {licenseData.planName}
                </div>
              )}
            </div>

            {/* Hotspot status indicator */}
            <div className={`px-3 py-2 rounded-xl flex items-center gap-2 ${
              hotspotActive ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
            }`}>
              <motion.div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${hotspotActive ? 'bg-emerald-400' : 'bg-slate-300'}`}
                animate={hotspotActive ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className={`text-[10px] font-semibold ${hotspotActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {hotspotActive ? `Hotspot Active` : 'Hotspot Off'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full overflow-y-auto"
            >
              {tab === 'dashboard' && <DashboardTab {...sharedProps} />}
              {tab === 'devices'   && <DevicesTab   {...sharedProps} />}
              {tab === 'settings'  && <SettingsTab  {...sharedProps} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
