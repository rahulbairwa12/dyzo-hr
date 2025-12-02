import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import { toggleTaskStatus } from '../store/tasksSlice';
import { fetchTaskStatuses } from '../store/taskStatusSlice';

// Fallback options in case the API data isn't available
const fallbackStatusOptions = [
  { 
    value: 'pending', 
    label: 'Open', 
    dotColor: 'bg-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-700',
    textColor: 'text-slate-800 dark:text-slate-300'
  },
  { 
    value: 'in_progress', 
    label: 'In Progress', 
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    textColor: 'text-blue-800 dark:text-blue-100'
  },
  { 
    value: 'completed', 
    label: 'Completed', 
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900',
    textColor: 'text-green-800 dark:text-green-100'
  }
];

const TaskStatus = ({ status = 'pending', taskId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);
  
  // Get task statuses from Redux store
  const { statuses, loading } = useSelector(state => state.taskStatus);
  
  // Convert API statuses to the format needed for the component
  const statusOptions = statuses && statuses.length > 0 
    ? statuses.map(status => ({
        value: status.status.toLowerCase().replace(' ', '_'),
        label: status.status,
        dotColor: `bg-[${status.color}]`,
        bgColor: `bg-opacity-10 bg-[${status.color}]`,
        textColor: `text-[${status.color}]`
      }))
    : fallbackStatusOptions;

  // Find current status details
  const currentStatus = statusOptions.find(option => option.value === status) || statusOptions[0];

  // Handle status change
  const handleStatusChange = (newStatus) => {
    if (newStatus !== status) {
      dispatch(toggleTaskStatus({ taskId, newStatus }));
    }
    setIsOpen(false);
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
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer"
        style={{
          backgroundColor: currentStatus.bgColor.includes('[') 
            ? `${currentStatus.bgColor.split('[')[1].split(']')[0]}1a` // 10% opacity version of the color
            : currentStatus.bgColor.split(' ')[0],
          color: currentStatus.textColor.includes('[') 
            ? currentStatus.textColor.split('[')[1].split(']')[0] 
            : currentStatus.textColor.split(' ')[0]
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span 
          className="w-1.5 h-1.5 rounded-full mr-1.5"
          style={{
            backgroundColor: currentStatus.dotColor.includes('[') 
              ? currentStatus.dotColor.split('[')[1].split(']')[0] 
              : undefined
          }}
        ></span>
        {currentStatus.label}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                  status === option.value
                    ? 'bg-slate-100 dark:bg-slate-700'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                onClick={() => handleStatusChange(option.value)}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full mr-2"
                  style={{
                    backgroundColor: option.dotColor.includes('[') 
                      ? option.dotColor.split('[')[1].split(']')[0] 
                      : undefined
                  }}
                ></span>
                <span style={{
                  color: option.textColor.includes('[') 
                    ? option.textColor.split('[')[1].split(']')[0] 
                    : undefined
                }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStatus; 