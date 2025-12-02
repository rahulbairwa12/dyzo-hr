import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  memo,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { Icon } from "@iconify/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import Tooltip from "@/components/ui/Tooltip";
import confetti from "canvas-confetti";
import MultiUserAssignCell from "@/components/dropdowns/MultiUserAssignCell";
import {
  selectAllTasks,
  toggleTaskSelection,
  setPage,
  addTask,
  updateTaskInState,
  updateTaskProperty,
  fetchTaskTimeData,
  createTask,
  togglePanelVisibility,
  setActiveTaskTab,
  setTaskNameInput,
  removeTaskFromState,
} from "../store/tasksSlice";
import { fetchUsers } from "@/store/usersSlice";
import DueDateCell from "./DueDateCell"; // Add this import
import CopyTaskLinkButton from "./CopyTaskLinkButton"; // Import the new component
import ContextMenu from "@/components/ui/ContextMenu";
import { toast } from "react-toastify";
import ProjectSelect from "@/components/dropdowns/ProjectSelect"; // Import ProjectSelect for new tasks

import {
  fetchAuthGET,
  fetchAuthPut,
  fetchAuthFilePut,
  fetchAuthDelete,
} from "@/store/api/apiSlice";
import AssignToSelect from "@/components/dropdowns/AssignToSelect";
import { djangoBaseURL } from "@/helper";
import { sendNotification } from "@/helper/helper";
import { notifyAssignee } from "@/helper/tasknotification";
import {
  statusMapping,
  getLiveStatus,
  combineEmployeeData,
} from "@/helper/statusHelper";
import { isAdmin } from "@/store/api/apiSlice";
import { intialLetterName } from "@/helper/helper";
import TaskStatusSelect from "./TaskStatusSelect";
import TaskPrioritySelect from "./TaskPrioritySelect";
import ModernTooltip from "@/components/ui/ModernTooltip";

// Task toggle button component
const TaskToggleButton = ({ task, onToggle }) => {
  const [hovered, setHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      const result = await onToggle(task);

      // Trigger confetti if task is marked as complete
      if (result && result.updates && result.updates.isComplete) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for completion with various possible formats
  const isCompleted =
    task.taskPosition === "completed" ||
    task.taskPosition === "Completed"

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center p-1 text-gray-900 focus:outline-none rounded-full hover:bg-gray-100 transition-colors"
      title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
    >
      {isCompleted ? (
        <div className="w-5 h-5 sm:w-4 sm:h-4 -mt-1 rounded-full bg-[#2DE072] flex items-center justify-center group hover:bg-[#2fc368] transition-colors">
          <Icon
            icon="bi:check"
            className="w-4 h-4 sm:w-2.5 sm:h-2.5 text-white group-hover:scale-110 transition-transform duration-200"
          />
        </div>
      ) : (
        <div
          className={`w-5 h-5 sm:w-4 sm:h-4 rounded-full border-2 -mt-1 ${hovered
            ? "border-[#68B984] bg-[#68B984] bg-opacity-10"
            : "border-gray-300"
            } flex items-center justify-center transition-all duration-200`}
        >
          <Icon
            icon="bi:check"
            className={`w-4 h-4 sm:w-2.5 sm:h-2.5  ${hovered ? "text-[#68B984]" : "text-gray-400"
              } transition-colors duration-200`}
          />
        </div>
      )}
    </button>
  );
};

// Custom AssigneeCell component for displaying avatar and name side by side
const AssigneeCell = ({
  task,
  users,
  isTaskCompleted,
  updateExistingTask,
  index,
  isPanelVisible,
}) => {
  const user = users.find((u) => u._id === task.userId);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-shrink-0">
        <AssignToSelect
          task={task}
          users={users}
          index={index}
          userId={task.userId}
          updateExistingTask={updateExistingTask}
          isCompleted={isTaskCompleted}
          isPanelVisible={isPanelVisible}
        />
      </div>
      {user && (
        <div className="flex-grow min-w-0">
          <span className="text-xs text-gray-700 dark:text-slate-300 font-medium truncate block max-w-[100px]">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.name || task?.user_name || ""}
          </span>
        </div>
      )}
    </div>
  );
};

// MultiUserAssigneeCell component for displaying multiple avatars and managing assignments

// Custom comparison function for TaskRowMemo
const taskRowComparison = (prevProps, nextProps) => {
  // Check if task object properties that affect rendering have changed
  const taskPropsToCheck = [
    '_id', 'taskCode', 'taskName', 'taskPosition', 'isComplete', 'projectId',
    'userId', 'priority', 'dueDate', 'total_comments', 'commentCount',
    'total_attached_files', 'attachmentCount', 'attachments', 'hasComments',
    'hasAttachments', 'project_status', 'assigned_users', 'subtask_count',
    'total_time', 'timeLogged', 'timer_type', 'isNewTask', 'initial',
    'validationError', 'taskId'
  ];

  // Check if any of the task properties changed
  for (const prop of taskPropsToCheck) {
    if (prevProps.task?.[prop] !== nextProps.task?.[prop]) {
      return false; // Props are different, component should re-render
    }
  }

  // Check other props that might affect rendering
  const otherPropsToCheck = [
    'index', 'isEven', 'selectedTasks', 'editingTaskId', 'loading',
    'isOpen', 'isPanelVisible', 'emptyTaskWarning', 'isMobileView'
  ];

  for (const prop of otherPropsToCheck) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false;
    }
  }

  // Check if selectedTasks array changed
  if (prevProps.selectedTasks?.length !== nextProps.selectedTasks?.length ||
    !prevProps.selectedTasks?.every(id => nextProps.selectedTasks?.includes(id))) {
    return false;
  }

  // Check if projects array changed (important for async loading)
  if (prevProps.projects?.length !== nextProps.projects?.length ||
    !prevProps.projects?.every((project, index) =>
      project?._id === nextProps.projects?.[index]?._id
    )) {
    return false;
  }

  // Check if users array changed (important for async loading)
  if (prevProps.users?.length !== nextProps.users?.length ||
    !prevProps.users?.every((user, index) =>
      user?._id === nextProps.users?.[index]?._id
    )) {
    return false;
  }

  // Check if urlProjectData changed
  if (prevProps.urlProjectData?._id !== nextProps.urlProjectData?._id) {
    return false;
  }

  return true; // Props are the same, component should not re-render
};

