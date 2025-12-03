import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAuthGET, fetchAuthPatch, fetchAuthPost, fetchAuthDeleteWithBody, fetchAuthDelete } from "./api/apiSlice";

// Async thunk to fetch notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (
    { userId, page = 1, params = {}, useCache = true, append = false },
    { rejectWithValue }
  ) => {
    try {
      const baseURL = import.meta.env.VITE_APP_DJANGO;
      let url = `${baseURL}/notifications/recipient/${userId}/?app_type=hr&page=${page}`;
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          let paramValue = value;
          if (typeof value === "boolean") {
            paramValue = value ? "True" : "False";
          }
          url += `&${key}=${paramValue}`;
        }
      });
      const response = await fetchAuthGET(url, useCache);
      let newNotifications = [];
      let count = 0;
      let unread_count = 0;
      if (Array.isArray(response.results)) {
        newNotifications = response.results;
        count = response.count;
        unread_count = response.results.unread_count || 0;
      } else if (response.results && Array.isArray(response.results.data)) {
        newNotifications = response.results.data;
        count = response.count;
        unread_count = response.results.unread_count || 0;
      }
      return { notifications: newNotifications, count, append, unread_count };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Async thunk to update a notification
export const updateNotification = createAsyncThunk(
  "notifications/updateNotification",
  async (
    { id, field, value, userId, params },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const url = `${import.meta.env.VITE_APP_DJANGO
        }/notifications/${id}/update/`;
      const payload = { body: { [field]: value ? "True" : "False" } };
      const response = await fetchAuthPatch(url, payload);
      if (response && !response.error) {
        return { id, field, value: value ? true : false };
      } else {
        return rejectWithValue("Failed to update notification");
      }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Thunk to mark notification as read
export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async ({ id }, { getState, dispatch }) => {
    const baseURL = import.meta.env.VITE_APP_DJANGO;
    await fetchAuthPatch(`${baseURL}/api/notifications/${id}/mark-read/`, {});
    return { id };
  }
);

// Thunk to mark notification as unread
export const markNotificationUnread = createAsyncThunk(
  "notifications/markNotificationUnread",
  async ({ id }, { getState, dispatch }) => {
    const baseURL = import.meta.env.VITE_APP_DJANGO;
    await fetchAuthPost(`${baseURL}/api/notifications/unread/${id}/`, {});
    return { id };
  }
);

// Add markAllNotificationsRead thunk
export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllNotificationsRead",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const baseURL = import.meta.env.VITE_APP_DJANGO;
      await fetchAuthPost(`${baseURL}/mark_notifications_as_read/${userId}/`, {});
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Async thunk to delete notifications
export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async ({ ids }, { rejectWithValue }) => {
    try {
      const baseURL = import.meta.env.VITE_APP_DJANGO;
      const url = `${baseURL}/notifications/delete/`;

      const response = await fetchAuthDeleteWithBody(url, { body: { ids } });

      if (response && !response.error) {
        return { ids };
      } else {
        return rejectWithValue("Failed to delete notifications");
      }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Clear all notifications
export const clearAllNotifications = createAsyncThunk(
  "notifications/clearAllNotifications",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const baseURL = import.meta.env.VITE_APP_DJANGO;
      const url = `${baseURL}/notifications/${userId}/clear/`;

      const response = await fetchAuthDelete(url);

      if (response && !response.error) {
        return true;
      } else {
        return rejectWithValue("Failed to clear notifications");
      }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    count: 0,
    unread_count: 0,
    loading: false,
    error: null,
  },
  reducers: {
    notificationReceived: (state, action) => {
      const n = action.payload;
      const exists = state.notifications.some((x) => x.id === n.id);
      if (!exists) {
        state.notifications = [n, ...state.notifications];
        if (n && n.read === false) {
          state.unread_count = state.unread_count + 1;
        }
        state.count = state.count + 1;
      }
    },
    notificationCountsPatched: (state, action) => {
      const { count, unread_count } = action.payload || {};
      if (typeof count === "number") state.count = count;
      if (typeof unread_count === "number") state.unread_count = unread_count;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.append) {
          // state.notifications = [
          //   ...state.notifications,
          //   ...action.payload.notifications,
          // ];
          const existingIds = new Set(state.notifications.map(n => n.id));
          const newOnes = action.payload.notifications.filter(n => !existingIds.has(n.id));
          state.notifications = [...state.notifications, ...newOnes];
        } else {
          state.notifications = action.payload.notifications;
        }
        state.count = action.payload.count;
        if (typeof action.payload.unread_count === 'number') {
          state.unread_count = action.payload.unread_count;
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateNotification.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateNotification.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.notifications.findIndex(
          (n) => n.id === action.payload.id
        );
        if (idx !== -1) {
          state.notifications[idx][action.payload.field] = action.payload.value;
        }
      })
      .addCase(updateNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        // Update the notification as read in state, decrement unread_count
        const idx = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (idx !== -1 && !state.notifications[idx].read) {
          state.notifications[idx].read = true;
          if (state.unread_count > 0) state.unread_count -= 1;
        }
      })
      .addCase(markNotificationUnread.fulfilled, (state, action) => {
        // Update the notification as unread in state, increment unread_count
        const idx = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (idx !== -1 && state.notifications[idx].read) {
          state.notifications[idx].read = false;
          state.unread_count += 1;
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.read = true;
        });
        state.unread_count = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(
          (n) => !action.payload.ids.includes(n.id)
        );
        state.count = state.notifications.length;
        state.unread_count = state.notifications.filter((n) => !n.read).length;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.count = 0;
        state.unread_count = 0;
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        state.error = action.payload;
      })
  },
});

export const { notificationReceived, notificationCountsPatched } = notificationsSlice.actions;
export default notificationsSlice.reducer;
