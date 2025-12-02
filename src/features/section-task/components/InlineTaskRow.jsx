import React, { useState, useRef, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import { toast } from "react-toastify";
import { useSectionTasks } from "../hooks/useSectionTasks";
import MultiUserAssignCell from "@/components/dropdowns/MultiUserAssignCell";
import CustomDropdown from "./CustomDropdown";
import DueDateCell from "@/features/tasks/components/DueDateCell";
import moment from "moment";

const InlineTaskRow = ({ sectionId, onCancel, onComplete, onCreateNext, isEven, projectStatus = [], projectMembers = [] }) => {

  const dispatch = useDispatch();
  const { createTask } = useSectionTasks();
  const { users } = useSelector((state) => state.users || { users: [] });

  // Get the current section to access project status
  const { sections } = useSelector((state) => state.sectionTasks || { sections: [] });
  const currentSection = sections.find(section => section.id === sectionId);

  const [taskData, setTaskData] = useState({
    taskName: "",
    assignedUsers: [],
    priority: "low",
    dueDate: "",
    status: "not_started_yet",
  });

  const taskDataRef = useRef(taskData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const taskNameRef = useRef(null);
  const flatpickrRef = useRef(null);
  const rowRef = useRef(null);

  // Focus task name input on mount and when task is reset
  useEffect(() => {
    if (taskNameRef.current && !taskData.taskName) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        if (taskNameRef.current) {
          taskNameRef.current.focus();
        }
      }, 100);
    }
  }, [taskData.taskName]);

  useEffect(() => {
    taskDataRef.current = taskData;
  }, [taskData]);

  // Handle click inside row to save task (except on input and interactive elements)
  useEffect(() => {
    const handleRowClick = (event) => {
      if (!rowRef.current) return;

      // Check if click is inside the row
      if (rowRef.current.contains(event.target)) {
        // Don't save if clicking on the input field itself
        if (taskNameRef.current && taskNameRef.current.contains(event.target)) {
          return;
        }

        // Don't save if clicking on interactive elements (dropdowns, buttons, etc.)
        const interactiveElements = event.target.closest('button, select, [role="button"], [data-dropdown], .dropdown, .custom-dropdown, td.status-cell, td.priority-cell');
        if (interactiveElements) {
          return;
        }

        // Don't save if clicking on assignee or due date cells (they have their own interactions)
        const assigneeCell = event.target.closest('[data-assignee-cell]');
        const dueDateCell = event.target.closest('[data-due-date-cell]');
        if (assigneeCell || dueDateCell) {
          return;
        }

        // Save task if we have a task name and not currently submitting
        if (taskData.taskName.trim() && !isSubmitting) {
          handleSaveTask();
        }
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleRowClick);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleRowClick);
    };
  }, [taskData.taskName, isSubmitting]);

  // New outside-row click handler (add this)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rowRef.current) return;

      const clickedOutsideRow = !rowRef.current.contains(event.target);

      const interactiveElements = event.target.closest('button, select, [role="button"], [data-dropdown], .dropdown, .custom-dropdown, .flatpickr-calendar, .flatpickr-day.selected, .dropdown-options, td.status-cell, td.priority-cell ');
      if (interactiveElements) {
        return;
      }
      if (clickedOutsideRow) {
        if (taskDataRef.current.taskName.trim() && !isSubmitting) {
          handleSaveTask();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSubmitting]);

  // Priority options
  const priorityOptions = [
    { value: "low", label: "Low", color: "#FF5F1F" },
    { value: "medium", label: "Medium", color: "#F59E0B" },
    { value: "high", label: "High", color: "#DC3464" },
  ];

  // Dynamic status options from projectStatus prop
  const statusOptions = projectStatus && projectStatus.length > 0
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

  // Helper function to get status display info
  const getStatusDisplayInfo = (taskPosition) => {
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
  };

  // Create a temporary task object for MultiUserAssignCell - memoized to prevent unnecessary re-renders
  const tempTask = useMemo(() => ({
    _id: "temp-inline-task",
    assigned_users: taskData.assignedUsers,
  }), [taskData.assignedUsers]);

  const handleInputChange = (field, value) => {
    setTaskData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveTask = async (createNext = false) => {
    const currentTaskData = taskDataRef.current;
    if (!currentTaskData.taskName.trim()) {
      return;
    }

    if (currentTaskData.taskName.trim().length > 200) {
      toast.error("Task name is too long (maximum 200 characters)");
      return;
    }

    setIsSubmitting(true);

    try {
      const newTaskData = {
        taskName: currentTaskData.taskName.trim(),
        description: "",
        priority: currentTaskData.priority,
        dueDate: currentTaskData.dueDate || null,
        assigned_users: currentTaskData.assignedUsers,
        assign_name:
          currentTaskData.assignedUsers.length > 0
            ? (() => {
              const user = users.find(
                (u) => u._id === currentTaskData.assignedUsers[0],
              );
              return (
                user?.name ||
                `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                user?.email ||
                "Unknown User"
              );
            })()
            : "",
        user_name:
          currentTaskData.assignedUsers.length > 0
            ? (() => {
              const user = users.find(
                (u) => u._id === currentTaskData.assignedUsers[0],
              );
              return (
                user?.name ||
                `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                user?.email ||
                "Unknown User"
              );
            })()
            : "",
        client_name: "",
        taskPosition: currentTaskData.status,
        orderInSection: 0, // This will place it at the top
      };

      const success = await createTask(sectionId, newTaskData);
      if (!success) {
        toast.error("Failed to create task. Please try again.");
        setIsSubmitting(false);
        return;
      }



      // Reset form for next task
      setTaskData({
        taskName: "",
        assignedUsers: [],
        priority: "low",
        dueDate: "",
        status: "not_started_yet",
      });



      if (createNext && onCreateNext) {

        onCreateNext();
      } else if (onComplete) {

        onComplete();
      } else {
        console.log("🔥 LOG 11: No callback available!");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(
        error.message || "An unexpected error occurred while creating the task",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      // Save task and create new row on Enter key
      if (taskData.taskName.trim() && !isSubmitting) {

        handleSaveTask(true); // true = create next task row
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  };

  return (
    <tr ref={rowRef} className="bg-blue-50/50 dark:bg-blue-900/10 hover:bg-slate-100 dark:hover:bg-slate-700/30">
      {/* Checkbox */}
      <td className="px-1 py-1 whitespace-nowrap w-6 hidden md:table-cell">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3 h-3"
            disabled
          />
        </div>
      </td>

      {/* Task ID Column */}
      <td className="pl-1 pr-1 py-1 whitespace-nowrap w-20">
        <div className="flex items-center space-x-1">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
            New
          </div>
        </div>
      </td>

      {/* Task Name Column */}
      <td className="pl-2 pr-2 py-1">
        <div className="flex items-center w-full relative group">
          <div className="min-w-[28px] mr-1.5 flex justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 min-w-[300px] flex-1 text-sm text-slate-600 dark:text-slate-300 pr-2">
            <input
              ref={taskNameRef}
              type="text"
              value={taskData.taskName}
              onChange={(e) => handleInputChange("taskName", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a task name..."
              className="w-full bg-transparent border-none outline-none text-xs font-medium text-[#000000] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none"
              disabled={isSubmitting}
            />

            {/* Mobile Save Icon */}
            <div className="md:hidden ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveTask();
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Save task"
                disabled={isSubmitting}
              >
                <Icon
                  icon="heroicons:check"
                  className="w-4 h-4 text-green-500 dark:text-green-400"
                />
              </button>
            </div>
          </div>
          {isSubmitting && (
            <div className="flex items-center space-x-1 ml-2">
              <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Saving...
              </span>
            </div>
          )}
        </div>
      </td>

      {/* Time Column */}
      <td className="px-1 py-1 whitespace-nowrap w-[60px] text-center hidden md:table-cell">
        <div className="flex items-center justify-center">
          <Icon
            icon="gravity-ui:clock-fill"
            width="12"
            height="12"
            className="text-gray-300"
          />
        </div>
      </td>

      {/* Assignee Column */}
      <td
        data-assignee-cell
        className="px-2 py-1 whitespace-nowrap w-[110px] relative hidden md:table-cell"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {users && users.length > 0 ? (
            <MultiUserAssignCell
              task={tempTask}
              users={projectMembers?.length > 0 ? projectMembers : users}
              isTaskCompleted={false}
              updateExistingTask={(updatedTask) => {
                if (updatedTask && updatedTask.assigned_users) {
                  const newAssignedUsers = updatedTask.assigned_users || [];
                  handleInputChange("assignedUsers", newAssignedUsers);

                  // Force immediate update of taskDataRef to prevent stale state
                  setTaskData(prev => {
                    const updated = { ...prev, assignedUsers: newAssignedUsers };
                    taskDataRef.current = updated;
                    return updated;
                  });
                }
              }}
              index={0}
            />
          ) : (
            <div className="text-xs text-slate-700 dark:text-slate-300 p-1">
              No users
            </div>
          )}
        </div>
      </td>

      {/* Due Date Column */}
      <td data-due-date-cell className="px-2 py-1 whitespace-nowrap w-[100px] text-left hidden md:table-cell">
        <DueDateCell
          task={{
            _id: "temp-inline-task",
            dueDate: taskData.dueDate || null,
          }}
          updateExistingTask={(updatedTask, field) => {
            if (field === "dueDate") {
              let formattedDate = "";
              if (updatedTask.dueDate) {
                const date = new Date(updatedTask.dueDate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                formattedDate = `${year}-${month}-${day}`;
              }
              handleInputChange("dueDate", formattedDate);
            }
          }}
          interpretDate={(date) => {
            if (!date) return "No Due Date";
            const today = moment().startOf("day");
            const taskDate = moment(date).startOf("day");
            const diffDays = taskDate.diff(today, "days");

            if (diffDays === -1) return "Yesterday";
            if (diffDays === 0) return "Today";
            if (diffDays === 1) return "Tomorrow";

            return moment(date).format("DD-MM-YYYY");
          }}
        />
      </td>

      {/* Priority Column */}
      <td
        className="px-2 py-1 whitespace-nowrap w-[70px] hidden md:table-cell priority-cell"
        onClick={(e) => {
          e.stopPropagation();
          setOpenDropdown(openDropdown === "priority" ? null : "priority");
        }}
      >
        <div className="flex items-center">
          {openDropdown !== "priority" ? (
            <div className="flex items-center cursor-pointer">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mr-1.5"
                style={{
                  backgroundColor:
                    taskData.priority === "high"
                      ? "#DC3464"
                      : taskData.priority === "medium"
                        ? "#FFB800"
                        : taskData.priority === "low"
                          ? "#FF5F1F"
                          : "#BCBCBC",
                }}
              ></div>
              <span className="text-gray-700 dark:text-slate-300 text-xs font-medium truncate capitalize">
                {taskData.priority || "Low"}
              </span>
              <Icon
                icon="heroicons-outline:chevron-down"
                className="ml-1 w-3 h-3 text-gray-500"
              />
            </div>
          ) : (
            <CustomDropdown
              value={taskData.priority}
              onChange={(value) => {
                handleInputChange("priority", value);
                setOpenDropdown(null);
              }}
              options={priorityOptions}
              disabled={isSubmitting}
              className="w-full"
              onClose={() => setOpenDropdown(null)}
              isopen={true}
              minimal={true}
            />
          )}
        </div>
      </td>

      {/* Status Column */}
      <td
        className="px-2 py-1 whitespace-nowrap w-[100px] hidden md:table-cell status-cell"
        onClick={(e) => {
          e.stopPropagation();
          setOpenDropdown(openDropdown === "status" ? null : "status");
        }}
      >
        <div className="flex items-center">
          {openDropdown !== "status" ? (
            <div className="flex items-center w-[100px] cursor-pointer">
              {(() => {
                const statusInfo = getStatusDisplayInfo(taskData.status);
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
              value={taskData.status}
              onChange={(value) => {
                handleInputChange("status", value);
                setOpenDropdown(null);
              }}
              options={statusOptions}
              disabled={isSubmitting}
              className="w-full"
              onClose={() => setOpenDropdown(null)}
              isopen={true}
              minimal={true}
            />
          )}
        </div>
      </td>

      {/* Task Opening Icon - Placeholder for table structure consistency */}
      <td className="px-1 py-1 whitespace-nowrap w-[35px] text-center hidden md:table-cell">
        <div className="flex items-center justify-center">
          <div className="p-1 rounded-full text-gray-300 dark:text-gray-600 cursor-not-allowed">
            <Icon icon="mdi:chevron-right" className="w-3.5 h-3.5" />
          </div>
        </div>
      </td>
    </tr>
  );
};

export default InlineTaskRow;
