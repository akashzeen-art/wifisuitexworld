import axios from 'axios'

const DEFAULT_API_ORIGIN = 'https://wifi.suite-x.world'

const getBase = () => {
  try {
    const stored = window.__apiUrl
    return (stored || DEFAULT_API_ORIGIN) + '/api'
  } catch {
    return `${DEFAULT_API_ORIGIN}/api`
  }
}

const api = axios.create({ baseURL: `${DEFAULT_API_ORIGIN}/api` })

api.interceptors.request.use(config => {
  config.baseURL = getBase()
  const token = window.__token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
