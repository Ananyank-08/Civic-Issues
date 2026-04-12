import axios from 'axios'
import { store } from '../store'
import { logout } from '../store/authSlice'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = store.getState().auth.user?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) store.dispatch(logout())
    return Promise.reject(err)
  }
)

export default api
