import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  fetchTasks,
  fetchTaskById,
  fetchTaskBySearch,
  fetchRecurringTasks,
  setActiveTab,
  setActiveTaskTab,
  setFilters,
  setPage,
  setPageSize,
  toggleTaskSelection,
  selectAllTasks,
  setSelectedTask,
  toggleTaskPanel,
  togglePanelVisibility,
  updateTaskCommentCount,
  clearSelectedTasks,
  deleteBulkTasks,
  bulkUpdateTasks,
  deleteBulkRecurringTasks,
  clearSelectedRecurringTasks,
} from "../store/tasksSlice";
import { fetchTaskStatuses } from "../store/taskStatusSlice";
import { fetchProjects } from "@/store/projectsSlice";
import { fetchUsers } from "@/store/usersSlice";
import TaskHeader from "./TaskHeader";
import TaskTable from "./TaskTable";
import RecurringTaskTable from "./RecurringTaskTable";
import TaskTableSkeleton from "./TaskTableSkeleton";
import TasksPageSkeleton from "./TasksPageSkeleton";
import TaskPanel from "./TaskPanel";
import RecurringTaskPanel from "./RecurringTaskPanel";
import TaskPanelSkeleton from "./TaskPanelSkeleton";
import BottomBar from "./BottomBar";
import RecurringTaskBottomBar from "./RecurringTaskBottomBar";
import Card from "@/components/ui/Card";
import SimpleBar from "simplebar-react";
import { Icon } from "@iconify/react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import AttachmentViewer from "@/components/Task/AttachmentViewer";
import SidelineDatabaseTab from "@/features/tasks/components/SidelineDatabaseTab";

// TaskTableContainer component to isolate table rendering and loading
const TaskTableContainer = React.memo(({
  tasks,
  recurringTasks,
  loading,
  recurringTasksLoading,
  isRecurringTabActive,
  projects,
  onRowClick,
  isTableLoading,
  scrollContainerRef
}) => {
  // Only re-render when these specific props change
  // Show skeleton ONLY when initially loading with no tasks (not while scrolling/loading more)
  const shouldShowSkeleton = (loading && tasks.length === 0) || (isTableLoading && tasks.length === 0);

  return (
    <>
      {shouldShowSkeleton ? (
        <TaskTableSkeleton />
      ) : (
        <>
          {/* Conditional rendering based on active tab */}
          {isRecurringTabActive ? (
            recurringTasksLoading && recurringTasks.length === 0 ? (
              <TaskTableSkeleton />
            ) : (
              <RecurringTaskTable
                tasks={recurringTasks}
                projects={projects}
                onRowClick={onRowClick}
              />
            )
          ) : (
            <TaskTable
              tasks={tasks}
              projects={projects}
              onRowClick={onRowClick}
              scrollContainerRef={scrollContainerRef}
            />
          )}
        </>
      )}
    </>
  );
});

// Add CSS for improving sidebar tabs
const tabStyles = {
  container:
    "flex items-center text-sm font-medium transition-colors duration-200",
  activeTab: "text-primary-500 font-semibold",
  inactiveTab:
    "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white",
  iconWrapper: "flex-shrink-0 w-5 h-5 mr-2.5",
  textWrapper: "truncate",
};

