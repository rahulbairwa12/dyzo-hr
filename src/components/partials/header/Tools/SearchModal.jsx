import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { debounce, throttle } from "lodash";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchAuthGET } from "@/store/api/apiSlice";
import Icon from "@/components/ui/Icon";
import { TaskPanel } from "@/features/tasks";
import { fetchProjects } from "@/store/projectsSlice";
import TaskPanelSkeleton from "@/features/tasks/components/TaskPanelSkeleton";
import {
  updateTaskCommentCount,
} from "@/features/tasks/store/tasksSlice";
import AttachmentViewer from "@/components/Task/AttachmentViewer";
import { getAuthToken } from "@/utils/authToken";


// Debug flag - set to false in production
const DEBUG = true;

const SearchModal = () => {
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const userInfo = useSelector((state) => state.auth.user);
  const { projects } = useSelector((state) => state.projects);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const abortControllerRef = useRef(null);
  const renderCount = useRef(0);
  const apiCallCount = useRef(0);

  // Task panel states
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});
  const [taskLoading, setTaskLoading] = useState(false);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(0);
  const [attachmentsForView, setAttachmentsForView] = useState([]);

  // States to track how many items to show per category
  const [tasksToShow, setTasksToShow] = useState(10);
  const [projectsToShow, setProjectsToShow] = useState(10);
  const [employeesToShow, setEmployeesToShow] = useState(10);
  const [clientsToShow, setClientsToShow] = useState(10);

  // Performance monitoring
  const perfRef = useRef({
    startTime: 0,
    apiCallTime: 0,
    renderTime: 0,
  });

  // Reset pagination when query or active tab changes
  useEffect(() => {
    setTasksToShow(10);
    setProjectsToShow(10);
    setEmployeesToShow(10);
    setClientsToShow(10);
  }, [query, activeTab]);

  // Handler functions to load more items
  const loadMoreTasks = () => {
    setTasksToShow(prev => prev + 10);
  };

  const loadMoreProjects = () => {
    setProjectsToShow(prev => prev + 10);
  };

  const loadMoreEmployees = () => {
    setEmployeesToShow(prev => prev + 10);
  };

  const loadMoreClients = () => {
    setClientsToShow(prev => prev + 10);
  };

  // Log function that only works when DEBUG is true


  // Create throttled search function
  const fetchResults = useCallback(async (searchQuery) => {
    // Start performance timing
    perfRef.current.startTime = performance.now();
    apiCallCount.current++;
    const currentCallId = apiCallCount.current;



    if (!searchQuery.trim()) {
      setSearchResults({});
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Cancel previous request if it exists
    if (abortControllerRef.current) {

      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      // Create URL
      const url = `${baseURL}/api/global-search/${userInfo?.companyId}/?query=${encodeURIComponent(searchQuery)}`;


      // Use fetchAuthGET from apiSlice
      const data = await fetchAuthGET(url, false);

      // Record API call time
      perfRef.current.apiCallTime = performance.now() - perfRef.current.startTime;


      // Process results
      if (signal.aborted) {

        return;
      }

      if (data.status === 1) {
        // Count total results to avoid unnecessary UI updates
        const totalResults = countTotalResults(data.data);


        if (totalResults > 100) {

        }

        setSearchResults(data.data || {});
      } else {

        setSearchResults({});
      }
    } catch (error) {
      if (error.name === 'AbortError') {

        return;
      }


      setError(error.message || "An error occurred while searching");
      setSearchResults({});
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [baseURL, userInfo?.companyId]);

  // Count total number of results across all categories
  const countTotalResults = (results) => {
    if (!results) return 0;
    return Object.values(results).reduce((total, arr) => {
      return total + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
  };

  // Create throttled/debounced search function - throttle for typing, debounce for API calls
  const throttledInputHandler = useMemo(
    () => throttle((value) => {
      setQuery(value);
    }, 100),
    []
  );

  const debouncedSearch = useMemo(
    () => debounce((searchQuery) => {
      fetchResults(searchQuery);
    }, 300),
    [fetchResults]
  );

  // Handle input change with throttling
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    throttledInputHandler(value);
  }, [throttledInputHandler]);

  // Trigger search when query changes
  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setSearchResults({});
    }

    return () => {
      debouncedSearch.cancel();
      throttledInputHandler.cancel();
    };
  }, [query, debouncedSearch, throttledInputHandler]);

  // Focus input and set up click outside listener when modal opens
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    }

    if (isOpen) {

      document.addEventListener("mousedown", handleClickOutside);
      // Small delay to trigger animation
      setTimeout(() => setVisible(true), 10);
      // Focus input when modal opens
      if (inputRef.current) inputRef.current.focus();

      // Add overflow hidden to body to prevent scrolling behind modal
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) closeModal();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      debouncedSearch.cancel();
      throttledInputHandler.cancel();
    };
  }, [debouncedSearch, throttledInputHandler]);

  function closeModal() {

    setVisible(false);
    // Delay actual closing to allow animation
    setTimeout(() => {
      setIsOpen(false);
      setQuery("");
      setSearchResults({});
      setError(null);
    }, 200);
  }

  function openModal() {

    setIsOpen(true);
    setQuery("");
    setSearchResults({});
    setError(null);
  }

  // Fetch task details API function
  const fetchTaskDetails = async (taskId) => {
    setTaskLoading(true);
    try {
      const apiUrl = `${baseURL}/api/tasks/${taskId}/`;
      const data = await fetchAuthGET(apiUrl, false);
      if (data?.status === 1) {
        setSelectedTask(data?.data);
        setIsTaskPanelOpen(true);
        // Fetch projects if not already loaded
        dispatch(fetchProjects());
      } else {
        setSelectedTask({});
        console.error("Error fetching task details:");
      }
    } catch (error) {
      setSelectedTask({});
      console.error("Error fetching task details:", error);
    }
    setTaskLoading(false);
  };

  // Function to update task fields from child components
  const handleTaskUpdate = (taskId, field, value) => {
    setSelectedTask(prevTask => ({
      ...prevTask,
      [field]: value
    }));
  };

  const handleCommentCountUpdate = (taskId, newCount) => {
    dispatch(updateTaskCommentCount({ taskId, newCount }));
  };

  const handleAttachmentOpen = (index) => {
    setCurrentAttachment(index);
    setIsAttachmentViewerOpen(true);
  };

  const closeTaskPanel = () => {
    setIsTaskPanelOpen(false);
    setSelectedTask({});
    setTaskLoading(false);
  };

  const handleItemClick = useCallback((type, id) => {
    switch (type) {
      case "task":
        // Close search modal first
        closeModal();
        // Fetch and open task panel
        fetchTaskDetails(id);
        break;
      case "project":
        navigate(`/project/${id}?tab=tasks`);
        setQuery("");
        closeModal();
        break;
      case "employee":
        navigate(`/profile/${id}`);
        setQuery("");
        closeModal();
        break;
      case "client":
        navigate(`/client-profile/${id}`);
        setQuery("");
        closeModal();
        break;
      default:
        break;
    }
  }, [navigate, baseURL, dispatch]);

  // Filter results based on active tab - memoized
  const filteredResults = useMemo(() => {
    if (!searchResults || Object.keys(searchResults).length === 0) {
      return {};
    }

    if (activeTab === "all") {
      return searchResults;
    }

    // Remove the 's' from the end to match the property name in searchResults
    const key = activeTab.endsWith("s") ? activeTab : activeTab + "s";
    return { [key]: searchResults[key] || [] };
  }, [searchResults, activeTab]);

  // Count results for memoization
  const resultCounts = useMemo(() => {
    return {
      total: countTotalResults(searchResults),
      filtered: countTotalResults(filteredResults)
    };
  }, [searchResults, filteredResults]);

  const renderResults = useCallback(() => {
    // Increment render count for debugging
    renderCount.current++;
    const currentRender = renderCount.current;

    // Start render timing
    const renderStartTime = performance.now();



    if (!query) return null;

    const hasResults = resultCounts.filtered > 0;

    let content;

    if (error) {
      content = (
        <div className="p-4 text-center text-red-500 dark:text-red-400">
          {error}
        </div>
      );
    } else if (isLoading) {
      content = (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin">
            <Icon icon="heroicons-outline:refresh" className="text-primary-500 h-8 w-8" />
          </div>
        </div>
      );
    } else if (!hasResults && query.trim()) {
      content = (
        <div className="p-4 text-center text-gray-500 dark:text-slate-400">
          No results found
        </div>
      );
    } else {
      content = (
        <div>
          {filteredResults.tasks && filteredResults.tasks.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 font-medium text-xs uppercase text-slate-500 dark:text-slate-300">
                Tasks ({filteredResults.tasks.length})
              </div>
              {filteredResults.tasks.slice(0, tasksToShow).map((task, index) => (
                <div
                  key={`task-${task.taskId || index}`}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center"
                  onClick={() => handleItemClick("task", task.taskId)}
                >
                  <Icon icon="heroicons-outline:clipboard-check" className="text-primary-500 h-5 w-5 mr-2 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">{task.taskName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Project: {task.projectId__name}
                    </div>
                  </div>
                </div>
              ))}
              {filteredResults.tasks.length > tasksToShow && (
                <div
                  className="px-4 py-1.5 text-xs text-center text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadMoreTasks();
                  }}
                >
                  + {filteredResults.tasks.length - tasksToShow} more tasks
                </div>
              )}
            </div>
          )}

          {filteredResults.projects && filteredResults.projects.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 font-medium text-xs uppercase text-slate-500 dark:text-slate-300">
                Projects ({filteredResults.projects.length})
              </div>
              {filteredResults.projects.slice(0, projectsToShow).map((project, index) => (
                <div
                  key={`project-${project._id || index}`}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center"
                  onClick={() => handleItemClick("project", project._id)}
                >
                  <Icon icon="heroicons-outline:briefcase" className="text-primary-500 h-5 w-5 mr-2 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {project.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredResults.projects.length > projectsToShow && (
                <div
                  className="px-4 py-1.5 text-xs text-center text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadMoreProjects();
                  }}
                >
                  + {filteredResults.projects.length - projectsToShow} more projects
                </div>
              )}
            </div>
          )}

          {filteredResults.employees && filteredResults.employees.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 font-medium text-xs uppercase text-slate-500 dark:text-slate-300">
                Employees ({filteredResults.employees.length})
              </div>
              {filteredResults.employees.slice(0, employeesToShow).map((employee, index) => (
                <div
                  key={`employee-${employee._id || index}`}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center"
                  onClick={() => handleItemClick("employee", employee._id)}
                >
                  <Icon icon="heroicons-outline:user" className="text-primary-500 h-5 w-5 mr-2 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">
                      {employee.first_name} {employee.last_name}
                    </div>
                    {employee.designation && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {employee.designation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredResults.employees.length > employeesToShow && (
                <div
                  className="px-4 py-1.5 text-xs text-center text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadMoreEmployees();
                  }}
                >
                  + {filteredResults.employees.length - employeesToShow} more employees
                </div>
              )}
            </div>
          )}

          {filteredResults.clients && filteredResults.clients.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 font-medium text-xs uppercase text-slate-500 dark:text-slate-300">
                Clients ({filteredResults.clients.length})
              </div>
              {filteredResults.clients.slice(0, clientsToShow).map((client, index) => (
                <div
                  key={`client-${client._id || index}`}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors flex items-center"
                  onClick={() => handleItemClick("client", client._id)}
                >
                  <Icon icon="heroicons-outline:user-group" className="text-primary-500 h-5 w-5 mr-2 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">{client.clientName}</div>
                    {client.contact_person && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Contact: {client.contact_person}
                      </div>
                    )}
                  </div>
                </div>
              ))},
              {filteredResults.clients.length > clientsToShow && (
                <div
                  className="px-4 py-1.5 text-xs text-center text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadMoreClients();
                  }}
                >
                  + {filteredResults.clients.length - clientsToShow} more clients
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // End render timing
    perfRef.current.renderTime = performance.now() - renderStartTime;


    return (
      <div className="max-h-60 overflow-auto overscroll-contain">
        {content}

      </div>
    );
  }, [
    query,
    error,
    isLoading,
    filteredResults,
    resultCounts,
    handleItemClick,
    tasksToShow,
    projectsToShow,
    employeesToShow,
    clientsToShow
  ]);

  // Tabs configuration
  const tabs = [
    { name: "All", icon: "heroicons-outline:search", key: "all" },
    { name: "Tasks", icon: "heroicons-outline:clipboard-list", key: "tasks", data: filteredResults?.tasks?.length },
    { name: "Projects", icon: "heroicons-outline:briefcase", key: "projects", data: filteredResults?.projects?.length },
    { name: "Employees", icon: "heroicons-outline:user-group", key: "employees", data: filteredResults?.employees?.length },
    // { name: "Clients", icon: "heroicons-outline:user", key: "clients" ,data:filteredResults?.clients?.length},
  ];

  // Only show results section when we actually have data
  const hasAnyResults = useMemo(() => countTotalResults(filteredResults) > 0, [filteredResults]);

  return (
    <>
      <div className="w-full">
        <button
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-neutral-50 dark:border-slate-700 hover:shadow-md transition-all duration-200 ease-in-out group w-full"
          onClick={openModal}
        >
          <Icon
            icon="heroicons-outline:search"
            className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-electricBlue-100 "
          />
          <span className=" text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-electricBlue-100 ">
            Search
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto p-4 md:pt-[25vh] pt-20">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-slate-900/60 backdrop-filter backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={closeModal}
          ></div>

          {/* Modal */}
          <div
            ref={modalRef}
            className={`relative mx-auto max-w-2xl transform transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
          >
            <div className="relative mx-auto max-w-2xl rounded-md bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-gray-200 dark:ring-slate-600">
              {/* Search input */}
              <div className="flex px-3 py-3 items-center rounded-t-md">
                <div className="flex-0 text-slate-700 dark:text-slate-300 ltr:pr-2 rtl:pl-2 text-lg">
                  {isLoading ? (
                    <Icon icon="eos-icons:loading" />
                  ) : (
                    <Icon icon="heroicons-outline:search" />
                  )}
                </div>
                <input
                  ref={inputRef}
                  className="bg-transparent outline-none focus:outline-none border-none w-full flex-1 dark:placeholder:text-slate-300 dark:text-slate-200"
                  placeholder="Search tasks, projects, or employees..."
                  onChange={handleInputChange}
                  autoComplete="off"
                />
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <Icon icon="heroicons-outline:x" className="h-5 w-5" />
                </button>
              </div>

              {/* Tab navigation - show only when results are available */}
              {hasAnyResults && (
                <div className="flex justify-between items-center p-2 border-t border-b border-gray-200 dark:border-slate-600 sticky top-0 bg-white dark:bg-slate-800 z-10">
                  <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        className={`px-2 py-1.5 rounded-md text-xs flex items-center gap-1 whitespace-nowrap ${activeTab === tab.key
                          ? "bg-primary-500/10 text-primary-500"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                          }`}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        <Icon icon={tab.icon} className="w-3.5 h-3.5" />
                        {tab.name} {tab?.data && tab?.data > 0 ? <span className="text-xs text-blue-500">{`(${tab?.data})`}</span> : ""}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 hidden md:block">
                    Press ESC to close
                  </div>
                </div>
              )}

              {/* Results area - render only when results have arrived */}
              {hasAnyResults && (
                <div className="max-h-60 overflow-auto overscroll-contain">
                  {renderResults()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Panel Modal */}
      {isTaskPanelOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black-500/70 backdrop-blur-sm w-full h-screen">
          <div
            className="w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {taskLoading ? (
              <TaskPanelSkeleton from="dashboard" />
            ) : Object.keys(selectedTask).length > 0 ? (
              <TaskPanel
                task={selectedTask}
                isOpen={true}
                projects={projects}
                onClose={closeTaskPanel}
                onUpdateCommentCount={handleCommentCountUpdate}
                handleAttachmentOpen={handleAttachmentOpen}
                setAttachmentsForView={setAttachmentsForView}
                isAttachmentViewerOpen={isAttachmentViewerOpen}
                from="dashboard"
                setTask={setSelectedTask}
                updateTaskFields={handleTaskUpdate}
              />
            ) : (
              <div className="p-8 text-center">
                <div className="text-red-500 mb-2">
                  <Icon icon="heroicons-outline:exclamation-triangle" className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Task Not Found</h3>
                <p className="text-gray-500 dark:text-slate-400 mb-4">We couldn't find the details for this task.</p>
                <button
                  onClick={closeTaskPanel}
                  className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
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
    </>
  );
};

export default SearchModal;
