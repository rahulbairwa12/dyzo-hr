import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    value: false,
  },
  reducers: {
    increment: (state, action) => {
      state.value = !state.value;
    },
  },
});

export const { increment } = counterSlice.actions;

export default counterSlice.reducer;
