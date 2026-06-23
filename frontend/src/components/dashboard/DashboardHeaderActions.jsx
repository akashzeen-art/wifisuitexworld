import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Settings, LogOut, User, ChevronRight, CheckCheck, Trash2,
  Smartphone, AlertTriangle, Info, CheckCircle2,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useNotificationStore from '../../store/notificationStore'

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (secs < 60) return 'Just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

function typeIcon(type) {
  if (type === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />
  return <Info className="w-4 h-4 text-brand-500" />
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [ref, handler])
}

export default function DashboardHeaderActions() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  const notifications = useNotificationStore(s => s.notifications)
  const markRead = useNotificationStore(s => s.markRead)
  const markAllRead = useNotificationStore(s => s.markAllRead)
  const clear = useNotificationStore(s => s.clear)

  const [bellOpen, setBellOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const bellRef = useRef(null)
  const userRef = useRef(null)

  const unread = notifications.filter(n => !n.read).length

  useClickOutside(bellRef, () => setBellOpen(false))
  useClickOutside(userRef, () => setUserOpen(false))

  const handleLogout = () => {
    clear()
    logout()
    navigate('/')
  }

  const openNotification = (n) => {
    markRead(n.id)
    setBellOpen(false)
    if (n.href) navigate(n.href)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Bell */}
      <div className="relative" ref={bellRef}>
        <button
          type="button"
          onClick={() => { setBellOpen(v => !v); setUserOpen(false) }}
          className="relative w-9 h-9 rounded-xl bg-brand-50 hover:bg-brand-100/80 border border-brand-100 flex items-center justify-center transition-colors"
          aria-label="Notifications"
          aria-expanded={bellOpen}
        >
          <Bell className="w-4 h-4 text-brand-600" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <AnimatePresence>
          {bellOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-brand-500/10 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-brand-50/50 to-emerald-50/30">
                <div>
                  <p className="text-sm font-bold text-slate-900">Notifications</p>
                  <p className="text-[11px] text-slate-500">{unread} unread</p>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">No notifications yet</p>
                    <p className="text-xs text-slate-400 mt-1">Device events and alerts will appear here.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                        !n.read ? 'bg-brand-50/40' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        {typeIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight ${!n.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2" />}
                    </button>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => { clear(); setBellOpen(false) }}
                    className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1 mx-auto"
                  >
                    <Trash2 className="w-3 h-3" /> Clear all
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User menu */}
      <div className="relative" ref={userRef}>
        <button
          type="button"
          onClick={() => { setUserOpen(v => !v); setBellOpen(false) }}
          className="w-9 h-9 bg-gradient-to-br from-brand-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow"
          aria-label="Account menu"
          aria-expanded={userOpen}
        >
          {user?.name?.[0]?.toUpperCase()}
        </button>

        <AnimatePresence>
          {userOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-brand-500/10 z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-brand-50/50 to-emerald-50/30">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>

              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => { setUserOpen(false); navigate('/dashboard/settings') }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-brand-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Profile & account
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => { setUserOpen(false); navigate('/dashboard/settings') }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-brand-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => { setUserOpen(false); navigate('/dashboard/download') }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-brand-50 transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  Download app
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                </button>
              </div>

              <div className="p-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
