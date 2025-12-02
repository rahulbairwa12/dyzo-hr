import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import moment from "moment";
import SimpleBar from "simplebar-react";
import { useSelector, useDispatch } from "react-redux";
import { setFilter, toggleMobileTodoSidebar } from "./store";
import AddTodo from "./AddTodo";
import { ToastContainer } from "react-toastify";
import EditTodoModal from "./EditTodo";
import ListLoading from "@/components/skeleton/ListLoading";
import TodoHeader from "./TodoHeader";
import useWidth from "@/hooks/useWidth";
import { bottomfilterList } from "@/constant/taskData";
import { fetchProjects } from "@/store/projectsSlice";
import { checkUserLimit, setShowLimitModal } from "@/store/planSlice";
import {
  fetchAuthGET,
  fetchAuthPost,
  fetchDelete,
  fetchPOST,
  isAdmin,
} from "@/store/api/apiSlice";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import TableHeaders from "./TableHeaders";
import DynamicTaskRow from "./DynamicTaskRow";
import TaskOnMobile from "@/components/Task/TaskOnMobile";
import TaskPanel from "@/components/Task/TaskPanel";
import DeletePopup from "@/components/Task/DeletePopup";
import { intialLetterName } from "@/helper/helper";
import ListSkeleton from "../table/ListSkeleton";
import BottomBar from "@/components/Task/BottomBar";
import { toast } from "react-toastify";
import { exportToCSV } from "@/store/api/apiSlice";
import dayjs from "dayjs";
import KanbanPage from "@/components/kanban/KanbanPage";
import AddProject from "@/components/Projects/AddProject";
import Cookies from "js-cookie";
import SidelineDatabaseTab from "./SidelineDatabaseTab";
import Icon from "@/components/ui/Icon";
import { debounce } from "lodash";
import EditProject from "@/components/project/EditProject";
import TableSkeleton from "../table/TableSkeleton";
import TaskTableSkeleton from "@/components/skeleton/TaskTableSkeleton";
import axios from 'axios';
import Select from 'react-select';
import SubscriptionLimitModal from "@/components/subscription/SubscriptionLimitModal";
import AttachmentViewer from "@/components/Task/AttachmentViewer";

