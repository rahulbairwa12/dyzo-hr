import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import {
  fetchAuthGET,
  fetchAuthPost,
  fetchAuthPut,
  fetchDelete,
  fetchAuthFilePost,
  fetchAuthDeleteWithBody,
  fetchAuthPatch,
  fetchAuthDelete,
  fetchAuthPatchSumit,
} from "@/store/api/apiSlice";
import moment from "moment";

// LocalStorage key for persisting task filters
const STORAGE_KEY = "taskFilters";

// Attempt to read filters from localStorage at startup
let persistedFilters = {};
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    persistedFilters = JSON.parse(saved) || {};
  }
} catch (err) {
  console.warn("Unable to read task filters from localStorage", err);
}

// Default filter values
const defaultFilters = {
  tab: "my", // all, my, assigned, mentioned, recurring, imported
  searchQuery: "",
  projectId: "",

  taskPosition: "",
  priority: "",
  userId: "",
  assignById: "",
  collaboratorId: "",
  isImported: false,
  isRecurring: false,
  repeat: "",
  dateRange: { startDate: "", endDate: "" },
};

// Merge persisted filters with defaults
const mergedInitialFilters = { ...defaultFilters, ...persistedFilters };

// Enhanced fetchTasks thunk with infinite scroll support
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",

  async (
    { pageNo = 1, forceRefresh = false, searchQuery = "", append = false, customPageSize = null },

    { getState, dispatch, signal },
  ) => {
    const userInfo = getState().auth.user;
    const state = getState().tasks;
    const { filters, pagination } = state;
    const pageSize = customPageSize || pagination.pageSize;

    if (!userInfo?._id || !userInfo?.companyId)
      return { results: [], count: 0, append: false };

    // If isRecurring is true, use fetchRecurringTasks instead
    if (filters.isRecurring) {
      const result = await dispatch(fetchRecurringTasks({ pageNo })).unwrap();
      return result;
    }

    try {
      // Build URL with filters
      let filterStr = "";

      // Handle task status/position parameters
      if (filters.taskPosition) {
        filterStr += `&taskPosition=${filters.taskPosition}`;
      }
      if (filters.priority) {
        filterStr += `&priority=${filters.priority}`;
      }
      // Add other filters
      if (filters.projectId) filterStr += `&projectId=${filters.projectId}`;
      if (filters.userId) filterStr += `&userId=${filters.userId}`;
      if (filters.priority) filterStr += `&priority=${filters.priority}`;
      // Handle search query - prioritize parameter over filter state
      const searchTerm = searchQuery || filters.searchQuery;
      if (searchTerm) {
        filterStr += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
        filterStr += `&startDate=${filters.dateRange.startDate}&endDate=${filters.dateRange.endDate}`;
      }
      if (filters.assignById) filterStr += `&assignById=${filters.assignById}`;
      if (filters.collaboratorId)
        filterStr += `&collaboratorId=${filters.collaboratorId}`;
      if (filters.repeat) filterStr += `&repeat=${filters.repeat}`;

      // Add isImported flag if it exists
      if (filters.isImported === true) {
        filterStr += `&isImported=true`;
        // Add assignById parameter for imported tasks
        filterStr += `&assignById=${userInfo?._id}`;
      }

      // Check if we're in a browser environment and can access window.location
      const isFromProject = typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('from_project') === 'true';

      // Build the base URL based on user type
      let url = "";
      if (userInfo?.user_type === "client") {
        let dateParams = "";
        if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
          dateParams = `&startdate=${filters.dateRange.startDate}&endDate=${filters.dateRange.endDate}`;
        }
        // For client, only add user parameter if not from_project
        const userParam = isFromProject ? '' : `&userId=${userInfo._id}`;
        url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/${userInfo._id}/tasks/?page=${pageNo}&page_size=${pageSize}${dateParams}${userParam}${filterStr}`;
      } else {
        // Check if user is admin
        const isAdmin =
          getState().auth.user?.role === "admin" ||
          getState().auth.user?.isAdmin;

        if (isAdmin) {
          // For admin, only add user parameter if not from_project
          const userParam = isFromProject ? '' : `&userId=${userInfo._id}`;
          url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/${userInfo._id}/tasks/?page=${pageNo}&page_size=${pageSize}&startdate=${filters.dateRange?.startDate || ""}&endDate=${filters.dateRange?.endDate || ""}${filterStr}${userParam}`;
        } else {
          // For regular user, only add user parameter if not from_project
          const userParam = isFromProject ? '' : `&userId=${userInfo._id}`;
          url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/${userInfo._id}/tasks/?page=${pageNo}&page_size=${pageSize}&startdate=${filters.dateRange?.startDate || ""}&endDate=${filters.dateRange?.endDate || ""}${filterStr}${userParam}`;
        }
      }

      // Make the API call
      const data = await fetchAuthGET(url, false, { signal });

      return {
        results: data?.results || [],
        count: data?.count || 0,
        pageNo,
        append, // Pass through the append flag
      };
    } catch (error) {
      if (error.name === "AbortError") {
        // Return a special value to indicate abort
        return { aborted: true };
      }
      console.error("Error fetching tasks:", error);
      throw error;
    }
  },
);

// Search tasks function
export const searchTasks = createAsyncThunk(
  "tasks/searchTasks",
  async ({ query, pageNumber = 1, filters }, { getState, rejectWithValue, signal }) => {
    try {

      const userInfo = getState().auth.user;
      const pageSize = getState().tasks.pagination.pageSize;

      if (!query.trim()) {
        return rejectWithValue("Empty search query");
      }

      // Build URL with filters
      const companyId = userInfo?.companyId;
      let url = `${import.meta.env.VITE_APP_DJANGO}/api/tasks/search/?search=${encodeURIComponent(query)}&company_id=${companyId}&page=${pageNumber}&page_size=${pageSize}`;

      // Apply filters if provided
      if (filters) {
        // Project filter
        if (filters.projectId) {
          url += `&project_id=${encodeURIComponent(filters.projectId)}`;
        }

        // Task position/status filter
        if (filters.taskPosition && Array.isArray(filters.taskPosition) && filters.taskPosition.length > 0) {
          url += `&taskPosition=${encodeURIComponent(filters.taskPosition.join(','))}`;
        }

        // Priority filter
        if (filters.priority) {
          url += `&priority=${encodeURIComponent(filters.priority)}`;
        }

        // Date range filter
        if (filters.dateRange) {
          if (filters.dateRange.startDate) {
            url += `&start_date=${encodeURIComponent(filters.dateRange.startDate)}`;
          }
          if (filters.dateRange.endDate) {
            url += `&end_date=${encodeURIComponent(filters.dateRange.endDate)}`;
          }
        }

        // User ID filter
        if (filters.userId) {
          url += `&user_id=${encodeURIComponent(filters.userId)}`;
        }


      }

      const response = await fetchAuthGET(url, false, { signal });

      const data = response.data;
      if (data?.status === 1 && data?.data?.results) {
        return {
          results: data.data.results,
          count: data.data.count || data.data.results.length,
          pageNumber,
          hasResults: data.data.results.length > 0,
        };
      } else {
        return {
          results: [],
          count: 0,
          pageNumber,
          hasResults: false,
        };
      }
    } catch (error) {
      if (error.name === "AbortError") {
        return rejectWithValue("Request canceled");
      }
      return rejectWithValue(error.message || "Failed to search tasks");
    }
  },
);

// Fetch task statuses
export const fetchTaskStatus = createAsyncThunk(
  "tasks/fetchTaskStatus",
  async (_, { getState, rejectWithValue }) => {
    try {
      const userInfo = getState().auth.user;
      if (!userInfo?.companyId) {
        return rejectWithValue("User company ID not found");
      }

      const data = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo.companyId}/project-status/`,
        false
      );

      return data?.data?.unique_statuses || [];
    } catch (error) {
      console.error("Error fetching task status:", error);
      return rejectWithValue(error.message || "Failed to fetch task statuses");
    }
  },
);

