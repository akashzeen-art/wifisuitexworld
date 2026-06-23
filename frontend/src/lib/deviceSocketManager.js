import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = '/ws'

let client = null
let currentUserId = null
let currentToken = null
const listListeners = new Set()
const eventListeners = new Set()

function notifyList(data) {
  listListeners.forEach(fn => { try { fn(data) } catch {} })
}

function notifyEvent(data) {
  eventListeners.forEach(fn => { try { fn(data) } catch {} })
}

function disconnect() {
  if (client) {
    client.deactivate()
    client = null
  }
  currentUserId = null
  currentToken = null
}

function connect(token, userId) {
  if (!token || !userId) {
    disconnect()
    return
  }
  if (client && currentUserId === userId && currentToken === token) return

  disconnect()
  currentUserId = userId
  currentToken = token

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(`/topic/devices/${userId}`, (msg) => {
        try { notifyList(JSON.parse(msg.body)) } catch {}
      })
      client.subscribe(`/topic/devices/${userId}/event`, (msg) => {
        try { notifyEvent(JSON.parse(msg.body)) } catch {}
      })
    },
    onStompError: (frame) => {
      console.warn('STOMP error:', frame.headers?.message)
    },
  })

  client.activate()
}

export function subscribeDeviceSocket({ onList, onEvent, token, userId }) {
  if (onList) listListeners.add(onList)
  if (onEvent) eventListeners.add(onEvent)
  connect(token, userId)

  return () => {
    if (onList) listListeners.delete(onList)
    if (onEvent) eventListeners.delete(onEvent)
    if (listListeners.size === 0 && eventListeners.size === 0) {
      disconnect()
    }
  }
}
