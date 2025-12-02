// API utilities for section tasks feature
import { useSelector } from "react-redux";


export const getDefaultProjectId = () => {
  const projectId = window.location.pathname.split("/")[2];
  return projectId || 207;
};

/**
 * Fix malformed URLs that are missing slashes between domain and path
 * @param {string} content - HTML content or URL string to fix
 * @returns {string} - Fixed content with proper URL formatting
 */
export const fixMalformedUrls = (content) => {
  if (!content || typeof content !== 'string') {
    return content;
  }


  let fixedContent = content;

  // Pattern 1: Specifically handle localhost:5173login -> localhost:5173/login
  fixedContent = fixedContent.replace(
    /(localhost:5173)([a-zA-Z])/g,
    (match, domain, letter) => {
     
      return `${domain}/${letter}`;
    }
  );
  
  // Pattern 2: Handle any domain:port followed immediately by letters (more general)
  fixedContent = fixedContent.replace(
    /(https?:\/\/[^\/\s"'<>]+:\d+)([a-zA-Z])/g,
    (match, domainWithPort, letter) => {
    
      return `${domainWithPort}/${letter}`;
    }
  );

  // Pattern 3: Handle cases where domain ends with numbers and is followed by letters
  fixedContent = fixedContent.replace(
    /(https?:\/\/[^\/\s"'<>]+\d)([a-zA-Z])/g,
    (match, domainWithNumber, letter) => {
      // Only apply if it doesn't already have a slash after the domain
      if (!match.includes('/')) {
     
        return `${domainWithNumber}/${letter}`;
      }
      return match;
    }
  );


  return fixedContent;
};




// API endpoints
export const API_ENDPOINTS = {
  TASK_SECTIONS: "/task-sections/",
  CREATE_TASK_WITH_SECTION: "/tasks/create-with-section/",
  PROJECT_SECTIONS: (projectId) => `/projects/${projectId}/sections/`,
  SECTION_TASKS: (sectionId) => `/sections/${sectionId}/tasks/`,
  SWAP_SECTIONS: (projectId) => `/projects/${projectId}/swap-section/`,
  CHANGE_TASK_SECTION: (taskId) => `/tasks/${taskId}/change-section/`,
  DELETE_TASK: (taskId) => `/api/tasks/${taskId}/`,
  RENAME_SECTION: (sectionId) => `/sections/${sectionId}/rename/`,
  SWAP_TASK_ORDER: "/tasks/swap-order/",
  SECTION_DELETE: (sectionId) => `/sections/${sectionId}/delete/`,
  TOGGLE_SECTION_COLLAPSE: (sectionId) => `/tasksection/${sectionId}/toggle-collapse/`,
};

// Default task status options
export const DEFAULT_TASK_STATUS = [
  {
    id: "1",
    name: "Not Started Yet",
    color: "#DC3464",
    value: "not_started_yet",
  },
  {
    id: "2",
    name: "In progress",
    color: "#3092F5",
    value: "in_progress",
  },
  {
    id: "3",
    name: "Completed",
    color: "#30F558",
    value: "completed",
  },
  {
    id: "4",
    name: "Pending",
    color: "#BCBCBC",
    value: "pending",
  },
];

// Transform backend section response to frontend format
export const transformSectionResponse = (backendSection) => {
  return {
    id: backendSection.id,
    name: backendSection.name,
    order: backendSection.orderNumber || backendSection.order || 0,
    isCollapsed: backendSection.isCollapse || false, // Use actual API value
    isLoadingTasks: false, // Loading state for tasks
    color: backendSection.color || "#3B82F6",
    icon: backendSection.icon || "mdi:folder-outline",
    tasks: (backendSection.tasks || []).map(transformTaskResponse),
    taskCount: backendSection.task_count || 0, // Add task count from API
    canDelete: backendSection.canDelete || false,
    project: backendSection.project,
    user: backendSection.user,
    created_at: backendSection.created_at,
    updated_at: backendSection.updated_at,
  };
};

// Transform backend task response to frontend format
export const transformTaskResponse = (backendTask) => {
  return {
    taskId: backendTask.id,
    _id: (backendTask.id || backendTask.taskId || Date.now()).toString(),
    taskName: backendTask.taskName || backendTask.task_name || backendTask.name,
    description: backendTask.description || "",
    priority: backendTask.priority || "medium",
    dueDate: backendTask.dueDate || backendTask.due_date,
    isComplete: backendTask.isComplete || backendTask.is_complete || false,
    sectionId:
      backendTask.sectionId || backendTask.section_id || backendTask.section,
    orderInSection:
      backendTask.orderInSection || backendTask.order_in_section || 0,
    taskOrder: backendTask.taskOrder || backendTask.task_order || 0,
    dateCreated:
      backendTask.dateCreated ||
      backendTask.created_at ||
      new Date().toISOString(),
    updated_at: backendTask.updated_at || new Date().toISOString(),
    user_name: backendTask.user_name || backendTask.userName || "",
    assign_name: backendTask.assign_name || backendTask.assignName || "",
    client_name: backendTask.client_name || backendTask.clientName || "",
    projectName: backendTask.projectName || backendTask.project_name || "",
    total_time: backendTask.total_time || "00:00:00",
    allocated_time: backendTask.allocated_time || "0.00",
    allocated_hours_percentage: backendTask.allocated_hours_percentage || 0,
    time_difference: backendTask.time_difference || 0,
    total_comments: backendTask.total_comments || 0,
    total_attached_files: backendTask.total_attached_files || 0,
    taskPosition:
      backendTask.taskPosition ||
      backendTask.task_position ||
      backendTask.status ||
      "not_started_yet",
    project_status: backendTask.project_status || DEFAULT_TASK_STATUS,
    isDelete: false,
    taskCode: backendTask.taskCode || backendTask.task_code || "",
    files: backendTask.files || [],
    repeat: backendTask.repeat || "not_repeatable",
    repeat_days: backendTask.repeat_days || null,
    attachments: backendTask.attachments || [],
    isImported: backendTask.isImported || backendTask.is_imported || false,
    parent: backendTask.parent || null,
    parent_hierarchy: backendTask.parent_hierarchy || [],
    projectId: backendTask.projectId || backendTask.project_id || null,
    userId: backendTask.userId || backendTask.user_id || null,
    assignBy: backendTask.assignBy || backendTask.assign_by || null,
    assignClientBy: backendTask.assignClientBy || null,
    liked_by: backendTask.liked_by || [],
    assigned_users: backendTask.assigned_users || [],
    collaborators: backendTask.collaborators || [],
    seen_by: backendTask.seen_by || [],
    subtask_count: backendTask.subtask_count || 0,
    description_updated_at: backendTask.description_updated_at || null,
  };
};

// Transform frontend task data to backend format for creation
export const transformTaskForCreation = (taskData, sectionId, userId) => {
  // Format the due date properly - if it's a string in YYYY-MM-DD format, keep it as-is
  // Otherwise, format it using formatDateForApi
  let formattedDueDate = null;
  if (taskData.dueDate) {
    if (typeof taskData.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(taskData.dueDate)) {
      // Already in YYYY-MM-DD format, keep it
      formattedDueDate = taskData.dueDate;
    } else {
      // Convert to ISO format
      formattedDueDate = formatDateForApi(taskData.dueDate);
      // Extract just the date part if we have a full ISO string
      if (formattedDueDate && formattedDueDate.includes('T')) {
        formattedDueDate = formattedDueDate.split('T')[0];
      }
    }
  }

  return {
    taskName: taskData.taskName || "New Task",
    section: sectionId,
    userId: userId,
    dueDate: formattedDueDate,
    priority: taskData.priority || "low",
    description: taskData.description || "",
    assigned_users: taskData.assigned_users || [],
    taskPosition: taskData.taskPosition || "not_started_yet",
  };
};

// Transform frontend section data to backend format for creation
export const transformSectionForCreation = (sectionData, projectId, userId) => {
  return {
    project: projectId || getDefaultProjectId(),
    user: userId,
    name: sectionData.name || "New Section",
  };
};

// Handle API response errors
export const handleApiError = (
  response,
  defaultMessage = "An error occurred",
) => {
  if (response?.status === false || response?.error) {
    return response.message || defaultMessage;
  }
  if (response?.error) {
    return response.error.message || response.error || defaultMessage;
  }
  return null;
};

// Check if API response is successful
export const isApiResponseSuccessful = (response) => {
  return !(response?.status === false || response?.error);
};

// Get current user ID from state or default
export const getCurrentUserId = (state) => {

  return state?.auth?.user?._id || state?.user?._id || 1;
};

// Validate section name
export const validateSectionName = (name) => {
  if (!name || !name.trim()) {
    return "Section name is required";
  }
  if (name.trim().length < 2) {
    return "Section name must be at least 2 characters long";
  }
  if (name.trim().length > 50) {
    return "Section name must be less than 50 characters";
  }
  return null;
};

// Validate task name
export const validateTaskName = (name) => {
  if (!name || !name.trim()) {
    return "Task name is required";
  }
  if (name.trim().length < 2) {
    return "Task name must be at least 2 characters long";
  }
  if (name.trim().length > 100) {
    return "Task name must be less than 100 characters";
  }
  return null;
};

// Priority options for tasks
export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "#10B981" },
  { value: "medium", label: "Medium", color: "#F59E0B" },
  { value: "high", label: "High", color: "#EF4444" },
];

// Get priority color
export const getPriorityColor = (priority) => {
  const priorityOption = PRIORITY_OPTIONS.find((p) => p.value === priority);
  return priorityOption?.color || "#9CA3AF";
};

// Get status color
export const getStatusColor = (status) => {
  const statusOption = DEFAULT_TASK_STATUS.find((s) => s.value === status);
  return statusOption?.color || "#9CA3AF";
};

// Format date for API
export const formatDateForApi = (date) => {
  if (!date) return null;
  if (typeof date === "string") {
    // If it's already a string, try to parse and reformat
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
  }
  if (date instanceof Date) {
    return date.toISOString();
  }
  return null;
};

// Parse date from API
export const parseDateFromApi = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// Generate unique temporary ID for optimistic updates
export const generateTempId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if ID is temporary (for optimistic updates)
export const isTempId = (id) => {
  return typeof id === "string" && id.startsWith("temp_");
};

// Helper function to detect drop position and get task IDs for API calls
export const detectTaskDropPosition = (tasks, destinationIndex, draggedTaskId = null) => {
  let firstTaskId = null;
  let thirdTaskId = null;

  if (tasks && tasks.length > 0) {
    // Filter out the dragged task to get the correct positions
    const tasksWithoutDragged = draggedTaskId
      ? tasks.filter(task => (task._id || task.taskId) !== draggedTaskId)
      : tasks;

    if (destinationIndex === 0) {
      // Dropped at top - only provide the lower ID
      // The task at index 0 in the filtered array is the one that will be below the dropped task
      thirdTaskId = tasksWithoutDragged[0]?._id || tasksWithoutDragged[0]?.taskId;
    } else if (destinationIndex >= tasksWithoutDragged.length) {
      // Dropped at bottom - only provide the upper ID
      firstTaskId = tasksWithoutDragged[tasksWithoutDragged.length - 1]?._id || tasksWithoutDragged[tasksWithoutDragged.length - 1]?.taskId;
    } else {
      // Dropped in middle - provide both IDs
      firstTaskId = tasksWithoutDragged[destinationIndex - 1]?._id || tasksWithoutDragged[destinationIndex - 1]?.taskId;
      thirdTaskId = tasksWithoutDragged[destinationIndex]?._id || tasksWithoutDragged[destinationIndex]?.taskId;
    }
  }

  return { firstTaskId, thirdTaskId };
};

// Helper function to detect drop position and get section IDs for API calls
export const detectSectionDropPosition = (sections, destinationIndex) => {
  let firstSectionId = null;
  let thirdSectionId = null;

  if (sections && sections.length > 0) {
    if (destinationIndex === 0) {
      // Dropped at top - only provide the lower ID
      thirdSectionId = sections[0]?.id;
    } else if (destinationIndex >= sections.length) {
      // Dropped at bottom - only provide the upper ID
      firstSectionId = sections[sections.length - 1]?.id;
    } else {
      // Dropped in middle - provide both IDs
      firstSectionId = sections[destinationIndex - 1]?.id;
      thirdSectionId = sections[destinationIndex]?.id;
    }
  }

  return { firstSectionId, thirdSectionId };
};

// Helper function to detect drop position and get task IDs for section change API
export const detectTaskSectionDropPosition = (destinationTasks, destinationIndex) => {
  let firstTask = null;
  let secondTask = null;

  if (destinationTasks && destinationTasks.length > 0) {
    if (destinationIndex === 0) {
      // Dropped at top - only provide the lower ID
      secondTask = destinationTasks[0]?._id || destinationTasks[0]?.taskId;
    } else if (destinationIndex >= destinationTasks.length) {
      // Dropped at bottom - only provide the upper ID
      firstTask = destinationTasks[destinationTasks.length - 1]?._id || destinationTasks[destinationTasks.length - 1]?.taskId;
    } else {
      // Dropped in middle - provide both IDs
      firstTask = destinationTasks[destinationIndex - 1]?._id || destinationTasks[destinationIndex - 1]?.taskId;
      secondTask = destinationTasks[destinationIndex]?._id || destinationTasks[destinationIndex]?.taskId;
    }
  }
  // If dropped in empty section, both will be null

  return { firstTask, secondTask };
};
