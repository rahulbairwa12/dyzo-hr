import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAuthGET, isAdmin } from "./api/apiSlice";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
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
      
      // Get deleted user IDs
      const deletedUserIds = new Set(response.deleted_data?.map(user => user._id) || []);
      
      // Store full active users data with deleted status marked
      const activeUsersData = response.data?.map((user) => ({
        ...user,
        name: deletedUserIds.has(user._id) ? `${user.name} (deleted)` : user.name,
        isDeletedUser: deletedUserIds.has(user._id)
      })) || [];
      
      // Process users data for assignee selects
      let processedUsers = activeUsersData.map((user) => ({
        value: user._id,
        designation: user.designation,
        label: `${user.name} (${user.email})`,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name,
        _id: user._id,
        email: user.email,
        status: user.status,
        isActive: user.isActive,
        isDeletedUser: user.isDeletedUser,
        image: user.profile_picture
          ? `${import.meta.env.VITE_APP_DJANGO}${user.profile_picture}`
          : null,
      }));

      // If admin, add 'All Users' option
    /*   if (isAdmin()) {
        processedUsers?.unshift({
          value: "0",
          label: "All Users",
          image: null,
        });
      } */
      
      return {
        processedUsers,
        activeUsersData,
        deletedUserIds: Array.from(deletedUserIds),
        deletedData: response.deleted_data || []
      };
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
    users: [], // Processed users for selects
    activeUsers: [], // Full raw active users data
    deletedUserIds: [], // IDs of deleted users
    deletedData: [], // Full deleted users data
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
        state.users = action.payload.processedUsers;
        state.activeUsers = action.payload.activeUsersData;
        state.deletedUserIds = action.payload.deletedUserIds;
        state.deletedData = action.payload.deletedData;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default usersSlice.reducer; 