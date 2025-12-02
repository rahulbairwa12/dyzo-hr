import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";
import { updateTaskInState } from "../store/tasksSlice";
import { fetchAuthFilePut } from "@/store/api/apiSlice";
import { djangoBaseURL } from "@/helper";
import Tooltip from "@/components/ui/Tooltip";
import confetti from "canvas-confetti";

const TaskStatusSelect = ({ task, updateExistingTask, initialOpen = false }) => {
  const [status, setStatusOptions] = useState([]);
  useEffect(() => {
    setStatusOptions(task?.project_status || []);
  }, [task]);

  const [isOpen, setIsOpen] = useState(initialOpen);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.auth.user);

  // Determine the status options
  const getStatusOptions = () => {
    // Use task's project_status if available
    if (status && status.length > 0) {
      return status.map((status) => ({
        value: status.value,
        label: status.name,
        color: status.color,
        id: status.id,
      }));
    }

    // Default status options if project_status is not available
    return [
      { value: "not_started_yet", label: "Not Started Yet", color: "#DC3464" },
      { value: "in_progress", label: "In Progress", color: "#3092F5" },
      { value: "pending", label: "Pending", color: "#BCBCBC" },
      { value: "completed", label: "Completed", color: "#30F558" },
    ];
  };

  const statusOptions = getStatusOptions();

  // Find current status info
  const getCurrentStatusInfo = () => {
    // Default status if task has no taskPosition
    if (!task.taskPosition) {
      return {
        value: "not_started_yet",
        label: "Not Started Yet",
        color: "#DC3464"
      };
    }

    // First try to match by value
    let matchedStatus = statusOptions.find(
      (status) => status.value === task.taskPosition
    );

    // If not found, try to match by name (case insensitive)
    if (!matchedStatus) {
      matchedStatus = statusOptions.find(
        (status) =>
          status.label.toLowerCase() === task.taskPosition.toLowerCase()
      );
    }

    // If still not found, try to match similar values
    if (!matchedStatus) {
      // Handle "In progress" vs "in_progress"
      if (task.taskPosition.toLowerCase() === "in progress") {
        matchedStatus = statusOptions.find(
          (status) =>
            status.value === "in_progress" ||
            status.label.toLowerCase() === "in progress"
        );
      }
      // Handle "Not Started Yet" vs "not_started_yet"
      else if (task.taskPosition.toLowerCase() === "not started yet") {
        matchedStatus = statusOptions.find(
          (status) =>
            status.value === "not_started_yet" ||
            status.label.toLowerCase() === "not started yet"
        );
      }
      // Handle other common variations
      else {
        const normalizedPosition = task.taskPosition
          .toLowerCase()
          .replace(/ /g, "_");
        matchedStatus = statusOptions.find(
          (status) => status.value === normalizedPosition
        );
      }
    }

    // If we still can't find a match, use the first option or default
    if (!matchedStatus && statusOptions.length > 0) {
      matchedStatus = statusOptions[0];
    } else if (!matchedStatus) {
      matchedStatus = {
        value: "pending",
        label: task.taskPosition || "Pending",
        color: "#BCBCBC",
      };
    }

    return matchedStatus;
  };

  const currentStatus = getCurrentStatusInfo();

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (newStatus.value === task.taskPosition) {
      setIsOpen(false);
      return;
    }

    if (newStatus.value === "completed") {
      confetti({
        particleCount: 300,
        spread: 90,
        origin: { y: 0.5 },
        colors: ["#0F6FFF", "#A026FF", "#6d42f8", "#9333ea"],
        disableForReducedMotion: true,
      });
    }

    // Create updated task object with the new status
    const updatedTask = {
      ...task,
      taskPosition: newStatus.value,
    };

    // Close dropdown first for better UX
    setIsOpen(false);

    // Call updateExistingTask for both new and existing tasks
    // It handles the logic for creating new tasks or updating existing ones
    if (typeof updateExistingTask === "function") {
      await updateExistingTask(updatedTask, "taskPosition");
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center w-[120px] cursor-pointer"
        onClick={(e) => {
          e.stopPropagation(); // Stop event propagation to prevent row click
          setIsOpen(!isOpen);
        }}
      >
        <span
          className="w-1.5 h-1.5 mr-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: currentStatus.color }}
        ></span>
        <span className="text-gray-700 dark:text-slate-300 text-xs font-medium truncate">
          {currentStatus.label}
        </span>
        <Icon
          icon="heroicons-outline:chevron-down"
          className="ml-1 w-3 h-3 text-gray-500 ms-auto"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[999]">
          <div className="py-1 max-h-[200px] overflow-y-auto">
            {statusOptions.map((status) => (
              <div
                key={status.value}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={(e) => {
                  e.stopPropagation(); // Stop event propagation
                  handleStatusChange(status);
                }}
              >
                <span
                  className="w-2 h-2 mr-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                ></span>
                <span className="text-gray-700 dark:text-slate-300 text-xs font-medium">
                  {status.label}
                </span>
                {status.value === task.taskPosition && (
                  <Icon
                    icon="heroicons-solid:check"
                    className="ml-auto w-4 h-4 text-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStatusSelect;