const TodoPage = () => {
  const userInfo = useSelector((state) => state.auth.user);
  const { filter, mobileTodoSidebar } = useSelector((state) => state.todo);
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const projectIdFromUrl = urlParams.get("projectId");
  const initialTask = {
    id: Date.now(),
    taskName: "",
    isEditing: true,
    projectId: projectIdFromUrl || userInfo?.default_project_id,
    initial: true,
    _id: Date.now(),
    taskId: "-",
    userId: userInfo?._id,
  };
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const { projects, loadingProject } = useSelector((state) => state.projects);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskOnMobile, setisTaskOnMobile] = useState(0);
  const [curProjectId, setCurProjectsId] = useState(0);
  const [CurrentUserId, setCurrentUserId] = useState(() => {
    // Initialize with the user's ID from URL or default to current user
    const urlUserId = new URLSearchParams(window.location.search).get("userId");
    return urlUserId || (userInfo?._id ? userInfo._id : "0");
  });
  const [filterElements, setFilterElements] = useState([]);
  const [elementsPerPage] = useState(10);
  const [pageSize, setPageSize] = useState(15);
  const pageSizeOptions = [10, 15, 25, 50, 100];
  const currentDate = new Date().toISOString()?.slice(0, 10);
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const [screenshotAllow, setScreenshotAllow] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [currentPage, setCurrentPage] = useState(() => {
    // Get page number from URL or default to 1
    const urlPage = parseInt(new URLSearchParams(window.location.search).get("page")) || 1;
    return urlPage;
  });
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedRepetition, setSelectedRepetition] = useState("");
  const [selectedTab, setSelectedTab] = useState(1);
  const [tabLoading, setTabLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setbulkLoading] = useState(false);
  const [asanaLoading, setAsanaLoading] = useState(false);
  const [slackLoading, setSlackLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [assignById, setAssignById] = useState(0);
  const [collabById, setCollabById] = useState(0);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [taskStatus, setTaskStatus] = useState([]);

  const [databaseName, setDatabaseName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [projectid, setProjectId] = useState(null);
  const [hoveredAssignee, setHoveredAssignee] = useState(false);
  const [hoveredClientAssignee, setHoveredClientAssignee] = useState(false);
  const assignee = selectedProject?.assignee_details;
  const visibleAssignee = assignee?.slice(0, 4);
  const hiddenAssignee = assignee?.slice(4);

  const clientAssignee = selectedProject?.client_assignee_details || [];
  const visibleClientAssignee = clientAssignee.slice(0, 4);
  const hiddenClientAssignee = clientAssignee.slice(4);
  const suscriptionData = useSelector((state) => state.plan.subscriptionData);


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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [taskIdForDelete, setTaskIdForDelete] = useState(null)

  const [showCsv, setshowCsv] = useState(false);
  const [isCopy, setIsCopy] = useState(false);


  // const [value, setValue] = useState(() => {
  //   const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
  //   const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
  //   return {
  //     startDate: startOfMonth,
  //     endDate: endOfMonth,
  //   };
  // });

  const [value, setValue] = useState({ startDate: "", endDate: "" });

  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);
  const [companyLimitData, setCompanyLimitData] = useState({
    total_employees: 0,
    employee_limit: 0,
  });

  // Add these new state variables near other state declarations
  const [totalPages, setTotalPages] = useState(1);
  const [currentPageNumber, setCurrentPageNumber] = useState(() => {
    // Get page number from URL or default to 1
    const urlPage = parseInt(new URLSearchParams(window.location.search).get("page")) || 1;
    return urlPage;
  });

  // Add back the processing state
  const [processing, setProcessing] = useState(false);

  // Add back the hasMore state near other state declarations
  const [hasMore, setHasMore] = useState(true);

  // Add AbortController ref for API calls
  const abortControllerRef = useRef(null);

  const [isPageLoading, setIsPageLoading] = useState(false);

  // Add this near other state declarations
  const [isApiLoading, setIsApiLoading] = useState(false);

  const tasksRef = useRef([]);

  // Keep track of previous search params to detect changes
  const prevSearchParamsRef = useRef("");

  const [defaultTaskOpen, setDefaultTaskOpen] = useState(null);

  const searchCancelTokenRef = useRef(null);
  const tasksRequestRef = useRef(null);

  const [openViaComment, setOpenViaComment] = useState(false);
  const [openViaTimeIcon, setOpenViaTimeIcon] = useState(false);
  const [openViaAttachmentIcon, setOpenViaAttachmentIcon] = useState(false);

  // View Attachment 
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(0);
  const [allAttachments, setAllAttachments] = useState([]);
  const [isProjectNameHovered, setIsProjectNameHovered] = useState(false);

  const handleAttachmentOpen = (index) => {
    setCurrentAttachment(index);
    setIsAttachmentViewerOpen(true);
  };

  const handleCommentIconClick = (task, e) => {
    e.stopPropagation();
    setOpenViaComment(true);
    handleRowClick(task, e);
  };
  const handleTimeIconClick = (task, e) => {
    e.stopPropagation();
    setOpenViaTimeIcon(true);
    handleRowClick(task, e);
  }
  const handleAttachmentIconClick = (task, e) => {
    e.stopPropagation();
    setOpenViaAttachmentIcon(true);
    handleRowClick(task, e);
  }

  const handleEditProjectClick = (e) => {
    e.stopPropagation();
    setShowEditProjectModal(true);
  };

  const handleViewProjectClick = (e) => {
    e.stopPropagation();
    navigate(`/project-details/${selectedProject._id}?name=${selectedProject?.name?.replace(/ /g, '-')}`);
  };

  // view port code for mobile view
  useEffect(() => {
    const meta = document.querySelector('meta[name=viewport]');
    const original = meta?.getAttribute('content');

    // Set to desktop-like width
    if (meta) {
      meta.setAttribute('content', 'width=1024 ,height=1024');
    }

    // Clean up on unmount
    return () => {
      if (meta && original) {
        meta.setAttribute('content', original);
      }
    };
  }, []);


  useEffect(() => {
    if (projectIdFromUrl == null) {
      setSelectedProject(null);
    }
    if (projects.length > 0 && projectIdFromUrl) {
      const foundProject = projects.find(
        (project) => String(project._id) === String(projectIdFromUrl)
      );
      setSelectedProject(foundProject);
    }
  }, [projectIdFromUrl, projects]);
  useEffect(() => {
    if (userInfo?._id) {
      dispatch(
        fetchProjects({
          companyId: userInfo?.companyId,
          _id: userInfo?._id,
          showAll: true,
          userInfo,
        })
      );
    }
  }, [userInfo, dispatch]);

  // Add a new effect that runs once on initial load to set the correct tab and filter
  useEffect(() => {
    if (userInfo?._id && !window.location.search) {
      // Only run this on first load (when there are no URL parameters yet)
      setActiveTab("MyTask");
      const newSearchParams = new URLSearchParams();
      // Set userId filter for MyTask as default
      newSearchParams.set("userId", userInfo._id);
      navigate(`?${newSearchParams.toString()}`, { replace: true });
    }
  }, [userInfo?._id]); // This should only run once when userInfo is available

  // Check for addTask query parameter and trigger addTask function
  useEffect(() => {
    const shouldAddTask = searchParams.get("addTask") === "true";
    if (shouldAddTask && !isLoading) {
      addTask();
      // Remove the query parameter to prevent triggering again on refresh
      searchParams.delete("addTask");
      setSearchParams(searchParams);
    }
  }, [searchParams, isLoading]);

  // Combine all document-level event listeners into one useEffect
  useEffect(() => {
    // Add Task Shortcut Handler
    const handleAddTaskShortcut = () => {
      addTask();
    };

    // Keyboard Shortcuts Handler
    const preventKeyboardShortcuts = (e) => {
      const isInInput = e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.className.includes("ql-editor");
      if (isInInput) return;
      const preventedKeys = ["r", "a", "n"];
      if ((e.ctrlKey || e.metaKey) && preventedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Add all event listeners
    document.addEventListener("pwpulse-add-task-shortcut", handleAddTaskShortcut);
    document.addEventListener("keydown", preventKeyboardShortcuts, true);

    // Cleanup all event listeners
    return () => {
      document.removeEventListener("pwpulse-add-task-shortcut", handleAddTaskShortcut);
      document.removeEventListener("keydown", preventKeyboardShortcuts, true);
    };
  }, []); // Empty dependency array since these handlers don't depend on any props/state

  useEffect(() => {
    // Create a script element
    const script = document.createElement("script");
    script.innerHTML = `
      gtag('event', 'conversion', {
        'send_to': 'AW-10984071991/_hRlCPGg44AaELfGzvUo',
        'value': 1.0,
        'currency': 'INR'
      });
    `;
    // Append it to the body (or head)
    document.body.appendChild(script);

    // (Optional) Remove the script on unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleBulkUpdate = async (updateData) => {
    if (selectedTasks.length === 0) {
      toast.error("No tasks selected for update");
      return;
    }
    const payload = {
      tasks: selectedTasks.map((task) => parseInt(task, 10)),
      action: "update",
      ...updateData,
    };

    const response = await fetchAuthPost(
      `${import.meta.env.VITE_APP_DJANGO}/manage-tasks/${userInfo._id}/`,
      { body: payload }
    );

    if (response.status === 1) {
      toast.success("Tasks updated successfully");

      getAllTasks(1);
      setSelectedTasks([]);
    } else {
      toast.error("Failed to update tasks");
    }
  };

  const fetchTaskStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/project-status/`);
      setTaskStatus(response.data?.unique_statuses);
    } catch (error) {
      console.error("Error fetching task status:", error);
    }
  };


  // Infinity scroll
  const loader = useRef(null);

  // Task Sorting
  const [unsortedTask, setUnsortedTask] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortProjectDirection, setSortProjectDirection] = useState("asc");
  const [sortAssignToDirection, setSortAssignToDirection] = useState("asc");
  const [sortDueDateDirection, setSortDueDateDirection] = useState("asc");

  const [selectedTask, setSelectedTask] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [showSideBar, setShowSideBar] = useState(false);

  const [kanbanMode, setKanbanMode] = useState(false);
  const [kanbanModeData, setKanbanModeData] = useState({
    columns: [{ id: "", title: "", cards: [{}] }],
  });
  // const [activeTab, setActiveTab] = useState("MyTask");
  const [activeTab, setActiveTab] = useState(() => {
    const assignById = new URLSearchParams(window.location.search).get(
      "assignById"
    );
    const collaboratorId = new URLSearchParams(window.location.search).get(
      "collaboratorId"
    );
    const userId = new URLSearchParams(window.location.search).get("userId");

    if (assignById && !collaboratorId) return "AssignedTask";
    if (collaboratorId) return "MentionedTask";
    if (!assignById && !collaboratorId && !userId) return "RecentTask"; // All tasks
    return "MyTask"; // Default fallback
  });

  const authInfo = Cookies.get("calendarAuth_credentials");

  // Filter change effect - consolidated with other filter handling
  useEffect(() => {
    // Moved to the searchParams effect to avoid duplicate calls

  }, [filter]);

  // Let's add a comment to explain the task loading sequence
  /* Task loading sequence:
   * 1. On initial load, we set userId in URL params via the initialization useEffect
   * 2. URL params change triggers the searchParams useEffect which calls getAllTasks
   * 3. On tab change, we update URL params which again triggers getAllTasks
   */

  function dataGrouping(tasks) {
    if (tasks == {}) return;

    const columns = {};
    tasks?.forEach((task) => {
      const columnKey = task.taskStatus || "unknown";

      if (!columns[columnKey]) {
        columns[columnKey] = {
          id: columnKey,
          title: columnKey?.replace("_", " ")?.toUpperCase(),
          cards: [],
        };
      }

      const card = {
        taskId: task.taskId.toString(),
        taskName: task.taskName,
        description: task.description,
        dueDate: task.dueDate,
        total_time: task.total_time,
        isComplete: task.isComplete,
        priority: task.priority,
        project: task.projectName,
        userId: task.userId,
        name: task.assign_name,
        start_date: task.dateCreated,
        collaborators: task.collaborators,
        taskCompletionPercentage: task.allocated_hours_percentage,
        projectId: task.projectId,
        taskStatus: task.taskStatus,
      };

      columns[columnKey].cards.push(card);
    });

    setKanbanModeData({ columns: Object.values(columns) });
  }

  useEffect(() => {

    dataGrouping(tasks);
  }, []);

  const getAllEmployee = async () => {
    // Using the dedicated activeUsers endpoint to fetch only active employees
    const response = await fetchAuthGET(
      `${import.meta.env.VITE_APP_DJANGO}/employee/list/activeUsers/${userInfo?.companyId
      }/`
    );
    if (response.status && response.data.length > 0) {
      let processedUsers = response.data?.map((user) => ({
        value: user._id,
        label: `${user.name} (${user.email})`,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name,
        _id: user._id,
        email: user.email,
        status: user.status,
        image: user.profile_picture
          ? `${import.meta.env.VITE_APP_DJANGO}${user.profile_picture}`
          : null,
      }));

      // If isAdmin, add 'All Users' option at the beginning
      if (isAdmin()) {
        processedUsers?.unshift({
          value: "0",
          label: "All Users",
          image: null,
        });
      }
      setUsers(processedUsers);
    }
  };

  const taskStatuses = [
    { status: "pending", color: "#3490dc", label: "Pending" }, // Blue
    { status: "in_progress", color: "#ee951d", label: "In Progress" }, // Orange
    { status: "completed", color: "#03ac66", label: "Completed" }, // Green
    { status: "testing", color: "#ffa500", label: "Testing" }, // Orange
    { status: "on_hold", color: "#d9a902", label: "On Hold" }, // Yellow
    { status: "stuck", color: "#d8314b", label: "Stuck" }, // Red
    { status: "under_review", color: "#6f42c1", label: "Under Review" }, // Purple
    { status: "archived", color: "#6c757d", label: "Archived" }, // Gray
  ];

  const sortTasks = () => {
    let sortedTasks = [...tasks];
    switch (sortDirection) {
      case "asc":
        sortedTasks.sort((a, b) => b.taskName.localeCompare(a.taskName));
        setSortDirection("desc");
        break;
      case "desc":
        sortedTasks = [...tasksRef.current];
        setSortDirection("default");
        break;
      default:
        sortedTasks.sort((a, b) => a.taskName.localeCompare(b.taskName));
        setSortDirection("asc");
        break;
    }
    setTasks(sortedTasks);
  };
  const sortProject = () => {
    let sortedTasks = [...tasks];
    switch (sortProjectDirection) {
      case "asc":
        sortedTasks.sort((a, b) => b.projectName.localeCompare(a.projectName));
        setSortProjectDirection("desc");
        break;
      case "desc":
        sortedTasks = [...tasksRef.current];
        setSortProjectDirection("default");
        break;
      default:
        sortedTasks.sort((a, b) => a.projectName.localeCompare(b.projectName));
        setSortProjectDirection("asc");
        break;
    }
    setTasks(sortedTasks);
  };
  const sortAssignTo = () => {
    let sortedTasks = [...tasks];
    switch (sortAssignToDirection) {
      case "asc":
        sortedTasks.sort((a, b) => b.assign_name.localeCompare(a.assign_name));
        setSortAssignToDirection("desc");
        break;
      case "desc":
        sortedTasks = [...tasksRef.current];
        setSortAssignToDirection("default");
        break;
      default:
        sortedTasks.sort((a, b) => a.assign_name.localeCompare(b.assign_name));
        setSortAssignToDirection("asc");
        break;
    }
    setTasks(sortedTasks);
  };
  const sortDueDate = () => {
    let sortedTasks = [...tasks];
    switch (sortDueDateDirection) {
      case "asc":
        sortedTasks.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
        setSortDueDateDirection("desc");
        break;
      case "desc":
        sortedTasks = [...tasksRef.current];
        setSortDueDateDirection("default");
        break;
      default:
        sortedTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        setSortDueDateDirection("asc");
        break;
    }
    setTasks(sortedTasks);
  };

  // Initial setup effect - consolidated to avoid duplicate API calls
  useEffect(() => {

    setIsLoading(true);

    // Layout adjustments only, API calls handled elsewhere
    if (width < breakpoints.lg && mobileTodoSidebar) {
      dispatch(toggleMobileTodoSidebar(false));
    }
  }, [width, mobileTodoSidebar, dispatch]);

  const handleFilter = (filter) => {
    if (filter == "mytask") {
      setTasks([]);
      dispatch(setFilter("mytask"));
      handleTabChange(1);
    } else if (filter == "recent") {
      setTasks([]);
      dispatch(setFilter("recent"));
      handleTabChange(0);
    } else if (filter == "assigned") {
      setTasks([]);
      dispatch(setFilter("assigned"));
      handleTabChange(2);
    } else if (filter == "mentioned") {
      setTasks([]);
      dispatch(setFilter("mentioned"));
      handleTabChange(3);
    } else if (filter == "isImported") {
      setTasks([]);
      dispatch(setFilter("isImported"));
      handleTabChange(4);
    }
  };

  // Add this near the other state variables
  const [loadedPages, setLoadedPages] = useState(new Set([1]));
  const pageTracker = useRef({ lastPage: 1 });
  const [totalTasks, setTotalTasks] = useState(0);
  // Add a new ref to track consecutive duplicate pages
  const duplicatePageCounter = useRef(0);

  // Add localStorage key constant
  const FILTER_STORAGE_KEY = "task_filters";

  // Add effect to load saved filters on component mount
  useEffect(() => {

    const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        // Apply saved filters to URL params
        const newSearchParams = new URLSearchParams(parsedFilters);
        setSearchParams(newSearchParams);
        navigate(`?${newSearchParams.toString()}`, { replace: true });
      } catch (error) {
        console.error("Error loading saved filters:", error);
      }
    }
  }, []);

  // Add effect to save filters when they change
  useEffect(() => {

    const currentFilters = Object.fromEntries(searchParams.entries());
    console.log("currentFilters", currentFilters)
    if (Object.keys(currentFilters).length > 0) {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(currentFilters));
    } else {
      localStorage.removeItem(FILTER_STORAGE_KEY);
    }
  }, [searchParams]);

  // Add request deduplication cache ref
  const recentRequestsRef = useRef(new Map());
  const lastSearchParamsRef = useRef(null);
  const apiCallCountRef = useRef(0);
  const isInitialDataLoadRef = useRef(false);

  // Add timestamp tracking for page requests
  const lastPageRequestTime = useRef({});

  // Optimize getAllTasks with proper cleanup and deduplication
  const getAllTasks = useCallback(
    async (pageNo = 1, forceRefresh = false) => {
      console.log("get all tasks called 11 ")
      console.log(pageSize)
      // Throttle requests for the same page - prevent duplicate calls within 500ms
      const now = Date.now();
      const lastRequestTime = lastPageRequestTime.current[pageNo] || 0;
      if (now - lastRequestTime < 500 && !forceRefresh) {
        return;
      }

      // Record this request time
      lastPageRequestTime.current[pageNo] = now;

      // Cancel previous requests to prevent memory waste
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Simple deduplication - prevent simultaneous calls
      if (isLoadingRef.current && !forceRefresh) {
        return;
      }

      // Create a unique request ID for this specific request
      const requestId = `get-tasks-${pageNo}-${now}`;

      try {
        // Use both ref and state for different purposes
        isLoadingRef.current = true;
        setIsApiLoading(true);

        // Set skeleton loading state at the beginning of data fetch
        setTabLoading(true);

        // New abort controller for this request
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Only clear tasks when changing filters or forcing refresh, not for simple page changes
        if (forceRefresh || pageNo === 1) {
          setTasks([]);
        }

        // Build URL with filters
        let filterStr = "";

        // Updated logic for status parameters
        // First check taskPosition (API parameter), then check taskStatus (UI parameter)
        if (searchParams.get("taskPosition")) {
          filterStr += `&taskPosition=${searchParams.get("taskPosition")}`;
        } else if (searchParams.get("taskStatus")) {
          filterStr += `&taskPosition=${searchParams.get("taskStatus")}`;
        }

        if (searchParams.get("projectId")) filterStr += `&projectId=${searchParams.get("projectId")}`;
        if (searchParams.get("userId")) filterStr += `&userId=${searchParams.get("userId")}`;
        if (searchParams.get("priority")) filterStr += `&priority=${searchParams.get("priority")}`;
        if (searchQuery) {
          filterStr += `&taskName=${searchQuery}`;
        }
        if (value?.startDate && value?.endDate) {
          filterStr += `&startDate=${value.startDate}&endDate=${value.endDate}`;
        }
        if (searchParams.get("assignById")) filterStr += `&assignById=${searchParams.get("assignById")}`;
        if (searchParams.get("collaboratorId")) filterStr += `&collaboratorId=${searchParams.get("collaboratorId")}`;
        if (searchParams.get("repeat")) filterStr += `&repeat=${searchParams.get("repeat")}`;

        // Add isImported flag to filter string if it exists in searchParams
        if (searchParams.get("isImported") === "true") {
          filterStr += `&isImported=true`;
          // Add assignById parameter for imported tasks
          filterStr += `&assignById=${userInfo?._id}`;
        }

        let url = "";
        if (userInfo?.user_type === "client") {
          let dateParams = "";
          if (value?.startDate && value?.endDate) {
            dateParams = `&startdate=${value.startDate}&endDate=${value.endDate}`;
          }
          url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/${userInfo?._id}/tasks/?page=${pageNo}&page_size=${pageSize}${dateParams}&user=${userInfo?._id}${filterStr}`;
        } else {
          if (isAdmin()) {
            url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/${userInfo?._id}/tasks/?page=${pageNo}&page_size=${pageSize}&startdate=${value.startDate}&endDate=${value.endDate}${filterStr}`;
          } else {
            url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/${userInfo?._id}/tasks/?page=${pageNo}&page_size=${pageSize}&startdate=${value.startDate}&endDate=${value.endDate}&user=${userInfo?._id}${filterStr}`;
          }
        }

        console.log("Fetching tasks from:", url);
        const data = await fetchAuthGET(url, false, { signal });
        console.log("Tasks API response:", data);
        setTotalTasks(data?.count || 0);

        if (!signal.aborted) {
          if (data?.results) {
            const results = data.results;
            setTasks(results);
            tasksRef.current = results; // Store original data in ref

            // If there was a taskId in the URL, try to select that task
            const taskIdFromUrl = searchParams.get("taskId");
            if (taskIdFromUrl && taskIdFromUrl !== "-") {
              const taskToOpen = results.find(task => task.taskId === taskIdFromUrl);
              if (taskToOpen) {
                setSelectedTask(taskToOpen);
                setIsPanelOpen(true);
              }
            }
          } else {
            setTasks([]);
          }

          setIsDropdownOpen(false);

          if (data?.count) {
            setTotalPages(Math.ceil(data.count / pageSize));
            setCurrentPageNumber(pageNo);
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("Error fetching tasks:", error);
          setTasks([]);
        }
      } finally {
        // Always clear loading states regardless of success or failure
        isLoadingRef.current = false;
        setProcessing(false);
        setTabLoading(false);
        setIsApiLoading(false);
        setIsLoading(false);
      }
    },
    [userInfo?._id, searchParams, searchQuery, value, pageSize]
  );

  // GLOBAL flag for initial data load tracking
  const initialDataLoadedRef = useRef(false);

  // Single, centralized effect for cleanup only - no data loading
  useEffect(() => {


    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Modified debouncedSearch function using Axios
  const searchTasks = useCallback((query, pageNumber = 1) => {
    // Cancel any pending requests
    if (searchCancelTokenRef.current) {
      searchCancelTokenRef.current.cancel("Operation canceled due to new request");
    }
    if (tasksRequestRef.current) {
      tasksRequestRef.current.cancel("Operation canceled due to new request");
    }

    // Skip API call if query is empty
    if (!query.trim()) {
      // Just reset search state without API call
      isLoadingRef.current = false;
      setIsApiLoading(false);
      setTabLoading(false); // Explicitly hide skeleton loader
      // Use existing filtered tasks from initial load

      return;
    }

    // Always show loading state when starting a search
    isLoadingRef.current = true;
    setIsApiLoading(true);
    setTabLoading(true); // Show skeleton loader during search

    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Create new cancel token for search request
    const cancelToken = axios.CancelToken.source();
    searchCancelTokenRef.current = cancelToken;

    // Call search API
    const companyId = userInfo?.companyId;
    const url = `${import.meta.env.VITE_APP_DJANGO}/api/tasks/search/?search=${encodeURIComponent(query)}&company_id=${companyId}&page=${pageNumber}&page_size=${pageSize}`;

    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cancelToken: cancelToken.token
    })
      .then(response => {
        const data = response.data;
        if (data?.status === 1 && data?.data?.results) {
          setTasks(data.data.results);
          setFilterElements(data.data.results);

          // Update pagination info based on total count
          if (data.data.count) {
            setTotalTasks(data.data.count);
            setTotalPages(Math.ceil(data.data.count / pageSize));
          } else {
            setTotalPages(1);
            setTotalTasks(data.data.results.length);
          }
        } else {
          setTasks([]);
          setFilterElements([]);
          setTotalPages(1);
          setTotalTasks(0);
        }
        setCurrentPage(pageNumber);
        setCurrentPageNumber(pageNumber);
        isLoadingRef.current = false;
        setIsApiLoading(false);
        setTabLoading(false); // Hide skeleton loader when done
      })
      .catch(error => {
        if (!axios.isCancel(error)) {

          setTasks([]);
          setFilterElements([]);
          isLoadingRef.current = false;
          setIsApiLoading(false);
          setTabLoading(false); // Hide skeleton loader on error too
        }
      });
  }, [userInfo?.companyId]);

  // Create a debounced version of the search function
  const debouncedSearch = useMemo(
    () => debounce((query) => {
      searchTasks(query, 1);
    }, 800),
    [searchTasks]
  );

  // Then make sure you're using this debouncedSearch in your handleSearchChange function
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Only call debouncedSearch if query has content
    if (query.trim()) {
      // Show skeleton loading when starting a search
      setTabLoading(true);
      debouncedSearch(query);
    } else {
      // If search is cleared, reset to original task list without API call
      setSearchQuery("");
      // Cancel any pending search requests
      if (searchCancelTokenRef.current) {
        searchCancelTokenRef.current.cancel("Search cleared");
      }
      // Hide skeleton loader if search is cleared
      setTabLoading(false);
    }
  }, [debouncedSearch]);

  // Create a debounced version of getAllTasks
  const debouncedGetAllTasks = useMemo(
    () => debounce((pageNo, forceRefresh) => {

      getAllTasks(pageNo, forceRefresh);
    }, 1000),
    [getAllTasks]
  );

  // Add a loading state ref to track without triggering re-renders
  const isLoadingRef = useRef(false);

  // Unified useEffect for handling search params with throttling
  useEffect(() => {
    if (!userInfo?._id) return;
    fetchTaskStatus();

    // Check if this navigation has preventApiCall state
    // If so, skip making API calls for this URL change
    if (location.state?.preventApiCall) {
      // Clear the state to prevent it from affecting future navigations
      window.history.replaceState(null, '');
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    // Extract page number early to use for throttling
    const pageNumber = parseInt(params.get("page")) || 1;

    // Throttle requests for the same page - prevent duplicate calls within 500ms 
    const now = Date.now();
    const lastRequestTime = lastPageRequestTime.current[pageNumber] || 0;
    if (now - lastRequestTime < 500) {

      return;
    }

    // Record this request time
    lastPageRequestTime.current[pageNumber] = now;

    // Prevent API calls if one is already in progress
    if (isLoadingRef.current) {

      return;
    }

    // Check if the only parameter that changed is taskId
    // If so, don't reload task list data
    const onlyTaskIdChanged = () => {
      const currentParams = new URLSearchParams(searchParams.toString());
      const previousParams = new URLSearchParams(prevSearchParamsRef.current || "");

      // Remove taskId from both params for comparison
      currentParams.delete("taskId");
      previousParams.delete("taskId");

      // Compare the remaining parameters
      return currentParams.toString() === previousParams.toString();
    };

    // Store current params for future comparison
    prevSearchParamsRef.current = searchParams.toString();

    // If only taskId changed, don't reload task list
    if (params.has("taskId") && onlyTaskIdChanged()) {
      return;
    }

    // Continue with normal processing for other param changes
    params.delete("taskId"); // ignore taskId

    // Extract all filter values at once
    const status = params.get("taskStatus") || params.get("taskPosition") || "";
    const projectId = params.get("projectId") || "";
    const userId = params.get("userId") || "";
    const startDate = params.get("startDate") || "";
    const endDate = params.get("endDate") || "";
    const priority = params.get("priority") || "";
    const assignBy = params.get("assignById") || "";
    const collaboratorId = params.get("collaboratorId") || "";

    // Update state variables in one batch
    setSelectedStatus(status);
    setSelectedPriority(priority);
    setCurProjectsId(projectId);
    setCurrentUserId(userId);
    setStartDate(startDate);
    setEndDate(endDate);
    setCurrentPageNumber(pageNumber);
    setCurrentPage(pageNumber);

    // Reset pagination only if not specified in URL
    if (!params.has("page")) {
      setCurrentPage(1);
      setCurrentPageNumber(1);
      setHasMore(true);
      setLoadedPages(new Set([1]));
      pageTracker.current.lastPage = 1;
    }

    // Use the ref to track loading state
    isLoadingRef.current = true;


    // Call function directly
    getAllTasks(pageNumber, true);

    return () => {
      // Clean up loading state on unmount
      isLoadingRef.current = false;
    };
  }, [
    searchParams.toString(), // Depend on the whole string instead of individual params
    userInfo?._id,
    getAllTasks,
    location.state // Add location.state as a dependency
  ]);

  // Mobile task view effect - consolidated to avoid duplicate API calls
  useEffect(() => {

    setCurrentPage(1);
    setHasMore(true); // Reset hasMore when mobile view changes
    setLoadedPages(new Set([1])); // Reset loaded pages
    pageTracker.current.lastPage = 1; // Reset the page tracker

    // Data fetching now handled by searchParams effect
  }, [isTaskOnMobile]);

  // Add the date initialization effect back
  useEffect(() => {
    const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
    const endOfCurrentDate = moment().endOf("month").format("YYYY-MM-DD");
    const storedStartDate = localStorage.getItem("startDate");
    const storedEndDate = localStorage.getItem("endDate");
    const initialStartDate = storedStartDate || startOfMonth;
    const initialEndDate = storedEndDate || endOfCurrentDate;
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    getAllEmployee();
  }, []);

  /*For Bottom Bar */
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedrowTasks, setSelectedrowTasks] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const [isBottomBarVisible, setBottomBarVisible] = useState(false);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTasks(tasks?.map((task) => task._id));
      setAllSelected(true);
    } else {
      setSelectedTasks([]);
      setAllSelected(false);
    }
    setBottomBarVisible(event.target.checked);
  };

  const closeBottomBar = () => {
    setSelectedTasks([]);
    setAllSelected(false);
    setBottomBarVisible(false); // Hide BottomBar on close button click
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTasks((prevSelected) => {
      const isSelected = prevSelected.includes(taskId);
      const updatedSelected = isSelected
        ? prevSelected.filter((id) => id !== taskId)
        : [...prevSelected, taskId];

      // Update other states based on updated selection
      setAllSelected(updatedSelected.length === tasks.length);
      setBottomBarVisible(updatedSelected.length > 0);



      return updatedSelected;
    });
  };
  const handleRowTaskSelect = (taskId) => {
    console.log("before", selectedrowTasks)
    console.log("taskid", taskId)
    setSelectedrowTasks([taskId]);
    console.log("after", selectedrowTasks)
  };

  // Wrap deleteTasks with memory logging
  const deleteTasks = async () => {
    try {
      setbulkLoading(true);
      if (selectedTasks.length === 0) {
        toast.error("No tasks selected for deletion");
        setbulkLoading(false);
        return;
      }
      const payload = {
        tasks: selectedTasks?.map((task) => parseInt(task, 10)),
      };
      const response = await fetchAuthPost(
        `${import.meta.env.VITE_APP_DJANGO}/delete-tasks/${userInfo?._id}/`,
        {
          body: payload,
        }
      );
      if (response.status === 1) {
        toast.success("Task deleted successfully");

        setTasks(tasks.filter((task) => !selectedTasks.includes(task._id)));
        setSelectedTasks([]);
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the task");
    } finally {
      setbulkLoading(false);
      setAllSelected(false);
      setModalIsOpen(false);
      closeBottomBar();
    }
  };

  //delete one task by id
  const deleteTask = async () => {
    setLoading(true);
    if (!taskIdForDelete) return;
    try {
      const response = await fetchDelete(
        `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${taskIdForDelete}`
      );
      if (response.status == 1) {
        toast.success("Task deleted successfully");
        setTasks(tasks.filter((task) => task.taskId !== taskIdForDelete));
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the task");
    } finally {
      setLoading(false);
      setOpen(false);
      closePanel()
    }
  };

  // Memoize selected task data
  const selectedTasksData = useMemo(() => {
    if (selectedTasks.length === 0) return [];
    return tasks.filter(task => selectedTasks.includes(task._id));
  }, [tasks, selectedTasks]);

  // Use this for exports and other operations
  const exportTasks = () => {
    const selectedCols = [
      "taskName", "projectName", "assign_name",
      "client_name", "dateCreated", "priority"
    ];
    const newHeaders = [
      "Task", "Project", "Assign",
      "Client", "Date Created", "Priority"
    ];

    exportToCSV(
      selectedTasksData, // Use memoized data
      "selected_tasks.csv",
      selectedCols,
      newHeaders
    );
    closeBottomBar();
  };

  const copyTasks = () => {
    if (selectedTasks.length === 0) {
      toast.error("No tasks selected for copy");
      return;
    }
    const baseUrl = `${window.location.origin}/tasks`;
    const urls = selectedTasks.map(id => `${baseUrl}?taskId=${id}`).join('\n'); // newline-separated

    navigator.clipboard
      .writeText(urls)
      .then(() => {
        setIsCopy(true);
        setTimeout(() => {
          setIsCopy(false);
          closeBottomBar(); // Close after isCopy is set to false
        }, 1000);
      })
      .catch(() => {
        setIsCopy(false);
      });
  }

  const toastMsg = (type, msg) => {
    type === "success" ? toast.success(msg) : toast.error(msg);
  };

  const handleRowClick = async (task, event) => {
    // Prevent opening if already editing or clicking a text input
    if (task.isEditing || (event.target.type === "text")) return;

    // Set the taskId parameter in the URL without triggering a reload
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("taskId", task.taskId);

    // Use the replace option to avoid adding to browser history
    // and set state: false to prevent state changes from triggering API calls
    navigate(`?${newSearchParams.toString()}`, {
      replace: true,
      state: { preventApiCall: true }
    });

    // Always fetch fresh task data when opening the panel
    try {
      setIsPageLoading(true);
      // Fetch complete task data including description
      const response = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${task.taskId}/`
      );

      if (response.status) {
        // Create a complete task object with fresh data from the API
        const completeTask = {
          ...task,
          ...response.data,
          description: response.data.description || ""
        };

        // Now we have the full task with description
        setSelectedTask(completeTask);
        setIsPanelOpen(true);
      } else {
        // If fetch fails, open with original task data
        setSelectedTask(task);
        setIsPanelOpen(true);
      }
    } catch (error) {
      console.error("Error fetching complete task data:", error);
      // Open panel with original task data as fallback
      setSelectedTask(task);
      setIsPanelOpen(true);
    } finally {
      setIsPageLoading(false);
    }
  };

  // Update comment count on a specific task when a new comment is added
  const updateTaskCommentCount = (taskId, newCount) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.taskId === taskId ? { ...task, total_comments: newCount } : task
      )
    );
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setSelectedrowTasks([]); // Clear row selection when closing panel

    // Remove the taskId parameter from the URL without triggering a reload
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("taskId");

    // Use the replace option and preventApiCall state to avoid triggering API calls
    navigate(`?${newSearchParams.toString()}`, {
      replace: true,
      state: { preventApiCall: true }
    });
  };

  const formatOptionLabel = ({
    value,
    label,
    image,
    first_name,
    last_name,
    name,
  }) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      {image ? (
        <img
          src={`${image}`}
          alt={first_name}
          className="w-5 h-[1.2rem] rounded-full"
        />
      ) : (
        <p className="w-5 h-[1.2rem] rounded-full border flex justify-center items-center font-semibold bg-slate-200 text-f14">
          {intialLetterName(first_name, last_name, name)}
        </p>
      )}
      <div className="px-2">{first_name ? first_name : label}</div>
    </div>
  );


  // Add a function to check company employee limits
  const checkEmployeeLimit = async () => {
    try {
      // Only apply this restriction for companyId == 2
      if (userInfo?.companyId === 2) {
        const data = await fetchAuthGET(
          `${import.meta.env.VITE_APP_DJANGO}/company/${userInfo.companyId
          }/details/`
        );

        if (data && data.company) {
          const companyData = data.company;

          setCompanyLimitData({
            active_users_count: companyData.active_users_count || 0,
            employee_limit: companyData.employee_limit || 0,
          });

          // Return true if limit is reached
          return companyData.active_users_count > companyData.employee_limit;
        }
        return false;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error checking employee limit:", error);
      return false;
    }
  };

  // Add this new function to check the subscription limit
  const checkSubscriptionLimit = () => {
    // Check user limit in Redux state
    dispatch(checkUserLimit());
    return canAddTask;
  };

  // Check limit via redux
  const canAddTask = useSelector((state) => state.plan.canAddTask);
  const checkLimit = () => {
    dispatch(checkUserLimit());
    if (!canAddTask) {
      dispatch(setShowLimitModal(true));
      return false;
    }
    return true;
  };

  // Wrap addTask with memory logging
  const addTask = async (index = null) => {
    // Check if there are any empty task rows
    const hasEmptyTask = tasks?.some(
      (task) => task.taskName.trim() === "" && task.isEditing
    );
    if (hasEmptyTask) {
      return; // Don't create a new task if there's already an empty one
    }

    // Check subscription limits before allowing task creation
    if (!checkLimit()) {
      return; // The modal will be shown automatically by the hook
    }

    // Get current project ID from URL params or selected project
    const urlParams = new URLSearchParams(location.search);
    const urlProjectId = urlParams.get("projectId");
    const currentProjectId =
      selectedProject?._id ||
      urlProjectId ||
      curProjectId ||
      userInfo?.default_project_id;

    const newTaskId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newTask = {
      ...initialTask,
      _id: newTaskId,
      isEditing: true,
      projectId: currentProjectId,
    };

    if (index !== null && Array.isArray(tasks)) {
      // Insert new task below the specified index
      setTasks([
        ...tasks.slice(0, index + 1),
        newTask,
        ...tasks.slice(index + 1),
      ]);
    } else {
      // Insert new task at the top of the list
      setTasks([newTask, ...(tasks || [])]); // Ensure tasks is an array
    }
    setLastAddedTaskId(newTaskId);
  };

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
  const updateTaskFields = (taskId, fieldName, value) => {
    setTasks((prevTasks) =>
      prevTasks?.map((task) =>
        task?._id === taskId ? { ...task, [fieldName]: value } : task
      )
    );

    handleChildChange();
  };

  const handleChildChange = () => {
    setForceUpdate((prevState) => !prevState);
  };

  // Wrap handleSearch with memory logging
  const handleSearch = (e, type) => {
    setCurrentPage(1);
    // Explicitly show skeleton loader when applying filters
    setTabLoading(true);
    const newSearchParams = new URLSearchParams(searchParams);

    // Clear the tasks array when applying new filters
    setTasks([]);

    // Handle each filter type
    switch (type) {
      case "projectId":
        setCurProjectsId(e.value);
        if (e.value !== undefined) {
          if (e.value === "") {
            newSearchParams.delete(type);
          } else {
            newSearchParams.set(type, e.value);
          }
        }
        break;

      case "userId":
        setCurrentUserId(e.value);
        e.value === "0"
          ? newSearchParams.delete(type)
          : newSearchParams.set(type, e.value);
        break;

      case "taskStatus":
        setSelectedStatus(e.value);
        if (e.value !== undefined) {
          if (e.value === "") {
            newSearchParams.delete("taskPosition");
            newSearchParams.delete(type);
          } else {
            // Set taskPosition parameter instead of taskStatus
            newSearchParams.set("taskPosition", e.value);
            // Also keep taskStatus for the UI state
            newSearchParams.set(type, e.value);
          }
        }
        break;

      case "priority":
        setSelectedPriority(e.target.value);
        e.target.value
          ? newSearchParams.set(type, e.target.value)
          : newSearchParams.delete(type);
        break;

      case "dateRange":
        if (startDate && endDate) {
          newSearchParams.set("startDate", startDate);
          newSearchParams.set("endDate", endDate);
        } else {
          newSearchParams.delete("startDate");
          newSearchParams.delete("endDate");
        }
        break;

      case "repeat":
        setSelectedRepetition(e.value);
        if (e.value !== undefined) {
          if (e.value === "") {
            newSearchParams.delete(type);
          } else {
            newSearchParams.set(type, e.value);
          }
        }
        break;

      default:
        break;
    }

    // Reset pagination related states
    setLoadedPages(new Set([1]));
    pageTracker.current.lastPage = 1;
    setHasMore(true);

    // Update URL and trigger data fetch
    navigate(`?${newSearchParams.toString()}`, { replace: true });

    // Force refresh to ensure the filter change is respected

    setTimeout(() => {
      getAllTasks(1, true);
    }, 0);
  };



  const taskIdUrl = searchParams.get("taskId");

  useEffect(() => {
    // Only open panel if taskId exists and is not "-" (which indicates an invalid/incomplete task)
    if (taskIdUrl !== null && taskIdUrl !== "-") {
      setIsPanelOpen(true);
    } else if (taskIdUrl === "-") {
      // Create a new task when taskId="-" appears in the URL
      addTask();

      // Remove the taskId parameter from URL after triggering task creation
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("taskId");
      navigate(`?${newSearchParams.toString()}`, {
        replace: true,
        state: { preventApiCall: true }
      });
    }
  }, [taskIdUrl, searchParams, navigate, addTask]);

  // Handling URL changes and task opening
  useEffect(() => {
    const taskIdFromUrl = searchParams.get("taskId");
    // Skip invalid task IDs (like "-" which is used for incomplete tasks)
    if (taskIdFromUrl && taskIdFromUrl !== "-") {
      const taskToOpen = tasks.find((task) => task.taskId === taskIdFromUrl);
      if (taskToOpen) {
        setSelectedTask(taskToOpen);
        setDefaultTaskOpen(taskIdFromUrl);
        setIsPanelOpen(true);
      } else {
        // Optionally fetch task if not found in current tasks
        const fetchTaskById = async (taskId) => {
          // Special case for taskId="-": create a new task
          if (taskId === "-") {

            addTask();

            // Clean up URL after creating task
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete("taskId");
            navigate(`?${newSearchParams.toString()}`, {
              replace: true,
              state: { preventApiCall: true }
            });
            return;
          }

          // Skip fetch for other invalid taskIds
          if (!taskId) {
            console.warn("Invalid taskId, skipping fetch");
            return;
          }

          try {
            // Use AbortController to cancel previous requests
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            // Directly fetch just the single task without refreshing the whole list
            const data = await fetchAuthGET(
              `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${taskId}/`,
              false,
              { signal: abortControllerRef.current.signal }
            );

            if (data.status && !abortControllerRef.current.signal.aborted) {
              setSelectedTask(data.data);
              setDefaultTaskOpen(taskId);
              setIsPanelOpen(true);
            } else {
              // Task not found or invalid
              setIsPanelOpen(false);
            }
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error("Error fetching task:", error);
              // Close panel on error
              setIsPanelOpen(false);
            }
          }
        };
        fetchTaskById(taskIdFromUrl);
      }
    }
  }, [searchParams.get("taskId")]);  // Only depend on taskId parameter, not all searchParams

  function handleTabChange(tabIndex) {
    setSelectedTab(tabIndex);
    // Show skeleton loader when changing tabs
    setTabLoading(true);

    // Clear task list and pagination
    setTasks([]);
    setLoadedPages(new Set([1]));
    setCurrentPage(1);
    setHasMore(true);
    pageTracker.current.lastPage = 1;

    // Start with your current search params
    const newSearchParams = new URLSearchParams();

    // Only projectId should be kept (if it exists)
    const projectId = searchParams.get("projectId");
    if (projectId) {
      newSearchParams.set("projectId", projectId);
    }

    if (tabIndex == "0") {
      // Clear user-related filters, keep projectId if present
      // newSearchParams.delete("userId");
      // newSearchParams.delete("assignById");
      // newSearchParams.delete("collaboratorId");
    } else if (tabIndex == "1") {
      setCurrentUserId(userInfo._id);
      newSearchParams.set("userId", userInfo._id);
    } else if (tabIndex == "2") {
      setAssignById(userInfo._id);
      newSearchParams.set("assignById", userInfo._id);
    } else if (tabIndex == "3") {
      setCollabById(userInfo._id);
      newSearchParams.set("collaboratorId", userInfo._id);
    } else if (tabIndex == "4") {
      // Handle Imported Tasks tab
      newSearchParams.set("isImported", "true");
    }

    // Navigate without overriding projectId
    navigate(`?${newSearchParams.toString()}`, { replace: true });

    // Set tabLoading to false after a small delay to ensure smooth transition
    // setTimeout(() => {
    //   setTabLoading(false);
    // }, 500);
  }

  // Add back the tab handling functions
  const handleTabClick = (tabId) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);

    // Clear all filters when switching to Imported Tasks tab
    if (tabId === "ImportedTask") {
      // Reset all filter states
      setSelectedStatus("");
      setSelectedPriority("");
      setCurProjectsId("");
      setCurrentUserId("");
      setStartDate("");
      setEndDate("");
      setValue({ startDate: "", endDate: "" });
      setSearchQuery("");

      // Create new search params with only isImported flag
      const newSearchParams = new URLSearchParams();
      newSearchParams.set("isImported", "true");

      // Navigate with clean URL
      navigate(`?${newSearchParams.toString()}`, { replace: true });

      // Force refresh tasks list with isImported flag
      const url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/${userInfo?._id}/tasks/?page=1&page_size=${pageSize}&isImported=true`;
      fetchAuthGET(url).then(data => {
        if (data?.results) {
          setTasks(data.results);
          setTotalTasks(data.count);
          setTotalPages(Math.ceil(data.count / pageSize));
          setCurrentPageNumber(1);
        }
      });
      return;
    }

    switch (tabId) {
      case "MyTask":
        handleFilter("mytask");
        break;
      case "RecentTask":
        handleFilter("recent");
        break;
      case "AssignedTask":
        handleFilter("assigned");
        break;
      case "MentionedTask":
        handleFilter("mentioned");
        break;
      default:
        break;
    }
  };

  // Add back the tab effect
  useEffect(() => {
    const assignById = searchParams.get("assignById");
    const collaboratorId = searchParams.get("collaboratorId");
    const userId = searchParams.get("userId");
    const isImported = searchParams.get("isImported");

    if (isImported === "true") {
      setActiveTab("ImportedTask");
    } else if (assignById && !collaboratorId) {
      setActiveTab("AssignedTask");
    } else if (collaboratorId) {
      setActiveTab("MentionedTask");
    } else if (!assignById && !collaboratorId && !userId) {
      setActiveTab("RecentTask");
    } else {
      setActiveTab("MyTask");
    }
  }, [searchParams.toString()]);

  useEffect(() => {
    // Prevent fetching the first page if already on a different page
    if (currentPageNumber > 1) {
      return;
    }
    if (activeTab === "MyTask") {
      handleFilter("mytask");
    } else if (activeTab === "RecentTask") {
      handleFilter("recent");
    } else if (activeTab === "AssignedTask") {
      handleFilter("assigned");
    } else if (activeTab === "MentionedTask") {
      handleFilter("mentioned");
    } else if (activeTab === "ImportedTask") {
      handleFilter("isImported");
    }
  }, [activeTab]);

  // Add back the project name verification function
  const verifyProjectName = async (projectName) => {
    if (!projectName) return userInfo.default_project_id;

    let defaultProjectId = userInfo.default_project_id;
    let allProjects = projects;
    allProjects.map((project) => {
      if (project.name.toLowerCase() === projectName.toLowerCase()) {
        defaultProjectId = project._id;
      }
    });

    return defaultProjectId;
  };

  // Add back the task creation API function
  const createTaskAPI = async (taskName, projectId, status) => {
    try {
      const limitReached = await checkEmployeeLimit();
      if (limitReached) {
        setShowLimitReachedModal(true);
        throw new Error("Employee limit reached");
      }

      const payload = {
        taskName,
        userId: userInfo._id,
        projectId,
      };

      if (status) {
        payload.taskPosition = status;
      }

      const response = await fetchPOST(
        `${import.meta.env.VITE_APP_DJANGO}/create-task/${userInfo._id}/`,
        {
          body: payload,
        }
      );

      if (!response.status) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      getAllTasks(1);
      return response;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Component mount code here

    return () => {
      // Cancel any pending API requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Cancel debounced functions
      if (debouncedSearch && debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }

      if (debouncedGetAllTasks && debouncedGetAllTasks.cancel) {
        debouncedGetAllTasks.cancel();
      }

      // Clear request tracking
      recentRequestsRef.current.clear();
    };
  }, []);

  // Handle Enter key press during task creation
  const handleEnterKeyPress = (taskId, taskName) => {
    // Only proceed if the task name is not empty
    if (taskName && taskName.trim() !== "") {
      // Find the index of the current task
      const currentTaskIndex = tasks.findIndex(task => task._id === taskId);
      if (currentTaskIndex !== -1) {
        // Create a new task above the current one
        const newTaskId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Get current project ID from URL params or selected project
        const urlParams = new URLSearchParams(location.search);
        const urlProjectId = urlParams.get("projectId");
        const currentProjectId =
          selectedProject?._id ||
          urlProjectId ||
          curProjectId ||
          userInfo?.default_project_id;

        const newTask = {
          ...initialTask,
          _id: newTaskId,
          isEditing: true,
          projectId: currentProjectId,
        };

        // First explicitly update the current task with the correct name
        // This ensures the task name is preserved before we insert the new task
        setTasks(prevTasks => {
          const updatedTasks = [...prevTasks];
          // Make sure the current task has the correct name
          updatedTasks[currentTaskIndex] = {
            ...updatedTasks[currentTaskIndex],
            taskName: taskName
          };

          // Now insert the new task
          return [
            ...updatedTasks.slice(0, currentTaskIndex),
            newTask,
            ...updatedTasks.slice(currentTaskIndex)
          ];
        });

        // Focus on the new empty task
        setLastAddedTaskId(newTaskId);
      }
    }
  };

  // Add back the sync and import related functions
  const handleSyncAsana = async () => {
    setAsanaLoading(true);
    window.location.href = `${import.meta.env.VITE_APP_DJANGO}/api/asana/oauth/authorize/`;
  };

  const handleSyncSlack = async () => {
    setSlackLoading(true);
    try {
      window.location.href = `https://slack.com/oauth/v2/authorize?client_id=300736333696.8240131070320&scope=app_mentions:read,assistant:write,channels:history,channels:read,chat:write,commands,groups:history,groups:read,im:history,im:read,im:write,mpim:history,mpim:read,mpim:write,users:read,users:read.email&user_scope=chat:write,groups:read,im:read,team:read,channels:read,users:read,users:read.email`;
    } catch (error) {
      console.error("Slack sync error:", error);
    } finally {
      setSlackLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    setshowCsv(true);
  };

  const handleAddEmployee = () => {
    navigate("/invite-user");
  };

  const handleAddProject = () => {
    setShowAddProjectModal(true);
  };

  // Add back the project options setup
  const options = projects?.map((project) => ({
    value: project._id,
    label: project.name,
    isProject: true,
  }));

  // Add "All Projects" option at the beginning of the options array
  if (options && options.length > 0) {
    options.unshift({
      value: "",
      label: "All Projects",
      __isSpecialOption: true,
      __isAllProjectsOption: true,
    });
  }

  // Add back the page change handler
  const handlePageChange = useCallback((pageNumber) => {
    // Throttle page change requests - prevent duplicate calls within 500ms
    const now = Date.now();
    const lastRequestTime = lastPageRequestTime.current[pageNumber] || 0;
    if (now - lastRequestTime < 500) {
      return;
    }

    // Record this request time
    lastPageRequestTime.current[pageNumber] = now;

    // Prevent page change if API call is in progress
    if (isLoadingRef.current) {
      return;
    }

    if (pageNumber < 1 || pageNumber > totalPages) {
      return;
    }

    // Create a request ID to track this specific request
    const requestId = `page-${pageNumber}-${now}`;

    // Update current page number immediately to avoid race conditions
    setCurrentPageNumber(pageNumber);
    setCurrentPage(pageNumber);

    // Update URL with page number
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", pageNumber.toString());
    navigate(`?${newSearchParams.toString()}`, {
      replace: true,
    });

    // Set loading ref first to prevent duplicate calls
    isLoadingRef.current = true;

    // Call API directly - no need for timeout
    if (searchQuery.trim()) {
      // If searching, use the search API with the current query
      searchTasks(searchQuery, pageNumber);
    } else {
      // Otherwise use normal task loading
      getAllTasks(pageNumber, true);
    }
  }, [totalPages, getAllTasks, currentPageNumber, searchQuery, searchTasks, navigate, searchParams]);

  // Modify handlePageSizeChange to make a direct API call with the new page size
  const handlePageSizeChange = useCallback((e) => {
    const newSize = Number(e.target.value);

    // Store current page size for API call before updating state
    const currentPageSizeForApi = newSize;

    // Now update state (which will trigger useEffect)
    setPageSize(newSize);

    // Reset page number
    setCurrentPageNumber(1);

    // Show loading state
    setTabLoading(true);

    // Build the API URL directly with the new page size
    let filterStr = "";
    if (searchParams.get("taskPosition")) {
      filterStr += `&taskPosition=${searchParams.get("taskPosition")}`;
    } else if (searchParams.get("taskStatus")) {
      filterStr += `&taskPosition=${searchParams.get("taskStatus")}`;
    }

    if (searchParams.get("projectId")) filterStr += `&projectId=${searchParams.get("projectId")}`;
    if (searchParams.get("userId")) filterStr += `&userId=${searchParams.get("userId")}`;
    if (searchParams.get("priority")) filterStr += `&priority=${searchParams.get("priority")}`;
    if (searchQuery) {
      filterStr += `&taskName=${searchQuery}`;
    }
    if (value?.startDate && value?.endDate) {
      filterStr += `&startDate=${value.startDate}&endDate=${value.endDate}`;
    }
    if (searchParams.get("assignById")) filterStr += `&assignById=${searchParams.get("assignById")}`;
    if (searchParams.get("collaboratorId")) filterStr += `&collaboratorId=${searchParams.get("collaboratorId")}`;

    // Make API call directly with the new page size
    let url = "";
    if (userInfo?.user_type === "client") {
      let dateParams = "";
      if (value?.startDate && value?.endDate) {
        dateParams = `&startdate=${value.startDate}&endDate=${value.endDate}`;
      }
      url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/${userInfo?._id}/tasks/?page=1&page_size=${currentPageSizeForApi}${dateParams}&user=${userInfo?._id}${filterStr}`;
    } else {
      if (isAdmin()) {
        url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/${userInfo?._id}/tasks/?page=1&page_size=${currentPageSizeForApi}&startdate=${value.startDate}&endDate=${value.endDate}${filterStr}`;
      } else {
        url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/${userInfo?._id}/tasks/?page=1&page_size=${currentPageSizeForApi}&startdate=${value.startDate}&endDate=${value.endDate}&user=${userInfo?._id}${filterStr}`;
      }
    }

    // Make direct API call
    fetchAuthGET(url).then(data => {
      if (data?.results) {
        setTasks(data.results);
        setTotalTasks(data.count);
        setTotalPages(Math.ceil(data.count / currentPageSizeForApi));
      }
      setTabLoading(false);
    }).catch(() => {
      setTabLoading(false);
    });

  }, [searchParams, userInfo, value, searchQuery, isAdmin]);

  // Add a new effect to handle Imported Tasks tab
  useEffect(() => {
    if (activeTab === "ImportedTask") {
      const url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/${userInfo?._id}/tasks/?page=1&page_size=${pageSize}&isImported=true`;
      fetchAuthGET(url).then(data => {
        if (data?.results) {
          setTasks(data.results);
          setTotalTasks(data.count);
          setTotalPages(Math.ceil(data.count / pageSize));
          setCurrentPageNumber(1);
        }
      });
    }
  }, [activeTab, userInfo?.companyId, userInfo?._id, pageSize]);

  // Add this new useEffect specifically for handling initial load with both userId and taskId
  useEffect(() => {
    // Only run this effect once on component mount when both parameters are present
    const taskIdParam = searchParams.get("taskId");
    const userIdParam = searchParams.get("userId");

    if (taskIdParam && userIdParam && userInfo?._id && !isPageLoading) {
      setIsPageLoading(true);
      setTabLoading(true); // Show skeleton loader

      // First fetch tasks using only the userId
      const fetchTasksByUserId = async () => {
        try {
          // Create URL with only userId filter
          const url = `${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/${userInfo?._id}/tasks/?page=1&page_size=${pageSize}&userId=${userIdParam}`;

          const data = await fetchAuthGET(url);

          if (data?.results) {
            // Update the tasks list
            setTasks(data.results);
            tasksRef.current = data.results; // Update the reference as well

            // Find the specific task by its ID
            const targetTask = data.results.find(task => task.taskId === taskIdParam);

            if (targetTask) {
              // If found in the initial data, use it directly
              setSelectedTask(targetTask);
              setIsPanelOpen(true);
            } else {
              // If not found in the initial data, fetch the specific task
              try {
                const taskResponse = await fetchAuthGET(
                  `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${taskIdParam}/`
                );

                if (taskResponse.status) {
                  setSelectedTask(taskResponse.data);
                  setIsPanelOpen(true);
                }
              } catch (error) {
                console.error("Error fetching specific task:", error);
              }
            }
          } else {
            // Handle case where no results were returned
            setTasks([]);
          }
        } catch (error) {
          console.error("Error fetching tasks by userId:", error);
          setTasks([]); // Reset tasks on error
        } finally {
          // Always make sure to reset loading states
          setIsPageLoading(false);
          setTabLoading(false);
          setIsApiLoading(false);
          isLoadingRef.current = false;
        }
      };

      fetchTasksByUserId();
    }
  }, [searchParams, userInfo, pageSize]);

  // Handle individual taskId parameter (existing functionality)
  useEffect(() => {
    // Only open panel if taskId exists and is not "-" (which indicates an invalid/incomplete task)
    if (taskIdUrl !== null && taskIdUrl !== "-") {
      setIsPanelOpen(true);
    } else if (taskIdUrl === "-") {
      // Create a new task when taskId="-" appears in the URL
      addTask();

      // Remove the taskId parameter from URL after triggering task creation
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("taskId");
      navigate(`?${newSearchParams.toString()}`, {
        replace: true,
        state: { preventApiCall: true }
      });
    }
  }, [taskIdUrl, searchParams, navigate, addTask]);

  const [taskAttachmentCounts, setTaskAttachmentCounts] = useState({});

  const updateTaskAttachmentCount = (taskId, count) => {

    setTaskAttachmentCounts(prev => ({
      ...prev,
      [taskId]: count
    }));

  };

  return (
    <>
      {showCsv ? (
        <SidelineDatabaseTab
          databaseName={databaseName}
          setDatabaseName={setDatabaseName}
          fields={fields}
          setFields={setFields}
          setSelectedTemplate={setSelectedTemplate}
          setshowCsv={setshowCsv}
          getAllTasks={getAllTasks}
          handleTabClick={handleTabClick}
        />
      ) : (
        <>
          <ToastContainer />
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm  ">
            {/* Header Section */}
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="px-6 pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <h1 className="text-xl font-bold">Tasks</h1>
                  {selectedProject != null && (
                    <div className="flex items-center">
                      <Icon icon="uiw:right" className="mx-2" />
                      <div
                        className="group flex items-center"
                        onMouseEnter={() => setIsProjectNameHovered(true)}
                        onMouseLeave={() => setIsProjectNameHovered(false)}
                      >
                        <span className={`truncate text-lg font-medium transition-all duration-150 ${isProjectNameHovered ? 'underline text-blue-500 cursor-pointer' : ''
                          }`}>
                          {selectedProject?.name}
                        </span>
                        {/* Inline Hover Icons */}
                        <span className={`flex items-center ml-2 transition-opacity duration-150 ${isProjectNameHovered ? 'opacity-100' : 'opacity-0'}`}>
                          <a
                            href={`/project-details/${selectedProject._id}?name=${selectedProject?.name?.replace(/ /g, '-')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
                            title="View Project"
                            tabIndex={-1}
                            onClick={e => e.stopPropagation()}
                          >
                            <Icon icon="heroicons:eye" className="w-4 h-4" />
                          </a>
                          <button
                            onClick={handleEditProjectClick}
                            className="p-1 text-slate-600 hover:text-green-600 dark:text-slate-300 dark:hover:text-green-400 transition-colors"
                            title="Edit Project"
                          >
                            <Icon icon="heroicons-outline:pencil-alt" className="w-4 h-4" />
                          </button>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 justify-between">
                  <div className="inline-flex items-center bg-slate-50 dark:bg-slate-700 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
                    <button
                      onClick={() => handleTabClick("RecentTask")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 inline-flex items-center whitespace-nowrap ${activeTab === "RecentTask"
                        ? "text-blue-600 bg-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                    >
                      <Icon
                        icon="heroicons:list-bullet"
                        className="w-4 h-4 mr-1"
                      />
                      All Tasks
                    </button>
                    <button
                      onClick={() => handleTabClick("MyTask")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 inline-flex items-center whitespace-nowrap ${activeTab === "MyTask"
                        ? "text-blue-600 bg-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                    >
                      <Icon icon="heroicons:user" className="w-4 h-4 mr-1" />
                      My Tasks
                    </button>
                    <button
                      onClick={() => handleTabClick("AssignedTask")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 inline-flex items-center whitespace-nowrap ${activeTab === "AssignedTask"
                        ? "text-blue-600 bg-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                    >
                      <Icon
                        icon="heroicons:user-group"
                        className="w-4 h-4 mr-1"
                      />
                      Assigned Tasks
                    </button>
                    <button
                      onClick={() => handleTabClick("MentionedTask")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 inline-flex items-center whitespace-nowrap ${activeTab === "MentionedTask"
                        ? "text-blue-600 bg-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                    >
                      <Icon icon="heroicons:at-symbol" className="w-4 h-4 mr-1" />
                      Mentioned Tasks
                    </button>
                    <button
                      onClick={() => handleTabClick("ImportedTask")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 inline-flex items-center whitespace-nowrap ${activeTab === "ImportedTask"
                        ? "text-blue-600 bg-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        }`}
                    >
                      <Icon icon="lucide:import" className="w-4 h-4 mr-1" />
                      Imported Tasks
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Section */}
            <div className="flex flex-col h-[calc(100vh-180px)]">
              <div className="flex-1 overflow-hidden">
                <Card
                  bodyClass="p-0 h-full"
                  className="h-full border-0 shadow-none"
                >
                  <SimpleBar className="h-full all-todos">
                    <TodoHeader
                      onChange={handleSearchChange}
                      setShowSideBar={setShowSideBar}
                      showSideBar={showSideBar}
                      addTask={addTask}
                      value={value}
                      setValue={setValue}
                      setKanbanMode={setKanbanMode}
                      kanbanMode={kanbanMode}
                      asanaLoading={asanaLoading}
                      csvLoading={csvLoading}
                      handleSyncAsana={handleSyncAsana}
                      handleSyncSlack={handleSyncSlack}
                      handleCsvUpload={handleCsvUpload}
                      options={options}
                      users={users}
                      curProjectId={curProjectId}
                      CurrentUserId={CurrentUserId}
                      handleSearch={handleSearch}
                      formatOptionLabel={formatOptionLabel}
                      customStyles={customStyles}
                      handleAddProject={handleAddProject}
                      handleAddEmployee={handleAddEmployee}
                      bottomfilterList={taskStatus}
                      selectedStatus={selectedStatus}
                      totalResults={tasks?.length || 0}
                    />

                    {kanbanMode ? (
                      <KanbanPage
                        tasks={tasks}
                        setTasks={setTasks}
                        projects={projects}
                        users={users}
                        userInfo={userInfo}
                        updateTaskFields={updateTaskFields}
                        onChildChange={handleChildChange}
                        setOpen={setOpen}
                        updateTaskCommentCount={updateTaskCommentCount}
                      />
                    ) : (
                      <div className="relative h-full">
                        <div className="">
                          {tabLoading ? (
                            <TaskTableSkeleton rows={10} />
                          ) : (
                            <table className="w-full table-fixed">
                              <thead className="bg-white dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                                <tr>
                                  <th className="w-[50px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 rounded-sm border-gray-300 dark:border-gray-700"
                                      onChange={handleSelectAll}
                                      checked={allSelected}
                                    />
                                  </th>
                                  <th className="w-[80px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
                                    ID
                                  </th>
                                  <th className="w-[300px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
                                    <div
                                      className="flex items-center cursor-pointer"
                                      onClick={sortTasks}
                                    >
                                      Task Name
                                      {sortDirection === "asc" && (
                                        <Icon
                                          icon="heroicons-outline:chevron-up"
                                          className="ml-1"
                                        />
                                      )}
                                      {sortDirection === "desc" && (
                                        <Icon
                                          icon="heroicons-outline:chevron-down"
                                          className="ml-1"
                                        />
                                      )}
                                    </div>
                                  </th>
                                  <th className="w-[200px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
                                    <div
                                      className="flex items-center cursor-pointer"
                                      onClick={sortProject}
                                    >
                                      Project
                                      {sortProjectDirection === "asc" && (
                                        <Icon
                                          icon="heroicons-outline:chevron-up"
                                          className="ml-1"
                                        />
                                      )}
                                      {sortProjectDirection === "desc" && (
                                        <Icon
                                          icon="heroicons-outline:chevron-down"
                                          className="ml-1"
                                        />
                                      )}
                                    </div>
                                  </th>
                                  <th className="w-[150px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
                                    <div
                                      className="flex items-center cursor-pointer"
                                      onClick={sortAssignTo}
                                    >
                                      Assign To
                                      {sortAssignToDirection === "asc" && (
                                        <Icon
                                          icon="heroicons-outline:chevron-up"
                                          className="ml-1"
                                        />
                                      )}
                                      {sortAssignToDirection === "desc" && (
                                        <Icon
                                          icon="heroicons-outline:chevron-down"
                                          className="ml-1"
                                        />
                                      )}
                                    </div>
                                  </th>
                                  <th className="w-[150px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
                                    <div
                                      className="flex items-center cursor-pointer"
                                      onClick={sortDueDate}
                                    >
                                      Due Date
                                      {sortDueDateDirection === "asc" && (
                                        <Icon
                                          icon="heroicons-outline:chevron-up"
                                          className="ml-1"
                                        />
                                      )}
                                      {sortDueDateDirection === "desc" && (
                                        <Icon
                                          icon="heroicons-outline:chevron-down"
                                          className="ml-1"
                                        />
                                      )}
                                    </div>
                                  </th>
                                  <th className="w-[148px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
                                    Status
                                  </th>
                                  {/* <th className="w-[100px] px-6 py-4 text-left font-medium text-sm text-slate-600 dark:text-slate-300">
                                    
                                     comment section
                                  </th> */}
                                </tr>
                              </thead>

                              <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                                {users.length > 0 && tasks && (
                                  <DynamicTaskRow
                                    taskData={tasks}
                                    toast={toastMsg}
                                    projects={projects}
                                    currentPage={currentPage}
                                    elementsPerPage={elementsPerPage}
                                    screenshotAllow={screenshotAllow}
                                    handleRowClick={handleRowClick}
                                    addTask={addTask}
                                    setTasks={setTasks}
                                    lastAddedTaskId={lastAddedTaskId}
                                    tasks={tasks}
                                    setLastAddedTaskId={setLastAddedTaskId}
                                    userInfo={userInfo}
                                    users={users}
                                    selectedTasks={selectedTasks}
                                    selectedrowTasks={selectedrowTasks}
                                    handleTaskSelect={handleTaskSelect}
                                    handleRowTaskSelect={handleRowTaskSelect}
                                    onEnterKeyPress={handleEnterKeyPress}
                                    handleCommentIconClick={handleCommentIconClick}
                                    handleTimeIconClick={handleTimeIconClick}
                                    handleAttachmentIconClick={handleAttachmentIconClick}
                                    taskAttachmentCounts={taskAttachmentCounts}
                                  />
                                )}
                              </tbody>


                            </table>
                          )}
                        </div>
                      </div>
                    )}
                  </SimpleBar>
                </Card>
              </div>
            </div>

            {/* Bottom Components */}
            <AddTodo />
            <EditTodoModal />

            {isPanelOpen && users?.length > 0 && selectedTask?.taskId && selectedTask?.taskId !== "-" && (
              <TaskPanel
                key={selectedTask?.taskId} // Add key prop to force re-render when task changes
                task={selectedTask}
                isOpen={isPanelOpen}
                onClose={closePanel}
                projects={projects}
                users={users}
                screenshotAllow={screenshotAllow}
                updateTaskFields={updateTaskFields}
                onChildChange={handleChildChange}
                setOpen={setOpen}
                updateTaskCommentCount={updateTaskCommentCount}
                setTaskIdForDelete={setTaskIdForDelete}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                openViaComment={openViaComment}
                resetOpenViaComment={() => setOpenViaComment(false)}
                openViaTimeIcon={openViaTimeIcon}
                resetOpenViaTimeIcon={() => setOpenViaTimeIcon(false)}
                openViaAttachmentIcon={openViaAttachmentIcon}
                resetOpenViaAttachmentIcon={() => setOpenViaAttachmentIcon(false)}
                isDeleting={isDeleting}
                setShowDeletePopup={setOpen}
                showDeletePopup={open}
                deleteTask={deleteTask}
                setAllAttachments={setAllAttachments}
                handleAttachmentOpen={handleAttachmentOpen}
                updateTaskAttachmentCount={updateTaskAttachmentCount}
                taskAttachmentCounts={taskAttachmentCounts}
              />
            )}

            <TaskOnMobile setisTaskOnMobile={setisTaskOnMobile} />

            {isBottomBarVisible && (
              <BottomBar
                selectedTasks={selectedTasks}
                selectedrowTasks={selectedrowTasks}
                deleteTasks={deleteTasks}
                exportTasks={exportTasks}
                copyTasks={copyTasks}
                closeBottomBar={closeBottomBar}
                bulkLoading={bulkLoading}
                modalIsOpen={modalIsOpen}
                setModalIsOpen={setModalIsOpen}
                getAllTasks={getAllTasks}
                users={users}
                projects={projects}
                handleBulkUpdate={handleBulkUpdate}
                taskStatuses={taskStatuses}
                isCopy={isCopy}
              />
            )}

            {
              isAttachmentViewerOpen &&
              <AttachmentViewer
                attachments={allAttachments && allAttachments}
                initialIndex={currentAttachment}
                open={isAttachmentViewerOpen}
                onClose={() => setIsAttachmentViewerOpen(false)}
              />
            }

            {/* {isDeleteModalOpen && (
              <DeletePopup
                id={taskIdForDelete}
                title="Delete Task"
                description="Are you sure you want to delete?"
                setOpen={setIsDeleteModalOpen}
                setLoading={setIsDeleting}
                loading={isDeleting}
                tasks={tasks}
                setTasks={setTasks}
              />
            )} */}
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {tasks.length > 0 ? (
                    <>Showing {((currentPageNumber - 1) * pageSize) + 1} to {((currentPageNumber - 1) * pageSize) + tasks.length} of {totalTasks} tasks</>
                  ) : (
                    <>No tasks found</>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Show</span>
                  <Select
                    instanceId="pageSize"
                    className="w-20 text-sm"
                    classNamePrefix="select"
                    options={pageSizeOptions.map(size => ({ value: size, label: size }))}
                    value={{ value: pageSize, label: pageSize }}
                    onChange={(option) => handlePageSizeChange({ target: { value: option.value } })}
                    menuPlacement="auto"
                    isSearchable={false}
                    styles={customStyles}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">entries</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPageNumber - 1)}
                  disabled={currentPageNumber === 1 || isPageLoading}
                  className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPageNumber - 1 && pageNumber <= currentPageNumber + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          disabled={isPageLoading}
                          className={`px-3 py-1 text-sm font-medium rounded-lg ${currentPageNumber === pageNumber
                            ? "bg-blue-600 text-white"
                            : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                            }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPageNumber - 2 ||
                      pageNumber === currentPageNumber + 2
                    ) {
                      return <span key={pageNumber} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPageNumber + 1)}
                  disabled={currentPageNumber === totalPages || isPageLoading}
                  className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Include the subscription limit modal */}
      <SubscriptionLimitModal />

      {/* Edit Project Modal */}
      <EditProject
        showEditProjectModal={showEditProjectModal}
        setShowEditProjectModal={setShowEditProjectModal}
        fetchProjects={() => dispatch(fetchProjects({
          companyId: userInfo?.companyId,
          _id: userInfo?._id,
          showAll: true,
          userInfo,
        }))}
        data={selectedProject}
        projectId={selectedProject?._id}
        setProjectId={setProjectId}
        setSelectedProject={setSelectedProject}
      />
    </>
  );
};

export default TodoPage;