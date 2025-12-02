import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTaskInState } from '../store/tasksSlice';

const TaskPrioritySelect = ({ task, updateExistingTask, initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const dropdownRef = useRef(null);
  const dispatch = useDispatch();

  // Define priority options
  const priorityOptions = [
    { value: "high", label: "High", color: "#DC3464" },
    { value: "medium", label: "Medium", color: "#FFB800" },
    { value: "low", label: "Low", color: "#FF5F1F" }
  ];

  // Get current priority
  const getCurrentPriority = () => {
    const priorityValue = task.priority?.toLowerCase() || "low";
    return priorityOptions.find(option => option.value === priorityValue) || priorityOptions[2]; // Default to low
  };

  const currentPriority = getCurrentPriority();

  // Handle priority change
  const handlePriorityChange = async (newPriority) => {
    if (newPriority.value === task.priority?.toLowerCase()) {
      setIsOpen(false);
      return;
    }

    // Create updated task object with the new priority
    const updatedTask = {
      ...task,
      priority: newPriority.value
    };

    // Close dropdown first for better UX
    setIsOpen(false);

    // Call updateExistingTask for both new and existing tasks
    // It handles the logic for creating new tasks or updating existing ones
    if (typeof updateExistingTask === 'function') {
      await updateExistingTask(updatedTask, "priority");
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center w-[80px] cursor-pointer"
        onClick={(e) => {
          e.stopPropagation(); // Stop event propagation to prevent row click
          setIsOpen(!isOpen);
        }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mr-1.5"
          style={{ backgroundColor: currentPriority.color }}
        ></div>
        <span className="text-gray-700 dark:text-slate-300 text-xs font-medium truncate capitalize">
          {currentPriority.label}
        </span>

      </div>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[999]">
          <div className="py-1 max-h-[150px] overflow-y-auto">
            {priorityOptions.map((priority) => (
              <div
                key={priority.value}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={(e) => {
                  e.stopPropagation(); // Stop event propagation
                  handlePriorityChange(priority);
                }}
              >
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: priority.color }}
                ></div>
                <span className="text-gray-700 dark:text-slate-300 text-xs font-medium capitalize">
                  {priority.label}
                </span>
                {priority.value === task.priority?.toLowerCase() && (
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

export default TaskPrioritySelect; 