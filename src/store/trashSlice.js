import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAuthGET, fetchAuthPatch, fetchAuthPost } from "./api/apiSlice";

// Async thunk to fetch deleted tasks
export const fetchDeletedTasks = createAsyncThunk(
  "trash/fetchDeletedTasks",
  async (
    { userId, page = 1, params = {}, useCache = false, append = false },
    { rejectWithValue }
  ) => {
    try {
      const baseURL = import.meta.env.VITE_APP_DJANGO;
      
      // Ensure userId is provided
      if (!userId) {
        return rejectWithValue("No userId provided");
      }
      
      let url = `${baseURL}/task/deleted/user/${userId}/?page=${page}`;
      
      // Add search parameter if provided
      if (params.search) {
        url += `&search=${encodeURIComponent(params.search)}`;
      }
      
      // Add other parameters
      Object.entries(params).forEach(([key, value]) => {
        // Skip search as it's already handled above
        if (key === 'search') return;
        
        if (value !== undefined) {
          let paramValue = value;
          if (typeof value === "boolean") {
            paramValue = value ? "True" : "False";
          }
          url += `&${key}=${paramValue}`;
        }
      });
      
      const response = await fetchAuthGET(url, useCache);
      
      let deletedTasks = [];
      let count = 0;
      
      if (response && response.results) {
        deletedTasks = response.results;
        count = response.count;
      }
      
      // Always pass the append flag to the reducer
      return { deletedTasks, count, append, page };
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch deleted tasks");
    }
  }
);

// Async thunk to restore a single task (using bulk API with single ID)
export const restoreTask = createAsyncThunk(
  "trash/restoreTask",
  async ({ taskId, userId }, { rejectWithValue }) => {
    try {
      const baseURL = import.meta.env.VITE_APP_DJANGO;
      
      if (!taskId) {
        return rejectWithValue("No taskId provided");
      }
      
      const url = `${baseURL}/task/restore/bulk/`;
      
      // Use bulk API with single task ID in the array
      const response = await fetchAuthPost(url, {
        body: { task_ids: [taskId] },
        contentType: "application/json"
      });
      
      if (response && !response.error) {
        return { taskId };
      } else {
        return rejectWithValue("Failed to restore task: " + (response?.error || "Unknown error"));
      }
    } catch (err) {
      return rejectWithValue(err.message || "Failed to restore task");
    }
  }
);

// Async thunk to restore multiple tasks in bulk
export const bulkRestoreTasks = createAsyncThunk(
  "trash/bulkRestoreTasks",
  async ({ taskIds, userId }, { rejectWithValue }) => {
    try {
      const baseURL = import.meta.env.VITE_APP_DJANGO;
      
      if (!taskIds || !taskIds.length) {
        return rejectWithValue("No taskIds provided");
      }
      
      const url = `${baseURL}/task/restore/bulk/`;
      
      // Use the API endpoint with the specified payload format
      const response = await fetchAuthPost(url, {
        body: { task_ids: taskIds },
        contentType: "application/json"
      });
      
      if (response && !response.error) {
        return { taskIds };
      } else {
        return rejectWithValue("Failed to bulk restore tasks: " + (response?.error || "Unknown error"));
      }
    } catch (err) {
      return rejectWithValue(err.message || "Failed to bulk restore tasks");
    }
  }
);

// Async thunk to permanently delete multiple tasks
export const permanentDeleteTasks = createAsyncThunk(
  "trash/permanentDeleteTasks",
  async ({ taskIds, userId }, { rejectWithValue }) => {
    try {
      const baseURL = import.meta.env.VITE_APP_DJANGO;
      
      if (!taskIds || !taskIds.length) {
        return rejectWithValue("No taskIds provided");
      }
      
      const url = `${baseURL}/tasks/permanent-delete/`;
      
      // Use the API endpoint with the specified payload format
      const response = await fetchAuthPost(url, {
        body: { task_ids: taskIds },
        contentType: "application/json"
      });
      
      if (response && response.status === 1) {
        return { taskIds, deletedCount: response.deleted_count };
      } else {
        return rejectWithValue("Failed to permanently delete tasks: " + (response?.message || "Unknown error"));
      }
    } catch (err) {
      return rejectWithValue(err.message || "Failed to permanently delete tasks");
    }
  }
);

