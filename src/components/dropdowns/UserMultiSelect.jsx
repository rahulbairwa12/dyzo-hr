// UserMultiSelect.jsx
// Component for selecting multiple users for a task

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import Tooltip from "../ui/Tooltip";
import ModernTooltip from "../ui/ModernTooltip";
import { intialLetterName } from "@/helper/helper";
import ProfileHoverCard from "../userProfile/ProfileHoverCard";
import { useNavigate } from "react-router-dom";
import { ProfilePicture } from "../ui/profilePicture";
import { useSelector } from "react-redux";

// Import all the helper logic from your statusHelper.js
import {
  statusMapping,
  getLiveStatus,
  fetchDjangoData,
  combineEmployeeData,
} from "@/helper/statusHelper";

/**
 * Props:
 * - task: The current task object
 * - users: Array of available users to select from
 * - index: The index of the task in the list
 * - updateExistingTask: Function to update the task on the server
 * - isCompleted: Boolean indicating if the task is completed
 * - companyId: Optional company ID parameter
 * - onClose: Optional callback when dropdown is closed
 * - initiallyOpen: Boolean to determine if dropdown should be initially open
 * - projectId: Project ID to check if "Add Member" button should be shown
 */
const UserMultiSelect = ({
  task,
  users,
  index,
  updateExistingTask,
  isCompleted,
  companyId = 2,
  onClose,
  initiallyOpen = false,
  dropdownPosition = 'bottom',
  onDropdownOpen,
  from = "task",
  projectId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(initiallyOpen);
  // Use state for pending selection while dropdown is open
  const [pendingSelectedUsers, setPendingSelectedUsers] = useState([]);
  const [selectedUsersState, setSelectedUsersState] = useState([]);
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [hoverUser, setHoverUser] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  // Keyboard navigation state
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Django live reporting data
  const [djangoData, setDjangoData] = useState([]);
  // Firebase logs data
  const [firebaseLogs, setFirebaseLogs] = useState({});

  const hoverTimeoutRef = useRef(null);
  const searchRef = useRef(null);
  const selectRef = useRef(null);
  const avatarRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const listItemRefs = useRef([]);

  const navigate = useNavigate();

  // Get user info from auth slice to check default project
  const userInfo = useSelector((state) => state.auth.user);

  // Check if "Add Member" button should be shown
  // Show for normal projects, hide for default project
  const shouldShowAddMember = React.useMemo(() => {
    // Get the projectId to check (from prop or from task)
    const currentProjectId = projectId || task?.projectId;
    if (!currentProjectId) return false;

    // Get default project ID from user slice
    const defaultProjectId = userInfo?.default_project || userInfo?.default_project_id;
    if (!defaultProjectId) return true; // If no default project set, show button

    // Check if current project is the default project
    const isDefaultProject = (
      String(currentProjectId) === String(defaultProjectId) ||
      Number(currentProjectId) === Number(defaultProjectId) ||
      String(currentProjectId) === String(userInfo?.default_project_id) ||
      Number(currentProjectId) === Number(userInfo?.default_project_id)
    );

    // Show button only for NON-default projects (inverse logic)
    return !isDefaultProject;
  }, [projectId, task?.projectId, userInfo?.default_project, userInfo?.default_project_id]);

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (!searchRef.current) return;
    const rect = searchRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // If not enough space below and more space above, position above
    if (spaceBelow < 350 && spaceAbove > spaceBelow) {
      setDropdownStyle({
        left: from === "subtask" ? rect.left - 200 : rect.left,
        top: rect.top - 8,
        transform: 'translateY(-100%)'
      });
    } else {
      setDropdownStyle({
        left: from === "subtask" ? rect.left - 200 : rect.left,
        top: rect.bottom + 8
      });
    }
  }, []);

  // ----------------------------
  // Handle Close - pass to parent component if provided
  // ----------------------------
  // When dropdown closes, update the real state and call API
  const handleClose = useCallback(() => {
    // First set showSearch to false to hide the dropdown
    setShowSearch(false);

    setSearchTerm("");

    // Get array of user IDs (will be empty array if no users selected)
    const userIds = pendingSelectedUsers.map((user) => user._id);

    // Always update task if there's any change between current assigned users and pendingSelectedUsers
    if (
      task &&
      (JSON.stringify(userIds) !== JSON.stringify(task.assigned_users) ||
        (pendingSelectedUsers.length === 0 && task.assigned_users && task.assigned_users.length > 0))
    ) {
      // Try different formats to see which one works with your API
      const assignedValue = userIds.length > 0 ? userIds : []

      const updatedTask = {
        ...task,
        assigned_users: assignedValue,
      };

      if (typeof updateExistingTask === "function") {
        // Add error handling and state synchronization
        updateExistingTask(updatedTask, "assigned_users")
          .then(() => {
            // On successful update, ensure UI state is synchronized
            setSelectedUsersState(pendingSelectedUsers);
            // Call onClose AFTER state is updated
            if (typeof onClose === "function") {
              onClose();
            }
          })
          .catch((error) => {
            console.error("Failed to update assigned users:", error);
            // On error, revert to previous state and show error message
            console.error("Failed to update assigned users:", error);
            // Revert to the previous state
            setPendingSelectedUsers(selectedUsersState);
            // Still call onClose even on error
            if (typeof onClose === "function") {
              onClose();
            }
          });
      } else {
        if (typeof onClose === "function") {
          onClose();
        }
      }
    } else {
      // Update state even if no API call
      setSelectedUsersState(pendingSelectedUsers);
      // Call onClose when no changes
      if (typeof onClose === "function") {
        onClose();
      }
    }
  }, [
    pendingSelectedUsers,
    selectedUsersState,
    task,
    updateExistingTask,
    onClose
  ]);

  // ----------------------------
  // Handle user selection without closing dropdown
  // ----------------------------
  const handleUserSelection = (employee, e) => {
    e.preventDefault();
    e.stopPropagation();

    // Set a flag to prevent dropdown from closing
    window.preventDropdownClose = true;

    // Use setTimeout to ensure this runs after the event handling
    setTimeout(() => {
      toggleUserSelection(employee);

      // Keep focus on search input after selection
      if (selectRef.current) {
        selectRef.current.focus();
      }

      // Reset the flag after a delay
      setTimeout(() => {
        window.preventDropdownClose = false;
      }, 100);
    }, 0);
  };

  // ----------------------------
  // Handle Open Dropdown
  // ----------------------------
  const handleOpenDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Initialize the global flag if needed
    if (window.preventDropdownClose === undefined) {
      window.preventDropdownClose = false;
    }
    if (showSearch) {
      handleClose(); // Save changes and close
    } else {
      // Reset pendingSelectedUsers from the TASK data, not from selectedUsersState
      // This ensures we always start with the latest server state
      if (task && task.assigned_users && task.assigned_users.length > 0) {
        const freshAssignedUsers = task.assigned_users
          .map((userId) => users.find((user) => user._id === userId))
          .filter(Boolean);

        setPendingSelectedUsers(freshAssignedUsers);
      } else {

        setPendingSelectedUsers([]);
      }

      setShowSearch(true);
      if (typeof onDropdownOpen === 'function') {
        onDropdownOpen();
      }
    }
  };

  // ----------------------------
  // 1) Fetch Django data on mount
  // ----------------------------
  useEffect(() => {
    async function getDjangoData() {
      const data = await fetchDjangoData(companyId);
      setDjangoData(data || []);
    }
    getDjangoData();
  }, [companyId]);

  // ----------------------------
  // 2) Initialize selectedUsers from task
  // ----------------------------
  useEffect(() => {
    if (task && task.assigned_users && task.assigned_users.length > 0) {
      const assignedUsers = task.assigned_users
        .map((userId) => {
          return users.find((user) => user._id === userId);
        })
        .filter(Boolean);
      setSelectedUsersState(assignedUsers);
      setPendingSelectedUsers(assignedUsers);
    } else {
      setSelectedUsersState([]);
      setPendingSelectedUsers([]);
    }
  }, [task?.assigned_users, users]);

  // ----------------------------
  // 3) Close dropdown on outside click
  // ----------------------------
  useEffect(() => {
    function handleClickOutside(event) {
      // Don't close if we're clicking inside the dropdown or scroll area
      if (searchRef.current && !searchRef.current.contains(event.target)) {

        if (
          event.target.closest('.user-multiselect-scroll-area') ||
          event.target.closest('.dropdown-search-area') ||
          event.target.closest('.close-button-multiselect') ||
          event.target.closest('.dropdown-header-multiselect')
        ) {
          // Click inside dropdown or scroll area, so don't close
          return;
        }
        // Check the global flag before closing
        if (window.preventDropdownClose) {
          return;
        }
        // Small delay to allow button click handlers to complete
        setTimeout(() => {
          if (!window.preventDropdownClose) {
            handleClose(); // Save changes and close
          }
        }, 300);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClose]);

  // ----------------------------
  // 4) Auto-focus search input and update dropdown position
  // ----------------------------
  useEffect(() => {
    if (showSearch) {
      // CRITICAL: Reset pendingSelectedUsers from task data when dropdown opens
      // This ensures we always start with the latest server state
      if (task && task.assigned_users && task.assigned_users.length > 0) {
        const freshAssignedUsers = task.assigned_users
          .map((userId) => users.find((user) => user._id === userId))
          .filter(Boolean);

        setPendingSelectedUsers(freshAssignedUsers);
      } else {

        setPendingSelectedUsers([]);
      }

      if (selectRef.current) {
        selectRef.current.focus();
      }
      // Update dropdown position when it opens
      setTimeout(() => {
        updateDropdownPosition();
      }, 0);
      // Reset highlighted index when dropdown opens
      setHighlightedIndex(-1);
    }
  }, [showSearch, updateDropdownPosition, task?.assigned_users, users]);



  // ----------------------------
  // 5) Combine each user with Django + Firebase data
  // ----------------------------
  const mergedUsers = users.map((usr) =>
    combineEmployeeData(usr, djangoData, firebaseLogs)
  );

  // ----------------------------
  // 6) Search logic
  // ----------------------------
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Reset highlighted index when search changes, but will be set to 0 in useEffect
    setHighlightedIndex(-1);
  };

  // Keyboard navigation handlers
  // ----------------------------
  const handleKeyDown = (e) => {
    if (!showSearch || displayUsers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < displayUsers.length - 1 ? prev + 1 : 0;
          scrollToHighlightedItem(newIndex);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : displayUsers.length - 1;
          scrollToHighlightedItem(newIndex);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < displayUsers.length) {
          toggleUserSelection(displayUsers[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  // Scroll to highlighted item
  const scrollToHighlightedItem = (index) => {
    if (listItemRefs.current[index] && scrollAreaRef.current) {
      const item = listItemRefs.current[index];
      const container = scrollAreaRef.current;
      const itemRect = item.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (itemRect.bottom > containerRect.bottom) {
        container.scrollTop += itemRect.bottom - containerRect.bottom + 5;
      } else if (itemRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - itemRect.top + 5;
      }
    }
  };

  // Helper function for consistent user ID comparison
  const getUserId = (user) => user._id || user.value;

  // ----------------------------
  // 7) Select/Deselect user (only update pendingSelectedUsers)
  // ----------------------------
  const toggleUserSelection = (employee) => {
    window.preventDropdownClose = true;

    const employeeId = getUserId(employee);

    const isSelected = pendingSelectedUsers.some(
      (user) => getUserId(user) === employeeId
    );

    let newSelectedUsers;
    if (isSelected) {
      newSelectedUsers = pendingSelectedUsers.filter(
        (user) => getUserId(user) !== employeeId
      );
    } else {
      newSelectedUsers = [...pendingSelectedUsers, employee];
    }
    setPendingSelectedUsers(newSelectedUsers);
    setTimeout(() => {
      window.preventDropdownClose = false;
    }, 200);
  };

  // ----------------------------
  // Clear all selected users
  // ----------------------------
  const clearAllUsers = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingSelectedUsers([]);
    window.preventDropdownClose = true;

  };

  // Handle hover events for profile card
  const handleMouseEnter = (user) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoverUser(user);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowHoverCard(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setShowHoverCard(false);
    }, 300);
  };

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? mergedUsers.filter((employee) => {
      if (!employee) return false;

      const isSelected = pendingSelectedUsers.some(
        (user) => getUserId(user) === getUserId(employee)
      );

      if (isSelected) return true; // ✅ always include selected users in results

      if (!searchTerm) return true; // ✅ if search is empty, include all

      // Search by name or designation
      const nameMatch = employee.label
        ? employee.label.toLowerCase().includes(searchTerm.toLowerCase())
        : employee.name
          ? employee.name.toLowerCase().includes(searchTerm.toLowerCase())
          : false;

      const desgMatch = employee.designation
        ? employee.designation
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
        : false;

      return nameMatch || desgMatch;
    })
    : mergedUsers;

  // Use showSearch ? pendingSelectedUsers : selectedUsersState for UI
  const currentSelectedUsers = showSearch
    ? pendingSelectedUsers
    : selectedUsersState;

  // Create a stable sorted array for display and keyboard navigation
  const displayUsers = [...filteredUsers].sort((a, b) => {
    // First, prioritize selected users
    const aIsSelected = currentSelectedUsers.some(
      (user) => getUserId(user) === getUserId(a)
    );
    const bIsSelected = currentSelectedUsers.some(
      (user) => getUserId(user) === getUserId(b)
    );

    // If one is selected and the other isn't, put selected first
    if (aIsSelected && !bIsSelected) return -1;
    if (!aIsSelected && bIsSelected) return 1;

    // If both are selected or both are not selected, sort alphabetically
    const nameA = (a.name || a.label || '').toLowerCase();
    const nameB = (b.name || b.label || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // ----------------------------
  // Reset highlighted index when filtered users change and auto-highlight first user when searching
  // ----------------------------
  useEffect(() => {
    if (searchTerm && displayUsers.length > 0) {
      // Auto-highlight the first user when searching
      setHighlightedIndex(0);
      // Scroll to the first item
      setTimeout(() => scrollToHighlightedItem(0), 0);
    } else {
      setHighlightedIndex(-1);
    }
    // Clear refs array when users change
    listItemRefs.current = [];
  }, [displayUsers.length, searchTerm]);

  // Display selected users' avatars
  const renderSelectedUserAvatars = () => {
    if (currentSelectedUsers.length === 0) {
      return (
        <div className="flex items-center">
          <div className={`${from === "subtask" ? "w-6 h-6" : "w-7 h-7"} flex items-center justify-center rounded-full border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 dark:text-slate-500`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      );
    }
    const maxAvatars = 3;
    const extraCount = currentSelectedUsers.length - maxAvatars;
    return (
      <div className="flex -space-x-2 overflow-hidden">
        {currentSelectedUsers.slice(0, maxAvatars).map((user, i) => (
          <div key={user._id || user.value} className="relative">
            <ProfilePicture
              user={user}
              className={`${from === "subtask" ? "w-6 h-6" : "w-7 h-7"} rounded-full border-2 border-white dark:border-gray-800 object-cover`}
            />
          </div>
        ))}
        {extraCount > 0 && (
          <div className={`${from === "subtask" ? "w-6 h-6" : "w-7 h-7"} rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-200`}>
            +{extraCount}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative" key={`multiUser-${index}`}>
      <div className="relative" ref={searchRef}>
        {/* Trigger Button */}
        {from != "dyzoAi" && <div className="flex items-center space-x-1" onClick={handleOpenDropdown}>
          <ModernTooltip
            placement="top"
            theme="custom-light"
            content={
              currentSelectedUsers.length > 0 ? (
                <div >
                  {currentSelectedUsers.map((u, idx) => {
                    const name = u.name || u.fullName || u.email || "No Name";
                    const capitalized = name.replace(/\b\w/g, (c) =>
                      c.toUpperCase()
                    );
                    return (
                      <div key={idx} className="flex items-center gap-2 mb-1">
                        <ProfilePicture
                          user={u}
                          className={`${from === "subtask" ? "w-6 h-6" : "w-7 h-7"} rounded-full border-2 dark:border-slate-700 border-white object-cover`}
                        />
                        <span className=" dark:text-white">{capitalized}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                "No assignees"
              )
            }
          >
            <div className="flex items-center">
              {renderSelectedUserAvatars()}
            </div>
          </ModernTooltip>
          {
            from !== "subtask" &&
            <button
              onClick={handleOpenDropdown}
              className="text-blue-500 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full p-0.5 flex items-center justify-center"
            >
              <Icon icon="heroicons:plus" className="w-5 h-5" />
            </button>
          }
        </div>}

        {/* Search Dropdown */}
        {showSearch && createPortal(
          <div
            className={`fixed w-60 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg max-h-[337px] overflow-auto z-[9999] multiuser-select-dropdown`}
            style={dropdownStyle}
          >
            <div className="flex justify-between items-center p-1.5 border-b border-gray-200 dark:border-slate-700 dropdown-header-multiselect">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 pl-1">
                Assign Users
              </span>
              <div className="flex items-center">
                {pendingSelectedUsers.length > 0 && (
                  <button
                    onClick={clearAllUsers}
                    className="p-0.5 mr-1 text-xs text-red-500 hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 close-button-multiselect"
                >
                  <Icon icon="heroicons:x-mark" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="px-1.5 pt-1.5 pb-1 dropdown-search-area">
              <input
                type="text"
                placeholder="Search Assignee"
                value={searchTerm}
                onChange={handleSearch}
                onKeyDown={handleKeyDown}
                className="w-full p-1.5 text-xs border border-[#D6D6D6] dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded placeholder:text-secondary font-normal focus:outline-none"
                ref={selectRef}
              />
            </div>

            <div
              className="overflow-y-auto max-h-56 px-1 z-50 user-multiselect-scroll-area"
              ref={scrollAreaRef}
            >
              {displayUsers.length > 0 ? (
                <ul className="bg-white dark:bg-slate-800 space-y-0.5">
                  {currentSelectedUsers.length > 0 && (
                    <li className="text-xs font-medium text-gray-500 dark:text-gray-400 pt-1 pb-1 px-1.5 border-b border-gray-100 dark:border-gray-700">
                      SELECTED ASSIGNEES
                    </li>
                  )}

                  {displayUsers.map((employee, idx) => {
                    const isSelected = currentSelectedUsers.some(
                      (user) => getUserId(user) === getUserId(employee)
                    );
                    const isHighlighted = highlightedIndex === idx;
                    // Find the index of the last selected user
                    const lastSelectedIdx = displayUsers.findLastIndex((e) =>
                      currentSelectedUsers.some(
                        (user) => getUserId(user) === getUserId(e)
                      )
                    );
                    const showSeparator =
                      isSelected &&
                      idx === lastSelectedIdx &&
                      currentSelectedUsers.length > 0 &&
                      displayUsers.length > currentSelectedUsers.length;
                    return (
                      <React.Fragment key={employee.value || employee._id}>
                        <li
                          ref={(el) => {
                            if (el) {
                              listItemRefs.current[idx] = el;
                            }
                          }}
                          onMouseDown={(e) => {
                            // Prevent the dropdown from closing when clicking this button
                            e.preventDefault();
                            e.stopPropagation();
                            window.preventDropdownClose = true;
                          }}
                          onClick={(e) => handleUserSelection(employee, e)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`text-xs py-1 cursor-pointer flex items-center justify-between rounded px-1.5 ${isHighlighted
                            ? "bg-electricBlue-50/30 dark:bg-blue-900/30"
                            : isSelected
                              ? "bg-gray-50 dark:bg-slate-700"
                              : "hover:bg-gray-50 dark:hover:bg-slate-700"
                            }`}
                        >
                          <div
                            className="flex items-center"

                          >
                            <ProfilePicture user={employee} className="w-6 h-6 rounded-full object-cover" />
                            <div className="ml-1.5" onMouseDown={(e) => {
                              // Prevent the dropdown from closing when clicking this button
                              e.preventDefault();
                              e.stopPropagation();
                              window.preventDropdownClose = true;
                            }}>
                              <span className="text-xs font-medium dark:text-white">
                                {employee.name || employee.label}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleUserSelection(employee, e)}
                            onMouseDown={(e) => {
                              // Prevent the dropdown from closing when clicking this button
                              e.preventDefault();
                              e.stopPropagation();
                              window.preventDropdownClose = true;
                            }}
                            className={`p-0.5 rounded-full ${isSelected
                              ? "text-red-500 hover:bg-red-50 dark:hover:bg-slate-600"
                              : "text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600"
                              }`}
                          >
                            <Icon
                              icon={
                                isSelected
                                  ? "heroicons:x-mark"
                                  : "heroicons:plus"
                              }
                              className="w-4 h-4 text-electricBlue-50"
                            />
                          </button>
                        </li>
                        {showSeparator && (
                          <li className="text-xs font-medium text-gray-500 dark:text-gray-400 pt-1.5 pb-1 px-1.5 border-b border-t border-gray-100 dark:border-gray-700">
                            OTHER ASSIGNEES
                          </li>
                        )}
                      </React.Fragment>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400 py-2 px-1.5">
                  No employees found.
                </div>
              )}
            </div>
            {shouldShowAddMember && (
              <div className="px-3 bg-gray-100 dark:hover:bg-slate-700 border-t-2 border-gray-200 dark:border-slate-700 hover:bg-white  sticky bottom-0 transition-colors duration-200">
                <button
                  className="w-full flex items-center gap-2 py-2.5 text-electricBlue-50 hover:underline text-xs"
                  onClick={() => {
                    const targetProjectId = projectId || task?.projectId;
                    if (targetProjectId) {
                      navigate(`/project/${targetProjectId}?tab=members`);
                    }
                  }}
                >
                  <Icon icon="heroicons:plus" className="w-4 h-4" />
                  Add Member
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default UserMultiSelect;
