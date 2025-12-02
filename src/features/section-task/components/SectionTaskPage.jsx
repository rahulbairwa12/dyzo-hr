import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import Select, { components } from "react-select";
import makeAnimated from "react-select/animated";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import dayjs from "dayjs";
import Tooltip from "@/components/ui/Tooltip";
import ModernTooltip from "@/components/ui/ModernTooltip";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { openTaskFromUrl, applyFiltersToAllExpandedSections, fetchSectionsPaginated, fetchTasksPaginated, clearSectionTasks, toggleSectionCollapseAsync, bulkChangeSectionAsync } from "../store/sectionTaskSlice";
import { fetchProjects } from "@/store/projectsSlice";
import { fetchUsers } from "@/store/usersSlice";
import SectionTaskTable from "./SectionTaskTable";
import SectionTaskPanel from "./SectionTaskPanel";
import BottomBar from "@/features/tasks/components/BottomBar";
import TaskSkeletonLoader from "./TaskSkeletonLoader";
import { fetchAuthGET } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import CreateSectionModal from "./CreateSectionModal";
import { useSectionTasks } from "../hooks/useSectionTasks";
import { setSelectedTask, toggleTaskPanel, clearSelectedTasks } from "../store/sectionTaskSlice";
import { ProfilePicture } from "@/components/ui/profilePicture";
import Papa from "papaparse";
import { setShowLimitModal } from "@/store/planSlice";







// Tabs to match the existing design
const tabs = [
  { id: "all", label: "All Tasks", icon: "uil:list-ul" },
  { id: "my", label: "My Tasks", icon: "heroicons:user" },
  { id: "assigned", label: "Assigned Tasks", icon: "heroicons:user-group" },
  { id: "mentioned", label: "Mentioned Tasks", icon: "heroicons:at-symbol" },
  { id: "recurring", label: "Repetitive Tasks", icon: "heroicons:arrow-path" },
  { id: "imported", label: "Imported Tasks", icon: "lucide:import" },
];

// Priority options
const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "high", label: "High", color: "#DC3464" },
  { value: "medium", label: "Medium", color: "#FFB800" },
  { value: "low", label: "Low", color: "#FF5F1F" },
];

// Default status options for multi-select (fallback)
const defaultStatusOptions = [
  { value: "not_started_yet", label: "Not Started", color: "#DC3464" },
  { value: "in_progress", label: "In Progress", color: "#3092F5" },
  { value: "completed", label: "Completed", color: "#30F558" },
  { value: "pending", label: "Pending", color: "#BCBCBC" },
  { value: "on_hold", label: "On Hold", color: "#6B7280" },
];

// Add the animated components
const animatedComponents = makeAnimated();

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Filter tag component
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

const SectionTaskPage = ({ projectMembers = [], projectData = null, projectsForBottomBar = [] }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { project_id } = useParams();



  // Resolve project id from route param or query (?projectId=...)
  const resolvedProjectId = useMemo(() => {
    if (project_id) return project_id;
    const params = new URLSearchParams(location.search);
    return params.get("projectId");
  }, [project_id, location.search]);

  // Use section tasks hook
  const {
    sections,
    selectedTasks,
    isLoading,
    totalTasks,
    filters, // Add filters from Redux state
    fetchSections,
    applyFilters,
    resetFilters,
    selectTask,
    openTaskPanel,
    toggleSectionCollapse: toggleSection,
    bulkDeleteTasks,
    bulkUpdateTasks,
    getSelectedTasksData,
  } = useSectionTasks();
  const { subscriptionData } = useSelector((state) => state.plan);

  // 🚀 OPTIMIZATION 1: Memoize sections properly to prevent infinite loops
  const sectionsMemo = useMemo(() => sections, [sections]);

  // 🚀 OPTIMIZATION 2: Add ref to track previous search value
  const prevSearchValueRef = useRef("");
  const prevFiltersRef = useRef({});

  // Other selectors
  const { projects } = useSelector(
    (state) => state.projects || { projects: [] },
  );
  const { users } = useSelector((state) => state.users || { users: [] });
  const userInfo = useSelector((state) => state.auth.user);
  const selectedTask = useSelector((state) => state.sectionTasks.selectedTask);
  const isTaskPanelOpen = useSelector(
    (state) => state.sectionTasks.isTaskPanelOpen,
  );

  // Get current user's access level for this project
  const currentUserAccessLevel = useMemo(() => {
    if (!userInfo?._id || !projectData?.accessLevels) {
      return null;
    }
    return projectData.accessLevels[userInfo._id.toString()] || null;
  }, [userInfo?._id, projectData?.accessLevels]);

  // Check if current user has permission to create tasks/sections
  const canCreateTasks = useMemo(() => {
    return currentUserAccessLevel && currentUserAccessLevel !== 'viewer' || userInfo?.isAdmin;
  }, [currentUserAccessLevel]);

  // Local state
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [isCreateSectionModalOpen, setIsCreateSectionModalOpen] =
    useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [addingTaskToSection, setAddingTaskToSection] = useState(null);
  const addDropdownRef = useRef(null);
  const statusFilterRef = useRef(null);
  const statusSelectRef = useRef(null);

  // Dynamic status options state - using project data
  const statusMultiOptions = useMemo(() => {
    if (projectData?.status && projectData.status.length > 0) {
      return projectData.status.map(status => ({
        value: status.value || status.name?.toLowerCase().replace(/\s+/g, '_'),
        label: status.name || status.label,
        color: status.color || '#6B7280'
      }));
    }
    return defaultStatusOptions;
  }, [projectData?.status]); // This should work correctly as it's already memoized

  // Also ensure projectMembers is properly memoized for consistency
  const memoizedProjectMembers = useMemo(() => projectMembers, [projectMembers]);


  const [statusLoading, setStatusLoading] = useState(false);

  // Bottom bar state
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [savedEffect, setSavedEffect] = useState(false);

  // Debounced search value for API calls
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const [isSearching, setIsSearching] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Filter state - matching TaskHeader pattern
  const [pendingFilters, setPendingFilters] = useState({
    dateRange: { startDate: "", endDate: "" },
    userId: "",
    taskPosition: [],
    priority: "",
    search: "",
  });

  // Track active filters for UI display
  const [activeFilters, setActiveFilters] = useState({
    date: false,
    status: false,
    employee: false,
    priority: false,
  });

  // Date picker state
  const [value, setValue] = useState({ startDate: "", endDate: "" });



  // Effect to reset filters when project changes
  useEffect(() => {
    // Only reset if resolvedProjectId has a value (i.e., a project is selected)
    if (resolvedProjectId) {
      resetFilters();
      // Optionally, update URL to reflect cleared filters if needed
      // navigate(location.pathname, { replace: true });
    }
  }, [resolvedProjectId, resetFilters, navigate, location.pathname]);

  // Load data on mount
  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Always fetch sections on initial load (sections don't change with task filters)
        await fetchSections();
        dispatch(fetchProjects());
        dispatch(fetchUsers());
      } catch (error) {
        console.error("Failed to load sections:", error);
      }
    };

    loadData();
  }, [fetchSections, dispatch]);

  // Initialize filter values from URL parameters - matching TaskHeader pattern
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Initialize date range
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      setValue({ startDate: startDate || "", endDate: endDate || "" });
      updateActiveFilters("date", true);
    } else {
      setValue({ startDate: "", endDate: "" });
      updateActiveFilters("date", false);
    }

    // Initialize status filter as an array for multi-select
    const statusParam = searchParams.get("status");
    let statusValues = [];
    if (statusParam) {
      statusValues = statusParam.split(",");
      updateActiveFilters("status", statusValues);
    } else {
      statusValues = [];
      updateActiveFilters("status", statusValues);
    }

    // Get assigned user from URL
    const userIdParam = searchParams.get("userId");
    updateActiveFilters("employee", userIdParam);

    // Initialize priority filter
    const priorityParam = searchParams.get("priority");
    updateActiveFilters("priority", priorityParam);

    // Initialize search filter
    const searchParam = searchParams.get("search");
    // Preserve search value from URL on page refresh
    setSearchValue(searchParam || "");

    // Initialize pending filters state with current values
    setPendingFilters({
      dateRange: {
        startDate: startDate || "",
        endDate: endDate || "",
      },
      userId: userIdParam || "",
      taskPosition: statusValues,
      priority: priorityParam || "",
      search: searchParam || "", // Preserve search from URL on page refresh
    });

    // Note: Search parameter is now preserved in URL for persistence
  }, [location.search]);

  // Handle URL parameters for shareable task links
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskId = params.get("taskId");

    if (taskId) {
      // Open task from shareable URL
      dispatch(openTaskFromUrl({ taskId }));
    }
  }, [location.search, dispatch]);

  // Handle task click with URL support
  const handleTaskClick = (task) => {
    // Set selected task and open panel
    openTaskPanel(task);

    // Add taskId to URL for shareable links
    const params = new URLSearchParams(location.search);
    params.set("taskId", task._id || task.taskId);
    const newUrl = `${location.pathname}?${params.toString()}`;
    navigate(newUrl, { replace: true });
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        addDropdownRef.current &&
        !addDropdownRef.current.contains(event.target)
      ) {
        setShowAddDropdown(false);
      }

      // Handle status filter dropdown - check for react-select menu
      if (
        statusFilterRef.current &&
        !statusFilterRef.current.contains(event.target) &&
        !event.target.closest('[class*="select__menu"]') &&
        !event.target.closest('[class*="select__option"]') &&
        openDropdown.status
      ) {
        setOpenDropdown(prev => ({ ...prev, status: false }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile !== isMobileView) {
        setShowFilters(!mobile);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileView]);

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    applyFilters({ tab: tabId });
  };

  // 🚀 OPTIMIZATION 4: Optimized search handling
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchValue(query);
    setPendingFilters((prev) => ({ ...prev, search: query }));

    // 🚀 FIX: Prevent immediate API calls when search is cleared - let debounced effect handle it
    if (!query.trim()) {
      // Don't dispatch here - let the debounced effect handle URL updates
    }
  };

  // 🚀 OPTIMIZATION 5: Auto-apply search with debouncing (replicates handleApplyFilters logic)
  useEffect(() => {
    const currentSearchParam = new URLSearchParams(location.search).get("search") || "";
    const newSearchValue = debouncedSearchValue.trim();

    // 🚀 OPTIMIZATION: Prevent unnecessary API calls and conflicts with URL-driven effect
    if (currentSearchParam === newSearchValue || (newSearchValue !== "" && newSearchValue === prevSearchValueRef.current) || isApplyingFiltersRef.current) {
      return;
    }

    prevSearchValueRef.current = newSearchValue;
    setIsSearching(true);

    // Auto-apply search by calling the same logic as handleApplyFilters
    const autoApplySearch = () => {
      // Update pendingFilters with the new search value first (including empty string)
      setPendingFilters((prev) => ({
        ...prev,
        search: newSearchValue,
      }));

      // Trigger handleApplyFilters after a small delay to ensure pendingFilters is updated
      setTimeout(() => {
        handleApplyFilters();
      }, 50);

      setTimeout(() => setIsSearching(false), 100);
    };

    autoApplySearch();
  }, [debouncedSearchValue, location.pathname]);

  // Handle filter changes for different types
  const handleSearch = (e, type) => {
    let filterUpdates = {};

    if (type === "userId") {
      filterUpdates.userId = e?.value || "";
      updateActiveFilters("employee", e?.value);
    } else if (type === "taskPosition") {
      if (!e || e.length === 0) {
        filterUpdates.taskPosition = [];
      } else {
        const statusValues = e.map((status) => status.value).filter(v => v !== "");
        filterUpdates.taskPosition = statusValues;
      }
      updateActiveFilters("status", e);
    } else if (type === "priority") {
      filterUpdates.priority = e?.value || "";
      updateActiveFilters("priority", e?.value);
    }

    // Update pending filters instead of applying immediately
    setPendingFilters((prev) => ({
      ...prev,
      ...filterUpdates,
    }));
  };

  // Update active filters tracker
  const updateActiveFilters = (filterType, value) => {
    let isActive = false;

    switch (filterType) {
      case "date":
        isActive = value && (value.startDate || value.endDate);
        break;
      case "status":
        isActive = Array.isArray(value) ? value.length > 0 : !!value;
        break;
      case "employee":
        isActive = !!value && value !== "";
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

  // Check if there are any date filters (either pending or applied) - for calendar icon color
  const hasAnyDateFilters =
    (pendingFilters.dateRange?.startDate || pendingFilters.dateRange?.endDate) ||
    (value?.startDate || value?.endDate);

  // Handle date range changes
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

  // Handle filter apply - 🆕 URL-driven approach with search API integration
  const handleApplyFilters = async () => {
    // 🚀 FIX: Prevent duplicate API calls if already applying filters
    if (isApplyingFiltersRef.current) {
      return;
    }

    // Get current URL parameters to compare with pending filters
    const currentParams = new URLSearchParams(location.search);
    const currentStartDate = currentParams.get("startDate") || "";
    const currentEndDate = currentParams.get("endDate") || "";
    const currentStatus = currentParams.get("status") || "";
    const currentUserId = currentParams.get("userId") || "";
    const currentPriority = currentParams.get("priority") || "";
    const currentSearch = currentParams.get("search") || "";

    // Compare current URL parameters with pending filters
    const statusString = Array.isArray(pendingFilters.taskPosition) ? pendingFilters.taskPosition.join(",") : "";
    const filtersChanged =
      currentStartDate !== (pendingFilters.dateRange?.startDate || "") ||
      currentEndDate !== (pendingFilters.dateRange?.endDate || "") ||
      currentStatus !== statusString ||
      currentUserId !== (pendingFilters.userId || "") ||
      currentPriority !== (pendingFilters.priority || "") ||
      currentSearch !== (pendingFilters.search || "");

    // 🚀 NEW: Early return if no filters have changed to prevent unnecessary loading state
    if (!filtersChanged) {
      return;
    }



    // Check if any filters are actually applied
    const hasDateFilter = !!(pendingFilters.dateRange?.startDate || pendingFilters.dateRange?.endDate);
    const hasStatusFilter = Array.isArray(pendingFilters.taskPosition) && pendingFilters.taskPosition.length > 0;
    const hasUserFilter = !!pendingFilters.userId;
    const hasPriorityFilter = !!pendingFilters.priority;
    const hasSearchFilter = !!pendingFilters.search;

    const hasAnyFilter = hasDateFilter || hasStatusFilter || hasUserFilter || hasPriorityFilter || hasSearchFilter;

    // 🔍 NEW: Call search API if search parameter exists
    if (hasSearchFilter && pendingFilters.search) {
      try {
        setIsFilterLoading(true);
        const searchParams = new URLSearchParams();
        searchParams.append('search', pendingFilters.search);
        if (resolvedProjectId) {
          searchParams.append('projectId', resolvedProjectId);
        }

        // Call the search API to get tasks from different sections
        const searchUrl = `${import.meta.env.VITE_APP_DJANGO}/sections/10/tasks/?${searchParams.toString()}`;
        const response = await fetchAuthGET(searchUrl, false);

        if (response && response.results && response.results.length > 0) {
          // Extract unique section IDs from the search results
          const sectionIds = [...new Set(response.results.map(task => task.section))];

          // Open sections that contain search results with filters
          for (const sectionId of sectionIds) {
            const section = sectionsMemo.find(s => s.id === sectionId);
            if (section && section.isCollapsed) {
              // Prepare filters for section expansion to prevent duplicate API calls
              const filtersForSection = {
                search: pendingFilters.search || "",
                userId: pendingFilters.userId || "",
                taskPosition: pendingFilters.taskPosition || [],
                priority: pendingFilters.priority || "",
                dateRange: pendingFilters.dateRange || { startDate: "", endDate: "" }
              };

              // Open the section that contains search results with filters
              await handleSectionToggle(sectionId, filtersForSection);
            }
          }
        }
      } catch (error) {
        console.error('Error calling search API:', error);
        toast.error('Error searching tasks');
      }
    }

    // Only set loading state if filters are actually applied AND filters have changed
    if (hasAnyFilter && filtersChanged) {
      setIsFilterLoading(true);
    }

    // Update URL parameters - this will trigger useEffect to call API
    const searchParams = new URLSearchParams(location.search);



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
      searchParams.set("status", pendingFilters.taskPosition.join(","));
    } else {
      searchParams.delete("status");
    }

    // User parameter
    if (pendingFilters.userId) {
      searchParams.set("userId", pendingFilters.userId);
    } else {
      searchParams.delete("userId");
    }

    // Priority parameter
    if (pendingFilters.priority) {
      searchParams.set("priority", pendingFilters.priority);
    } else {
      searchParams.delete("priority");
    }

    // Search parameter
    if (pendingFilters.search) {
      searchParams.set("search", pendingFilters.search);
    } else {
      searchParams.delete("search");
    }



    // 🎯 ONLY UPDATE URL - useEffect will detect change and call API
    navigate(`?${searchParams.toString()}`, { replace: true });

    // Close all dropdowns after applying filters
    setOpenDropdown({
      status: false,
      assignee: false,
      priority: false
    });

    // Force close the status dropdown by re-rendering the component
    setSelectKey(prev => prev + 1);

    // Force active filters update for UI
    setActiveFilters({
      date: hasDateFilter,
      status: Array.isArray(pendingFilters.taskPosition) && pendingFilters.taskPosition.length > 0,
      employee: !!pendingFilters.userId,
      priority: !!pendingFilters.priority,
    });
  };

  // Handle filter reset - matching TaskHeader pattern
  const handleResetFilters = () => {
    // 🚀 FIX: Prevent duplicate API calls if already applying filters
    if (isApplyingFiltersRef.current) {
      return;
    }

    const searchParam = new URLSearchParams(location.search);
    const hasActiveFilters =
      searchParam.get("startDate") ||
      searchParam.get("endDate") ||
      searchParam.get("status") ||
      searchParam.get("userId") ||
      searchParam.get("priority") ||
      searchParam.get("search");

    if (!hasActiveFilters) {
      // If no filters are active, do nothing
      return;
    }
    // Reset filter loading state
    setIsFilterLoading(false);

    // Clear filter parameters but keep base URL with project ID and tab
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    const newUrl = tab ? `${location.pathname}?tab=${tab}` : location.pathname;
    navigate(newUrl);

    // Reset active filters
    setActiveFilters({
      date: false,
      status: false,
      employee: false,
      priority: false,
    });

    // Reset date picker value
    setValue({ startDate: "", endDate: "" });

    // Reset pending filters
    const defaultPendingFilters = {
      userId: "",
      taskPosition: [],
      dateRange: { startDate: "", endDate: "" },
      priority: "",
      search: "",
    };
    setPendingFilters(defaultPendingFilters);

    // Reset search and clear previous search cache so the same term can be applied again
    setSearchValue("");
    prevSearchValueRef.current = "";

    // Close all dropdowns after resetting filters
    setOpenDropdown({
      status: false,
      assignee: false,
      priority: false
    });

    // Force close the status dropdown by re-rendering the component
    setSelectKey(prev => prev + 1);

    // Apply the reset filters immediately
    resetFilters();
  };

  // 🚀 FIX: Prevent duplicate API calls by adding a ref to track if we're currently applying filters
  const isApplyingFiltersRef = useRef(false);

  // 🚀 OPTIMIZATION 3: Optimized URL-driven filter effect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Extract filters from URL
    const urlFilters = {
      search: searchParams.get("search") || "",
      userId: searchParams.get("userId") || "",
      taskPosition: searchParams.get("status") ? searchParams.get("status").split(",") : [],
      priority: searchParams.get("priority") || "",
      dateRange: {
        startDate: searchParams.get("startDate") || "",
        endDate: searchParams.get("endDate") || "",
      },
    };

    // 🚀 OPTIMIZATION: Check if filters actually changed to prevent unnecessary API calls
    const filtersChanged = JSON.stringify(urlFilters) !== JSON.stringify(prevFiltersRef.current);

    if (filtersChanged && !isApplyingFiltersRef.current) {
      prevFiltersRef.current = urlFilters;
      isApplyingFiltersRef.current = true;

      // Check if we have any active filters
      const hasActiveFilters =
        urlFilters.search ||
        urlFilters.userId ||
        urlFilters.taskPosition.length > 0 ||
        urlFilters.priority ||
        urlFilters.dateRange.startDate ||
        urlFilters.dateRange.endDate;

      // Always apply filters to all expanded sections, even when filters are empty
      // This ensures API is called when filters are removed or on page refresh
      dispatch(applyFiltersToAllExpandedSections(urlFilters))
        .finally(() => {
          // Reset the flag after the API call completes
          setTimeout(() => {
            isApplyingFiltersRef.current = false;
          }, 100);
        });

      // Reset filter loading state after applying filters
      setTimeout(() => setIsFilterLoading(false), 500);
    }
  }, [location.search, dispatch]); // Keep sectionsMemo out to prevent unnecessary re-renders

  // Handle add task to top section
  const handleAddTask = () => {
    if (!canCreateTasks) {
      return null; // Permission denied
    }
    if (subscriptionData?.subscription_status !== "active") {
      dispatch(setShowLimitModal(true));
      return null;
    }
    
    if (sectionsMemo && sectionsMemo.length > 0) {
      // Find the top section (highest order value - topmost section)
      const topSection = sectionsMemo.reduce((top, current) => {
        const topOrder = top.order || 0;
        const currentOrder = current.order || 0;
        return currentOrder > topOrder ? current : top;
      });

      // If section is collapsed, expand it first before adding task
      if (topSection.isCollapsed) {
        handleSectionToggle(topSection.id, getCurrentFiltersFromURL()).then(() => {
          // After section is expanded and tasks are fetched, add the new task
          setTimeout(() => {
            setAddingTaskToSection(topSection.id);
          }, 150); // Wait for fetch to complete
        });
      } else {
        // Section is already expanded, just add the task
        setAddingTaskToSection(topSection.id);
      }
    }
    setShowAddDropdown(false);
  };

  // Handle task creation completion
  const handleTaskAddComplete = () => {
    setAddingTaskToSection(null);
  };

  // Handle adding task to specific section (for section-level add buttons)
  const handleAddTaskToSection = (sectionId) => {
    if (!canCreateTasks) {
      return null; // Permission denied
    }
    setAddingTaskToSection(sectionId);

    // Auto-expand the section when adding a task
    const section = sectionsMemo.find(s => s.id === sectionId);
    if (section && section.isCollapsed) {
      handleSectionToggle(sectionId, getCurrentFiltersFromURL());
    }
  };

  // Handle create section modal
  const handleOpenCreateSectionModal = () => {
    if (!canCreateTasks) {
      return null; // Permission denied
    }
    setIsCreateSectionModalOpen(true);
    setShowAddDropdown(false);
  };

  const handleCloseCreateSectionModal = () => {
    setIsCreateSectionModalOpen(false);
  };

  // Get current filters from URL and local state
  const getCurrentFiltersFromURL = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    return {
      search: searchParams.get("search") || searchValue || "",
      userId: searchParams.get("userId") || "",
      taskPosition: searchParams.get("status") ? searchParams.get("status").split(",") : [],
      priority: searchParams.get("priority") || "",
      dateRange: {
        startDate: searchParams.get("startDate") || "",
        endDate: searchParams.get("endDate") || "",
      },
    };
  }, [location.search, searchValue]);

  // 🚀 OPTIMIZATION 6: Optimized section toggle with throttling
  const handleSectionToggle = useCallback(async (sectionId, customFilters = null) => {
    const section = sectionsMemo.find(s => s.id === sectionId);
    const wasCollapsed = section?.isCollapsed;

    try {
      // Use async thunk for persistent section collapse state
      const result = await dispatch(toggleSectionCollapseAsync(sectionId));

      if (result.type === 'sectionTasks/toggleSectionCollapseAsync/fulfilled') {
        const { isCollapsed } = result.payload;

        if (!isCollapsed) {
          // Section is now expanded - fetch tasks with filters
          setTimeout(() => {
            // Use custom filters if provided (from search), otherwise get current filters from pendingFilters
            const filtersToUse = customFilters || {
              search: pendingFilters.search || "",
              userId: pendingFilters.userId || "",
              taskPosition: pendingFilters.taskPosition || [],
              priority: pendingFilters.priority || "",
              dateRange: pendingFilters.dateRange || { startDate: "", endDate: "" },
            };

            // Always fetch fresh tasks when expanding a section to ensure we have the latest data
            // This handles cases where tasks were moved to this section while it was closed
            dispatch(fetchTasksPaginated({
              sectionId,
              filters: filtersToUse,
              page: 1,
              pageSize: 20,
              append: false
            }));
          }, 100); // Small delay to prevent rapid API calls
        } else {
          // Section is now collapsed - clear tasks to free memory
          dispatch(clearSectionTasks({ sectionId }));
        }
      }
    } catch (error) {
      console.error('Failed to toggle section:', error);
      // Fallback to local toggle if API fails
      if (wasCollapsed) {
        setTimeout(() => {
          // Use custom filters if provided, otherwise get current filters from URL
          const filtersToUse = customFilters || getCurrentFiltersFromURL();

          dispatch(fetchTasksPaginated({
            sectionId,
            filters: filtersToUse,
            page: 1,
            pageSize: 20,
            append: false
          }));
        }, 100);
      } else {
        dispatch(clearSectionTasks({ sectionId }));
      }
    }
  }, [sectionsMemo, dispatch, getCurrentFiltersFromURL]); // Updated dependencies

  // Track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState({
    status: false,
    assignee: false,
    priority: false
  });

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

  // Key to force re-render of Select components
  const [selectKey, setSelectKey] = useState(0);

  // Custom styles for Select components
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "38px",
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
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      borderRadius: "0.375rem",
    }),
    menuList: (base) => ({
      ...base,
      padding: "0.5rem 0",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "rgba(59, 130, 246, 0.1)" : "transparent",
      color: "inherit",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "rgba(243, 244, 246, 1)",
      },
      padding: "0.25rem 1rem",
      display: "flex",
      alignItems: "center",
    }),
    singleValue: (base) => ({
      ...base,
      display: "flex",
      alignItems: "center",
    }),
    valueContainer: (base) => ({
      ...base,
      height: "38px",
    }),
  };

  // Format users for the dropdown - prioritize projectMembers, fallback to users
  const userOptions = useMemo(() => {
    // Use memoizedProjectMembers if available, otherwise fallback to users
    const sourceUsers = memoizedProjectMembers && memoizedProjectMembers.length > 0 ? memoizedProjectMembers : users;

    const formattedUsers = sourceUsers.map((user) => {
      const displayName = user?.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email?.split("@")[0] || "";
      const profileImage = user?.profile_picture || user.profileImg || user.image || user.profilePic || user.avatar || null;

      return {
        value: user._id || user.id,
        label: displayName,
        name: displayName,
        image: profileImage,
        email: user.email,
        access_level: user.access_level, // Include access level from projectMembers
      };
    }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

    // Add "All Users" option
    return [{ value: "", label: "All Users", name: "All Users" }, ...formattedUsers];
  }, [memoizedProjectMembers, users]);

  // Memoized custom components for assignee Select to prevent re-renders
  const assigneeSelectComponents = useMemo(() => ({
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
          <ProfilePicture
            user={data}
            className="w-5 h-5 rounded-full object-cover"
          />
          <div className="text-sm font-medium truncate max-w-[140px]">
            {data.label || ""}
          </div>
        </div>
      );
    },
    SingleValue: (props) => {
      const { data } = props;
      return (
        <components.SingleValue {...props}>
          <div className="flex items-center gap-2">
            <ProfilePicture
              user={data}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-sm font-medium truncate">
              {data.label || ""}
            </span>
          </div>
        </components.SingleValue>
      );
    },
    DropdownIndicator: (props) => (
      <components.DropdownIndicator {...props}>
        <Icon
          icon={openDropdown.assignee ? "heroicons:chevron-up" : "heroicons:chevron-down"}
          className="w-4 h-4 text-slate-500"
        />
      </components.DropdownIndicator>
    ),
  }), [openDropdown.assignee]);

  // Memoized custom components for status Select to prevent re-renders
  const statusSelectComponents = useMemo(() => ({
    SingleValue: (props) => {
      const { data } = props;
      return (
        <components.SingleValue {...props}>
          <div className="flex items-center gap-2">
            {data.color && (
              <span
                className="w-2 h-2 min-w-[8px] rounded-full"
                style={{ backgroundColor: data.color }}
              ></span>
            )}
            <span className="text-sm font-medium truncate">
              {data.label || ""}
            </span>
          </div>
        </components.SingleValue>
      );
    },
    DropdownIndicator: (props) => (
      <Icon
        icon={openDropdown.status ? "heroicons:chevron-up" : "heroicons:chevron-down"}
        className="w-4 h-4 mr-2 text-slate-500"
      />
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
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => { }}
            className="mr-2 h-4 w-4 min-w-[16px] rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          {data.color && (
            <span
              className="w-2 h-2 min-w-[8px] rounded-full"
              style={{ backgroundColor: data.color }}
            ></span>
          )}
          <span className="text-sm">{data.label}</span>
        </div>
      );
    },
    MultiValue: () => null,
    ValueContainer: ({ children, ...props }) => {
      const selectedCount = Array.isArray(pendingFilters.taskPosition) ? pendingFilters.taskPosition.length : 0;
      const { selectProps } = props;
      const placeholder = selectProps.placeholder;

      return (
        <components.ValueContainer {...props}>
          <div className="flex items-center h-full w-full overflow-hidden">
            {selectedCount > 0 ? (
              <div className="flex items-center truncate">
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                  Status ({selectedCount})
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
  }), [openDropdown.status, pendingFilters.taskPosition]);

  // Memoized custom components for priority Select to prevent re-renders
  const prioritySelectComponents = useMemo(() => ({
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
  }), [openDropdown.priority]);

  // Helper function to get user name
  const getUserLabel = (userId) => {
    const matchingUser = userOptions.find((opt) => String(opt.value) === String(userId));
    if (matchingUser?.label) {
      return matchingUser.label;
    }
    const userFromRaw = users.find((u) => String(u._id || u.id) === String(userId));
    if (userFromRaw) {
      return userFromRaw.name || `${userFromRaw.firstName || userFromRaw.first_name || ""} ${userFromRaw.lastName || userFromRaw.last_name || ""}`.trim() || userFromRaw.email?.split("@")[0] || "User";
    }
    return "User";
  };

  // Calculate active filter count for mobile badge - only count applied filters from URL
  const activeFilterCount = (() => {
    const searchParams = new URLSearchParams(location.search);
    let count = 0;


    if (searchParams.get("startDate") || searchParams.get("endDate")) count++;
    if (searchParams.get("status")) count++;
    if (searchParams.get("userId")) count++;
    if (searchParams.get("priority")) count++;
    if (searchParams.get("search")) count++;

    return count;
  })();

  // Handle remove filter function
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
    } else if (filterType === "status") {
      newSearchParams.delete("taskPosition");
    } else if (filterType === "employee") {
      newSearchParams.delete("userId");
    } else if (filterType === "priority") {
      newSearchParams.delete("priority");
    }

    navigate(`?${newSearchParams.toString()}`, { replace: true });

    // Apply through filters
    applyFilters({ ...pendingFilters, ...filterUpdates });
  };

  // Bottom bar handlers
  const handleDeleteTasks = async () => {
    setBulkLoading(true);
    try {
      const selectedTasksData = getSelectedTasksData();
      const taskIds = selectedTasksData.map(task => task._id);
      await bulkDeleteTasks(taskIds);
      setModalIsOpen("");
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Failed to delete tasks");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkUpdate = async (updates) => {
    setBulkLoading(true);
    try {
      const selectedTasksData = getSelectedTasksData();
      const taskIds = selectedTasksData.map(task => task._id);
      const result = await bulkUpdateTasks(taskIds, updates);
      setModalIsOpen("");
    } catch (error) {
      console.error("❌ SectionTaskPage: Error updating tasks:", error);
      toast.error("Failed to update tasks");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSectionMove = async (taskIds, sectionId) => {
    setBulkLoading(true);
    try {
      // The thunk now handles filtering temp vs real tasks
      await dispatch(bulkChangeSectionAsync({
        projectId: resolvedProjectId,
        taskIds,
        sectionId
      }))

      setModalIsOpen("");

    } catch (error) {
      console.error("❌ SectionTaskPage: Error moving tasks to section:", error);
      toast.error("Failed to move tasks to section");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCopyTasks = () => {
    const selectedTasksData = getSelectedTasksData();
    const baseUrl = window.location.origin;

    // Create an array of URLs for each selected task
    const links = selectedTasksData.map(
      task => `${baseUrl}/tasks?taskId=${task._id}&isFocused=true`
    );

    // Copy all links, one per line, to the clipboard
    navigator.clipboard.writeText(links.join('\n')).then(() => {
      toast.success("Task links copied to clipboard");
    });
  };


  const handleExportTasks = () => {

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const options = { year: 'numeric', month: 'short', day: '2-digit' };
      // Will output "08 Apr 2025"
      return new Date(dateStr).toLocaleDateString('en-US', options);
    };

    const formatStatus = (status) => {
      if (!status) return '';
      // Remove underscores and capitalize each word
      return status
        .replace(/_/g, ' ')
    }

    // Get assigned users names from Redux users store
    const getAssignedUsersNames = (assignedUserIds) => {
      if (!assignedUserIds || assignedUserIds.length === 0) return '';

      const assignedNames = assignedUserIds
        .map(userId => {
          const user = users.find(u => u._id === userId || u.id === userId);
          return user ? (user.name || user.username || user.email) : null;
        })
        .filter(Boolean);

      return assignedNames.join(', ');
    };

    const selectedTasksData = getSelectedTasksData();

    // Get section name from first task's sectionId (all selected tasks should be from same section)
    let sectionName = 'section_tasks';
    if (selectedTasksData.length > 0) {
      const firstTaskSectionId = selectedTasksData[0].sectionId;
      const section = sections.find(s => s.id === firstTaskSectionId);
      if (section?.name) {
        sectionName = section.name.toLowerCase().replace(/\s+/g, '_');
      }
    }

    const csvData = selectedTasksData.map(task => ({
      ID: task?.taskCode,
      Name: task.taskName,
      Priority: task.priority,
      Status: formatStatus(task.taskPosition),
      'Due Date': formatDate(task.dueDate),
      'Assigned To': getAssignedUsersNames(task.assigned_users),
      'Project': task.projectName,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sectionName}_export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Tasks exported successfully");
  };

  const handleCloseBottomBar = () => {
    // Clear selected tasks
    dispatch(clearSelectedTasks());
  };

  // Add a state to track total section count
  const [totalSections, setTotalSections] = useState(5); // Default to 5 based on the API response

  // Track previous pagination state to detect actual pagination changes
  const prevPaginationRef = useRef({ page: "1", pageSize: "3" });

  // Add this useEffect to listen for pagination parameters and fetch sections
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Get pagination parameters
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("page_size") || "3";

    // Check if this is actually a pagination change (not just filter changes)
    const currentPagination = { page, pageSize };
    const isPaginationChange =
      currentPagination.page !== prevPaginationRef.current.page ||
      currentPagination.pageSize !== prevPaginationRef.current.pageSize;

    // Only call section API if it's a pagination change
    // This prevents section API calls when filters are applied (which also change URL)
    if (isPaginationChange) {
      dispatch(fetchSectionsPaginated({
        projectId: resolvedProjectId,  // from route/query
        filters: {},
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        append: false
      })).then(response => {
        // Update total sections count from API response
        if (response?.payload && response?.payload.pagination) {
          setTotalSections(response.payload.pagination.count);
        }
      });

      // Update the previous pagination state
      prevPaginationRef.current = currentPagination;
    }
  }, [location.search, dispatch, resolvedProjectId]);

  return (
    <div className="space-y-1 h-full flex flex-col" style={{ minHeight: '100vh' }}>
      {/* Header Card */}
      <Card bodyClass="p-1 "  >
        <div className="md:flex items-center  justify-end mb-3 mt-2">
          {/* Left side - Tabs */}

          {/* Right side - Action buttons */}
          <div className="flex  items-center space-x-2 mt-4 md:mt-0">
            {/* Filter Toggle */}
            <Tooltip content="Toggle filter options" placement="top" theme="custom-light">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${showFilters || activeFilterCount > 0
                  ? "bg-[#7A39FF] text-white"
                  : "bg-[#7960a9] text-white hover:bg-[#7A39FF]/90"
                  }`}
              >
                <Icon icon="fluent:filter-12-regular" className="w-4 h-4" />
                <span className="text-sm">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="bg-white text-[#7A39FF] text-xs px-2 py-0.5 rounded-full font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {/* Add Task/Section Dropdown */}
            <div className="relative" ref={addDropdownRef}>
              <ModernTooltip
                content={!canCreateTasks ? "🚫 Access Restricted " : "Add new task or section"}
                placement="top"
                theme="custom-light"
              >
                <div className="inline-block">
                  <button
                    onClick={() => canCreateTasks && setShowAddDropdown(!showAddDropdown)}
                    disabled={!canCreateTasks}
                    className={`flex items-center gap-2 px-3 py-2 text-white rounded-md transition-colors text-sm font-medium ${canCreateTasks
                      ? "bg-[#7A39FF] hover:bg-[#7A39FF]/80 cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed opacity-60"
                      }`}
                  >
                    <Icon icon="heroicons:plus" className="w-4 h-4" />
                    <span>Add</span>
                    <Icon
                      icon="heroicons:chevron-down"
                      className={`w-4 h-4 transition-transform ${showAddDropdown ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              </ModernTooltip>

              {/* Dropdown Menu */}
              {showAddDropdown && canCreateTasks && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleAddTask}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Icon
                        icon="heroicons:document-text"
                        className="w-4 h-4"
                      />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Task</span>
                      </div>
                    </button>
                    <button
                      onClick={handleOpenCreateSectionModal}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Icon icon="heroicons:squares-2x2" className="w-4 h-4" />
                      <span className="font-medium">Section</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Filters Row - Matching TaskHeader Pattern */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-800  mt-4 px-1 py-3 ">
            <div className="flex flex-col md:flex-row items-stretch gap-3">
              {/* Search Field */}
              <div className="md:w-[35%] relative">
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

              {/* Status Filter */}
              <div className="md:w-[17%]" ref={statusFilterRef}>
                <Tooltip content="Filter by task status" placement="top" theme="custom-light">
                  <div>
                    <Select
                      key={`status-select-${selectKey}`}
                      ref={statusSelectRef}
                      value={
                        Array.isArray(pendingFilters.taskPosition)
                          ? pendingFilters.taskPosition.map((pos) =>
                            statusMultiOptions.find((option) => option.value === pos)
                          )
                          : []
                      }
                      onChange={(selected) => handleSearch(selected, "taskPosition")}
                      options={statusMultiOptions}
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
                      components={statusSelectComponents}
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          minHeight: "38px",
                          height: "38px",
                          backgroundColor: "white",
                          borderColor: state.isFocused ? "#3B82F6" : "#E5E7EB",
                          borderWidth: "1px",
                          borderRadius: "0.375rem",
                          boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
                          "&:hover": {
                            borderColor: state.isFocused ? "#3B82F6" : "#CBD5E1",
                          },
                          cursor: "pointer",
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          padding: "0 8px",
                          display: "flex",
                          alignItems: "center",
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 50,
                          backgroundColor: "white",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                          borderRadius: "0.5rem",
                          border: "1px solid #E5E7EB",
                          marginTop: "4px",
                        }),
                        menuList: (base) => ({
                          ...base,
                          padding: "4px",
                          maxHeight: "240px",
                          borderRadius: "0.5rem",
                        }),
                        option: (base) => ({
                          ...base,
                          padding: "0",
                          margin: "0",
                          backgroundColor: "transparent",
                          color: "inherit",
                          "&:hover": {
                            backgroundColor: "transparent",
                          },
                          "&:active": {
                            backgroundColor: "transparent",
                          },
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: "#374151",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                        }),
                        input: (base) => ({
                          ...base,
                          margin: "0",
                          paddingTop: "0",
                          paddingBottom: "0",
                        }),
                      }}
                    />
                  </div>
                </Tooltip>
              </div>

              {/* Assignee Filter */}
              <div className="md:w-[17%]">
                <Tooltip content="Filter by assignee" placement="top" theme="custom-light">
                  <div>
                    <Select
                      value={userOptions.find((opt) => opt.value === pendingFilters.userId)}
                      onChange={(selected) => handleSearch(selected, "userId")}
                      options={userOptions}
                      className="text-sm"
                      classNamePrefix="select"
                      placeholder="Assignee"
                      isSearchable={true}
                      onMenuOpen={() => setOpenDropdown(prev => ({ ...prev, assignee: true }))}
                      onMenuClose={() => setOpenDropdown(prev => ({ ...prev, assignee: false }))}
                      getOptionLabel={(option) => option.label || ""}
                      components={assigneeSelectComponents}
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
                            ? { right: "0", left: "auto", width: "200px" }
                            : { left: "15px", width: "200px" }),
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

              {/* Priority Filter */}
              <div className="md:w-[14%]">
                <Tooltip content="Filter by priority level" placement="top" theme="custom-light">
                  <div>
                    <Select
                      value={priorityOptions.find(
                        (option) => option.value === pendingFilters.priority
                      )}
                      onChange={(e) => handleSearch(e, "priority")}
                      options={priorityOptions}
                      className="text-sm"
                      classNamePrefix="select"
                      placeholder="Priority"
                      isSearchable={true}
                      onMenuOpen={() => setOpenDropdown(prev => ({ ...prev, priority: true }))}
                      onMenuClose={() => setOpenDropdown(prev => ({ ...prev, priority: false }))}
                      components={prioritySelectComponents}
                      styles={customStyles}
                    />
                  </div>
                </Tooltip>
              </div>

              {/* Date Range */}
              <div className="relative md:w-[42px]">
                <Tooltip content="Filter by date range" placement="top" theme="custom-light">
                  <div className="w-full">
                    <Flatpickr
                      className={`${value?.startDate ? "w-full" : "w-10"} md:w-10 h-[38px] cursor-pointer p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm md:text-transparent`}
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
                        position: "below"
                      }}
                    />
                    <span className={`absolute ${value?.startDate ? "right-2.5 " : "left-2.5"}   md:left-2.5 text-center hover:cursor-pointer top-1/2 transform -translate-y-1/2 pointer-events-none`}>
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
                  onClick={handleApplyFilters}
                  text="Apply"
                  className="h-[38px] px-2 md:px-3 lg:px-5 text-xs md:text-xs lg:text-sm font-medium text-white bg-[#7A39FF] rounded-md hover:bg-[#7A39FF]/90"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Tags - Only show when filters are actually applied */}
        {showFilters && (() => {
          const searchParams = new URLSearchParams(location.search);
          const hasAppliedFilters =
            searchParams.get("startDate") ||
            searchParams.get("endDate") ||
            searchParams.get("status") ||
            searchParams.get("userId") ||
            searchParams.get("priority") ||
            searchParams.get("search");

          if (!hasAppliedFilters) return null;

          return (
            <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm px-1 py-1 ">
              <div className="flex items-center gap-2 px-1">
                {/* Date Range Filter Tag */}
                {(searchParams.get("startDate") || searchParams.get("endDate")) && (
                  <FilterTag
                    label={
                      searchParams.get("startDate") &&
                        searchParams.get("endDate") &&
                        dayjs(searchParams.get("startDate")).format("MMM D") ===
                        dayjs(searchParams.get("endDate")).format("MMM D")
                        ? dayjs(searchParams.get("startDate")).format("MMM D")
                        : searchParams.get("startDate") && searchParams.get("endDate")
                          ? `${dayjs(searchParams.get("startDate")).format("MMM D")} - ${dayjs(searchParams.get("endDate")).format("MMM D")}`
                          : searchParams.get("startDate")
                            ? `From ${dayjs(searchParams.get("startDate")).format("MMM D")}`
                            : searchParams.get("endDate")
                              ? `Until ${dayjs(searchParams.get("endDate")).format("MMM D")}`
                              : "Date Range"
                    }
                    onRemove={() => handleRemoveFilter("date")}
                  />
                )}

                {/* Status Filter Tags */}
                {searchParams.get("status") &&
                  searchParams.get("status").split(",").map((status, index) => (
                    <FilterTag
                      key={`status-${index}`}
                      label={
                        statusMultiOptions.find((option) => option.value === status)?.label || status
                      }
                      onRemove={() => {
                        const currentStatuses = searchParams.get("status").split(",");
                        const updatedStatuses = currentStatuses.filter((s) => s !== status);

                        const newSearchParams = new URLSearchParams(location.search);
                        if (updatedStatuses.length === 0) {
                          newSearchParams.delete("status");
                        } else {
                          newSearchParams.set("status", updatedStatuses.join(","));
                        }
                        navigate(`?${newSearchParams.toString()}`, { replace: true });
                      }}
                    />
                  ))}

                {/* Assignee Filter Tag */}
                {searchParams.get("userId") && (
                  <FilterTag
                    label={getUserLabel(searchParams.get("userId"))}
                    onRemove={() => handleRemoveFilter("employee")}
                  />
                )}

                {/* Priority Filter Tag */}
                {searchParams.get("priority") && (
                  <FilterTag
                    label={
                      priorityOptions.find((opt) => opt.value === searchParams.get("priority"))?.label || searchParams.get("priority")
                    }
                    onRemove={() => handleRemoveFilter("priority")}
                  />
                )}


              </div>
            </div>
          );
        })()}
      </Card>

      {/* Task Table Card */}
      <Card className="noborder flex-1" bodyClass="p-0">
        <div className="flex flex-col h-full">
          {/* Scrollable Table Area */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8E2EFF]"></div>
              </div>
            ) : isFilterLoading ? (
              <TaskSkeletonLoader />
            ) : (
              <SectionTaskTable
                key={`section-table-${statusMultiOptions.length}`}
                sections={sectionsMemo}
                selectedTasks={selectedTasks}
                onTaskSelect={selectTask}
                onTaskClick={handleTaskClick}
                onSectionToggle={handleSectionToggle}
                addingTaskToSection={addingTaskToSection}
                onAddTaskToSection={handleAddTaskToSection}
                onTaskAddComplete={handleTaskAddComplete}
                projectMembers={memoizedProjectMembers}
                projectStatus={statusMultiOptions}
                canCreateTasks={canCreateTasks}
              />
            )}
          </div>

          {/* Fixed Pagination */}
          {/*  <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-600 pt-4 mt-4 ml-3">
            <div className="md:flex md:space-y-0 space-y-5 justify-between items-center">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <span className="flex space-x-2 rtl:space-x-reverse items-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Showing
                  </span>
                  <span>
                    <Select
                      key={`page-size-${location.search}`} // Add key to prevent unnecessary re-renders
                      className="react-select-container"
                      classNamePrefix="react-select"
                      options={[
                        { value: 3, label: "3" },
                        { value: 5, label: "5" },
                        { value: 10, label: "10" },
                      ]}
                      defaultValue={{ value: 3, label: "3" }}
                      onChange={(option) => {
                        // Update page size in URL and trigger re-fetch
                        const searchParams = new URLSearchParams(location.search);
                        searchParams.set("page_size", option.value);
                        searchParams.set("page", "1"); // Reset to first page
                        navigate(`?${searchParams.toString()}`, { replace: true });
                      }}
                      menuPlacement="top"
                    />
                  </span>
                </span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  of {sections ? sections.length : 0} sections
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button 
                  className="text-slate-600 dark:text-slate-300 btn-sm btn-outline-secondary"
                  onClick={() => {
                    const searchParams = new URLSearchParams(location.search);
                    const currentPage = parseInt(searchParams.get("page") || "1");
                    if (currentPage > 1) {
                      searchParams.set("page", (currentPage - 1).toString());
                      navigate(`?${searchParams.toString()}`, { replace: true });
                    }
                  }}
                  disabled={!location.search.includes("page=") || location.search.includes("page=1")}
                >
                  Previous
                </Button>
                <ul className="flex items-center space-x-1">
                  {(() => {
                    const searchParams = new URLSearchParams(location.search);
                    const currentPage = parseInt(searchParams.get("page") || "1");
                    const pageSize = parseInt(searchParams.get("page_size") || "3");
                    const totalPages = Math.ceil(totalSections / pageSize);
                    
                    // Create an array of page numbers to display
                    let pageNumbers = [];
                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all
                      pageNumbers = Array.from({length: totalPages}, (_, i) => i + 1);
                    } else {
                      // Always show first page
                      pageNumbers.push(1);
                      
                      // If current page is 1 or 2, show first 3 pages + ... + last page
                      if (currentPage < 3) {
                        pageNumbers.push(2, 3, '...', totalPages);
                      } 
                      // If current page is last or second-last, show first + ... + last 3 pages
                      else if (currentPage > totalPages - 2) {
                        pageNumbers.push('...', totalPages - 2, totalPages - 1, totalPages);
                      }
                      // Otherwise show first + ... + current-1, current, current+1 + ... + last
                      else {
                        pageNumbers.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                      }
                    }
                    
                    return pageNumbers.map((pageNum, index) => (
                      <li key={`page-${index}`}>
                        {pageNum === '...' ? (
                          <Button className="btn-sm btn-outline-secondary">...</Button>
                        ) : (
                          <Button 
                            className={`btn-sm ${currentPage === pageNum ? 'bg-[#8E2EFF] text-white' : 'btn-outline-secondary'}`}
                            onClick={() => {
                              if (pageNum !== '...') {
                                searchParams.set("page", pageNum.toString());
                                navigate(`?${searchParams.toString()}`, { replace: true });
                              }
                            }}
                          >
                            {pageNum}
                          </Button>
                        )}
                      </li>
                    ));
                  })()}
                </ul>
                <Button 
                  className="text-slate-600 dark:text-slate-300 btn-sm btn-outline-secondary"
                  onClick={() => {
                    const searchParams = new URLSearchParams(location.search);
                    const currentPage = parseInt(searchParams.get("page") || "1");
                    const pageSize = parseInt(searchParams.get("page_size") || "3");
                    const totalPages = Math.ceil(totalSections / pageSize);
                    
                    if (currentPage < totalPages) {
                      searchParams.set("page", (currentPage + 1).toString());
                      navigate(`?${searchParams.toString()}`, { replace: true });
                    }
                  }}
                  disabled={(() => {
                    const searchParams = new URLSearchParams(location.search);
                    const currentPage = parseInt(searchParams.get("page") || "1");
                    const pageSize = parseInt(searchParams.get("page_size") || "3");
                    const totalPages = Math.ceil(totalSections / pageSize);
                    return currentPage >= totalPages;
                  })()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div> */}
        </div>
      </Card>

      {/* Section Task Panel */}
      {selectedTask && isTaskPanelOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-25 z-40" />

          {/* SectionTaskPanel */}
          <SectionTaskPanel
            task={{
              ...selectedTask,
              taskId: selectedTask.taskId || selectedTask._id,
              taskName: selectedTask.taskName || "",
              description: selectedTask.description || "",
              priority: selectedTask.priority || "medium",
              taskPosition: selectedTask.taskPosition || "not_started_yet",
              dueDate: selectedTask.dueDate || null,
              projectId: selectedTask.projectId || null,
              projectName: selectedTask.projectName || "",
              assigned_users: selectedTask.assigned_users || [],
              assign_name: selectedTask.assign_name || "",
              user_name: selectedTask.user_name || "",
              liked_by: selectedTask.liked_by || [],
              seen_by: selectedTask.seen_by || [],
              isComplete:
                selectedTask.isComplete ||
                selectedTask.taskPosition === "completed",
              total_time: selectedTask.total_time || "00:00:00",
              allocated_time: selectedTask.allocated_time || 0,
              allocated_hours_percentage:
                selectedTask.allocated_hours_percentage || 0,
              total_comments: selectedTask.total_comments || 0,
              total_attached_files: selectedTask.total_attached_files || 0,
              dateCreated: selectedTask.dateCreated,
              updated_at: selectedTask.updated_at,
            }}
            isOpen={isTaskPanelOpen}
            onClose={() => {
              dispatch(setSelectedTask(null));
              dispatch(toggleTaskPanel(false));

              // Remove taskId from URL if present
              const params = new URLSearchParams(location.search);
              if (params.has("taskId")) {
                params.delete("taskId");
                params.delete("isFocused");
                const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ""
                  }`;
                navigate(newUrl, { replace: true });
              }
            }}

            from="section-task"
            projects={projects}
            projectMembers={memoizedProjectMembers}
            projectStatus={statusMultiOptions}
            canCreateTasks={canCreateTasks}
          />
        </>
      )}

      {/* Create Section Modal */}
      <CreateSectionModal
        isOpen={isCreateSectionModalOpen}
        onClose={handleCloseCreateSectionModal}
      />

      {/* Section Bottom Bar */}
      <BottomBar
        selectedTasks={getSelectedTasksData()}
        deleteTasks={handleDeleteTasks}
        exportTasks={handleExportTasks}
        copyTasks={handleCopyTasks}
        closeBottomBar={handleCloseBottomBar}
        bulkLoading={bulkLoading}
        modalIsOpen={modalIsOpen}
        setModalIsOpen={setModalIsOpen}
        getAllTasks={() => { }}
        users={projectMembers.length > 0 ? projectMembers : users}
        projects={projectsForBottomBar.length > 0 ? projectsForBottomBar : projects}
        handleBulkUpdate={handleBulkUpdate}
        sections={sectionsMemo}
        handleSectionMove={handleSectionMove}
        currentProjectId={resolvedProjectId}
        taskStatuses={
          // Get all unique project statuses from all sections and project data
          (() => {
            const allStatuses = [];
            const seenValues = new Set();

            // First, try to get statuses from project data if available
            if (projectsForBottomBar.length > 0 && projectsForBottomBar[0].project_status) {
              projectsForBottomBar[0].project_status.forEach(status => {
                if (!seenValues.has(status.value)) {
                  seenValues.add(status.value);
                  allStatuses.push({
                    value: status.value,
                    name: status.name,
                    color: status.color
                  });
                }
              });
            }

            // Then get statuses from sections
            sectionsMemo.forEach(section => {
              if (section.project_status && section.project_status.length > 0) {
                section.project_status.forEach(status => {
                  if (!seenValues.has(status.value)) {
                    seenValues.add(status.value);
                    allStatuses.push({
                      value: status.value,
                      name: status.name,
                      color: status.color
                    });
                  }
                });
              }
            });



            // Return unique statuses or fallback to defaults
            return allStatuses.length > 0 ? allStatuses : [
              { value: "not_started_yet", name: "Not Started", color: "#DC3464" },
              { value: "in_progress", name: "In Progress", color: "#3092F5" },
              { value: "completed", name: "Completed", color: "#30F558" },
              { value: "pending", name: "Pending", color: "#BCBCBC" },
              { value: "on_hold", name: "On Hold", color: "#6B7280" },
            ];
          })()
        }
        isCopy={false}
        savedEffect={savedEffect}
        setSavedEffect={setSavedEffect}
        hideProjectSelect={true}
      />
    </div>
  );
};

export default SectionTaskPage;