const trashSlice = createSlice({
  name: "trash",
  initialState: {
    deletedTasks: [],
    count: 0,
    loading: false,
    restoring: false,
    restoringTasks: [], // Array to track which tasks are being restored
    deletingTasks: [], // Array to track which tasks are being permanently deleted
    error: null,
    selectedTasks: [],
    needsReload: false, // Flag to indicate if we need to reload data
  },
  reducers: {
    toggleTaskSelection: (state, action) => {
      const taskId = action.payload;
      const index = state.selectedTasks.indexOf(taskId);
      
      if (index === -1) {
        state.selectedTasks.push(taskId);
      } else {
        state.selectedTasks.splice(index, 1);
      }
    },
    selectAllTasks: (state, action) => {
      if (state.selectedTasks.length === state.deletedTasks.length) {
        state.selectedTasks = [];
      } else {
        state.selectedTasks = state.deletedTasks.map(task => task.taskId);
      }
    },
    clearTaskSelection: (state) => {
      state.selectedTasks = [];
    },
    setNeedsReload: (state, action) => {
      state.needsReload = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeletedTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.needsReload = false; // Reset reload flag when starting to fetch
      })
      .addCase(fetchDeletedTasks.fulfilled, (state, action) => {
        state.loading = false;
        
        // Check if this is a pagination request
        if (action.payload.append) {
          // Make sure we don't add duplicate items when appending
          const existingIds = new Set(state.deletedTasks.map(task => task.taskId));
          const newTasks = action.payload.deletedTasks.filter(task => !existingIds.has(task.taskId));
          
          // Append new tasks
          state.deletedTasks = [
            ...state.deletedTasks,
            ...newTasks
          ];
        } else {
          // Replace with new tasks
          state.deletedTasks = action.payload.deletedTasks;
        }
        
        // Always update the total count
        state.count = action.payload.count;
      })
      .addCase(fetchDeletedTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(restoreTask.pending, (state, action) => {
        // Add the taskId to the restoringTasks array
        const taskId = action.meta.arg.taskId;
        if (!state.restoringTasks.includes(taskId)) {
          state.restoringTasks.push(taskId);
        }
        state.restoring = state.restoringTasks.length > 0;
      })
      .addCase(restoreTask.fulfilled, (state, action) => {
        // Remove the taskId from restoringTasks
        const taskId = action.payload.taskId;
        state.restoringTasks = state.restoringTasks.filter(id => id !== taskId);
        state.restoring = state.restoringTasks.length > 0;
        
        // Filter out the restored task
        state.deletedTasks = state.deletedTasks.filter(
          task => task.taskId !== action.payload.taskId
        );
        state.count -= 1;
        
        // Remove from selected tasks if it was selected
        const index = state.selectedTasks.indexOf(action.payload.taskId);
        if (index !== -1) {
          state.selectedTasks.splice(index, 1);
        }
      })
      .addCase(restoreTask.rejected, (state, action) => {
        // Remove the taskId from restoringTasks
        const taskId = action.meta.arg.taskId;
        state.restoringTasks = state.restoringTasks.filter(id => id !== taskId);
        state.restoring = state.restoringTasks.length > 0;
        state.error = action.payload;
      })
      .addCase(bulkRestoreTasks.pending, (state, action) => {
        // Add all taskIds to restoringTasks
        const taskIds = action.meta.arg.taskIds;
        state.restoringTasks = [...new Set([...state.restoringTasks, ...taskIds])];
        state.restoring = state.restoringTasks.length > 0;
      })
      .addCase(bulkRestoreTasks.fulfilled, (state, action) => {
        // Remove all taskIds from restoringTasks
        const taskIds = action.payload.taskIds;
        state.restoringTasks = state.restoringTasks.filter(id => !taskIds.includes(id));
        state.restoring = state.restoringTasks.length > 0;
        
        // Filter out all the restored task IDs
        const restoredTaskIds = new Set(action.payload.taskIds);
        state.deletedTasks = state.deletedTasks.filter(
          task => !restoredTaskIds.has(task.taskId)
        );
        
        // Update count
        state.count -= action.payload.taskIds.length;
        
        // Clear all selected tasks (since they've been restored)
        state.selectedTasks = state.selectedTasks.filter(
          taskId => !restoredTaskIds.has(taskId)
        );
      })
      .addCase(bulkRestoreTasks.rejected, (state, action) => {
        // Remove all taskIds from restoringTasks
        const taskIds = action.meta.arg.taskIds;
        state.restoringTasks = state.restoringTasks.filter(id => !taskIds.includes(id));
        state.restoring = state.restoringTasks.length > 0;
        state.error = action.payload;
      })
      .addCase(permanentDeleteTasks.pending, (state, action) => {
        // Add all taskIds to deletingTasks
        const taskIds = action.meta.arg.taskIds;
        state.deletingTasks = [...new Set([...state.deletingTasks, ...taskIds])];
      })
      .addCase(permanentDeleteTasks.fulfilled, (state, action) => {
        // Remove all taskIds from deletingTasks
        const taskIds = action.payload.taskIds;
        state.deletingTasks = state.deletingTasks.filter(id => !taskIds.includes(id));
        
        // Filter out all the permanently deleted task IDs
        const deletedTaskIds = new Set(action.payload.taskIds);
        state.deletedTasks = state.deletedTasks.filter(
          task => !deletedTaskIds.has(task.taskId)
        );
        
        // Update count
        state.count -= action.payload.deletedCount;
        
        // Clear all selected tasks (since they've been deleted)
        state.selectedTasks = state.selectedTasks.filter(
          taskId => !deletedTaskIds.has(taskId)
        );
        
        // Set reload flag if we have no tasks but more are available
        if (state.deletedTasks.length === 0 && state.count > 0) {
          state.needsReload = true;
        }
      })
      .addCase(permanentDeleteTasks.rejected, (state, action) => {
        // Remove all taskIds from deletingTasks
        const taskIds = action.meta.arg.taskIds;
        state.deletingTasks = state.deletingTasks.filter(id => !taskIds.includes(id));
        state.error = action.payload;
      });
  },
});

export const { toggleTaskSelection, selectAllTasks, clearTaskSelection, setNeedsReload } = trashSlice.actions;
export default trashSlice.reducer; 