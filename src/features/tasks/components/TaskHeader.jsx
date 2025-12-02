import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import {
  setActiveTab,
  setFilters,
  addTask,
  createTask,
  searchTasks,
  fetchTasks,
  setEmptyTaskWarning,
  addRecurringTask,
  clearSelectedTasks,
} from "../store/tasksSlice";
import { fetchTaskStatuses } from "../store/taskStatusSlice";
import moment from "moment";
import dayjs from "dayjs";
import Select, { components } from "react-select";
import makeAnimated from "react-select/animated";
import { fetchUsers } from "@/store/usersSlice";
import { fetchProjects } from "@/store/projectsSlice";
import { fetchAuthGET } from "@/store/api/apiSlice";
import { useLocation, useNavigate } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import CustomMenuList from "@/components/ui/CustomMenuList";
import { intialLetterName } from "@/helper/helper";
import { debounce } from "lodash";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import AddTaskPopUp from "@/components/Task/AddTaskPopup";
import AddProject from "@/components/Projects/AddProject";
import SidelineDatabaseTab from "@/features/tasks/components/SidelineDatabaseTab";
import SubscriptionLimitModal from "@/components/subscription/SubscriptionLimitModal";
import { setShowLimitModal, enforceSubscriptionLimit } from "@/store/planSlice";
import { ProfilePicture } from "@/components/ui/profilePicture";
import { toast } from "react-toastify";


// Updated tabs to match the image
const tabs = [
  { id: "my", label: "Tasks", icon: "heroicons:user" },
  { id: "recurring", label: "Repetitive Tasks", icon: "heroicons:arrow-path" },
  { id: "imported", label: "Imported Tasks", icon: "lucide:import" },
];

// FilterTag component for displaying filter tags
const FilterTag = ({ label, onRemove }) => {
  return (
    <div className="inline-flex items-center rounded-full bg-white border border-[#8E2EFF] dark:border-[#8E2EFF] dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-0.5 text-xs">
      <span className="font-medium">{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1.5 text-gray-500"
          aria-label="Remove filter"
        >
          <Icon icon="heroicons:x-mark" className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};

// Add the animated components
const animatedComponents = makeAnimated();

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "high", label: "High", color: "#DC3464" },
  { value: "medium", label: "Medium", color: "#FFB800" },
  { value: "low", label: "Low", color: "#FF5F1F" },
];

// Key used to persist task filters in localStorage (must match slice)
const STORAGE_KEY = "taskFilters";