// New async thunk to fetch task time data
export const fetchTaskTimeData = createAsyncThunk(
  "tasks/fetchTaskTimeData",
  async (taskId, { rejectWithValue }) => {
    try {
      if (!taskId || taskId === "-") {
        return { total_time: null, timer_type: null };
      }

      const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/task-details/${taskId}/`;
      const data = await fetchAuthGET(apiUrl, false);

      if (data?.data) {
        return {
          taskId,
          total_time: data.data.total_time,
          timer_type: data.data.timer_type,
        };
      }

      return { taskId, total_time: null, timer_type: null };
    } catch (error) {
      console.error("Error fetching task time data:", error);
      return rejectWithValue("Failed to fetch task time data");
    }
  },
);

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (task, { getState, rejectWithValue }) => {
    try {
      const userInfo = getState().auth.user;
      if (!userInfo?._id) {
        return rejectWithValue("User not authenticated");
      }

      // Create FormData for API request

      const formData = new FormData();
      formData.append("taskName", task.taskName || "");
      formData.append("dueDate", task.dueDate || "");
      formData.append("userId", task.userId || userInfo._id);

      // Add assigned_users if available (for multiple user assignments)
      if (
        task.assigned_users &&
        Array.isArray(task.assigned_users) &&
        task.assigned_users.length > 0
      ) {
        formData.append("assigned_users", JSON.stringify(task.assigned_users));
      }

      // Handle client user type
      if (userInfo.user_type === "client") {
        formData.append("clientId", userInfo._id);
      }

      // Get project ID from task or URL
      const urlParams = new URLSearchParams(window.location.search);
      const queryProjectId = urlParams.get("projectId");

      // Get project ID from path if present (for project detail pages)
      const getProjectIdFromPath = () => {
        const pathParts = window.location.pathname.split("/");
        if (pathParts.includes("project-details")) {
          const projectIdIndex = pathParts.indexOf("project-details") + 1;
          if (projectIdIndex < pathParts.length) {
            return pathParts[projectIdIndex];
          }
        }
        return null;
      };

      const pathProjectId = getProjectIdFromPath();
      const projectId =
        task.projectId ||
        queryProjectId ||
        pathProjectId ||
        userInfo?.default_project_id;
      formData.append("projectId", projectId);

      // Add priority and taskPosition fields
      formData.append("priority", task.priority || "low");
      formData.append("taskPosition", task.taskPosition || "not_started_yet");

      // EXACT SAME CODE AS IN DynamicTaskRow.jsx
      formData.append("collaborators", [userInfo._id]);


      // Make API request - using fetchAuthFilePost like in DynamicTaskRow.jsx
      const response = await fetchAuthFilePost(
        `${import.meta.env.VITE_APP_DJANGO}/create-task/${userInfo._id}/`,
        { body: formData },
      );

      if (response.status === 1) {
        // Make sure we include the correct task name in the response

        // Return both the temporary ID and the new task data
        return {
          tempId: task._id,
          taskId: response.taskId,
          taskCode: response.taskCode,
          ...task, // Keep all task properties
          taskName: task.taskName, // Explicitly include task name to ensure it's present
          taskPosition: task.taskPosition || "not_started_yet", // Use the actual taskPosition from the task
          initial: false,
          isEditing: false,
          assigned_users: response.assigned_users,
        };
      } else {
        return rejectWithValue(response.message || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      return rejectWithValue(error.message || "Failed to create task");
    }
  },
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ taskId, data }, { getState }) => {
    const userInfo = getState().auth.user;

    // Ensure taskId is in the correct format
    const taskIdNum = Number(taskId);
    if (isNaN(taskIdNum)) {
      throw new Error(`Invalid task ID: ${taskId}`);
    }

    const url = `${import.meta.env.VITE_APP_DJANGO}/task/${taskIdNum}/${userInfo._id}/`;
    const response = await fetchAuthPatchSumit(url, {
      body: data,
      contentType: "application/json",
    });
    return response;
  },
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId, { getState }) => {
    const url = `${import.meta.env.VITE_APP_DJANGO}/tasks/${taskId}/`;
    await fetchDelete(url);
    return taskId;
  },
);

export const toggleTaskStatus = createAsyncThunk(
  "tasks/toggleTaskStatus",
  async ({ taskId, newStatus }, { getState }) => {
    const url = `${import.meta.env.VITE_APP_DJANGO}/tasks/${taskId}/`;
    const response = await fetchAuthPut(url, {
      body: { taskPosition: newStatus },
    });
    return response.data;
  },
);

export const deleteBulkTasks = createAsyncThunk(
  "tasks/deleteBulkTasks",
  async (taskIds, { getState, rejectWithValue }) => {
    try {
      const userInfo = getState().auth.user;

      if (!userInfo?._id) {
        return rejectWithValue("User not authenticated");
      }

      if (!taskIds || !taskIds.length) {
        return rejectWithValue("No tasks selected for deletion");
      }

      // Separate local-only tasks from server tasks
      const tasks = getState().tasks.tasks;
      const localTaskIds = [];
      const serverTaskIds = [];

      taskIds.forEach((id) => {
        const task = tasks.find((t) => t._id === id);
        // Check if it's a local-only task (has temporary ID starting with 'new-' or has initial flag)
        if (task && (String(task._id).startsWith("new-") || task.initial)) {
          localTaskIds.push(id);
        } else {
          serverTaskIds.push(id);
        }
      });

      // If we have server tasks, send them to the API
      if (serverTaskIds.length > 0) {
        // Convert string IDs to integers if needed
        const parsedTaskIds = serverTaskIds.map((id) => {
          // Try to parse as integer if it's a string
          const numId = typeof id === "string" ? parseInt(id, 10) : id;
          return isNaN(numId) ? id : numId;
        });

        const payload = {
          tasks: parsedTaskIds,
        };

        const response = await fetchAuthPost(
          `${import.meta.env.VITE_APP_DJANGO}/delete-tasks/${userInfo._id}/`,
          { body: payload },
        );

        if (response.status !== 1) {
          return rejectWithValue(response.message || "Failed to delete tasks");
        }
      }

      // Return all task IDs (both local and server) to be removed from state
      return taskIds;
    } catch (error) {
      console.error("Error in deleteBulkTasks:", error);
      return rejectWithValue(error.message || "Failed to delete tasks");
    }
  },
);

export const bulkUpdateTasks = createAsyncThunk(
  "tasks/bulkUpdateTasks",
  async ({ taskIds, updateData }, { getState, rejectWithValue }) => {
    try {
      const userInfo = getState().auth.user;

      if (!userInfo?._id) {
        return rejectWithValue("User not authenticated");
      }

      if (!taskIds || !taskIds.length) {
        return rejectWithValue("No tasks selected for update");
      }

      // Convert string IDs to integers if needed
      const parsedTaskIds = taskIds.map((id) => {
        // Try to parse as integer if it's a string
        const numId = typeof id === "string" ? parseInt(id, 10) : id;
        return isNaN(numId) ? id : numId;
      });

      // Format the payload according to the API requirements
      const payload = {
        tasks: parsedTaskIds,
        action: updateData.action || "update",
      };

      // Add other update fields if they exist
      if (updateData.projectId) payload.projectId = updateData.projectId;
      if (updateData.userId) payload.userId = updateData.userId;
      if (updateData.taskPosition)
        payload.taskPosition = updateData.taskPosition;
      if (updateData.dueDate) payload.dueDate = updateData.dueDate;
      if (updateData.priority) payload.priority = updateData.priority;
      if (updateData.assigned_users)
        payload.assigned_users = updateData.assigned_users;

      const response = await fetchAuthPost(
        `${import.meta.env.VITE_APP_DJANGO}/manage-tasks/${userInfo._id}/`,
        { body: payload },
      );

      if (response.status === 1) {
        return { taskIds, updateData };
      } else {
        return rejectWithValue(response.message || "Failed to update tasks");
      }
    } catch (error) {
      console.error("Error in bulkUpdateTasks:", error);
      return rejectWithValue(error.message || "Failed to update tasks");
    }
  },
);

// New async thunk to fetch a single task by ID
export const fetchTaskById = createAsyncThunk(
  "tasks/fetchTaskById",
  async (taskId, { getState, rejectWithValue }) => {
    try {
      const userInfo = getState().auth.user;
      if (!userInfo?._id) {
        return rejectWithValue("User not authenticated");
      }

      // Call API to get task details
      const url = `${import.meta.env.VITE_APP_DJANGO}/task-details/${taskId}/`;
      const response = await fetchAuthGET(url, false);

      if (response?.data) {
        return response.data;
      } else {
        return rejectWithValue("Task not found");
      }
    } catch (error) {
      console.error("Error fetching task by ID:", error);
      return rejectWithValue(error.message || "Failed to fetch task");
    }
  },
);

// New async thunk to fetch task attachments
export const fetchTaskAttachments = createAsyncThunk(
  "tasks/fetchTaskAttachments",
  async (taskId, { getState, rejectWithValue }) => {
    try {
      if (!taskId || taskId === "-") {
        return { taskId, attachments: [] };
      }

      const apiUrl = `${import.meta.env.VITE_APP_DJANGO
        }/api/task/${taskId}/attachments/`;
      const response = await fetchAuthGET(apiUrl, false);

      if (response.status) {
        return {
          taskId,
          attachments: response.attachments || [],
        };
      } else {
        return rejectWithValue("Error in fetch attachments");
      }
    } catch (error) {
      console.error("Error fetching task attachments:", error);
      return rejectWithValue("Failed to fetch task attachments");
    }
  },
);

// New async thunk to delete task attachment
export const deleteTaskAttachment = createAsyncThunk(
  "tasks/deleteTaskAttachment",
  async ({ taskId, attachmentId }, { getState, rejectWithValue }) => {
    try {
      if (!taskId || taskId === "-" || !attachmentId) {
        return rejectWithValue("Invalid task ID or attachment ID");
      }

      const apiUrl = `${import.meta.env.VITE_APP_DJANGO
        }/api/task/${taskId}/attachments/${attachmentId}/`;

      const response = await fetchDelete(apiUrl);

      if (response.status) {
        return {
          taskId,
          attachmentId,
          message: response.message || "Attachment deleted successfully",
        };
      } else {
        return rejectWithValue("Delete Attachment Failed");
      }
    } catch (error) {
      console.error("Error deleting task attachment:", error);
      return rejectWithValue("Failed to delete task attachment");
    }
  },
);

// New async thunk to fetch a task by ID using the search API
export const fetchTaskBySearch = createAsyncThunk(
  "tasks/fetchTaskBySearch",
  async (taskId, { getState, rejectWithValue }) => {
    try {
      const userInfo = getState().auth.user;

      if (!userInfo?._id || !userInfo?.companyId) {
        return rejectWithValue("User not authenticated or company ID missing");
      }

      // Call search API with the task ID as the search query
      const companyId = userInfo.companyId;
      const url = `${import.meta.env.VITE_APP_DJANGO}/api/tasks/search/?search=${encodeURIComponent(taskId)}&company_id=${companyId}&page=1&page_size=1`;

      const response = await fetchAuthGET(url, false);

      // The search API returns data in two possible formats:
      // 1. Direct format: { count, results: [...] }
      // 2. Nested format: { status: 1, data: { count, results: [...] } }
      const data = response.data?.data || response.data || response;

      if (data?.results && data.results.length > 0) {
        // Find the exact task with matching ID
        const task = data.results.find(
          (task) => String(task.taskId) === String(taskId),
        );

        if (task) {
          return task;
        }
      }

      return rejectWithValue("Task not found");
    } catch (error) {
      console.error("Error fetching task by search:", error);
      return rejectWithValue(error.message || "Failed to fetch task");
    }
  },
);

// The updated fetchRecurringTasks that we'll keep
export const fetchRecurringTasks = createAsyncThunk(
  "tasks/fetchRecurringTasks",
  async ({ pageNo = 1, pageSize = 35 } = {}, { getState, rejectWithValue }) => {
    const userInfo = getState().auth.user;

    if (!userInfo?._id || !userInfo?.companyId) {
      return rejectWithValue("User not authenticated or missing company ID");
    }

    try {
      // Build URL for recurring tasks (correct endpoint)
      const url = `${import.meta.env.VITE_APP_DJANGO}/api/companies/${userInfo.companyId}/${userInfo._id}/recurring-tasks/?page=${pageNo}&page_size=${pageSize}`;

      // Make the API call
      const response = await fetchAuthGET(url, false);

      // Extract data from the results object
      const data = response?.results?.data || [];
      const count = response?.results?.count || data.length;
      const totalPages =
        response?.results?.total_pages || Math.ceil(count / pageSize);
      return {
        results: data,
        count,
        pageNo,
        pagination: {
          currentPage: pageNo,
          pageSize,
          totalCount: count,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching recurring tasks:", error);
      return rejectWithValue(
        error.message || "Failed to fetch recurring tasks",
      );
    }
  },
);

// Add recurring task create thunk
export const createRecurringTask = createAsyncThunk(
  "tasks/createRecurringTask",
  async (payload, { rejectWithValue, getState }) => {

    try {
      const baseUrl = import.meta.env.VITE_APP_DJANGO;
      const response = await fetchAuthPost(
        `${baseUrl}/api/create-recurring-task/${payload.userInfo._id}/`,
        { body: payload },
      );

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Add a new thunk to update recurring task and sync with server
export const syncRecurringTaskUpdate = createAsyncThunk(
  "tasks/syncRecurringTaskUpdate",
  async (taskData, { dispatch, rejectWithValue }) => {
    try {
      // Update local state immediately for responsive UI
      if (taskData._id && String(taskData._id).startsWith("new-recurring-")) {
        // Only update local state for new tasks, don't sync to server
        dispatch(updateRecurringTaskInState(taskData));
        return { success: true, taskData, isNewTask: true };
      }

      dispatch(updateRecurringTaskInState(taskData));

      // Then update server

      const result = await dispatch(
        updateRecurringTask({
          taskId: taskData._id || taskData.id,
          data: taskData,
        }),
      ).unwrap();

      if (!result || result.status !== 1) {
        return rejectWithValue(
          result?.message || "Failed to update recurring task on server",
        );
      }

      return { success: true, taskData };
    } catch (error) {
      return rejectWithValue(error.message || "Error updating recurring task");
    }
  },
);

// Update recurring task thunk
export const updateRecurringTask = createAsyncThunk(
  "tasks/updateRecurringTask",
  async ({ taskId, data }, { rejectWithValue }) => {
    try {
      const baseUrl = import.meta.env.VITE_APP_DJANGO;
      const response = await fetchAuthPatchSumit(
        `${baseUrl}/api/update-recurring-task/${taskId}/`,
        { body: data, contentType: "application/json" },
      );

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// Add deleteRecurringTask async thunk
export const deleteRecurringTask = createAsyncThunk(
  "tasks/deleteRecurringTask",
  async (taskId, { rejectWithValue }) => {
    try {
      const baseUrl = import.meta.env.VITE_APP_DJANGO;
      await fetchAuthDelete(`${baseUrl}/api/delete-recurring-task/${taskId}/`);

      // If we reach here, the deletion was successful
      return taskId;
    } catch (error) {
      console.error("Delete recurring task error:", error);
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        "Failed to delete recurring task",
      );
    }
  },
);

// Delete bulk recurring tasks thunk
export const deleteBulkRecurringTasks = createAsyncThunk(
  "tasks/deleteBulkRecurringTasks",
  async (taskIds, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userInfo = state.auth.user;

      if (!userInfo?._id) {
        return rejectWithValue("User not authenticated");
      }

      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return rejectWithValue("No tasks selected for deletion");
      }

      // Split the selected ids into local-only (temporary) and server ones
      const localOnlyIds = [];
      const serverIds = [];

      taskIds.forEach((id) => {
        const t = state.tasks.recurringTasks.find(
          (rt) => (rt._id || rt.id) === id,
        );
        const isTemp = String(id).startsWith("new-recurring-") || t?.initial;
        if (isTemp) {
          localOnlyIds.push(id);
        } else {
          serverIds.push(id);
        }
      });

      // If we have server ids, send them to API
      if (serverIds.length > 0) {
        const response = await fetchAuthDeleteWithBody(
          `${import.meta.env.VITE_APP_DJANGO}/api/recurring-tasks/bulk-delete/`,
          {
            body: { ids: serverIds },
          },
        );

        if (
          !(
            response.status === 1 ||
            response.status === true ||
            response.status === "success"
          )
        ) {
          return rejectWithValue(response.message || "Failed to delete tasks");
        }
      }

      // Return all ids (local + server) to be removed from redux state
      return taskIds;
    } catch (error) {
      console.error("Error in deleteBulkRecurringTasks:", error);
      return rejectWithValue(error.message || "Failed to delete tasks");
    }
  },
);

// Add emptyTaskWarning to initialState
const initialState = {
  tasks: [],
  selectedTasks: [],
  selectedTask: null,
  isTaskPanelOpen: false,
  isPanelVisible: false,
  activeTaskTab: -1, // Add active tab state for task panel
  loading: false,
  loadingMore: false, // New state for infinite scroll loading
  searching: false,
  error: null,
  emptyTaskWarning: false, // New state for warning on empty tasks
  taskTimeData: {},

  taskAttachments: [],
  deletingAttachment: false,
  currentTaskNameInput: "", // New state for task name input
  filters: mergedInitialFilters,
  pagination: {
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasMore: true, // New flag for infinite scroll
  },
  abortController: null,

  // New state properties for recurring tasks
  recurringTasks: [],
  selectedRecurringTasks: [], // New state for selected recurring tasks
  recurringTasksLoading: false,
  recurringTasksError: null,
  newRecurringTask: null,
  isCreatingRecurringTask: false,
  createRecurringTaskError: null,
  recurringTasksPagination: {
    currentPage: 1,
    pageSize: 35,
    totalCount: 0,
    totalPages: 1,
  },
};

// Add setEmptyTaskWarning action
export const setEmptyTaskWarning = createAction("tasks/setEmptyTaskWarning");

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTaskNameInput: (state, action) => {
      state.currentTaskNameInput = action.payload;
    },
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
      state.isTaskPanelOpen = !!action.payload;
    },
    toggleTaskPanel: (state, action) => {
      state.isTaskPanelOpen =
        action.payload !== undefined ? action.payload : !state.isTaskPanelOpen;
    },
    togglePanelVisibility: (state, action) => {
      state.isPanelVisible =
        action.payload !== undefined ? action.payload : !state.isPanelVisible;
    },
    setActiveTaskTab: (state, action) => {
      state.activeTaskTab = action.payload;
    },
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
      const shouldSelect = action.payload;
      if (shouldSelect) {
        state.selectedTasks = state.tasks.map((task) => task._id);
      } else {
        state.selectedTasks = [];
      }
    },
    clearSelectedTasks: (state) => {
      state.selectedTasks = [];
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset to first page when filters change and clear tasks for fresh load
      state.pagination.currentPage = 1;
      state.pagination.hasMore = true;
      state.tasks = []; // Clear tasks when filters change
      // Persist filters
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.filters));
      } catch (err) {
        console.warn("Unable to persist task filters", err);
      }
    },
    setActiveTab: (state, action) => {
      const tabId = action.payload.tabId;
      const userId = action.payload.userId;

      // Save existing filter values that should persist across tab changes
      const currentFilters = { ...state.filters };
      const savedFilters = {
        projectId: currentFilters.projectId,
        taskPosition: currentFilters.taskPosition,

        priority: currentFilters.priority,
        dateRange: currentFilters.dateRange,
        repeat: currentFilters.repeat,

        // Keep any other filters you want to persist
      };

      // Set appropriate filters based on tab
      switch (tabId) {
        case "all":
        case "RecentTask":
          state.filters.tab = "all";
          // Clear user-specific filters
          state.filters.userId = "";
          state.filters.assignById = "";
          state.filters.collaboratorId = "";
          state.filters.isImported = false;
          state.filters.isRecurring = false;
          break;
        case "my":
        case "MyTask":
          state.filters.tab = "my";
          state.filters.userId = userId;
          state.filters.assignById = "";
          state.filters.collaboratorId = "";
          state.filters.isImported = false;
          state.filters.isRecurring = false;
          break;
        case "assigned":
        case "AssignedTask":
          state.filters.tab = "assigned";
          state.filters.userId = "";
          state.filters.assignById = userId;
          state.filters.collaboratorId = "";
          state.filters.isImported = false;
          state.filters.isRecurring = false;
          break;
        case "mentioned":
        case "MentionedTask":
          state.filters.tab = "mentioned";
          state.filters.userId = "";
          state.filters.assignById = "";
          state.filters.collaboratorId = userId;
          state.filters.isImported = false;
          state.filters.isRecurring = false;
          break;
        case "recurring":
        case "RecurringTask":
          state.filters.tab = "recurring";
          state.filters.userId = "";
          state.filters.assignById = "";
          state.filters.collaboratorId = "";
          state.filters.isImported = false;
          state.filters.isRecurring = true;
          break;
        case "imported":
        case "ImportedTask":
          state.filters.tab = "imported";
          state.filters.isImported = true;
          state.filters.isRecurring = false;
          break;
        default:
          state.filters.tab = "all";
      }

      // Restore saved filters that should persist
      state.filters = {
        ...state.filters,
        ...savedFilters,
      };

      // Reset pagination and clear tasks for fresh load
      state.pagination.currentPage = 1;
      state.pagination.hasMore = true;
      state.tasks = []; // Clear tasks when tab changes

      // Persist filters after tab switch
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.filters));
      } catch (err) {
        console.warn("Unable to persist task filters", err);
      }
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pagination.pageSize = action.payload;
      state.pagination.currentPage = 1;
    },
    setSearchQuery: (state, action) => {
      state.filters.searchQuery = action.payload;
      state.pagination.currentPage = 1;
    },
    // Optimistic update for task properties
    updateTaskProperty: (state, action) => {
      const { taskId, property, value } = action.payload;
      // Normalize to string for safe comparison
      const targetId = String(taskId);

      // Try match by _id OR taskId in the tasks array
      const taskIndex = state.tasks.findIndex(
        (task) => String(task._id) === targetId || String(task.taskId) === targetId
      );

      if (taskIndex !== -1) {
        state.tasks[taskIndex][property] = value;
      }

      // Always update selectedTask if it matches by _id OR taskId
      if (
        state.selectedTask &&
        (String(state.selectedTask._id) === targetId ||
          String(state.selectedTask.taskId) === targetId)
      ) {
        state.selectedTask[property] = value;
      }
    },
    addTask: (state, action) => {
      // Check if we received an object with task and index
      if (action.payload && action.payload.task) {
        const { task, index } = action.payload;

        // If index is provided, insert at that position, otherwise add to beginning
        if (index !== undefined && index >= 0 && index <= state.tasks.length) {
          state.tasks.splice(index, 0, task);
        } else {
          state.tasks.unshift(task);
        }
      } else {
        // Backward compatibility for the old format
        state.tasks.unshift(action.payload);
      }

      // Don't update totalCount for local additions - it will be updated when the API response comes back
      // This allows the display to show more tasks on current page without changing the total
    },
    updateTaskInState: (state, action) => {
      const updatedTask = action.payload;


      // Try to find task by _id with both strict and loose equality
      let index = state.tasks.findIndex(
        (task) => task._id === updatedTask._id,
      );

      // If not found, try with string/number conversion
      if (index === -1) {
        index = state.tasks.findIndex(
          (task) => String(task._id) === String(updatedTask._id),
        );

      }

      if (index !== -1) {


        state.tasks[index] = {
          ...state.tasks[index],
          ...updatedTask,
        };

        if (state.selectedTask && state.selectedTask._id === updatedTask._id) {
          state.selectedTask = {
            ...state.selectedTask,
            ...updatedTask,
          };
        }
      }
    },
    deleteTaskFromState: (state, action) => {
      const taskId = action.payload;
      state.tasks = state.tasks.filter((task) => task._id !== taskId);

      // Update pagination count
      state.pagination.totalCount = Math.max(0, state.pagination.totalCount - 1);
      state.pagination.totalPages = Math.ceil(state.pagination.totalCount / state.pagination.pageSize);

      if (state.selectedTask && state.selectedTask._id === taskId) {
        state.selectedTask = null;
        state.isTaskPanelOpen = false;
      }

      const selectedIndex = state.selectedTasks.indexOf(taskId);
      if (selectedIndex !== -1) {
        state.selectedTasks.splice(selectedIndex, 1);
      }
    },
    // Set the abort controller
    setAbortController: (state, action) => {
      state.abortController = action.payload;
    },
    // Update comment count on a task
    updateTaskCommentCount: (state, action) => {
      const { taskId, newCount } = action.payload;
      const taskIndex = state.tasks.findIndex((task) => task.taskId == taskId);

      if (taskIndex !== -1) {
        state.tasks[taskIndex].total_comments = newCount;

        if (state.selectedTask && state.selectedTask.taskId == taskId) {
          state.selectedTask.total_comments = newCount;
        }
      }
    },
    // Update attachment count on a task
    updateTaskAttachmentCount: (state, action) => {
      const { taskId, count } = action.payload;
      const taskIndex = state.tasks.findIndex((task) => task.taskId === taskId);

      if (taskIndex !== -1) {
        state.tasks[taskIndex].attachmentCount = count;

        if (state.selectedTask && state.selectedTask.taskId === taskId) {
          state.selectedTask.attachmentCount = count;
        }
      }
    },
    // For updating subtask count on a task
    updateTaskSubtaskCount: (state, action) => {
      const { taskId, newCount } = action.payload;
      const taskIndex = state.tasks.findIndex(task => task.taskId == taskId);

      if (taskIndex !== -1) {
        state.tasks[taskIndex].subtask_count = newCount;

        if (state.selectedTask && state.selectedTask.taskId == taskId) {
          state.selectedTask.subtask_count = newCount;
        }
      }
    },
    // Update task time data (for manual time updates)
    updateTaskTimeData: (state, action) => {
      const { taskId, total_time, timer_type } = action.payload;
      const taskIndex = state.tasks.findIndex(task => task.taskId == taskId);

      if (taskIndex !== -1) {
        state.tasks[taskIndex].total_time = total_time;
        if (timer_type !== undefined) {
          state.tasks[taskIndex].timer_type = timer_type;
        }

        // Update taskTimeData cache
        state.taskTimeData[taskId] = {
          total_time,
          timer_type: timer_type !== undefined ? timer_type : state.taskTimeData[taskId]?.timer_type,
        };

        // Update selected task if it matches
        if (state.selectedTask && state.selectedTask.taskId == taskId) {
          state.selectedTask.total_time = total_time;
          if (timer_type !== undefined) {
            state.selectedTask.timer_type = timer_type;
          }
        }
      }
    },
    removeTaskFromState: (state, action) => {
      const taskId = action.payload;
      state.tasks = state.tasks.filter((task) => task._id !== taskId);
    },

    // Add recurring task to state (for temporary new tasks)
    addRecurringTask: (state, action) => {
      state.recurringTasks.unshift(action.payload);
    },

    // Update recurring task in state
    updateRecurringTaskInState: (state, action) => {
      const getKey = (t) => String(t._id ?? t.id);
      const payloadKey = getKey(action.payload);

      const index = state.recurringTasks.findIndex(
        (task) => getKey(task) === payloadKey,
      );

      if (index !== -1) {
        state.recurringTasks[index] = {
          ...state.recurringTasks[index],
          ...action.payload,
          // Keep both keys in sync
          _id:
            state.recurringTasks[index]._id ??
            action.payload._id ??
            action.payload.id,
          id:
            state.recurringTasks[index].id ??
            action.payload.id ??
            action.payload._id,
        };
      }
    },

    // Remove recurring task from state
    removeRecurringTaskFromState: (state, action) => {
      state.recurringTasks = state.recurringTasks.filter(
        (task) => task._id !== action.payload,
      );
    },
    toggleRecurringTaskSelection: (state, action) => {
      const taskId = action.payload;
      const index = state.selectedRecurringTasks.indexOf(taskId);
      if (index === -1) {
        state.selectedRecurringTasks.push(taskId);
      } else {
        state.selectedRecurringTasks.splice(index, 1);
      }
    },
    selectAllRecurringTasks: (state, action) => {
      const shouldSelect = action.payload;
      if (shouldSelect) {
        state.selectedRecurringTasks = state.recurringTasks.map(
          (task) => task._id || task.id,
        );
      } else {
        state.selectedRecurringTasks = [];
      }
    },
    clearSelectedRecurringTasks: (state) => {
      state.selectedRecurringTasks = [];
    },
  },
  extraReducers: (builder) => {
    // Existing task cases
    builder
      .addCase(fetchTasks.pending, (state, action) => {
        // Check if this is loading more (append mode) or initial load
        const isAppending = action.meta.arg?.append === true;
        if (isAppending) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        // Skip updates if the request was aborted
        if (action.payload.aborted) {
          state.loading = false;
          state.loadingMore = false;
          return;
        }

        const isAppending = action.payload.append === true;
        const newResults = action.payload.results || [];
        
        // Helper function to deduplicate tasks based on _id or taskId
        const deduplicateTasks = (tasks) => {
          const seen = new Set();
          return tasks.filter(task => {
            // Use _id as primary identifier, fallback to taskId
            const identifier = task._id || task.taskId;
            if (seen.has(identifier)) {
              return false;
            }
            seen.add(identifier);
            return true;
          });
        };
        
        if (isAppending) {
          // Append new tasks to existing ones, but deduplicate
          const combinedTasks = [...state.tasks, ...newResults];
          state.tasks = deduplicateTasks(combinedTasks);
          state.loadingMore = false;
        } else {
          // Replace tasks with new results, but still deduplicate in case API returns duplicates
          state.tasks = deduplicateTasks(newResults);
          state.loading = false;
        }
        
        state.pagination.totalCount = action.payload.count || 0;
        state.pagination.totalPages = Math.ceil(
          (action.payload.count || 0) / state.pagination.pageSize,
        );
        state.pagination.currentPage = action.payload.pageNo || state.pagination.currentPage;
        
        // Check if there are more tasks to load
        state.pagination.hasMore = state.tasks.length < state.pagination.totalCount;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.error.message;
      })

      // searchTasks reducers
      .addCase(searchTasks.pending, (state) => {
        state.searching = true;
        state.error = null;
      })
      .addCase(searchTasks.fulfilled, (state, action) => {
        // Helper function to deduplicate tasks based on _id or taskId
        const deduplicateTasks = (tasks) => {
          const seen = new Set();
          return tasks.filter(task => {
            // Use _id as primary identifier, fallback to taskId
            const identifier = task._id || task.taskId;
            if (seen.has(identifier)) {
              return false;
            }
            seen.add(identifier);
            return true;
          });
        };
        
        state.tasks = deduplicateTasks(action.payload.results || []);
        state.pagination.totalCount = action.payload.count || 0;
        state.pagination.totalPages = Math.ceil(
          (action.payload.count || 0) / state.pagination.pageSize,
        );
        state.pagination.currentPage =
          action.payload.pageNumber || state.pagination.currentPage;
        state.searching = false;
      })
      .addCase(searchTasks.rejected, (state, action) => {
        state.searching = false;
        // Don't set error for canceled requests
        if (action.payload !== "Request canceled") {
          state.error = action.payload || action.error.message;
        }
      })

      // fetchTaskStatus reducers
      .addCase(fetchTaskStatus.fulfilled, (state, action) => {
        state.taskStatuses = action.payload;
      })

      // fetchTaskTimeData reducers
      .addCase(fetchTaskTimeData.fulfilled, (state, action) => {
        if (action.payload && action.payload.taskId) {
          state.taskTimeData[action.payload.taskId] = {
            total_time: action.payload.total_time,
            timer_type: action.payload.timer_type,
          };

          // Update the task in the tasks array if it exists
          const taskIndex = state.tasks.findIndex(
            (task) => task.taskId === action.payload.taskId,
          );
          if (taskIndex !== -1) {
            state.tasks[taskIndex].total_time = action.payload.total_time;
            state.tasks[taskIndex].timer_type = action.payload.timer_type;
          }

          // Update selected task if it matches
          if (
            state.selectedTask &&
            state.selectedTask.taskId === action.payload.taskId
          ) {
            state.selectedTask.total_time = action.payload.total_time;
            state.selectedTask.timer_type = action.payload.timer_type;
          }
        }
      })

      // fetchTaskAttachments reducers
      .addCase(fetchTaskAttachments.fulfilled, (state, action) => {
        if (action.payload && action.payload.taskId) {
          // Store attachments as array directly
          state.taskAttachments = action.payload.attachments || [];

          // Update the task in the tasks array if it exists
          const taskIndex = state.tasks.findIndex(
            (task) => task.taskId === action.payload.taskId,
          );
          if (taskIndex !== -1) {
            state.tasks[taskIndex].attachments = action.payload.attachments;
            state.tasks[taskIndex].attachmentCount =
              action.payload.attachments.length;
          }

          // Update selected task if it matches
          if (
            state.selectedTask &&
            state.selectedTask.taskId === action.payload.taskId
          ) {
            state.selectedTask.attachments = action.payload.attachments;
            state.selectedTask.attachmentCount =
              action.payload.attachments.length;
          }
        }
      })
      .addCase(fetchTaskAttachments.rejected, (state, action) => {
        console.error("Failed to fetch task attachments:", action.payload);
      })

      // createTask reducers
      .addCase(createTask.pending, (state, action) => {
        // Set loading state for the specific task
        const { _id } = action.meta.arg;
        const taskIndex = state.tasks.findIndex((task) => task._id === _id);
        if (taskIndex !== -1) {
          state.tasks[taskIndex].isLoading = true;
        }
      })
      .addCase(createTask.fulfilled, (state, action) => {
        if (action.payload) {
          // Find the task with temporary ID
          const tempId = action.meta.arg._id;
          const taskIndex = state.tasks.findIndex(
            (task) => task._id === tempId,
          );

          if (taskIndex !== -1) {
            // Update existing task with real ID and data from server
            state.tasks[taskIndex] = {
              ...state.tasks[taskIndex],
              ...action.payload, // Include all properties from the payload, including taskName
              _id: action.payload.taskId,
              taskId: action.payload.taskId,
              initial: false,
              isEditing: false,
              isLoading: false,
            };

            // Now increment the total count since the task is confirmed by the API
            state.pagination.totalCount += 1;
            state.pagination.totalPages = Math.ceil(state.pagination.totalCount / state.pagination.pageSize);
          } else {
            // If not found (unlikely), add as new task
            state.tasks.unshift({
              ...action.payload,
              initial: false,
              isEditing: false,
            });
            // Update pagination count for new task
            state.pagination.totalCount += 1;
            state.pagination.totalPages = Math.ceil(state.pagination.totalCount / state.pagination.pageSize);
          }
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        // Handle rejection - remove the failed task from local state
        const { _id } = action.meta.arg;
        state.tasks = state.tasks.filter((task) => task._id !== _id);
        // No need to update totalCount since it wasn't incremented for local addition
      })

      // updateTask reducers
      .addCase(updateTask.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        if (updatedTask) {
          // Try to find task by multiple ID formats
          const index = state.tasks.findIndex(
            (task) => {
              // Check multiple ID formats
              return task.taskId == updatedTask.taskId ||
                task._id == updatedTask.taskId ||
                Number(task.taskId) === Number(updatedTask.taskId) ||
                Number(task._id) === Number(updatedTask.taskId);
            }
          );

          if (index !== -1) {
            state.tasks[index] = { ...state.tasks[index], ...updatedTask };
          }

          if (state.selectedTask) {
            // Check multiple ID formats for selected task
            const isMatchingTask = state.selectedTask.taskId == updatedTask.taskId ||
              state.selectedTask._id == updatedTask.taskId ||
              Number(state.selectedTask.taskId) === Number(updatedTask.taskId) ||
              Number(state.selectedTask._id) === Number(updatedTask.taskId);

            if (isMatchingTask) {
              state.selectedTask = { ...state.selectedTask, ...updatedTask };
            }
          }
        }
      })

      // deleteTask reducers
      .addCase(deleteTask.fulfilled, (state, action) => {
        const taskId = action.payload;
        state.tasks = state.tasks.filter((task) => task.taskId !== taskId);

        // Update pagination count
        state.pagination.totalCount = Math.max(0, state.pagination.totalCount - 1);
        state.pagination.totalPages = Math.ceil(state.pagination.totalCount / state.pagination.pageSize);

        if (state.selectedTask && state.selectedTask.taskId === taskId) {
          state.selectedTask = null;
          state.isTaskPanelOpen = false;
        }

        state.selectedTasks = state.selectedTasks.filter((id) => id !== taskId);
      })

      // toggleTaskStatus reducers
      .addCase(toggleTaskStatus.fulfilled, (state, action) => {
        const updatedTask = action.payload;
        if (updatedTask) {
          const index = state.tasks.findIndex(
            (task) => task.taskId === updatedTask.taskId,
          );
          if (index !== -1) {
            state.tasks[index].taskPosition = updatedTask.taskPosition;
            state.tasks[index].taskStatus = updatedTask.taskStatus;
          }

          if (
            state.selectedTask &&
            state.selectedTask.taskId === updatedTask.taskId
          ) {
            state.selectedTask.taskPosition = updatedTask.taskPosition;
            state.selectedTask.taskStatus = updatedTask.taskStatus;
          }
        }
      })

      // deleteBulkTasks reducers
      .addCase(deleteBulkTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBulkTasks.fulfilled, (state, action) => {
        const taskIds = action.payload;
        const deletedCount = taskIds.length;
        state.tasks = state.tasks.filter((task) => !taskIds.includes(task._id));

        // Update pagination count
        state.pagination.totalCount = Math.max(0, state.pagination.totalCount - deletedCount);
        state.pagination.totalPages = Math.ceil(state.pagination.totalCount / state.pagination.pageSize);

        if (state.selectedTask && taskIds.includes(state.selectedTask._id)) {
          state.selectedTask = null;
          state.isTaskPanelOpen = false;
        }

        state.selectedTasks = [];
        state.loading = false;
      })
      .addCase(deleteBulkTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // bulkUpdateTasks reducers
      .addCase(bulkUpdateTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateTasks.fulfilled, (state, action) => {
        const { taskIds, updateData } = action.payload;

        // Update each task in the state
        state.tasks = state.tasks.map((task) => {
          if (taskIds.includes(task._id)) {
            return { ...task, ...updateData };
          }
          return task;
        });

        // Update selected task if needed
        if (state.selectedTask && taskIds.includes(state.selectedTask._id)) {
          state.selectedTask = { ...state.selectedTask, ...updateData };
        }

        // Clear selected tasks after bulk update
        state.selectedTasks = [];
        state.loading = false;
      })
      .addCase(bulkUpdateTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Add cases for fetchTaskById
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        // For shared tasks, we don't add them to the tasks array to avoid showing them in the user's task list
        // The task will still be available in selectedTask for display in the panel

        // Set as selected task and open panel
        state.selectedTask = action.payload;
        state.isTaskPanelOpen = true;
        state.isPanelVisible = true;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Add cases for fetchTaskBySearch
      .addCase(fetchTaskBySearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskBySearch.fulfilled, (state, action) => {
        state.loading = false;

        // For shared tasks, we don't add them to the tasks array to avoid showing them in the user's task list
        // The task will still be available in selectedTask for display in the panel

        // Set as selected task and open panel
        state.selectedTask = action.payload;
        state.isTaskPanelOpen = true;
        state.isPanelVisible = true;
      })
      .addCase(fetchTaskBySearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // KEEP ONLY ONE SET OF fetchRecurringTasks CASES
      // This is the first occurrence which we'll keep
      .addCase(fetchRecurringTasks.pending, (state) => {
        state.recurringTasksLoading = true;
        state.recurringTasksError = null;
      })
      .addCase(fetchRecurringTasks.fulfilled, (state, action) => {
        state.recurringTasksLoading = false;
        // normalise identity keys (`_id` and `id`) so later comparisons succeed
        state.recurringTasks = (action.payload.results || []).map((t) => ({
          ...t,
          _id: t._id ?? t.id,
          id: t.id ?? t._id,
        }));
        state.recurringTasksPagination = action.payload.pagination || {};
      })
      .addCase(fetchRecurringTasks.rejected, (state, action) => {
        state.recurringTasksLoading = false;
        state.recurringTasksError =
          action.payload || "Failed to fetch recurring tasks";
      })

      // deleteTaskAttachment reducers
      .addCase(deleteTaskAttachment.pending, (state) => {
        state.deletingAttachment = true;
        state.error = null;
      })
      .addCase(deleteTaskAttachment.fulfilled, (state, action) => {
        const { taskId, attachmentId } = action.payload;

        // Remove the attachment from the taskAttachments array
        state.taskAttachments = state.taskAttachments.filter(
          (attachment) => attachment.id !== attachmentId,
        );

        // Update the task in the tasks array if it exists
        const taskIndex = state.tasks.findIndex(
          (task) => task.taskId === taskId,
        );
        if (taskIndex !== -1) {
          state.tasks[taskIndex].attachments = state.tasks[
            taskIndex
          ].attachments.filter((attachment) => attachment.id !== attachmentId);
          state.tasks[taskIndex].attachmentCount =
            state.tasks[taskIndex].attachments.length;
        }

        // Update selected task if it matches
        if (state.selectedTask && state.selectedTask.taskId === taskId) {
          state.selectedTask.attachments =
            state.selectedTask.attachments.filter(
              (attachment) => attachment.id !== attachmentId,
            );
          state.selectedTask.attachmentCount =
            state.selectedTask.attachments.length;
        }

        state.deletingAttachment = false;
      })
      .addCase(deleteTaskAttachment.rejected, (state, action) => {
        state.deletingAttachment = false;
        state.error = action.payload || action.error.message;
        console.error("Failed to delete task attachment:", action.payload);
      })

      // Add reducer for setEmptyTaskWarning
      .addCase(setEmptyTaskWarning, (state, action) => {
        state.emptyTaskWarning = action.payload;
      })

      // Create recurring task
      .addCase(createRecurringTask.pending, (state) => {
        state.isCreatingRecurringTask = true;
        state.createRecurringTaskError = null;
      })
      .addCase(createRecurringTask.fulfilled, (state, action) => {
        state.isCreatingRecurringTask = false;

        // Extract the recurring task data from various possible response shapes
        const recurringTask =
          action.payload?.data?.recurring_task ||
          action.payload?.recurring_task ||
          action.payload?.data ||
          action.payload;
        if (!recurringTask) {
          console.error(
            "createRecurringTask.fulfilled: Could not find recurringTask in response",
            action.payload,
          );
          return;
        }
        const serverId = recurringTask.id ?? recurringTask._id;
        if (!serverId) {
          console.error(
            "createRecurringTask.fulfilled: serverId missing in recurringTask",
            recurringTask,
          );
        }
        // Find the task with temporary ID
        const tempId = action.meta.arg._id;
        const taskIndex = state.recurringTasks.findIndex(
          (task) => String(task._id) === String(tempId),
        );

        if (taskIndex !== -1) {
          // Update existing task with real ID and data from server
          state.recurringTasks[taskIndex] = {
            ...state.recurringTasks[taskIndex],
            ...recurringTask, // Include all properties from the response
            _id: serverId,
            id: serverId,
            taskId: serverId,
            initial: false,
            isEditing: false,
            isLoading: false,
          };
        } else {
          // If not found (unlikely), add as new task
          state.recurringTasks.unshift({
            ...recurringTask,
            _id: serverId,
            id: serverId,
            initial: false,
            isEditing: false,
          });
          // Update recurring tasks pagination count for new task
          state.recurringTasksPagination.totalCount += 1;
          state.recurringTasksPagination.totalPages = Math.ceil(state.recurringTasksPagination.totalCount / state.recurringTasksPagination.pageSize);
        }
      })
      .addCase(createRecurringTask.rejected, (state, action) => {
        state.isCreatingRecurringTask = false;
        state.createRecurringTaskError = action.payload;
      })

      // Update recurring task
      .addCase(updateRecurringTask.fulfilled, (state, action) => {
        if (action.payload && action.payload.data) {
          const getKey = (t) => String(t._id ?? t.id);
          const updatedKey = getKey(action.payload.data);

          const index = state.recurringTasks.findIndex(
            (task) => getKey(task) === updatedKey,
          );

          if (index !== -1) {
            state.recurringTasks[index] = {
              ...state.recurringTasks[index],
              ...action.payload.data,
              _id: action.payload.data._id ?? action.payload.data.id,
              id: action.payload.data.id ?? action.payload.data._id,
            };
          }
        }
      })

      // Delete recurring task
      .addCase(deleteRecurringTask.pending, (state, action) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRecurringTask.fulfilled, (state, action) => {
        state.loading = false;
        state.recurringTasks = state.recurringTasks.filter(
          (task) => task._id !== action.payload && task.id !== action.payload,
        );

        // Update recurring tasks pagination count
        state.recurringTasksPagination.totalCount = Math.max(0, state.recurringTasksPagination.totalCount - 1);
        state.recurringTasksPagination.totalPages = Math.ceil(state.recurringTasksPagination.totalCount / state.recurringTasksPagination.pageSize);

        // Also remove from selected tasks if present
        state.selectedRecurringTasks = state.selectedRecurringTasks.filter(
          (id) => id !== action.payload,
        );
      })
      .addCase(deleteRecurringTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Delete bulk recurring tasks
      .addCase(deleteBulkRecurringTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBulkRecurringTasks.fulfilled, (state, action) => {
        const taskIds = action.payload;
        const deletedCount = taskIds.length;
        state.recurringTasks = state.recurringTasks.filter(
          (task) => !taskIds.includes(task._id) && !taskIds.includes(task.id),
        );

        // Update recurring tasks pagination count
        state.recurringTasksPagination.totalCount = Math.max(0, state.recurringTasksPagination.totalCount - deletedCount);
        state.recurringTasksPagination.totalPages = Math.ceil(state.recurringTasksPagination.totalCount / state.recurringTasksPagination.pageSize);

        state.selectedRecurringTasks = [];
        state.loading = false;
      })
      .addCase(deleteBulkRecurringTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  setTaskNameInput,
  setSelectedTask,
  toggleTaskPanel,
  togglePanelVisibility,
  setActiveTaskTab,
  toggleTaskSelection,
  selectAllTasks,
  clearSelectedTasks,
  setFilters,
  setActiveTab,
  setPage,
  setPageSize,
  setSearchQuery,
  updateTaskProperty,
  addTask,
  updateTaskInState,
  deleteTaskFromState,
  setAbortController,
  updateTaskCommentCount,
  removeTaskFromState,
  updateTaskAttachmentCount,
  addRecurringTask,
  updateRecurringTaskInState,
  removeRecurringTaskFromState,
  toggleRecurringTaskSelection,
  selectAllRecurringTasks,
  clearSelectedRecurringTasks,
  updateTaskSubtaskCount,
  updateTaskTimeData,
} = tasksSlice.actions;

export default tasksSlice.reducer;
