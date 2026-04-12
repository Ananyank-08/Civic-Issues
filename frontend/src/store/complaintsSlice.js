import { createSlice } from '@reduxjs/toolkit'

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState: {
    list: [],
    selected: null,
    filters: {
      status: '',
      priority: '',
      department: '',
      mismatch: false,
      area: '',
    },
  },
  reducers: {
    setComplaints(state, action) {
      state.list = action.payload
    },
    setSelected(state, action) {
      state.selected = action.payload
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters(state) {
      state.filters = { status: '', priority: '', department: '', mismatch: false, area: '' }
    },
    updateComplaintStatus(state, action) {
      const { id, status } = action.payload
      const c = state.list.find(x => x.id === id)
      if (c) c.status = status
    },
  },
})

export const {
  setComplaints, setSelected, setFilters, clearFilters, updateComplaintStatus,
} = complaintsSlice.actions
export default complaintsSlice.reducer