// Custom hook to handle filter changes without causing full component re-render
const useFilterChangeHandler = (filters, isFixingUrl, initialUrlProcessed, dispatch, setIsTableLoading, searchParams, initializationFetchRef) => {
  const abortControllerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const prevFiltersRef = useRef(null); // Initialize as null to detect first change
  const prevSearchParamsRef = useRef(new URLSearchParams());

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(window.location.search);
    const prevSearchParams = prevSearchParamsRef.current;

    // Check if only taskId parameter changed (ignore taskId changes for pagination)
    const currentWithoutTaskId = new URLSearchParams(currentSearchParams);
    currentWithoutTaskId.delete('taskId');
    currentWithoutTaskId.delete('isFocused');

    const prevWithoutTaskId = new URLSearchParams(prevSearchParams);
    prevWithoutTaskId.delete('taskId');
    prevWithoutTaskId.delete('isFocused');

    const onlyTaskIdChanged = currentWithoutTaskId.toString() === prevWithoutTaskId.toString() &&
      currentSearchParams.get('taskId') !== prevSearchParams.get('taskId');

    // Skip if only taskId changed to prevent pagination reset when opening/closing task panels
    if (isFixingUrl || !initialUrlProcessed) {
      // Don't set prevFiltersRef here - keep it null for first load detection
      // Only update search params to track URL changes
      prevSearchParamsRef.current = currentSearchParams;
      return;
    }

    // Skip if only taskId changed (opening/closing task panel shouldn't reset pagination)
    if (onlyTaskIdChanged) {
      prevFiltersRef.current = filters;
      prevSearchParamsRef.current = currentSearchParams;
      return;
    }

    // Check if filters actually changed
    // On first load (prevFiltersRef is null), we should fetch
    const isFirstLoad = prevFiltersRef.current === null;
    const filtersChanged = !isFirstLoad && JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);

    // Skip if filters haven't changed and this is not the first load
    if (!isFirstLoad && !filtersChanged) {
      prevFiltersRef.current = filters;
      prevSearchParamsRef.current = currentSearchParams;
      return;
    }

    // Prevent duplicate fetches - if already fetching, skip
    if (isFetchingRef.current) {
      return;
    }

    // Prevent double fetching: if initialization already triggered a fetch for first load, skip
    // This prevents both initialization useEffect and useFilterChangeHandler from fetching
    if (isFirstLoad && initializationFetchRef && initializationFetchRef.current) {
      // Initialization already handled the fetch, just update refs
      prevFiltersRef.current = filters;
      prevSearchParamsRef.current = currentSearchParams;
      return;
    }

    isFetchingRef.current = true;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller
    abortControllerRef.current = new AbortController();

    setIsTableLoading(true);

    // Dispatch the fetchTasks action - always start from page 1 when filters change
    // Use 30 tasks for initial load
    dispatch(
      fetchTasks({
        pageNo: 1,
        forceRefresh: true,
        append: false, // Don't append, replace tasks
        signal: abortControllerRef.current.signal,
        customPageSize: 30, // Load 30 tasks initially
      }),
    ).finally(() => {
      setIsTableLoading(false);
      isFetchingRef.current = false;
    });

    // Update URL parameters (without page number)
    updateURLParameters(filters);

    // Update refs for next comparison
    prevFiltersRef.current = filters;
    prevSearchParamsRef.current = currentSearchParams;

  }, [
    filters,
    isFixingUrl,
    initialUrlProcessed,
    dispatch,
    setIsTableLoading,
    searchParams, // Add searchParams to dependencies to track URL changes
  ]);

  // Helper function to update URL parameters (removed pagination params)
  const updateURLParameters = (currentFilters) => {
    const newParams = new URLSearchParams(window.location.search);

    // Check if URL might be malformed (contains "/tasks?taskId=")
    const fullUrl = window.location.href;
    if (fullUrl.includes("/tasks?taskId=") && fullUrl.includes("page=")) {
      // Don't update URL params if we have a malformed URL that's being fixed
      return;
    }

    // Add filters to URL
    if (currentFilters.userId) newParams.set("userId", currentFilters.userId);
    if (currentFilters.projectId) newParams.set("projectId", currentFilters.projectId);
    if (currentFilters.priority) newParams.set("priority", currentFilters.priority);
    if (currentFilters.assignById) newParams.set("assignById", currentFilters.assignById);
    if (currentFilters.collaboratorId)
      newParams.set("collaboratorId", currentFilters.collaboratorId);
    if (currentFilters.isImported) newParams.set("isImported", "true");
    if (currentFilters.isRecurring) newParams.set("isRecurring", "true");

    // Remove page parameter - we don't use it anymore with infinite scroll
    newParams.delete("page");

    // Update URL without triggering a page reload
    window.history.replaceState({}, '', `?${newParams.toString()}`);
  };

  return {
    abortControllerRef,
  };
};

const TasksPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Add CSS styles for better tab display
  useEffect(() => {
    // Create and insert a style tag for custom tab styling
    const styleTag = document.createElement("style");
    styleTag.textContent = `
      /* Improved tab styling */
      .task-header-tabs {
        display: flex;
        justify-content: flex-start;
        width: 100%;
        overflow-x: auto;
      }

      .task-header-tabs .task-tab {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: auto;
        padding-left: 6px;
        padding-right: 6px;
      }

      @media (min-width: 768px) and (max-width: 1099px) {
        .task-header-tabs .task-tab {
          max-width: 100px;
        }
      }

      @media (min-width: 1100px) {
        .task-header-tabs .task-tab {
          max-width: 150px;
        }
      }

      .task-header-tabs .task-tab-icon {
        flex-shrink-0;
        margin-right: 6px;
      }

      .task-header-tabs .task-tab-active {
        font-weight: 600;
        color: #7A39FF;
      }

      .task-header-tabs .task-tab-inactive {
        color: #64748b;
      }

      .task-header-tabs .task-tab-active .task-tab-icon {
        color: #7A39FF;
      }

      /* Tab tooltip styling */
      .custom-tippy .tippy-box {
        border-radius: 6px !important;
        font-size: 12px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
      }

      .custom-tippy .tippy-box[data-theme="light"] {
        background-color: #fff !important;
        color: #334155 !important;
        border: 1px solid #e2e8f0 !important;
      }

      .custom-tippy .tippy-box[data-theme="dark"] {
        background-color: #1e293b !important;
        color: #f8fafc !important;
      }

      /* Support dark mode for tooltips */
      html.dark .custom-tippy .tippy-box[data-theme="light"] {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border: 1px solid #334155 !important;
      }

      /* Tab indicator styling */
      .task-header-tabs .task-tab-indicator {
        position: absolute;
        bottom: -1px;
        left: 0;
        height: 2px;
        width: 100%;
        background-color: #7A39FF;
        border-radius: 1px 1px 0 0;
      }

      .dark .task-header-tabs .task-tab-inactive {
        color: #94a3b8;
      }

      .dark .task-header-tabs .task-tab-inactive:hover {
        color: #e2e8f0;
      }

      /* Fixed pagination styles */
      .simplebar-content-wrapper {
        padding-bottom: 20px !important;
      }

      .pagination-container {
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 10;
        background-color: #fff;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
      }

      .dark .pagination-container {
        background-color: #1e293b;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(styleTag);

    // Clean up function
    return () => {
      if (styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
  }, []);

  // Redux state
  const {
    tasks,
    selectedTasks,
    selectedTask,
    isTaskPanelOpen,
    isPanelVisible,
    loading,
    loadingMore,
    filters,
    pagination,
    recurringTasks,
    recurringTasksLoading,
    selectedRecurringTasks,
    recurringTasksPagination, // <-- add this
  } = useSelector((state) => state.tasks);
  const { user: userInfo } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);
  const { users } = useSelector((state) => state.users);
  const { statuses } = useSelector((state) => state.taskStatus);

  // Local state
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState("");
  const [isCopy, setIsCopy] = useState(false);

  // Infinite scroll refs
  const scrollContainerRef = useRef(null);
  const loadingMoreRef = useRef(false);

  // State for task panel loading
  const [isTaskPanelLoading, setIsTaskPanelLoading] = useState(false);

  // Get taskId from URL search params
  const taskId = searchParams.get("taskId");
  const fromProject = searchParams.get("from_project") === "true";

  // Determine if tasks are loaded
  const isTasksLoaded = !loading && tasks.length > 0;

  // Find the selected task based on taskId from URL, but only after tasks are loaded
  const matchedTask = useMemo(() => {
    if (!taskId) return null;
    // Even if tasks aren't fully loaded, check what we have so far
    return tasks.find((task) => String(task.taskId) === String(taskId));
  }, [taskId, tasks]);

  // View Attachment
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(0);
  const [attachmentsForView, setAttachmentsForView] = useState([]);

  //import task
  const [showImportModal, setShowImportModal] = useState(false);
  const [fields, setFields] = useState([
    { dbField: "Task Name", column: null },
    // { dbField: "Task Status", column: null },
    { dbField: "Description", column: null },
    // { dbField: "Project Name", column: "projectname" },
    // { dbField: "Email", column: "email" },
    // { dbField: "Address", column: "address" },
    // { dbField: "State", column: "state" },
    // { dbField: "Zip Code", column: "zip" },
  ]);

  // New state for recurring tasks
  const [recurringTasksLoaded, setRecurringTasksLoaded] = useState(false);

  // Check if recurring tab is active - use both tab and isRecurring flag
  const isRecurringTabActive =
    filters.tab === "recurring" || filters.isRecurring === true;

  // Save template
  const [savedEffect, setSavedEffect] = useState(false);

  const handleAttachmentOpen = (index) => {
    setCurrentAttachment(index);
    setIsAttachmentViewerOpen(true);
  };

  // Load recurring tasks when the recurring tab is active
  useEffect(() => {
    if (isRecurringTabActive && !recurringTasksLoaded) {
      dispatch(
        fetchRecurringTasks({
          pageNo: recurringTasksPagination.currentPage,
          pageSize: recurringTasksPagination.pageSize,
        }),
      )
        .then((result) => {
          setRecurringTasksLoaded(true);
        })
        .catch((error) => {
          console.error("Error fetching recurring tasks:", error);
          setRecurringTasksLoaded(false);
        });
    }
  }, [
    isRecurringTabActive,
    recurringTasksLoaded,
    dispatch,
    recurringTasksPagination.currentPage,
    recurringTasksPagination.pageSize,
  ]);

  // Reset recurring tasks loaded state when tab changes
  useEffect(() => {
    if (!isRecurringTabActive) {
      setRecurringTasksLoaded(false);
    }
  }, [isRecurringTabActive]);

  // Clear selected tasks when page changes and selected tasks don't exist on current page
  useEffect(() => {
    if (!loading && selectedTasks.length > 0 && tasks.length > 0) {
      // Get all task IDs from the current page
      const currentTaskIds = tasks.map(task => task._id);

      // Check if any of the selected tasks exist on the current page
      const hasSelectedTasksOnCurrentPage = selectedTasks.some(selectedId =>
        currentTaskIds.includes(selectedId)
      );

      // If none of the selected tasks exist on this page, clear the selection
      if (!hasSelectedTasksOnCurrentPage) {
        dispatch(clearSelectedTasks());
      }
    }
  }, [tasks, selectedTasks, loading, dispatch]);

  // Clear selected recurring tasks when page changes and they don't exist on current page
  useEffect(() => {
    if (!recurringTasksLoading && selectedRecurringTasks.length > 0 && recurringTasks.length > 0) {
      // Get all recurring task IDs from the current page
      const currentRecurringTaskIds = recurringTasks.map(task => task._id || task.id);

      // Check if any of the selected recurring tasks exist on the current page
      const hasSelectedRecurringTasksOnCurrentPage = selectedRecurringTasks.some(selectedId =>
        currentRecurringTaskIds.includes(selectedId)
      );

      // If none of the selected recurring tasks exist on this page, clear the selection
      if (!hasSelectedRecurringTasksOnCurrentPage) {
        dispatch(clearSelectedRecurringTasks());
      }
    }
  }, [recurringTasks, selectedRecurringTasks, recurringTasksLoading, dispatch]);

  // Track processed taskIds to prevent re-processing
  const processedTaskIdRef = useRef(null);

  // Direct fix for panel opening - simplified, robust logic
  useEffect(() => {

    // Only run this effect if we have a taskId and not in recurring tab in the URL
    // IMPORTANT: Don't run if loading to prevent cascade effects
    if (taskId && !loading && !isRecurringTabActive && !loadingMore) {

      // Skip if we've already processed this taskId successfully
      if (processedTaskIdRef.current === taskId && isTaskPanelOpen) {
        return;
      }

      // Look for the task in our loaded tasks
      const foundTask = tasks.find(
        (task) => String(task.taskId) === String(taskId),
      );

      if (foundTask) {
        // Always open panel for found task, regardless of previous state
        if (!isTaskPanelOpen || selectedTask?.taskId !== taskId) {
          // Direct, sequential panel opening
          dispatch(setSelectedTask(foundTask));
          dispatch(toggleTaskPanel(true));
          dispatch(togglePanelVisibility(true));
          processedTaskIdRef.current = taskId; // Mark as processed
        }
      } else {
        // Task not found in loaded tasks - attempt to fetch it
        // This handles both cases: when tasks are loaded but task not found, and when no tasks loaded yet (shared links)
        if (!isTaskPanelLoading && (!selectedTask || String(selectedTask.taskId) !== String(taskId))) {
          setIsTaskPanelLoading(true);

          dispatch(fetchTaskBySearch(taskId))
            .then((result) => {
              if (fetchTaskBySearch.fulfilled.match(result)) {
                // Task was found and added to Redux state
                // The reducer already sets it as selectedTask and opens the panel
                setIsTaskPanelLoading(false);
                processedTaskIdRef.current = taskId; // Mark as processed

                // Note: We don't need to refresh the task list anymore 
                // The task is now available in selectedTask and the panel will show it
                // Refreshing would reset pagination and cause the bug we're fixing
              } else {
                // Task wasn't found
                toast.error("Task not found");

                // Remove from URL
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("taskId");
                navigate(`?${newParams.toString()}`, { replace: true });

                setIsTaskPanelLoading(false);
              }
            })
            .catch((error) => {
              console.error("Error fetching task:", error);
              toast.error("Failed to load task");

              // Remove from URL
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("taskId");
              navigate(`?${newParams.toString()}`, { replace: true });

              setIsTaskPanelLoading(false);
            });
        }
      }
    }

    // Reset processed taskId when taskId changes
    if (!taskId) {
      processedTaskIdRef.current = null;
    }
  }, [
    taskId,
    tasks,
    loading,
    loadingMore,
    isTaskPanelOpen,
    dispatch,
    searchParams,
    navigate,
    isTaskPanelLoading,
    isRecurringTabActive,
    selectedTask?.taskId,
    // REMOVED pagination.currentPage - this was causing the effect to run every time page changed!
  ]);

  // Custom styles for Select component
  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: "#ccc",
      "&:hover": { borderColor: "lightgray" },
    }),
    option: (provided, state) => ({
      ...provided,
      color: "black",
      backgroundColor: state.isSelected ? "lightgray" : "white",
      "&:hover": {
        backgroundColor: "lightgray",
      },
    }),
  };

  // Add a flag to track URL changes
  const [isFixingUrl, setIsFixingUrl] = useState(false);
  const [initialUrlProcessed, setInitialUrlProcessed] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  // Track if initialization useEffect has triggered a fetch to prevent double fetching
  const initializationFetchRef = useRef(false);

  // Initialize data on component mount
  useEffect(() => {
    // Fetch initial data
    dispatch(fetchProjects());
    dispatch(fetchUsers());
    dispatch(fetchTaskStatuses());

    // Fix for malformed URLs like "tasks?page=2/tasks?taskId=26427"
    const fullUrl = window.location.href;
    const malformedMatch = fullUrl.match(/\/tasks\?taskId=(\d+)/);

    if (malformedMatch && fullUrl.includes("page=")) {
      setIsFixingUrl(true); // Set flag to prevent further URL changes

      const taskIdFromMalformed = malformedMatch[1];

      // Set correct URL without page parameter
      navigate(`/tasks?taskId=${taskIdFromMalformed}`, {
        replace: true,
      });

      // After a short delay, allow URL updates again
      setTimeout(() => {
        setIsFixingUrl(false);
        setInitialUrlProcessed(true);
      }, 100);

      return;
    }

    // Set up URL parameters (removed page param for infinite scroll)
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    const priority = searchParams.get("priority");
    const assignById = searchParams.get("assignById");
    const collaboratorId = searchParams.get("collaboratorId");
    const isImported = searchParams.get("isImported") === "true";
    const fromProjectParam = searchParams.get("from_project") === "true";

    // Initialize filters from URL
    const initialFilters = {};
    if (userId) initialFilters.userId = userId;
    if (projectId) initialFilters.projectId = projectId;

    if (priority) initialFilters.priority = priority;
    if (assignById) initialFilters.assignById = assignById;
    if (collaboratorId) initialFilters.collaboratorId = collaboratorId;
    if (isImported) initialFilters.isImported = isImported;
    if (fromProjectParam) initialFilters.fromProject = fromProjectParam;

    // Set initial filters (page is always 1 for infinite scroll)
    if (Object.keys(initialFilters).length > 0) {
      dispatch(setFilters(initialFilters));
    }

    // Determine active tab from URL parameters
    let activeTab = "all";

    // Check for recurring tab parameter first
    const isRecurringParam = searchParams.get("isRecurring") === "true";

    if (isRecurringParam) {
      activeTab = "recurring";
    } else if (userId && !assignById && !collaboratorId && !isImported) {
      activeTab = "my";
    } else if (assignById && !collaboratorId && !isImported) {
      activeTab = "assigned";
    } else if (collaboratorId && !isImported) {
      activeTab = "mentioned";
    } else if (isImported) {
      activeTab = "imported";
    }

    // If we have URL parameters that indicate a specific tab (like userId), 
    // but we're currently on recurring tab, we should switch to the appropriate tab
    // unless the URL explicitly has isRecurring=true
    if (!isRecurringParam && isRecurringTabActive && (userId || assignById || collaboratorId || isImported)) {
      // Override the recurring tab state with the URL-based tab
      if (userId && !assignById && !collaboratorId && !isImported) {
        activeTab = "my";
      } else if (assignById && !collaboratorId && !isImported) {
        activeTab = "assigned";
      } else if (collaboratorId && !isImported) {
        activeTab = "mentioned";
      } else if (isImported) {
        activeTab = "imported";
      }
    }

    // Set active tab (page is always 1 for infinite scroll)
    if (activeTab !== filters.tab) {
      dispatch(setActiveTab({ tabId: activeTab, userId: userInfo?._id }));
    }

    // Store timeout IDs for cleanup
    let timeoutId1 = null;
    let timeoutId2 = null;

    // IMPORTANT: When fromProject=true, we need to explicitly fetch tasks because
    // the useFilterChangeHandler won't trigger since no "real" filters changed
    if (fromProjectParam && !userId && !projectId && !assignById && !collaboratorId && !isImported) {
      // This is coming from project page with no specific filters
      // We need to fetch initial tasks with from_project context
      timeoutId1 = setTimeout(() => {
        initializationFetchRef.current = true; // Mark that we're fetching
        dispatch(fetchTasks({
          pageNo: 1,
          forceRefresh: true,
          append: false,
          customPageSize: 30
        })).then(() => {
          setInitialFetchDone(true);
        }).catch(() => {
          setInitialFetchDone(true);
        });
      }, 100); // Small delay to ensure filters are set
    } else {
      // For normal initial load, ensure we fetch tasks if no filters were set from URL
      // This handles the case where filters don't change but we still need to load tasks
      timeoutId1 = setTimeout(() => {
        if (Object.keys(initialFilters).length === 0) {
          // No URL filters, fetch with default filters
          initializationFetchRef.current = true; // Mark that we're fetching
          dispatch(fetchTasks({
            pageNo: 1,
            forceRefresh: true,
            append: false,
            customPageSize: 30
          })).then(() => {
            setInitialFetchDone(true);
          }).catch(() => {
            setInitialFetchDone(true);
          });
        } else {
          // Filters were set from URL - give useFilterChangeHandler time to process
          // It will fetch on first load (when prevFiltersRef is null)
          // Mark as done after a delay to allow the handler to trigger
          timeoutId2 = setTimeout(() => {
            setInitialFetchDone(true);
          }, 200); // Give useFilterChangeHandler time to run
        }
      }, 150); // Small delay to ensure filters are set in Redux
    }

    setInitialUrlProcessed(true);

    // Cleanup function to clear timeouts if component unmounts
    return () => {
      if (timeoutId1) clearTimeout(timeoutId1);
      if (timeoutId2) clearTimeout(timeoutId2);
    };
  }, []);

  useEffect(() => {
    if (showImportModal) setShowImportModal(false);
  }, [location]);

  // URL parameter updates are now handled by useFilterChangeHandler hook

  // Use custom hook to handle filter changes
  const {
    abortControllerRef: filterAbortControllerRef,
  } = useFilterChangeHandler(
    filters,
    isFixingUrl,
    initialUrlProcessed,
    dispatch,
    setIsTableLoading,
    searchParams,
    initializationFetchRef
  );

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loading || loadingMore || !pagination.hasMore || isRecurringTabActive) {
      return;
    }

    // Don't trigger if we don't have any tasks yet (initial load)
    if (tasks.length === 0) {
      return;
    }

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    // Load more when user scrolls near the bottom
    // Allow scrolling when there's actual scroll distance or when content fills the container
    if (distanceFromBottom < 300 && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      const nextPage = pagination.currentPage + 1;

      dispatch(setPage(nextPage));
      dispatch(
        fetchTasks({
          pageNo: nextPage,
          forceRefresh: false,
          append: true,
          customPageSize: 20, // Load 20 tasks on scroll
        }),
      ).finally(() => {
        loadingMoreRef.current = false;
      });
    }
  }, [dispatch, loading, loadingMore, pagination.hasMore, pagination.currentPage, isRecurringTabActive, tasks.length]);

  // Attach scroll listener with throttling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isRecurringTabActive) {
      return;
    }

    let throttleTimer = null;
    let rafId = null;
    const throttledScroll = () => {
      if (throttleTimer) return;

      // Cancel previous animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      // Use requestAnimationFrame for smooth scroll handling
      rafId = requestAnimationFrame(() => {
        throttleTimer = setTimeout(() => {
          handleScroll();
          throttleTimer = null;
        }, 150); // Throttle to 150ms for smoother performance
      });
    };

    container.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', throttledScroll);
    };
  }, [handleScroll, isRecurringTabActive, pagination, tasks.length]);

  // Handle row click to open task panel
  const handleRowClick = (task, e, taskId, targetTab = null) => {

    setIsTaskPanelLoading(true);
    dispatch(setSelectedTask(task));

    // Always set panel visibility to true
    dispatch(togglePanelVisibility(true));

    // For regular tasks, also set the task panel open
    if (!isRecurringTabActive) {
      dispatch(toggleTaskPanel(true));
    }

    // If a specific tab is requested via targetTab param (icon click)
    if (targetTab) {
      // Format the tab name correctly for TaskDescriptionComments
      const formattedTab =
        targetTab === "comments"
          ? "comments"
          : targetTab === "attachments"
            ? "all-attachments"
            : targetTab;

      dispatch(setActiveTaskTab(formattedTab));
    } else {
      // If just clicking the row, reset the active tab
      dispatch(setActiveTaskTab(null));
    }

    // Update URL with taskId - only for regular tasks that have taskId
    if (task.taskId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("taskId", task.taskId);
      navigate(`?${newParams.toString()}`, { replace: true });
    }

    setTimeout(() => {
      setIsTaskPanelLoading(false);
    }, 500);
  };

  // No pagination handlers needed for infinite scroll

  // Handle task panel close
  const handleClosePanel = () => {
    // Close both types of panels
    dispatch(toggleTaskPanel(false));
    dispatch(togglePanelVisibility(false));
    dispatch(setSelectedTask(null));

    // Remove taskId from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("taskId");
    newParams.delete("isFocused");

    // Check if we need to load tasks when closing panel from shared link
    if (tasks.length === 0 && !loading) {
      // Reset pagination state first, then fetch tasks
      dispatch(setPage(1));
      dispatch(fetchTasks({ pageNo: 1, forceRefresh: true, append: false, customPageSize: 30 }));
    }

    if (fromProject) {
      navigate(`?${newParams.toString()}`, { replace: true });
    } else {
      navigate(`?${newParams.toString()}`, { replace: true });
    }
  };

  // Handle comment count update
  const handleCommentCountUpdate = (taskId, newCount) => {
    dispatch(updateTaskCommentCount({ taskId, newCount }));
  };

  // Handle bulk actions
  const handleBulkUpdate = useCallback(
    async (updateData) => {
      if (!selectedTasks || selectedTasks.length === 0) {
        toast.error("No tasks selected for update");
        return;
      }

      setBulkLoading(true);
      try {
        // Use the Redux action to update tasks
        const resultAction = await dispatch(
          bulkUpdateTasks({
            taskIds: selectedTasks,
            updateData,
          }),
        );

        // Check if the action was fulfilled
        if (bulkUpdateTasks.fulfilled.match(resultAction)) {
          toast.success("Tasks updated successfully");

          // Clear selected tasks
          dispatch(clearSelectedTasks());
          setModalIsOpen("");
        } else {
          throw new Error(
            resultAction.error?.message || "Failed to update tasks",
          );
        }
      } catch (error) {
        console.error("Error updating tasks:", error);
        toast.error(error.message || "Failed to update tasks");
      } finally {
        setBulkLoading(false);
      }
    },
    [selectedTasks, dispatch],
  );

  // Delete tasks
  const deleteTasks = async () => {
    // setBulkLoading(true);
    try {
      await dispatch(deleteBulkTasks(selectedTasks)).unwrap();

      // No need to fetchTasks - Redux reducer already removes tasks from state
      toast.success(`${selectedTasks.length} ${selectedTasks.length === 1 ? "task" : "tasks"} deleted successfully`);

    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Failed to delete tasks");
    } finally {
      setBulkLoading(false);
      setModalIsOpen("");
    }
  };

  // Delete recurring tasks
  const handleDeleteRecurringTasks = async () => {
    if (!selectedRecurringTasks.length) {
      toast.error("No recurring tasks selected for deletion");
      return;
    }

    setBulkLoading(true);
    try {
      await dispatch(deleteBulkRecurringTasks(selectedRecurringTasks)).unwrap();
      toast.success("Selected recurring tasks deleted successfully", {
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error deleting recurring tasks:", error);
      toast.error("Failed to delete selected recurring tasks", {
        autoClose: 3000,
      });
    } finally {
      setBulkLoading(false);
      setModalIsOpen("");
    }
  };

  const exportTasks = useCallback(() => {
    if (!selectedTasks || selectedTasks.length === 0) {
      toast.error("No tasks selected for export");
      return;
    }

    // Helper to format date as dd/mm/yyyy
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // fallback to raw if invalid
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Helper to format status
    const formatStatus = (status) => {
      if (!status) return "";
      return status
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    };

    // Prepare CSV header
    const csvHeader = [
      "Task ID",
      "TaskName",
      "Project",
      "Priority",
      "Due Date",
      "Status",
    ];

    // Prepare CSV rows
    const csvRows = [csvHeader];
    selectedTasks.forEach((taskId) => {
      const task = tasks.find((t) => t._id === taskId);
      if (task) {
        csvRows.push([
          task.taskCode || "",
          task.taskName || "",
          task.projectName || "",
          task.priority || "",
          formatDate(task.dueDate),
          formatStatus(task.taskPosition),
        ]);
      }
    });

    // Convert to CSV string
    const csvContent = csvRows
      .map((row) =>
        row
          .map((field) => '"' + String(field).replace(/"/g, '""') + '"')
          .join(","),
      )
      .join("\r\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "tasks_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Tasks exported successfully");
  }, [selectedTasks, tasks]);

  const copyTasks = useCallback(() => {
    if (!selectedTasks || selectedTasks.length === 0) {
      toast.error("No tasks selected for copy");
      return;
    }

    // Get the taskIds for the selected tasks
    const selectedTasksData = tasks.filter((task) =>
      selectedTasks.includes(task._id),
    );

    // Here you would copy task links to clipboard with the correct path
    const baseUrl = `${window.location.origin}/tasks`;
    const urls = selectedTasksData
      .map((task) => `${baseUrl}?taskId=${task.taskId}`)
      .join("\n");

    navigator.clipboard
      .writeText(urls)
      .then(() => {
        setIsCopy(true);
        toast.success("Task links copied to clipboard");
        setTimeout(() => {
          setIsCopy(false);
        }, 1000);
      })
      .catch(() => {
        toast.error("Failed to copy task links");
      });
  }, [selectedTasks, tasks]);

  const closeBottomBar = useCallback(() => {
    dispatch(clearSelectedTasks());
  }, [dispatch]);

  // Safety check: If tasks haven't loaded after initial processing, fetch them
  // Use ref to track tasks length to avoid stale closure
  const tasksLengthRef = useRef(tasks.length);
  useEffect(() => {
    tasksLengthRef.current = tasks.length;
  }, [tasks.length]);

  useEffect(() => {
    // Only run this safety check if:
    // 1. URL has been processed
    // 2. We're not currently loading
    // 3. We have no tasks
    // 4. Initial fetch hasn't been marked as done
    // 5. We're not in recurring tab
    if (
      initialUrlProcessed &&
      !loading &&
      !loadingMore &&
      tasksLengthRef.current === 0 &&
      !initialFetchDone &&
      !isRecurringTabActive
    ) {
      // Wait a bit more to see if useFilterChangeHandler triggers
      const safetyTimer = setTimeout(() => {
        // Double-check we still have no tasks using ref to avoid stale closure
        if (tasksLengthRef.current === 0 && !loading && !loadingMore) {
          console.log('Safety fetch: No tasks loaded, fetching with default filters');
          initializationFetchRef.current = true; // Mark that we're fetching
          dispatch(fetchTasks({
            pageNo: 1,
            forceRefresh: true,
            append: false,
            customPageSize: 30,
          })).then(() => {
            setInitialFetchDone(true);
          }).catch(() => {
            setInitialFetchDone(true);
          });
        }
      }, 500); // Wait 500ms after initial processing

      return () => clearTimeout(safetyTimer);
    }
  }, [initialUrlProcessed, loading, loadingMore, initialFetchDone, isRecurringTabActive, dispatch, initializationFetchRef]);

  // Show full page skeleton loader only on initial page load (when no tasks exist yet)
  // This prevents full page skeleton when filtering - only shows on true initial load
  if (loading && tasks.length === 0 && !isTableLoading && !initialUrlProcessed) {
    return <TasksPageSkeleton />;
  }

  const handleTabClick = (tabId) => {
    let apiTabId = tabId;
    if (tabId === "all") apiTabId = "RecentTask";
    if (tabId === "my") apiTabId = "MyTask";
    if (tabId === "assigned") apiTabId = "AssignedTask";
    if (tabId === "mentioned") apiTabId = "MentionedTask";
    if (tabId === "recurring") apiTabId = "RecurringTask";
    if (tabId === "imported") apiTabId = "ImportedTask";

    dispatch(
      setActiveTab({
        tabId: apiTabId,
        userId: userInfo?._id,
      }),
    );
  };

  return (
    <>
      <ToastContainer />
      {showImportModal ? (
        <div>
          <SidelineDatabaseTab
            fields={fields}
            setFields={setFields}
            setshowCsv={setShowImportModal}
            getAllTasks={() => dispatch(fetchTasks({ forceRefresh: true, customPageSize: 30 }))}
            handleTabClick={handleTabClick}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 mt-2">
          <div className="pb-0">
            <div className="px-[17px] md:px-[10px] lg:px-[17px] pt-0">
              {/* Task Header with tabs */}
              <TaskHeader
                setShowImportModal={setShowImportModal}
                savedEffect={savedEffect}
                fromProject={fromProject}
              />
            </div>
          </div>

          {/* Main content with infinite scroll */}
          <div
            ref={scrollContainerRef}
            className="flex flex-col h-[calc(100vh-180px)] overflow-y-auto"
            style={{
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
            }}
          >
            <div className="flex-1">
              <Card
                bodyClass="p-0"
                className="border-0 shadow-none -mt-2"
              >
                <div>
                  <TaskTableContainer
                    tasks={tasks}
                    recurringTasks={recurringTasks}
                    loading={loading}
                    recurringTasksLoading={recurringTasksLoading}
                    isRecurringTabActive={isRecurringTabActive}
                    projects={projects}
                    onRowClick={handleRowClick}
                    isTableLoading={isTableLoading}
                    scrollContainerRef={scrollContainerRef}
                  />

                  {/* Loading more indicator */}
                  {loadingMore && !isRecurringTabActive && (
                    <div className="flex items-center justify-center py-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <Icon icon="eos-icons:loading" className="w-5 h-5 animate-spin" />
                        <span>Loading more tasks...</span>
                      </div>
                    </div>
                  )}

                  {/* End of list indicator */}
                  {!loadingMore && !loading && !pagination.hasMore && tasks.length > 0 && !isRecurringTabActive && (
                    <div className="flex items-center justify-center py-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Showing all {pagination.totalCount} tasks
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Debug Panel State */}

          {/* Task Panel */}
          {selectedTask && !isRecurringTabActive && (
            <TaskPanel
              task={selectedTask}
              isOpen={isPanelVisible}
              onClose={handleClosePanel}
              projects={projects}
              handleAttachmentOpen={handleAttachmentOpen}
              setAttachmentsForView={setAttachmentsForView}
              isAttachmentViewerOpen={isAttachmentViewerOpen}
              updateTaskCommentCount={handleCommentCountUpdate}
            />
          )}

          {/* Recurring Task Panel */}
          {isRecurringTabActive && isPanelVisible && (
            <RecurringTaskPanel
              task={selectedTask}
              isOpen={isPanelVisible}
              onClose={handleClosePanel}
              projects={projects}
              users={users}
            />
          )}

          {/* Bottom Bar for bulk actions */}
          {selectedTasks.length > 0 && !isRecurringTabActive && (
            <BottomBar
              selectedTasks={selectedTasks}
              deleteTasks={deleteTasks}
              exportTasks={exportTasks}
              copyTasks={copyTasks}
              closeBottomBar={closeBottomBar}
              bulkLoading={bulkLoading}
              modalIsOpen={modalIsOpen}
              setModalIsOpen={setModalIsOpen}
              getAllTasks={() => dispatch(fetchTasks({ forceRefresh: true, customPageSize: 30 }))}
              users={users}
              projects={projects}
              handleBulkUpdate={handleBulkUpdate}
              taskStatuses={
                statuses && statuses.length > 0
                  ? statuses
                  : [
                    { status: "pending", label: "Pending", color: "#6c757d" },
                    {
                      status: "in_progress",
                      label: "In Progress",
                      color: "#3092F5",
                    },
                    {
                      status: "completed",
                      label: "Completed",
                      color: "#2DE072",
                    },
                    {
                      status: "not_started_yet",
                      label: "Not Started",
                      color: "#ed8936",
                    },
                    { status: "on_hold", label: "On Hold", color: "#e53e3e" },
                  ]
              }
              isCopy={isCopy}
              savedEffect={savedEffect}
              setSavedEffect={setSavedEffect}
            />
          )}

          {/* Bottom Bar for recurring task bulk actions */}
          {isRecurringTabActive && selectedRecurringTasks.length > 0 && (
            <RecurringTaskBottomBar
              selectedTasks={selectedRecurringTasks}
              deleteRecurringTasks={handleDeleteRecurringTasks}
              exportTasks={exportTasks}
              closeBottomBar={() => dispatch(clearSelectedRecurringTasks())}
              bulkLoading={bulkLoading}
              modalIsOpen={modalIsOpen}
              setModalIsOpen={setModalIsOpen}
              closePanel={handleClosePanel}
              selectedTaskId={selectedTask?._id || selectedTask?.id}
            />
          )}

          {/* Attachment Viewer */}
          {isAttachmentViewerOpen && (
            <AttachmentViewer
              attachments={attachmentsForView && attachmentsForView}
              initialIndex={currentAttachment}
              open={isAttachmentViewerOpen}
              onClose={() => setIsAttachmentViewerOpen(false)}
            />
          )}
        </div>
      )}
    </>
  );
};

export default TasksPage;
