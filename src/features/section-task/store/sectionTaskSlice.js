import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchGET,
  fetchAuthGET,
  fetchAuthPost,
  fetchAuthPatch,
  fetchAuthDelete,
  fetchAuthPut,
  fetchAuthPatchSumit,
} from "@/store/api/apiSlice";
import { toast } from "react-toastify";

import {
  getDefaultProjectId,
  transformSectionResponse,
  transformTaskResponse,
  transformTaskForCreation,
  transformSectionForCreation,
  handleApiError,
  isApiResponseSuccessful,
  getCurrentUserId,
  API_ENDPOINTS,
  validateSectionName,
  validateTaskName,
  detectTaskDropPosition,
  detectSectionDropPosition,
  detectTaskSectionDropPosition,
} from "../utils/apiUtils";
import { updateTask } from "@/features/tasks/store/tasksSlice";
// Get API base URL
const apiBaseURL = import.meta.env.VITE_APP_DJANGO;

// Storage key for persisted filters
const STORAGE_KEY = "sectionTaskFilters";

// Default filters
const defaultFilters = {
  search: "",
  priority: [],
  status: [],
  assignedUsers: [],
  projects: [],
  dueDate: null,
  section: "all",
};

// Load persisted filters
let persistedFilters = {};
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  persistedFilters = stored ? JSON.parse(stored) : {};
} catch (error) {
  console.error("Error loading persisted filters:", error);
  persistedFilters = {};
}

const mergedInitialFilters = { ...defaultFilters, ...persistedFilters };

