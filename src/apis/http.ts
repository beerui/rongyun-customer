import axios, { type AxiosInstance } from 'axios'

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const isAgentRoute = location.pathname.startsWith('/agent')
  const tokenKey = isAgentRoute ? 'agent_auth_token' : 'user_auth_token'
  const imToken = localStorage.getItem(tokenKey) || ''
  if (imToken) (config.headers as any).ImToken = imToken
  // if (imToken) (config.headers as any).accessToken = imToken
  // if (imToken) (config.headers as any).Authorization = imToken
  return config
})

http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body === 'object' && 'code' in body) {
      const code = body.code
      const ok = code === 0 || code === 200 || code === 100 || code === '0' || code === '200' || code === '100'
      if (!ok) {
        return Promise.reject(new Error(body.message || body.msg || `API error ${code}`))
      }
      return body.data ?? body
    }
    return body
  },
  (err) => {
    if (err?.response?.status === 401) {
      const isAgentRoute = location.pathname.startsWith('/agent')
      const tokenKey = isAgentRoute ? 'agent_auth_token' : 'user_auth_token'
      localStorage.removeItem(tokenKey)
      if (!location.pathname.includes('/agent/login')) {
        location.href = '/agent/login'
      }
    }
    return Promise.reject(err)
  },
)
