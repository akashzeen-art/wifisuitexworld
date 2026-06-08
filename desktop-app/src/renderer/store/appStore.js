import { create } from 'zustand'

const useAppStore = create((set) => ({
  token:         null,
  user:          null,
  licenseKey:    null,
  licenseValid:  false,
  licenseData:   null,
  setupComplete: false,

  setAuth: (token, user) => {
    window.__token = token
    set({ token, user })
  },

  setLicense: (key, valid, data = null) => set({
    licenseKey:   key,
    licenseValid: valid,
    licenseData:  data,
  }),

  setSetupComplete: (val) => set({ setupComplete: val }),

  logout: () => {
    window.__token = null
    set({ token: null, user: null, licenseKey: null, licenseValid: false, licenseData: null, setupComplete: false })
  },
}))

export default useAppStore