// Memoized Task Row Component
const TaskRowMemo = memo(function TaskRow({
  task,
  index,
  isEven,
  selectedTasks,
  replaceNoProject,
  editingTaskId,
  inputRefs,
  loading,
  users,
  projects,
  urlProjectData,
  getProjectNameFromId,
  dispatch,
  onRowClick,
  onToggleComplete,
  onStartEditing,
  onInputChange,
  onKeyDown,
  onBlur,
  userInfo,
  updateExistingTask,
  isOpen = false,
  isPanelVisible,
  emptyTaskWarning,
  interpretDate,
  handleContextMenu,
  handleCursorPositionChange,
  cursorPositionRef,
  isMobileView, // Add mobile view flag
}) {

  const [isSelected, setIsSelected] = useState(false);

  const [isCopied, setIsCopied] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [editingPriorityId, setEditingPriorityId] = useState(null);
  const [editingDueDateId, setEditingDueDateId] = useState(null);
  const selectedTask = useSelector((state) => state.tasks.selectedTask);
  const [currentlyImportedTasks, setCurrentlyImportedTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("importedIds");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Add this line to define hasFocusedRef for this component
  const hasFocusedRef = useRef({});

  const taskTimeData = useSelector(
    (state) =>
      state.tasks.taskTimeData[task.taskId] || {
        total_time: null,
        timer_type: null,
      }
  );

  // Automatically remove highlight and clean storage after 5 seconds
  useEffect(() => {
    if (currentlyImportedTasks.length > 0) {
      const timer = setTimeout(() => {
        setCurrentlyImportedTasks([]);
        localStorage.removeItem("importedIds");
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [currentlyImportedTasks]);

  const isCurrentlyImportedTasks = currentlyImportedTasks.includes(
    task._id?.toString()
  );


  // Get task statuses from Redux store
  const { statuses } = useSelector((state) => state.taskStatus);

  // Helper functions
  const getProjectName = (projectId) => {
    const project = projects.find((p) => p._id === projectId);
    return project ? project.name : "";
  };

  // Get project members for the task's project
  const projectMembers = useMemo(() => {
    if (!task.projectId || !projects || projects.length === 0) {
      return users; // Return all users if no project selected
    }

    const taskProject = projects.find((p) => p._id === task.projectId);

    if (!taskProject) {
      return users; // Return all users if project not found
    }

    // If project has assignee_details, use it
    if (taskProject.assignee_details && Array.isArray(taskProject.assignee_details)) {
      return taskProject.assignee_details;
    }

    // If project has assignee (array of user IDs), filter users
    if (taskProject.assignee && Array.isArray(taskProject.assignee) && taskProject.assignee.length > 0) {
      return users.filter(user => taskProject.assignee.includes(user._id));
    }

    // Fallback to all users if project has no members defined
    return users;
  }, [task.projectId, projects, users]);

  const formatTimeLogged = (timeData) => {
    // If we already have a formatted string from the API (total_time)
    if (typeof timeData === "string" && timeData.includes("hrs")) {
      return timeData;
    }

    // If using the old format (minutes as a number)
    if (typeof timeData === "number") {
      if (!timeData) return "0 hrs 00 min";
      const hrs = Math.floor(timeData / 60);
      const mins = timeData % 60;
      return `${hrs} hrs ${mins.toString().padStart(2, "0")} min`;
    }

    // Default fallback
    return "0 hrs 00 min";
  };

  const handleTaskSelection = (e) => {
    e.stopPropagation();
    const taskId = task._id;


    dispatch(toggleTaskSelection(taskId));
  };

  // Update project for both new and existing tasks
  const updateProjectForTask = useCallback((updatedTask, field) => {
    const isNew = !task.taskId || task.taskId === "-" || String(task._id).startsWith("new-");
    if (isNew) {
      // Local state only for new task rows
      dispatch(updateTaskInState({
        _id: task._id,
        projectId: updatedTask.projectId,
        projectName: updatedTask.projectName,
      }));
    } else if (typeof updateExistingTask === "function") {
      updateExistingTask(updatedTask, field);
    }
  }, [dispatch, task._id, task.taskId, updateExistingTask]);

  // Get project name for this task
  const projectName = replaceNoProject(
    getProjectNameFromId
      ? getProjectNameFromId(task.projectId)
      : getProjectName(task.projectId)
  );

  // Helper function to check if task has comments
  const hasTaskComments = () => {
    return (
      task.hasComments ||
      (task.total_comments && task.total_comments > 0) ||
      (task.commentCount && task.commentCount > 0)
    );
  };

  // Helper function to check if task has attachments
  const hasTaskAttachments = () => {
    return (
      task.hasAttachments ||
      (task.total_attached_files && task.total_attached_files > 0) ||
      (task.attachmentCount && task.attachmentCount > 0) ||
      (task.attachments && task.attachments.length > 0)
    );
  };

  // Get status color and label from the task's project_status array
  const getStatusInfo = (task) => {
    const taskPositionRaw = task.taskPosition || ""; // safe fallback

    // Default status info if not found
    const defaultInfo = {
      color: "#BCBCBC",
      label: taskPositionRaw || "Not Started Yet",
    };

    // If project_status array exists
    if (Array.isArray(task.project_status) && task.project_status.length > 0) {
      // Try value match first
      let matchedStatus = task.project_status.find(
        (status) => status.value === taskPositionRaw
      );

      // Then name match (case-insensitive)
      if (!matchedStatus && taskPositionRaw) {
        matchedStatus = task.project_status.find(
          (status) =>
            status.name &&
            status.name.toLowerCase() === taskPositionRaw.toLowerCase()
        );
      }

      // Try common variations
      if (!matchedStatus && taskPositionRaw) {
        const tpLower = taskPositionRaw.toLowerCase();
        if (tpLower === "in progress") {
          matchedStatus = task.project_status.find(
            (status) =>
              status.value === "in_progress" ||
              status.name?.toLowerCase() === "in progress"
          );
        } else if (tpLower === "not started yet") {
          matchedStatus = task.project_status.find(
            (status) =>
              status.value === "not_started_yet" ||
              status.name?.toLowerCase() === "not started yet"
          );
        } else {
          const normalized = tpLower.replace(/ /g, "_");
          matchedStatus = task.project_status.find(
            (status) => status.value === normalized
          );
        }
      }

      if (matchedStatus) {
        return {
          color: matchedStatus.color || defaultInfo.color,
          label: matchedStatus.name || taskPositionRaw,
        };
      }
    }

    // Fallback map
    const statusMap = {
      completed: { color: "#30F558", label: "Completed" },
      in_progress: { color: "#3092F5", label: "In Progress" },
      pending: { color: "#BCBCBC", label: "Pending" },
      not_started_yet: { color: "#DC3464", label: "Not Started Yet" },
    };

    const normalizedStatus = taskPositionRaw.toLowerCase().replace(/ /g, "_");
    if (statusMap[normalizedStatus]) {
      return statusMap[normalizedStatus];
    }

    return defaultInfo;
  };

  // Get status info for this task
  const statusInfo = getStatusInfo(task);

  // Helper function to check if a task is completed
  const isTaskCompleted = (task) => {
    return (
      task.taskPosition === "completed" ||
      task.taskPosition === "Completed" ||

      (task.taskPosition && task.taskPosition.toLowerCase() === "completed")
    );
  };

  const handleRowClick = (e) => {
    if (!task.isEditing && editingTaskId !== task._id) {
      setIsSelected((prev) => !prev);
      onRowClick(task);
    }
  };

  function formatTimeString(timeStr) {
    if (!timeStr) return "0 hrs 0 mins";

    const [hours, minutes] = timeStr.split(":").map(Number);

    const hrs = `${hours} hr${hours !== 1 ? "s" : ""}`;
    const mins = `${minutes} min${minutes !== 1 ? "s" : ""}`;

    return `${hrs} ${mins}`;
  }

  // Helper function to get priority color
  const getPriorityColor = (priorityValue) => {
    const colors = {
      low: "#FF5F1F", // orange
      medium: "#FFB800", // yellow
      high: "#DC3464", // red
    };
    return colors[priorityValue] || "#BCBCBC";
  };

  // Focus on input when task is in editing mode
  useEffect(() => {
    if (
      (task.initial || editingTaskId === task._id) &&
      inputRefs.current[task._id]
    ) {
      // Try to focus immediately
      inputRefs.current[task._id].focus();

      // Also try with a small delay to ensure rendering is complete
      setTimeout(() => {
        if (inputRefs.current[task._id]) {
          inputRefs.current[task._id].focus();
          // Position cursor at the end of text
          const input = inputRefs.current[task._id];
          const length = input.value.length;
          input.selectionStart = length;
          input.selectionEnd = length;
        }
      }, 50);
    }
  }, [task._id, task.initial, editingTaskId]);

  // Fetch task time data
  /*   useEffect(() => {
      if (task._id && task.taskId && task.taskId !== "-") {
      dispatch(fetchTaskTimeData(task.taskId));
    }
  }, [task._id, task.taskId, dispatch]); */

  // These functions have been moved to a shared location

  return (
    <tr
      className={`hover:bg-slate-100 dark:hover:bg-slate-700/30 group ${isEven ? "bg-white dark:bg-slate-800" : "bg-white dark:bg-slate-800/50"}
        ${isSelected ? "bg-dededed border-e1e1e1 dark:bg-blue-700/30" : ""}
        ${isPanelVisible && selectedTask && selectedTask._id === task._id ? "bg-dededed border-e1e1e1 dark:bg-blue-700/30 transition-colors duration-2000" : ""}

        ${isCurrentlyImportedTasks ? "bg-dededed border border-e1e1e1 transition-colors duration-2000" : ""}
        ${selectedTasks.includes(task._id) ? "bg-dededed dark:bg-blue-700/30 border-l-4 border-e1e1e1" : ""}
      `}
      onClick={(e) => {
        e.stopPropagation();
        onRowClick(task, e);
      }}
      onContextMenu={(e) => handleContextMenu(e, task)}
    >
      {/* Checkbox */}
      <td className="px-2 py-1 whitespace-nowrap w-10">
        <div className="flex items-center" onClick={handleTaskSelection}>
          <input
            type="checkbox"
            className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3 h-3"
            checked={selectedTasks.includes(task._id)}
            onChange={() => { }} // Handled by the parent div's onClick
          />
        </div>
      </td>

      {/* Task ID */}
      <td className="px-2 py-1 whitespace-nowrap w-16">
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {task.taskCode !== "-" ? task.taskCode : ""}
        </div>
      </td>

      {/* Project/Task Name */}
      <td className="px-2 py-1">
        <div className="flex items-center w-full relative group">
          {/* Task Toggle Button */}
          {!task.initial && task.taskId && task.taskId !== "-" ? (
            <div className="min-w-[28px] mr-1.5 flex justify-center">
              <TaskToggleButton task={task} onToggle={onToggleComplete} />
            </div>
          ) : (
            ""
          )}

          {/* Task Name and Project - Gmail style */}
          <div className="flex flex-1 items-center overflow-visible relative ">
            {(editingTaskId === task._id || task.initial) && !isPanelVisible ? (
              <div className="flex-1 relative">
                <div className="flex items-center gap-2">
                  <textarea
                    ref={(el) => {
                      inputRefs.current[task._id] = el;
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";

                        // Only focus on initial mount
                        if (
                          (editingTaskId === task._id || task.initial) &&
                          !hasFocusedRef.current[task._id] &&
                          !isPanelVisible
                        ) {
                          el.focus();

                          // Check if we have a saved cursor position for this task
                          const savedCursorPos = cursorPositionRef.current[task._id];
                          if (savedCursorPos !== undefined) {
                            // Restore saved cursor position
                            const pos = Math.min(savedCursorPos, el.value.length);
                            el.selectionStart = pos;
                            el.selectionEnd = pos;
                          } else {
                            // Default to end of text for new tasks
                            el.selectionStart = el.value.length;
                            el.selectionEnd = el.value.length;
                          }

                          hasFocusedRef.current[task._id] = true;
                          setTimeout(() => {
                            el.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }, 100);
                        }
                      }
                    }}
                    rows="1"
                    className={`border text-xs font-semibold flex-1 w-full rounded px-2 py-1 resize-none task-name-textarea outline-electricBlue-50 ${loading ? "blinking-border" : ""
                      } ${task.taskPosition === "completed" ||
                        task.taskPosition === "Completed"
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-gray-900 dark:text-white"
                      } ${emptyTaskWarning &&
                        task.isNewTask &&
                        (!task.taskName || task.taskName?.trim() === "")
                        ? "border-red-500 border-2"
                        : ""
                      }`}
                    value={task.taskName || ""}
                    placeholder="Task Name"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCursorPositionChange(e, task._id);
                    }}
                    onKeyUp={(e) => {
                      // Track cursor position after arrow keys, home, end, etc.
                      handleCursorPositionChange(e, task._id);
                    }}
                    onChange={(e) => {
                      // Auto-resize on typing
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                      onInputChange(e, task._id);
                    }}
                    onKeyDown={(e) => {
                      // Handle Enter (without Shift for single line) and Tab
                      if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
                        onKeyDown(e, task._id, index);
                      }
                    }}
                    onBlur={() => onBlur(task._id)}
                    style={{
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  />
                </div>

                {/* Warning messages for empty task or validation errors */}
                {emptyTaskWarning &&
                  task.isNewTask &&
                  (!task.taskName || task.taskName?.trim() === "") && (
                    <div className="text-red-500 text-xs mt-1">
                      Please fill the task details first
                    </div>
                  )}

                {/* Show validation error if present */}
                {task.validationError && (
                  <div className="text-red-500 text-xs mt-1">
                    {task.validationError}
                  </div>
                )}
              </div>
            ) : (
              // Rest of the code for read-only task display
              <div
                className={`text-xs w-full px-2 py-1 cursor-pointer whitespace-normal break-words ${isTaskCompleted(task)
                  ? "text-gray-400 dark:text-gray-500 "
                  : "text-gray-900 dark:text-white"
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isPanelVisible) {
                    onStartEditing(task._id, e);
                  }
                  // onRowClick(task);
                }}
                title={task.taskName}
              >
                <div className="flex items-center w-full overflow-hidden pr-24">
                  <span
                    className={`text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis task-name-display ${isTaskCompleted(task)
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-[#000000] dark:text-white"
                      }`}
                  >
                    {task.taskName && task.taskName.length > 69
                      ? task.taskName.substring(0, 69) + "..."
                      : task.taskName || "Untitled Task"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gmail-style action icons - Simplified */}

          {!(editingTaskId === task._id || task.initial) && (
            <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center">
              <div className="flex space-x-0.5 ">
                {/* Copy link button - only for existing tasks */}
                {task.taskId && task.taskId !== "-" && (
                  <Tooltip
                    content={isCopied ? "Copied!" : "Copy task link"}
                    placement="top"
                    theme="custom-light"
                  >
                    <CopyTaskLinkButton
                      taskUrl={`${window.location.origin}/tasks?taskId=${task?.taskId}&isFocused=true`}
                    />
                  </Tooltip>
                )}

                {/* Comment button with count in tooltip (desktop only) */}
                {task.taskId && task.taskId !== "-" && (
                  <Tooltip
                    content={
                      hasTaskComments(task)
                        ? `Comments (${task.total_comments || task.commentCount || 0
                        })`
                        : "Add comment"
                    }
                    placement="top"
                    theme="custom-light"
                  >
                    <button
                      className={`p-1 rounded-full ${hasTaskComments(task)
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-500 dark:text-gray-400"
                        } hover:bg-gray-100 dark:hover:bg-gray-700 relative`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(task, null, null, "comments");
                      }}
                    >
                      <Icon
                        icon={
                          hasTaskComments(task)
                            ? "heroicons:chat-bubble-left-right-solid"
                            : "mdi:comment-outline"
                        }
                        className="w-3.5 h-3.5"
                      />
                      {hasTaskComments(task) && (
                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          {task.total_comments || task.commentCount || 0}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                )}

                {/* Attachment button with count in tooltip (desktop only) */}
                {task.taskId && task.taskId !== "-" && (
                  <Tooltip
                    content={
                      hasTaskAttachments(task)
                        ? `Attachments (${task.total_attached_files ||
                        task.attachmentCount ||
                        task.attachments?.length ||
                        0
                        })`
                        : "Add attachment"
                    }
                    placement="top"
                    theme="custom-light"
                  >
                    <button
                      className={`p-1 rounded-full ${hasTaskAttachments(task)
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                        } hover:bg-gray-100 dark:hover:bg-gray-700 relative`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(task, null, null, "attachments");
                      }}
                    >
                      <Icon
                        icon={
                          hasTaskAttachments(task)
                            ? "heroicons:paper-clip"
                            : "mdi:attachment"
                        }
                        className="w-3.5 h-3.5"
                      />
                      {hasTaskAttachments(task) && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          {task.total_attached_files ||
                            task.attachmentCount ||
                            task.attachments?.length ||
                            0}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                )}

                {
                  task?.taskId && (
                    <Tooltip
                      content={
                        task?.subtask_count > 0 ? `${task?.subtask_count} ${task?.subtask_count === 1 ? "Subtask" : "Subtasks"}` : "No Subtasks"
                      }
                      placement="top"
                      theme="custom-light"
                    >
                      <button
                        className={`p-1 rounded-full ${task?.subtask_count > 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                          } hover:bg-gray-100 dark:hover:bg-gray-700 relative`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(task, e, null, "subtasks");
                        }}
                      >
                        <Icon
                          icon="cuida:subtask-outline"
                          className="w-3.5 h-3.5"
                        />
                        {task?.subtask_count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                            {task?.subtask_count}
                          </span>
                        )}
                      </button>
                    </Tooltip>
                  )
                }
              </div>
            </div>
          )}
        </div>
      </td>

      {/* Project Column */}
      <td className="px-2 py-1 whitespace-nowrap w-[120px]" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-[100px]">
          <ProjectSelect
            task={task}
            index={index}
            projects={projects}
            updateExistingTask={updateExistingTask}
            setProjectStatuses={() => { }}
            setIsAddProject={() => { }}
          />
        </div>
      </td>

      {/* Time Logged */}
      <td className="px-2 py-1 whitespace-nowrap w-[70px] text-center">
        <ModernTooltip
          content={
            <span className="dark:text-white font-normal" >
              {task.total_time && task.total_time !== "00:00:00"
                ? `Time logged: ${task.total_time}${task.timer_type ? ` (${task.timer_type})` : ""
                }`
                : task.timeLogged && task.timeLogged > 0
                  ? `Time logged: ${formatTimeLogged(task.timeLogged)}`
                  : "No time logged yet"}
            </span>
          }
          placement="top"
          theme="custom-light"
        >
          <div
            className="flex items-center justify-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(task, null, null, "time-logs");
            }}
          >
            <Icon
              icon="gravity-ui:clock-fill"
              width="12"
              height="12"
              className={`${(task.total_time && task.total_time !== "00:00:00") ||
                (task.timeLogged && task.timeLogged > 0)
                ? "text-[#2DE072]"
                : "text-gray-300"
                } hover:scale-110 transition-transform`}
            />
          </div>
        </ModernTooltip>
      </td>

      {/* Assign To - Replaced with MultiUserAssignCell */}
      <td
        className={`px-2 py-1 whitespace-nowrap w-[160px] ${isTaskCompleted(task) ? "opacity-60" : ""
          }`}
        tabIndex="0"
        onClick={(e) => e.stopPropagation()}
      >
        <MultiUserAssignCell
          task={task}
          users={projectMembers}
          isTaskCompleted={isTaskCompleted(task)}
          updateExistingTask={async (updatedTask, field) => {
            try {
              await updateExistingTask(updatedTask, field);
              // Return success promise
              return Promise.resolve();
            } catch (error) {
              console.error("Error updating assignees:", error);
              // Return error promise
              return Promise.reject(error);
            }
          }}
          index={index + 1}
          isPanelVisible={isPanelVisible}
        />
      </td>

      {/* Priority */}
      <td
        className="px-2 py-1 whitespace-nowrap w-[80px]"
        onClick={(e) => {
          e.stopPropagation();
          if (!isPanelVisible) {
            setEditingPriorityId(task._id);
          }
        }}
      >
        <div className="flex items-center">
          {editingPriorityId !== task._id ? (
            <div className="flex items-center">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mr-1.5"
                style={{
                  backgroundColor: getPriorityColor(
                    task.priority?.toLowerCase() || "low"
                  ),
                }}
              ></div>
              <span className="text-gray-700 dark:text-slate-300 text-xs font-medium truncate capitalize">
                {task.priority || "Low"}
              </span>
              <Icon
                icon="heroicons-outline:chevron-down"
                className="ml-1 w-3 h-3 text-gray-500"
              />
            </div>
          ) : (
            <span>
              <TaskPrioritySelect
                task={task}
                initialOpen={true}
                updateExistingTask={(updatedTask, field) => {
                  updateExistingTask(updatedTask, field);
                  setEditingPriorityId(null);
                }}
              />
              <span className="">
                <Icon
                  icon="heroicons-outline:chevron-down"
                  className="ml-[42px] -mt-[14px] w-3 h-3 text-gray-500"
                />
              </span>
            </span>
          )}
        </div>
      </td>

      {/* Due Date */}
      <DueDateCell
        task={task}
        updateExistingTask={updateExistingTask}
        interpretDate={interpretDate}
        isPanelVisible={isPanelVisible}
      />

      {/* Status */}
      <td
        className="px-2 py-1 whitespace-nowrap w-[120px]"
        onClick={(e) => {
          e.stopPropagation();
          if (!isPanelVisible) {
            setEditingStatusId(task._id);
          }
        }}
      >
        <div className="flex items-center cursor-pointer">
          {editingStatusId !== task._id ? (
            <Tooltip
              content={statusInfo.label}
              placement="top"
              theme="custom-light"
            >
              <div className="flex items-center w-[120px]">
                <span
                  className="w-1.5 h-1.5 mr-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: statusInfo.color }}
                ></span>
                <span className="text-gray-700 dark:text-slate-300 text-xs font-medium truncate">
                  {statusInfo.label}
                </span>

                <Icon
                  icon="heroicons-outline:chevron-down"
                  className="ml-1 w-3 h-3 text-gray-500"
                />
              </div>
            </Tooltip>
          ) : (
            <TaskStatusSelect
              task={task}
              initialOpen={true}
              updateExistingTask={(updatedTask, field) => {
                updateExistingTask(updatedTask, field);
                setEditingStatusId(null);
              }}
            />
          )}
        </div>
      </td>

      {/* Task Opening Icon */}
      <td className="px-2 py-1 whitespace-nowrap w-[40px] text-center">
        <div className="flex items-center justify-center">
          <Tooltip
            content={isOpen ? "Collapse task" : "View task details"}
            placement="top"
          >
            <button
              className={`p-1 rounded-full ${isOpen
                ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              onClick={(e) => {
                e.stopPropagation();
                // We'll let handleRowClick handle the default tab
                onRowClick(task);
              }}
            >
              <Icon
                icon={isOpen ? "mdi:chevron-down" : "mdi:chevron-right"}
                className="w-3.5 h-3.5"
              />
            </button>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}, taskRowComparison);

// Parent-based virtualized task list - works with TasksPage scroll container
const VirtualizedTaskList = memo(({
  sortedTasks,
  renderTask,
  parentRef
}) => {
  // Empty state
  if (!sortedTasks || sortedTasks.length === 0) {
    return (
      <tr>
        <td
          colSpan="9"
          className="px-2 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
        >
          No tasks found. Try adjusting your filters or create a new task.
        </td>
      </tr>
    );
  }

  // 🎯 VIRTUALIZATION STRATEGY:
  // Use virtualization when tasks >= 20 to reduce DOM nodes
  // Pattern from TanStack official docs
  const shouldVirtualize = sortedTasks.length >= 20 && parentRef?.current;

  if (!shouldVirtualize) {
    return (
      <>
        {sortedTasks.map((task, index) => renderTask(task, index))}
      </>
    );
  }

  return <VirtualizedTaskRows sortedTasks={sortedTasks} renderTask={renderTask} parentRef={parentRef} />;
});

// Virtualized rows using TanStack official pattern
const VirtualizedTaskRows = memo(({ sortedTasks, renderTask, parentRef }) => {
  const rowVirtualizer = useVirtualizer({
    count: sortedTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 5, // Reduced from 10 to 5 for better performance
    measureElement: typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
      ? (element) => element?.getBoundingClientRect().height
      : undefined,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <>
      {paddingTop > 0 && (
        <tr>
          <td
            colSpan="9"
            style={{
              height: `${paddingTop}px`,
              padding: 0,
              margin: 0,
            }}
          />
        </tr>
      )}
      {virtualRows.map((virtualRow) => {
        const task = sortedTasks[virtualRow.index];
        return (
          <React.Fragment key={virtualRow.key}>
            {renderTask(task, virtualRow.index)}
          </React.Fragment>
        );
      })}
      {paddingBottom > 0 && (
        <tr>
          <td
            colSpan="9"
            style={{
              height: `${paddingBottom}px`,
              padding: 0,
              margin: 0,
            }}
          />
        </tr>
      )}
    </>
  );
});

const TaskTable = ({ tasks, projects, onRowClick, scrollContainerRef }) => {
  const dispatch = useDispatch();
  const { pagination, isPanelVisible, selectedTask, emptyTaskWarning, selectedTasks, filters: currentFilters } =
    useSelector((state) => state.tasks);
  const { user: userInfo } = useSelector((state) => state.auth);
  const { users, loading: loadingUsers } = useSelector((state) => state.users);

  // State for project from URL
  const [urlProjectData, setUrlProjectData] = useState(null);

  // Refs for input elements
  const inputRefs = useRef({});
  // Track tasks that are being created to avoid duplication
  const taskCreationMap = useRef({});
  // Track which tasks have been focused to prevent cursor jumping
  const hasFocusedRef = useRef({});
  // Track cursor positions for tasks being created
  const cursorPositionRef = useRef({});
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [openTaskId, setOpenTaskId] = useState(null); // Track which task panel is open
  // Use Redux state for task name input instead of local state
  const taskNameInput = useSelector(
    (state) => state.tasks.currentTaskNameInput
  );
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    task: null,
  });

  // Delete Task
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // Filter projects to show only those where current user is a member
  const userProjects = useMemo(() => {
    if (!projects || projects.length === 0 || !userInfo?._id) {
      return projects; // Return all projects if no filtering needed
    }

    return projects.filter((project) => {
      // Check if user is in assignee array (user IDs)
      if (project.assignee && Array.isArray(project.assignee)) {
        if (project.assignee.includes(userInfo._id)) {
          return true;
        }
      }

      // Check if user is in assignee_details array (user objects)
      if (project.assignee_details && Array.isArray(project.assignee_details)) {
        if (project.assignee_details.some(user => user._id === userInfo._id)) {
          return true;
        }
      }

      return false;
    });
  }, [projects, userInfo?._id]);

  // Sorting handler function
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // truncate text to 69 words for project name
  function getLimitedWords(text = "", limit = 10) {
    const words = text.trim().split(/\s+/);
    const isTruncated = words.length > limit;
    const limited = words.slice(0, limit).join(" ");
    return isTruncated ? `${limited}...` : limited;
  }
  // Sort tasks by creation order (newest first)
  const sortTasksByCreation = (tasksToSort) => {
    return [...tasksToSort].sort((a, b) => {
      // Always keep new tasks at the top
      if (a.isNewTask && !b.isNewTask) return -1;
      if (!a.isNewTask && b.isNewTask) return 1;
      if (a.isNewTask && b.isNewTask) return 0;

      // For existing tasks, sort by creation order (newest first)
      // You can change this to sort by any other field like taskId, createdAt, etc.
      return (b.taskId || 0) - (a.taskId || 0);
    });
  };

  // Create a sorted tasks array based on sortConfig
  const sortedTasks = useMemo(() => {
    // First find any newly created tasks - always keep these at top
    const newTasks = tasks.filter((task) => task.isNewTask || task.initial);

    // Then sort the remaining tasks
    const remainingTasks = tasks.filter(
      (task) => !task.isNewTask && !task.initial
    );

    // If no sorting is configured, use the default creation order sort
    if (!sortConfig.key) {
      const sortedRemainingTasks = sortTasksByCreation(remainingTasks);
      return [...newTasks, ...sortedRemainingTasks];
    }

    // Apply sorting based on the selected column
    let sortedRemainingTasks = [...remainingTasks];

    switch (sortConfig.key) {
      case "taskId":
        // Extract numeric part from taskCode for proper sorting
        sortedRemainingTasks.sort((a, b) => {
          // Extract numeric part from taskCode (e.g., from 'UP-1095' to 1095)
          const extractNumber = (taskCode) => {
            if (!taskCode || taskCode === "-") return 0;
            const match = taskCode.match(/(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          };

          const numA = extractNumber(a.taskCode);
          const numB = extractNumber(b.taskCode);

          return sortConfig.direction === "ascending"
            ? numA - numB
            : numB - numA;
        });
        break;

      case "dueDate":
        sortedRemainingTasks.sort((a, b) => {
          // Handle null/undefined dates
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1; // No due date goes to the bottom
          if (!b.dueDate) return -1; // No due date goes to the bottom

          // Compare dates
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return sortConfig.direction === "ascending"
            ? dateA - dateB
            : dateB - dateA;
        });
        break;

      case "priority":
        sortedRemainingTasks.sort((a, b) => {
          const priorityMap = {
            high: 1,
            medium: 2,
            low: 3,
            // Default value for tasks without a priority
            undefined: 4,
          };

          const priorityA = (a.priority || "medium").toLowerCase();
          const priorityB = (b.priority || "medium").toLowerCase();

          return sortConfig.direction === "ascending"
            ? priorityMap[priorityA] - priorityMap[priorityB]
            : priorityMap[priorityB] - priorityMap[priorityA];
        });
        break;

      case "status":
        sortedRemainingTasks.sort((a, b) => {
          // Define status order (adjust based on your specific needs)
          const statusOrder = {
            completed: 4,
            in_progress: 2,
            pending: 3,
            not_started_yet: 1,
          };

          const statusA =
            a.taskPosition?.toLowerCase().replace(/ /g, "_") ||
            "not_started_yet";
          const statusB =
            b.taskPosition?.toLowerCase().replace(/ /g, "_") ||
            "not_started_yet";

          const orderA = statusOrder[statusA] || 0;
          const orderB = statusOrder[statusB] || 0;

          return sortConfig.direction === "ascending"
            ? orderA - orderB
            : orderB - orderA;
        });
        break;

      case "time":
        sortedRemainingTasks.sort((a, b) => {
          // Helper function to convert time to minutes for comparison
          const timeToMinutes = (task) => {
            // Check for total_time first (formatted string like "1:30:00")
            if (task.total_time && task.total_time !== "00:00:00") {
              const timeParts = task.total_time.split(":");
              const hours = parseInt(timeParts[0] || 0, 10);
              const minutes = parseInt(timeParts[1] || 0, 10);
              const seconds = parseInt(timeParts[2] || 0, 10);
              return hours * 60 + minutes + seconds / 60;
            }

            // Check for timeLogged (number in minutes)
            if (task.timeLogged && task.timeLogged > 0) {
              return task.timeLogged;
            }

            // No time logged
            return 0;
          };

          const timeA = timeToMinutes(a);
          const timeB = timeToMinutes(b);

          return sortConfig.direction === "ascending"
            ? timeA - timeB
            : timeB - timeA;
        });
        break;

      default:
        // Default to creation order sort if no valid key
        sortedRemainingTasks = sortTasksByCreation(remainingTasks);
    }

    // Always keep new tasks at the top
    return [...newTasks, ...sortedRemainingTasks];
  }, [tasks, sortConfig]);

  // First find any newly created tasks
  const newTasks = tasks.filter((task) => task.isNewTask || task.initial);
  // Then sort the remaining tasks by creation order
  const remainingTasks = tasks.filter(
    (task) => !task.isNewTask && !task.initial
  );
  const sortedRemainingTasks = sortTasksByCreation(remainingTasks);
  // Combine new tasks at the top with the sorted remaining tasks
  // const sortedTasks = [...newTasks, ...sortedRemainingTasks];

  // Handle window resize for responsive view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Effect to fetch project data from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlProjectId = searchParams.get("projectId");

    if (urlProjectId) {
      // First check if the project is already in the projects list
      const existingProject = projects.find(
        (p) => String(p._id) === String(urlProjectId)
      );

      if (existingProject) {
        setUrlProjectData(existingProject);
      } else {
        // Fetch project data if not in the list
        const fetchProjectData = async () => {
          try {
            const response = await fetchAuthGET(
              `${djangoBaseURL}/project/${urlProjectId}/`
            );
            if (response && response.data) {
              setUrlProjectData(response.data);
            }
          } catch (error) {
            console.error("Error fetching project data:", error);
          }
        };

        fetchProjectData();
      }
    }
  }, [projects]);

  // Helper functions for mobile view
  const getProjectNameFromId = (projectId) => {
    // If we have URL project data and it matches the requested ID
    if (urlProjectData && String(urlProjectData._id) === String(projectId)) {
      return urlProjectData.name;
    }

    // Otherwise use the projects list
    const project = projects.find((p) => String(p._id) === String(projectId));
    return project ? project.name : "";
  };
  function replaceNoProject(value) {
    return value === "No Project" ? "Untitled Project" : value;
  }
  // Helper function for formatting time strings
  const formatTimeString = (timeStr) => {
    if (!timeStr) return "0 hrs 0 mins";

    const [hours, minutes] = timeStr.split(":").map(Number);
    const hrs = `${hours} hr${hours !== 1 ? "s" : ""}`;
    const mins = `${minutes} min${minutes !== 1 ? "s" : ""}`;

    return `${hrs} ${mins}`;
  };

  // Format time logged helper
  const formatTimeLogged = (timeData) => {
    // If we already have a formatted string from the API (total_time)
    if (typeof timeData === "string" && timeData.includes("hrs")) {
      return timeData;
    }

    // If using the old format (minutes as a number)
    if (typeof timeData === "number") {
      if (!timeData) return "0 hrs 00 min";
      const hrs = Math.floor(timeData / 60);
      const mins = timeData % 60;
      return `${hrs} hrs ${mins.toString().padStart(2, "0")} min`;
    }

    // Default fallback
    return "0 hrs 00 min";
  };

  // Get status color and label helper
  const getStatusInfo = (task) => {
    const taskPositionRaw = task.taskPosition || ""; // safe fallback

    // Default status info if not found
    const defaultInfo = {
      color: "#BCBCBC",
      label: taskPositionRaw || "Not Started Yet",
    };

    // If project_status array exists
    if (Array.isArray(task.project_status) && task.project_status.length > 0) {
      // Try value match first
      let matchedStatus = task.project_status.find(
        (status) => status.value === taskPositionRaw
      );

      // Then name match (case-insensitive)
      if (!matchedStatus && taskPositionRaw) {
        matchedStatus = task.project_status.find(
          (status) =>
            status.name &&
            status.name.toLowerCase() === taskPositionRaw.toLowerCase()
        );
      }

      // Try common variations
      if (!matchedStatus && taskPositionRaw) {
        const tpLower = taskPositionRaw.toLowerCase();
        if (tpLower === "in progress") {
          matchedStatus = task.project_status.find(
            (status) =>
              status.value === "in_progress" ||
              status.name?.toLowerCase() === "in progress"
          );
        } else if (tpLower === "not started yet") {
          matchedStatus = task.project_status.find(
            (status) =>
              status.value === "not_started_yet" ||
              status.name?.toLowerCase() === "not started yet"
          );
        } else {
          const normalized = tpLower.replace(/ /g, "_");
          matchedStatus = task.project_status.find(
            (status) => status.value === normalized
          );
        }
      }

      if (matchedStatus) {
        return {
          color: matchedStatus.color || defaultInfo.color,
          label: matchedStatus.name || taskPositionRaw,
        };
      }
    }

    // Fallback map
    const statusMap = {
      completed: { color: "#30F558", label: "Completed" },
      in_progress: { color: "#3092F5", label: "In Progress" },
      pending: { color: "#BCBCBC", label: "Pending" },
      not_started_yet: { color: "#DC3464", label: "Not Started Yet" },
    };

    const normalizedStatus = taskPositionRaw.toLowerCase().replace(/ /g, "_");
    if (statusMap[normalizedStatus]) {
      return statusMap[normalizedStatus];
    }

    return defaultInfo;
  };

  // Check if task has comments
  const hasTaskComments = (task) => {
    return (
      task.hasComments ||
      (task.total_comments && task.total_comments > 0) ||
      (task.commentCount && task.commentCount > 0)
    );
  };

  // check date is in the past or future
  function interpretDate(dateValue) {
    // Compare with today's date using moment.js
    const today = moment().startOf("day");
    const dueDate = moment(dateValue).startOf("day");

    // Handle invalid dates
    if (!dueDate.isValid()) {
      return "";
    }

    // Calculate difference in days
    const diffInDays = dueDate.diff(today, "days");

    if (diffInDays === -1) {
      return "Yesterday";
    } else if (diffInDays === 1) {
      return "Tomorrow";
    } else if (diffInDays === 0) {
      return "Today";
    } else {
      return dueDate.format("MMM DD, ddd"); // Format the date for display
    }
  }

  // Check if task has attachments
  const hasTaskAttachments = (task) => {
    return (
      task.hasAttachments ||
      (task.total_attached_files && task.total_attached_files > 0) ||
      (task.attachmentCount && task.attachmentCount > 0) ||
      (task.attachments && task.attachments.length > 0)
    );
  };

  // Fetch users on component mount if not already loaded
  useEffect(() => {
    if (!users.length && userInfo?._id) {
      dispatch(fetchUsers());
    }
  }, [dispatch, users.length, userInfo?._id]);

  // Helper function to check if task matches current filters
  const taskMatchesFilters = useCallback((updatedTaskPosition) => {
    // If no status filter is applied, task always matches
    if (!currentFilters ||
      !currentFilters.taskPosition ||
      currentFilters.taskPosition === "" ||
      (Array.isArray(currentFilters.taskPosition) && currentFilters.taskPosition.length === 0)) {
      return true;
    }

    // Handle both string and array formats for taskPosition filter
    const filterPositions = Array.isArray(currentFilters.taskPosition)
      ? currentFilters.taskPosition
      : [currentFilters.taskPosition];

    // Check if the updated task position matches any of the filtered statuses
    // Normalize both values for comparison (handle case sensitivity)
    const normalizedUpdatedPosition = updatedTaskPosition?.toString().toLowerCase();
    return filterPositions.some(
      filterStatus => filterStatus?.toString().toLowerCase() === normalizedUpdatedPosition
    );
  }, [currentFilters]);

  // Add the main updateExistingTask function here
  const updateExistingTask = useCallback(async (task, field) => {
    try {
      // Check if this is a new task (ID starts with "new-")
      const isNewTask = String(task._id).startsWith("new-");

      if (isNewTask) {
        // For new tasks, update Redux state first
        const stateUpdate = {
          _id: task._id,
          [field]: task[field],
        };

        if (field === "taskPosition") {
          stateUpdate.isComplete = task[field] === "completed";
        }

        dispatch(updateTaskInState(stateUpdate));

        // If the field change is meaningful (not just task name), trigger task creation
        if (field !== "taskName" && task.taskName && task.taskName.trim()) {
          // Get URL project ID
          const searchParams = new URLSearchParams(window.location.search);
          const urlProjectId = searchParams.get("projectId");

          // Build task data using the passed task object (which has the updated field)
          // and only fallback to defaults for fields that aren't set
          return dispatch(
            createTask({
              _id: task._id,
              taskName: task.taskName,
              userId: task.userId || userInfo?._id,
              projectId: task.projectId || urlProjectId || null,
              taskPosition: task.taskPosition || "not_started_yet",
              priority: task.priority || "low",
              dueDate: task.dueDate || null,
              initial: false,
              collaborators: userInfo?._id ? [userInfo._id] : [],
              assigned_users: task.assigned_users || null,
            })
          ).then((result) => {
            if (result.meta.requestStatus === "fulfilled") {
              // Update the task ID after creation
              const newTaskId = result.payload.taskId;

              // Transfer input refs if they exist
              if (inputRefs.current[task._id]) {
                inputRefs.current[newTaskId] = inputRefs.current[task._id];
                delete inputRefs.current[task._id];
              }

              return Promise.resolve();
            }
            return Promise.reject(result.error);
          });
        }

        return Promise.resolve();
      }

      // For existing tasks, proceed with normal update flow
      // First update in Redux state immediately
      const stateUpdate = {
        _id: task._id,
        [field]: task[field],
      };

      // If updating taskPosition, also update isComplete in state
      if (field === "taskPosition") {
        stateUpdate.isComplete = task[field] === "completed";
      }

      dispatch(updateTaskInState(stateUpdate));

      // Then update in server
      const apiUrl = `${djangoBaseURL}/task/${task._id}/${userInfo._id}/`;

      // Send all fields as JSON
      const response = await fetchAuthPut(apiUrl, {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: task[field],
        }),
      });

      if (!response.status) {
        throw new Error(response.message || `Failed to update ${field}`);
      }

      const data = response;

      // Update task in Redux state with response data
      const responseUpdate = {
        _id: task._id,
        ...data.task_details,
      };

      // Preserve the local state properties that shouldn't be overridden by server response
      if (data.task_details.taskPosition === "completed") {
        responseUpdate.isComplete = true;
      }

      dispatch(updateTaskInState(responseUpdate));

      // Update project statuses if they changed (only for project updates)
      if (field === "projectId" && data.task_details.project_status && Array.isArray(data.task_details.project_status)) {
        // Update the task's project_status property
        dispatch(updateTaskProperty({
          taskId: task._id,
          property: "project_status",
          value: data.task_details.project_status,
        }));
      }

      // If the field is userId, send notification
      if (field === "userId" && userInfo?._id !== data.task_details.userId) {
        // Notification logic here if needed
      }

      // Check if task still matches the current filter after status change
      // Only check for taskPosition updates
      if (field === "taskPosition") {
        // Wait for Redux state to update before checking filter
        requestAnimationFrame(() => {
          setTimeout(() => {
            const matchesFilter = taskMatchesFilters(data.task_details.taskPosition || task[field]);

            // If task doesn't match filter anymore, remove it from view
            // This ensures tasks that don't match filters are removed from the list
            if (!matchesFilter) {
              dispatch(removeTaskFromState(task._id));
            }
          }, 100); // Small delay to ensure Redux state is updated
        });
      }

      // Return success promise
      return Promise.resolve();
    } catch (error) {
      console.error(`Error updating task ${field}:`, error);
      toast.error(`Failed to update ${field === 'assigned_users' ? 'assignees' : field}`, {
        position: "bottom-right",
        autoClose: 2000,
      });

      // Revert UI state if API call fails
      dispatch(
        updateTaskInState({
          ...task,
          [field]: task[field],
        })
      );

      // Return error promise
      return Promise.reject(error);
    }
  }, [dispatch, tasks, userInfo, inputRefs, taskMatchesFilters]);

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    dispatch(selectAllTasks(e.target.checked));
  };

  // Handle task toggle
  const handleToggleComplete = useCallback(
    async (task) => {
      // Determine the new status based on current status
      let newPosition;
      let isComplete;

      if (
        task.taskPosition === "completed" ||
        task.taskPosition === "Completed"
      ) {
        newPosition = "pending";
        isComplete = false;
      } else {
        newPosition = "completed";
        isComplete = true;
      }

      // Update UI optimistically
      dispatch(
        updateTaskInState({
          ...task,
          taskPosition: newPosition,
          isComplete: isComplete,
        })
      );

      // If marking as completed, trigger confetti effect
      if (newPosition === "completed") {
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.5 },
          colors: ["#0F6FFF", "#A026FF", "#6d42f8", "#9333ea", "#2DE072"],
          disableForReducedMotion: true,
        });
      }

      try {
        // Make API call to update the task status
        const BaseUrl = import.meta.env.VITE_APP_DJANGO;
        const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

        const formData = new FormData();
        formData.append("taskPosition", newPosition);
        formData.append("isComplete", isComplete);

        const data = await fetchAuthFilePut(apiUrl, {
          body: formData,
        });

        if (!data.status) {
          throw new Error(data.message || "Failed to update task status");
        }

        // Check if task still matches the current filter after status change
        requestAnimationFrame(() => {
          setTimeout(() => {
            const matchesFilter = taskMatchesFilters(newPosition);

            // If task doesn't match filter anymore, remove it from view
            // This ensures tasks that don't match filters are removed from the list
            if (!matchesFilter) {
              dispatch(removeTaskFromState(task._id));
            }
          }, 100); // Small delay to ensure Redux state is updated
        });

        // Return the updates for the TaskToggleButton to use
        return {
          updates: {
            taskPosition: newPosition,
            isComplete: isComplete,
          }
        };
      } catch (error) {
        console.error("Error updating task status:", error);
        // Revert UI state if API call fails
        dispatch(
          updateTaskInState({
            ...task,
            taskPosition: task.taskPosition,
            isComplete: task.isComplete,
          })
        );
      }
    },
    [dispatch, userInfo, taskMatchesFilters]
  );

  // Create our task update function
  const updateTaskNameCallback = useCallback(
    (taskId, value, forceUpdate = false) => {
      // Always keep what the user typed in Redux so the input doesn't jump
      dispatch(updateTaskInState({ _id: taskId, taskName: value }));

      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;

      if (value.trim() === "") return;

      // Try to detect "Task Name > Project Name"
      const quickMatch = value.match(/^\s*(.+?)\s>\s(.+?)\s*$/);
      let finalName = value.trim();
      let finalProjectId = task.projectId ?? null;

      if (quickMatch) {
        const [, namePart, projectPart] = quickMatch;
        // OPTIONAL: look up a real project by name/label
        const proj = projects?.find(
          (p) => p.name === projectPart || p.label === projectPart
        );
        if (proj) {
          finalName = namePart.trim();
          finalProjectId = proj._id;
        } // else: treat ">" as literal and keep whole value
      }

      const taskIdStr = String(taskId);

      // For existing tasks, always update the API
      // The hasChanged check was removed because Redux state is updated immediately
      // while the API call is debounced, causing false negatives
      if (!taskIdStr.startsWith("new-")) {
        updateExistingTask({ _id: taskId, taskName: finalName }, "taskName")
          .then(() => { })
          .catch((err) => console.error("Error updating task:", err));
        return;
      }

      if (taskIdStr.startsWith("new-") && value.trim() !== "") {
        if (taskCreationMap.current[taskId]) return;

        setLoading(true);
        taskCreationMap.current[taskId] = true;

        dispatch((dispatch, getState) => {
          const latestState = getState();
          const allTasks = latestState.tasks.tasks;
          const currentTask = allTasks.find((t) => t._id === taskId);

          if (!currentTask) {
            console.error("Task not found in state:", taskId);
            setLoading(false);
            delete taskCreationMap.current[taskId];
            return;
          }

          const computeProjectId = () => {
            if (finalProjectId) return finalProjectId;
            const selectedProjectId = currentTask.projectId;
            if (selectedProjectId) return selectedProjectId;
            const searchParams = new URLSearchParams(window.location.search);
            return searchParams.get("projectId") || null;
          };

          return dispatch(
            createTask({
              _id: taskId,
              taskName: finalName,              // use parsed name if quick-entry matched
              userId: userInfo?._id,
              projectId: computeProjectId(),    // use detected project when applicable
              taskPosition: currentTask.taskPosition || "not_started_yet",
              priority: currentTask.priority || "low",
              dueDate: currentTask.dueDate || null,
              initial: false,
              collaborators: [userInfo._id],
              assigned_users: currentTask.assigned_users || null,
            })
          )
            .then((result) => {
              if (result.meta.requestStatus === "fulfilled") {
                const newTaskId = result.payload.taskId;

                // Save the current cursor position BEFORE any state changes
                const savedCursorPosition = cursorPositionRef.current[taskId] || inputRefs.current[taskId]?.selectionStart;

                setLoading(false);
                setEditingTaskId(newTaskId);

                // Transfer cursor position to new task ID BEFORE transferring input ref
                if (savedCursorPosition !== undefined) {
                  cursorPositionRef.current[newTaskId] = savedCursorPosition;
                  delete cursorPositionRef.current[taskId];
                }

                if (inputRefs.current[taskId]) {
                  inputRefs.current[newTaskId] = inputRefs.current[taskId];
                  delete inputRefs.current[taskId];

                  // Transfer hasFocusedRef to prevent cursor jumping after ID change
                  if (hasFocusedRef.current[taskId]) {
                    hasFocusedRef.current[newTaskId] = hasFocusedRef.current[taskId];
                    delete hasFocusedRef.current[taskId];
                  }

                  setTimeout(() => {
                    const input = inputRefs.current[newTaskId];
                    if (input) {
                      input.focus();
                      // Restore the saved cursor position, but ensure it doesn't exceed text length
                      const savedPos = cursorPositionRef.current[newTaskId];
                      const textLength = input.value.length;
                      const cursorPos = savedPos !== undefined
                        ? Math.min(savedPos, textLength)  // Clamp to text length
                        : textLength;
                      input.setSelectionRange(cursorPos, cursorPos);
                    }
                  }, 50);
                } else {
                  // If the ref doesn't exist yet, try again after a short delay
                  setTimeout(() => {
                    const input = inputRefs.current[newTaskId];
                    if (input) {
                      input.focus();
                      // Restore the saved cursor position, but ensure it doesn't exceed text length
                      const savedPos = cursorPositionRef.current[newTaskId];
                      const textLength = input.value.length;
                      const cursorPos = savedPos !== undefined
                        ? Math.min(savedPos, textLength)  // Clamp to text length
                        : textLength;
                      input.setSelectionRange(cursorPos, cursorPos);
                    }
                  }, 100);
                }

                delete taskCreationMap.current[taskId];
              } else {
                console.error("Failed to create task:", result.error);
                setLoading(false);
                delete taskCreationMap.current[taskId];
              }
            })
            .catch((error) => {
              console.error("Error creating task:", error);
              setLoading(false);
              delete taskCreationMap.current[taskId];
            });
        });
      }
    },
    [dispatch, tasks, updateExistingTask, userInfo, setLoading, setEditingTaskId, projects]
  );


  const handleTaskNameInput = useCallback(
    (taskId, value) => {
      dispatch(setTaskNameInput(value));
    },
    [dispatch]
  );

  // Track cursor position changes (click, arrow keys, etc.)
  const handleCursorPositionChange = useCallback((e, taskId) => {
    const cursorPosition = e.target.selectionStart;
    cursorPositionRef.current[taskId] = cursorPosition;
  }, []);

  // Handle input change based on whether task exists or is new
  const handleInputChange = useCallback(
    (e, taskId) => {
      const newValue = e.target.value;
      const cursorPosition = e.target.selectionStart;

      // Store cursor position for this task
      cursorPositionRef.current[taskId] = cursorPosition;

      // Update task name in Redux store (this will trigger re-render with new value)
      dispatch(updateTaskInState({ _id: taskId, taskName: newValue }));

      // Restore cursor position after React re-renders
      requestAnimationFrame(() => {
        const inputElement = inputRefs.current[taskId];
        if (inputElement) {
          inputElement.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    },
    [dispatch, inputRefs]
  );

  // Start editing a task
  const startEditing = useCallback((taskId, e) => {
    e.stopPropagation();
    setEditingTaskId(taskId);

    // Focus the input after a short delay to ensure the input is rendered
    setTimeout(() => {
      if (inputRefs.current[taskId]) {
        inputRefs.current[taskId].focus();
      }
    }, 50);
  }, []);

  // Handle blur event when input loses focus - DON'T save, just exit editing mode
  const handleBlur = useCallback((taskId) => {
    // Just exit editing mode without saving
    // Task will be saved when user presses Enter or Tab
    setEditingTaskId(null);
  }, [setEditingTaskId]);

  // Add a new task
  const handleAddTask = useCallback(
    (index = -1) => {
      // Generate a unique temporary ID
      const newTaskId = `new-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Get project ID from URL parameters first
      const searchParams = new URLSearchParams(window.location.search);
      const urlProjectId = searchParams.get("projectId");

      // Get default project ID - prioritize URL parameter
      const defaultProjectId =
        urlProjectId ||
        userInfo?.default_project ||
        (projects.length > 0 ? projects[0]._id : userInfo.default_project);

      // Create new task object with isEditing flag
      const newTask = {
        _id: newTaskId,
        taskId: "-",
        taskName: "",
        isEditing: true,
        projectId: defaultProjectId,
        userId: userInfo?._id,
        taskPosition: "not_started_yet",
        initial: true,
        collaborators: [userInfo._id], // Add collaborators as an array
        isNewTask: true, // Flag to identify newly added tasks for highlighting
      };
      // Dispatch action to add task to Redux store
      dispatch(
        addTask({
          task: newTask,
          index: 0, // Always insert at the top
        })
      );

      // Set last added task ID to focus on it
      setLastAddedTaskId(newTaskId);
      setEditingTaskId(newTaskId);
    },
    [dispatch, userInfo, projects]
  );

  // Handle key down events for navigation and task creation
  const handleKeyDown = useCallback(
    (e, taskId, index) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const inputElement = inputRefs.current[taskId];

        if (inputElement && inputElement.value.trim() !== "") {
          // Get the current task from Redux state to ensure we have the latest taskName
          const currentTask = tasks.find(t => t._id === taskId);
          const taskName = currentTask?.taskName || inputElement.value;

          // Always save the current task (existing or new) with forceUpdate=true
          // This ensures the API is called even if the value appears unchanged
          updateTaskNameCallback(taskId, taskName, true);

          setEditingTaskId(null);
          // Add a new blank row at the top
          handleAddTask();
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        const inputElement = inputRefs.current[taskId];

        if (inputElement && inputElement.value.trim() !== "") {
          // Get the current task from Redux state to ensure we have the latest taskName
          const currentTask = tasks.find(t => t._id === taskId);
          const taskName = currentTask?.taskName || inputElement.value;

          // Save the current task
          updateTaskNameCallback(taskId, taskName, true);

          setEditingTaskId(null);
        }
      } else if (e.key === "Escape") {
        // Cancel editing on Escape
        setEditingTaskId(null);
      }
    },
    [
      handleAddTask,
      updateTaskNameCallback,
      setEditingTaskId,
      inputRefs,
      dispatch,
      tasks, // Add tasks dependency to access current task state
    ]
  );

  // Focus on newly added task
  useEffect(() => {
    if (lastAddedTaskId) {
      // Try to focus immediately
      if (inputRefs.current[lastAddedTaskId]) {
        inputRefs.current[lastAddedTaskId].focus();
      }

      // Try again with requestAnimationFrame for next frame
      requestAnimationFrame(() => {
        if (inputRefs.current[lastAddedTaskId]) {
          inputRefs.current[lastAddedTaskId].focus();

          // Position cursor at the end of the input text
          const input = inputRefs.current[lastAddedTaskId];
          const length = input.value.length;
          input.selectionStart = length;
          input.selectionEnd = length;

          // Scroll into view - since we're adding to the top, use "start" to ensure the new task is visible
          input.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      // Try once more with a short timeout to ensure rendering is complete
      setTimeout(() => {
        if (inputRefs.current[lastAddedTaskId]) {
          inputRefs.current[lastAddedTaskId].focus();

          // Position cursor at the end of the input text
          const input = inputRefs.current[lastAddedTaskId];
          const length = input.value.length;
          input.selectionStart = length;
          input.selectionEnd = length;

          // Scroll to make sure the new task input is visible at the top of the view
          input.scrollIntoView({ behavior: "smooth", block: "start" });

          // Add extra scroll to make sure it's not hidden behind any headers
          window.scrollTo({
            top: window.scrollY - 80, // Adjust this value based on your header height
            behavior: "smooth",
          });
        }
        // Clear the lastAddedTaskId after we're done with focusing
        setLastAddedTaskId(null);
      }, 100);
    }
  }, [lastAddedTaskId]);

  // New function to handle saving tasks manually
  const handleSaveTask = useCallback(
    (task) => {
      // Check if this task is already being created
      if (taskCreationMap.current[task._id]) {
        return;
      }

      // Get the current value from the input field
      const inputElement = inputRefs.current[task._id];
      let taskName = "";

      // Extract task name from the input field
      if (inputElement && inputElement.value) {
        if (inputElement.value.includes(" > ")) {
          taskName = inputElement.value.split(" > ")[0].trim();
        } else {
          taskName = inputElement.value.trim();
        }
      } else {
        taskName = taskNameInput;
      }

      // Validate task name
      if (!taskName || taskName.trim() === "") {
        // Show validation error
        dispatch(
          updateTaskInState({
            _id: task._id,
            validationError: "Task name is required",
          })
        );
        return;
      }

      // Set loading state
      setLoading(true);

      // Mark this task as being created to prevent duplicates
      taskCreationMap.current[task._id] = true;

      // If no due date is selected, use today's date
      const dueDate = task.dueDate || null;

      // Try to get project ID from URL parameters first
      const searchParams = new URLSearchParams(window.location.search);
      const urlProjectId = searchParams.get("projectId");

      // Create the task with the proper parameters
      dispatch(
        createTask({
          _id: task._id,
          taskName: taskName,
          userId: task.userId || userInfo?._id, // Use task.userId if available, otherwise use current user's ID
          // Prefer the selected projectId on the row, then URL param
          projectId: (() => {
            if (task.projectId !== undefined && task.projectId !== null && task.projectId !== "") {
              return task.projectId;
            }
            return urlProjectId || null;
          })(),
          taskPosition: task.taskPosition || "not_started_yet",
          priority: task.priority || "low",
          dueDate: dueDate,
          initial: false,
          collaborators: userInfo?._id ? [userInfo._id] : [],
        })
      )
        .then((result) => {
          if (result.meta.requestStatus === "fulfilled") {
            // Get the actual taskId from the response
            const taskId = result.payload.taskId;

            // Update task in Redux state
            dispatch(
              updateTaskInState({
                _id: taskId,
                taskId: taskId,
                taskName: taskName,
                dueDate: dueDate,
                initial: false,
                isEditing: false,
                isLoading: false,
                validationError: null,
              })
            );

            // Update state
            setOpenTaskId(taskId);
            setLoading(false);

            // Update editing task ID to the new real task ID to maintain editing state
            setEditingTaskId(taskId);

            // Update input ref mapping to use the new task ID
            if (inputRefs.current[task._id]) {
              // Save the current cursor position BEFORE transferring refs
              const savedCursorPosition = cursorPositionRef.current[task._id] || inputRefs.current[task._id]?.selectionStart;

              inputRefs.current[taskId] = inputRefs.current[task._id];
              delete inputRefs.current[task._id];

              // Transfer cursor position to new task ID
              if (savedCursorPosition !== undefined) {
                cursorPositionRef.current[taskId] = savedCursorPosition;
                delete cursorPositionRef.current[task._id];
              }

              // Maintain focus on the input after ID transition
              setTimeout(() => {
                if (inputRefs.current[taskId]) {
                  inputRefs.current[taskId].focus();
                  // Restore the saved cursor position, but ensure it doesn't exceed text length
                  const input = inputRefs.current[taskId];
                  const savedPos = cursorPositionRef.current[taskId];
                  const textLength = input.value.length;
                  const cursorPos = savedPos !== undefined
                    ? Math.min(savedPos, textLength)  // Clamp to text length
                    : textLength;
                  input.selectionStart = cursorPos;
                  input.selectionEnd = cursorPos;
                }
              }, 50);
            }

            // Success notification
            // You could add a toast notification here
          } else {
            console.error(
              "Failed to create task:",
              result.error || "Unknown error"
            );
            setLoading(false);
            delete taskCreationMap.current[task._id];
          }
        })
        .catch((error) => {
          console.error("Error creating task:", error);
          setLoading(false);
          delete taskCreationMap.current[task._id];
        });
    },
    [
      dispatch,
      userInfo,
      taskNameInput,
      inputRefs,
      setLoading,
      setEditingTaskId,
      setOpenTaskId,
    ]
  );

  // Update the handleRowClick function to save tasks on row click (except dropdown fields)
  const handleRowClick = useCallback(
    (task, e, taskId, targetTab = null) => {
      if (e && (e.ctrlKey || e.metaKey)) {
        dispatch(toggleTaskSelection(task._id));
        return; // Don't open the panel
      }

      // Check if click is on dropdown/interactive fields
      let isInteractiveField = false;
      if (e && e.target) {
        const clickedElement = e.target.closest('td');
        isInteractiveField = clickedElement && (
          clickedElement.querySelector('[class*="Select"]') || // Project/Assignee dropdowns
          clickedElement.querySelector('button') || // Priority/Status/Due Date buttons
          e.target.closest('button') || // Clicked directly on a button
          e.target.closest('[class*="select"]') // Clicked inside select component
        );

        // If clicking on dropdown field, don't save - just return for new tasks
        if (isInteractiveField) {
          // For new tasks, don't do anything
          if (!task.taskId || task.taskId === "-") {
            return;
          }

          // For existing tasks, open the panel without saving other tasks
          const isOpening = task._id !== openTaskId;
          setOpenTaskId(isOpening ? task._id : null);
          dispatch(togglePanelVisibility(isOpening));
          onRowClick(task, null, null, targetTab);
          return;
        }
      }

      // If NOT clicking on dropdown field, save tasks when clicking on row
      // Save currently editing task if it's different from clicked task
      if (editingTaskId && editingTaskId !== task._id) {
        const editingTask = tasks.find(t => t._id === editingTaskId);
        if (editingTask && editingTask.taskName?.trim()) {
          updateTaskNameCallback(editingTaskId, editingTask.taskName.trim(), true);
        }
        setEditingTaskId(null);
      }

      // Save the clicked task if it's a new task with content
      if ((!task.taskId || task.taskId === "-") && task.taskName?.trim()) {
        updateTaskNameCallback(task._id, task.taskName.trim(), true);
        setEditingTaskId(null);
        return; // Don't open panel for new tasks yet
      }

      // If a specific tab is requested, update Redux state
      if (targetTab) {
        const formattedTab =
          targetTab === "comments"
            ? "comments"
            : targetTab === "attachments"
              ? "all-attachments"
              : targetTab === "time-logs"
                ? "time-logs"
                : targetTab === "subtasks"
                  ? "subtasks"
                  : targetTab;
        dispatch(setActiveTaskTab(formattedTab));
      }

      // For new tasks without content, don't open panel
      if (!task.taskId || task.taskId === "-") {
        return;
      }

      // For existing tasks, open the panel
      const isOpening = task._id !== openTaskId;
      setOpenTaskId(isOpening ? task._id : null);

      // Update Redux state for panel visibility
      dispatch(togglePanelVisibility(isOpening));

      // Call the parent onRowClick with the targetTab parameter
      onRowClick(task, null, null, targetTab);
    },
    [onRowClick, openTaskId, dispatch, editingTaskId, tasks, updateTaskNameCallback]
  );

  // Listen for Redux state changes to sync panel visibility
  useEffect(() => {
    if (!isPanelVisible) {
      setOpenTaskId(null);
    } else if (selectedTask && openTaskId !== selectedTask._id) {
      setOpenTaskId(selectedTask._id);
    }
  }, [isPanelVisible, selectedTask]);

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      // Check if task ID starts with "new-" (local task)
      if (taskToDelete._id && taskToDelete._id.startsWith('new-')) {
        // For local tasks, only remove from Redux state
        dispatch(removeTaskFromState(taskToDelete._id));
        setShowDeleteModal(false);
        setTaskToDelete(null);
        return;
      }

      // For backend tasks, proceed with API call
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/api/tasks/${taskToDelete._id}/?userId=${userInfo._id}`;

      try {
        await fetchAuthDelete(apiUrl);
      } catch (error) {
        // If task doesn't exist in backend (404) or other error, still remove from frontend
        if (error.message.includes("404")) {
          console.warn("Task not found in backend, removing from frontend only");
        } else {
          throw error;
        }
      }

      // Remove from Redux state regardless of backend response
      dispatch(removeTaskFromState(taskToDelete?._id));
      toast.success("Task deleted successfully", {
        autoClose: 2000,
      });
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      // Still remove from frontend state even if backend error
      dispatch(removeTaskFromState(taskToDelete?._id));
      toast.success("Task removed from view", {
        autoClose: 2000,
      });
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle right-click event
  const handleContextMenu = (e, task) => {
    e.preventDefault(); // Prevent default browser context menu
    e.stopPropagation(); // Stop event bubbling

    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY }, // Mouse position
      task: task,
    });
  };

  // Close the context menu
  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      task: null,
    });
  };

  // Define what menu items to show
  const getContextMenuItems = (task) => [
    {
      label: "Open task detail",
      icon: "heroicons:eye",
      onClick: (task) => onRowClick(task),
    },
    {
      label: "Open in new tab",
      icon: "majesticons:open",
      onClick: (task) => {
        const taskUrl = `${window.location.origin}/tasks?taskId=${task?.taskId}&isFocused=true`;
        window.open(taskUrl, "_blank", "noopener,noreferrer");
      },
    },
    {
      label: "Copy task link",
      icon: "heroicons:link",
      onClick: (task) => {
        const taskUrl = `${window.location.origin}/tasks?taskId=${task?.taskId}&isFocused=true`;
        navigator.clipboard.writeText(taskUrl);
        toast.success("Task link copied to clipboard");
      },
    },
    {
      label: "Delete task",
      icon: "heroicons:trash",
      onClick: (task) => {
        setTaskToDelete(task);
        setShowDeleteModal(true);
      },
    },
  ];

  // Handle outside clicks and escape key to close context menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.isOpen) {
        closeContextMenu();
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && contextMenu.isOpen) {
        closeContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [contextMenu.isOpen]);

  return (
    <div className="w-full  overflow-auto   ">
      {/* Desktop Table View */}
      <div
        className="hidden md:block responsive-table-container min-h-[75vh]"
        style={{
          contain: 'layout style paint',
          contentVisibility: 'auto',
        }}
      >
        <table
          className="min-w-full"
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        >
          <thead className="bg-white  top-0 z-10  dark:bg-slate-800 border-b border-[#E1E1E1] dark:border-slate-700">
            <tr>
              <th className="w-10 px-2 py-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3 h-3"
                    checked={selectedTasks.length > 0 && selectedTasks.length === tasks.length}
                    onChange={handleSelectAll}
                  />
                </div>
              </th>
              <th
                className="w-16 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => requestSort("taskId")}  // use consistent lowercase key
              >
                <div className="flex items-center">
                  ID
                  {sortConfig.key === "taskId" && (
                    <span className="ml-1">
                      {sortConfig.direction === "ascending" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px] w-[35%] task-name-column">
                Task Name
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] w-[12%]">
                PROJECT
              </th>
              <th
                className="w-[70px] px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => requestSort("time")}
              >
                <div className="flex items-center justify-center">
                  TIME
                  {sortConfig.key === "time" && (
                    <span className="ml-1">
                      {sortConfig.direction === "ascending" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="w-[160px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ASSIGNEES
              </th>
              <th
                className="w-[80px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => requestSort("priority")}
              >
                <div className="flex items-center">
                  Priority
                  {sortConfig.key === "priority" && (
                    <span className="ml-1">
                      {sortConfig.direction === "ascending" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="w-[100px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => requestSort("dueDate")}
              >
                <div className="flex items-center">
                  Due Date
                  {sortConfig.key === "dueDate" && (
                    <span className="ml-1">
                      {sortConfig.direction === "ascending" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="w-[120px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => requestSort("status")}
              >
                <div className="flex items-center">
                  Status
                  {sortConfig.key === "status" && (
                    <span className="ml-1">
                      {sortConfig.direction === "ascending" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th className="w-[40px] px-[10px] py-[10px]"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E1E1E1] dark:bg-slate-800 dark:divide-slate-700">
            <VirtualizedTaskList
              sortedTasks={sortedTasks}
              parentRef={scrollContainerRef}
              renderTask={(task, index) => (
                <TaskRowMemo
                  key={`${task._id}`}
                  task={task}
                  index={index}
                  replaceNoProject={replaceNoProject}
                  isEven={index % 2 === 0}
                  selectedTasks={selectedTasks}
                  editingTaskId={editingTaskId}
                  inputRefs={inputRefs}
                  loading={loading}
                  interpretDate={interpretDate}
                  users={users}
                  projects={userProjects}
                  urlProjectData={urlProjectData}
                  getProjectNameFromId={getProjectNameFromId}
                  dispatch={dispatch}
                  onRowClick={handleRowClick}
                  onToggleComplete={handleToggleComplete}
                  onStartEditing={startEditing}
                  onInputChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  userInfo={userInfo}
                  updateExistingTask={updateExistingTask}
                  isOpen={task._id === openTaskId}
                  isPanelVisible={isPanelVisible}
                  selectedTask={selectedTask}
                  emptyTaskWarning={emptyTaskWarning}
                  handleContextMenu={handleContextMenu}
                  handleCursorPositionChange={handleCursorPositionChange}
                  cursorPositionRef={cursorPositionRef}
                  isMobileView={isMobileView}
                />
              )}
            />
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {/* Sticky Header for Mobile - Mimicking Desktop Column Headers */}
        <div className="sticky top-0 z-10 shadow-sm ">
          {/* Selection and Count Header */}
          {/* <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border-b border-[#E1E1E1] dark:border-slate-700">
            <div className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox rounded text-blue-500 focus:ring-blue-500 mr-3"
                onChange={handleSelectAll}
              />
              <span className="text-xs font-medium text-gray-500 uppercase">
                Select All
              </span>
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase">
              {tasks.length} {tasks.length === 1 ? "Task" : "Tasks"}
            </div>
          </div> */}

          {/* Column Headers - Similar to Desktop */}
          {/* <div className="flex items-center px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-xs font-medium text-gray-500 uppercase ">
            <div className="w-8"></div>
            <div className="w-10 -ml-7 pr-2">ID</div>
            <div className="flex-1 ml-12">TASK NAME</div>
          </div> */}
        </div>

        {sortedTasks.length > 0 ? (
          <div className="divide-y divide-[#E1E1E1] dark:divide-slate-700 mt-1">
            {sortedTasks.map((task, index) => (
              <div
                key={`${task._id}-${index}`}
                className={`p-2 ${index % 2 === 0
                  ? "bg-white dark:bg-slate-800"
                  : "bg-white dark:bg-slate-800/50"
                  } ${selectedTasks.includes(task._id)
                    ? "bg-blue-100 dark:bg-blue-700/30"
                    : ""
                  } 
                ${isPanelVisible &&
                    selectedTask &&
                    selectedTask._id === task._id
                    ? "bg-yellow-100 dark:bg-blue-700/30 border-l-4 border-yellow-400"
                    : ""
                  }
`}
                onClick={() => handleRowClick(task)}
                onContextMenu={(e) => handleContextMenu(e, task)}
              >
                {/* Main Row - ID, Task Name */}
                <div className="flex ">
                  {/* Left Column with Checkbox and ID */}
                  {/* <div className="flex items-center mr-3"> */}
                  {/* Checkbox Column */}
                  {/* <div
                      className="flex-shrink-0 mr-3 mb-[79px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(toggleTaskSelection(task._id));
                      }}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3 h-3 "
                        checked={selectedTasks.includes(task._id)}
                        onChange={() => {}}
                      />
                    </div> */}

                  {/* Task ID */}
                  {/* <div className="flex-shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300 mb-[79px]">
                      {task.taskId !== "-" ? task.taskId : ""}
                    </div> */}
                  {/* </div> */}

                  {/* Task Toggle, Project Name and Task Name */}
                  <div className="flex-grow">
                    <div className="flex gap-2 items-start mb-1 ">
                      {/* Save button for new tasks or toggle button for existing tasks */}
                      <div className="flex-shrink-0">
                        {task.taskId && task.taskId !== "-" ? (
                          <TaskToggleButton
                            task={task}
                            onToggle={handleToggleComplete}
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                        )}
                      </div>

                      {/* Project Name and Task Name on same line */}
                      <div className="flex-1">
                        {editingTaskId === task._id || task.initial ? (
                          <div className="w-full">
                            <textarea
                              ref={(el) => {
                                inputRefs.current[task._id] = el;
                                if (el) {
                                  el.style.height = "auto";
                                  el.style.height = el.scrollHeight + "px";
                                  // Only focus and set cursor at end if not already done for this task
                                  if (
                                    (editingTaskId === task._id ||
                                      task.initial) &&
                                    !hasFocusedRef.current[task._id] &&
                                    !isPanelVisible // Add this condition to prevent focus stealing when panel is open
                                  ) {
                                    el.focus();

                                    // Check if we have a saved cursor position for this task
                                    const savedCursorPos = cursorPositionRef.current[task._id];
                                    if (savedCursorPos !== undefined) {
                                      // Restore saved cursor position
                                      const pos = Math.min(savedCursorPos, el.value.length);
                                      el.selectionStart = pos;
                                      el.selectionEnd = pos;
                                    } else {
                                      // Default to end of text for new tasks
                                      el.selectionStart = el.value.length;
                                      el.selectionEnd = el.value.length;
                                    }

                                    hasFocusedRef.current[task._id] = true;
                                    setTimeout(() => {
                                      el.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                      });
                                    }, 100);
                                  }
                                  // Reset the flag if not editing this task
                                  if (
                                    editingTaskId !== task._id &&
                                    hasFocusedRef.current[task._id]
                                  ) {
                                    hasFocusedRef.current[task._id] = false;
                                  }
                                }
                              }}
                              rows="1"
                              className={`border text-sm w-full rounded px-2 py-1.5 resize-none task-name-textarea ${loading ? "blinking-border" : ""
                                } ${task.taskPosition === "completed" ||
                                  task.taskPosition === "Completed" ||
                                  task.isComplete
                                  ? "text-gray-400 dark:text-gray-500"
                                  : "text-gray-900 dark:text-white"
                                } ${emptyTaskWarning &&
                                  task.isNewTask &&
                                  (!task.taskName || task.taskName?.trim() === "")
                                  ? "border-red-500 border-2"
                                  : ""
                                }`}
                              defaultValue={task.taskName || ""}
                              placeholder="Task Name"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCursorPositionChange(e, task._id);
                              }}
                              onKeyUp={(e) => {
                                // Track cursor position after arrow keys, home, end, etc.
                                handleCursorPositionChange(e, task._id);
                              }}
                              onChange={(e) => {
                                // Auto-resize on typing
                                e.target.style.height = "auto";
                                e.target.style.height =
                                  e.target.scrollHeight + "px";

                                // Only use handleInputChange which internally calls the debounced function
                                // The debounced function will update the Redux taskNameInput state after the delay
                                handleInputChange(e, task._id);
                              }}
                              onKeyDown={(e) => {
                                // Handle Enter (without Shift for single line) and Tab
                                if ((e.key === "Enter" && !e.shiftKey) || e.key === "Tab") {
                                  handleKeyDown(e, task._id, index);
                                }
                              }}
                              onBlur={() => handleBlur(task._id)}
                              style={{
                                wordBreak: "break-word",
                                whiteSpace: "pre-wrap",
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="text-sm"
                          // onClick={(e) => {
                          //   e.stopPropagation();
                          //   startEditing(task._id, e);
                          // }}
                          >
                            <span
                              className={`font-medium task-name-display ${task.taskPosition === "completed" ||
                                task.taskPosition === "Completed" ||
                                task.isComplete
                                ? "text-gray-400 dark:text-gray-500 "
                                : "text-gray-900 dark:text-white"
                                }`}
                            >
                              {getLimitedWords(task.taskName) ||
                                "Untitled Task"}
                            </span>
                            <span className="ml-1 text-blue-600 dark:text-blue-400">
                              &gt;{" "}
                              {replaceNoProject(
                                getLimitedWords(
                                  getProjectNameFromId(task.projectId),
                                  10
                                )
                              ) || "Untitled Project"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={` rounded-full px-2
                        ${task?.priority === "low" ? "bg-[#FF5F1F]/20" : ""}
                        ${task?.priority === "medium" ? "bg-[#FFB800]/20" : ""}
                        ${task?.priority === "high" ? "bg-[#DC3464]/20" : ""}
                      `}
                      >
                        {/* <div
                className="w-2 h-2 rounded-full flex-shrink-0 mr-1.5"
                style={{
                  backgroundColor:
                  task?.priority === "low"
                    ? "#FF5F1F" // orange
                    : task?.priority === "medium"
                    ? "#FFB800" // yellow
                    : task?.priority === "high"
                    ? "#DC3464" // red
                    : "#BCBCBC",
                  }}
              ></div> */}
                        <span
                          className={`
                  ${task?.priority === "low" ? "text-[#FF5F1F]" : ""}
                  ${task?.priority === "medium" ? "text-[#FFB800]" : ""}
                  ${task?.priority === "high" ? "text-[#DC3464]" : ""}
                  text-xs font-medium truncate capitalize
                `}
                        >
                          {task.priority || "Low"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Footer with Status, Time, Assignee - All in one line */}
                <div className="pt-2 ">
                  <div className="flex items-center justify-between">
                    {/* Left side: Status, Assignee, Time */}
                    {/* <div className="flex items-center space-x-2 flex-grow overflow-hidden">

                      <div className="flex items-center flex-shrink-0">
                        <span
                          className="w-2 h-2 mr-1 rounded-full"
                          style={{ backgroundColor: getStatusInfo(task).color }}
                        ></span>
                        <span className="text-xs font-medium truncate max-w-[60px]">
                          {getStatusInfo(task).label}
                        </span>
                      </div>

                      <span className="text-gray-300">|</span>


                      <div
                        className="flex items-center flex-shrink-0 min-w-0 "
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AssignToSelect
                          task={task}
                          users={users}
                          index={index + 1}
                          userId={task.userId}
                          updateExistingTask={updateExistingTask}
                          isCompleted={
                            task.taskPosition === "completed" ||
                            task.taskPosition === "Completed" ||
                            task.isComplete
                          }
                          isMobileView={true}
                        />
                        <span className="-ml-2 text-xs font-medium truncate max-w-[60px]">
                          {task?.user_name}
                        </span>
                      </div>

                      <span className="text-gray-300">|</span>
                    </div> */}

                    <div
                      className={`text-xs ${task.dueDate &&
                        moment(task.dueDate).isBefore(moment().startOf("day"))
                        ? "text-red-500 dark:text-red-400 font-medium"
                        : "text-[#000000] dark:text-slate-300"
                        } ml-9`}
                    >
                      {task.dueDate
                        ? interpretDate(task.dueDate)
                        : "No Due Date"}
                      {task.dueDate && task.isRecurring && (
                        <Icon
                          icon="mdi:refresh"
                          className="inline-block ml-1 w-3 h-3 text-blue-500 dark:text-blue-400"
                        />
                      )}
                    </div>
                    <div className="flex -space-x-2">
                      {(task?.collaborators || [])
                        .map((collabId) =>
                          users.find((u) => u._id === collabId)
                        )
                        .filter(Boolean)
                        .map((user, idx, arr) => {
                          const hasImage =
                            user.image && user.image.trim() !== "";
                          // Get initials: first letter of first and last name, or fallback to email
                          const initials =
                            (user.first_name?.[0] || "") +
                            (user.last_name?.[0] ||
                              user.name?.split(" ")[1]?.[0] ||
                              user.email?.[0] ||
                              "");
                          return hasImage ? (
                            <img
                              key={user._id}
                              src={user.image.trim()}
                              alt={user.name || user.email}
                              className="w-8 h-8 rounded-full border border-white object-cover shadow bg-gray-200"
                              style={{ zIndex: arr.length - idx }}
                              title={user.name || user.email}
                            />
                          ) : (
                            <div
                              key={user._id}
                              className="w-8 h-8 flex items-center justify-center rounded-full border border-white bg-gray-400 text-white font-bold text-xs shadow"
                              style={{ zIndex: arr.length - idx }}
                              title={user.name || user.email}
                            >
                              {initials.toUpperCase()}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No tasks found. Try adjusting your filters or create a new task.
          </div>
        )}
      </div>
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={getContextMenuItems(contextMenu.task)}
        task={contextMenu.task}
      />

      {showDeleteModal && taskToDelete && (
        <div className="fixed inset-0 z-[112] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex flex-col items-center">
              <div className="bg-[#FFEAE7] rounded-full p-2 mb-4">
                <Icon
                  icon="fluent:error-circle-48-regular"
                  className="text-customRed-50"
                  width="30"
                  height="30"
                />
              </div>
              <h3 className="text-lg font-bold mb-2 text-center">
                Delete Task
              </h3>
              <p className="text-sm text-center mb-4">
                Are you sure you want to delete{" "}
                <b>{taskToDelete.taskName || "this task"}</b>?<br />
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-md px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="flex-1 rounded-md px-3 py-1 bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTable;