import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import { updateTaskInState } from '../store/tasksSlice';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";

const DueDateCell = ({ task, updateExistingTask, interpretDate, isPanelVisible }) => {
  const [isEditing, setIsEditing] = useState(false);
  const dispatch = useDispatch();
  const flatpickrRef = useRef(null);

  // Auto-open calendar when isEditing becomes true
  useEffect(() => {
    if (isEditing && flatpickrRef.current?.flatpickr) {
      // Short delay to ensure the component is rendered
      setTimeout(() => {
        flatpickrRef.current.flatpickr.open();
      }, 10);
    }
  }, [isEditing]);

  const handleDueDateChange = (selectedDates) => {
    if (selectedDates && selectedDates.length > 0) {
    
      // Format date to ISO string for API
      // const newDueDate = selectedDates[0].toISOString();
      const newDueDate = moment(selectedDates[0]).format("YYYY-MM-DD");
      
      if (newDueDate !== (task.dueDate || null)) {
        // Update UI optimistically
        dispatch(
          updateTaskInState({
            _id: task._id,
            dueDate: newDueDate,
          })
        );
        
        // Update on the server
        const updatedTask = { ...task, dueDate: newDueDate };
        updateExistingTask(updatedTask, "dueDate");
      }
    } else {
      // Handle clearing the date (if allowed)
      dispatch(
        updateTaskInState({
          _id: task._id,
          dueDate: null,
        })
      );
      
      const updatedTask = { ...task, dueDate: null };
      updateExistingTask(updatedTask, "dueDate");
    }
    
    setIsEditing(false);
  };

  const handleCellClick = (e) => {
    e.stopPropagation();
    if (!isPanelVisible) {
      setIsEditing(true);
    }
  };

  return (
    <td 
      className="px-2 py-1 whitespace-nowrap w-[100px] cursor-pointer group /border-r /border-slate-200 dark:border-slate-700"
      onClick={handleCellClick}
    >
      {isEditing ? (
        <div className="relative z-10">
          <Flatpickr
            ref={flatpickrRef}
            className="w-full min-w-[100px] text-xs border border-blue-300 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={task.dueDate ? new Date(task.dueDate) : null}
            onChange={handleDueDateChange}
            options={{
              dateFormat: "d/m/Y",
              allowInput: true,
              clickOpens: true,
              autoClose: true,
              disableMobile: true, // Ensures consistent behavior on mobile
            }}
            onOpen={() => {
              // Prevent propagation to avoid row click
              document.querySelector('.flatpickr-calendar')?.addEventListener('click', e => e.stopPropagation());
            }}
            onClose={(selectedDates, dateStr) => {
              // 🔥 Handle clearing the input on close as well
              if (!dateStr || dateStr.trim() === "") {
                dispatch(
                  updateTaskInState({
                    _id: task._id,
                    dueDate: null,
                  })
                );
                const updatedTask = { ...task, dueDate: null };
                updateExistingTask(updatedTask, "dueDate");
              }
              setIsEditing(false);
            }}
          />
        </div>
      ) : (
        <div
          className={`text-xs flex items-center ${
            task.dueDate &&
            moment(task.dueDate).isBefore(moment().startOf("day"))
              ? "text-red-500 dark:text-red-400 "
              : "text-[#000000] dark:text-slate-300"
          }`}
        >
          <span className='text-xs'>
            {task.dueDate ? (
              (() => {
                const label = interpretDate(task.dueDate);
                if (["Yesterday", "Today", "Tomorrow"].includes(label)) {
                  return label;
                }
                return moment(task.dueDate).format("DD-MM-YYYY");
              })()
            ) : "No Due Date"}
          </span>
          {task.dueDate && task.isRecurring && (
            <Icon
              icon="mdi:refresh"
              className="inline-block ml-1 w-3 h-3 text-blue-500 dark:text-blue-400"
            />
          )}
          <Icon
            icon="heroicons-outline:calendar"
            className="ml-1 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100"
          />
        </div>
      )}
    </td>
  );
};

export default DueDateCell;