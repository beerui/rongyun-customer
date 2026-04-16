import axios, { type AxiosInstance } from 'axios'

const READY_TOKEN = import.meta.env.VITE_READY_TOKEN

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || READY_TOKEN || ''
  const imToken = localStorage.getItem('ImToken') || ''
  if (token) {
    config.headers.Authorization = token
    ;(config.headers as any).accessToken = token
  }
  if (imToken) (config.headers as any).ImToken = imToken
  ;(config.headers as any).scene = token ? 'sc' : 'agents'
  ;(config.headers as any).channel = token ? 'sc' : 'agents'
  return config
})

http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code !== 0 && body.code !== 200 && body.code !== '0' && body.code !== '200') {
        return Promise.reject(new Error(body.message || body.msg || `API error ${body.code}`))
      }
      return body.data ?? body
    }
    return body
  },
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('auth_token')
      if (!location.pathname.includes('/agent/login')) {
        location.href = '/agent/login'
      }
    }
    return Promise.reject(err)
  },
)
