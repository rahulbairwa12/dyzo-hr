import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import { fetchAuthGET } from '@/store/api/apiSlice';

export const fetchEmployees = createAsyncThunk(
  'employee/fetchEmployees',
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/employee/list/${companyId}/`);
      const data = response.data;
      if (data.length === 0) {
        toast.info('No employees found.');
      }
      return data;
    } catch (error) {
      toast.error('Failed to fetch employees.');
      return rejectWithValue(error?.message || 'Something went wrong');
    }
  }
);



const employeeSlice = createSlice({
  name: 'employee',
  initialState: {
    employees: [],
    loading: false,
    error: null,
  },
  reducers: {
    addEmployee: (state, action) => {
      state.employees.push(action.payload);
    },
    updateEmployee: (state, action) => {
      const index = state.employees.findIndex(emp => emp.id === action.payload.id);
      if (index !== -1) {
        state.employees[index] = action.payload;
      }
    },
    deleteEmployee: (state, action) => {
      state.employees = state.employees.filter(emp => emp.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addEmployee, updateEmployee, deleteEmployee } = employeeSlice.actions;
export default employeeSlice.reducer;

