import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import useAuthStore from '../store/authStore'

const WS_URL = '/ws'

/**
 * Subscribes to real-time device updates via STOMP over SockJS.
 * @param {Function} onList  - called with full device array on refresh
 * @param {Function} onEvent - called with { type, device, timestamp } on single event
 */
export function useDeviceSocket(onList, onEvent) {
  const token     = useAuthStore(s => s.token)
  const user      = useAuthStore(s => s.user)
  const clientRef = useRef(null)

  const connect = useCallback(() => {
    if (!token || !user?.id) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders:   { Authorization: `Bearer ${token}` },
      reconnectDelay:   5000,
      onConnect: () => {
        client.subscribe(`/topic/devices/${user.id}`, (msg) => {
          try { onList(JSON.parse(msg.body)) } catch {}
        })
        client.subscribe(`/topic/devices/${user.id}/event`, (msg) => {
          try { onEvent(JSON.parse(msg.body)) } catch {}
        })
      },
      onStompError: (frame) => {
        console.warn('STOMP error:', frame.headers?.message)
      },
    })

    client.activate()
    clientRef.current = client
  }, [token, user?.id, onList, onEvent])

  useEffect(() => {
    connect()
    return () => { clientRef.current?.deactivate() }
  }, [connect])
}
