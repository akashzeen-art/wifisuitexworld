import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  user:         JSON.parse(localStorage.getItem('user')         || 'null'),
  token:        localStorage.getItem('accessToken')             || null,
  refreshToken: localStorage.getItem('refreshToken')            || null,

  login: (data) => {
    const user = data.user
    localStorage.setItem('accessToken',  data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token: data.accessToken, refreshToken: data.refreshToken, user })
  },

  updateTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken',  accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    set({ token: accessToken, refreshToken, user })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({ token: null, refreshToken: null, user: null })
  },
}))

export default useAuthStore
