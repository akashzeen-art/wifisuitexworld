import { create } from 'zustand'

let toastId = 0

const useToastStore = create((set) => ({
  toasts: [],

  add: (message, type = 'info', duration = 4000) => {
    const id = ++toastId
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    if (duration > 0) {
      setTimeout(() => {
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
      }, duration)
    }
    return id
  },

  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  clear:  ()   => set({ toasts: [] }),
}))

// Convenience helpers — call these anywhere without hooks
export const toast = {
  success: (msg, duration)  => useToastStore.getState().add(msg, 'success', duration),
  error:   (msg, duration)  => useToastStore.getState().add(msg, 'error',   duration),
  info:    (msg, duration)  => useToastStore.getState().add(msg, 'info',    duration),
  warning: (msg, duration)  => useToastStore.getState().add(msg, 'warning', duration),
  loading: (msg)            => useToastStore.getState().add(msg, 'loading', 0),
  dismiss: (id)             => useToastStore.getState().remove(id),
}

export default useToastStore
