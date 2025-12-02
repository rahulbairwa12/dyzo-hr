import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatLocalDateToDayMonth, getCurrentDate } from '@/helper/helper';
import MyTasksListSkeleton from './MyTasksListSkeleton';
import ModernTooltip from '@/components/ui/ModernTooltip';
import { Icon } from '@iconify/react';
import { useSelector, useDispatch } from 'react-redux';
import { ProfilePicture } from '@/components/ui/profilePicture';
import { useNavigate, Link } from 'react-router-dom';
import { fetchAuthGET, fetchAuthFilePut } from '@/store/api/apiSlice';
import Button from '@/components/ui/Button';
import { djangoBaseURL } from '@/helper';
import { updateTaskInState, createTask } from "@/features/tasks/store/tasksSlice";
import confetti from "canvas-confetti";
import { enforceSubscriptionLimit } from '@/store/planSlice';

// Custom debounce hook
const useCustomDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedFn = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Add cancel method
  debouncedFn.cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
};

const MyTasks = ({ activeTab, setActiveTab, setOpenedTask, handleTaskClose }) => {
  const userInfo = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    dateRange: {
      startDate: "",
      endDate: "",
    },
    taskPosition: null,
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [taskCountData, setTaskCountData] = useState([]);
  // New states for task creation
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [isCreating, setIsCreating] = useState(false); // track creation status
  const inputRef = useRef(null);
  const taskCreationMap = useRef({});
  const debounceTimerRef = useRef(null); // timer for debouncing
  const [category, setCategory] = useState('upcoming');

  const tabs = [
    { label: "Upcoming", value: "upcoming", count: taskCountData.find(t => t.label === "Upcoming")?.count || 0 },
    { label: "Past Due", value: "past_due", count: taskCountData.find(t => t.label === "Past Due")?.count || 0 },
    { label: "Completed", value: "completed", count: taskCountData.find(t => t.label === "Completed")?.count || 0 },
  ];

  const tabRefs = useRef([]);

  const fetchTaskCount = async () => {
    try {
      setLoading(true);
      const response = await fetchAuthGET(
        `${djangoBaseURL}/task-count/company/${userInfo.companyId}/${userInfo._id}/`,
        false
      );
      if (response.status === 1) {
        setTaskCountData(response.data);
      }
    } catch (error) {
      console.error("Error fetching task count:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchMyTasks = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let url;
      if (isLoadMore && nextUrl) {
        url = nextUrl;
      } else {
        url = `${djangoBaseURL}/api/employee/tasks/?category=${category}&page=1&page_size=9&userId=${userInfo._id}`;
      }

      const response = await fetchAuthGET(url, false);

      if (isLoadMore) {
        setTasks(prev => [...prev, ...response?.results]);
      } else {
        if (response?.results?.length > 0) {
          setTasks(response?.results);
        } else {
          setTasks([]);
        }
      }

      setNextUrl(response?.next);
      setHasMore(!!response?.next);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchMyTasks()
    fetchTaskCount();
  }, [handleTaskClose])

  // Listen for global task creation to prepend item at top
  useEffect(() => {
    const handleTaskCreated = (e) => {
      const created = e?.detail?.task;
      if (!created) return;
      // Only show in current category if it belongs here (new tasks considered upcoming/pending by default)
      setTasks(prev => [created, ...prev]);
      // Optimistically bump Upcoming count
      updateTabCount('Upcoming', 1);
    };
    window.addEventListener('global-task-created', handleTaskCreated);
    return () => window.removeEventListener('global-task-created', handleTaskCreated);
  }, []);


  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 5 && hasMore && !loadingMore && !loading) {
      fetchMyTasks(true);
    }
  };

  const handleTabClick = (tabIndex) => {
    const tab = tabs[tabIndex];
    setActiveTab(tabIndex);
    setCategory(tab.value);
    // Scroll the clicked tab into view
    if (tabRefs.current[tabIndex]) {
      tabRefs.current[tabIndex].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  // Helper to update tab counts optimistically
  const updateTabCount = (label, delta) => {
    setTaskCountData(prev => prev.map(tab =>
      tab.label === label ? { ...tab, count: (tab.count || 0) + delta } : tab
    ));
  };

  const handleToggleComplete = async (task, e) => {
    e.stopPropagation();
    let newPosition;
    if (task.taskPosition === "completed" || task.taskPosition === "Completed") {
      newPosition = "pending";
    } else {
      newPosition = "completed";
    }
    // Optimistically update UI and counts
    setTasks(prevTasks => prevTasks.filter(t => t._id !== task._id));
    if (category === 'upcoming') updateTabCount('Upcoming', -1);
    if (category === 'past_due') updateTabCount('Past Due', -1);
    if (newPosition === 'completed') updateTabCount('Completed', 1);
    if (newPosition === 'pending' && (category === 'completed')) {
      updateTabCount('Completed', -1);
      // Decide which tab to increment based on due date
      if (task.dueDate && new Date(task.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
        updateTabCount('Past Due', 1);
      } else {
        updateTabCount('Upcoming', 1);
      }
    }
    dispatch(
      updateTaskInState({
        ...task,
        taskPosition: newPosition,
      })
    );
    if (newPosition === "completed") {
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.5 },
        colors: ["#0F6FFF", "#A026FF", "#6d42f8", "#9333ea", "#2DE072"],
        disableForReducedMotion: true,
      });
    }
    try {

      const apiUrl = `${djangoBaseURL}/task/${task._id}/${userInfo._id}/`;
      const formData = new FormData();
      formData.append("taskPosition", newPosition);
      const data = await fetchAuthFilePut(apiUrl, {
        body: formData,
      });
      if (!data.status) {
        throw new Error(data.message || "Failed to update task status");
      }
      // No need to refetch tasks, already handled optimistically
    } catch (error) {
      // Revert UI state and counts if API call fails
      setTasks(prevTasks => [task, ...prevTasks]);
      if (category === 'upcoming') updateTabCount('Upcoming', 1);
      if (category === 'past_due') updateTabCount('Past Due', 1);
      if (newPosition === 'completed') updateTabCount('Completed', -1);
      if (newPosition === 'pending' && (category === 'completed')) {
        updateTabCount('Completed', 1);
        // Revert which tab was incremented
        if (task.dueDate && new Date(task.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
          updateTabCount('Past Due', -1);
        } else {
          updateTabCount('Upcoming', -1);
        }
      }
      dispatch(
        updateTaskInState({
          ...task,
          taskPosition: task.taskPosition,
        })
      );
    }
  };

  // Create task function
  const createNewTask = useCallback((taskName) => {
    if (!taskName.trim()) return;
    // Generate a unique temporary ID
    const newTaskId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Check if this task is already being created
    if (taskCreationMap.current[newTaskId]) {
      return;
    }
    // Mark this task as being created
    taskCreationMap.current[newTaskId] = true;
    setIsCreating(true);
    // Create new task object
    const newTask = {
      _id: newTaskId,
      taskId: "-",
      taskName: taskName,
      projectId: userInfo.default_project, // Can be updated with default project if needed
      userId: userInfo?._id,
      taskPosition: "not_started_yet",
      initial: false,
      dueDate: new Date().toISOString().split('T')[0], // Today's date as default
      collaborators: [userInfo._id],
      assigned_users: [userInfo._id],
    };
    // Add to local state first for immediate UI update
    setTasks(prevTasks => [newTask, ...prevTasks]);
    // Optimistically increment Upcoming count
    updateTabCount('Upcoming', 1);
    // Create the task on server
    dispatch(
      createTask({
        _id: newTaskId,
        taskName: taskName,
        userId: userInfo?._id,
        projectId: userInfo.default_project,
        taskPosition: "not_started_yet",
        priority: "low",
        dueDate: new Date().toISOString().split('T')[0],
        initial: false,
        collaborators: [userInfo._id],
      })
    )
      .then((result) => {
        setIsCreating(false);
        if (result.meta.requestStatus === "fulfilled") {
          const updatedTask = { ...newTask, ...result.payload, _id: result.payload.taskId, taskId: result.payload.taskId };
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task._id === newTaskId
                ? updatedTask
                : task
            )
          );
          delete taskCreationMap.current[newTaskId];
        } else {
          setTasks(prevTasks => prevTasks.filter(task => task._id !== newTaskId));
          updateTabCount('Upcoming', -1); // revert count
          delete taskCreationMap.current[newTaskId];
        }
      })
      .catch(() => {
        setIsCreating(false);
        setTasks(prevTasks => prevTasks.filter(task => task._id !== newTaskId));
        updateTabCount('Upcoming', -1); // revert count
        delete taskCreationMap.current[newTaskId];
      });
    setNewTaskName("");
    setIsAddingTask(false);
  }, [dispatch, userInfo]);

  // Handle input change with manual debounce (3 seconds)
  const handleNewTaskInputChange = (e) => {
    const value = e.target.value;
    setNewTaskName(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer only if input has non-whitespace characters
    if (value.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        createNewTask(value.trim());
      }, 3000);
    }
  };

  // Handle key press for new task input
  const handleNewTaskKeyDown = (e) => {
    if (e.key === "Enter" && newTaskName.trim()) {
      e.preventDefault();
      // Clear timer and create task immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      createNewTask(newTaskName.trim());
    } else if (e.key === "Escape") {
      // Cancel task creation
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setNewTaskName("");
      setIsAddingTask(false);
    }
  };

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Focus input when adding task
  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTask]);

  useEffect(() => {
    fetchMyTasks();
    fetchTaskCount();
  }, []);

  useEffect(() => {
    // Reset pagination when category changes
    setNextUrl(null);
    setHasMore(true);
    fetchMyTasks();
  }, [category]);

  const isRecentTasksTab = tabs[activeTab]?.label === 'Recent Tasks';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 pr-1 min-h-[508px] border-2 dark:border-slate-700 dark:border border-neutral-50">
      <div className='pr-5'>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ProfilePicture user={userInfo} className="w-7 h-7 rounded-full mr-3 object-cover" />
            <span className="font-semibold xl:text-xl text-lg text-customBlack-50 dark:text-customWhite-50">My tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              name="refresh"
              title="Refresh"
              className={`text-[#a78bfa] transition-transform duration-200 text-2xl ${loading ? 'animate-spin cursor-not-allowed opacity-50' : ''}`}
              onClick={() => {
                fetchMyTasks();
                fetchTaskCount();
              }}
              disabled={loading}
            >
              <Icon icon="icons8:refresh" width="24" height="24" />
            </button>
            <Button
              icon="heroicons-outline:plus"
              text="Add Task"
              className="bg-white dark:bg-electricBlue-50 dark:border-slate-700 dark:border text-electricBlue-100 dark:text-white py-1.5 px-3 rounded-md flex items-center border-2 border-solid border-neutral-50 "
              iconClass="font-bold text-lg mr-1"
              onClick={() => {
                const allowed = dispatch(enforceSubscriptionLimit());
                if (!allowed) return;
                setIsAddingTask(true);
              }}
            />
          </div>
        </div>
        <div className="flex xl:gap-6 gap-2 border-b-2 dark:border-slate-700 dark:border-b-1 border-neutral-50  overflow-x-auto hide-scrollbar">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              ref={el => tabRefs.current[idx] = el}
              className={`pb-2 xl:text-base text-sm whitespace-nowrap font-medium transition-all duration-150 ${activeTab === idx
                ? 'text-customBlack-50 dark:text-customWhite-50 border-b-2 border-customBlack-50 dark:border-slate-700 dark:border-b'
                : 'text-customGray-100 dark:text-customGray-150 font-normal border-b-2 border-transparent'}`}
              onClick={() => handleTabClick(idx)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>
      <div className='flex flex-col justify-between min-h-[396px]'>
        {loading && !isAddingTask ? (
          <MyTasksListSkeleton skeletonRows={Array.from({ length: 7 })} />
        ) : (
          <ul
            className="list-none p-0 m-0 divide-y-2 dark:divide-slate-700 dark:divide-y divide-neutral-50  max-h-[396px] overflow-y-auto pr-3.5"
            onScroll={handleScroll}
          >
            {/* New task input field */}
            {isAddingTask && (
              <li className="grid grid-cols-[auto_1fr_max-content] gap-2 items-center py-3 text-[16px] bg-gray-50 dark:bg-slate-700">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-customGray-150 flex items-center justify-center">
                  <Icon
                    icon="bi:check"
                    className="w-3 h-3 text-gray-400 dark:text-customGray-150"
                  />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTaskName}
                    onChange={handleNewTaskInputChange}
                    onKeyDown={handleNewTaskKeyDown}
                    placeholder="Type task name and press Enter..."
                    className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-medium text-customBlack-50 dark:text-customWhite-50"
                    autoFocus
                  />
                </div>
                <span className="text-customGreen-50 xl:text-base text-sm font-medium">
                  {formatLocalDateToDayMonth(new Date())}
                </span>
              </li>
            )}

            {/* Existing tasks */}
            {tasks && tasks.length > 0 ? tasks.map((t, i) => (
              <li key={i} className="grid grid-cols-12 gap-2 items-center py-3 text-[16px] cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600"
                onClick={() => setOpenedTask(t)}
              >
                {t.taskPosition === "completed" ? (
                  <div
                    className="col-span-1 w-4 h-4 rounded-full bg-[#2DE072] flex items-center justify-center cursor-pointer"
                    onClick={(e) => handleToggleComplete(t, e)}
                  >
                    <Icon
                      icon="bi:check"
                      className="w-3 h-3 text-white"
                    />
                  </div>
                ) : (
                  <div
                    className="col-span-1 w-4 h-4 rounded-full border-2 border-gray-300 dark:border-customGray-150 flex items-center justify-center cursor-pointer hover:border-[#68B984] hover:bg-[#68B984] hover:bg-opacity-10"
                    onClick={(e) => handleToggleComplete(t, e)}
                  >
                    <Icon
                      icon="bi:check"
                      className="w-3 h-3 text-gray-400 dark:text-customGray-150 hover:text-[#68B984]"
                    />
                  </div>
                )}
                <div className="col-span-9">
                  <ModernTooltip content={<span className='dark:text-white font-normal'>{t.projectName + " > " + t.taskName}</span>} placement="top" >
                    <div className="min-w-0 overflow-hidden cursor-pointer transition-colors">
                      <span className={`xl:text-base block text-sm font-medium text-customBlack-50 dark:text-customWhite-50 relative truncate  ${t.taskPosition === "completed" ? "completed-task-vertical-line" : ""}`}>
                        {t.taskName}
                      </span>
                      <Link
                        to={`/tasks?userId=${userInfo._id}&projectId=${t.projectId}`}
                        className="text-sm text-neutral-300 dark:text-customGray-150 hover:underline"
                        onClick={e => e.stopPropagation()}
                      >
                        {t.projectName || "My Workspace"}
                      </Link>
                    </div>
                  </ModernTooltip>
                </div>
                <span className={`col-span-2 text-customGreen-50 text-sm font-medium ${t.dueDate && new Date(t.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) ? 'text-red-500' : ''}`}>
                  {t.dueDate ? formatLocalDateToDayMonth(t.dueDate) : 'No due date'}
                </span>
              </li>
            )) : isRecentTasksTab && tasks && tasks.length === 0 && !isAddingTask ? (
              <div className={`flex flex-col items-center py-6 w-full ${isRecentTasksTab ? 'mt-6 sm:mt-10' : ''} px-2`}>
                <div className="text-sm xl:text-base mb-2 text-customGray-300 dark:text-customGray-150 text-center w-full max-w-xs sm:max-w-md">
                  <b>Stay organized and focused - </b>create a new task and get one step closer to done.
                </div>
                <Button
                  icon="heroicons-outline:plus"
                  text="Add New Task"
                  className="bg-white dark:bg-electricBlue-50 text-electricBlue-100 dark:text-white py-1.5 px-3 rounded-md flex items-center border-2 border-solid border-neutral-50 dark:border-customGray-150 mt-2"
                  iconClass="font-bold text-lg mr-1"
                  onClick={() => setIsAddingTask(true)}
                />
                <div className="w-full space-y-3 mt-6">
                  <MyTasksListSkeleton skeletonRows={Array.from({ length: 3 })} />
                </div>
              </div>
            ) : !isAddingTask && (
              <div className='flex flex-col items-center py-6 mt-20'>
                <Icon icon="hugeicons:task-done-01" className='text-electricBlue-50 dark:text-customWhite-50' width="50" height="50" />
                <span className='font-semibold pt-5 text-customBlack-50 dark:text-customWhite-50'> No Task Found</span>
              </div>
            )}

            {/* Loading more indicator */}
            {loadingMore && (
              <li className="flex justify-center items-center py-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-electricBlue-50 dark:border-customGray-150"></div>
                  <span className="text-sm text-gray-500 dark:text-customGray-150">Loading more tasks...</span>
                </div>
              </li>
            )}

            {/* End of list indicator */}
            {!hasMore && tasks && tasks.length > 0 && (
              <li className="flex justify-center items-center py-3">
                <span className="text-sm text-gray-400 dark:text-customGray-150">No more tasks to load</span>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyTasks;