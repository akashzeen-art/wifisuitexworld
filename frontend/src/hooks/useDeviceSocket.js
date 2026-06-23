import { useEffect } from 'react'
import useAuthStore from '../store/authStore'
import { subscribeDeviceSocket } from '../lib/deviceSocketManager'

/**
 * Subscribes to real-time device updates via shared STOMP connection.
 * @param {Function} onList  - called with full device array on refresh
 * @param {Function} onEvent - called with { type, device, timestamp } on single event
 */
export function useDeviceSocket(onList, onEvent) {
  const token = useAuthStore(s => s.token)
  const user = useAuthStore(s => s.user)

  useEffect(() => {
    if (!token || !user?.id) return undefined
    return subscribeDeviceSocket({
      token,
      userId: user.id,
      onList,
      onEvent,
    })
  }, [token, user?.id, onList, onEvent])
}
