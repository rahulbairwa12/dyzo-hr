import React, { useState, useEffect, useRef, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import moment from "moment";
import Tooltip from "@/components/ui/Tooltip";
import MultiUserAssignCell from "@/components/dropdowns/MultiUserAssignCell";
import ProjectSelect from "@/components/dropdowns/ProjectSelect";
import FrequencyDropdown from "./FrequencyDropdown";
import FileUpload from "@/components/Task/FileUpload";
import {
  updateRecurringTaskInState,
  createRecurringTask,
  toggleRecurringTaskSelection,
  syncRecurringTaskUpdate,
  deleteRecurringTask,
} from "../store/tasksSlice";
import { fetchAuthPost } from "@/store/api/apiSlice";
import Select from "react-select";
import Flatpickr from "react-flatpickr";
import flatpickr from "flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

// Format frequency for display
const formatFrequency = (frequency, interval) => {
  if (!frequency) return "One-time";

  const intervalStr = interval > 1 ? `Every ${interval} ` : "";

  switch (frequency.toLowerCase()) {
    case "daily":
      return `${intervalStr}Daily`;
    case "weekly":
      return `${intervalStr}Weekly`;
    case "monthly":
      return `${intervalStr}Monthly`;
    case "sunday":
      return `${intervalStr}Sunday`;
    case "monday":
      return `${intervalStr}Monday`;
    case "tuesday":
      return `${intervalStr}Tuesday`;
    case "wednesday":
      return `${intervalStr}Wednesday`;
    case "thursday":
      return `${intervalStr}Thursday`;
    case "friday":
      return `${intervalStr}Friday`;
    case "saturday":
      return `${intervalStr}Saturday`;
    default:
      return frequency;
  }
};

// Available interval options
const intervalOptions = Array.from({ length: 30 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

const RecurringTaskRow = memo(function RecurringTaskRow({
  task,
  index,
  isEven,
  selectedTasks,
  editingTaskId,
  inputRefs,
  loading,
  users,
  projects,
  getProjectNameFromId,
  dispatch,
  onRowClick,
  handleContextMenu,
}) {
  const [isSelected, setIsSelected] = useState(false);
  const [editingStartDateId, setEditingStartDateId] = useState(null);
  const [editingEndDateId, setEditingEndDateId] = useState(null);
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);
  const [frequencyValue, setFrequencyValue] = useState(task.frequency);
  const [intervalValue, setIntervalValue] = useState(task.interval);
  const [startDate, setStartDate] = useState(task.start_date);
  const [endDate, setEndDate] = useState(task.end_date);
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  // Add state to track file upload status
  const [isUploading, setIsUploading] = useState(false);

  const { user: userInfo } = useSelector((state) => state.auth);
  const { emptyTaskWarning } = useSelector((state) => state.tasks);
  // Add Redux state for panel visibility and selected task (same as in TaskTable)
  const { isPanelVisible, selectedTask } = useSelector((state) => state.tasks);

  // Refs for debouncing operations
  const taskNameTimeoutRef = useRef(null); // for update debounce
  const createTimeoutRef = useRef(null); // for create debounce
  const createTriggeredRef = useRef(false);
  const endDateTimeoutRef = useRef(null); // for debounced end date update

  // Helper functions
  const getProjectName = (projectId) => {
    if (!projectId) return "No Project";
    const project = projects.find((p) => String(p._id) === String(projectId));
    return project ? project.name : "Unknown Project";
  };

  const replaceNoProject = (value) => {
    return value === "No Project" ? "Untitled Project" : value;
  };

  // Get project name for this task
  const projectName = replaceNoProject(
    getProjectNameFromId
      ? getProjectNameFromId(task.projectId)
      : getProjectName(task.projectId)
  );

  // Handle task selection
  const handleTaskSelection = (e) => {
    e.stopPropagation();
    dispatch(toggleRecurringTaskSelection(task._id || task.id));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const today = moment().format("YYYY-MM-DD");

    return moment(dateString).format("DD/MM/YYYY");
  };

  useEffect(() => {
    setFrequencyValue(task.frequency);
    setIntervalValue(task.interval);
    setStartDate(task.start_date);
    setEndDate(task.end_date);
  }, [task]);

  // Handle saving a new recurring task
  const handleSaveTask = () => {
    // If a debounced create call is pending, cancel it


    if (task.taskName === "") {
      toast.error("Task name is required");
      return;
    }

    if (createTimeoutRef.current) {
      clearTimeout(createTimeoutRef.current);
      createTimeoutRef.current = null;
    }
    createTriggeredRef.current = true; // prevent timer from scheduling again

    if (task.initial || String(task._id).startsWith("new-recurring-")) {
      const payload = {
        _id: task._id,
        taskName: task.taskName,
        start_date: startDate,
        end_date: endDate,
        frequency: frequencyValue,
        interval: intervalValue,
        company: userInfo.companyId, // Make sure company ID is set correctly
        assigned_users: task.assigned_users || [],
        project: projectId || task.projectId,
        description: task.description || "",
        attachments: task.attachments || [], // Include attachments
        userInfo: userInfo // Include userInfo which is required by the action
      };

      dispatch(createRecurringTask(payload));
    }
  };

  // Input change handlers
  const handleInputChange = (e) => {
    const newName = e.target.value;

    const updateData = {
      _id: task._id || task.id,
      id: task.id,
      taskName: newName,
    };

    const isNewTemp =
      task.initial || String(task._id || task.id).startsWith("new-recurring-");

    if (isNewTemp) {
      // update local state immediately so UI reflects typing
      dispatch(updateRecurringTaskInState(updateData));

      // debounce creation call
      // if (createTimeoutRef.current) {
      //   clearTimeout(createTimeoutRef.current);
      // }

      // if (!createTriggeredRef.current && newName.trim() !== "") {
      //   createTimeoutRef.current = setTimeout(() => {
      //     if (createTriggeredRef.current) return;

      //     const payload = {
      //       _id: task._id || task.id,
      //       taskName: newName.trim(),
      //       start_date: startDate,
      //       end_date: endDate,
      //       frequency: frequencyValue,
      //       interval: intervalValue,
      //       company: task.company,
      //       assigned_users: task.assigned_users,
      //       project: task.projectId,
      //       description: task.description || "",
      //       userInfo,
      //     };

      //     dispatch(createRecurringTask(payload));
      //     createTriggeredRef.current = true;
      //   }, 3000);
      // }

      return;
    }

    // Existing tasks: debounce the server sync to reduce calls
    if (taskNameTimeoutRef.current) {
      clearTimeout(taskNameTimeoutRef.current);
    }

    taskNameTimeoutRef.current = setTimeout(() => {
      dispatch(syncRecurringTaskUpdate(updateData));
    }, 300);
  };
  const handleFrequencyChange = (value) => {
    // Update in Redux
    dispatch(
      syncRecurringTaskUpdate({
        _id: task._id || task.id,
        id: task.id,
        frequency: value,
      })
    );
  };

  // Auto-open calendar when editing start date
  useEffect(() => {
    if (
      editingStartDateId === task.id &&
      startDatePickerRef.current?.flatpickr
    ) {
      setTimeout(() => {
        startDatePickerRef.current.flatpickr.open();
      }, 10);
    }
  }, [editingStartDateId, task.id]);

  // Auto-open calendar when editing end date
  useEffect(() => {
    if (editingEndDateId === task._id && endDatePickerRef.current?.flatpickr) {
      setTimeout(() => {
        endDatePickerRef.current.flatpickr.open();
      }, 10);
    }
  }, [editingEndDateId, task._id]);

  // Update both handlers to match DueDateCell pattern
  const handleStartDateChange = (selectedDates) => {
    if (selectedDates && selectedDates.length > 0) {
      const formattedDate = moment(selectedDates[0]).format("YYYY-MM-DD");
      setStartDate(formattedDate);

      // Debounce the end date update if start date crosses end date
      if (endDateTimeoutRef.current) {
        clearTimeout(endDateTimeoutRef.current);
      }

      if (!endDate || moment(formattedDate).isAfter(moment(endDate))) {
        endDateTimeoutRef.current = setTimeout(() => {
          // Check again after debounce
          if (!endDate || moment(formattedDate).isAfter(moment(endDate))) {
            const newEndDate = moment(formattedDate).add(1, 'month').format("YYYY-MM-DD");
            setEndDate(newEndDate);
            // Update state/server for end date
            if (task.initial || String(task._id || task.id).startsWith("new-recurring-")) {
              dispatch(updateRecurringTaskInState({
                _id: task._id || task.id,
                id: task.id,
                end_date: newEndDate,
              }));
            } else {
              dispatch(syncRecurringTaskUpdate({
                _id: task._id || task.id,
                id: task.id,
                end_date: newEndDate,
              }));
            }
          }
        }, 500);
      }

      const updateData = {
        _id: task._id || task.id,
        id: task.id,
        start_date: formattedDate,
      };

      // For new tasks, just update the state
      if (
        task.initial ||
        String(task._id || task.id).startsWith("new-recurring-")
      ) {
        dispatch(updateRecurringTaskInState(updateData));
      } else {
        // For existing tasks, sync with server
        dispatch(syncRecurringTaskUpdate(updateData));
      }
    }

    setEditingStartDateId(null);
  };

  const handleEndDateChange = (selectedDates) => {
    if (selectedDates && selectedDates.length > 0) {
      const formattedDate = moment(selectedDates[0]).format("YYYY-MM-DD");
      setEndDate(formattedDate);

      const updateData = {
        _id: task._id || task.id,
        id: task.id,
        end_date: formattedDate,
      };

      // For new tasks, just update the state
      if (
        task.initial ||
        String(task._id || task.id).startsWith("new-recurring-")
      ) {
        dispatch(updateRecurringTaskInState(updateData));
      } else {
        // For existing tasks, sync with server
        dispatch(syncRecurringTaskUpdate(updateData));
      }
    }

    setEditingEndDateId(null);
  };

  const handleStartDateCellClick = (e) => {
    e.stopPropagation();
    setEditingStartDateId(task.id);
  };

  const handleEndDateCellClick = (e) => {
    e.stopPropagation();
    setEditingEndDateId(task._id);
  };

  // Focus on input when in editing mode
  useEffect(() => {
    if (
      (task.initial || editingTaskId === task._id) &&
      inputRefs.current[task._id]
    ) {
      inputRefs.current[task._id].focus();
    }
  }, [task._id, task.initial, editingTaskId, inputRefs]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (taskNameTimeoutRef.current) clearTimeout(taskNameTimeoutRef.current);
      if (createTimeoutRef.current) clearTimeout(createTimeoutRef.current);
      if (endDateTimeoutRef.current) clearTimeout(endDateTimeoutRef.current);
    };
  }, []);

  return (
    <tr
      id={`recurring-task-row-${task._id}`}
      className={`hover:bg-slate-100 dark:hover:bg-slate-700/30 group ${isEven ? "bg-white dark:bg-slate-800" : "bg-white dark:bg-slate-800/50"
        } ${isSelected
          ? "bg-dededed border-e1e1e1 dark:bg-blue-700/30"
          : ""
        } ${emptyTaskWarning && task.isNewTask && (!task.taskName || task.taskName.trim() === "")
          ? "border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10"
          : ""
        } 
        // Updated to match TaskTable.jsx colors exactly
        ${isPanelVisible &&
          selectedTask &&
          (selectedTask._id === task._id || selectedTask.id === task.id)
          ? "bg-dededed border-e1e1e1 dark:bg-blue-700/30 transition-colors duration-2000"
          : ""
        }
        // Add same styling for checkbox-selected tasks (matching TaskTable.jsx)
        ${selectedTasks.includes(task._id || task.id)
          ? "bg-dededed dark:bg-blue-700/30 border-l-4 border-e1e1e1"
          : ""
        }`}
      onClick={(e) => {
        e.stopPropagation();
        // Make sure onRowClick is called with the task object
        if (typeof onRowClick === "function") {
          onRowClick(task);
        }
      }}
      onContextMenu={(e) => handleContextMenu(e, task)}
    >
      {/* Checkbox */}
      <td className="px-1 py-1 whitespace-nowrap w-8">
        <div
          className="flex items-center"
          onClick={(e) => {
            e.stopPropagation();
            handleTaskSelection(e);
          }}
        >
          <input
            type="checkbox"
            className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3 h-3"
            checked={selectedTasks.includes(task._id || task.id)}
            onChange={() => { }} // Handled by the parent div's onClick
          />
        </div>
      </td>

      {/* Task ID */}
      <td className="px-1 py-1 whitespace-nowrap w-12">
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {task.id && !String(task.id).startsWith("new-recurring-")
            ? task.id
            : ""}
        </div>
      </td>

      {/* Task Name */}
      <td className="px-2 py-1 min-w-[180px]">
        <div className="flex items-center w-full relative group">
          <div className="flex flex-1 items-center overflow-visible relative">
            {editingTaskId === task._id || task.initial ? (
              <div className="flex-1 relative">
                <div className="flex items-center gap-1">
                  <textarea
                    ref={(el) => {
                      inputRefs.current[task._id] = el;
                      if (el) {
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }
                    }}
                    rows="1"
                    className={`border text-sm flex-1 w-full rounded px-2 py-1 resize-none task-name-textarea ${loading ? "blinking-border" : ""
                      } text-gray-900 dark:text-white`}
                    defaultValue={task.taskName || ""}
                    placeholder="Enter your task name"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onChange={handleInputChange}
                    style={{
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div
                className="text-xs w-full px-2 py-1 cursor-pointer whitespace-normal break-words text-gray-900 dark:text-white"
                title={task.taskName}
              >
                <div className="flex items-center w-full overflow-hidden pr-2">
                  <span className="text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis task-name-display text-[#000000] dark:text-white">
                    {task.taskName && task.taskName.length > 50
                      ? task.taskName.substring(0, 50) + "..."
                      : task.taskName}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Project Column */}
      <td className="px-2 py-1 whitespace-nowrap w-[120px]" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-[100px]">
          <ProjectSelect
            task={task}
            index={index}
            projects={projects}
            updateExistingTask={(updatedTask, field) => {
              if (task.initial || String(task._id).startsWith("new-recurring-")) {
                dispatch(updateRecurringTaskInState(updatedTask));
              } else {
                dispatch(syncRecurringTaskUpdate(updatedTask));
              }
            }}
            setProjectStatuses={() => { }}
            setIsAddProject={() => { }}
          />
        </div>
      </td>

      {/* Attachments */}
      <td className="px-1 py-1 pl-7 whitespace-nowrap w-[80px]">
        <div className="flex items-center" >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <FileUpload
              taskId={task}
              index={index}
              from="taskpanelTop"
              task={task}
              isRecurring={true}
              setIsUploading={setIsUploading}
              updateAttachments={(newAttachments) => {
                if (!newAttachments) return;
                dispatch(updateRecurringTaskInState({
                  _id: task._id || task.id,
                  id: task.id,
                  attachments: newAttachments
                }));
                setIsUploading(false);
              }}
            />
            {task.attachments && task.attachments.length > 0 && (
              <div className="absolute -top-1 -right-2 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center cursor-pointer" onClick={(e) => {
                e.stopPropagation();
                onRowClick(task);
              }}>
                {task.attachments.length}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Frequency */}
      <td className="px-1 py-1 whitespace-nowrap w-[90px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center">
          <div className="flex-1">
            <FrequencyDropdown
              value={frequencyValue}
              onChange={(value) => {
                handleFrequencyChange(value);
              }}
              disabled={false}
              className="w-full h-[28px]"
            />
          </div>
        </div>
      </td>

      {/* Assignees */}
      <td className="px-2 py-1 pl-4 whitespace-nowrap w-[140px]">
        <MultiUserAssignCell
          task={task}
          users={users}
          isTaskCompleted={false}
          updateExistingTask={(updatedTask) => {
            if (task.initial || String(task._id).startsWith("new-recurring-")) {
              dispatch(updateRecurringTaskInState(updatedTask));
            } else {
              dispatch(syncRecurringTaskUpdate(updatedTask));
            }
          }}
          index={index}
        />
      </td>

      {/* Start Date */}
      <td className="px-1 py-1 whitespace-nowrap w-[90px] cursor-pointer group" onClick={handleStartDateCellClick}>
        <div className="flex items-center">
          {editingStartDateId === task.id ? (
            <div className="relative z-10">
              <Flatpickr
                ref={startDatePickerRef}
                className="w-full min-w-[85px] text-xs border border-blue-300 rounded-md py-1 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 hide-caret"
                value={startDate ? new Date(startDate) : ""}
                onChange={handleStartDateChange}
                options={{
                  dateFormat: "d-m-Y",
                  altInput: true,
                  altFormat: "d/m/Y",
                  allowInput: true,
                  clickOpens: true,
                  autoClose: true,
                  disableMobile: true,
                  minDate: "today",
                  //maxDate: endDate ? new Date(endDate) : undefined,
                  onClose: () => setEditingStartDateId(null),
                }}
                readOnly={true}
              />
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                {formatDate(task.start_date)}
              </span>
              <Icon
                icon="heroicons-outline:calendar"
                className="ml-1 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100"
              />
            </div>
          )}
        </div>
      </td>

      {/* End Date */}
      <td className="px-1 py-1 whitespace-nowrap w-[90px] cursor-pointer group" onClick={handleEndDateCellClick}>
        <div className="flex items-center">
          {editingEndDateId === task._id ? (
            <div className="relative z-10">
              <Flatpickr
                ref={endDatePickerRef}
                className="w-full min-w-[85px] text-xs border border-blue-300 rounded-md py-1 px-1 focus:outline-none focus:ring-1 focus:ring-blue-500 hide-caret"
                value={endDate ? new Date(endDate) : ""}
                onChange={handleEndDateChange}
                options={{
                  dateFormat: "d-m-Y",
                  altInput: true,
                  altFormat: "d/m/Y",
                  allowInput: true,
                  clickOpens: true,
                  autoClose: true,
                  disableMobile: true,
                  minDate: startDate ? new Date(startDate) : undefined,
                  onClose: () => setEditingEndDateId(null),
                }}
                readOnly={true}
              />
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                {formatDate(task.end_date)}
              </span>
              <Icon
                icon="heroicons-outline:calendar"
                className="ml-1 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100"
              />
            </div>
          )}
        </div>
      </td>

      {/* Status Column */}
      <td className="px-1 py-1 whitespace-nowrap w-[80px]">
        <div className="flex items-center">
          <div
            className={`px-2 py-1 text-xs font-medium rounded-full ${task.is_active
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}
          >
            {task.is_active ? "Active" : "Inactive"}
          </div>
        </div>
      </td>

      {/* Action Button */}
      <td className="px-1 py-1 whitespace-nowrap w-[35px] text-center">
        <div className="flex items-center justify-center">
          {task.initial || String(task._id).startsWith("new-recurring-") ? (
            <Tooltip content="Save task" placement="top" theme="custom-light">
              <button
                className={`w-full px-2 py-1 rounded-lg text-white ${isUploading ? 'bg-purple-400 cursor-not-allowed' : 'bg-[#7A39FF] hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700'} font-medium transition-colors text-xs`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isUploading) {
                    handleSaveTask();
                  }
                }}
                disabled={isUploading}
              >
                {isUploading ? '...' : 'Save'}
              </button>
            </Tooltip>
          ) : (
            <Tooltip content="View task details" placement="top" theme="custom-light">
              <button
                className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick(task);
                }}
              >
                <Icon icon="mdi:chevron-right" className="w-3 h-3" />
              </button>
            </Tooltip>
          )}
        </div>
      </td>
    </tr>
  );
});

export default RecurringTaskRow;
