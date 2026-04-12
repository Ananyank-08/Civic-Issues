import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import complaintsReducer from './complaintsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    complaints: complaintsReducer,
  },
})
