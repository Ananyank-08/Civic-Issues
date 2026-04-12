import { createSlice } from '@reduxjs/toolkit'

const stored = localStorage.getItem('civic_user')
const initial = stored ? JSON.parse(stored) : null

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initial,       // { token, role, name, userId }
    isAuthenticated: !!initial,
  },
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('civic_user', JSON.stringify(action.payload))
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('civic_user')
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
