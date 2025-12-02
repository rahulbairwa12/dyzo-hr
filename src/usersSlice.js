import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAuthGET, isAdmin } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { login } from "./store/authReducer";

// Fetch current user data and update cookie if admin status changed
export const fetchCurrentUserData = createAsyncThunk(
  "users/fetchCurrentUserData",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      let userInfo;
      try {
        userInfo = JSON.parse(Cookies.get("userInfo") || "{}");
      } catch (error) {
        console.error("Error parsing user info from cookie:", error);
        return rejectWithValue("User info not found");
      }

      if (!userInfo || !userInfo._id) {
        return rejectWithValue("User info incomplete");
      }

      const response = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/employee/me/${userInfo._id}/`
      );

      if (!response || response.status !== 1) {
        throw new Error(response?.error || "Failed to fetch user data");
      }

      const userData = response.data;

      // Check if admin status has changed
      if (userData.isAdmin !== userInfo.isAdmin) {
        // Update the userInfo cookie with new admin status
        const updatedUserInfo = {
          ...userInfo,
          isAdmin: userData.isAdmin,
          isSuperAdmin: userData.isSuperAdmin || userInfo.isSuperAdmin,
        };

        // Get expiration from localStorage or set default
        const storedExpiry = localStorage.getItem('userInfoExpires');
        if (storedExpiry) {
          Cookies.set('userInfo', JSON.stringify(updatedUserInfo), {
            expires: new Date(storedExpiry),
          });
        } else {
          Cookies.set('userInfo', JSON.stringify(updatedUserInfo), { expires: 7 });
        }

        // Update Redux state
        dispatch(login(updatedUserInfo));

        toast.success(
          userData.isAdmin 
            ? "You have been granted admin privileges!" 
            : "Your admin privileges have been revoked."
        );
      }

      return userData;
    } catch (error) {
      console.error("Error fetching current user data:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue, dispatch }) => {
    // Fetch current user data to check for admin status changes
    dispatch(fetchCurrentUserData());
    try {
      // Get userInfo from cookie
    
      let userInfo;
      try {
        userInfo = JSON.parse(Cookies.get("userInfo") || "{}");
      } catch (error) {
        console.error("Error parsing user info from cookie:", error);
        return rejectWithValue("User info not found");
      }

      if (!userInfo || !userInfo._id || !userInfo.companyId) {
        toast.error("User information is missing. Please try logging in again.");
        return rejectWithValue("User info incomplete");
      }

      const response = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/employee/list/activeUsers/${userInfo.companyId}/`
      );
      
      if (!response || !response.status) {
        throw new Error(response?.error || "Failed to fetch users");
      }
      
      // Process users data for assignee selects
      let processedUsers = response.data?.map((user) => ({
        value: user._id,
        label: `${user.name} (${user.email})`,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name,
        _id: user._id,
        email: user.email,
        status: user.status,
        image: user.profile_picture
          ? `${import.meta.env.VITE_APP_DJANGO}${user.profile_picture}`
          : null,
      }));

      // If admin, add 'All Users' option
      if (isAdmin()) {
        processedUsers?.unshift({
          value: "0",
          label: "All Users",
          image: null,
        });
      }
      
      return processedUsers || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users. Please try again.");
      return rejectWithValue(error.message);
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    users: [],
    currentUser: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCurrentUserData.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUserData.rejected, (state, action) => {
        console.error("Failed to fetch current user data:", action.payload);
      });
  },
});

export default usersSlice.reducer;