// Async thunks
export const fetchSectionTasks = createAsyncThunk(
  "sectionTasks/fetchSectionTasks",
  async (projectId = getDefaultProjectId(), { rejectWithValue, getState }) => {
    try {
      // Get current filters from state
      const state = getState();
      const filters = state.sectionTasks.filters;

      // Build query parameters for the new pagination API
      const queryParams = new URLSearchParams();

      // Add filter parameters if they exist
      if (filters.search) {
        queryParams.append('name', filters.search);
      }
      if (filters.assignedUsers && filters.assignedUsers.length > 0) {
        queryParams.append('userId', filters.assignedUsers[0]); // Support single user for now
      }
      if (filters.dueDate) {
        const startDate = new Date(filters.dueDate);
        startDate.setHours(0, 0, 0, 0);
        queryParams.append('startDate', startDate.toISOString().split('T')[0]);

        const endDate = new Date(filters.dueDate);
        endDate.setHours(23, 59, 59, 999);
        queryParams.append('endDate', endDate.toISOString().split('T')[0]);
      }

      // Add pagination parameters
      queryParams.append('page', '1'); // Start with first page
      queryParams.append('page_size', '50'); // Default page size

      const url = `${apiBaseURL}${API_ENDPOINTS.PROJECT_SECTIONS(projectId)}?${queryParams.toString()}`;
      const response = await fetchAuthGET(url, false);

      if (response.error) {
        return rejectWithValue(response.message || "Failed to fetch sections");
      }

      // Handle the new pagination response structure
      const responseData = response.results || response;
      const sections = responseData.sections || responseData;

      const transformedSections = Array.isArray(sections)
        ? sections.map(transformSectionResponse)
        : [];

      return {
        sections: transformedSections,
        pagination: {
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
          currentPage: 1,
          totalPages: Math.ceil((response.count || 0) / 50),
        },
        metadata: {
          totalSections: response.count || transformedSections.length,
          totalTasks: transformedSections.reduce(
            (total, section) => total + (section.tasks?.length || 0),
            0,
          ),
        },
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createTaskInSection = createAsyncThunk(
  "sectionTasks/createTaskInSection",
  async ({ sectionId, taskData, tempId }, { rejectWithValue, getState }) => {
    // Use provided tempId or generate one (for backward compatibility)
    const taskTempId = tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const url = `${apiBaseURL}${API_ENDPOINTS.CREATE_TASK_WITH_SECTION}`;

      // Get current user from state (if available) or use default
      const state = getState();
      const userinfo = state.userinfo || state.auth?.user || {};
      const currentUser =
        userinfo.id || userinfo._id || getCurrentUserId(state);

      const payload = transformTaskForCreation(
        taskData,
        sectionId,
        currentUser,
      );

      const response = await fetchAuthPost(url, { body: payload });

      const error = handleApiError(response, "Failed to create task");
      if (error) {
        return rejectWithValue({ error, tempId: taskTempId });
      }

      // Transform response to match expected frontend format
      const backendTaskData = response.data || response;

      const newTask = transformTaskResponse({
        ...backendTaskData,
        sectionId: sectionId, // Ensure sectionId is set
      });

      //toast.success("Task created successfully");
      return { sectionId, task: newTask, tempId: taskTempId };
    } catch (error) {
      toast.error("Failed to create task");
      return rejectWithValue({ error: error.message, tempId: taskTempId });
    }
  },
);

export const updateTaskInSection = createAsyncThunk(
  "sectionTasks/updateTaskInSection",
  async ({ taskId, updates, forceUpdate = false, skipChangeDetection = false }, { dispatch, getState, rejectWithValue }) => {
    try {

      // Store original task data for potential rollback
      const state = getState();
      let originalTask = selectTaskById(taskId)(state);

      // Check if there are any actual changes to prevent unnecessary API calls
      if (!originalTask) {
        // Try one more time with string conversion
        const taskIdStr = String(taskId);
        for (const section of state.sectionTasks.sections) {
          const task = section.tasks?.find((task) =>
            String(task._id) === taskIdStr || String(task.taskId) === taskIdStr
          );
          if (task) {
            originalTask = task;
            break;
          }
        }

        // If still not found, return error
        if (!originalTask) {
          return rejectWithValue(`Task with ID ${taskId} not found in sections`);
        }
      }

      // Only check for changes if not forced update (from updateTaskWithAPI) and not skipping change detection
      if (!forceUpdate && !skipChangeDetection) {

        // Compare updates with current task values to avoid unnecessary API calls
        const hasChanges = Object.keys(updates).some(key => {
          const currentValue = originalTask[key];
          const newValue = updates[key];

          // Handle special cases
          if (key === 'dueDate') {
            const currentDate = currentValue ? currentValue.split('T')[0] : null;
            const newDate = newValue ? newValue.split('T')[0] : null;
            return currentDate !== newDate;
          }

          // Handle array comparisons (like seen_by)
          if (Array.isArray(currentValue) && Array.isArray(newValue)) {
            if (currentValue.length !== newValue.length) return true;
            return !currentValue.every((item, index) => item === newValue[index]);
          }

          return currentValue !== newValue;
        });

        if (!hasChanges) {

          return {
            taskId,
            updates,
            originalTask,
            result: null, // No API call made
          };
        }
      }

      // Use the existing updateTask API from tasks slice
      const result = await dispatch(
        updateTask({
          taskId,
          data: updates,
        }),
      ).unwrap();

      return {
        taskId,
        updates,
        originalTask,
        result,
      };
    } catch (error) {
      console.error("Failed to update task in backend:", error);
      return rejectWithValue(error.message || "Failed to update task");
    }
  },
);

export const deleteTaskFromSection = createAsyncThunk(
  "sectionTasks/deleteTaskFromSection",
  async ({ taskId, userId }, { rejectWithValue }) => {
    try {

      const url = `${apiBaseURL}${API_ENDPOINTS.DELETE_TASK(taskId)}?userId=${userId}`;
      const response = await fetchAuthDelete(url);

      const error = handleApiError(response, "Failed to delete task");
      if (error) {
        return rejectWithValue(error);
      }

      toast.success("Task deleted successfully");
      return { taskId };
    } catch (error) {
      toast.error("Failed to delete task");
      return rejectWithValue(error.message);
    }
  },
);

// Fetch task by ID for shareable URLs
export const fetchTaskById = createAsyncThunk(
  "sectionTasks/fetchTaskById",
  async ({ taskId }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const userInfo = state.auth.user;

      if (!userInfo?._id || !userInfo?.companyId) {
        return rejectWithValue("User information missing");
      }

      // First check if task already exists in current sections
      for (const section of state.sectionTasks.sections) {
        const existingTask = section.tasks.find(
          (task) => task._id === taskId || task.taskId === taskId,
        );
        if (existingTask) {
          return { task: existingTask, fromExisting: true };
        }
      }

      // If not found in sections, fetch from API
      const baseURL = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${baseURL}/task/${taskId}/${userInfo._id}/`;

      const response = await fetchGET(apiUrl);

      if (response && response.task) {
        return { task: response.task, fromExisting: false };
      } else {
        throw new Error("Task not found");
      }
    } catch (error) {
      console.error("Error fetching task by ID:", error);
      return rejectWithValue(error.message || "Failed to fetch task");
    }
  },
);

// Open task panel with shareable URL support
export const openTaskFromUrl = createAsyncThunk(
  "sectionTasks/openTaskFromUrl",
  async ({ taskId }, { dispatch, rejectWithValue }) => {
    try {
      const result = await dispatch(fetchTaskById({ taskId })).unwrap();

      // Set the task as selected and open panel
      dispatch(setSelectedTask(result.task));
      dispatch(toggleTaskPanel(true));

      return result.task;
    } catch (error) {
      toast.error("Task not found or access denied", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return rejectWithValue(error);
    }
  },
);

export const moveTaskBetweenSections = createAsyncThunk(
  "sectionTasks/moveTaskBetweenSections",
  async (
    { taskId, fromSectionId, toSectionId, newOrder },
    { rejectWithValue },
  ) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { taskId, fromSectionId, toSectionId, newOrder };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const createNewSection = createAsyncThunk(
  "sectionTasks/createNewSection",
  async (sectionData, { rejectWithValue, getState }) => {
    try {
      const url = `${apiBaseURL}${API_ENDPOINTS.TASK_SECTIONS}`;

      // Get current user from state (if available) or use default
      const state = getState();
      const currentUser = getCurrentUserId(state);

      const payload = transformSectionForCreation(
        sectionData,
        sectionData.projectId || getDefaultProjectId(),
        currentUser,
      );

      const response = await fetchAuthPost(url, { body: payload });

      const error = handleApiError(response, "Failed to create section");
      if (error) {
        return rejectWithValue(error);
      }

      // Transform response to match expected format
      const backendSectionData = response.data || response;

      const newSection = transformSectionResponse({
        ...backendSectionData,
        color: sectionData.color || "#3B82F6",
        icon: sectionData.icon || "mdi:folder-outline",
        tasks: [],
      });

      toast.success("Section created successfully");
      return newSection;
    } catch (error) {
      toast.error("Failed to create section");
      return rejectWithValue(error.message);
    }
  },
);

export const swapSectionOrder = createAsyncThunk(
  "sectionTasks/swapSectionOrder",
  async (
    { firstSectionId, secondSectionId, projectId = getDefaultProjectId() },
    { rejectWithValue },
  ) => {
    try {
      const url = `${apiBaseURL}${API_ENDPOINTS.SWAP_SECTIONS(projectId)}`;

      const payload = {
        first_section_id: firstSectionId,
        second_section_id: secondSectionId,
        third_section_id: null, // This will be determined by the new reorderSections function
      };

      const response = await fetchAuthPut(url, { body: payload });

      const error = handleApiError(response, "Failed to swap section order");
      if (error) {
        return rejectWithValue(error);
      }

      // Handle the new response format with section1 and section2
      const { section1, section2 } = response;

      toast.success("Section order updated successfully");
      return {
        firstSectionId,
        secondSectionId,
        section1,
        section2,
        response
      };
    } catch (error) {
      toast.error("Failed to update section order");
      return rejectWithValue(error.message);
    }
  },
);

export const changeTaskSection = createAsyncThunk(
  "sectionTasks/changeTaskSection",
  async (
    { taskId, newSectionId, oldSectionId },
    { dispatch, rejectWithValue },
  ) => {
    try {
      // Use the existing updateTask API from tasks slice
      const result = await dispatch(
        updateTask({
          taskId,
          data: {
            section: newSectionId,
            section_id: newSectionId,
          },
        }),
      ).unwrap();

      return {
        taskId,
        newSectionId,
        oldSectionId,
        result,
      };
    } catch (error) {
      console.error("Failed to change task section in backend:", error);
      return rejectWithValue(error.message || "Failed to change task section");
    }
  },
);

// Drag and Drop Actions
export const reorderSections = createAsyncThunk(
  "sectionTasks/reorderSections",
  async ({ sections, draggedSectionId, destinationIndex, sourceIndex }, { rejectWithValue }) => {
    try {
      // Get project ID from the first section (assuming all sections belong to same project)
      const projectId = sections[0]?.project || 207; // Default fallback

      // Calculate payload based on the original positions
      let payload;

      if (sourceIndex < destinationIndex) {
        // Moving from top to bottom
        payload = {
          first_section_id: sections[destinationIndex]?.id || null,
          second_section_id: draggedSectionId,
          third_section_id: null,
        };
      } else {
        // Moving from bottom to top
        payload = {
          first_section_id: null,
          second_section_id: draggedSectionId,
          third_section_id: sections[destinationIndex]?.id || null,
        };
      }

      const url = `${apiBaseURL}/projects/${projectId}/sections/swap/`;

      const response = await fetchAuthPut(url, { body: payload });

      const error = handleApiError(response, "Failed to reorder sections");
      if (error) {
        return rejectWithValue(error);
      }

      return { sections, draggedSectionId, destinationIndex };
    } catch (error) {
      console.error("Failed to reorder sections:", error);
      return rejectWithValue(error.message || "Failed to reorder sections");
    }
  },
);

export const reorderTasksInSectionAsync = createAsyncThunk(
  "sectionTasks/reorderTasksInSectionAsync",
  async ({ sectionId, tasks, draggedTaskId, destinationIndex, sourceIndex }, { rejectWithValue }) => {
    try {
      // Use helper function to detect drop position with draggedTaskId
      const { firstTaskId, thirdTaskId } = detectTaskDropPosition(tasks, destinationIndex, draggedTaskId);

      const url = `${apiBaseURL}/tasks/swap-order/`;
      const payload = {
        first_task_id: firstTaskId,
        second_task_id: draggedTaskId,
        third_task_id: thirdTaskId,
      };

      const response = await fetchAuthPut(url, { body: payload });

      const error = handleApiError(response, "Failed to reorder tasks");
      if (error) {
        return rejectWithValue(error);
      }

      return { sectionId, tasks, draggedTaskId, destinationIndex };
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      return rejectWithValue(error.message || "Failed to reorder tasks");
    }
  },
);

// Move task between sections with proper API call
export const moveTaskBetweenSectionsWithOrder = createAsyncThunk(
  "sectionTasks/moveTaskBetweenSectionsWithOrder",
  async (
    {
      taskId,
      sourceSectionId,
      destinationSectionId,
      destinationIndex,
      destinationTasks,
    },
    { rejectWithValue },
  ) => {
    try {
      // Use helper function to detect drop position
      const { firstTask, secondTask } = detectTaskSectionDropPosition(destinationTasks, destinationIndex);

      const url = `${apiBaseURL}/tasks/${taskId}/change-section/`;
      const payload = {
        section_id: parseInt(destinationSectionId),
        first_task: firstTask,
        second_task: secondTask,
      };



      const response = await fetchAuthPatch(url, { body: payload });

      const error = handleApiError(
        response,
        "Failed to move task to new section",
      );
      if (error) {
        return rejectWithValue(error);
      }

      return {
        taskId,
        sourceSectionId,
        destinationSectionId,
        firstTask,
        secondTask,
        destinationIndex,
      };
    } catch (error) {
      console.error("❌ Error moving task between sections:", error);
      return rejectWithValue(error.message);
    }
  },
);

// Update section name via API
export const updateSectionNameAsync = createAsyncThunk(
  "sectionTasks/updateSectionNameAsync",
  async ({ sectionId, newName }, { rejectWithValue }) => {
    try {
      const url = `${apiBaseURL}${API_ENDPOINTS.RENAME_SECTION(sectionId)}`;
      const response = await fetchAuthPatch(url, {
        body: { name: newName },
      });

      const error = handleApiError(response, "Failed to update section name");
      if (error) {
        return rejectWithValue(error);
      }

      // toast.success("Section name updated successfully");
      return { sectionId, newName };
    } catch (error) {
      console.error("Failed to update section name:", error);
      return rejectWithValue(error.message || "Failed to update section name");
    }
  },
);

// Swap task order via API
export const swapTaskOrderAsync = createAsyncThunk(
  "sectionTasks/swapTaskOrderAsync",
  async ({ firstTaskId, secondTaskId, thirdTaskId }, { rejectWithValue }) => {
    try {
      const url = `${apiBaseURL}${API_ENDPOINTS.SWAP_TASK_ORDER}`;
      const response = await fetchAuthPut(url, {
        body: {
          first_task_id: firstTaskId,
          second_task_id: secondTaskId,
          third_task_id: thirdTaskId,
        },
      });

      const error = handleApiError(response, "Failed to swap task order");
      if (error) {
        return rejectWithValue(error);
      }

      return { firstTaskId, secondTaskId, thirdTaskId };
    } catch (error) {
      console.error("Failed to swap task order:", error);
      return rejectWithValue(error.message || "Failed to swap task order");
    }
  },
);

// Bulk delete tasks
export const bulkDeleteTasksAsync = createAsyncThunk(
  "sectionTasks/bulkDeleteTasksAsync",
  async ({ taskIds }, { getState, rejectWithValue }) => {
    try {
      const userInfo = getState().auth.user;

      if (!userInfo?._id) {
        return rejectWithValue("User not authenticated");
      }

      if (!taskIds || !taskIds.length) {
        return rejectWithValue("No tasks selected for deletion");
      }

      // Separate local-only tasks from server tasks (same as regular tasks feature)
      const sections = getState().sectionTasks.sections;
      const localTaskIds = [];
      const serverTaskIds = [];

      taskIds.forEach((id) => {
        // Find the task across all sections
        let task = null;
        for (const section of sections) {
          task = section.tasks?.find((t) => t._id === id);
          if (task) break;
        }

        // Check if it's a local-only task (has temporary ID starting with 'new-' or has initial flag)
        if (task && (String(task._id).startsWith("new-") || task.initial || task.isOptimistic)) {
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

        if (serverTaskIds.length > 0) {
          toast.success(
            `${serverTaskIds.length} ${serverTaskIds.length === 1 ? "task" : "tasks"} deleted successfully`
          );
        }
      }

      // Return all task IDs (both local and server) to be removed from state
      return { taskIds };
    } catch (error) {
      console.error("❌ Failed to delete tasks:", error);
      return rejectWithValue(error.message || "Failed to delete tasks");
    }
  },
);

// Bulk update tasks
export const bulkUpdateTasksAsync = createAsyncThunk(
  "sectionTasks/bulkUpdateTasksAsync",
  async ({ taskIds, updates }, { getState, rejectWithValue }) => {
    try {
      const userInfo = getState().auth.user;

      if (!userInfo?._id) {
        return rejectWithValue("User not authenticated");
      }

      if (!taskIds || !taskIds.length) {
        return rejectWithValue("No tasks selected for update");
      }

      // Separate local-only tasks from server tasks
      const sections = getState().sectionTasks.sections;
      const localTaskIds = [];
      const serverTaskIds = [];

      taskIds.forEach((id) => {
        // Find the task across all sections
        let task = null;
        for (const section of sections) {
          task = section.tasks?.find((t) => t._id === id);
          if (task) break;
        }

        // Check if it's a local-only task
        if (task && (String(task._id).startsWith("new-") || task.initial || task.isOptimistic)) {
          localTaskIds.push(id);
        } else {
          serverTaskIds.push(id);
        }
      });

      // Warn about temporary tasks
      if (localTaskIds.length > 0) {
        toast.info(
          `${localTaskIds.length} temporary ${localTaskIds.length === 1 ? 'task' : 'tasks'} skipped. Please save ${localTaskIds.length === 1 ? 'it' : 'them'} first.`,
          { autoClose: 3000 }
        );
      }

      // If we have server tasks, send them to the API
      if (serverTaskIds.length > 0) {
        // Convert string IDs to integers if needed
        const parsedTaskIds = serverTaskIds.map((id) => {
          // Try to parse as integer if it's a string
          const numId = typeof id === "string" ? parseInt(id, 10) : id;
          return isNaN(numId) ? id : numId;
        });

        // Format the payload according to the API requirements
        const payload = {
          tasks: parsedTaskIds,
          action: updates.action || "update",
        };

        // Add other update fields if they exist
        if (updates.projectId) payload.projectId = updates.projectId;
        if (updates.userId) payload.userId = updates.userId;
        if (updates.taskPosition) payload.taskPosition = updates.taskPosition;
        if (updates.dueDate) payload.dueDate = updates.dueDate;
        if (updates.priority) payload.priority = updates.priority;
        if (updates.assigned_users) payload.assigned_users = updates.assigned_users;

        const response = await fetchAuthPost(
          `${import.meta.env.VITE_APP_DJANGO}/manage-tasks/${userInfo._id}/`,
          { body: payload },
        );

        if (response.status === 1) {
          toast.success(
            `${serverTaskIds.length} ${serverTaskIds.length === 1 ? "task" : "tasks"} updated successfully`
          );
          return { taskIds: serverTaskIds, updates };
        } else {
          return rejectWithValue(response.message || "Failed to update tasks");
        }
      }

      // If only local tasks were selected, return empty success
      return { taskIds: [], updates };
    } catch (error) {
      console.error("Failed to update tasks:", error);
      return rejectWithValue(error.message || "Failed to update tasks");
    }
  },
);

export const bulkChangeSectionAsync = createAsyncThunk(
  "sectionTasks/bulkChangeSectionAsync",
  async ({ projectId, sectionId, taskIds }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const userInfo = state.auth.user;

      if (!userInfo?._id) {
        return rejectWithValue("User not authenticated");
      }

      // Separate local-only tasks from server tasks
      const sections = state.sectionTasks.sections;
      const localTaskIds = [];
      const serverTaskIds = [];
      const originalTasksData = {};

      taskIds.forEach((id) => {
        // Find the task across all sections
        let task = null;
        let taskSection = null;
        for (const section of sections) {
          task = section.tasks?.find((t) => t._id === id);
          if (task) {
            taskSection = section;
            break;
          }
        }

        if (task) {
          // Store original task data for rollback
          originalTasksData[task._id] = {
            task: { ...task },
            originalSectionId: taskSection.id
          };

          // Check if it's a local-only task
          if (String(task._id).startsWith("new-") || task.initial || task.isOptimistic) {
            localTaskIds.push(id);
          } else {
            serverTaskIds.push(id);
          }
        }
      });

      // Warn about temporary tasks
      if (localTaskIds.length > 0) {
        toast.info(
          `${localTaskIds.length} temporary ${localTaskIds.length === 1 ? 'task' : 'tasks'} skipped. Please save ${localTaskIds.length === 1 ? 'it' : 'them'} first.`,
          { autoClose: 3000 }
        );
      }

      // If no server tasks, just return
      if (serverTaskIds.length === 0) {
        return {
          projectId,
          sectionId,
          taskIds: [],
          originalTasksData,
          response: { status: 1 }
        };
      }

      // Log the API payload for debugging
      const apiPayload = {
        section_id: sectionId,
        task_ids: serverTaskIds
      };


      // Make API call to change section for multiple tasks using the correct endpoint pattern
      const response = await fetchAuthPatch(
        `${import.meta.env.VITE_APP_DJANGO}/api/tasks/change-section/`,
        { body: apiPayload }
      );

      if (response?.error) {
        return rejectWithValue(response.message || "Failed to change section for tasks");
      }


      return {
        projectId,
        sectionId,
        taskIds: serverTaskIds, // Only return server task IDs that were actually moved
        originalTasksData,
        response: response.data || response
      };
    } catch (error) {
      console.error("Bulk change section error:", error);
      toast.error(error.message || "Failed to move tasks to new section");
      return rejectWithValue({
        message: error.message || "Failed to change section for tasks",
        taskIds: serverTaskIds, // Use serverTaskIds here too
        projectId,
        sectionId
      });
    }
  },
);

// 🎯 APPLY FILTERS TO ALL EXPANDED SECTIONS
// 🚀 OPTIMIZATION 7: Add throttling to prevent multiple simultaneous API calls
let isApplyingFilters = false;

export const applyFiltersToAllExpandedSections = createAsyncThunk(
  "sectionTasks/applyFiltersToAllExpandedSections",
  async (filters, { getState, dispatch }) => {
    // 🚀 OPTIMIZATION: Prevent multiple simultaneous filter applications
    if (isApplyingFilters) {
      return { filters, sectionsUpdated: 0, results: [] };
    }

    isApplyingFilters = true;

    try {

      const state = getState();
      const expandedSections = state.sectionTasks.sections.filter(
        section => !section.isCollapsed
      );

      // Check if filters are different from current filters OR if sections don't have tasks loaded
      const currentFilters = state.sectionTasks.filters;
      const hasFilterChanges =
        filters.search !== currentFilters.search ||
        filters.userId !== currentFilters.userId ||
        JSON.stringify(filters.taskPosition) !== JSON.stringify(currentFilters.taskPosition) ||
        filters.priority !== currentFilters.priority ||
        filters.dateRange?.startDate !== currentFilters.dateRange?.startDate ||
        filters.dateRange?.endDate !== currentFilters.dateRange?.endDate;

      // Check if any expanded section has no tasks (needs initial load)
      const hasEmptySections = expandedSections.some(section =>
        !section.tasks || section.tasks.length === 0
      );

      // Apply filters if they changed OR if we have empty sections that need data
      if (!hasFilterChanges && !hasEmptySections) {
        return {
          filters,
          sectionsUpdated: 0,
          results: []
        };
      }

      // 🚀 OPTIMIZATION: Limit concurrent API calls to prevent overwhelming the server
      const batchSize = 10; // Process 3 sections at a time
      const results = [];

      for (let i = 0; i < expandedSections.length; i += batchSize) {
        const batch = expandedSections.slice(i, i + batchSize);
        const batchPromises = batch.map(section =>
          dispatch(fetchTasksPaginated({
            sectionId: section.id,
            filters,
            page: 1,
            pageSize: 20,
            append: false
          }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to prevent server overload
        if (i + batchSize < expandedSections.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      return {
        filters,
        sectionsUpdated: expandedSections.length,
        results: results.map(result => result.payload)
      };

    } catch (error) {
      return rejectWithValue(error.message);
    } finally {
      // Add small delay before resetting flag to prevent rapid successive calls
      setTimeout(() => {
        isApplyingFilters = false;
      }, 200);
    }
  }
);

// New async thunk to fetch task attachments for section tasks
export const fetchSectionTaskAttachments = createAsyncThunk(
  "sectionTasks/fetchSectionTaskAttachments",
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
      console.error("Error fetching section task attachments:", error);
      return rejectWithValue("Failed to fetch section task attachments");
    }
  },
);

// New async thunk to delete section task attachment
export const deleteSectionTaskAttachment = createAsyncThunk(
  "sectionTasks/deleteSectionTaskAttachment",
  async ({ taskId, attachmentId }, { getState, rejectWithValue }) => {
    try {
      if (!taskId || taskId === "-" || !attachmentId) {
        return rejectWithValue("Invalid task ID or attachment ID");
      }

      const apiUrl = `${import.meta.env.VITE_APP_DJANGO
        }/api/task/${taskId}/attachments/${attachmentId}/`;

      const response = await fetchAuthDelete(apiUrl);

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
      console.error("Error deleting section task attachment:", error);
      return rejectWithValue("Failed to delete section task attachment");
    }
  },
);

// Toggle section collapse with API persistence
export const toggleSectionCollapseAsync = createAsyncThunk(
  "sectionTasks/toggleSectionCollapseAsync",
  async (sectionId, { rejectWithValue }) => {
    try {
      const url = `${apiBaseURL}${API_ENDPOINTS.TOGGLE_SECTION_COLLAPSE(sectionId)}`;
      const response = await fetchAuthPost(url, {});

      if (!isApiResponseSuccessful(response)) {
        throw new Error(handleApiError(response, "Failed to toggle section collapse"));
      }

      return {
        sectionId,
        isCollapsed: response.isCollapse
      };
    } catch (error) {
      console.error("Error toggling section collapse:", error);
      return rejectWithValue(error.message);
    }
  },
);

// Persisted state keys
const PERSISTED_TASK_PANEL_KEY = 'sectionTaskPanelState';

// Load persisted state from localStorage
const loadPersistedState = () => {
  try {
    const persistedState = localStorage.getItem(PERSISTED_TASK_PANEL_KEY);
    if (persistedState) {
      const parsed = JSON.parse(persistedState);
      return {
        selectedTask: parsed.selectedTask || null,
        isTaskPanelOpen: parsed.isTaskPanelOpen || false,
      };
    }
  } catch (error) {
    console.error('Error loading persisted task panel state:', error);
  }
  return {
    selectedTask: null,
    isTaskPanelOpen: false,
  };
};

// Save state to localStorage
const savePersistedState = (state) => {
  try {
    const stateToPersist = {
      selectedTask: state.selectedTask,
      isTaskPanelOpen: state.isTaskPanelOpen,
    };
    localStorage.setItem(PERSISTED_TASK_PANEL_KEY, JSON.stringify(stateToPersist));
  } catch (error) {
    console.error('Error saving task panel state:', error);
  }
};

// Save updated task data to localStorage
const saveUpdatedTaskToStorage = (taskId, updates) => {
  try {
    const existingState = JSON.parse(localStorage.getItem(PERSISTED_TASK_PANEL_KEY) || '{}');
    if (existingState.selectedTask && existingState.selectedTask._id === taskId) {
      existingState.selectedTask = {
        ...existingState.selectedTask,
        ...updates,
      };
      localStorage.setItem(PERSISTED_TASK_PANEL_KEY, JSON.stringify(existingState));
    }
  } catch (error) {
    console.error('Error saving updated task to localStorage:', error);
  }
};

// Clear persisted state
const clearPersistedState = () => {
  try {
    localStorage.removeItem(PERSISTED_TASK_PANEL_KEY);
  } catch (error) {
    console.error('Error clearing persisted task panel state:', error);
  }
};

const persistedState = loadPersistedState();

// Initial state
const initialState = {
  sections: [],
  selectedTasks: [],
  selectedTask: persistedState.selectedTask,
  selectedSection: null,
  loading: false,
  error: null,
  filters: mergedInitialFilters,
  searchResults: [],
  isSearching: false,
  draggedTask: null,
  isTaskPanelOpen: persistedState.isTaskPanelOpen,
  originalTaskData: {}, // Store original task data for optimistic updates
  taskStats: {
    recent: 0,
    high_priority: 0,
    in_progress: 0,
    pending: 0,
    overdue: 0,
    completed: 0,
    on_hold: 0,
  },
  metadata: {
    totalTasks: 0,
    totalSections: 0,
    lastUpdated: null,
    version: "1.0",
  },
  // Pagination state
  pagination: {
    sections: {
      count: 0,
      next: null,
      previous: null,
      currentPage: 1,
      totalPages: 0,
      pageSize: 50,
    },
    tasks: {}, // Per-section task pagination
  },
  // Task attachments state
  taskAttachments: [],
  // Store original section data for rollback
  originalSectionData: null,
};

const sectionTaskSlice = createSlice({
  name: "sectionTasks",
  initialState,
  reducers: {
    resetFilters: (state) => {
      state.filters = defaultFilters;
      localStorage.removeItem(STORAGE_KEY);
    },
    // Section management
    toggleSectionCollapse: (state, action) => {
      const sectionId = action.payload;
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        section.isCollapsed = !section.isCollapsed;
      }
    },

    setSectionLoadingTasks: (state, action) => {
      const { sectionId, isLoading } = action.payload;
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        section.isLoadingTasks = isLoading;
      }
    },

    setSelectedSection: (state, action) => {
      state.selectedSection = action.payload;
    },

    // Task selection
    toggleTaskSelection: (state, action) => {
      const taskId = action.payload;

      const index = state.selectedTasks.indexOf(taskId);
      if (index === -1) {
        state.selectedTasks.push(taskId);
      } else {
        state.selectedTasks.splice(index, 1);
      }
    },

    selectAllTasksInSection: (state, action) => {
      const { sectionId, shouldSelect } = action.payload;
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        const taskIds = section.tasks.map((task) => task._id);
        if (shouldSelect) {
          // Add tasks that aren't already selected
          taskIds.forEach((id) => {
            if (!state.selectedTasks.includes(id)) {
              state.selectedTasks.push(id);
            }
          });
        } else {
          // Remove all tasks from this section
          state.selectedTasks = state.selectedTasks.filter(
            (id) => !taskIds.includes(id),
          );
        }
      }
    },

    clearSelectedTasks: (state) => {
      state.selectedTasks = [];
    },

    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
      state.isTaskPanelOpen = !!action.payload;
      savePersistedState(state);
    },

    toggleTaskPanel: (state, action) => {
      state.isTaskPanelOpen =
        action.payload !== undefined ? action.payload : !state.isTaskPanelOpen;
      if (!state.isTaskPanelOpen) {
        state.selectedTask = null;
      }
      savePersistedState(state);
    },

    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.filters));
      } catch (error) {
        console.error("Error persisting filters:", error);
      }
    },

    resetFilters: (state) => {
      state.filters = defaultFilters;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Error clearing persisted filters:", error);
      }
    },

    // Search
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
      state.isSearching = false;
    },

    setSearching: (state, action) => {
      state.isSearching = action.payload;
    },

    // Drag and drop
    setDraggedTask: (state, action) => {
      state.draggedTask = action.payload;
    },

    // Local task updates (optimistic updates)
    updateTaskLocally: (state, action) => {
      const { taskId, updates } = action.payload;

      // Convert taskId to number for consistent comparison
      const taskIdNum = Number(taskId);
      const taskIdStr = String(taskId);

      for (const section of state.sections) {
        const taskIndex = section.tasks?.findIndex(
          (task) => {
            // Check multiple ID formats for matching
            return task._id == taskId ||
              task.taskId == taskId ||
              Number(task._id) === taskIdNum ||
              Number(task.taskId) === taskIdNum ||
              String(task._id) === taskIdStr ||
              String(task.taskId) === taskIdStr;
          }
        );

        if (taskIndex !== -1 && taskIndex !== undefined && section.tasks) {
          section.tasks[taskIndex] = {
            ...section.tasks[taskIndex],
            ...updates,
          };

          // Save updated task data to localStorage if it's the selected task
          saveUpdatedTaskToStorage(taskId, updates);

          // Update selected task if it matches
          if (state.selectedTask) {
            const isMatchingTask = state.selectedTask._id == taskId ||
              state.selectedTask.taskId == taskId ||
              Number(state.selectedTask._id) === taskIdNum ||
              Number(state.selectedTask.taskId) === taskIdNum ||
              String(state.selectedTask._id) === taskIdStr ||
              String(state.selectedTask.taskId) === taskIdStr;

            if (isMatchingTask) {
              state.selectedTask = {
                ...state.selectedTask,
                ...updates,
              };
            }
          }

          break;
        }
      }
    },

    // Update subtask count on a task
    updateTaskSubtaskCount: (state, action) => {
      const { taskId, newCount } = action.payload;

      for (const section of state.sections) {
        const taskIndex = section.tasks.findIndex(
          (task) => task._id === taskId,
        );
        if (taskIndex !== -1) {
          section.tasks[taskIndex].subtask_count = newCount;
          break;
        }
      }

      // Update selected task if it matches
      if (state.selectedTask && state.selectedTask._id === taskId) {
        state.selectedTask.subtask_count = newCount;
      }
    },

    // Update task time data (for manual time updates)
    updateTaskTimeData: (state, action) => {
      const { taskId, total_time, timer_type } = action.payload;

      for (const section of state.sections) {
        const taskIndex = section.tasks.findIndex(
          (task) => task._id === taskId || task.taskId === taskId,
        );
        if (taskIndex !== -1) {
          section.tasks[taskIndex].total_time = total_time;
          if (timer_type !== undefined) {
            section.tasks[taskIndex].timer_type = timer_type;
          }
          break;
        }
      }

      // Update selected task if it matches
      if (state.selectedTask && (state.selectedTask._id === taskId || state.selectedTask.taskId === taskId)) {
        state.selectedTask.total_time = total_time;
        if (timer_type !== undefined) {
          state.selectedTask.timer_type = timer_type;
        }
      }
    },

    // Update comment count on a task
    updateTaskCommentCount: (state, action) => {
      const { taskId, newCount } = action.payload;

      for (const section of state.sections) {
        const taskIndex = section.tasks.findIndex(
          (task) => task._id === taskId,
        );
        if (taskIndex !== -1) {
          section.tasks[taskIndex].total_comments = newCount;
          section.tasks[taskIndex].commentCount = newCount;
          break;
        }
      }

      // Update selected task if it matches
      if (state.selectedTask && state.selectedTask._id === taskId) {
        state.selectedTask.total_comments = newCount;
        state.selectedTask.commentCount = newCount;
      }
    },

    // Optimistic move task between sections
    moveTaskBetweenSectionsOptimistic: (state, action) => {
      const {
        taskId,
        sourceSectionId,
        destinationSectionId,
        sourceIndex,
        destinationIndex,
      } = action.payload;

      const sourceSection = state.sections.find(
        (s) => s.id == sourceSectionId || s.id === String(sourceSectionId),
      );
      const destSection = state.sections.find(
        (s) =>
          s.id == destinationSectionId || s.id === String(destinationSectionId),
      );

      if (sourceSection && destSection && sourceSection.tasks) {
        // Validate indices
        if (sourceIndex < 0 || sourceIndex >= sourceSection.tasks.length) {
          console.error("❌ Redux: Invalid source index:", {
            sourceIndex,
            maxIndex: sourceSection.tasks.length - 1,
          });
          return;
        }

        // Store original data for potential rollback
        state.originalTaskData = {
          taskId,
          sourceSectionId,
          destinationSectionId,
          originalIndex: sourceIndex,
        };

        // Find and remove task from source section by ID (more reliable than index)
        const taskIndex = sourceSection.tasks.findIndex(task =>
          (task._id && task._id.toString() === taskId.toString()) ||
          (task.taskId && task.taskId.toString() === taskId.toString())
        );

        if (taskIndex === -1) {
          console.error("❌ Redux: Task not found in source section", {
            taskId,
            sourceSectionId,
            availableTaskIds: sourceSection.tasks.map(t => t._id || t.taskId)
          });
          return;
        }

        const [removedTask] = sourceSection.tasks.splice(taskIndex, 1);

        // Update task count for source section
        if (sourceSection.taskCount !== undefined) {
          sourceSection.taskCount = Math.max(0, sourceSection.taskCount - 1);
        }

        // Update task properties
        const updatedTask = {
          ...removedTask,
          sectionId: destinationSectionId,
        };

        // Add task to destination section
        if (!destSection.tasks) {
          destSection.tasks = [];
        }
        destSection.tasks.splice(destinationIndex, 0, updatedTask);

        // Update task count for destination section
        if (destSection.taskCount !== undefined) {
          destSection.taskCount += 1;
        }

        // Update taskOrder values to maintain proper ordering
        // The moved task should have a taskOrder that places it at the correct position
        const movedTask = destSection.tasks[destinationIndex];
        if (movedTask) {
          // Calculate the appropriate taskOrder for the destination position
          if (destinationIndex === 0) {
            // If placed at the top, give it a higher order than the next task
            const nextTask = destSection.tasks[1];
            movedTask.taskOrder = nextTask ? nextTask.taskOrder + 1 : 1;
          } else if (destinationIndex === destSection.tasks.length - 1) {
            // If placed at the bottom, give it a lower order than the previous task
            const prevTask = destSection.tasks[destinationIndex - 1];
            movedTask.taskOrder = prevTask ? prevTask.taskOrder - 1 : 0;
          } else {
            // If placed in the middle, interpolate between adjacent tasks
            const prevTask = destSection.tasks[destinationIndex - 1];
            const nextTask = destSection.tasks[destinationIndex + 1];
            if (prevTask && nextTask) {
              movedTask.taskOrder = (prevTask.taskOrder + nextTask.taskOrder) / 2;
            } else if (prevTask) {
              movedTask.taskOrder = prevTask.taskOrder - 1;
            } else if (nextTask) {
              movedTask.taskOrder = nextTask.taskOrder + 1;
            }
          }
        }
      } else {
        console.error(
          "❌ Redux: Failed to find sections or source tasks missing",
          {
            hasSourceSection: !!sourceSection,
            hasDestSection: !!destSection,
            hasSourceTasks: !!sourceSection?.tasks,
            sourceSectionId,
            destinationSectionId,
            availableSections: state.sections.map((s) => ({
              id: s.id,
              type: typeof s.id,
            })),
          },
        );
      }
    },

    // Update section name
    updateSectionName: (state, action) => {
      const { sectionId, newName } = action.payload;
      const section = state.sections.find((s) => s.id === sectionId);
      if (section) {
        section.name = newName;
      }
    },

    // Swap task order optimistically
    swapTaskOrderOptimistic: (state, action) => {
      const { firstTaskId, secondTaskId } = action.payload;

      // Find both tasks across all sections
      let firstTask = null;
      let secondTask = null;
      let firstTaskSection = null;
      let secondTaskSection = null;

      for (const section of state.sections) {
        for (const task of section.tasks) {
          const taskIdentifier = task.taskId || task._id;
          if (taskIdentifier == firstTaskId) {
            firstTask = task;
            firstTaskSection = section;
          }
          if (taskIdentifier == secondTaskId) {
            secondTask = task;
            secondTaskSection = section;
          }
        }
      }

      if (firstTask && secondTask) {
        // Swap taskOrder values
        const tempOrder = firstTask.taskOrder;
        firstTask.taskOrder = secondTask.taskOrder;
        secondTask.taskOrder = tempOrder;

        // Keep tasks as they come from API without reordering
      }
    },

    // Swap section order optimistically (simple swap)
    swapSectionOrderOptimistic: (state, action) => {
      const { firstSectionId, secondSectionId } = action.payload;

      // Find both sections
      const firstSectionIndex = state.sections.findIndex(
        (s) => s.id == firstSectionId || s.id === String(firstSectionId)
      );
      const secondSectionIndex = state.sections.findIndex(
        (s) => s.id == secondSectionId || s.id === String(secondSectionId)
      );

      if (firstSectionIndex !== -1 && secondSectionIndex !== -1) {
        // Store original data for potential rollback
        const firstSection = state.sections[firstSectionIndex];
        const secondSection = state.sections[secondSectionIndex];

        // Store original state for rollback
        state.originalSectionData = {
          firstSection: { ...firstSection },
          secondSection: { ...secondSection },
          firstIndex: firstSectionIndex,
          secondIndex: secondSectionIndex,
        };

        // Swap the sections in the array
        const temp = state.sections[firstSectionIndex];
        state.sections[firstSectionIndex] = state.sections[secondSectionIndex];
        state.sections[secondSectionIndex] = temp;

        // Update their order numbers
        const tempOrder = firstSection.orderNumber || firstSection.order || 0;
        firstSection.orderNumber = secondSection.orderNumber || secondSection.order || 0;
        secondSection.orderNumber = tempOrder;
      }
    },

    // Reorder sections optimistically (complex reordering)
    reorderSectionsOptimistic: (state, action) => {
      const { draggedSectionId, sourceIndex, destinationIndex } = action.payload;

      // Store original state for rollback
      state.originalSectionData = {
        sections: [...state.sections],
        draggedSectionId,
        sourceIndex,
        destinationIndex,
      };

      // Remove the dragged section from its original position
      const draggedSection = state.sections[sourceIndex];
      const newSections = [...state.sections];
      newSections.splice(sourceIndex, 1);

      // Insert the dragged section at the destination position
      newSections.splice(destinationIndex, 0, draggedSection);

      // Update the sections array
      state.sections = newSections;

      // Update order numbers for all sections
      newSections.forEach((section, index) => {
        section.orderNumber = index + 1;
        section.order = index + 1;
      });
    },

    // Reorder tasks within section optimistically
    reorderTasksInSectionOptimistic: (state, action) => {
      const { sectionId, draggedTaskId, sourceIndex, destinationIndex } = action.payload;

      // Find the section
      const section = state.sections.find(s => s.id === sectionId);
      if (!section || !section.tasks) return;

      // Store original state for rollback
      state.originalTaskData = {
        sectionId,
        tasks: [...section.tasks],
        draggedTaskId,
        sourceIndex,
        destinationIndex,
      };

      // Remove the dragged task from its original position
      const draggedTask = section.tasks[sourceIndex];
      const newTasks = [...section.tasks];
      newTasks.splice(sourceIndex, 1);

      // Insert the dragged task at the destination position
      newTasks.splice(destinationIndex, 0, draggedTask);

      // Update the tasks array in the section
      section.tasks = newTasks;

      // Update order numbers for all tasks
      newTasks.forEach((task, index) => {
        task.orderInSection = index + 1;
        task.taskOrder = index + 1;
      });
    },

    // Pagination actions
    setSectionPagination: (state, action) => {
      state.pagination.sections = { ...state.pagination.sections, ...action.payload };
    },

    setTaskPagination: (state, action) => {
      const { sectionId, pagination } = action.payload;
      state.pagination.tasks[sectionId] = pagination;
    },

    // Pagination actions are now handled by async thunks

    // Update section tasks with pagination
    updateSectionTasks: (state, action) => {
      const { sectionId, tasks, append = false } = action.payload;
      const section = state.sections.find(s => s.id === sectionId);

      if (section) {
        if (append) {
          // Append new tasks to existing ones
          section.tasks = [...(section.tasks || []), ...tasks];
        } else {
          // Replace existing tasks but preserve temporary/initial tasks
          const oldTasks = section.tasks || [];
          const temporaryTasks = oldTasks.filter(task => task.initial === true);
          section.tasks = [...temporaryTasks, ...tasks];
        }
      }
    },

    // Clear section tasks when section is collapsed
    clearSectionTasks: (state, action) => {
      const { sectionId } = action.payload;
      const section = state.sections.find(s => s.id === sectionId);

      if (section) {
        section.tasks = [];
        section.isLoadingTasks = false;
        // Clear pagination for this section
        if (state.pagination.tasks[sectionId]) {
          delete state.pagination.tasks[sectionId];
        }
      }
    },

    // Add temporary task to section (for local task creation)
    addTemporaryTask: (state, action) => {
      const { sectionId, task } = action.payload;
      const section = state.sections.find(s => s.id === sectionId);

      if (section) {
        // Add task at the top of the section
        if (!section.tasks) {
          section.tasks = [];
        }

        // Check if task with this ID already exists (prevent duplicates)
        const existingTask = section.tasks.find(t => t._id === task._id);
        if (existingTask) {

          return;
        }

        section.tasks.unshift(task);
      }
    },

    // Update task in state (for local updates during editing)
    updateTaskInState: (state, action) => {
      const { _id, ...updates } = action.payload;

      for (const section of state.sections) {
        if (section.tasks) {
          const taskIndex = section.tasks.findIndex(
            task => task._id === _id || task.taskId === _id
          );

          if (taskIndex !== -1) {
            section.tasks[taskIndex] = {
              ...section.tasks[taskIndex],
              ...updates
            };

            // Update selected task if it matches
            if (state.selectedTask && (state.selectedTask._id === _id || state.selectedTask.taskId === _id)) {
              state.selectedTask = {
                ...state.selectedTask,
                ...updates
              };
            }
            break;
          }
        }
      }
    },

    // Remove temporary task from section
    removeTemporaryTask: (state, action) => {
      const { sectionId, taskId } = action.payload;
      const section = state.sections.find(s => s.id === sectionId);

      if (section && section.tasks) {
        section.tasks = section.tasks.filter(
          task => task._id !== taskId && task.taskId !== taskId
        );
      }
    },

    // Replace temporary task with real task after creation
    replaceTemporaryTask: (state, action) => {
      const { sectionId, tempId, newTask } = action.payload;
      const section = state.sections.find(s => s.id === sectionId);

      if (section && section.tasks) {
        const taskIndex = section.tasks.findIndex(
          task => task._id === tempId
        );

        if (taskIndex !== -1) {
          section.tasks[taskIndex] = newTask;
        }
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch section tasks
      .addCase(fetchSectionTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectionTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.sections = (action.payload.sections || []).map((section) => ({
          ...section,
          isCollapsed:
            section.isCollapsed !== undefined ? section.isCollapsed : false,
          // Show tasks as they come from API without sorting
          tasks: section.tasks || [],
        }));
        state.metadata = action.payload.metadata || state.metadata;
        state.taskStats = action.payload.metadata?.taskStats || state.taskStats;

        // Update pagination state
        if (action.payload.pagination) {
          state.pagination.sections = { ...state.pagination.sections, ...action.payload.pagination };
        }
      })
      .addCase(fetchSectionTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // ��️ REMOVED: Old load more reducers - now using unified fetchPaginatedData



      // 📂 SECTION PAGINATION API - fetchSectionsPaginated
      .addCase(fetchSectionsPaginated.pending, (state) => {
        state.error = null;
        state.loading = true;
      })
      .addCase(fetchSectionsPaginated.fulfilled, (state, action) => {
        const { sections, pagination, append } = action.payload;
        state.loading = false;

        if (append) {
          // Append new sections to existing ones
          state.sections = [...state.sections, ...sections.map((section) => ({
            ...section,
            isCollapsed: section.isCollapsed !== undefined ? section.isCollapsed : false,
            tasks: section.tasks || [],
          }))];
        } else {
          // Replace sections (fresh data)
          state.sections = sections.map((section) => ({
            ...section,
            isCollapsed: section.isCollapsed !== undefined ? section.isCollapsed : false,
            tasks: section.tasks || [],
          }));
        }

        // Update section pagination
        if (pagination) {
          state.pagination.sections = { ...state.pagination.sections, ...pagination };
        }
      })
      .addCase(fetchSectionsPaginated.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // 📋 TASK PAGINATION API - fetchTasksPaginated
      .addCase(fetchTasksPaginated.pending, (state, action) => {
        state.error = null;
        const { sectionId } = action.meta.arg;

        // Set loading state for specific section
        const section = state.sections.find(s => s.id === sectionId);
        if (section) {
          section.isLoadingTasks = true;
        }
      })
      .addCase(fetchTasksPaginated.fulfilled, (state, action) => {
        const { sectionId, tasks, pagination, append } = action.payload;

        // Handle task pagination response
        // Convert sectionId to the same type as stored section IDs for consistent comparison
        const section = state.sections.find(s => s.id == sectionId); // Use == for type coercion
        if (section) {
          if (append) {
            // Append new tasks to existing ones, but prevent duplicates
            const oldTasks = section.tasks || [];
            const existingTaskIds = new Set(oldTasks.map(task => task._id || task.taskId));

            // Filter out tasks that already exist to prevent duplicates
            const newTasks = tasks.filter(task => {
              const taskId = task._id || task.taskId;
              return !existingTaskIds.has(taskId);
            });

            section.tasks = [...oldTasks, ...newTasks];
          } else {
            // Replace tasks but preserve temporary/initial tasks (newly created, unsaved)
            const oldTasks = section.tasks || [];
            const temporaryTasks = oldTasks.filter(task => task.initial === true);

            // Combine temporary tasks with new fetched tasks
            section.tasks = [...temporaryTasks, ...tasks];
          }

          // Update task count from pagination if available (for filtered results)
          if (pagination && pagination.count !== undefined) {
            section.taskCount = pagination.count;
          }

          // Show tasks as they come from API without sorting
          section.isLoadingTasks = false;
        }

        // Update task pagination for this section
        state.pagination.tasks[sectionId] = pagination;
      })
      .addCase(fetchTasksPaginated.rejected, (state, action) => {
        state.error = action.payload;
        const { sectionId } = action.meta.arg;

        // Clear loading state for specific section
        const section = state.sections.find(s => s.id === sectionId);
        if (section) {
          section.isLoadingTasks = false;
        }
      })

      // 🎯 Apply filters to all expanded sections
      .addCase(applyFiltersToAllExpandedSections.pending, (state) => {
        state.error = null;
        // Set loading state for all expanded sections
        state.sections.forEach(section => {
          if (!section.isCollapsed) {
            section.isLoadingTasks = true;
          }
        });
      })
      .addCase(applyFiltersToAllExpandedSections.fulfilled, (state, action) => {
        const { filters, sectionsUpdated } = action.payload;

        // Store the applied filters
        state.filters = { ...state.filters, ...filters };

        // Clear loading states - individual section updates are handled by fetchTasksPaginated
        state.sections.forEach(section => {
          if (!section.isCollapsed) {
            section.isLoadingTasks = false;
          }
        });
      })
      .addCase(applyFiltersToAllExpandedSections.rejected, (state, action) => {
        state.error = action.payload;
        // Clear loading states for all sections
        state.sections.forEach(section => {
          section.isLoadingTasks = false;
        });
      })

      // Create task in section
      // Create task
      .addCase(createTaskInSection.pending, (state, action) => {
        state.loading = false; // Don't show loading for optimistic updates

        const { sectionId, taskData, tempId } = action.meta.arg;

        // Find the section
        const section = state.sections.find(
          (s) => s.id == sectionId || s.id.toString() === sectionId.toString(),
        );

        if (section && section.tasks) {
          // Check if temporary task already exists (added via addTemporaryTask)
          const existingTempTask = section.tasks.find(
            (t) => t._id === tempId && (t.initial || t.isOptimistic)
          );

          if (existingTempTask) {
            // Task already exists, just update it with any new data

            return;
          }

          // Only create optimistic task if it doesn't already exist
          const optimisticTask = {
            _id: tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            taskId: null,
            taskName: taskData.taskName || "New Task",
            description: taskData.description || "",
            priority: taskData.priority || "medium",
            dueDate: taskData.dueDate || null,
            isComplete: false,
            sectionId: sectionId,
            orderInSection: 0,
            user_name: taskData.user_name || "",
            assign_name: taskData.assign_name || "",
            client_name: taskData.client_name || "",
            projectName: taskData.projectName || "",
            total_time: "00:00:00",
            allocated_time: "1.00",
            allocated_hours_percentage: 0,
            time_difference: 1,
            total_comments: 0,
            total_attached_files: 0,
            taskPosition: taskData.taskPosition || "not_started_yet",
            project_status: taskData.project_status || [],
            isDelete: false,
            files: [],
            repeat: "not_repeatable",
            repeat_days: null,
            attachments: [],
            isImported: false,
            parent: null,
            projectId: taskData.projectId || null,
            userId: taskData.userId || null,
            assignBy: null,
            assignClientBy: null,
            liked_by: [],
            assigned_users: taskData.assigned_users || [],
            collaborators: [],
            seen_by: [],
            isOptimistic: true,
          };

          section.tasks = section.tasks || [];
          section.tasks.unshift(optimisticTask);
        }
      })
      .addCase(createTaskInSection.fulfilled, (state, action) => {
        state.loading = false;
        const { task, sectionId, tempId } = action.payload;

        const section = state.sections.find(
          (s) => s.id == sectionId || s.id.toString() === sectionId.toString(),
        );

        if (section && section.tasks) {
          // Find the temporary task by exact ID match
          const tempTaskIndex = section.tasks.findIndex(
            (t) => t._id === tempId
          );

          if (tempTaskIndex !== -1) {
            // Get the original temp task to preserve any UI state
            const originalTempTask = section.tasks[tempTaskIndex];

            // Update the task in place - this keeps the row and just updates the data
            // Smooth transition: same row, just updated content
            const updatedTask = {
              ...originalTempTask, // Preserve any temporary properties
              ...task, // Apply real task data from API
              _id: task._id || task.taskId, // Use real ID from server
              taskId: task.taskId, // Set taskId
              taskCode: task.taskCode, // Set task code from server (e.g., AA-49)
              isOptimistic: false, // No longer optimistic
              initial: false, // No longer initial/temporary
              orderInSection: 0,
            };

            // Replace at the same index - smooth transition, no flicker!
            section.tasks[tempTaskIndex] = updatedTask;

            // Handle selection state transfer from temp task to real task
            const tempTaskId = tempId;
            const realTaskId = task._id || task.taskId;

            if (state.selectedTasks.includes(tempTaskId)) {
              // Remove temp ID and add real ID to maintain selection
              state.selectedTasks = state.selectedTasks.filter(id => id !== tempTaskId);
              if (!state.selectedTasks.includes(realTaskId)) {
                state.selectedTasks.push(realTaskId);
              }
            }

            // Increment task count since we replaced a temp task with a real task
            state.metadata.totalTasks += 1;
            if (section.taskCount !== undefined) {
              section.taskCount += 1;
            }


          } else {
            // Fallback: add as new task if temporary task not found
            console.warn('⚠️ Temp task not found, adding new task');
            section.tasks = section.tasks || [];
            section.tasks.unshift({ ...task, updated_at: null });

            // Handle selection state transfer from temp task to real task
            const tempTaskId = tempId;
            const realTaskId = task._id || task.taskId;

            if (state.selectedTasks.includes(tempTaskId)) {
              // Remove temp ID and add real ID to maintain selection
              state.selectedTasks = state.selectedTasks.filter(id => id !== tempTaskId);
              if (!state.selectedTasks.includes(realTaskId)) {
                state.selectedTasks.push(realTaskId);
              }
            }

            state.metadata.totalTasks += 1;

            // Update task count only if it was a fallback
            if (section.taskCount !== undefined) {
              section.taskCount += 1;
            }
          }
        } else {
          console.error("❌ Section not found! Cannot add task.");
        }
      })
      .addCase(createTaskInSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.payload;

        const { sectionId, taskData } = action.meta.arg;

        // Find and remove the optimistic task
        const section = state.sections.find(
          (s) => s.id == sectionId || s.id.toString() === sectionId.toString(),
        );

        if (section && section.tasks) {
          const optimisticTaskIndex = section.tasks.findIndex(
            (t) => t.isOptimistic && t.taskName === taskData.taskName,
          );

          if (optimisticTaskIndex !== -1) {
            section.tasks.splice(optimisticTaskIndex, 1);
            // Keep tasks as they come from API without reordering
          }
        }
      })

      .addCase(updateTaskInSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Revert optimistic updates if backend call failed
        if (action.meta?.arg?.taskId) {
          const taskId = action.meta.arg.taskId;
          if (state.originalTaskData && state.originalTaskData[taskId]) {
            state.sections.forEach((section) => {
              const taskIndex = section.tasks.findIndex(
                (task) => task._id === taskId,
              );
              if (taskIndex !== -1) {
                section.tasks[taskIndex] = state.originalTaskData[taskId];
              }
            });
            delete state.originalTaskData[taskId];
          }
        }
      })

      // Update task
      .addCase(updateTaskInSection.pending, (state, action) => {
        const { taskId, updates } = action.meta.arg;
        state.loading = false; // Don't show loading for optimistic updates

        // Ensure originalTaskData exists
        if (!state.originalTaskData) {
          state.originalTaskData = {};
        }

        // Store original task data for potential rollback
        for (const section of state.sections) {
          const taskIndex = section.tasks.findIndex(
            (task) => task._id === taskId,
          );
          if (taskIndex !== -1) {
            const currentTask = section.tasks[taskIndex];
            if (currentTask && taskId) {
              state.originalTaskData[taskId] = { ...currentTask };

              // Only update properties that actually changed
              Object.keys(updates).forEach(key => {
                if (currentTask[key] !== updates[key]) {
                  currentTask[key] = updates[key];
                }
              });
              currentTask.updated_at = new Date().toISOString();
            }
            break;
          }
        }
      })
      .addCase(updateTaskInSection.fulfilled, (state, action) => {
        const { taskId, updates, result } = action.payload;
        state.loading = false;

        // Clear stored original data since update was successful
        if (state.originalTaskData && taskId) {
          delete state.originalTaskData[taskId];
        }

        // Apply backend response if available
        for (const section of state.sections) {
          const taskIndex = section.tasks.findIndex(
            (task) => task._id === taskId,
          );
          if (taskIndex !== -1) {
            const currentTask = section.tasks[taskIndex];

            // Use backend result if available, otherwise keep optimistic updates
            if (result && result.data) {
              try {
                const transformedResult = transformTaskResponse(result.data);
                // Only update properties that actually changed
                Object.keys(transformedResult).forEach(key => {
                  if (currentTask[key] !== transformedResult[key]) {
                    currentTask[key] = transformedResult[key];
                  }
                });
              } catch (error) {
                console.error("Error transforming result.data:", error);
                // Fallback to optimistic updates
                Object.keys(updates).forEach(key => {
                  if (currentTask[key] !== updates[key]) {
                    currentTask[key] = updates[key];
                  }
                });
                currentTask.updated_at = new Date().toISOString();
              }
            } else if (result && typeof result === 'object') {
              // Handle case where result might be the data directly
              try {
                // Check if result has task_details (backend wrapper format)
                const taskData = result.task_details || result;
                const transformedResult = transformTaskResponse(taskData);

                // Only update properties that actually changed
                Object.keys(transformedResult).forEach(key => {
                  if (currentTask[key] !== transformedResult[key]) {
                    currentTask[key] = transformedResult[key];
                  }
                });
              } catch (error) {
                console.error("Error transforming result:", error);
                // Fallback to optimistic updates
                Object.keys(updates).forEach(key => {
                  if (currentTask[key] !== updates[key]) {
                    currentTask[key] = updates[key];
                  }
                });
                currentTask.updated_at = new Date().toISOString();
              }
            } else {
              // Only update properties that actually changed
              Object.keys(updates).forEach(key => {
                if (currentTask[key] !== updates[key]) {
                  currentTask[key] = updates[key];
                }
              });
              currentTask.updated_at = new Date().toISOString();
            }

            break;
          }
        }
      })

      // Delete task
      .addCase(deleteTaskFromSection.fulfilled, (state, action) => {
        const { taskId } = action.payload;
        for (const section of state.sections) {
          const taskIndex = section.tasks.findIndex(
            (task) => task._id === taskId,
          );
          if (taskIndex !== -1) {
            section.tasks.splice(taskIndex, 1);
            state.selectedTasks = state.selectedTasks.filter(
              (id) => id !== taskId,
            );
            state.metadata.totalTasks -= 1;

            // Update task count
            if (section.taskCount !== undefined && section.taskCount > 0) {
              section.taskCount -= 1;
            }

            break;
          }
        }
      })

      // Fetch task by ID
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        // Task is handled by openTaskFromUrl if needed
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Open task from URL
      .addCase(openTaskFromUrl.pending, (state) => {
        state.loading = true;
      })
      .addCase(openTaskFromUrl.fulfilled, (state, action) => {
        state.loading = false;
        // Task panel state is already updated by the thunk
      })
      .addCase(openTaskFromUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Move task between sections
      .addCase(moveTaskBetweenSections.fulfilled, (state, action) => {
        const { taskId, fromSectionId, toSectionId, newOrder } = action.payload;

        const fromSection = state.sections.find((s) => s.id === fromSectionId);
        const toSection = state.sections.find((s) => s.id === toSectionId);

        if (fromSection && toSection) {
          const taskIndex = fromSection.tasks.findIndex(
            (task) => task._id === taskId,
          );
          if (taskIndex !== -1) {
            const [task] = fromSection.tasks.splice(taskIndex, 1);
            task.sectionId = toSectionId;
            task.orderInSection = newOrder;
            toSection.tasks.splice(newOrder, 0, task);
          }
        }
      })

      // Create new section
      .addCase(createNewSection.pending, (state) => {
        state.loading = true;
      })
      .addCase(createNewSection.fulfilled, (state, action) => {
        state.loading = false;
        state.sections.push(action.payload);
        state.metadata.totalSections += 1;
      })
      .addCase(createNewSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Swap section order
      .addCase(swapSectionOrder.pending, (state) => {
        // Don't show loading for optimistic updates
        state.loading = false;
      })
      .addCase(swapSectionOrder.fulfilled, (state, action) => {
        state.loading = false;
        const { firstSectionId, secondSectionId, section1, section2 } = action.payload;

        // Update sections with backend response data if available
        if (section1 && section2) {
          const firstSectionIndex = state.sections.findIndex(
            (s) => s.id == firstSectionId || s.id === String(firstSectionId),
          );
          const secondSectionIndex = state.sections.findIndex(
            (s) => s.id == secondSectionId || s.id === String(secondSectionId),
          );

          if (firstSectionIndex !== -1 && secondSectionIndex !== -1) {
            // Update order numbers from backend response
            state.sections[firstSectionIndex].orderNumber = section1.orderNumber;
            state.sections[secondSectionIndex].orderNumber = section2.orderNumber;
          }
        }

        // Clear stored original data since swap was successful
        if (state.originalSectionData) {
          delete state.originalSectionData;
        }
      })
      .addCase(swapSectionOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

        // Rollback optimistic update if we have original data
        if (state.originalSectionData) {
          const { firstSection, secondSection, firstIndex, secondIndex } = state.originalSectionData;

          // Restore original sections
          if (firstIndex !== -1 && secondIndex !== -1) {
            state.sections[firstIndex] = { ...firstSection };
            state.sections[secondIndex] = { ...secondSection };
          }

          // Clear stored original data
          delete state.originalSectionData;
        }

        console.error("Failed to swap section order:", action.payload);
      })

      // Change task section
      .addCase(changeTaskSection.pending, (state, action) => {
        state.loading = false; // Don't show loading for optimistic updates
        const { taskId, newSectionId, oldSectionId } = action.meta.arg;

        // Store original task data for potential rollback
        if (!state.originalTaskData) {
          state.originalTaskData = {};
        }

        // Find and move task optimistically
        const oldSection = state.sections.find((s) => s.id === oldSectionId);
        const newSection = state.sections.find((s) => s.id === newSectionId);

        if (oldSection && newSection) {
          const taskIndex = oldSection.tasks.findIndex(
            (t) => t._id === taskId || t.taskId === taskId,
          );

          if (taskIndex !== -1) {
            const task = oldSection.tasks[taskIndex];

            // Store original data for rollback
            state.originalTaskData[taskId] = {
              task: { ...task },
              originalSectionId: oldSectionId,
              originalIndex: taskIndex
            };

            // Remove task from old section
            const [movedTask] = oldSection.tasks.splice(taskIndex, 1);

            // Update task count for source section
            if (oldSection.taskCount !== undefined) {
              oldSection.taskCount = Math.max(0, oldSection.taskCount - 1);
            }

            // Update task's section references
            movedTask.sectionId = newSectionId;
            movedTask.section = newSectionId;
            movedTask.section_id = newSectionId;

            // Add task to new section (at the beginning for better visibility)
            newSection.tasks = newSection.tasks || [];
            newSection.tasks.unshift(movedTask);

            // Update task count for destination section
            if (newSection.taskCount !== undefined) {
              newSection.taskCount += 1;
            }

            // Update selected task if it matches
            if (state.selectedTask && state.selectedTask._id === taskId) {
              state.selectedTask.sectionId = newSectionId;
              state.selectedTask.section = newSectionId;
              state.selectedTask.section_id = newSectionId;
            }
          }
        }
      })
      .addCase(changeTaskSection.fulfilled, (state, action) => {
        state.loading = false;
        const { taskId } = action.payload;

        // Clear stored original data since the operation was successful
        if (state.originalTaskData && state.originalTaskData[taskId]) {
          delete state.originalTaskData[taskId];
        }

        // The optimistic update already moved the task, so we just confirm success
        state.error = null;
      })
      .addCase(changeTaskSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        const { taskId, newSectionId, oldSectionId } = action.meta.arg;

        // Rollback optimistic update on error
        if (state.originalTaskData && state.originalTaskData[taskId]) {
          const { task: originalTask, originalSectionId, originalIndex } = state.originalTaskData[taskId];

          // Find the task in the new section and move it back
          const newSection = state.sections.find((s) => s.id === newSectionId);
          const oldSection = state.sections.find((s) => s.id === originalSectionId);

          if (newSection && oldSection) {
            const taskIndex = newSection.tasks.findIndex(
              (t) => t._id === taskId || t.taskId === taskId,
            );

            if (taskIndex !== -1) {
              // Remove from new section
              const [task] = newSection.tasks.splice(taskIndex, 1);

              // Restore original task data
              Object.assign(task, originalTask);

              // Add back to original section at original position
              if (originalIndex !== undefined && originalIndex < oldSection.tasks.length) {
                oldSection.tasks.splice(originalIndex, 0, task);
              } else {
                oldSection.tasks.push(task);
              }

              // Rollback task counts
              if (oldSection.taskCount !== undefined) {
                oldSection.taskCount += 1;
              }
              if (newSection.taskCount !== undefined) {
                newSection.taskCount = Math.max(0, newSection.taskCount - 1);
              }

              // Update selected task if it matches
              if (state.selectedTask && state.selectedTask._id === taskId) {
                Object.assign(state.selectedTask, originalTask);
              }
            }
          }

          // Clear stored original data
          delete state.originalTaskData[taskId];
        }
      })

      // Drag and Drop reducers
      .addCase(reorderSections.pending, (state) => {
        // Don't set loading to true for better UX - optimistic update already happened
        state.loading = false;
      })
      .addCase(reorderSections.fulfilled, (state, action) => {
        // API call was successful, confirm the optimistic update
        // The optimistic update already placed the section in the correct position
        state.loading = false;
        state.error = null;

        // Clear the original data since the operation was successful
        if (state.originalSectionData) {
          delete state.originalSectionData;
        }
      })
      .addCase(reorderSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

        // Rollback the optimistic update on error
        if (state.originalSectionData) {
          state.sections = state.originalSectionData.sections;
          delete state.originalSectionData;
        }

        console.error("Failed to reorder sections:", action.payload);
      })

      .addCase(reorderTasksInSectionAsync.pending, (state) => {
        // Don't set loading to true for better UX - optimistic update already happened
        state.loading = false;
      })
      .addCase(reorderTasksInSectionAsync.fulfilled, (state, action) => {
        // API call was successful, confirm the optimistic update
        // The optimistic update already placed the task in the correct position
        state.loading = false;
        state.error = null;

        // Clear the original data since the operation was successful
        if (state.originalTaskData) {
          delete state.originalTaskData;
        }
      })
      .addCase(reorderTasksInSectionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

        // Rollback the optimistic update on error
        if (state.originalTaskData) {
          const section = state.sections.find(s => s.id === state.originalTaskData.sectionId);
          if (section) {
            section.tasks = state.originalTaskData.tasks;
          }
          delete state.originalTaskData;
        }

        console.error("Failed to reorder tasks:", action.payload);
      })

      .addCase(moveTaskBetweenSectionsWithOrder.pending, (state) => {
        // Don't set loading to true for better UX - optimistic update already happened
        // state.loading = true;
      })
      .addCase(moveTaskBetweenSectionsWithOrder.fulfilled, (state, action) => {
        const {
          taskId,
          sourceSectionId,
          destinationSectionId,
        } = action.payload;

        // The API call was successful, so we can confirm the optimistic update
        // The backend has handled the task ordering, so we don't need to update the arrays
        // The optimistic update already placed the task in the correct position

        state.loading = false;
      })
      .addCase(moveTaskBetweenSectionsWithOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

        // Rollback the optimistic update on error
        if (state.originalTaskData) {
          const { taskId, sourceSectionId, destinationSectionId } = state.originalTaskData;

          // Find the task in destination section and move it back to source
          const destinationSection = state.sections.find(s => s.id === destinationSectionId);
          const sourceSection = state.sections.find(s => s.id === sourceSectionId);

          if (destinationSection && sourceSection) {
            const taskIndex = destinationSection.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
              const [task] = destinationSection.tasks.splice(taskIndex, 1);
              // Restore to original position in source section
              if (state.originalTaskData.originalIndex !== undefined) {
                sourceSection.tasks.splice(state.originalTaskData.originalIndex, 0, task);
              } else {
                sourceSection.tasks.push(task);
              }

              // Rollback task counts
              if (sourceSection.taskCount !== undefined) {
                sourceSection.taskCount += 1;
              }
              if (destinationSection.taskCount !== undefined) {
                destinationSection.taskCount = Math.max(0, destinationSection.taskCount - 1);
              }
            }
          }

          delete state.originalTaskData;
        }

        console.error("Failed to move task:", action.payload);
      })

      // Update section name
      .addCase(updateSectionNameAsync.pending, (state) => {
        // Don't show loading for optimistic updates
        state.loading = false;
      })
      .addCase(updateSectionNameAsync.fulfilled, (state, action) => {
        const { sectionId, newName } = action.payload;
        const section = state.sections.find((s) => s.id === sectionId);
        if (section) {
          section.name = newName;
        }
        state.loading = false;
      })
      .addCase(updateSectionNameAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // On error, the optimistic update will remain, user can retry
        console.error("Failed to update section name:", action.payload);
      })

      // Swap task order
      .addCase(swapTaskOrderAsync.pending, (state) => {
        // Don't show loading for optimistic updates
        state.loading = false;
      })
      .addCase(swapTaskOrderAsync.fulfilled, (state, action) => {
        state.loading = false;
        // Optimistic update already applied, just confirm success
      })
      .addCase(swapTaskOrderAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("Failed to swap task order:", action.payload);
        // TODO: Could implement rollback logic here if needed
      })

      // Bulk delete tasks
      .addCase(bulkDeleteTasksAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkDeleteTasksAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { taskIds } = action.payload;

        // Remove deleted tasks from all sections and update task counts
        state.sections.forEach(section => {
          if (section.tasks) {
            const originalTaskCount = section.tasks.length;
            section.tasks = section.tasks.filter(task => !taskIds.includes(task._id));
            const deletedCount = originalTaskCount - section.tasks.length;

            // Update task count
            if (section.taskCount !== undefined && deletedCount > 0) {
              section.taskCount = Math.max(0, section.taskCount - deletedCount);
            }
          }
        });

        // Clear selected tasks
        state.selectedTasks = [];
      })
      .addCase(bulkDeleteTasksAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Bulk update tasks
      .addCase(bulkUpdateTasksAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkUpdateTasksAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { taskIds, updates } = action.payload;

        // Update tasks in all sections
        state.sections.forEach(section => {
          if (section.tasks) {
            section.tasks.forEach(task => {
              if (taskIds.includes(task._id)) {
                Object.assign(task, updates);
              }
            });
          }
        });
      })
      .addCase(bulkUpdateTasksAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Bulk change section
      .addCase(bulkChangeSectionAsync.pending, (state, action) => {
        state.loading = false; // Don't show loading for optimistic updates
        const { taskIds, sectionId } = action.meta.arg;

        // Perform optimistic update immediately
        const targetSection = state.sections.find(section => section.id === sectionId);
        const tasksToMove = [];

        // Store original task data for potential rollback
        const originalTasksData = {};

        // Remove tasks from their current sections and collect them
        state.sections.forEach(section => {
          if (section.tasks) {
            const remainingTasks = [];
            let movedFromThisSection = 0;

            section.tasks.forEach(task => {
              if (taskIds.includes(task._id)) {
                // Store original data for rollback
                originalTasksData[task._id] = {
                  task: { ...task },
                  originalSectionId: section.id
                };

                // Update task's section info
                task.section = sectionId;
                task.section_id = sectionId;
                task.sectionId = sectionId;
                tasksToMove.push(task);
                movedFromThisSection++;
              } else {
                remainingTasks.push(task);
              }
            });

            section.tasks = remainingTasks;

            // Update task count for source section
            if (section.taskCount !== undefined && movedFromThisSection > 0) {
              section.taskCount = Math.max(0, section.taskCount - movedFromThisSection);
            }
          }
        });

        // Add moved tasks to target section
        if (targetSection && tasksToMove.length > 0) {
          targetSection.tasks = [...(targetSection.tasks || []), ...tasksToMove];

          // Update task count for target section
          if (targetSection.taskCount !== undefined) {
            targetSection.taskCount += tasksToMove.length;
          }
        }

        // Store original data for potential rollback
        state.originalTaskData = { ...state.originalTaskData, ...originalTasksData };

        // Clear selected tasks
        state.selectedTasks = [];
      })
      .addCase(bulkChangeSectionAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { taskIds, sectionId } = action.payload;

        // API call was successful, confirm the optimistic update
        // The optimistic update already moved the tasks, so we just need to clean up

        // Clear stored original data since the operation was successful
        if (state.originalTaskData) {
          taskIds.forEach(taskId => {
            if (state.originalTaskData[taskId]) {
              delete state.originalTaskData[taskId];
            }
          });
        }

        // Ensure selected tasks are cleared (already done in pending, but just to be safe)
        state.selectedTasks = [];
      })
      .addCase(bulkChangeSectionAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        const { taskIds } = action.meta.arg;

        // Rollback optimistic updates if stored
        if (state.originalTaskData && Object.keys(state.originalTaskData).length > 0) {
          // Store task count changes for rollback
          const taskCountChanges = {};

          // First, remove tasks from their current (wrong) sections and track count changes
          state.sections.forEach(section => {
            if (section.tasks) {
              const originalTaskCount = section.tasks.length;
              section.tasks = section.tasks.filter(task => !taskIds.includes(task._id));
              const removedCount = originalTaskCount - section.tasks.length;

              // Track task count changes for rollback
              if (removedCount > 0 && section.taskCount !== undefined) {
                taskCountChanges[section.id] = (taskCountChanges[section.id] || 0) - removedCount;
              }
            }
          });

          // Restore tasks to their original sections and track count changes
          const tasksToRestore = [];
          taskIds.forEach(taskId => {
            if (state.originalTaskData[taskId]) {
              const { task: originalTask, originalSectionId } = state.originalTaskData[taskId];
              tasksToRestore.push({ originalTask, originalSectionId, taskId });

              // Add to original section task count
              if (originalSectionId && taskCountChanges[originalSectionId] !== undefined) {
                taskCountChanges[originalSectionId] += 1;
              } else if (originalSectionId) {
                taskCountChanges[originalSectionId] = 1;
              }
            }
          });

          // Apply task count changes
          Object.keys(taskCountChanges).forEach(sectionId => {
            const section = state.sections.find(s => s.id === sectionId);
            if (section && section.taskCount !== undefined) {
              section.taskCount = Math.max(0, section.taskCount + taskCountChanges[sectionId]);
            }
          });

          // Restore tasks to their original sections
          tasksToRestore.forEach(({ originalTask, originalSectionId }) => {
            const originalSection = state.sections.find(section => section.id === originalSectionId);
            if (originalSection) {
              originalSection.tasks = originalSection.tasks || [];
              originalSection.tasks.push(originalTask);
            }
          });

          // Clear original data for these tasks
          taskIds.forEach(taskId => {
            if (state.originalTaskData[taskId]) {
              delete state.originalTaskData[taskId];
            }
          });
        }
      })

      // 🗑️ DELETE SECTION API
      .addCase(deleteSection.pending, (state) => {
        state.error = null;
        state.loading = true;
      })
      .addCase(deleteSection.fulfilled, (state, action) => {
        const { sectionId, deleteType } = action.payload;

        if (deleteType === "with_tasks") {
          // Delete section and all its tasks
          state.sections = state.sections.filter(section => section.id !== sectionId);
        } else {
          // Delete only the section, keep tasks but remove them from the section
          const sectionToDelete = state.sections.find(section => section.id === sectionId);
          if (sectionToDelete) {
            // Remove the section
            state.sections = state.sections.filter(section => section.id !== sectionId);

            // Remove tasks from the deleted section (they become "no section" tasks)
            // The API sets their section field to null, so we remove them from the section
            // but they still exist in the system
          }
        }

        state.loading = false;
        state.error = null;
      })
      .addCase(deleteSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchSectionTaskAttachments reducers
      .addCase(fetchSectionTaskAttachments.fulfilled, (state, action) => {
        if (action.payload && action.payload.taskId) {
          // Store attachments as array directly
          state.taskAttachments = action.payload.attachments || [];

          // Update the task in the sections array if it exists
          for (const section of state.sections) {
            const taskIndex = section.tasks.findIndex(
              (task) => task._id === action.payload.taskId,
            );
            if (taskIndex !== -1) {
              section.tasks[taskIndex].attachments = action.payload.attachments;
              section.tasks[taskIndex].attachmentCount =
                action.payload.attachments.length;
              break;
            }
          }

          // Update selected task if it matches
          if (
            state.selectedTask &&
            state.selectedTask._id === action.payload.taskId
          ) {
            state.selectedTask.attachments = action.payload.attachments;
            state.selectedTask.attachmentCount =
              action.payload.attachments.length;
          }
        }
      })
      .addCase(fetchSectionTaskAttachments.rejected, (state, action) => {
        console.error("Failed to fetch section task attachments:", action.payload);
      })

      // deleteSectionTaskAttachment reducers
      .addCase(deleteSectionTaskAttachment.fulfilled, (state, action) => {
        if (action.payload && action.payload.taskId) {
          // Remove the attachment from taskAttachments
          state.taskAttachments = state.taskAttachments.filter(
            (attachment) => attachment._id !== action.payload.attachmentId
          );

          // Update the task in the sections array if it exists
          for (const section of state.sections) {
            const taskIndex = section.tasks.findIndex(
              (task) => task._id === action.payload.taskId,
            );
            if (taskIndex !== -1) {
              section.tasks[taskIndex].attachments = section.tasks[taskIndex].attachments.filter(
                (attachment) => attachment._id !== action.payload.attachmentId
              );
              section.tasks[taskIndex].attachmentCount =
                section.tasks[taskIndex].attachments.length;
              break;
            }
          }

          // Update selected task if it matches
          if (
            state.selectedTask &&
            state.selectedTask._id === action.payload.taskId
          ) {
            state.selectedTask.attachments = state.selectedTask.attachments.filter(
              (attachment) => attachment._id !== action.payload.attachmentId
            );
            state.selectedTask.attachmentCount =
              state.selectedTask.attachments.length;
          }
        }
      })
      .addCase(deleteSectionTaskAttachment.rejected, (state, action) => {
        console.error("Failed to delete section task attachment:", action.payload);
      })
      // Toggle section collapse async
      .addCase(toggleSectionCollapseAsync.fulfilled, (state, action) => {
        const { sectionId, isCollapsed } = action.payload;
        const section = state.sections.find((s) => s.id === sectionId);
        if (section) {
          section.isCollapsed = isCollapsed;
        }
      })
      .addCase(toggleSectionCollapseAsync.rejected, (state, action) => {
        console.error('Failed to toggle section collapse:', action.payload);
      });
  },
});

export const {
  toggleSectionCollapse,
  setSelectedSection,
  toggleTaskSelection,
  selectAllTasksInSection,
  clearSelectedTasks,
  setSelectedTask,
  toggleTaskPanel,
  setFilters,
  resetFilters,
  setSearchResults,
  setSearching,
  setDraggedTask,
  updateTaskLocally,
  updateTaskSubtaskCount,
  updateTaskTimeData,
  updateTaskCommentCount,
  updateSectionName,
  swapTaskOrderOptimistic,
  swapSectionOrderOptimistic,
  reorderSectionsOptimistic,
  reorderTasksInSectionOptimistic,
  moveTaskBetweenSectionsOptimistic,
  setSectionPagination,
  setTaskPagination,
  updateSectionTasks,
  clearSectionTasks,
  addTemporaryTask,
  updateTaskInState,
  removeTemporaryTask,
  replaceTemporaryTask,
  setSectionLoadingTasks,
} = sectionTaskSlice.actions;

// Additional action to clear persisted task panel state
export const clearPersistedTaskPanelState = () => (dispatch) => {
  clearPersistedState();
  dispatch(setSelectedTask(null));
  dispatch(toggleTaskPanel(false));
};

export default sectionTaskSlice.reducer;

// Selectors
export const selectAllSections = (state) => state.sectionTasks.sections;
export const selectSectionById = (sectionId) => (state) =>
  state.sectionTasks.sections.find((section) => section.id === sectionId);
export const selectTaskById = (taskId) => (state) => {
  // First try to find by exact match
  for (const section of state.sectionTasks.sections) {
    const task = section.tasks?.find((task) =>
      task._id === taskId || task.taskId === taskId
    );
    if (task) return task;
  }

  // If not found, try with type conversion for numeric IDs
  const taskIdNum = Number(taskId);
  if (!isNaN(taskIdNum)) {
    for (const section of state.sectionTasks.sections) {
      const task = section.tasks?.find((task) =>
        Number(task._id) === taskIdNum || Number(task.taskId) === taskIdNum
      );
      if (task) return task;
    }
  }

  // Check if it's the currently selected task
  if (state.sectionTasks.selectedTask) {
    const selectedTask = state.sectionTasks.selectedTask;
    if (selectedTask._id == taskId || selectedTask.taskId == taskId) {
      return selectedTask;
    }

    // Also check with type conversion
    if (!isNaN(taskIdNum)) {
      if (Number(selectedTask._id) === taskIdNum || Number(selectedTask.taskId) === taskIdNum) {
        return selectedTask;
      }
    }
  }

  return null;
};
export const selectSelectedTasks = (state) => state.sectionTasks.selectedTasks;
export const selectFilters = (state) => state.sectionTasks.filters;
export const selectIsLoading = (state) => state.sectionTasks.loading;
export const selectTaskStats = (state) => state.sectionTasks.taskStats;
export const selectMetadata = (state) => state.sectionTasks.metadata;

// Pagination selectors
export const selectSectionPagination = (state) => state.sectionTasks.pagination.sections;
export const selectTaskPagination = (sectionId) => (state) =>
  state.sectionTasks.pagination.tasks[sectionId] || null;
export const selectHasMoreSections = (state) => {
  const pagination = state.sectionTasks.pagination.sections;
  return pagination.currentPage < pagination.totalPages;
};
export const selectHasMoreTasks = (sectionId) => (state) => {
  const pagination = state.sectionTasks.pagination.tasks[sectionId];
  return pagination ? pagination.currentPage < pagination.totalPages : false;
};

// Section loading state selector
export const selectSectionLoadingTasks = (sectionId) => (state) => {
  const section = state.sectionTasks.sections.find(s => s.id === sectionId);
  return section ? section.isLoadingTasks : false;
};

// 📂 SECTION PAGINATION API - Separate function for sections only
export const fetchSectionsPaginated = createAsyncThunk(
  "sectionTasks/fetchSectionsPaginated",
  async ({
    projectId = getDefaultProjectId(),
    filters = {},
    page = 1,
    pageSize = 100,
    append = false
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const currentPagination = state.sectionTasks.pagination.sections;

      // Check if we're loading more and there's no next page
      if (append && !currentPagination.next) {
        return rejectWithValue("No more sections to load");
      }

      // Build query parameters for sections
      const queryParams = new URLSearchParams();

      // Add section filter parameters according to API documentation
      if (filters.search) {
        queryParams.append('name', filters.search);
      }
      if (filters.userId) {
        queryParams.append('userId', filters.userId);
      }
      if (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) {
        if (filters.dateRange.startDate) {
          queryParams.append('startdate', filters.dateRange.startDate);
        }
        if (filters.dateRange.endDate) {
          queryParams.append('endDate', filters.dateRange.endDate);
        }
      }

      // Add pagination parameters
      const currentPage = append ? (currentPagination?.currentPage || 0) + 1 : page;
      queryParams.append('page', currentPage.toString());
      queryParams.append('page_size', pageSize.toString());

      // Make API call for sections
      const url = `${apiBaseURL}${API_ENDPOINTS.PROJECT_SECTIONS(projectId)}`;
      const finalUrl = `${url}?${queryParams.toString()}`;
      const response = await fetchAuthGET(finalUrl, false);

      if (response.error) {
        return rejectWithValue(response.message || `Failed to ${append ? 'load more' : 'fetch'} sections`);
      }

      // Transform sections response
      const responseData = response.results || response;
      const sections = responseData.sections || responseData;

      const transformedSections = Array.isArray(sections)
        ? sections.map(transformSectionResponse)
        : [];

      return {
        sections: transformedSections,
        pagination: {
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
          currentPage: currentPage,
          totalPages: Math.ceil((response.count || 0) / pageSize),
        },
        append,
      };

    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// 📋 TASK PAGINATION API - Separate function for tasks only
export const fetchTasksPaginated = createAsyncThunk(
  "sectionTasks/fetchTasksPaginated",
  async ({
    sectionId,
    filters = {},
    page = 1,
    pageSize = 15,
    append = false
  }, { rejectWithValue, getState }) => {
    try {

      const state = getState();
      const currentPagination = state.sectionTasks.pagination.tasks[sectionId];

      // Check if we're loading more and there's no next page
      if (append && (!currentPagination || !currentPagination.next)) {
        return rejectWithValue("No more tasks to load");
      }

      // Build query parameters for tasks
      const queryParams = new URLSearchParams();


      // Add task filter parameters according to API documentation
      if (filters.search) {
        queryParams.append('search', filters.search);
      }

      if (filters.userId) {
        queryParams.append('userId', filters.userId);
      }

      if (filters.taskPosition && filters.taskPosition.length > 0) {
        queryParams.append('taskPosition', filters.taskPosition.join(','));
      }

      if (filters.priority) {
        queryParams.append('priority', filters.priority);
      }

      if (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) {
        if (filters.dateRange.startDate) {
          queryParams.append('startdate', filters.dateRange.startDate);
        }
        if (filters.dateRange.endDate) {
          queryParams.append('endDate', filters.dateRange.endDate);
        }
      }

      // Add pagination parameters
      const currentPage = append ? (currentPagination?.currentPage || 0) + 1 : page;
      queryParams.append('page', currentPage.toString());
      queryParams.append('page_size', pageSize.toString());

      // Make API call for tasks
      const url = `${apiBaseURL}${API_ENDPOINTS.SECTION_TASKS(sectionId)}`;
      const finalUrl = `${url}?${queryParams.toString()}`;
      const response = await fetchAuthGET(finalUrl, false);

      if (response.error) {
        return rejectWithValue(response.message || `Failed to ${append ? 'load more' : 'fetch'} tasks`);
      }

      // Transform tasks response
      const tasks = response.results || response;
      const transformedTasks = Array.isArray(tasks)
        ? tasks.map(transformTaskResponse)
        : [];

      return {
        sectionId,
        tasks: transformedTasks,
        pagination: {
          count: response.count || 0,
          next: response.next || null,
          previous: response.previous || null,
          currentPage: currentPage,
          totalPages: Math.ceil((response.count || 0) / pageSize),
        },
        append,
      };

    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

// 🗑️ DELETE SECTION API
export const deleteSection = createAsyncThunk(
  "sectionTasks/deleteSection",
  async ({ sectionId, deleteType = "section_only" }, { rejectWithValue }) => {
    try {
      const url = `${apiBaseURL}${API_ENDPOINTS.SECTION_DELETE(sectionId)}?delete_type=${deleteType}`;
      const response = await fetchAuthDelete(url, false);

      if (response.error) {
        return rejectWithValue(response.message || "Failed to delete section");
      }

      return {
        sectionId,
        deleteType,
        message: response.message || "Section deleted successfully"
      };

    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
