import React, { useState, memo } from 'react';
import { Icon } from '@iconify/react';
import moment from 'moment';
import { updateTaskInState } from '../store/tasksSlice';
import { useDispatch } from 'react-redux';

const TaskRow = memo(function TaskRow({
  task,
  updateExistingTask,
  interpretDate
}) {
  const [editingDueDateId, setEditingDueDateId] = useState(null);
  const dispatch = useDispatch();

  const handleDueDateChange = (e) => {
    const newDueDate = e.target.value ? new Date(e.target.value).toISOString() : null;
    
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
    
    setEditingDueDateId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Trigger the blur event which saves the date
    } else if (e.key === 'Escape') {
      setEditingDueDateId(null); // Cancel editing
    }
  };

  return (
    <td 
      className="px-2 py-1 whitespace-nowrap w-[100px] cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        setEditingDueDateId(task._id);
      }}
    >
      {editingDueDateId === task._id ? (
        <div className="relative z-10">
          <input
            type="date"
            className="w-full text-xs border border-blue-300 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            defaultValue={task.dueDate ? moment(task.dueDate).format("YYYY-MM-DD") : ""}
            autoFocus
            onBlur={handleDueDateChange}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          />
        </div>
      ) : (
        <div
          className={`text-xs flex items-center ${
            task.dueDate &&
            moment(task.dueDate).isBefore(moment().startOf("day"))
              ? "text-red-500 dark:text-red-400 font-medium"
              : "text-[#000000] dark:text-slate-300"
          }`}
        >
          <span>{task.dueDate ? interpretDate(task.dueDate) : ""}</span>
          {task.dueDate && task.isRecurring && (
            <Icon
              icon="mdi:refresh"
              className="inline-block ml-1 w-3 h-3 text-blue-500 dark:text-blue-400"
            />
          )}
          <Icon
            icon="heroicons-outline:pencil"
            className="ml-1 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100"
          />
        </div>
      )}
    </td>
  );
});

export default TaskRow; 