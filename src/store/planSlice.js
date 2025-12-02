import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAPI } from "./api/apiSlice";

// Async thunk to fetch plan data
export const fetchPlanData = createAsyncThunk(
  "plan/fetchPlanData",
  async (companyId, { rejectWithValue }) => {
    try {
      const response = await fetchAPI(`check-subscription-expiry/${companyId}/`);
      return response.data ? response.data : response;
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  subscriptionData: {
    company_details: null,
    subscription_status: null,
    subscription_id: null
  },
  showLimitModal: false,
  canAddTask: true,
  freeTierLimit: 2  // Free tier limit is 2 users
};

const planSlice = createSlice({
  name: "plan",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setShowLimitModal: (state, action) => {
      state.showLimitModal = action.payload;
    },
    checkUserLimit: (state) => {
      const { company_details, subscription_status } = state.subscriptionData;

      // If no company details yet, allow tasks (will be checked later)
      if (!company_details) {
        state.canAddTask = true;
        return;
      }

      const { active_users_count, employee_limit } = company_details;

      // Show modal if subscription is NOT active, regardless of counts
      if (subscription_status !== "active") {
        state.canAddTask = false;
        state.showLimitModal = true;
        return;
      }

      // Subscription is active: compare against employee_limit
      state.canAddTask = active_users_count <= employee_limit;
      if (!state.canAddTask) state.showLimitModal = true;
    },
    setCompanyTimezone: (state, action) => {
      if (state.subscriptionData && state.subscriptionData.company_details) {
        state.subscriptionData.company_details.company_timezone = action.payload;
      }
    },
    setCompanyScreenshotSettings: (state, action) => {
      if (state.subscriptionData && state.subscriptionData.company_details) {
        state.subscriptionData.company_details.screenshot_time = action.payload.screenshot_time;
        state.subscriptionData.company_details.interval_time = action.payload.interval_time;
        state.subscriptionData.company_details.screenshot_reduced_time = action.payload.screenshot_reduced_time;
        state.subscriptionData.company_details.screenshot_mode = action.payload.screenshot_mode;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlanData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlanData.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptionData = action.payload;
        
        // After getting subscription data, check user limit
        const { company_details, subscription_status } = action.payload;
        
        if (company_details) {
          const { active_users_count, employee_limit } = company_details;

          // Case 1: Has active subscription - check if under employee limit
          if (subscription_status === "active") {
            state.canAddTask = active_users_count <= employee_limit;
          }
          // Case 2: Free tier - check if under free tier limit (2 users)
          else {
            state.canAddTask = active_users_count <= state.freeTierLimit;
          }
        }
      })
      .addCase(fetchPlanData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});


export const { setLoading, setShowLimitModal, checkUserLimit, setCompanyTimezone, setCompanyScreenshotSettings } = planSlice.actions;

// Helper thunk to check limit and show modal if blocked. Returns boolean
export const enforceSubscriptionLimit = () => (dispatch, getState) => {
  dispatch(checkUserLimit());
  const canAdd = getState().plan.canAddTask;
  if (!canAdd) {
    dispatch(setShowLimitModal(true));
  }
  return canAdd;
};

export default planSlice.reducer; 


