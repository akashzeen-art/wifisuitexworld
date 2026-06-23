import { useEffect, useCallback } from 'react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import useNotificationStore from '../store/notificationStore'
import { subscribeDeviceSocket } from '../lib/deviceSocketManager'

function daysLeft(expiresAt) {
  if (!expiresAt) return null
  return Math.ceil((new Date(expiresAt) - Date.now()) / 86400000)
}

export function useDashboardNotifications() {
  const user = useAuthStore(s => s.user)
  const token = useAuthStore(s => s.token)
  const hydrate = useNotificationStore(s => s.hydrate)
  const add = useNotificationStore(s => s.add)

  const handleDeviceEvent = useCallback((event) => {
    const name = event.device?.deviceName || 'Device'
    const prefs = user || {}

    if (event.type === 'CONNECTED' && prefs.notifyDeviceConnect !== false) {
      add({
        key: `device-connected-${event.device?.id}-${event.timestamp}`,
        type: 'success',
        title: 'Device connected',
        message: `${name} joined your hotspot.`,
        href: '/dashboard/devices',
      })
    } else if (event.type === 'DISCONNECTED' && prefs.notifyDeviceConnect !== false) {
      add({
        key: `device-disconnected-${event.device?.id}-${event.timestamp}`,
        type: 'info',
        title: 'Device disconnected',
        message: `${name} left your network.`,
        href: '/dashboard/devices',
      })
    } else if (event.type === 'BLOCKED' && prefs.notifyDeviceBlock !== false) {
      add({
        key: `device-blocked-${event.device?.id}-${event.timestamp}`,
        type: 'warning',
        title: 'Device blocked',
        message: `${name} was blocked from your hotspot.`,
        href: '/dashboard/devices',
      })
    }
  }, [add, user])

  useEffect(() => {
    if (user?.id) hydrate(user.id)
  }, [user?.id, hydrate])

  useEffect(() => {
    if (!token || !user?.id) return undefined
    return subscribeDeviceSocket({
      token,
      userId: user.id,
      onEvent: handleDeviceEvent,
    })
  }, [token, user?.id, handleDeviceEvent])

  useEffect(() => {
    if (!user?.id) return undefined

    let cancelled = false

    async function checkAlerts() {
      try {
        const [subsRes, licensesRes] = await Promise.all([
          api.get('/subscriptions'),
          api.get('/subscriptions/licenses'),
        ])
        if (cancelled) return

        const subs = subsRes.data || []
        const licenses = licensesRes.data || []
        const activeSub = subs.find(s => s.status === 'ACTIVE')
        const activeLicense = licenses.find(l => l.status === 'ACTIVE')

        if (!activeSub) {
          add({
            key: 'no-active-plan',
            type: 'warning',
            title: 'No active subscription',
            message: 'Activate a plan to start your WiFi hotspot.',
            href: '/dashboard/subscription',
          })
        }

        if (activeSub?.expiresAt && user.notifyLicenseExpiry !== false) {
          const days = daysLeft(activeSub.expiresAt)
          if (days !== null && days <= 7 && days > 0) {
            add({
              key: `sub-expiry-${days}`,
              type: 'warning',
              title: 'Plan expiring soon',
              message: `Your subscription expires in ${days} day${days === 1 ? '' : 's'}.`,
              href: '/dashboard/subscription',
            })
          }
        }

        if (activeSub && !activeLicense) {
          add({
            key: 'no-license',
            type: 'info',
            title: 'License key ready',
            message: 'Copy your license key from Subscription and activate the app.',
            href: '/dashboard/subscription',
          })
        }
      } catch {
        // silent — dashboard pages may show errors separately
      }
    }

    checkAlerts()
    const id = setInterval(checkAlerts, 5 * 60 * 1000)
    return () => { cancelled = true; clearInterval(id) }
  }, [user?.id, user?.notifyLicenseExpiry, add])
}
