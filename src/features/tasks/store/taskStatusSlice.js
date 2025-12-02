import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAuthGET } from '@/store/api/apiSlice';
import axios from 'axios';

// Async thunk to fetch task statuses
export const fetchTaskStatuses = createAsyncThunk(
  'taskStatus/fetchTaskStatuses',
  async (_, { getState, rejectWithValue }) => {
  
    try {
      const userInfo = getState().auth.user;
      if (!userInfo?.companyId) {
        return rejectWithValue('User company ID not found');
      }
      
      const response = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/project-status/`
      );
      
      if (response?.unique_statuses) {
        return response.unique_statuses;
      }
      
      return rejectWithValue('Failed to fetch task statuses');
    } catch (error) {
      console.error("Error fetching task status:", error);
      return rejectWithValue(error.message || 'Failed to fetch task statuses');
    }
  }
);

// Async thunk to fetch task status with direct axios call (alternative method)
export const fetchTaskStatusDirect = createAsyncThunk(
  'taskStatus/fetchTaskStatusDirect',
  async (_, { getState, rejectWithValue }) => {
    try {
      const userInfo = getState().auth.user;
      if (!userInfo?.companyId) {
        return rejectWithValue('User company ID not found');
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/project-status/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data?.unique_statuses || [];
    } catch (error) {
      console.error("Error fetching task status:", error);
      return rejectWithValue(error.message || 'Failed to fetch task statuses');
    }
  }
);

const initialState = {
  statuses: [],
  loading: false,
  error: null,
};

const taskStatusSlice = createSlice({
  name: 'taskStatus',
  initialState,
  reducers: {
    // Add a reducer to manually set statuses if needed
    setTaskStatuses: (state, action) => {
      state.statuses = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaskStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskStatuses.fulfilled, (state, action) => {
        state.statuses = action.payload;
        state.loading = false;
      })
      .addCase(fetchTaskStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Add cases for direct axios method
      .addCase(fetchTaskStatusDirect.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskStatusDirect.fulfilled, (state, action) => {
        state.statuses = action.payload;
        state.loading = false;
      })
      .addCase(fetchTaskStatusDirect.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setTaskStatuses } = taskStatusSlice.actions;
export default taskStatusSlice.reducer; 