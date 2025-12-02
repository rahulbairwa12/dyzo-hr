import React, { useState, useRef, useCallback, useEffect, memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { Icon } from "@iconify/react";
import Tooltip from "@/components/ui/Tooltip";
import MultiUserAssignCell from "@/components/dropdowns/MultiUserAssignCell";
import { ProfilePicture } from "@/components/ui/profilePicture";
import {
  selectAllRecurringTasks,
  toggleRecurringTaskSelection,
  setPage,
  addRecurringTask,
  updateRecurringTaskInState,
  createRecurringTask,
  removeRecurringTaskFromState,
  deleteBulkRecurringTasks,
  clearSelectedRecurringTasks,
  togglePanelVisibility,
} from "../store/tasksSlice";
import { fetchUsers } from "@/store/usersSlice";
import ContextMenu from "@/components/ui/ContextMenu";
import { toast } from "react-toastify";
import ProjectSelect from "@/components/dropdowns/ProjectSelect";
import { fetchAuthGET, fetchAuthPost } from "@/store/api/apiSlice";
import { djangoBaseURL } from "@/helper";
import RecurringTaskRow from "./RecurringTaskRow";
import FrequencyDropdown from "./FrequencyDropdown";
import RecurringTaskBottomBar from "./RecurringTaskBottomBar";
import RecurringTaskPanel from "./RecurringTaskPanel";

// Helper functions for formatting
const formatDate = (dateString) => {
  if (!dateString) return "";
  return moment(dateString).format("MMM DD, YYYY");
};

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

// Fix component props
const RecurringTaskTable = ({ projects, onRowClick }) => {
  const dispatch = useDispatch();
  const {
    recurringTasks,
    recurringTasksLoading,
    recurringTasksError,
    selectedRecurringTasks,
    isPanelVisible,
    emptyTaskWarning
  } = useSelector((state) => state.tasks);
  const { user: userInfo } = useSelector((state) => state.auth);
  const { users, loading: loadingUsers } = useSelector((state) => state.users);



  // State for refs and UI
  const inputRefs = useRef({});
  const taskCreationMap = useRef({});
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [modalIsOpen, setModalIsOpen] = useState("");

  // Add state for selected task to show in panel
  const [selectedTask, setSelectedTask] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    task: null,
  });

  // Delete task state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // Sorting handler function
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };


  // truncate text to 69 words for project name
  function getLimitedWords(text = "", limit = 10) {
    const words = text.trim().split(/\s+/);
    const isTruncated = words.length > limit;
    const limited = words.slice(0, limit).join(" ");
    return isTruncated ? `${limited}...` : limited;
  }
  // Helper function to get project name
  const getProjectNameFromId = (projectId) => {
    if (!projectId) return "No Project";
    const project = projects.find((p) => String(p._id) === String(projectId));
    return project ? project.name : "Unknown Project";
  };

  // Helper function to replace "No Project" with "Untitled Project"
  const replaceNoProject = (value) => {
    return value === "No Project" ? "Untitled Project" : value;
  };

  // Create a sorted tasks array based on sortConfig
  const sortedTasks = useMemo(() => {
    // First find any newly created tasks - always keep these at top
    const newTasks = recurringTasks.filter((task) => task.isNewTask || task.initial);

    // Then sort the remaining tasks
    const remainingTasks = recurringTasks.filter(
      (task) => !task.isNewTask && !task.initial
    );

    // If no sorting is configured, just return the tasks in their current order
    if (!sortConfig.key) {
      return [...newTasks, ...remainingTasks];
    }

    // Apply sorting based on the selected column
    let sortedRemainingTasks = [...remainingTasks];

    switch (sortConfig.key) {
      case "startDate":
        sortedRemainingTasks.sort((a, b) => {
          if (!a.start_date && !b.start_date) return 0;
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;

          const dateA = new Date(a.start_date);
          const dateB = new Date(b.start_date);
          return sortConfig.direction === "ascending"
            ? dateA - dateB
            : dateB - dateA;
        });
        break;

      case "endDate":
        sortedRemainingTasks.sort((a, b) => {
          if (!a.end_date && !b.end_date) return 0;
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;

          const dateA = new Date(a.end_date);
          const dateB = new Date(b.end_date);
          return sortConfig.direction === "ascending"
            ? dateA - dateB
            : dateB - dateA;
        });
        break;

      case "frequency":
        sortedRemainingTasks.sort((a, b) => {
          const freqOrder = {
            daily: 1,
            weekly: 2,
            monthly: 3,
            sunday: 4,
            monday: 5,
            tuesday: 6,
            wednesday: 7,
            thursday: 8,
            friday: 9,
            saturday: 10
          };

          const freqA = a.frequency?.toLowerCase() || "";
          const freqB = b.frequency?.toLowerCase() || "";

          const orderA = freqOrder[freqA] || 11;
          const orderB = freqOrder[freqB] || 11;

          return sortConfig.direction === "ascending"
            ? orderA - orderB
            : orderB - orderA;
        });
        break;

      default:
        // Default to no sorting
        break;
    }

    // Always keep new tasks at the top
    return [...newTasks, ...sortedRemainingTasks];
  }, [recurringTasks, sortConfig]);

  // Handle window resize for responsive view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch users on component mount if not already loaded
  useEffect(() => {
    if (!users.length && userInfo?._id) {
      dispatch(fetchUsers());
    }
  }, [dispatch, users.length, userInfo?._id]);

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    dispatch(selectAllRecurringTasks(isChecked));
  };

  // Handle bulk delete of recurring tasks
  const handleDeleteRecurringTasks = async () => {
    if (!selectedRecurringTasks.length) {
      toast.error("No tasks selected for deletion");
      return;
    }

    setBulkLoading(true);
    try {
      await dispatch(deleteBulkRecurringTasks(selectedRecurringTasks)).unwrap();
      toast.success("Selected recurring tasks deleted successfully", { autoClose: 2000 });
    } catch (error) {
      console.error("Error deleting recurring tasks:", error);
      toast.error("Failed to delete selected recurring tasks", { autoClose: 3000 });
    } finally {
      setBulkLoading(false);
      setModalIsOpen("");
    }
  };

  // Handle adding a new recurring task
  const handleAddTask = useCallback(() => {
    // Generate a unique temporary ID
    const newTaskId = `new-recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new recurring task object
    const newTask = {
      _id: newTaskId,
      id: newTaskId,
      taskName: "",
      isEditing: true,
      projectId: userInfo?.default_project || (projects.length > 0 ? projects[0]._id : userInfo.default_project),
      start_date: moment().format("YYYY-MM-DD"),
      end_date: moment().add(30, 'days').format("YYYY-MM-DD"),
      frequency: "weekly",
      interval: 1,
      company: userInfo?.companyId,
      assigned_users: [userInfo?._id],
      description: "",
      initial: true,
      isNewTask: true,
    };

    // Add the new task to state
    dispatch(addRecurringTask(newTask));

    // Set the task as selected and open the panel
    setSelectedTask(newTask);
    dispatch(togglePanelVisibility(true));

    // Set last added task ID to focus on it
    setLastAddedTaskId(newTaskId);
    setEditingTaskId(newTaskId);
  }, [dispatch, userInfo, projects]);

  // Handle row click
  const handleRowClick = useCallback((task) => {
    setSelectedTask(task);
    dispatch(togglePanelVisibility(true));

    // Also call original onRowClick if provided
    if (typeof onRowClick === 'function') {
      onRowClick(task);
    }
  }, [dispatch, onRowClick]);

  // Close panel function
  const handleClosePanel = useCallback(() => {
    dispatch(togglePanelVisibility(false));
    setSelectedTask(null);
  }, [dispatch]);

  // Handle right-click context menu
  const handleContextMenu = (e, task) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      task: task,
    });
  };

  // Define context menu items
  const getContextMenuItems = (task) => [
    {
      label: "Open task detail",
      icon: "heroicons:eye",
      onClick: (task) => handleRowClick(task),
    },
    {
      label: "Delete task",
      icon: "heroicons:trash",
      onClick: (task) => {
        setTaskToDelete(task);
        setShowDeleteModal(true);
      },
    },
  ];

  // Handle deleting a recurring task
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);

    try {
      // Check if it's a temporary task (not yet saved to server)
      if (String(taskToDelete._id).startsWith('new-recurring-')) {
        // Just remove from Redux state
        dispatch(removeRecurringTaskFromState(taskToDelete._id));
        toast.success("Task removed", { autoClose: 2000 });
      } else {
        // Delete from server
        const response = await fetchAuthPost(
          `${djangoBaseURL}/api/delete-recurring-task/${taskToDelete.id}/`
        );

        if (response.status) {
          // Remove from Redux state
          dispatch(removeRecurringTaskFromState(taskToDelete._id));
          toast.success("Recurring task deleted successfully", { autoClose: 2000 });
        } else {
          throw new Error(response.message || "Failed to delete task");
        }
      }
    } catch (error) {
      console.error("Error deleting recurring task:", error);
      toast.error("Failed to delete recurring task", { autoClose: 3000 });
    } finally {
      setShowDeleteModal(false);
      setTaskToDelete(null);
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full h-full">
      {/* Desktop Table View */}
      <div className="hidden md:block w-full h-full min-h-[calc(100vh-100px)]">
        <table className="min-w-full">
          <thead className="bg-white sticky top-0 z-10 dark:bg-slate-800 border-b border-[#E1E1E1] dark:border-slate-700">
            <tr>
              <th className="w-8 px-1 py-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3 h-3"
                    checked={selectedRecurringTasks.length > 0 && selectedRecurringTasks.length === recurringTasks.length}
                    onChange={handleSelectAll}
                  />
                </div>
              </th>
              <th className="w-12 px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-2 py-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px] w-[35%] task-name-column">
                <span className="hidden lg:inline">Task Name</span>
                <span className="lg:hidden">Task</span>
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] w-[12%]">
                PROJECT
              </th>
              <th className="w-[80px] px-1 py-2 pr-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden lg:inline ">Attachments</span>
                <span className="lg:hidden">Files</span>
              </th>
              <th
                className="w-[90px] px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="flex items-center">
                  <span className="hidden lg:inline mr-1">Repetition</span>
                  <span className="lg:hidden mr-1">Repeat</span>
                  <div className="cursor-pointer" onClick={() => requestSort("frequency")}>
                    <Icon
                      icon={sortConfig.key === "frequency" ?
                        (sortConfig.direction === "ascending" ? "heroicons:arrow-up" : "heroicons:arrow-down") :
                        "heroicons:arrows-up-down"}
                      className="w-3.5 h-3.5 text-gray-400"
                    />
                  </div>
                </div>
              </th>
              <th className="w-[140px] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden lg:inline">Assignees</span>
                <span className="lg:hidden">Users</span>
              </th>
              <th
                className="w-[95px] px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => requestSort("startDate")}
              >
                <div className="flex items-center">
                  <span className="mr-1">Start</span>
                  <div className="cursor-pointer">
                    <Icon
                      icon={sortConfig.key === "startDate" ?
                        (sortConfig.direction === "ascending" ? "heroicons:arrow-up" : "heroicons:arrow-down") :
                        "heroicons:arrows-up-down"}
                      className="w-3.5 h-3.5 text-gray-400"
                    />
                  </div>
                </div>
              </th>
              <th
                className="w-[95px] px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => requestSort("endDate")}
              >
                <div className="flex items-center">
                  <span className="mr-1">End</span>
                  <div className="cursor-pointer">
                    <Icon
                      icon={sortConfig.key === "endDate" ?
                        (sortConfig.direction === "ascending" ? "heroicons:arrow-up" : "heroicons:arrow-down") :
                        "heroicons:arrows-up-down"}
                      className="w-3.5 h-3.5 text-gray-400"
                    />
                  </div>
                </div>
              </th>
              <th className="w-[80px] px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="w-[35px] px-1 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E1E1E1] dark:bg-slate-800 dark:divide-slate-700">
            {sortedTasks.length > 0 ? (
              sortedTasks.map((task, index) => (
                <RecurringTaskRow
                  key={task._id || task.id}
                  task={task}
                  index={index}
                  isEven={index % 2 === 0}
                  selectedTasks={selectedRecurringTasks}
                  editingTaskId={editingTaskId}
                  inputRefs={inputRefs}
                  loading={loading}
                  users={users}
                  projects={projects}
                  getProjectNameFromId={getProjectNameFromId}
                  dispatch={dispatch}
                  onRowClick={handleRowClick}
                  handleContextMenu={handleContextMenu}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="px-2 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                >
                  No recurring tasks found. Create a new recurring task to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden min-h-[calc(100vh-100px)]">
        {recurringTasks.length > 0 ? (
          <div className="divide-y divide-[#E1E1E1] dark:divide-slate-700 mt-1">
            {recurringTasks.map((task, index) => (
              <div
                key={task._id || `task-${index}`}
                className={`p-2 ${index % 2 === 0
                  ? "bg-white dark:bg-slate-800"
                  : "bg-white dark:bg-slate-800/50"
                  } ${selectedRecurringTasks.includes(task._id)
                    ? "bg-blue-100 dark:bg-blue-700/30"
                    : ""
                  } ${emptyTaskWarning && task.isNewTask && (!task.taskName || task.taskName.trim() === "")
                    ? "border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10"
                    : ""
                  }`}
                id={`recurring-task-row-${task._id}`}
                onClick={() => onRowClick(task)}
                onContextMenu={(e) => handleContextMenu(e, task)}
              >
                {/* Main Row - Task Name and Project */}
                <div className="flex">
                  <div className="flex-grow">
                    <div className="flex gap-2 items-start mb-1">
                      {/* Status indicator or checkbox for selection */}
                      <div className="flex-shrink-0" onClick={(e) => {
                        e.stopPropagation();
                        dispatch(toggleRecurringTaskSelection(task._id || task.id));
                      }}>
                        <input
                          type="checkbox"
                          className="form-checkbox rounded text-blue-500 focus:ring-blue-500 w-3.5 h-3.5"
                          checked={selectedRecurringTasks.includes(task._id || task.id)}
                          onChange={() => { }}
                        />
                      </div>

                      {/* Task Name and Project */}
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {getLimitedWords(task.taskName, 15) || "Untitled Recurring Task"}
                          </span>
                          <span className="ml-1 text-blue-600 dark:text-blue-400">
                            &gt; {replaceNoProject(getLimitedWords(getProjectNameFromId(task.projectId), 10)) || "Untitled Project"}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons for new tasks */}
                      {(task.initial || String(task._id).startsWith("new-recurring-")) && (
                        <button
                          className="px-3 py-1 text-xs rounded-lg text-white bg-[#7A39FF] hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Use the same handleSaveTask method from RecurringTaskRow
                            const payload = {
                              _id: task._id,
                              taskName: task.taskName,
                              start_date: task.start_date,
                              end_date: task.end_date,
                              frequency: task.frequency,
                              interval: task.interval,
                              company: task.company,
                              assigned_users: task.assigned_users,
                              project: task.projectId,
                              description: task.description || "",
                              userInfo: useSelector((state) => state.auth.user), // Get user info from Redux
                            };
                            dispatch(createRecurringTask(payload));
                          }}
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Row - Frequency, Dates, Assignees */}
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    {/* Frequency */}
                    <div className="text-xs text-gray-600 dark:text-slate-300">
                      <span className="font-medium">Frequency:</span> {formatFrequency(task.frequency, task.interval)}
                    </div>

                    {/* Dates */}
                    <div className="text-xs text-gray-600 dark:text-slate-300">
                      {formatDate(task.start_date)} - {formatDate(task.end_date)}
                    </div>
                  </div>

                  {/* Assignees */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-gray-600 dark:text-slate-300">
                      <span className="font-medium">Assignees:</span>
                    </div>
                    <div className="flex -space-x-2">
                      {(task.assigned_users || [])
                        .map((userId) => users.find((u) => u._id === userId))
                        .filter(Boolean)
                        .slice(0, 3) // Show max 3 users on mobile
                        .map((user, idx, arr) => (
                          <div
                            key={user._id}
                            className="w-6 h-6 rounded-full border border-white shadow"
                            style={{ zIndex: arr.length - idx }}
                            title={user.name || user.email}
                          >
                            <ProfilePicture
                              user={user}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                        ))}
                      {/* Show +X more if more than 3 assignees */}
                      {(task.assigned_users || []).length > 3 && (
                        <div className="w-6 h-6 flex items-center justify-center rounded-full border border-white bg-gray-200 text-gray-600 font-bold text-xs shadow">
                          +{(task.assigned_users || []).length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No recurring tasks found. Create a new recurring task to get started.
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={getContextMenuItems(contextMenu.task)}
        task={contextMenu.task}
      />

      {/* Delete confirmation modal */}
      {showDeleteModal && taskToDelete && (
        <div className="fixed inset-0 z-[112] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex flex-col items-center">
              <div className="bg-[#FFEAE7] rounded-full p-2 mb-4">
                <Icon
                  icon="fluent:error-circle-48-regular"
                  className="text-customRed-50"
                  width="30"
                  height="30"
                />
              </div>
              <h3 className="text-lg font-bold mb-2 text-center">Delete Recurring Task</h3>
              <p className="text-sm text-center mb-4">
                Are you sure you want to delete <b>{taskToDelete.taskName || "this recurring task"}</b>?<br />
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 rounded-md px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="flex-1 rounded-md px-3 py-1 bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Task Bottom Bar */}
      <RecurringTaskBottomBar
        selectedTasks={selectedRecurringTasks}
        deleteRecurringTasks={handleDeleteRecurringTasks}
        closeBottomBar={() => dispatch(clearSelectedRecurringTasks())}
        bulkLoading={bulkLoading}
        modalIsOpen={modalIsOpen}
        setModalIsOpen={setModalIsOpen}
      />

      {/* Recurring Task Panel */}
      {selectedTask && (
        <RecurringTaskPanel
          task={selectedTask}
          isOpen={isPanelVisible}
          onClose={handleClosePanel}
          projects={projects}
          users={users}
        />
      )}
    </div>
  );
};

export default RecurringTaskTable; 