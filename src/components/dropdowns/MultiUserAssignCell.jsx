// MultiUserAssignCell.jsx
// Component that wraps the UserMultiSelect component for use in the task table

import React, { useState, useRef, useCallback, useEffect } from "react";
import UserMultiSelect from "./UserMultiSelect";
import Tooltip from "../ui/Tooltip";
import ModernTooltip from "../ui/ModernTooltip";
import { ProfilePicture } from "../ui/profilePicture";

/**
 * MultiUserAssignCell - A component for displaying and managing multiple user assignments in task table
 * 
 * @param {Object} task - The current task object
 * @param {Array} users - Array of available users
 * @param {Boolean} isTaskCompleted - Whether the task is completed
 * @param {Function} updateExistingTask - Function to update the task on the server
 * @param {Number} index - The index of the task in the list
 */
const MultiUserAssignCell = ({
  task,
  users,
  isTaskCompleted,
  updateExistingTask,
  index,
  isPanelVisible,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Ensure dropdown closes when panel becomes visible
  useEffect(() => {
    if (isPanelVisible && isEditing) {
      setIsEditing(false);
    }
  }, [isPanelVisible, isEditing]);




  // Handle toggling edit mode
  const handleCellClick = (e) => {
    e.stopPropagation();
    if (!isPanelVisible) {
      setIsEditing((prev) => !prev);
    }
  };

  // Get assigned users from the task
  const getAssignedUsers = () => {
    if (!task) return [];

    // If task has assigned_users array
    if (task.assigned_users && Array.isArray(task.assigned_users) && task.assigned_users.length > 0) {
      return task.assigned_users.map(userId =>
        users.find(user => user._id === userId)
      ).filter(Boolean); // Filter out any undefined values
    }

    /*  // If task has only single userId
     if (task.userId) {
       const user = users.find(u => u._id === task.userId);
       return user ? [user] : [];
     } */

    return [];
  };

  // Get assigned users
  const assignedUsers = getAssignedUsers();
  // Limit the display to 3 users
  const displayUsers = assignedUsers.slice(0, 3);
  const extraCount = assignedUsers.length - displayUsers.length;

  const cellRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');

  // Calculate dropdown position based on available space
  const calculateDropdownPosition = useCallback(() => {
    if (!cellRef.current) return;
    const rect = cellRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    // If not enough space below and more space above, open upwards
    if (spaceBelow < 350 && spaceAbove > spaceBelow) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  }, []);

  // Recalculate on scroll/resize when editing
  useEffect(() => {
    if (!isEditing) return;
    calculateDropdownPosition();
    const handleScroll = () => calculateDropdownPosition();
    const handleResize = () => calculateDropdownPosition();
    window.addEventListener('scroll', handleScroll, true); // capture: true
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isEditing, calculateDropdownPosition]);

  // Handler for when dropdown opens
  const handleDropdownOpen = useCallback(() => {
    calculateDropdownPosition();
  }, [calculateDropdownPosition]);

  // If in view mode (not editing), show a simple display of assigned users
  if (!isEditing) {
    return (
      <ModernTooltip
        placement="top"
        theme="custom-light"
        content={
          assignedUsers && assignedUsers.length > 0
            ? (
              <div onClick={handleCellClick}>
                {assignedUsers.map((u, idx) => {
                  const name = u.name || u.fullName || u.email || "No Name";
                  const capitalized = name.replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <div key={idx} className="flex items-center gap-2 mb-1">
                      {/* Always pass the full user object to ProfilePicture to ensure image is shown if available */}
                      <ProfilePicture user={u} className="w-7 h-7 rounded-full border-2 dark:border-slate-700 border-white object-cover" />
                      <span className="font-normal dark:text-white">{capitalized}</span>
                    </div>
                  );
                })}
              </div>
            )
            : "No assignees"
        }
      >
        <div className="flex -space-x-2 w-fit " onClick={handleCellClick} ref={cellRef}>
          {displayUsers.length > 0 ? (
            displayUsers.map((user, idx) => (
              // Always pass the full user object to ProfilePicture for avatar
              <ProfilePicture key={user._id || idx} user={user} className="w-7 h-7 rounded-full border-2 dark:border-slate-700 border-white object-cover" />
            ))
          ) : (
            <div className="w-7 h-7 flex items-center justify-center rounded-full border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
          {extraCount > 0 && (
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 border-2 dark:border-slate-700 border-white flex items-center justify-center text-xs text-gray-700 dark:text-gray-200 font-semibold">
              +{extraCount}
            </div>
          )}

        </div>
      </ModernTooltip>
    );
  }

  // If in edit mode, show the full UserMultiSelect
  return (
    <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()} ref={cellRef}>
      <div className="flex-grow ">
        <UserMultiSelect
          task={task}
          users={users}
          index={index}
          updateExistingTask={(updatedTask, field) => {
            return updateExistingTask(updatedTask, field);
          }}
          isCompleted={isTaskCompleted}
          onClose={() => {
            setIsEditing(false);
          }}
          initiallyOpen={true}
          dropdownPosition={dropdownPosition}
          onDropdownOpen={handleDropdownOpen}
        />
      </div>
    </div>
  );
};

export default MultiUserAssignCell;