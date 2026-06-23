import { create } from 'zustand'

const MAX_ITEMS = 50

function loadStored(userId) {
  if (!userId) return []
  try {
    return JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]')
  } catch {
    return []
  }
}

function saveStored(userId, items) {
  if (!userId) return
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(items.slice(0, MAX_ITEMS)))
}

const useNotificationStore = create((set, get) => ({
  notifications: [],

  hydrate: (userId) => {
    set({ notifications: loadStored(userId) })
  },

  add: ({ key, type = 'info', title, message, href = null }) => {
    const state = get()
    if (key && state.notifications.some(n => n.key === key && !n.read)) return null

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      key: key || null,
      type,
      title,
      message,
      href,
      read: false,
      createdAt: new Date().toISOString(),
    }

    const notifications = [item, ...state.notifications].slice(0, MAX_ITEMS)
    set({ notifications })
    return item
  },

  markRead: (id) => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }))
  },

  markAllRead: () => {
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, read: true })),
    }))
  },

  remove: (id) => {
    set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }))
  },

  clear: () => set({ notifications: [] }),
}))

useNotificationStore.subscribe((state) => {
  const userId = JSON.parse(localStorage.getItem('user') || 'null')?.id
  if (userId) saveStored(userId, state.notifications)
})

export function getUnreadCount() {
  return useNotificationStore.getState().notifications.filter(n => !n.read).length
}

export default useNotificationStore