const TaskHeader = ({ setShowImportModal, savedEffect, fromProject = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const projectSelectRef = useRef(null);
  const { filters, pagination, tasks } = useSelector((state) => state.tasks);
  const { user: userInfo } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);
  const { users } = useSelector((state) => state.users);
  const { statuses } = useSelector((state) => state.taskStatus);
  const { currentTaskNameInput } = useSelector((state) => state.tasks);
  const [fetchProject, setFetchProjects] = useState(false);
  const [fetchUser, setFetchUser] = useState(false);

  // Add state for project modal
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddTaskPopUp, setShowAddTaskPopUp] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [importMode, setImportMode] = useState("csv");
  const [showImportModal, setShowImportModalLocal] = useState(false);
  const { subscriptionData } = useSelector((state) => state.plan);



  const activeTab = filters.tab;

  const [isMobileView, setIsMobileView] = useState(false);
  const [screenSize, setScreenSize] = useState({
    isXl: false,
    isLg: false,
    isMd: false,
    isCustom: false,
  });

  // Filter state - set default based on view size
  const [showFilters, setShowFilters] = useState(!isMobileView);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [value, setValue] = useState({ startDate: "", endDate: "" });
  // Track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState({
    status: false,
    project: false,
    assignee: false,
    priority: false
  });
  const [activeFilters, setActiveFilters] = useState({
    date: false,
    status: false,
    repetition: false,
    project: false,
    employee: false,
    priority: false,
  });

  // Pending filter changes state - only applied when clicking Apply button
  const [pendingFilters, setPendingFilters] = useState({
    dateRange: { startDate: "", endDate: "" },
    userId: "",
    projectId: "",
    taskPosition: [],
    repeat: "",
    priority: "",
    searchQuery: "",
  });

  // Search state
  const [searchValue, setSearchValue] = useState("");
 


  // Favourite Project
  const favouriteIds = userInfo?.fav_projects || [];
  // Split into favourites and non-favourites
  const favouriteProjects = projects.filter((p) => favouriteIds.includes(p._id));
  const otherProjects = projects.filter((p) => !favouriteIds.includes(p._id));

  // Debounced search function - memoized to prevent recreating on every render
  const debouncedSearch = useRef(null);
  
  if (!debouncedSearch.current) {
    debouncedSearch.current = debounce((query) => {
      const trimmedQuery = query.trim();

      // Update URL parameters in the debounced function (not immediately)
      const searchParams = new URLSearchParams(location.search);
      if (trimmedQuery) {
        searchParams.set("search", trimmedQuery);
      } else {
        searchParams.delete("search");
      }
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });

      // Update Redux filters with the search query (this will trigger useFilterChangeHandler)
      dispatch(setFilters({
        ...filters,
        searchQuery: trimmedQuery,
      }));
    }, 500);
  }

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;

    setSearchValue(query);

    // Update pending filters to keep them in sync
    setPendingFilters((prev) => ({
      ...prev,
      searchQuery: query,
    }));

    // Execute debounced search (this will update URL and Redux filters after 1 second)
    debouncedSearch.current(query);
  };

  // Handle window resize to update isMobileView, showFilters, and screenSize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      setIsMobileView(mobile);

      // Update screen size flags
      setScreenSize({
        isXl: width >= 1280,
        isLg: width >= 1024 && width < 1280,
        isMd: width >= 768 && width < 1024,
        isCustom: width >= 1281 && width < 1443,
      });

      // Only toggle filters when crossing the breakpoint
      setShowFilters((prev) => {
        if (mobile && prev) return false; // hide filters on mobile
        if (!mobile && !prev) return true; // show filters on desktop
        return prev; // keep existing state otherwise
      });
    };

    // ✅ Run once after mount for correct initial value
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize filter values from URL or Redux state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Initialize search value from URL parameters
    const searchParam = searchParams.get("search");
    if (searchParam !== null && searchParam !== searchValue) {
      setSearchValue(searchParam);
    } else if (searchParam === null && searchValue !== "") {
      // URL has no search param, but local state has a value - clear local state
      setSearchValue("");
    }

    // Initialize date range
    const startDate =
      searchParams.get("startDate") || filters.dateRange?.startDate;
    const endDate = searchParams.get("endDate") || filters.dateRange?.endDate;
    if (startDate || endDate) {
      setValue({ startDate: startDate || "", endDate: endDate || "" });
      updateActiveFilters("date", true);
    } else {
      // Don't set default date range anymore
      setValue({ startDate: "", endDate: "" });
      updateActiveFilters("date", false);
    }

    // Initialize status filter as an array for multi-select
    const statusParam = searchParams.get("taskStatus");
    let statusValues = [];
    if (statusParam) {
      // Parse comma-separated status values if they exist
      statusValues = statusParam.split(",");
      updateActiveFilters("status", statusValues);
    } else {
      statusValues = filters.taskPosition
        ? Array.isArray(filters.taskPosition)
          ? filters.taskPosition
          : [filters.taskPosition]
        : [];
      updateActiveFilters("status", statusValues);
    }

    // Get project ID from URL or filters
    const projectIdParam = searchParams.get("projectId") || filters.projectId;

    // Get user ID from URL or filters
    const userIdParam = searchParams.get("userId") || filters.userId;

    // Initialize other filters
    updateActiveFilters("project", projectIdParam);
    updateActiveFilters("employee", userIdParam);
    updateActiveFilters("repetition", searchParams.get("repeat"));
    updateActiveFilters("priority", filters.priority);

    // Check if we need to fetch project details
    if (projectIdParam && projects.length > 0) {
      const projectFromParams = projects.find(p => String(p._id) === String(projectIdParam));
      if (projectFromParams) {
        setFetchProjects(projectFromParams);
      }
    }

    // Check if we need to fetch user details
    if (userIdParam && users.length > 0) {
      const userFromParams = users.find(u => String(u._id) === String(userIdParam));
      if (userFromParams) {
        setFetchUser(userFromParams);
      }
    }

    // Initialize pending filters state with current values
    setPendingFilters({
      dateRange: {
        startDate: startDate || "",
        endDate: endDate || "",
      },
      userId: userIdParam || "",
      projectId: projectIdParam || "",
      taskPosition: statusValues,
      repeat: searchParams.get("repeat") || "",
      priority: filters.priority || "",
      searchQuery: searchParam || "",
    });
  }, [location.search, filters.tab, projects, users]);

  // Fetch necessary data on component mount
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchProjects());
  }, [dispatch]);

  // Handle clicks outside dropdown to close it manually
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown.status) {
        // Check if click is outside the select component
        const selectContainer = event.target.closest('.select__control, .select__menu');

        if (!selectContainer) {

          setOpenDropdown(prev => ({ ...prev, status: false }));
        }
      }
    };

    // Add listener with a small delay to avoid catching the opening click
    if (openDropdown.status) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 50);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown.status]);

  // Track active filters
  const updateActiveFilters = (filterType, value) => {
    let isActive = false;

    switch (filterType) {
      case "date":
        isActive = value && (value.startDate || value.endDate);
        break;
      case "status":
        isActive = Array.isArray(value) ? value.length > 0 : !!value;
        break;
      case "repetition":
        isActive = !!value;
        break;
      case "project":
        isActive = !!value && value !== "";
        break;
      case "employee":
        isActive = !!value && value !== "0";
        break;
      case "priority":
        isActive = !!value && value !== "";
        break;
      default:
        isActive = !!value;
    }

    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: isActive,
    }));
  };

  /* --------------------------------------------------------------------------
   * Persisted Filters – READ (hydrate on mount)
   * --------------------------------------------------------------------------*/
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) {
          // Merge saved filters with existing ones to avoid losing data like tab
          const mergedFilters = { ...filters, ...parsed };

          // Dispatch only if something actually changed to avoid loops
          if (JSON.stringify(mergedFilters) !== JSON.stringify(filters)) {
            dispatch(setFilters(mergedFilters));
          }

          /* Sync local component states so UI reflects restored filters immediately */
          setPendingFilters((prev) => ({
            ...prev,
            dateRange: parsed.dateRange || { startDate: "", endDate: "" },
            userId: fromProject ? "" : (parsed.userId || ""),
            projectId: parsed.projectId || "",
            taskPosition: parsed.taskPosition || [],
            repeat: parsed.repeat || "",
            priority: parsed.priority || "",
            searchQuery: parsed.searchQuery || "",
          }));

          // Date range value for datepicker
          if (parsed.dateRange) {
            setValue({
              startDate: parsed.dateRange.startDate || "",
              endDate: parsed.dateRange.endDate || "",
            });
          }

          // Update active filter flags for tag rendering
          updateActiveFilters("date", parsed.dateRange);
          updateActiveFilters("status", parsed.taskPosition);
          updateActiveFilters("repetition", parsed.repeat);
          updateActiveFilters("project", parsed.projectId);
          updateActiveFilters("employee", parsed.userId);
          updateActiveFilters("priority", parsed.priority);
        }
      }
    } catch (error) {
      console.error("Failed to hydrate filters from localStorage", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------------------------
   * Persisted Filters – WRITE (save whenever filters object changes)
   * --------------------------------------------------------------------------*/
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error("Failed to persist filters to localStorage", error);
    }
  }, [filters]);

  const handleTabClick = (tabId) => {
    // Convert tab IDs to match the expected format in the API
    dispatch(clearSelectedTasks());
    let apiTabId = tabId;
    if (tabId === "all") apiTabId = "RecentTask";
    if (tabId === "my") apiTabId = "MyTask";
    if (tabId === "assigned") apiTabId = "AssignedTask";
    if (tabId === "mentioned") apiTabId = "MentionedTask";
    if (tabId === "recurring") apiTabId = "RecurringTask";
    if (tabId === "imported") apiTabId = "ImportedTask";

    // Save current URL parameters that should persist
    const currentParams = new URLSearchParams(location.search);
    const persistentParams = new URLSearchParams();

    // Add parameters that should persist across tab changes
    if (currentParams.has("projectId")) {
      persistentParams.set("projectId", currentParams.get("projectId"));
    }
    if (currentParams.has("priority")) {
      persistentParams.set("priority", currentParams.get("priority"));
    }

    if (currentParams.has("taskPosition")) {
      persistentParams.set("taskPosition", currentParams.get("taskPosition"));
    }
    if (currentParams.has("startDate")) {
      persistentParams.set("startDate", currentParams.get("startDate"));
    }
    if (currentParams.has("endDate")) {
      persistentParams.set("endDate", currentParams.get("endDate"));
    }
    if (currentParams.has("repeat")) {
      persistentParams.set("repeat", currentParams.get("repeat"));
    }

    // Add isRecurring parameter if switching to recurring tab
    if (tabId === "recurring") {
      persistentParams.set("isRecurring", "true");
    } else {
      // Remove isRecurring parameter when switching to other tabs
      persistentParams.delete("isRecurring");
    }

    // Update URL with persistent parameters
    const persistentParamString = persistentParams.toString();
    navigate(`/tasks${persistentParamString ? `?${persistentParamString}` : ""}`, { replace: true });

    // Set the active tab in Redux state
    dispatch(
      setActiveTab({
        tabId: apiTabId,
        userId: userInfo?._id,
      })
    );

    // Close mobile menu if open
    if (showMobileMenu) {
      setShowMobileMenu(false);
    }
  };

  const handleAddTask = () => {
    // enforce subscription limits centrally
    const allowed = dispatch(enforceSubscriptionLimit());
    if (!allowed) return;

    // if (subscriptionData?.subscription_status !== "active") {
    //   dispatch(setShowLimitModal(true));
    //   return null;
    // }

    // Check if we're on the recurring tasks tab
    if (activeTabId === "recurring") {
      // Check if there's already an empty recurring task
      const hasEmptyRecurringTask = tasks.recurringTasks?.some(
        (task) =>
          task.isNewTask && (!task.taskName || task.taskName.trim() === "")
      );

      if (hasEmptyRecurringTask) {
        // Show warning on the empty task
        dispatch(setEmptyTaskWarning(true));

        // Find the first empty recurring task to highlight
        const emptyTask = tasks.recurringTasks.find(
          (task) =>
            task.isNewTask && (!task.taskName || task.taskName.trim() === "")
        );

        // Scroll to the empty task if found
        if (emptyTask) {
          const taskElement = document.getElementById(
            `recurring-task-row-${emptyTask._id}`
          );
          if (taskElement) {
            taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }

        // Hide warning after 4 seconds
        setTimeout(() => {
          dispatch(setEmptyTaskWarning(false));
        }, 4000);

        return;
      }

      // Generate a unique temporary ID for recurring task
      const newTaskId = `new-recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get default project ID
      const defaultProjectId =
        userInfo?.default_project||
        (projects.length > 0 ? projects[0]._id : userInfo.default_project);

      // Create new recurring task object
      const newTask = {
        _id: newTaskId,
        id: newTaskId,
        taskName: "",
        is_active: true,
        isEditing: true,
        projectId: defaultProjectId,
        start_date: moment().format("YYYY-MM-DD"),
        end_date: moment().add(30, 'days').format("YYYY-MM-DD"),
        frequency: "monthly",
        interval: 1,
        company: userInfo?.companyId,
        assigned_users: [userInfo?._id],
        description: "",
        initial: true,
        isNewTask: true,
      };

      // Dispatch action to add recurring task
      dispatch(addRecurringTask(newTask));
      return;
    }
    if (isMobileView) {
      setShowAddTaskPopUp(true);
      return;
    }
    // Check if there's already an empty task

    // Original code for regular tasks
    const hasEmptyTask = tasks?.some(
      (task) =>
        task.isNewTask && (!task.taskName || task.taskName.trim() === "")
    );

    if (hasEmptyTask) {
      // Show warning on the empty task
      dispatch(setEmptyTaskWarning(true));

      // Find the first empty task to highlight
      const emptyTask = tasks.find(
        (task) =>
          task.isNewTask && (!task.taskName || task.taskName.trim() === "")
      );

      // Scroll to the empty task if found
      if (emptyTask) {
        const taskElement = document.getElementById(
          `task-row-${emptyTask._id}`
        );
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      // Hide warning after 3 seconds
      setTimeout(() => {
        dispatch(setEmptyTaskWarning(false));
      }, 4000);
    }

    // Only create a new task if there are no empty tasks
    if (!hasEmptyTask) {
      // Generate a unique temporary ID
      const newTaskId = `new-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Get default project ID
      const defaultProjectId =
        userInfo?.default_project ||
        (projects.length > 0 ? projects[0]._id : userInfo.default_project);

      // Create new task object
      const newTask = {
        _id: newTaskId,
        taskId: "-",
        taskName: "",
        isEditing: true,
        projectId: defaultProjectId,
        userId: userInfo?._id,
        taskPosition: "not_started_yet",
        initial: true,
        isNewTask: true,
        collaborators: [userInfo?._id], // Add collaborators as an array
      };





      // First add the task to the UI for immediate feedback
      dispatch(addTask(newTask));
    }
  };

  const handleValueChange = (selectedDates, dateStr, instance) => {
    let formattedStartDate = "";
    let formattedEndDate = "";

    if (selectedDates && selectedDates.length > 0) {
      formattedStartDate = dayjs(selectedDates[0]).format("YYYY-MM-DD");
      if (selectedDates.length > 1) {
        formattedEndDate = dayjs(selectedDates[1]).format("YYYY-MM-DD");
      }
    }

    setValue({ startDate: formattedStartDate, endDate: formattedEndDate });

    // Update pending filters
    setPendingFilters((prev) => ({
      ...prev,
      dateRange: { startDate: formattedStartDate, endDate: formattedEndDate },
    }));

    // Update active filters state for UI display
    updateActiveFilters("date", !!(formattedStartDate || formattedEndDate));
  };

  // Format users for the dropdown
  const userOptions = users.map((user) => {
    // Create a proper display name (firstName + lastName or just email if no name)
    const displayName = user?.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email?.split("@")[0] ||
      "";

    // Check for profile image in various possible field names
    const profileImage =
      user.profileImg || user.image || user.profilePic || user.avatar || null;

    return {
      value: user._id,
      label: displayName,
      name: displayName,
      image: profileImage,
      email: user.email,
    };
  });

  // Add "All Users" option
  userOptions.unshift({
    value: "0",
    label: "All Users",
    name: "All Users",
  });

  // Add fetched user if it exists and is not already in the list
  if (fetchUser && fetchUser._id) {
    // Check if user already exists in options
    const userExists = userOptions.some(u => String(u.value) === String(fetchUser._id));

    if (!userExists) {
      // Create display name for fetched user
      const displayName =
        `${fetchUser.firstName || fetchUser.first_name || ""} ${fetchUser.lastName || fetchUser.last_name || ""}`.trim() ||
        fetchUser.email?.split("@")[0] ||
        fetchUser.name ||
        "";

      // Check for profile image in various possible field names
      const profileImage =
        fetchUser.profileImg || fetchUser.image || fetchUser.profilePic || fetchUser.profile_picture || fetchUser.avatar || null;

      userOptions.unshift({
        value: fetchUser._id,
        label: displayName,
        name: displayName,
        image: profileImage,
        email: fetchUser.email,
      });
    }
  }

  // Format projects for the dropdown
  // const projectOptions = projects.map((project) => ({
  //   value: project._id,
  //   label: project.name,
  //   projectColor: project.projectColor,
  //   __isAllProjectsOption: false,
  // }));

  let projectOptions = [
    // ...favouriteProjects.map((project) => ({
    //   value: project._id,
    //   label: project.name,
    //   projectColor: project.projectColor,
    //   __isAllProjectsOption: false,
    // })),
    ...projects.map((project) => ({
      value: project._id,
      label: project.name,
      projectColor: project.projectColor,
      __isAllProjectsOption: false,
    })),
  ];

  // Add "All Projects" option
  projectOptions.unshift({
    value: "",
    label: "All Projects",
    projectColor: null,
    __isAllProjectsOption: true,
  });

  // Add fetched project if it exists and is not already in the list
  if (fetchProject && fetchProject._id) {
    // Check if project already exists in options
    const projectExists = projectOptions.some(p => String(p.value) === String(fetchProject._id));

    if (!projectExists) {
      projectOptions.unshift({
        value: fetchProject._id,
        label: fetchProject.name,
        projectColor: fetchProject.projectColor,
        __isAllProjectsOption: false,
      });
    }
  }

  // Helper function to get project label
  const getProjectLabel = (projectId) => {
    // Try to find in projectOptions first
    const matchingProject = projectOptions.find(
      (opt) => opt.value === projectId
    );

    // If found in options, return the label
    if (matchingProject?.label) {
      return matchingProject.label;
    }

    // Otherwise try to find in raw projects data (handling type coercion)
    const projectFromRaw = projects.find(
      (p) => String(p._id) === String(projectId)
    );

    // Return the project name or default text
    return projectFromRaw?.name || "Project";
  };

  // Helper function to get user name
  const getUserLabel = (userId) => {
    // Try to find in userOptions first
    const matchingUser = userOptions.find(
      (opt) => String(opt.value) === String(userId)
    );

    // If found in options, return the label
    if (matchingUser?.label) {
      return matchingUser.label;
    }

    // Check if it's the fetched user
    if (fetchUser && String(fetchUser._id) === String(userId)) {
      return fetchUser.name ||
        `${fetchUser.firstName || fetchUser.first_name || ""} ${fetchUser.lastName || fetchUser.last_name || ""}`.trim() ||
        fetchUser.email?.split("@")[0] ||
        "User";
    }

    // Otherwise try to find in raw users data (handling type coercion)
    const userFromRaw = users.find(
      (u) => String(u._id) === String(userId)
    );

    if (userFromRaw) {
      return userFromRaw.name ||
        `${userFromRaw.firstName || userFromRaw.first_name || ""} ${userFromRaw.lastName || userFromRaw.last_name || ""}`.trim() ||
        userFromRaw.email?.split("@")[0] ||
        "User";
    }

    // Return default text if user not found
    return "User";
  };

  // Repetition Options
  const repetitionOptions = [
    { value: "", label: "All Repetitions" },
    { value: "not_repeatable", label: "Not Repeatable" },
    { value: "everyday", label: "Everyday" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  // Format status options with default values if statuses is undefined or empty
  const statusOptions =
    statuses && statuses.length > 0
      ? [
        { value: "", label: "All Statuses" },
        ...statuses.map((status) => ({
          value:
            status.value || status.status?.toLowerCase().replace(/\s+/g, "_"),
          label: status.status || status.name,
          color: status.color,
        })),
      ]
      : [
        { value: "", label: "All Statuses" },
        {
          value: "not_started_yet",
          label: "Not Started Yet",
          color: "#E0E0E0",
        },
        { value: "in_progress", label: "In Progress", color: "#FFC107" },
        { value: "completed", label: "Completed", color: "#4CAF50" },
        { value: "archive", label: "Archive", color: "#9E9E9E" },
      ];

  // Handle search/filter changes
  const handleSearch = (e, type) => {
    let filterUpdates = {};

    if (type === "userId") {
      if (e.value === "0") {
        filterUpdates.userId = "";
      } else {
        filterUpdates.userId = e.value;
      }
      updateActiveFilters("employee", e.value);
    } else if (type === "taskStatus") {
      if (!e || e.length === 0) {
        // If no statuses selected, clear status filters
        filterUpdates.taskPosition = [];
      } else {
        // Format selected statuses as array of values
        const statusValues = e.map((status) => status.value);
        filterUpdates.taskPosition = statusValues;
      }
      updateActiveFilters("status", e);
    } else if (type === "projectId") {
      if (e.value === "") {
        filterUpdates.projectId = "";
      } else {
        filterUpdates.projectId = e.value;
      }
      updateActiveFilters("project", e.value);
    } else if (type === "repeat") {
      if (!e.value || e.value === "") {
        filterUpdates.repeat = "";
      } else {
        filterUpdates.repeat = e.value;
      }
      updateActiveFilters("repetition", e.value);
    } else if (type === "priority") {
      if (!e.value || e.value === "") {
        filterUpdates.priority = "";
      } else {
        filterUpdates.priority = e.value;
      }
      updateActiveFilters("priority", e.value);
    }

    // Update pending filters instead of applying immediately
    setPendingFilters((prev) => ({
      ...prev,
      ...filterUpdates,
    }));
  };

  const handleResetFilters = () => {
    // Clear URL parameters but preserve from_project context
    const searchParams = new URLSearchParams(location.search);
    const fromProjectParam = searchParams.get('from_project');

    if (fromProject || fromProjectParam) {
      // If from project context, navigate to tasks with from_project parameter
      navigate("/tasks?from_project=true");
    } else {
      // Otherwise, clear all parameters
      navigate("/tasks");
    }

    // Reset active filters
    setActiveFilters({
      date: false,
      status: false,
      repetition: false,
      project: false,
      employee: false,
      priority: false,
    });

    // Reset date picker value
    setValue({ startDate: "", endDate: "" });

    // Reset search value
    setSearchValue("");

    // Reset pending filters
    setPendingFilters({
      userId: fromProject ? "" : userInfo?._id,
      projectId: "",
      taskPosition: [],
      dateRange: { startDate: "", endDate: "" },
      repeat: "",
      priority: "",
      searchQuery: "",
    });

    // Apply the reset filters immediately
    dispatch(
      setFilters({
        userId: fromProject ? "" : userInfo?._id,
        projectId: "",
        taskPosition: [],
        dateRange: { startDate: "", endDate: "" },
        priority: "",
      })
    );
  };

  const handleRemoveFilter = (filterType) => {
    let filterUpdates = {};

    switch (filterType) {
      case "date":
        setValue({ startDate: "", endDate: "" });
        filterUpdates.dateRange = { startDate: "", endDate: "" };

        break;
      case "status":
        filterUpdates.taskPosition = [];
        break;
      case "repetition":
        filterUpdates.repeat = "";
        break;
      case "project":
        filterUpdates.projectId = "";
        break;
      case "employee":
        filterUpdates.userId = "";
        break;
      case "priority":
        filterUpdates.priority = "";
        break;
      default:
        break;
    }

    // Force active filters update
    setActiveFilters((prev) => {
      const newState = { ...prev, [filterType]: false };

      return newState;
    });

    // Update pending filters
    setPendingFilters((prev) => ({
      ...prev,
      ...filterUpdates,
    }));

    // Apply the filter removal immediately
    const newSearchParams = new URLSearchParams(location.search);

    if (filterType === "date") {
      newSearchParams.delete("startDate");
      newSearchParams.delete("endDate");

      // Clear the filter in Redux store with a specific action
      dispatch(
        setFilters({
          ...filters,
          dateRange: { startDate: "", endDate: "" },
        })
      );
    } else if (filterType === "status") {
      newSearchParams.delete("taskStatus");
      newSearchParams.delete("taskPosition");
    } else if (filterType === "repetition") {
      newSearchParams.delete("repeat");
    } else if (filterType === "project") {
      newSearchParams.delete("projectId");
    } else if (filterType === "employee") {
      newSearchParams.delete("userId");
    } else if (filterType === "priority") {
      newSearchParams.delete("priority");
    }

    navigate(`?${newSearchParams.toString()}`, { replace: true });
    dispatch(setFilters({ ...filters, ...filterUpdates }));
  };

  // Map Redux tab state to UI tabs
  const getActiveTabId = () => {
    switch (filters.tab) {
      case "RecentTask":
      case "all":
        return "all";
      case "MyTask":
      case "my":
        return "my";
      case "AssignedTask":
      case "assigned":
        return "assigned";
      case "MentionedTask":
      case "mentioned":
        return "mentioned";
      case "RecurringTask":
      case "recurring":
        return "recurring";
      case "ImportedTask":
      case "imported":
        return "imported";
      default:
        return "my";
    }
  };

  const activeTabId = getActiveTabId();
  const isRecurringTab = activeTabId === "recurring";

  // Custom styles for Select components
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "33px",
      backgroundColor: "var(--select-bg, white)",
      borderColor: "var(--select-border, #E5E7EB)",
      boxShadow: "none",
      "&:hover": {
        borderColor: "var(--select-border-hover, #CBD5E1)",
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      borderRadius: "0.375rem",
    }),
    menuList: (base) => ({
      ...base,
      padding: "0.5rem 0",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "rgba(59, 130, 246, 0.1)"
        : "transparent",
      color: "inherit",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "rgba(243, 244, 246, 1)",
      },
      padding: "0.25rem 1rem",
    }),
    valueContainer: (base) => ({
      ...base,
      height: "33px",
    }),
  };

  // Calculate active filter count for mobile badge
  const activeFilterCount = Object.entries(activeFilters)
  .filter(([key, value]) => key !== "employee" && value)
  .length;

  // Check if any filters are actually applied (from Redux store, not pending)
  const hasActiveFilters = (filters.dateRange && (filters.dateRange.startDate || filters.dateRange.endDate)) ||
    (filters.taskPosition && Array.isArray(filters.taskPosition) && filters.taskPosition.length > 0) ||
    (filters.projectId && filters.projectId !== "") ||
    (filters.priority && filters.priority !== "") ||
    (filters.repeat && filters.repeat !== "");

  // Check if there are any date filters (either pending or applied) - for calendar icon color
  const hasAnyDateFilters =
    (pendingFilters.dateRange?.startDate || pendingFilters.dateRange?.endDate) ||
    (filters.dateRange?.startDate || filters.dateRange?.endDate);

  // Export CSV function
  const handleExportCSV = async () => {
    try {
      // Build query parameters based on active filters
      const params = new URLSearchParams();

      // Add user ID (company employee ID)
      if (userInfo?._id) {
        params.append('userId', userInfo._id);
      }

      // Add active filters
      if (filters.projectId) {
        params.append('projectId', filters.projectId);
      }

      if (filters.userId && filters.userId !== userInfo?._id) {
        params.append('assignedUserId', filters.userId);
      }

      if (filters.taskPosition && Array.isArray(filters.taskPosition) && filters.taskPosition.length > 0) {
        // Join multiple statuses with comma
        params.append('taskPosition', filters.taskPosition.join(','));
      }

      if (filters.priority) {
        params.append('priority', filters.priority);
      }

      if (filters.dateRange?.startDate) {
        params.append('startDate', filters.dateRange.startDate);
      }

      if (filters.dateRange?.endDate) {
        params.append('endDate', filters.dateRange.endDate);
      }

      if (filters.repeat) {
        params.append('repeat', filters.repeat);
      }

      // Add search query if exists
      if (searchValue.trim()) {
        params.append('search', searchValue.trim());
      }

      // Build the export URL
      const exportUrl = `${import.meta.env.VITE_APP_DJANGO}/company/${userInfo?.companyId}/employees/${userInfo?._id}/tasks/export-csv/?${params.toString()}`;

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      toast.success('CSV export started. Download will begin shortly.');

    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV. Please try again.');
    }
  };

  // Apply filters function - called when Apply button is clicked
  const applyFilters = () => {
    // Check for date filters
    const hasDateFilter = !!(
      pendingFilters.dateRange?.startDate || pendingFilters.dateRange?.endDate
    );

    // Update URL parameters
    const searchParams = new URLSearchParams(location.search);

    // Search parameter
    if (pendingFilters.searchQuery && pendingFilters.searchQuery.trim()) {
      searchParams.set("search", pendingFilters.searchQuery.trim());
    } else {
      searchParams.delete("search");
    }

    // Date range parameters
    if (pendingFilters.dateRange?.startDate) {
      searchParams.set("startDate", pendingFilters.dateRange.startDate);
    } else {
      searchParams.delete("startDate");
    }

    if (pendingFilters.dateRange?.endDate) {
      searchParams.set("endDate", pendingFilters.dateRange.endDate);
    } else {
      searchParams.delete("endDate");
    }

    // Status parameters
    if (pendingFilters.taskPosition && pendingFilters.taskPosition.length > 0) {

      searchParams.set("taskPosition", pendingFilters.taskPosition.join(","));
    } else {
      searchParams.delete("taskStatus");
      searchParams.delete("taskPosition");
    }

    // Project parameter
    if (pendingFilters.projectId) {
      searchParams.set("projectId", pendingFilters.projectId);
    } else {
      searchParams.delete("projectId");
    }

    // User parameter
    if (pendingFilters.userId) {
      searchParams.set("userId", pendingFilters.userId);
    } else {
      searchParams.delete("userId");
    }

    // Repetition parameter
    if (pendingFilters.repeat) {
      searchParams.set("repeat", pendingFilters.repeat);
    } else {
      searchParams.delete("repeat");
    }

    // Priority parameter
    if (pendingFilters.priority) {
      searchParams.set("priority", pendingFilters.priority);
    } else {
      searchParams.delete("priority");
    }

    // Recurring parameter
    if (filters.isRecurring) {
      searchParams.set("isRecurring", "true");
    } else {
      searchParams.delete("isRecurring");
    }

    // Update URL

    navigate(`?${searchParams.toString()}`, { replace: true });

    // Update Redux state - using a dedicated variable for dateRange to make sure it's passed correctly
    const dateRangeToApply = {
      startDate: pendingFilters.dateRange?.startDate || "",
      endDate: pendingFilters.dateRange?.endDate || "",
    };

    dispatch(
      setFilters({
        ...filters,
        ...pendingFilters,
        dateRange: dateRangeToApply, // Explicitly set dateRange
      })
    );

    // Force active filters update
    setActiveFilters((prev) => {
      const newState = {
        ...prev,
        date: hasDateFilter,
        status:
          Array.isArray(pendingFilters.taskPosition) &&
          pendingFilters.taskPosition.length > 0,
        project: !!pendingFilters.projectId,
        employee: !!pendingFilters.userId,
        repetition: !!pendingFilters.repeat,
        priority: !!pendingFilters.priority,
      };

      return newState;
    });

    // Always trigger fetch with new filters (and search query if exists)

    dispatch(
      fetchTasks({
        pageNo: pagination.currentPage,
        forceRefresh: true,
        searchQuery: pendingFilters.searchQuery?.trim() || "",
      })
    );
  };

  // Add effect to watch for projectId changes in URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectIdParam = searchParams.get("projectId");

    // Check if the URL is malformed (contains "/tasks?taskId=")
    const fullUrl = window.location.href;
    if (fullUrl.includes("/tasks?taskId=") && fullUrl.includes("page=")) {
      // Skip processing if URL appears to be malformed
      return;
    }

    // Check if projectId param exists and has changed from current filter
    if (projectIdParam && projectIdParam !== filters.projectId) {
      // Update filters with the new projectId
      dispatch(
        setFilters({
          ...filters,
          projectId: projectIdParam,
        })
      );

      // Only fetch tasks if we're not already in a loading state
      if (!pagination.loading) {
        dispatch(
          fetchTasks({
            pageNo: pagination.currentPage,
            forceRefresh: true,
          })
        );
      }

      // Update pending filters state
      setPendingFilters((prev) => ({
        ...prev,
        projectId: projectIdParam,
      }));

      // Update active filters
      updateActiveFilters("project", projectIdParam);

      // Find project details for the projectId in URL
      const projectFromParams = projects.find(p => String(p._id) === String(projectIdParam));
      if (projectFromParams) {
        setFetchProjects(projectFromParams);
      } else if (projectIdParam) {
        // If project not found in current projects list, fetch it individually
        const fetchProjectDetails = async () => {
          try {
            const baseUrl = import.meta.env.VITE_APP_DJANGO;
            const projectData = await fetchAuthGET(`${baseUrl}/project/${projectIdParam}/${userInfo._id}/`);
            if (projectData && projectData.data) {
              setFetchProjects(projectData.data);
            }
          } catch (error) {
            console.error("Error fetching project details:", error);
          }
        };

        fetchProjectDetails();
      }
    }
  }, [location.search, projects]);

  // Add effect to watch for changes in filters.dateRange
  useEffect(() => {
    // Check if dateRange exists and has proper format
    if (filters.dateRange) {
      // Handle different possible formats of dateRange
      const startDate =
        typeof filters.dateRange === "string"
          ? filters.dateRange
          : filters.dateRange.startDate || "";

      const endDate =
        typeof filters.dateRange === "string"
          ? filters.dateRange
          : filters.dateRange.endDate || "";

      const hasValidDates = !!(startDate || endDate);

      if (hasValidDates) {
        setActiveFilters((prev) => ({
          ...prev,
          date: true,
        }));
      }
    }
  }, [filters.dateRange]);

  // Add effect to watch for userId changes in URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const userIdParam = searchParams.get("userId");

    // Check if userId param exists and has changed from current filter
    if (userIdParam && userIdParam !== filters.userId) {
      // Update filters with the new userId
      dispatch(
        setFilters({
          ...filters,
          userId: userIdParam,
        })
      );

      // Only fetch tasks if we're not already in a loading state
      if (!pagination.loading) {
        dispatch(
          fetchTasks({
            pageNo: pagination.currentPage,
            forceRefresh: true,
          })
        );
      }

      // Update pending filters state
      setPendingFilters((prev) => ({
        ...prev,
        userId: userIdParam,
      }));

      // Update active filters
      updateActiveFilters("employee", userIdParam);

      // Find user details for the userId in URL
      const userFromParams = users.find(u => String(u._id) === String(userIdParam));
      if (userFromParams) {
        setFetchUser(userFromParams);
      } else if (userIdParam) {
        // If user not found in current users list, fetch it individually
        const fetchUserDetails = async () => {
          try {
            const baseUrl = import.meta.env.VITE_APP_DJANGO;
            const userData = await fetchAuthGET(`${baseUrl}/user/${userIdParam}/`);
            if (userData && userData.data) {
              setFetchUser(userData.data);
            }
          } catch (error) {
            console.error("Error fetching user details:", error);
          }
        };

        fetchUserDetails();
      }
    }
  }, [location.search, users]);

  // Sync search query from URL on refresh and trigger fetch
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = (params.get("search") || "").trim();
    const currentSearch = (filters.searchQuery || "").trim();

    // Check if only taskId parameter changed (ignore taskId changes)
    const prevParams = new URLSearchParams(location.search);
    const currentParams = new URLSearchParams(window.location.search);
    
    // Remove taskId and isFocused from both to compare actual filter changes
    prevParams.delete('taskId');
    prevParams.delete('isFocused');
    currentParams.delete('taskId');
    currentParams.delete('isFocused');
    
    const onlyTaskIdChanged = prevParams.toString() === currentParams.toString();
    
    // Skip if only taskId changed (opening/closing task panel shouldn't reset pagination)
    if (onlyTaskIdChanged && urlSearch === currentSearch) {
      return;
    }

    // Keep Redux filters in sync with URL
    if (urlSearch !== currentSearch) {
      dispatch(
        setFilters({
          ...filters,
          searchQuery: urlSearch,
        })
      );
    }

    // Always fetch with the URL search on mount/URL change
    if (!pagination.loading) {
      dispatch(
        fetchTasks({
          pageNo: pagination.currentPage,
          forceRefresh: true,
          searchQuery: urlSearch,
        })
      );
    }
  }, [location.search]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    }

    if (showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileMenu]);

  // Define shortened tab names for smaller screens
  const getTabLabel = (tabId, isSmallScreen) => {
    if (!isSmallScreen) return tabs.find(t => t.id === tabId)?.label || "";

    // Shortened names for small screens
    switch (tabId) {
      case "all": return "All";
      case "my": return "Task";
      case "assigned": return "Assigned";
      case "mentioned": return "Mentioned";
      case "recurring": return "Repetitive";
      case "imported": return "Imported";
      default: return "All";
    }
  };

  // State to track screen size
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Update screen size state on resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1400); // Adjust this breakpoint as needed
    };

    checkScreenSize(); // Initial check
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  return (
    <div className="mb-4">
      {/* Desktop Tabs - Hidden on mobile */}
      <div className="hidden md:flex border-b pb-2  border-[#E1E1E1] dark:border-slate-700 pt-2  gap-6 ">
        {!fromProject && tabs.map((tab) => (
          <Tooltip
            key={tab.id}
            content={tab.label}
            placement="bottom"
            theme="custom-light"
            animation="shift-away"
          >
            <button
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex items-center justify-center px-1 xl:px-1.5 py-2 text-sm task-tab ${activeTabId === tab.id
                ? "border-b-2 border-[#7A39FF] text-[#7A39FF] task-tab-active"
                : "text-gray-500 hover:text-gray-700 task-tab-inactive"
                }`}
            >
              <Icon
                icon={tab.icon}
                className={`w-4 h-4 mr-1 task-tab-icon ${activeTabId === tab.id ? "text-[#7A39FF]" : ""
                  }`}
              />
              <span className="task-tab-text">
                {getTabLabel(tab.id, isSmallScreen)}
              </span>


              {activeTabId === tab.id && <div className="task-tab-indicator"></div>}
            </button>
          </Tooltip>
        ))}
        <div className="ml-auto flex items-center gap-1 md:gap-2 xl:gap-4">
          {!isRecurringTab && hasActiveFilters && (
            <Tooltip content="Export filtered tasks to CSV" placement="top" theme="custom-light">
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center font-medium px-3 md:px-2 xl:px-4 py-2 md:py-1.5 rounded-full text-sm bg-[#7A39FF] hover:bg-[#692ad9] text-white"

              >
                <Icon
                  icon="heroicons:arrow-down-tray"
                  width="16"
                  height="16"
                  className="w-4 h-4 mr-1.5 md:mr-0 xl:mr-2"
                />
                <span className="inline md:hidden xl:inline">Export</span>
              </button>
            </Tooltip>
          )}

          {!isRecurringTab && (
            <Tooltip content="Toggle filter options" placement="top" theme="custom-light">
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={`flex items-center justify-center font-medium px-3 md:px-2 xl:px-4 py-2 md:py-1.5 rounded-full text-sm ${showFilters ? "bg-[#7A39FF] text-white" : "bg-[#7960a9] text-white"
                  }`}
              >
                <Icon
                  icon="fluent:filter-12-regular"
                  width="16"
                  height="16"
                  className="w-4 h-4 mr-1.5 md:mr-0 xl:mr-2"
                />
                <span className="inline md:hidden xl:inline">Filter</span>
              </button>
            </Tooltip>
          )}

          {!isRecurringTab && (
            <div className="relative">
              <Tooltip content="Import tasks" placement="top" theme="custom-light">
                <button
                  onClick={() => setIsImportMenuOpen((prev) => !prev)}
                  className={`flex items-center justify-center ${savedEffect ? "bg-white text-black-900 border shadow-md animate-bouncing " : "bg-[#7A39FF] hover:bg-[#7A39FF]/80 text-white"}  font-medium px-3 md:px-2 xl:px-4 py-2 md:py-1.5 rounded-full text-sm`}
                >
                  <Icon icon="lucide:import" className="w-4 h-4 mr-1.5 md:mr-0 xl:mr-2" />
                  <span className="hidden xl:inline">{screenSize.isCustom ? "Import" : "Import Tasks"}</span>
                  <Icon icon={isImportMenuOpen ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-4 h-4 ml-1 hidden xl:inline" />
                </button>
              </Tooltip>
              {isImportMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-50 shadow-lg">
                  <div className="py-1">
                    <button
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => {
                        setImportMode("template");
                        setShowImportModalLocal(true);
                        setIsImportMenuOpen(false);
                      }}
                    >
                      <Icon icon="mdi:view-dashboard-outline" className="w-4 h-4" />
                      From template
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => {
                        setImportMode("csv");
                        setShowImportModalLocal(true);
                        setIsImportMenuOpen(false);
                      }}
                    >
                      <Icon icon="mdi:file-delimited" className="w-4 h-4" />
                      From CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Tooltip content="Create a new task" placement="top" theme="custom-light">
            <button
              onClick={handleAddTask}
              className="flex items-center justify-center bg-[#7A39FF] hover:bg-[#7A39FF]/80 text-white font-medium px-3 md:px-2 xl:px-4 py-2 md:py-1.5 rounded-full text-sm"
            >
              <Icon
                icon="heroicons-outline:plus"
                className="w-4 h-4 mr-0 xl:mr-2"
              />
              <span className="hidden 2xl:inline">
                {activeTabId === "recurring" ? "Repetitive Task" : "Task"}
              </span>
              <span className="hidden xl:inline 2xl:hidden">
                {activeTabId === "recurring"
                  ? (screenSize.isCustom ? "Repetitive" : "Repetitive Task")
                  : (screenSize.isCustom ? "Task" : "Task")}
              </span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Mobile Tab Indicator - Only visible on mobile */}
      <div className="border-b  md:hidden">
        <div className="md:hidden flex items-center justify-between py-3 px-1  border-[#E1E1E1] dark:border-slate-700">
          {/* <div className="relative">
              <div className="flex items-center" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                <Icon
                  icon={
                    tabs.find((tab) => tab.id === activeTabId)?.icon || "uil:list-ul"
                  }
                  className="w-4 h-4 mr-2 text-blue-500"
                />
                <span className="font-medium text-blue-500">
                  {tabs.find((tab) => tab.id === activeTabId)?.label || "All Tasks"}
                </span>
              </div>
              {showMobileMenu && (
                <div className="absolute left-0 top-8 w-44 rounded-md shadow-lg bg-white dark:bg-slate-900 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          handleTabClick(tab.id);
                          setShowMobileMenu(false);
                        }}
                        className={`flex w-full items-center px-4 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          activeTabId === tab.id
                            ? "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Icon icon={tab.icon} className="w-4 h-4 mr-3" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div> */}

          <div className="relative inline-block text-left " ref={dropdownRef}>
            {/* Dropdown trigger */}
            <div
              className="flex items-center cursor-pointer"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Icon
                icon={
                  tabs.find((tab) => tab.id === activeTabId)?.icon || "uil:list-ul"
                }
                className="w-4 h-4 mr-2 text-blue-500"
              />
              <span className="font-medium text-blue-500">
                {tabs.find((tab) => tab.id === activeTabId)?.label || "Tasks"}
              </span>
              <Icon
                icon="heroicons:chevron-down"
                className={`w-4 h-4 ml-1 text-blue-500 transition-transform duration-200 ${showMobileMenu ? "rotate-180" : ""
                  }`}
              />
            </div>

            {/* Dropdown menu */}
            {showMobileMenu && (
              <div className="absolute left-0 mt-2 w-44 rounded-md shadow-lg bg-white dark:bg-slate-900 ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  {tabs.map((tab) => (
                    <Tooltip
                      key={tab.id}
                      content={tab.label}
                      placement="right"
                      theme="custom-light"
                      animation="shift-away"
                    >
                      <button
                        onClick={() => {
                          handleTabClick(tab.id);
                          setShowMobileMenu(false);
                        }}
                        className={`flex w-full items-center px-4 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${activeTabId === tab.id
                          ? "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                          : "text-slate-700 dark:text-slate-300"
                          }`}
                      >
                        <Icon icon={tab.icon} className="w-4 h-4 mr-3" />
                        <span>{tab.label}</span>
                      </button>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Mobile Menu Toggle - Only visible on mobile */}
          <div className="md:hidden flex items-center gap-2 ">
            <button
              onClick={() => {
                handleAddTask();
                setShowMobileMenu(false);
              }}
              className="flex items-center justify-center bg-[#7A39FF] hover:bg-[#7A39FF]/80 text-white font-medium p-1.5 rounded-lg"
            >
              <Icon
                icon="heroicons-outline:plus"
                className="w-5 h-5"
              />
            </button>

            {hasActiveFilters && (
              <Tooltip content="Export filtered tasks to CSV" placement="top" theme="custom-light">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center bg-electricBlue-100 text-white font-medium p-1.5 rounded-lg"
                >
                  <Icon icon="heroicons:arrow-down-tray" className="w-5 h-5" />
                </button>
              </Tooltip>
            )}

            <div className="relative">
              <button
                className="p-1.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg"
                onClick={() => {
                  setShowFilters(!showFilters);
                  setShowMobileMenu(false);
                }}
              >
                <Icon icon="heroicons-outline:funnel" className="w-5 h-5" />
              </button>
              {activeFilterCount > 0 && (
                <span className=" absolute -right-2 -top-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-500 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Mobile Filter Tags - Horizontal Scrollable Area */}
        <div className="flex-1 overflow-x-auto whitespace-nowrap mb-1 hide-scrollbar">
          <div className="flex items-center gap-2 px-1">
            {/* Show filter tags for selected filters - being very explicit with conditions */}
            {(activeFilters.date === true ||
              (filters.dateRange &&
                ((filters.dateRange.startDate &&
                  filters.dateRange.startDate !== "") ||
                  (filters.dateRange.endDate &&
                    filters.dateRange.endDate !== "")))) && (
                <FilterTag
                  label={
                    filters.dateRange?.startDate &&
                      filters.dateRange?.endDate &&
                      dayjs(filters.dateRange.startDate).format("MMM D") ===
                      dayjs(filters.dateRange.endDate).format("MMM D")
                      ? dayjs(filters.dateRange.startDate).format("MMM D")
                      : filters.dateRange?.startDate && filters.dateRange?.endDate
                        ? `${dayjs(filters.dateRange.startDate).format(
                          "MMM D"
                        )} - ${dayjs(filters.dateRange.endDate).format("MMM D")}`
                        : filters.dateRange?.startDate
                          ? `From ${dayjs(filters.dateRange.startDate).format(
                            "MMM D"
                          )}`
                          : filters.dateRange?.endDate
                            ? `Until ${dayjs(filters.dateRange.endDate).format(
                              "MMM D"
                            )}`
                            : "Date Range"
                  }
                  onRemove={() => handleRemoveFilter("date")}
                />
              )}

            {activeFilters.status &&
              Array.isArray(filters.taskPosition) &&
              filters.taskPosition.length > 0 &&
              filters.taskPosition.map((status, index) => (
                <FilterTag
                  key={`status-${index}`}
                  label={
                    statusOptions.find((option) => option.value === status)
                      ?.label || status
                  }
                  onRemove={() => {
                    // Remove just this specific status
                    const updatedStatuses = filters.taskPosition.filter(
                      (s) => s !== status
                    );

                    const newSearchParams = new URLSearchParams(
                      location.search
                    );
                    if (updatedStatuses.length === 0) {
                      newSearchParams.delete("taskStatus");
                      newSearchParams.delete("taskPosition");

                      setActiveFilters((prev) => ({
                        ...prev,
                        status: false,
                      }));
                    } else {

                      newSearchParams.set(
                        "taskPosition",
                        updatedStatuses.join(",")
                      );
                    }

                    navigate(`?${newSearchParams.toString()}`, {
                      replace: true,
                    });
                    dispatch(
                      setFilters({
                        ...filters,
                        taskPosition: updatedStatuses,
                      })
                    );

                    // Also update pending filters
                    setPendingFilters((prev) => ({
                      ...prev,
                      taskPosition: updatedStatuses,
                    }));
                  }}
                />
              ))}

            {activeFilters.project && filters.projectId && (
              <FilterTag
                label={getProjectLabel(filters.projectId)}
                onRemove={() => handleRemoveFilter("project")}
              />
            )}

            {/* {activeFilters.employee && filters.userId && (
              <FilterTag
                label={getUserLabel(filters.userId)}
                onRemove={() => handleRemoveFilter("employee")}
              />
            )} */}

            {activeFilters.repetition && filters.repeat && (
              <FilterTag
                label={
                  repetitionOptions.find((opt) => opt.value === filters.repeat)
                    ?.label ||
                  filters.repeat.replace(/_/g, " ").charAt(0).toUpperCase() +
                  filters.repeat.replace(/_/g, " ").slice(1)
                }
                onRemove={() => handleRemoveFilter("repetition")}
              />
            )}

            {activeFilters.priority && filters.priority && (
              <FilterTag
                label={
                  priorityOptions.find((opt) => opt.value === filters.priority)
                    ?.label || filters.priority
                }
                onRemove={() => handleRemoveFilter("priority")}
              />
            )}
          </div>
        </div>
      </div>

      {/* {showMobileMenu  && (
        <>
      
          <div
            className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setShowMobileMenu(false)}
          ></div>

          <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-y-auto pt-16 pb-20 max-w-[300px] right-0 shadow-xl">
            <div className="sticky top-0 left-0 right-0 bg-white dark:bg-slate-900 px-4 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                Tasks Menu
              </h3>
              <Tooltip content="Close menu" placement="left">
                <button
                  className="p-1.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setShowMobileMenu(false)}
                  aria-label="Close menu"
                >
                  <Icon icon="heroicons:x-mark" className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            <div className="px-4 pt-4">
          
              <div className="flex flex-col space-y-2 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center px-4 py-3 rounded-lg ${
                      activeTabId === tab.id
                        ? "bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Icon icon={tab.icon} className="w-5 h-5 mr-3" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

             
              <div className="mb-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    <Icon
                      icon="heroicons:magnifying-glass"
                      className="w-4 h-4"
                    />
                  </span>
                  <input
                    type="text"
                    placeholder="Search TaskId and Task Name"
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="w-full h-10 pl-9 pr-4 border border-[#E1E1E1] dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-3 mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                <Tooltip content="Toggle filter options" placement="left">
                  <button
                    onClick={() => {
                      setShowFilters(!showFilters);
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center justify-center text-slate-700 dark:text-slate-300 
                      border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5"
                  >
                    <Icon
                      icon="heroicons-outline:funnel"
                      className="w-4 h-4 mr-2"
                    />
                    <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
                    {activeFilterCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-500 rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </Tooltip>

                <Tooltip content="Create a new task" placement="left">
                  <button
                    onClick={() => {
                      handleAddTask();
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center justify-center bg-[#7A39FF] hover:bg-[#7A39FF]/80 text-white font-medium px-4 py-2.5 rounded-lg"
                  >
                    <Icon
                      icon="heroicons-outline:plus"
                      className="w-4 h-4 mr-2"
                    />
                    <span>Add Task</span>
                  </button>
                </Tooltip>

                <Tooltip content="Import tasks from external sources" placement="left">
                  <button
                    onClick={() => {
                      setShowImportModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center justify-center bg-[#7A39FF] hover:bg-[#7A39FF]/80 text-white font-medium px-4 py-2.5 rounded-lg"
                  >
                    <Icon icon="lucide:import" className="w-3.5 h-3.5 mr-1.5" />
                    <span>Import Tasks</span>
                  </button>
                </Tooltip>

          
                {showFilters && !isRecurringTab && (
                  <button
                    onClick={() => {
                      applyFilters();
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-900 text-white font-medium px-4 py-2.5 rounded-lg"
                  >
                    <Icon
                      icon="heroicons-outline:check"
                      className="w-4 h-4 mr-2"
                    />
                    <span>Apply Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )} */}

      {/* Mobile Floating Action Button - Only visible on mobile */}
      <div className="md:hidden fixed bottom-14 right-1 z-50 ">
        <button
          onClick={handleAddTask}
          className="flex items-center justify-center bg-[#7A39FF] hover:bg-[#7A39FF]/80 text-white font-medium w-12 h-12 rounded-full shadow-lg"
        >
          <Icon icon="heroicons-outline:plus" className="w-6 h-6" />
        </button>
      </div>

      {/* Filter Panel - Responsive for both mobile and desktop */}
      {showFilters && !isRecurringTab && (
        <div className=" md:px-[0px] pt-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row items-stretch gap-6 mb-4">
            {/* Search Field - Decreased width for laptop view */}
            <div className="md:w-[20%] lg:w-[26%] xl:w-[35%] relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <Icon icon="heroicons:magnifying-glass" className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Quick search: Task ID, Name"
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full h-[38px] pl-9 pr-4 border border-[#E1E1E1] dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-white text-sm"
              />
            </div>

            {/* Status - Adjusted width */}
            {
              isMobileView ?
                <div className="w-full">
                  <Select
                    value={
                      statusOptions.find(
                        (option) =>
                          option.value ===
                          (Array.isArray(pendingFilters.taskPosition)
                            ? pendingFilters.taskPosition[0]
                            : pendingFilters.taskPosition)
                      ) || null
                    }
                    onChange={(selected) => {
                      // Only allow one status
                      handleSearch(selected ? [selected] : [], "taskStatus");
                    }}
                    options={statusOptions}
                    className="text-sm px-0"
                    classNamePrefix="select"
                    placeholder="Status"
                    isMulti={false}
                    isSearchable={true}
                    closeMenuOnSelect={true}
                    hideSelectedOptions={false}
                    onMenuOpen={() => setOpenDropdown(prev => ({ ...prev, status: true }))}
                    onMenuClose={() => {

                      setOpenDropdown(prev => ({ ...prev, status: false }));
                    }}
                    components={{
                      DropdownIndicator: (props) => (
                        <components.DropdownIndicator {...props}>
                          <Icon
                            icon={openDropdown.status ? "heroicons:chevron-up" : "heroicons:chevron-down"}
                            className="w-4 h-4 text-slate-500"
                          />
                        </components.DropdownIndicator>
                      ),
                      Option: ({ children, ...props }) => {
                        const { data, innerRef, innerProps, isFocused, isSelected } = props;
                        return (
                          <div
                            ref={innerRef}
                            {...innerProps}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${isSelected
                              ? "bg-electricBlue-50/10 text-electricBlue-50 dark:bg-slate-600 font-semibold"
                              : ""
                              } ${isFocused && !isSelected
                                ? "bg-gray-200 dark:bg-slate-700"
                                : ""
                              }`}
                          >
                            {data.color && (
                              <span
                                style={{
                                  backgroundColor: data.color,
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  display: "inline-block",
                                }}
                              />
                            )}
                            <span>{data.label}</span>
                          </div>
                        );
                      },
                    }}
                    styles={{
                      ...customStyles,
                      control: (base) => ({
                        ...base,
                        minHeight: "38px",
                        backgroundColor: "var(--select-bg, white)",
                        borderColor: "var(--select-border, #E5E7EB)",
                        boxShadow: "none",
                        "&:hover": {
                          borderColor: "var(--select-border-hover, #CBD5E1)",
                        },
                        height: "38px",
                        paddingBottom: "0",
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 50,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        borderRadius: "0.375rem",
                      }),
                      menuList: (base) => ({
                        ...base,
                        padding: "0.5rem 0",
                        maxHeight: "240px",
                      }),
                      input: (base) => ({
                        ...base,
                        margin: "0px",
                        padding: "0px",
                        width: "2px",
                      }),
                    }}
                  />
                </div>
                :
                <div className="md:w-[17%] lg:w-[14%]">
                  <Tooltip content="Filter by task status" placement="top" theme="custom-light">
                    <div>
                      <Select
                        value={
                          Array.isArray(pendingFilters.taskPosition)
                            ? pendingFilters.taskPosition.map((pos) =>
                              statusOptions.find((option) => option.value === pos)
                            )
                            : []
                        }
                        onChange={(selected) => handleSearch(selected, "taskStatus")}
                        options={statusOptions}
                        className="text-sm px-0"
                        classNamePrefix="select"
                        placeholder="Status"
                        isMulti
                        isSearchable={true}
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        menuPortalTarget={null}
                        menuIsOpen={openDropdown.status}
                        onMenuOpen={() => setOpenDropdown(prev => ({ ...prev, status: true }))}
                        onMenuClose={() => setOpenDropdown(prev => ({ ...prev, status: false }))}
                        components={{
                          DropdownIndicator: (props) => (
                            <components.DropdownIndicator {...props}>
                              <Icon
                                icon={openDropdown.status ? "heroicons:chevron-up" : "heroicons:chevron-down"}
                                className="w-4 h-4 text-slate-500"
                              />
                            </components.DropdownIndicator>
                          ),
                          Option: ({ children, ...props }) => {
                            const { data, innerRef, innerProps, isFocused, isSelected } = props;
                            return (
                              <div
                                ref={innerRef}
                                {...innerProps}
                                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${isSelected
                                  ? "bg-electricBlue-50/10 text-electricBlue-50 dark:bg-slate-600 font-semibold"
                                  : ""
                                  } ${isFocused && !isSelected
                                    ? "bg-gray-200 dark:bg-slate-700"
                                    : ""
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => { }}
                                  className="mr-2 h-4 w-4 min-w-[16px] rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                                {data.color && (
                                  <span
                                    style={{
                                      backgroundColor: data.color,
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      display: "inline-block",
                                    }}
                                  />
                                )}
                                <span>{data.label}</span>
                              </div>
                            );
                          },
                          MultiValue: () => null,
                          ValueContainer: ({ children, ...props }) => {
                            const selectedCount = Array.isArray(
                              pendingFilters.taskPosition
                            )
                              ? pendingFilters.taskPosition.length
                              : 0;

                            const { selectProps } = props;
                            const placeholder = selectProps.placeholder;

                            return (
                              <components.ValueContainer {...props}>
                                <div className="flex items-center h-full w-full overflow-hidden">
                                  {selectedCount > 0 ? (
                                    <div className="flex items-center truncate">
                                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                        Status
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center h-full">
                                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                        {placeholder}
                                      </span>
                                    </div>
                                  )}
                                  {children[1]}
                                </div>
                              </components.ValueContainer>
                            );
                          },
                        }}
                        styles={{
                          ...customStyles,
                          control: (base) => ({
                            ...base,
                            minHeight: "38px",
                            backgroundColor: "var(--select-bg, white)",
                            borderColor: "var(--select-border, #E5E7EB)",
                            boxShadow: "none",
                            "&:hover": {
                              borderColor: "var(--select-border-hover, #CBD5E1)",
                            },
                            height: "38px",
                            paddingBottom: "0",
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 50,
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            borderRadius: "0.375rem",
                            ...(isMobileView
                              ? {}
                              : { left: "-50px", width: "250px", }),
                          }),
                          menuList: (base) => ({
                            ...base,
                            padding: "0.5rem 0",
                            maxHeight: "240px",
                          }),
                          // Fix for select__input-container taking too much space
                          input: (base) => ({
                            ...base,
                            margin: "0px",
                            padding: "0px",
                            width: "2px", // Minimum width to allow cursor
                          }),
                        }}
                      />
                    </div>
                  </Tooltip>
                </div>
            }

            {/* Project - Adjusted width */}
            <div className="md:w-[17%] lg:w-[16%]">
              <Tooltip content="Filter by project" placement="top" theme="custom-light">
                <div>
                  {(() => {
                    const CustomSingleValue = ({ data }) => {
                      const projectColor = data?.projectColor;

                      return (
                        <div className="flex items-center gap-2 min-w-0">
                          {!data?.__isAllProjectsOption && (
                            <div
                              className={`w-3 h-3 rounded-[3px] flex-shrink-0 border ${projectColor
                                ? 'border-gray-300 dark:border-gray-600'
                                : 'border-electricBlue-100'
                                } ${projectColor ? '' : 'bg-electricBlue-100'}`}
                              style={projectColor ? { backgroundColor: projectColor } : {}}
                            />
                          )}
                          <span
                            className="truncate max-w-full lg:max-w-[180px] text-sm font-normal"
                            title={data.label}
                          >
                            {data.__isAllProjectsOption
                              ? data.label
                              : data.label?.length > 5 && window.innerWidth > 768
                                ? `${data.label.slice(0, window.innerWidth <= 1024 ? 12 : 30)}`
                                : data.label}
                          </span>

                        </div>
                      );
                    };

                    const CustomOption = (props) => {
                      const { data, innerRef, innerProps, isFocused, isSelected } = props;
                      const projectColor = data?.projectColor;
                      const isFavourite = userInfo?.fav_projects?.includes(data.value);

                      return (
                        <div
                          ref={innerRef}
                          {...innerProps}
                          className={`flex items-center gap-2 px-3 py-2 cursor-pointer truncate text-sm ${isSelected ? "bg-electricBlue-50/10 text-electricBlue-50 dark:bg-slate-600 font-semibold" : ""}
                         ${isFocused && !isSelected ? "bg-gray-200 dark:bg-slate-700" : ""}`}
                        >
                          {!data?.__isAllProjectsOption && (
                            <div
                              className="w-3 h-3 rounded-[3px] flex-shrink-0 border border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: projectColor }}
                            />
                          )}
                          <div className="flex items-center justify-between w-full">
                            <span
                              className="truncate md:max-w-[150px] text-sm font-normal"
                              title={data.label}
                            >
                              {data.label}
                            </span>
                            {/* {isFavourite && (
                              <Icon
                                icon="heroicons:star-16-solid"
                                className="w-4 h-4 text-favStar-100"
                              />
                            )} */}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <Select
                        value={
                          projectOptions.find(
                            (option) => option.value === pendingFilters.projectId
                          ) ||
                          (pendingFilters.projectId && fetchProject
                            ? {
                              value: fetchProject._id,
                              label: fetchProject.name,
                              __isAllProjectsOption: false,
                            }
                            : null)
                        }
                        onChange={(e) => handleSearch(e, 'projectId')}
                        options={projectOptions}
                        className="text-sm"
                        classNamePrefix="select"
                        placeholder="Projects"
                        isSearchable={true}
                        onMenuOpen={() =>
                          setOpenDropdown((prev) => ({ ...prev, project: true }))
                        }
                        onMenuClose={() =>
                          setOpenDropdown((prev) => ({ ...prev, project: false }))
                        }
                        ref={projectSelectRef}
                        components={{
                          MenuList: (props) => (
                            <CustomMenuList
                              {...props}
                              onButtonClick={() => {
                                // Close the dropdown state
                                setOpenDropdown((prev) => ({ ...prev, project: false }));

                                // Blur the select to close menu and remove tooltip
                                if (projectSelectRef.current) {
                                  projectSelectRef.current.blur();
                                }

                                // Small delay to ensure menu closes before modal opens
                                setTimeout(() => {
                                  setShowAddProjectModal(true);
                                }, 50);
                              }}
                              buttonText="Add Project"
                            />
                          ),
                          DropdownIndicator: (props) => (
                            <components.DropdownIndicator {...props}>
                              <Icon
                                icon={
                                  openDropdown.project
                                    ? 'heroicons:chevron-up'
                                    : 'heroicons:chevron-down'
                                }
                                className="w-4 h-4 text-slate-500"
                              />
                            </components.DropdownIndicator>
                          ),
                          SingleValue: CustomSingleValue,
                          Option: CustomOption,
                        }}
                        styles={{
                          ...customStyles,
                          control: (base) => ({
                            ...base,
                            minHeight: '38px',
                            height: '38px',
                            backgroundColor: 'var(--select-bg, white)',
                            borderColor: 'var(--select-border, #E5E7EB)',
                            boxShadow: 'none',
                            fontSize: '13px',
                            '&:hover': {
                              borderColor: 'var(--select-border-hover, #CBD5E1)',
                            },
                            paddingBottom: '0',
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            padding: '0 6px',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            minHeight: '38px',
                          }),
                          inputContainer: (base) => ({
                            ...base,
                            margin: 0,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                          }),
                          input: (base) => ({
                            ...base,
                            margin: 0,
                            padding: 0,
                            width: '2px',
                            height: '18px',
                            lineHeight: '18px',
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 50,
                            right: '0', // 👈 align to the right edge of the control
                            left: 'auto', // reset left so it doesn’t conflict
                            boxShadow:
                              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            borderRadius: '0.375rem',
                            ...(isMobileView ? {} : { width: '220px' }),
                          }),

                          menuList: (base) => ({
                            ...base,
                            padding: '0.25rem 0',
                            maxHeight: '240px',
                          }),
                        }}
                      />
                    );
                  })()}
                </div>
              </Tooltip>
            </div>


            {/* Employee - Adjusted width */}
            {fromProject && (
              <div className="md:w-[17%] lg:w-[16%]">
                <Tooltip content="Filter by assignee" placement="top" theme="custom-light">
                  <div>
                    <Select
                      value={
                        userOptions.find((option) => option.value === pendingFilters.userId) ||
                        (pendingFilters.userId && fetchUser
                          ? {
                            value: fetchUser._id,
                            label:
                              fetchUser.name ||
                              `${fetchUser.firstName || fetchUser.first_name || ""} ${fetchUser.lastName || fetchUser.last_name || ""
                                }`.trim() ||
                              fetchUser.email?.split("@")[0] ||
                              "",
                            image:
                              fetchUser.profileImg ||
                              fetchUser.image ||
                              fetchUser.profilePic ||
                              fetchUser.profile_picture ||
                              fetchUser.avatar ||
                              null,
                            __isFetchedUser: true,
                          }
                          : null)
                      }
                      onChange={(e) => handleSearch(e, "userId")}
                      options={userOptions}
                      className="text-sm"
                      classNamePrefix="select"
                      placeholder="Assignee"
                      isSearchable={true}
                      onMenuOpen={() => setOpenDropdown((prev) => ({ ...prev, assignee: true }))}
                      onMenuClose={() => setOpenDropdown((prev) => ({ ...prev, assignee: false }))}
                      getOptionLabel={(option) => option.label || ""}

                      components={{
                        MenuList: (props) => (
                          <CustomMenuList
                            {...props}
                            onButtonClick={() => {
                              navigate("/invite-user");
                            }}
                            buttonText="Invite User"
                          />
                        ),

                        // ... existing code ...
                        SingleValue: ({ children, ...props }) => {
                          const { data } = props;
                          const label = data?.label || "";
                          return (
                            <components.SingleValue {...props}>
                              <div className="flex items-center">
                                <div className="w-5 h-5 rounded-full mr-1">
                                  <ProfilePicture
                                    user={data}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                </div>
                                <span className="text-sm font-medium truncate" title={label}>
                                  {label.length > 20 && window.innerWidth >= 1110 ?
                                    label.substring(0, 20) + '..' :
                                    label.length > 5 && window.innerWidth < 1110 ?
                                      label.substring(0, 5) :
                                      label}
                                </span>
                              </div>
                            </components.SingleValue>
                          );
                        },
                        // ... existing code ...
                        Option: ({ children, ...props }) => {
                          const { data, innerRef, innerProps, isFocused, isSelected } = props;
                          return (
                            <div
                              ref={innerRef}
                              {...innerProps}
                              className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${isSelected
                                ? "bg-electricBlue-50/10 text-electricBlue-50 dark:bg-slate-600 font-semibold"
                                : ""
                                } ${isFocused && !isSelected
                                  ? "bg-gray-200 dark:bg-slate-700"
                                  : ""
                                }`}
                            >
                              <div className="w-5 h-5 rounded-full mr-1">
                                <ProfilePicture
                                  user={data}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium truncate max-w-[140px]">
                                  {data.label || ""}
                                </div>
                              </div>
                            </div>
                          );
                        },

                        DropdownIndicator: (props) => (
                          <components.DropdownIndicator {...props}>
                            <Icon
                              icon={
                                openDropdown.assignee
                                  ? "heroicons:chevron-up"
                                  : "heroicons:chevron-down"
                              }
                              className="w-4 h-4 text-slate-500"
                            />
                          </components.DropdownIndicator>
                        ),
                      }}

                      styles={{
                        ...customStyles,

                        control: (base) => ({
                          ...base,
                          minHeight: "38px",
                          backgroundColor: "var(--select-bg, white)",
                          borderColor: "var(--select-border, #E5E7EB)",
                          boxShadow: "none",
                          "&:hover": { borderColor: "var(--select-border-hover, #CBD5E1)" },
                          height: "auto", // allow wrapping if you later enable it
                          paddingBottom: 0,
                        }),

                        // STACK SingleValue and input so input doesn't take width when focused
                        valueContainer: (base) => ({
                          ...base,
                          display: "grid",
                          gridTemplateColumns: "1fr",
                          alignItems: "center",
                          padding: "0 4px",
                          overflow: "visible",
                        }),

                        singleValue: (base) => ({
                          ...base,
                          maxWidth: "none",
                          overflow: "visible",
                          textOverflow: "clip",
                          whiteSpace: "normal", // change to "normal" if you want wrapping
                        }),

                        // Keep the input focusable but non-intrusive
                        input: (base) => ({
                          ...base,
                          gridColumn: "1 / -1",
                          gridRow: "1 / -1",
                          margin: 0,
                          padding: 0,
                          width: 0,           // don't claim layout space
                          opacity: 0,         // invisible but focusable
                          position: "absolute",
                        }),

                        menu: (base) => ({
                          ...base,
                          zIndex: 50,
                          boxShadow:
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          borderRadius: "0.375rem",
                          ...(isMobileView ? {} : { width: "220px", left: "10px" }),
                        }),

                        menuList: (base) => ({
                          ...base,
                          padding: "0.25rem 0",
                          maxHeight: "200px",
                        }),

                        placeholder: (base) => ({
                          ...base,
                          marginLeft: 0,
                          marginRight: 0,
                        }),

                        option: (base) => ({
                          ...base,
                          whiteSpace: "normal",
                          wordWrap: "break-word",
                        }),
                      }}
                    />


                  </div>
                </Tooltip>
              </div>)}

            {/* Priority - Show on all screens, adjusted width */}
            <div className="md:block lg:block lg:w-[14%]">
              <Tooltip content="Filter by priority level" placement="top" theme="custom-light">
                <div>
                  <Select
                    value={priorityOptions.find(
                      (option) => option.value === pendingFilters.priority
                    ) || priorityOptions[0]}
                    onChange={(e) => handleSearch(e, "priority")}
                    options={priorityOptions}
                    className="text-sm"
                    classNamePrefix="select"
                    placeholder="Priority"
                    isSearchable={false}
                    onMenuOpen={() => setOpenDropdown(prev => ({ ...prev, priority: true }))}
                    onMenuClose={() => setOpenDropdown(prev => ({ ...prev, priority: false }))}
                    components={{
                      DropdownIndicator: (props) => (
                        <components.DropdownIndicator {...props}>
                          <Icon
                            icon={openDropdown.priority ? "heroicons:chevron-up" : "heroicons:chevron-down"}
                            className="w-4 h-4 text-slate-500"
                          />
                        </components.DropdownIndicator>
                      ),
                      Option: (props) => {
                        const { data, innerRef, innerProps, isFocused, isSelected } = props;

                        return (
                          <div
                            ref={innerRef}
                            {...innerProps}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${isSelected
                              ? "bg-electricBlue-50/10 text-electricBlue-50 dark:bg-slate-600 font-semibold"
                              : ""
                              } ${isFocused && !isSelected
                                ? "bg-gray-200 dark:bg-slate-700"
                                : ""
                              }`}
                          >
                            {data.color && (
                              <span
                                style={{
                                  backgroundColor: data.color,
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  display: "inline-block",
                                }}
                              />
                            )}
                            <span>{data.label}</span>
                          </div>
                        );
                      },
                      SingleValue: (props) => (
                        <components.SingleValue {...props}>
                          {props.data.color && <span style={{
                            backgroundColor: props.data.color,
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            marginRight: "8px",
                            display: "inline-block",
                          }}></span>}
                          {props.data.label}
                        </components.SingleValue>
                      ),
                    }}
                    styles={{
                      ...customStyles,
                      control: (base) => ({
                        ...base,
                        minHeight: "38px",
                        height: "38px",
                        backgroundColor: "var(--select-bg, white)",
                        borderColor: "var(--select-border, #E5E7EB)",
                        boxShadow: "none",
                        "&:hover": {
                          borderColor: "var(--select-border-hover, #CBD5E1)",
                        },
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        paddingLeft: "2px",
                        paddingRight: "2px",
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 50,
                        backgroundColor: "white",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        borderRadius: "0.375rem",
                        ...(isMobileView
                          ? { }
                          : { left: "15px", width: "130px" }),
                      }),
                      menuList: (base) => ({
                        ...base,
                        padding: "0.25rem 0",
                        maxHeight: "240px",
                      }),
                      option: (base) => ({
                        ...base,
                        padding: "0",
                        fontSize: "0.875rem",
                        backgroundColor: "transparent",
                        "&:hover": {
                          backgroundColor: "transparent",
                        },
                      }),
                      singleValue: (base) => ({
                        ...base,
                        display: "flex",
                        alignItems: "center",
                      }),
                      input: (base) => ({
                        ...base,
                        margin: "0px",
                        padding: "0px",
                        width: "2px",
                      }),
                    }}
                  />
                </div>
              </Tooltip>
            </div>

            {/* Date Range - Moved here, showing only calendar icon */}
            <div className="relative md:w-[42px]">
              <Tooltip content="Filter by date range" placement="top" theme="custom-light">
                <div className="w-full">
                  <Flatpickr
                    className={`w-full h-[38px] cursor-pointer p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm md:text-transparent`}
                    value={value?.startDate && value?.endDate ? [value.startDate, value.endDate] : value?.startDate ? [value.startDate] : ""}
                    onChange={handleValueChange}
                    options={{
                      mode: "range",
                      dateFormat: "Y-m-d",
                      allowInput: false,
                      clickOpens: true,
                      placeholder: " ",
                      showMonths: 1,
                      static: false,
                      position: "below",
                      ...(isMobileView && {
                        altInput: true,
                        altFormat: "d-m-Y",
                      }),
                    }}
                  />
                  <span className={`absolute right-2.5 md:left-2.5 text-center hover:cursor-pointer top-1/2 transform -translate-y-1/2 pointer-events-none`}>
                    <Icon icon="heroicons:calendar-days" className={`w-5 h-5 ${hasAnyDateFilters ? "text-[#7A39FF]" : "text-slate-400"}`} />
                  </span>
                </div>
              </Tooltip>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1 md:gap-2">
              <Button
                onClick={handleResetFilters}
                text="Reset"
                className="h-[38px] px-2 md:px-3 lg:px-5 text-xs md:text-xs lg:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              />
              <Button
                onClick={applyFilters}
                text="Apply"
                className="h-[38px] px-2 md:px-3 lg:px-5 text-xs md:text-xs lg:text-sm font-medium text-white bg-[#7A39FF] rounded-md hover:bg-[#7A39FF]/90"
              />
            </div>

          </div>
          <div className="">
            <div className="flex items-center gap-2 px-1">
              {/* Show filter tags for selected filters - being very explicit with conditions */}
              {(activeFilters.date === true ||
                (filters.dateRange &&
                  ((filters.dateRange.startDate &&
                    filters.dateRange.startDate !== "") ||
                    (filters.dateRange.endDate &&
                      filters.dateRange.endDate !== "")))) && (
                  <FilterTag
                    label={
                      filters.dateRange?.startDate &&
                        filters.dateRange?.endDate &&
                        dayjs(filters.dateRange.startDate).format("MMM D") ===
                        dayjs(filters.dateRange.endDate).format("MMM D")
                        ? dayjs(filters.dateRange.startDate).format("MMM D")
                        : filters.dateRange?.startDate && filters.dateRange?.endDate
                          ? `${dayjs(filters.dateRange.startDate).format(
                            "MMM D"
                          )} - ${dayjs(filters.dateRange.endDate).format("MMM D")}`
                          : filters.dateRange?.startDate
                            ? `From ${dayjs(filters.dateRange.startDate).format(
                              "MMM D"
                            )}`
                            : filters.dateRange?.endDate
                              ? `Until ${dayjs(filters.dateRange.endDate).format(
                                "MMM D"
                              )}`
                              : "Date Range"
                    }
                    onRemove={() => handleRemoveFilter("date")}
                  />
                )}

              {activeFilters.status &&
                Array.isArray(filters.taskPosition) &&
                filters.taskPosition.length > 0 &&
                filters.taskPosition.map((status, index) => (
                  <FilterTag
                    key={`status-${index}`}
                    label={
                      statusOptions.find((option) => option.value === status)
                        ?.label || status
                    }
                    onRemove={() => {
                      // Remove just this specific status
                      const updatedStatuses = filters.taskPosition.filter(
                        (s) => s !== status
                      );

                      const newSearchParams = new URLSearchParams(
                        location.search
                      );
                      if (updatedStatuses.length === 0) {
                        newSearchParams.delete("taskStatus");
                        newSearchParams.delete("taskPosition");

                        setActiveFilters((prev) => ({
                          ...prev,
                          status: false,
                        }));
                      } else {

                        newSearchParams.set(
                          "taskPosition",
                          updatedStatuses.join(",")
                        );
                      }

                      navigate(`?${newSearchParams.toString()}`, {
                        replace: true,
                      });
                      dispatch(
                        setFilters({
                          ...filters,
                          taskPosition: updatedStatuses,
                        })
                      );

                      // Also update pending filters
                      setPendingFilters((prev) => ({
                        ...prev,
                        taskPosition: updatedStatuses,
                      }));
                    }}
                  />
                ))}

              {activeFilters.project && filters.projectId && (
                <FilterTag
                  label={getProjectLabel(filters.projectId)}
                  onRemove={() => handleRemoveFilter("project")}
                />
              )}



              {activeFilters.repetition && filters.repeat && (
                <FilterTag
                  label={
                    repetitionOptions.find((opt) => opt.value === filters.repeat)
                      ?.label ||
                    filters.repeat.replace(/_/g, " ").charAt(0).toUpperCase() +
                    filters.repeat.replace(/_/g, " ").slice(1)
                  }
                  onRemove={() => handleRemoveFilter("repetition")}
                />
              )}
              {activeFilters.employee && filters.userId && (fromProject || new URLSearchParams(location.search).get('from_project')) && (
                <FilterTag
                  label={getUserLabel(filters.userId)}
                  onRemove={() => handleRemoveFilter("employee")}
                />
              )}

              {activeFilters.priority && filters.priority && (
                <FilterTag
                  label={
                    priorityOptions.find((opt) => opt.value === filters.priority)
                      ?.label || filters.priority
                  }
                  onRemove={() => handleRemoveFilter("priority")}
                />
              )}
            </div>
          </div>

        </div>
      )}

      {/* Add CSS for hiding scrollbar on mobile filter tags */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Add Project Modal */}
      <AddProject
        showAddProjectModal={showAddProjectModal}
        setShowAddProjectModal={setShowAddProjectModal}
        projects={projects}
        setProjects={(updatedProjects) => {
          // Since we're using Redux, we'll refetch projects to ensure consistency
          dispatch(fetchProjects());
        }}
      />
      {/* Add Task PopUp for mobile */}
      <AddTaskPopUp showModal={showAddTaskPopUp} setShowModal={setShowAddTaskPopUp} />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black-500 bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800  shadow-2xl max-w-7xl w-full mx-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 px-4 py-3 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {importMode === "template" ? "Import from Template" : "Import from CSV"}
              </h2>
              <button
                onClick={() => setShowImportModalLocal(false)}
                className="text-gray-400 hover:text-gray-500 text-3xl focus:outline-none"
                aria-label="Close"
                title="Close"
              >
                &times;
              </button>
            </div>
            <SidelineDatabaseTab
              fields={[{ dbField: "Task Name", column: "" }, { dbField: "Description", column: "" }]}
              setFields={(updatedFields) => {
                // Allow field mapping to be updated

              }}
              setshowCsv={() => setShowImportModalLocal(false)}
              getAllTasks={() => {
                dispatch(fetchTasks({ pageNo: 1, forceRefresh: true }));
              }}
              handleTabClick={() => { }}
              initialMode={importMode}
              fromProject={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TaskHeader);
