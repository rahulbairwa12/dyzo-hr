import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import CustomDropdown from "./CustomDropdown";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import moment from "moment";
import { debounce } from "lodash";
import { updateTaskInSection, removeTemporaryTask } from "../store/sectionTaskSlice";
import { useSectionTasks } from "../hooks/useSectionTasks";
import { intialLetterName } from "@/helper/helper";
import MultiUserAssignCell from "@/components/dropdowns/MultiUserAssignCell";
import Tooltip from "@/components/ui/Tooltip";
import CopyTaskLinkButton from "@/features/tasks/components/CopyTaskLinkButton";
import confetti from "canvas-confetti";

// Add global styles for dropdowns
const dropdownStyles = `
  .react-select-container {
    z-index: 9999 !important;
  }
  .react-select__menu {
    z-index: 9999 !important;
    position: absolute !important;
  }
  .react-select__menu-portal {
    z-index: 9999 !important;
  }
  .select__menu {
    z-index: 9999 !important;
  }
  .select__menu-portal {
    z-index: 9999 !important;
  }
`;

const TaskToggleButton = ({ task, onToggle }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await onToggle(task);
      if (result?.updates?.isComplete) {
        confetti({
          particleCount: 500,
          spread: 100,
          origin: { y: 0.5 },
          colors: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF"],
          disableForReducedMotion: true,
        });
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isCompleted =
    task.taskPosition === "completed" ||
    task.taskPosition === "Completed"

  return (
    <button
      data-action="toggle-complete"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center p-0.5 text-gray-900 focus:outline-none rounded-full transition-colors ${isLoading
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-gray-100 cursor-pointer'
        }`}
      title={isLoading ? "Updating..." : (isCompleted ? "Mark as incomplete" : "Mark as complete")}
    >
      {isLoading ? (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <div className="w-2.5 h-2.5 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isCompleted ? (
        <div className="w-4 h-4 rounded-full bg-[#2DE072] flex items-center justify-center hover:bg-[#2fc368] transition-colors">
          <Icon
            icon="bi:check"
            className="w-2.5 h-2.5 text-white"
          />
        </div>
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300 hover:border-[#68B984] hover:bg-[#68B984] hover:bg-opacity-10 flex items-center justify-center transition-all duration-200">
          <Icon
            icon="bi:check"
            className="w-2.5 h-2.5 text-gray-400"
          />
        </div>
      )}
    </button>
  );
};

const EditableTaskRow = React.memo(React.forwardRef(
  (
    {
      task,
      isSelected,
      onSelect,
      onTaskClick,
      onToggleComplete,
      formatDate,
      isDragging,
      dragHandleProps,
      dragAttributes,
      style, // Add style prop for dnd-kit
      isEven,
      isOpen,
      onRowClick,
      onCreateNewTask,
      projectMembers = [],
      projectStatus = [],
      handleContextMenu,
      canCreateTasks = true,
      // Props for initial task handling
      inputRefs: parentInputRefs,
      editingTaskId,
      onTaskNameInput,
      onTaskNameBlur,
      onTaskKeyDown,
      onSaveTask, // Callback to save/create task when fields change
      isSaving = false, // Track if task is being saved
      // Props for filter matching
      taskFilters = {},
      sectionId,
    },
    ref,
  ) => {
    const dispatch = useDispatch();

    // Optimized selectors to prevent unnecessary re-renders
    const globalUsers = useSelector((state) => state.users?.users || []);
    const users = projectMembers.length > 0 ? projectMembers : globalUsers;
    const isTaskPanelOpen = useSelector((state) => state.sectionTasks.isTaskPanelOpen);
    const selectedTask = useSelector((state) => state.sectionTasks.selectedTask);
    // Get filters directly from Redux state to ensure we always have the latest values
    const currentFilters = useSelector((state) => state.sectionTasks.filters);
    // Use Redux filters if available, otherwise fall back to props
    const activeTaskFilters = currentFilters || taskFilters;

    // Memoize the panel open state for this specific task to prevent unnecessary re-renders
    const isPanelOpenForThisTask = useMemo(() =>
      isTaskPanelOpen && selectedTask?._id === task._id,
      [isTaskPanelOpen, selectedTask?._id, task._id]
    );

    const [editingField, setEditingField] = useState(null);
    const [editValues, setEditValues] = useState({
      taskName: task.taskName,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      status: task.taskPosition,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdatingFromProps, setIsUpdatingFromProps] = useState(false);
    const [isTaskNameFocused, setIsTaskNameFocused] = useState(false);
    const [shouldFocus, setShouldFocus] = useState(false);
    const updateInProgressRef = useRef(false);
    const assigneeUpdateTimeoutRef = useRef(null);
    // Ref to store the debounced save function for existing tasks only
    const debouncedSaveRef = useRef(null);
    // Ref to track current task state for debounced function
    const taskStateRef = useRef({ initial: task.initial, _id: task._id });
    // Ref to store cursor position to restore after save
    const cursorPositionRef = useRef(null);

    // Effect to adjust textarea height when task name changes
    useEffect(() => {
      if (inputRefs.taskName.current && isTaskNameFocused) {
        adjustTextareaHeight(inputRefs.taskName.current);
      }
    }, [editValues.taskName, isTaskNameFocused]);

    const inputRefs = {
      taskName: useRef(null),
      dueDate: useRef(null),
    };
    const flatpickrRef = useRef(null);
    const taskNameContainerRef = useRef(null);

    // Auto-resize textarea function
    const adjustTextareaHeight = (textarea) => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    // Helper functions for action icons
    const hasTaskComments = (task) => {
      const count = task.total_comments ?? task.commentCount ?? 0;
      return count > 0;
    };

    const hasTaskAttachments = (task) => {
      return (
        task.hasAttachments ||
        (task.total_attached_files && task.total_attached_files > 0) ||
        (task.attachmentCount && task.attachmentCount > 0) ||
        (task.attachments && task.attachments.length > 0)
      );
    };

    // Helper function to format time logged
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

    // Priority options
    const priorityOptions = [
      { value: "low", label: "Low", color: "#FF5F1F" },
      { value: "medium", label: "Medium", color: "#F59E0B" },
      { value: "high", label: "High", color: "#DC3464" },
    ];

    // Dynamic status options from projectStatus prop
    const statusOptions = useMemo(() => {
      return projectStatus && projectStatus.length > 0
        ? projectStatus.map(status => ({
          value: status.value,
          label: status.label || status.name,
          color: status.color
        }))
        : [
          // Fallback to default options if projectStatus is not available
          { value: "not_started_yet", label: "Not Started", color: "#DC3464" },
          { value: "in_progress", label: "In Progress", color: "#3092F5" },
          { value: "pending", label: "Pending", color: "#BCBCBC" },
          { value: "completed", label: "Completed", color: "#30F558" },
          { value: "on_hold", label: "On Hold", color: "#6B7280" },
        ];
    }, [projectStatus]);

    // Helper function to get status display info
    const getStatusDisplayInfo = useCallback((taskPosition) => {
      if (projectStatus && projectStatus.length > 0) {
        const status = projectStatus.find(s => s.value === taskPosition);
        if (status) {
          return {
            name: status.label || status.name,
            color: status.color
          };
        }
      }

      // Fallback for hardcoded statuses
      switch (taskPosition) {
        case "completed":
          return { name: "Completed", color: "#30F558" };
        case "in_progress":
          return { name: "In Progress", color: "#3092F5" };
        case "pending":
          return { name: "Pending", color: "#BCBCBC" };
        case "on_hold":
          return { name: "On Hold", color: "#6B7280" };
        default:
          return { name: "Not Started Yet", color: "#DC3464" };
      }
    }, [projectStatus]);

    // Auto-focus when entering edit mode
    useEffect(() => {
      if (editingField && inputRefs[editingField]?.current && shouldFocus) {
        // Small delay to ensure the input is rendered
        setTimeout(() => {
          if (inputRefs[editingField]?.current) {
            inputRefs[editingField].current.focus();
            if (editingField === "taskName") {
              inputRefs[editingField].current.select();
            }
            setShouldFocus(false); // Reset focus flag
          }
        }, 50); // Increased delay to ensure proper rendering order
      }
    }, [editingField, shouldFocus]);

    // Auto-open calendar when editing due date
    useEffect(() => {
      if (editingField === "dueDate" && flatpickrRef.current?.flatpickr) {
        // Short delay to ensure the component is rendered
        setTimeout(() => {
          flatpickrRef.current.flatpickr.open();
        }, 10);
      }
    }, [editingField]);

    // Sync local state when task prop changes (from external updates like TaskPanel)
    useEffect(() => {
      // Only sync if not currently editing and the values are actually different
      if (editingField !== "taskName") {
        const newValues = {
          taskName: task.taskName,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
          status: task.taskPosition,
        };

        // Only update if values are actually different to prevent unnecessary re-renders
        const hasChanges =
          editValues.taskName !== newValues.taskName ||
          editValues.priority !== newValues.priority ||
          editValues.dueDate !== newValues.dueDate ||
          editValues.status !== newValues.status;

        if (hasChanges) {
          setIsUpdatingFromProps(true);
          setEditValues(newValues);
          // Reset flag after state update
          setTimeout(() => {
            setIsUpdatingFromProps(false);
          }, 0);
        }
      }
    }, [
      task.taskName,
      task.priority,
      task.dueDate,
      task.taskPosition,
      editingField,
    ]);

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (assigneeUpdateTimeoutRef.current) {
          clearTimeout(assigneeUpdateTimeoutRef.current);
        }
      };
    }, []);

    // Preserve focus on taskName input after save completes (when isSubmitting changes from true to false)
    const prevIsSubmittingRef = useRef(isSubmitting);
    useEffect(() => {
      // If save just completed (isSubmitting changed from true to false) and taskName was focused
      if (prevIsSubmittingRef.current && !isSubmitting && isTaskNameFocused && inputRefs.taskName.current && !task.initial) {
        // Restore focus after a short delay to ensure DOM is updated
        const timeoutId = setTimeout(() => {
          if (inputRefs.taskName.current && document.activeElement !== inputRefs.taskName.current) {
            inputRefs.taskName.current.focus();
            // Restore cursor position if we have it stored and it's valid
            if (cursorPositionRef.current !== null) {
              const maxPosition = inputRefs.taskName.current.value?.length || 0;
              const safePosition = Math.min(cursorPositionRef.current, maxPosition);
              inputRefs.taskName.current.setSelectionRange(safePosition, safePosition);
            }
          }
        }, 10);
        return () => clearTimeout(timeoutId);
      }
      prevIsSubmittingRef.current = isSubmitting;
    }, [isSubmitting, isTaskNameFocused, task.initial]);



    const handleFieldClick = (field, e) => {
      e.stopPropagation();
      if (!canCreateTasks) return; // viewers cannot enter edit mode
      setEditingField(field);
      setShouldFocus(true);
    };

    const handleInputChange = (field, value) => {
      setEditValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

    const handleSave = async (field, newValue = null) => {

      if (isSubmitting || updateInProgressRef.current) {

        return;
      }

      updateInProgressRef.current = true;
      setIsSubmitting(true);

      try {
        const updates = {};
        const providedNewValue = typeof newValue !== "undefined";
        const currentValues = providedNewValue
          ? {
            ...editValues,
            [field === "project" ? "projectId" : field]: newValue,
          }
          : editValues;

        switch (field) {
          case "taskName":
            if (currentValues.taskName.trim() !== task.taskName) {
              updates.taskName = currentValues.taskName.trim();
            }
            break;

          case "priority":
            if (currentValues.priority !== task.priority) {
              updates.priority = currentValues.priority;
            }
            break;
          case "dueDate":
            // Ensure only YYYY-MM-DD goes in
            const newDueDate = currentValues.dueDate
              ? new Date(currentValues.dueDate).toISOString().split("T")[0]
              : null;

            const currentDueDate = task.dueDate
              ? task.dueDate.split("T")[0]
              : null;

            if (newDueDate !== currentDueDate) {
              updates.dueDate = newDueDate;
            }
            break;

          case "status":
            if (currentValues.status !== task.taskPosition) {
              updates.taskPosition = currentValues.status;
              updates.isComplete = currentValues.status === "completed";
              if (currentValues.status === "completed") {
                confetti({
                  particleCount: 500,
                  spread: 100,
                  origin: { y: 0.5 },
                  colors: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF"],
                  disableForReducedMotion: true,
                });
              }

              // Check if task still matches the current filter after status change
              // Store this for later check after API call succeeds
              updates._shouldCheckFilter = true;
              updates._newStatus = currentValues.status;
            }
            break;
        }

        // Only make API call if there are actual changes
        if (Object.keys(updates).length > 0) {
          // Store the filter check flag before removing it from updates
          const shouldCheckFilter = updates._shouldCheckFilter;
          const newStatus = updates._newStatus;
          delete updates._shouldCheckFilter;
          delete updates._newStatus;

          // For temporary/initial tasks, update local state and trigger save if field changed
          if (task.initial) {
            // Update local state first
            dispatch({
              type: 'sectionTasks/updateTaskInState',
              payload: {
                _id: task._id,
                ...updates,
              }
            });

            // If a field other than taskName changed (dropdown), trigger save/create
            // This ensures task is created when user changes priority, status, etc.
            if (field !== "taskName" && task.taskName && task.taskName.trim() && onSaveTask) {
              // Gather current task data including the just-updated values
              const currentTaskData = {
                priority: updates.priority || task.priority,
                dueDate: updates.dueDate !== undefined ? updates.dueDate : task.dueDate,
                assigned_users: updates.assigned_users || task.assigned_users || [],
                taskPosition: updates.taskPosition || task.taskPosition,
              };

              // Call parent's save callback to create the task with current data
              await onSaveTask(task._id, task.taskName, currentTaskData);
            }
          } else {
            // For existing tasks, call the API
            await dispatch(
              updateTaskInSection({
                taskId: task._id,
                updates,
                skipChangeDetection: true, // Force API call for user edits
              }),
            ).unwrap();

            // After successful update, check if task still matches filters
            // Use requestAnimationFrame to ensure Redux state is updated
            if (shouldCheckFilter && sectionId && newStatus) {
              // Wait for Redux state to update before checking filter
              requestAnimationFrame(() => {
                setTimeout(() => {
                  const matchesFilter = taskMatchesFilters(newStatus);

                  // If task doesn't match filter anymore, remove it from view
                  if (!matchesFilter) {
                    dispatch(removeTemporaryTask({
                      sectionId: sectionId,
                      taskId: task._id
                    }));
                  }
                }, 100); // Small delay to ensure Redux state is updated
              });
            }

            // Preserve focus on taskName input after save completes
            if (field === "taskName" && inputRefs.taskName.current) {
              // Use requestAnimationFrame to ensure DOM is updated
              requestAnimationFrame(() => {
                // Restore focus and cursor position
                if (inputRefs.taskName.current) {
                  inputRefs.taskName.current.focus();
                  // Restore cursor position if we have it stored
                  if (cursorPositionRef.current !== null) {
                    inputRefs.taskName.current.setSelectionRange(
                      cursorPositionRef.current,
                      cursorPositionRef.current
                    );
                  }
                }
              });
            }
          }
        }

        // Only close editing field for non-taskName fields (dropdowns)
        // Keep taskName field open so user can continue typing
        if (field !== "taskName") {
          setEditingField(null);
        }
      } catch (error) {
        console.error("Error updating task:", error);
      } finally {
        setIsSubmitting(false);
        updateInProgressRef.current = false;
      }
    };

    // Update task state ref whenever task changes
    useEffect(() => {
      taskStateRef.current = { initial: task.initial, _id: task._id };
    }, [task.initial, task._id]);

    // Setup debounced save function for existing tasks only (not for initial/creating tasks)
    // This must be after handleSave is defined
    useEffect(() => {
      // Only create debounced function for tasks with valid backend ID (not initial tasks)
      if (!task.initial && task._id) {
        // Create a debounced version of handleSave that only works for existing tasks
        debouncedSaveRef.current = debounce(async (field, newValue) => {
          // Check current task state from ref (always up-to-date) before saving
          const currentTaskState = taskStateRef.current;
          if (!currentTaskState.initial && currentTaskState._id) {
            await handleSave(field, newValue);
          }
        }, 800); // 800ms debounce delay
      } else {
        // Clear debounced function for initial tasks
        if (debouncedSaveRef.current?.cancel) {
          debouncedSaveRef.current.cancel();
        }
        debouncedSaveRef.current = null;
      }

      // Cleanup function to cancel pending debounced calls
      return () => {
        if (debouncedSaveRef.current?.cancel) {
          debouncedSaveRef.current.cancel();
        }
      };
    }, [task.initial, task._id]); // Recreate when task.initial or task._id changes

    const handleCancel = () => {
      setEditValues({
        taskName: task.taskName,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        status: task.taskPosition,
      });
      setEditingField(null);
    };

    // Helper function to check if task matches current filters
    const taskMatchesFilters = useCallback((updatedTaskPosition) => {
      // If no status filter is applied, task always matches
      if (!activeTaskFilters ||
        !activeTaskFilters.taskPosition ||
        !Array.isArray(activeTaskFilters.taskPosition) ||
        activeTaskFilters.taskPosition.length === 0) {
        return true;
      }

      // Check if the updated task position matches any of the filtered statuses
      // Normalize both values for comparison (handle case sensitivity)
      const normalizedUpdatedPosition = updatedTaskPosition?.toString().toLowerCase();
      return activeTaskFilters.taskPosition.some(
        filterStatus => filterStatus?.toString().toLowerCase() === normalizedUpdatedPosition
      );
    }, [activeTaskFilters]);

    return (
      <>
        {/* Inject dropdown styles */}
        <style>{dropdownStyles}</style>
        <tr
          ref={ref}
          {...dragAttributes}
          style={style}
          data-task-id={task._id || task.taskId}
          data-task-name={task.taskName}
          className={`task-row group hover:bg-slate-100 dark:hover:bg-slate-700/30 ${isEven ? "bg-white dark:bg-slate-800" : "bg-white dark:bg-slate-800/50"} ${isSelected || isPanelOpenForThisTask ? "bg-dededed border-e1e1e1 dark:bg-blue-700/30" : ""
            } ${editingField ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
            } transition-all duration-200 ${!canCreateTasks ? "cursor-not-allowed" : ""}`} // Add cursor style for viewers
          onClick={
            editingField
              ? undefined
              : async (e) => {
                if (!canCreateTasks) return; // Prevent task selection for viewers

                // If this is an initial task with a name, save it first before opening
                if (task.initial && task.taskName && task.taskName.trim() && onSaveTask) {
                  // Don't open panel if clicking on dropdowns - they have their own handlers
                  const isDropdownClick = e.target.closest('[data-action]') ||
                    e.target.closest('button') ||
                    e.target.closest('select') ||
                    e.target.closest('.react-select') ||
                    e.target.closest('textarea');

                  if (!isDropdownClick) {
                    try {
                      // Pass current task data when saving
                      const currentTaskData = {
                        priority: task.priority,
                        dueDate: task.dueDate,
                        assigned_users: task.assigned_users || [],
                        taskPosition: task.taskPosition,
                      };
                      await onSaveTask(task._id, task.taskName, currentTaskData);
                    } catch (error) {
                      console.error("Error saving task on row click:", error);
                    }
                  }
                }

                onTaskClick(task, e);
              }
          }
          onContextMenu={(e) => {
            if (!canCreateTasks) {
              e.preventDefault(); // Prevent context menu for viewers
              return;
            }
            e.preventDefault(); // Prevent default browser context menu
            e.stopPropagation(); // Stop event bubbling
            if (handleContextMenu) {
              handleContextMenu(e, task);
            }
          }}
        >
          {/* Checkbox */}
          <td className="px-1 py-1 whitespace-nowrap w-6 hidden md:table-cell">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isSelected}
                data-action="select"
                onChange={(e) => {
                  e.stopPropagation(); // Prevent row click
                  onSelect(task._id);
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                }}
                className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                disabled={!canCreateTasks} // Disable checkbox for viewers
              />
            </div>
          </td>

          {/* Task ID */}
          <td className="pl-1 pr-1 py-1 whitespace-nowrap w-20">
            <div className="flex items-center space-x-1">
              {/* Drag Handle */}
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-500 rounded transition-colors opacity-50 group-hover:opacity-100"
                title="Drag to reorder task"
              >
                <Icon icon="heroicons:bars-3" className="w-3 h-3" />
              </div>
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {task?.taskCode}
              </div>
            </div>
          </td>

          {/* Task Name */}
          <td className="pl-2 pr-2 py-1 md:pl-2 md:pr-2">
            <div
              className="flex items-center w-full relative group min-h-[32px]"
              ref={taskNameContainerRef}
            >
              {/* Task Toggle Button */}
              {(() => {
                return !task.initial && task._id ? (
                  <div className="min-w-[28px] mr-1.5 flex justify-center">
                    <TaskToggleButton
                      key={`${task._id}-${task.taskPosition}-${task.isComplete}`}
                      task={task}
                      onToggle={onToggleComplete}
                    />
                  </div>
                ) : (
                  <div className="min-w-[28px] mr-1.5"></div>
                );
              })()}
              <div className="flex items-center flex-1 pr-12 md:pr-20">
                <textarea
                  ref={(el) => {
                    // Always populate local ref for this component
                    inputRefs.taskName.current = el;

                    // Also populate parent's ref if provided (for smooth ID transitions)
                    if (parentInputRefs && task._id) {
                      parentInputRefs.current[task._id] = el;
                    }
                  }}
                  value={task.initial ? task.taskName : editValues.taskName}
                  onChange={(e) => {
                    if (!canCreateTasks) return; // block edits for viewers

                    const cursorPosition = e.target.selectionStart;
                    const newValue = e.target.value;

                    // Store cursor position for restoring after save
                    cursorPositionRef.current = cursorPosition;

                    // For initial tasks, use parent's handler with cursor position
                    if (task.initial && onTaskNameInput) {
                      onTaskNameInput(task._id, newValue, cursorPosition);
                    } else {
                      // For existing tasks, update local state immediately
                      handleInputChange("taskName", newValue);

                      // Use debounced save for existing tasks (only if task has valid backend ID)
                      if (!task.initial && task._id && debouncedSaveRef.current) {
                        // Cancel any pending debounced calls
                        if (debouncedSaveRef.current.cancel) {
                          debouncedSaveRef.current.cancel();
                        }
                        // Call the debounced save function
                        debouncedSaveRef.current("taskName", newValue);
                      }
                    }

                    // Auto-resize on content change
                    if (isTaskNameFocused) {
                      adjustTextareaHeight(e.target);
                    }
                  }}
                  onClick={(e) => {
                    // Don't stop propagation completely - allow click-outside detection for dropdowns
                    // Only prevent row click handler from firing
                    e.stopPropagation();

                    // Force any open dropdowns to close by triggering a mousedown event on document
                    // This helps close dropdowns like the assignee selector
                    const mousedownEvent = new MouseEvent('mousedown', {
                      bubbles: true,
                      cancelable: true,
                      view: window
                    });

                    // Dispatch to a temporary element outside the dropdown
                    const tempElement = document.createElement('div');
                    document.body.appendChild(tempElement);
                    tempElement.dispatchEvent(mousedownEvent);
                    document.body.removeChild(tempElement);
                  }}
                  onFocus={(e) => {
                    e.stopPropagation();
                    setIsTaskNameFocused(true);
                    // Auto-resize when focused
                    adjustTextareaHeight(e.target);
                  }}
                  onBlur={() => {
                    setIsTaskNameFocused(false);

                    // For initial tasks, use parent's blur handler
                    if (task.initial && onTaskNameBlur) {
                      onTaskNameBlur(task._id);
                    }

                    // Reset height when not focused - DON'T save on blur
                    if (inputRefs.taskName.current) {
                      inputRefs.taskName.current.style.height = 'auto';
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onKeyDown={(e) => {
                    // For initial tasks, use parent's keydown handler
                    if (task.initial && onTaskKeyDown) {
                      onTaskKeyDown(e, task._id);
                      return;
                    }

                    // For existing tasks, save on Enter or Tab
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      // Cancel any pending debounced save calls
                      if (debouncedSaveRef.current?.cancel) {
                        debouncedSaveRef.current.cancel();
                      }
                      // Force immediate save
                      handleSave("taskName", editValues.taskName);
                    } else if (e.key === "Tab") {
                      e.preventDefault();
                      // Cancel any pending debounced save calls
                      if (debouncedSaveRef.current?.cancel) {
                        debouncedSaveRef.current.cancel();
                      }
                      // Save on Tab
                      handleSave("taskName", editValues.taskName);
                    } else if (e.key === "Escape") {
                      // Cancel any pending debounced save calls
                      if (debouncedSaveRef.current?.cancel) {
                        debouncedSaveRef.current.cancel();
                      }
                      handleCancel();
                    }
                  }}
                  className={`w-full bg-white dark:bg-slate-700 group-hover:border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8E2EFF] resize-none overflow-hidden ${isTaskNameFocused ? 'min-h-[24px]' : 'h-[24px]'
                    }`}
                  disabled={isSubmitting || !canCreateTasks}
                  rows={1}
                  style={{
                    minHeight: isTaskNameFocused ? '24px' : '24px',
                    height: isTaskNameFocused ? 'auto' : '24px'
                  }}
                  placeholder={task.initial ? "Write a task name..." : ""}
                  autoFocus={task.initial}
                />

                {/* Mobile Panel Open Icon */}
                <div className="md:hidden ml-2">
                  <button
                    data-action="open-task"
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Open task details"
                  >
                    <Icon
                      icon="heroicons:chevron-right"
                      className="w-4 h-4 text-gray-500 dark:text-gray-400"
                    />
                  </button>
                </div>
                {(isSubmitting || isSaving) && (
                  <div className="flex items-center space-x-1 ml-2">
                    <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Saving...
                    </span>
                  </div>
                )}
              </div>

              {/* Gmail-style action icons - Only show for existing tasks and when not editing */}
              {!(editingField === "taskName" || task.initial) && task._id && (
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center z-10  md:flex">
                  <div className=" space-x-0.5 hidden md:flex">
                    {/* Copy link button - only for existing tasks */}
                    {task._id && task._id !== "temp" && (
                      <Tooltip
                        content="Copy task link"
                        placement="top"
                        theme="custom-light"
                      >
                        <CopyTaskLinkButton
                          taskUrl={`${window.location.origin}/tasks?taskId=${task?._id}&isFocused=true`}
                        />
                      </Tooltip>
                    )}

                    {/* Comment button with count in tooltip */}
                    {task._id && task._id !== "temp" && (
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
                          data-action="open-comments"
                          className={`p-0.5 rounded ${hasTaskComments(task)
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-gray-500 dark:text-gray-400"
                            } hover:bg-gray-100 dark:hover:bg-gray-700 relative cursor-pointer`}
                        >
                          <Icon
                            icon={
                              hasTaskComments(task)
                                ? "heroicons:chat-bubble-left-right-solid"
                                : "mdi:comment-outline"
                            }
                            className="w-3 h-3"
                          />
                          {hasTaskComments(task) && (
                            <span className="absolute -top-0.5 -right-0.5 bg-purple-600 text-white text-[8px] font-bold rounded-full w-3 h-3 flex items-center justify-center">
                              {task.total_comments || task.commentCount || 0}
                            </span>
                          )}
                        </button>
                      </Tooltip>
                    )}

                    {/* Attachment button with count in tooltip */}
                    {task._id && task._id !== "temp" && (
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
                          data-action="open-attachments"
                          className={`p-0.5 rounded ${hasTaskAttachments(task)
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 dark:text-gray-400"
                            } hover:bg-gray-100 dark:hover:bg-gray-700 relative cursor-pointer`}
                        >
                          <Icon
                            icon={
                              hasTaskAttachments(task)
                                ? "heroicons:paper-clip"
                                : "mdi:attachment"
                            }
                            className="w-3 h-3"
                          />
                          {hasTaskAttachments(task) && (
                            <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[8px] font-bold rounded-full w-3 h-3 flex items-center justify-center">
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
                      task?._id && (
                        <Tooltip
                          content={
                            task?.subtask_count ? `${task?.subtask_count} ${task?.subtask_count === 1 ? "Subtask" : "Subtasks"}` : "No Subtasks"
                          }
                          placement="top"
                          theme="custom-light"
                        >
                          <button
                            data-action="open-subtasks"
                            className={`p-1 rounded-full ${task?.subtask_count
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                              } hover:bg-gray-100 dark:hover:bg-gray-700 relative cursor-pointer`}
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

          {/* Time */}
          <td className="px-1 py-1 whitespace-nowrap w-[60px] text-center hidden md:table-cell">
            <Tooltip
              content={
                task.total_time && task.total_time !== "00:00:00"
                  ? `Time logged: ${task.total_time}${task.timer_type ? ` (${task.timer_type})` : ""
                  }`
                  : task.timeLogged && task.timeLogged > 0
                    ? `Time logged: ${formatTimeLogged(task.timeLogged)}`
                    : "No time logged yet"
              }
              placement="top"
              theme="custom-light"
            >
              <div
                data-action="open-time-logs"
                className="flex items-center justify-center cursor-pointer"
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
            </Tooltip>
          </td>

          {/* Assignee */}
          <td
            className="px-2 py-1 whitespace-nowrap w-[110px] relative hidden md:table-cell"
          /*   onClick={(e) => e.stopPropagation()} */

          >
            <div className="relative">
              <MultiUserAssignCell
                task={task}
                users={users}
                isTaskCompleted={task.taskPosition === "completed" || task.taskPosition === "Completed" || task.isComplete === true}
                updateExistingTask={async (updatedTask, field) => {
                  if (!canCreateTasks) return Promise.resolve(); // block for viewers
                  if (!updatedTask) return Promise.resolve();

                  try {
                    // For temporary/initial tasks, update local state and save if task has name
                    if (task.initial) {
                      // Update local state
                      dispatch({
                        type: 'sectionTasks/updateTaskInState',
                        payload: {
                          _id: task._id,
                          assigned_users: updatedTask.assigned_users,
                        }
                      });

                      // If task has a name, trigger save/create with updated assigned_users
                      if (task.taskName && task.taskName.trim() && onSaveTask) {
                        const currentTaskData = {
                          priority: task.priority,
                          dueDate: task.dueDate,
                          assigned_users: updatedTask.assigned_users, // Use the updated value
                          taskPosition: task.taskPosition,
                        };
                        await onSaveTask(task._id, task.taskName, currentTaskData);
                      }

                      return Promise.resolve();
                    }

                    // For existing tasks, call the API
                    await dispatch(updateTaskInSection({
                      taskId: task._id,
                      updates: {
                        assigned_users: updatedTask.assigned_users,
                      },
                      skipChangeDetection: true, // Force API call
                    })).unwrap();

                    // Return success promise
                    return Promise.resolve();
                  } catch (error) {
                    console.error("Error updating assignees:", error);
                    // Return error promise
                    return Promise.reject(error);
                  }
                }}
                index={0}
                disabled={!canCreateTasks}
                isPanelVisible={!canCreateTasks} // Only disable menu opening for viewers
              />
            </div>
          </td>

          {/* Due Date */}
          <td className="px-2 py-1 whitespace-nowrap w-[100px] text-left hidden md:table-cell">
            <div className="flex items-start">
              {editingField === "dueDate" ? (
                <div className="flex items-center">
                  <Flatpickr
                    ref={flatpickrRef}
                    className="w-full min-w-[80px] text-xs border border-blue-300 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={
                      editingField === "dueDate"
                        ? (editValues.dueDate ? new Date(editValues.dueDate) : null)
                        : (task.dueDate ? new Date(task.dueDate) : null)
                    }
                    onChange={(selectedDates) => {
                      if (!canCreateTasks) return;
                      if (selectedDates && selectedDates.length > 0) {
                        const d = selectedDates[0];
                        // Build YYYY-MM-DD from local date
                        const newDueDate = d.getFullYear() +
                          "-" + String(d.getMonth() + 1).padStart(2, "0") +
                          "-" + String(d.getDate()).padStart(2, "0");

                        handleInputChange("dueDate", newDueDate);
                        handleSave("dueDate", newDueDate);
                      } else {
                        handleInputChange("dueDate", null);
                        handleSave("dueDate", null);
                      }
                    }}
                    onValueUpdate={(selectedDates, dateStr) => {
                      if (!canCreateTasks) return;
                      // ✅ detect manual clear while typing
                      if (!dateStr || dateStr.trim() === "") {
                        handleInputChange("dueDate", null);
                        handleSave("dueDate", null);
                      }
                    }}
                    options={{
                      dateFormat: "d/m/Y",
                      allowInput: true,
                      clickOpens: true,
                      autoClose: true,
                      disableMobile: true,
                    }}
                    onOpen={() => {
                      document
                        .querySelector(".flatpickr-calendar")
                        ?.addEventListener("click", (e) => e.stopPropagation());
                    }}
                    onClose={(selectedDates, dateStr) => {
                      if (!canCreateTasks) return setEditingField(null);
                      // ✅ extra safeguard: when picker closes with empty input, save null
                      if (!dateStr || dateStr.trim() === "") {
                        handleInputChange("dueDate", null);
                        handleSave("dueDate", null);
                      }
                      setEditingField(null);
                    }}
                    disabled={!canCreateTasks}
                  />
                </div>
              ) : (
                <div
                  onClick={(e) => handleFieldClick("dueDate", e)}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded transition-colors min-h-[32px] flex items-center justify-center group"
                >
                  <div
                    className={`text-xs flex items-center ${task.dueDate &&
                      moment(task.dueDate).isBefore(moment().startOf("day"))
                      ? "text-red-500 dark:text-red-400 "
                      : "text-slate-700 dark:text-slate-300"
                      }`}
                  >
                    <span className="text-xs">
                      {task.dueDate
                        ? (() => {
                          const today = moment().startOf("day");
                          const taskDate = moment(task.dueDate).startOf("day");
                          const diffDays = taskDate.diff(today, "days");

                          if (diffDays === -1) return "Yesterday";
                          if (diffDays === 0) return "Today";
                          if (diffDays === 1) return "Tomorrow";

                          return moment(task.dueDate).format("DD/MM/YYYY");
                        })()
                        : "No Due Date"}
                    </span>
                    <Icon
                      icon="heroicons-outline:calendar"
                      className="ml-1 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              )}
            </div>
          </td>

          {/* Priority */}
          <td
            className="px-2 py-1 whitespace-nowrap w-[70px] hidden md:table-cell"
            onClick={(e) => {
              e.stopPropagation();
              if (!canCreateTasks) return;
              setEditingField(editingField === "priority" ? null : "priority");
            }}
          >
            <div className="flex items-center">
              {editingField !== "priority" ? (
                <div className="flex items-center cursor-pointer">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mr-1.5"
                    style={{
                      backgroundColor:
                        task.priority === "high"
                          ? "#DC3464"
                          : task.priority === "medium"
                            ? "#FFB800"
                            : task.priority === "low"
                              ? "#FF5F1F"
                              : "#BCBCBC",
                    }}
                  ></div>
                  <span className="text-gray-700 dark:text-slate-300 text-xs  truncate capitalize">
                    {(() => {
                      const priorityText = task.priority || "Low";
                      return priorityText.length > 3 ? priorityText.slice(0, 3) : priorityText;
                    })()}
                  </span>
                  <Icon
                    icon="heroicons-outline:chevron-down"
                    className="ml-1 w-3 h-3 text-gray-500"
                  />
                </div>
              ) : (
                <span>
                  <CustomDropdown
                    value={editValues.priority}
                    onChange={(newValue) => {
                      if (!canCreateTasks) return;
                      handleInputChange("priority", newValue);
                      handleSave("priority", newValue);
                    }}
                    options={priorityOptions}
                    disabled={isSubmitting || !canCreateTasks}
                    className="w-full"
                    onClose={() => setEditingField(null)}
                    isopen={true}
                    minimal={true}
                  />
                </span>
              )}
            </div>
          </td>

          {/* Status */}
          <td
            className="px-2 py-1 whitespace-nowrap w-[100px] hidden md:table-cell"
            onClick={(e) => {
              e.stopPropagation();
              if (!canCreateTasks) return;
              setEditingField(editingField === "status" ? null : "status");
            }}
          >
            <div className="flex items-center">
              {editingField !== "status" ? (
                <div className="flex items-center w-[100px] cursor-pointer">
                  {(() => {
                    const statusInfo = getStatusDisplayInfo(task.taskPosition);
                    return (
                      <>
                        <span
                          className="w-1.5 h-1.5 mr-1.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: statusInfo.color,
                          }}
                        ></span>
                        <span className="text-gray-700 dark:text-slate-300 text-xs font-medium truncate">
                          {statusInfo.name}
                        </span>
                      </>
                    );
                  })()}
                  <Icon
                    icon="heroicons-outline:chevron-down"
                    className="ml-1 w-3 h-3 text-gray-500"
                  />
                </div>
              ) : (
                <CustomDropdown
                  value={editValues.status}
                  onChange={(newValue) => {
                    if (!canCreateTasks) return;
                    handleInputChange("status", newValue);
                    handleSave("status", newValue);
                  }}
                  options={statusOptions}
                  disabled={isSubmitting || !canCreateTasks}
                  className="w-full"
                  onClose={() => setEditingField(null)}
                  isopen={true}
                  minimal={true}
                />
              )}
            </div>
          </td>

          {/* Task Opening Icon */}
          <td className="px-1 py-1 whitespace-nowrap w-[35px] text-center hidden md:table-cell">
            <div className="flex items-center justify-center">
              <Tooltip
                content={isOpen ? "Collapse task" : "View task details"}
                placement="top"
              >
                <button
                  data-action="toggle-task-panel"
                  className={`p-1 rounded-full ${isOpen
                    ? "text-blue-500 bg-blue-5 dark:bg-blue-900/30"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // We'll let handleRowClick handle the default tab
                    onRowClick && onRowClick(task);
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
      </>
    );
  },
), (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Always re-render during drag operations for smooth UX
  if (prevProps.isDragging || nextProps.isDragging) {
    return false; // Force re-render during drag
  }

  // Deep comparison for assigned_users array
  // assigned_users is an array of user IDs (numbers), not user objects
  const prevAssignedUsers = prevProps.task.assigned_users || [];
  const nextAssignedUsers = nextProps.task.assigned_users || [];
  const assignedUsersEqual = prevAssignedUsers.length === nextAssignedUsers.length &&
    prevAssignedUsers.every((userId, index) => userId === nextAssignedUsers[index]);

  // More strict comparison to prevent unnecessary re-renders
  const taskPropsEqual =
    prevProps.task._id === nextProps.task._id &&
    prevProps.task.taskName === nextProps.task.taskName &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.taskPosition === nextProps.task.taskPosition &&
    prevProps.task.isComplete === nextProps.task.isComplete &&
    assignedUsersEqual &&
    prevProps.task.total_comments === nextProps.task.total_comments &&
    prevProps.task.total_attached_files === nextProps.task.total_attached_files &&
    prevProps.task.timeLogged === nextProps.task.timeLogged &&
    prevProps.task.total_time === nextProps.task.total_time;

  // Add parent hierarchy comparison
  const parentHierarchyEqual =
    prevProps.task.parent === nextProps.task.parent &&
    JSON.stringify(prevProps.task.parent_hierarchy || []) === JSON.stringify(nextProps.task.parent_hierarchy || []);

  const uiPropsEqual =
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEven === nextProps.isEven &&
    prevProps.isOpen === nextProps.isOpen;

  // Compare projectStatus prop changes (important for status dropdown options)
  const projectStatusEqual = JSON.stringify(prevProps.projectStatus || []) === JSON.stringify(nextProps.projectStatus || []);

  // Compare projectMembers prop changes (important for assignee dropdown)
  const projectMembersEqual = JSON.stringify(prevProps.projectMembers || []) === JSON.stringify(nextProps.projectMembers || []);

  // Only re-render if task data, UI state, or project-related props actually changed
  return taskPropsEqual && uiPropsEqual && parentHierarchyEqual && projectStatusEqual && projectMembersEqual;
});

EditableTaskRow.displayName = "EditableTaskRow";

export default EditableTaskRow;
