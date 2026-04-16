import axios, { type AxiosInstance } from 'axios'

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code !== 0 && body.code !== 200) {
        return Promise.reject(new Error(body.message || body.msg || `API error ${body.code}`))
      }
      return body.data ?? body
    }
    return body
  },
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('auth_token')
      location.href = '/agent/login'
    }
    return Promise.reject(err)
  },
)
