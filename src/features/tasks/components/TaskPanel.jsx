import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import moment from "moment";
import confetti from "canvas-confetti";
import {
  updateTaskProperty,
  removeTaskFromState,
  togglePanelVisibility,
  fetchTaskAttachments,
  updateTaskAttachmentCount,
  deleteTaskAttachment,
  updateTask,
  updateTaskCommentCount,
  fetchTasks,
  setSelectedTask,
  fetchTaskBySearch,
  updateTaskSubtaskCount
} from "../store/tasksSlice";
import { fetchTaskStatuses } from "../store/taskStatusSlice";
import { fetchUsers } from "@/store/usersSlice";
import Button from "@/components/ui/Button";
import AssignToSelect from "@/components/dropdowns/AssignToSelect";
import UserAssignSelect from "@/components/dropdowns/UserAssignSelect";
import ProjectSelect from "@/components/dropdowns/ProjectSelect";
import TaskDescriptionComments from "./TaskDescriptionComments";
import Collaborators from "@/components/Task/Collaborators";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import ShareModal from "@/components/Task/ShareModal";
import "@/assets/css/shareModal.css";
import FileUpload from "@/components/Task/FileUpload";
import documentIcon from "@/assets/images/all-img/document.png";
import pdfIcon from "@/assets/images/all-img/pdf.png";
import imageIcon from "@/assets/images/all-img/image.png";
import videoIcon from "@/assets/images/all-img/video.png";
import Tooltip from "@/components/ui/Tooltip";
import TaskTracking from "@/components/Task/TaskTracking";
import { debounce } from "lodash";
import {
  fetchAuthPut,
  fetchAuthFilePut,
  fetchAuthPost,
  fetchAuthGET,
  fetchAuthDelete,
} from "@/store/api/apiSlice";
import { intialLetterName } from "@/helper/helper";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import UserMultiSelect from "@/components/dropdowns/UserMultiSelect"; // Add import for UserMultiSelect
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { ProfilePicture } from "@/components/ui/profilePicture";
import ModernTooltip from "@/components/ui/ModernTooltip";
import AllocatedHours from "@/components/Task/AllocatedHours";

const TaskPanel = ({
  task,
  isOpen,
  onClose,
  projects,
  handleAttachmentOpen,
  setAttachmentsForView,
  isAttachmentViewerOpen,
  from = "task",
  setTask = null,
  updateTaskFields = null // Add this prop to receive the update function from parent
}) => {

  const dispatch = useDispatch();
  const { users, loading: loadingUsers } = useSelector((state) => state.users);
  const { user: userInfo } = useSelector((state) => state.auth);
  const [taskStatuses, setTaskStatuses] = useState(task?.project_status);
  const [selectedProjectId, setSelectedProjectId] = useState(task?.projectId);
  const { tasks } = useSelector((state) => state.tasks);
  // Get filters from Redux state to check if task still matches after updates
  const currentFilters = useSelector((state) => state.tasks.filters);

  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const { activeTaskTab } = useSelector((state) => state.tasks);
  const [activeTab, setActiveTab] = useState(""); // comments, all-activities, all-attachments
  const [taskName, setTaskName] = useState(task?.taskName || "");
  const [selectedRepetition, setSelectedRepetition] = useState("Weekly");
  const [allocatedHours, setAllocatedHours] = useState("1.5 hrs");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? format(parseISO(task?.dueDate), "yyyy-MM-dd") : ""
  );
  const [taskPosition, setTaskPosition] = useState(
    task?.taskPosition || "Pending"
  );

  // textarea Ref for taskname
  const textareaRef = useRef(null);
  const addSubtaskTextareaRef = useRef(null)
  const editSubtaskTextareaRef = useRef(null)

  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [startDate, setStartDate] = useState("Today");
  const [repeatUntil, setRepeatUntil] = useState("Never");
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [highlightedStatusIndex, setHighlightedStatusIndex] = useState(-1);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const statusDropdownRef = useRef(null);
  const statusSearchInputRef = useRef(null);

  // Section select state
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const sectionDropdownRef = useRef(null);
  const [currentSectionId, setCurrentSectionId] = useState(task?.section || task?.section_id || task?.section);
  const [availableSections, setAvailableSections] = useState([]);
  const [sectionSearchTerm, setSectionSearchTerm] = useState("");
  const [highlightedSectionIndex, setHighlightedSectionIndex] = useState(-1);
  const sectionSearchInputRef = useRef(null);
  const sectionDropdownItemsRef = useRef([]);
  const statusDropdownItemsRef = useRef([]);
  const panelRef = useRef(null);
  const [commentCount, setCommentCount] = useState(0);
  const [collaboratorLoading, setCollaboratorLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopy, setIsCopy] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef(null);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const [description, setDescription] = useState(task?.description || "");
  const [commentChat, setCommentChat] = useState([]);
  const [comments, setComments] = useState("");
  const [imgLoading, setImgLoading] = useState(false);
  const [isShowedImage, setIsShowedImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const commentInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [taskId, setTaskId] = useState(task?._id || task?.taskId);
  const [taskLogs, setTaskLogs] = useState([]);
  const [isDescriptionFullScreen, setIsDescriptionFullScreen] = useState(false);
  const [activeJourneyTab, setActiveJourneyTab] = useState("all");
  const [taskJourney, setTaskJourney] = useState([]);
  const [isAttachmentDeleting, setIsAttachmentDeleting] = useState(false);
  const [showAttachmentDeleteModal, setShowAttachmentDeleteModal] =
    useState(false);
  const [attachmentForDelete, setAttachmentForDelete] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [isAddProject, setIsAddProject] = useState(false);
  // Expand Task Panel
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const isFocusedParam = params.get("isFocused") === "true";
  const [isExpand, setIsExpand] = useState(isFocusedParam);
  // Tabs
  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    // Map activeTab string to the correct tab index
    switch (activeTab) {
      case "comments":
        return 0;
      case "all-activities":
        return 1;
      case "all-attachments":
        return 2;
      case "time-logs":
        return 3;
      default:
        return -1;
    }
  });
  const taskAttachments = useSelector((state) => state.tasks.taskAttachments);
  const filteredAttachments = taskAttachments?.filter(
    (att) => att.folder === "attachments"
  );
  const [seenBy, setSeenBy] = useState([]);

  // Create a ref to store the debounced function instance
  const debouncedFnRef = useRef(null);

  const [likedBy, setLikedBy] = useState(task?.liked_by || []);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeAnimate, setLikeAnimate] = useState(false);

  // Subtasks
  const [subtasks, setSubtasks] = useState([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false); // loading state for subtasks
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskName, setEditingSubtaskName] = useState("");

  // Add this ref near the top of the component
  const scrollableContentRef = useRef(null);

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const [showConvertSubtaskInput, setShowConvertSubtaskInput] = useState(false)

  const [socket, setSocket] = useState(null);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Establish WebSocket connection
  useEffect(() => {
    if (!showConvertSubtaskInput) return;
    if (!userInfo?._id) return;
    const ws = new WebSocket(
      `${import.meta.env.VITE_WEBSOCKET_URL}task-search/${userInfo?.companyId}/${userInfo?._id}/`
    );
    setSocket(ws);

    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data?.results) {
          setOptions(data.results); // server should return { results: [...] }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
      setLoading(false);
    };
    ws.onclose = () => console.log("WebSocket disconnected");

    return () => ws.close();
  }, [userInfo?._id, showConvertSubtaskInput]);

  // Send search request when query changes
  useEffect(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !query) return;
    setLoading(true);

    socket.send(
      JSON.stringify({
        type: "task_search",
        search_term: query,
      })
    );
  }, [query, socket]);

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.title = `${task?.taskName} - Task`;

    // optional cleanup
    return () => {
      document.title = "Dyzo"; // default title when component unmounts
    };
  }, []); // run only once when component mounts

  const startConfetti = () => {
    // create a canvas manually
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    // force it on top of everything
    canvas.style.zIndex = "9999999";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none"; // don’t block clicks

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    // 🎉 fire once
    myConfetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.3 },
      colors: ["#0F6FFF", "#A026FF", "#6d42f8", "#9333ea", "#2DE072"],
      disableForReducedMotion: true,
    });

    // remove the canvas after particles are gone
    setTimeout(() => {
      document.body.removeChild(canvas);
    }, 3000);
  };


  //Expand Task Panel
  useEffect(() => {
    setIsExpand(isFocusedParam);
  }, [isFocusedParam]);

  // Add cleanup for debounced function on unmount or when dependencies change
  useEffect(() => {
    // Create a new debounced function
    debouncedFnRef.current = debounce(async (newName) => {
      try {
        // Call API to update task
        const BaseUrl = import.meta.env.VITE_APP_DJANGO;
        const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

        const formData = new FormData();
        formData.append("taskName", newName);

        const data = await fetchAuthFilePut(apiUrl, {
          body: formData,
        });

        if (!data.status) {
          throw new Error(data.message || "Failed to update task name");
        }
      } catch (error) {
        console.error("Error updating task name:", error);
        toast.error("Failed to update task name", {
          position: "bottom-right",
          autoClose: 2000,
        });
      }
    }, 1000);

    // Cleanup function to cancel any pending debounced calls
    return () => {
      if (debouncedFnRef.current?.cancel) {
        debouncedFnRef.current.cancel();
      }
    };
  }, [task?._id, userInfo?._id]);

  // Add window resize event listener to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Fetch users if not already loaded
  useEffect(() => {
    if (!users.length && userInfo?._id) {
      dispatch(fetchUsers());
    }
  }, [dispatch, users.length, userInfo?._id]);

  // Fetch task statuses if not already loaded

  // Update local state when task changes
  useEffect(() => {
    if (task) {
      // Update task name
      setTaskName(task?.taskName || "");

      // Seen By
      setSeenBy(task?.seen_by || []);

      // Format the date properly with error handling
      try {
        if (task.dueDate) {
          // Convert from ISO to YYYY-MM-DD for the date input
          const date = parseISO(task.dueDate);
          setDueDate(format(date, "yyyy-MM-dd"));
        } else {
          setDueDate("");
        }
      } catch (error) {
        console.error("Error parsing date:", error);
        setDueDate("");
      }

      // Ensure taskPosition is immediately updated
      setTaskPosition(task.taskPosition || "Pending");

      // Update priority
      setPriority(task.priority || "Medium");

      // Update section
      setCurrentSectionId(task?.section || task?.section_id || task?.section);

      // Update project statuses if available
      if (task.project_status && Array.isArray(task.project_status)) {
        setTaskStatuses(task.project_status);
      }

      // Reset description and comment data when task changes
      setDescription(task?.description || "");
      setCommentChat([]);
      setComments("");
    }
  }, [task?._id]); // Use task._id to ensure it triggers when task actually changes

  // Update available sections when selected project changes
  useEffect(() => {
    if (selectedProjectId && projects?.length > 0) {
      const currentProject = projects.find(p => p._id === selectedProjectId);
      if (currentProject?.sections) {
        setAvailableSections(currentProject.sections);
      } else {
        setAvailableSections([]);
      }
    } else {
      setAvailableSections([]);
    }
  }, [selectedProjectId, projects]);

  useEffect(() => {
    setSelectedProjectId(task?.projectId);
  }, [task?.projectId]);

  // get sub tasks
  useEffect(() => {
    // Use taskId instead of _id to avoid temp IDs
    const taskIdToUse = task?.taskId || task?._id;
    if (taskIdToUse && taskIdToUse !== "-") {
      getSubtasks(taskIdToUse);
    }
  }, [task?.taskId, task?._id]);

  useEffect(() => {
    if (task?.taskId && task.taskId !== "-") {
      dispatch(fetchTaskAttachments(task.taskId));
    }
  }, [dispatch, task?.taskId]);

  // Effect to sync activeTab with Redux state when panel opens
  useEffect(() => {
    if (isOpen) {
      // Set activeTab from activeTaskTab if it exists, otherwise leave it as null

      setActiveTab(activeTaskTab || null);
    }
  }, [activeTaskTab, isOpen]);

  // Effect to scroll to subtasks section when activeTab is "subtasks"
  useEffect(() => {
    if (activeTab === "subtasks" && isOpen) {
      // Add a small delay to ensure the panel is fully rendered
      setTimeout(() => {
        const subtasksSection = document.getElementById("subtasks-section");
        if (subtasksSection) {
          // Scroll to the subtasks section
          subtasksSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

          // Add highlight effect
          subtasksSection.style.backgroundColor = "#E8E5F9"; // Light yellow background
          subtasksSection.style.transition = "background-color 0.3s ease";

          // Remove highlight after 2 seconds
          setTimeout(() => {
            subtasksSection.style.backgroundColor = "";
          }, 2000);
        }
      }, 300);
    }
  }, [activeTab, isOpen]);



  // Handle keyboard navigation for status dropdown
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!statusDropdownOpen) return;

      const filteredStatuses = getFilteredStatuses();

      // Handle navigation keys even when search input is focused
      if (document.activeElement === statusSearchInputRef.current) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setHighlightedStatusIndex(prev =>
              prev < filteredStatuses.length - 1 ? prev + 1 : 0
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            setHighlightedStatusIndex(prev =>
              prev > 0 ? prev - 1 : filteredStatuses.length - 1
            );
            break;
          case 'Enter':
            event.preventDefault();
            if (highlightedStatusIndex >= 0 && highlightedStatusIndex < filteredStatuses.length) {
              handleStatusChange(filteredStatuses[highlightedStatusIndex].name);
            }
            break;
          case 'Escape':
            event.preventDefault();
            setStatusDropdownOpen(false);
            setHighlightedStatusIndex(-1);
            setStatusSearchTerm("");
            break;
        }
        return;
      }

      // Handle keys when search input is not focused
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedStatusIndex(prev =>
            prev < filteredStatuses.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedStatusIndex(prev =>
            prev > 0 ? prev - 1 : filteredStatuses.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedStatusIndex >= 0 && highlightedStatusIndex < filteredStatuses.length) {
            handleStatusChange(filteredStatuses[highlightedStatusIndex].name);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setStatusDropdownOpen(false);
          setHighlightedStatusIndex(-1);
          setStatusSearchTerm("");
          break;
        default:
          // Focus search input for typing
          if (event.key.length === 1 && statusSearchInputRef.current) {
            statusSearchInputRef.current.focus();
          }
          break;
      }
    };

    if (statusDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [statusDropdownOpen, highlightedStatusIndex, taskStatuses, statusSearchTerm]);

  // Focus search input when dropdown opens and auto-highlight first option
  useEffect(() => {
    if (statusDropdownOpen && statusSearchInputRef.current) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => {
        statusSearchInputRef.current?.focus();
      }, 100);
      // Auto-highlight first option when dropdown opens
      setHighlightedStatusIndex(0);
    }
  }, [statusDropdownOpen]);

  // Auto-highlight first option when search results change
  useEffect(() => {
    if (statusDropdownOpen) {
      const filteredStatuses = getFilteredStatuses();
      if (filteredStatuses.length > 0) {
        setHighlightedStatusIndex(0);
      } else {
        setHighlightedStatusIndex(-1);
      }
    }
  }, [statusSearchTerm, taskStatuses, statusDropdownOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (statusDropdownOpen && highlightedStatusIndex >= 0) {
      const highlightedElement = statusDropdownItemsRef.current[highlightedStatusIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [highlightedStatusIndex, statusDropdownOpen]);

  // Handle keyboard navigation for section dropdown
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!sectionDropdownOpen) return;

      const filteredSections = getFilteredSections();

      // Handle navigation keys even when search input is focused
      if (document.activeElement === sectionSearchInputRef.current) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setHighlightedSectionIndex(prev =>
              prev < filteredSections.length - 1 ? prev + 1 : 0
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            setHighlightedSectionIndex(prev =>
              prev > 0 ? prev - 1 : filteredSections.length - 1
            );
            break;
          case 'Enter':
            event.preventDefault();
            if (highlightedSectionIndex >= 0 && highlightedSectionIndex < filteredSections.length) {
              handleSectionChange(filteredSections[highlightedSectionIndex].id);
            }
            break;
          case 'Escape':
            event.preventDefault();
            setSectionDropdownOpen(false);
            setHighlightedSectionIndex(-1);
            setSectionSearchTerm("");
            break;
        }
        return;
      }

      // Handle keys when search input is not focused
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedSectionIndex(prev =>
            prev < filteredSections.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedSectionIndex(prev =>
            prev > 0 ? prev - 1 : filteredSections.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedSectionIndex >= 0 && highlightedSectionIndex < filteredSections.length) {
            handleSectionChange(filteredSections[highlightedSectionIndex].id);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setSectionDropdownOpen(false);
          setHighlightedSectionIndex(-1);
          setSectionSearchTerm("");
          break;
        default:
          // Focus search input for typing
          if (event.key.length === 1 && sectionSearchInputRef.current) {
            sectionSearchInputRef.current.focus();
          }
          break;
      }
    };

    if (sectionDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sectionDropdownOpen, highlightedSectionIndex, availableSections, sectionSearchTerm]);

  // Focus section search input when dropdown opens and auto-highlight first option
  useEffect(() => {
    if (sectionDropdownOpen && sectionSearchInputRef.current) {
      setTimeout(() => {
        sectionSearchInputRef.current?.focus();
      }, 100);
      setHighlightedSectionIndex(0);
    }
  }, [sectionDropdownOpen]);

  // Auto-highlight first section when search results change
  useEffect(() => {
    if (sectionDropdownOpen) {
      const filteredSections = getFilteredSections();
      if (filteredSections.length > 0) {
        setHighlightedSectionIndex(0);
      } else {
        setHighlightedSectionIndex(-1);
      }
    }
  }, [sectionSearchTerm, availableSections, sectionDropdownOpen]);

  // Scroll highlighted section into view
  useEffect(() => {
    if (sectionDropdownOpen && highlightedSectionIndex >= 0) {
      const highlightedElement = sectionDropdownItemsRef.current[highlightedSectionIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [highlightedSectionIndex, sectionDropdownOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {

      if (isAttachmentViewerOpen) {
        return;
      }
      if (isAddProject) {
        return;
      }
      if (event.target.closest(".flatpickr-calendar")) {
        return;
      }
      if (event.target.closest(".Toastify__toast")) {
        return;
      }
      if (event.target.closest(".ql-editor")) {
        return;
      }
      if (event.target.closest(".comment-editor-area")) {
        return;
      }
      if (event.target.closest(".tf-mention-list")) {
        return;
      }
      if (event.target.closest(".tf-mention-item") ||
        event.target.closest(".multiuser-select-dropdown")) {
        return;
      }

      // Ignore clicks inside emoji toolbar or picker
      if (
        event.target.closest(".ql-emoji") ||
        event.target.closest(".tf-tooltip-wrapper") ||
        event.target.closest(".tf-emoji-picker ") ||
        event.target.closest(".tf-media-fullscreen-overlay") ||
        event.target.closest(".unmatched")
      ) {
        return;
      }
      // Ignore clicks inside any high z-index popover/dropdown container
      if (event.target.closest(".z-\\[9999\\]")) {
        return;
      }
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        if (from === "inbox") return;
        dispatch(togglePanelVisibility(false));
        onClose();
      }

      // Close status dropdown when clicking outside
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
        setHighlightedStatusIndex(-1);
        setStatusSearchTerm("");
      }

      // Close priority dropdown when clicking outside
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target)
      ) {
        setPriorityDropdownOpen(false);
      }

      // Close section dropdown when clicking outside
      if (
        sectionDropdownRef.current &&
        !sectionDropdownRef.current.contains(event.target)
      ) {
        setSectionDropdownOpen(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, isAddProject, isAttachmentViewerOpen]);

  // Update Seen By
  useEffect(() => {
    if (isOpen && task?.taskId && userInfo?._id) {
      const userId = userInfo._id;
      const alreadySeen = task?.seen_by?.includes(userId);

      if (!alreadySeen) {
        const markTaskAsSeen = async () => {
          try {
            const url = `${import.meta.env.VITE_APP_DJANGO}/task/${task.taskId
              }/${userId}/`;

            // Ensure no duplicates
            const currentSeenBy = Array.from(
              new Set([...(task.seen_by || []), userId])
            );

            const payload = {
              seen_by: currentSeenBy,
            };

            await fetchAuthPut(url, { body: payload });

            setSeenBy(currentSeenBy); // local state
            dispatch(
              updateTaskProperty({
                taskId: task._id,
                property: "seen_by",
                value: currentSeenBy,
              })
            );
          } catch (error) {
            console.error("Error marking task as seen:", error);
          }
        };

        markTaskAsSeen();
      }
    }
  }, [isOpen, task?.taskId, userInfo?._id]);

  // Auto height edit subtask textarea
  // Focus only when entering edit mode to avoid moving caret while typing
  useEffect(() => {
    if (editingSubtaskId && editSubtaskTextareaRef.current) {
      const textarea = editSubtaskTextareaRef.current;
      textarea.focus();
      // Place caret at the end on entering edit mode
      const end = textarea.value.length;
      textarea.setSelectionRange(end, end);
      // Auto-resize on open
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editingSubtaskId]);

  // Auto-resize height as the user types without changing focus or caret position
  useEffect(() => {
    if (editingSubtaskId && editSubtaskTextareaRef.current) {
      const textarea = editSubtaskTextareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editingSubtaskName]);

  // Get project members for the task's project
  const projectMembers = React.useMemo(() => {
    if (!selectedProjectId || !projects || projects.length === 0) {
      return users; // Return all users if no project selected
    }

    const taskProject = projects.find((p) => p._id === selectedProjectId);

    if (!taskProject) {
      return users; // Return all users if project not found
    }

    // If project has assignee_details, use it
    if (taskProject.assignee_details && Array.isArray(taskProject.assignee_details)) {
      return taskProject.assignee_details;
    }

    // If project has assignee (array of user IDs), filter users
    if (taskProject.assignee && Array.isArray(taskProject.assignee) && taskProject.assignee.length > 0) {
      return users.filter(user => taskProject.assignee.includes(user._id));
    }

    // Fallback to all users if project has no members defined
    return users;
  }, [selectedProjectId, projects, users]);

  // Filter projects to show only those where current user is a member
  const userProjects = React.useMemo(() => {
    if (!projects || projects.length === 0 || !userInfo?._id) {
      return projects; // Return all projects if no filtering needed
    }

    return projects.filter((project) => {
      // Check if user is in assignee array (user IDs)
      if (project.assignee && Array.isArray(project.assignee)) {
        if (project.assignee.includes(userInfo._id)) {
          return true;
        }
      }

      // Check if user is in assignee_details array (user objects)
      if (project.assignee_details && Array.isArray(project.assignee_details)) {
        if (project.assignee_details.some(user => user._id === userInfo._id)) {
          return true;
        }
      }

      return false;
    });
  }, [projects, userInfo?._id]);

  const seenUsers = users && users.filter((user) => seenBy.includes(user._id));

  // Helper function to get filtered statuses based on search term
  const getFilteredStatuses = () => {
    const availableStatuses = taskStatuses?.length > 0
      ? taskStatuses
      : [
        {
          id: "2f6844d9-fe9d-4bd4-a1cb-be99f2896dc2",
          name: "Not Started Yet",
          color: "#DC3464",
          value: "not_started_yet",
        },
        {
          id: "0f79ea13-f40a-4e8b-a8b5-5e8f13167a1a",
          name: "In progress",
          color: "#3092F5",
          value: "in_progress",
        },
        {
          id: "df9cb378-a31d-42b6-8115-46a2e04bf69d",
          name: "Completed",
          color: "#30F558",
          value: "completed",
        },
        {
          id: "ae7cd059-26d8-49aa-b0d1-5697c1ce2fa7",
          name: "Pending",
          color: "#BCBCBC",
          value: "pending",
        },
        {
          id: "2b73d3de-7f29-4c56-9bae-4d4f08726de2",
          name: "Archived",
          color: "#6C757D",
          value: "archived",
        },
      ];

    if (!statusSearchTerm.trim()) return availableStatuses;
    return availableStatuses.filter((s) =>
      s.name.toLowerCase().includes(statusSearchTerm.toLowerCase())
    );
  };

  // Helper function to get filtered sections based on search term
  const getFilteredSections = () => {
    const sections = availableSections || [];
    if (!sectionSearchTerm.trim()) return sections;
    return sections.filter((section) =>
      section.name.toLowerCase().includes(sectionSearchTerm.toLowerCase())
    );
  };

  // Get status color and icon from taskStatuses array
  const getStatusColorAndIcon = (statusValue) => {
    if (!statusValue)
      return {
        bg: "bg-gray-100",
        styles: { borderColor: "#BCBCBC", color: "#666666" },
        dotStyle: { backgroundColor: "#BCBCBC" },
        hexColor: "#BCBCBC",
      };

    // Normalize the status value for comparison
    const normalizedStatusValue = statusValue.toLowerCase().replace(/ /g, "_");

    // Check if we have statuses from API
    const availableStatuses =
      taskStatuses?.length > 0
        ? taskStatuses
        : [
          {
            id: "2f6844d9-fe9d-4bd4-a1cb-be99f2896dc2",
            name: "Not Started Yet",
            color: "#DC3464",
            value: "not_started_yet",
          },
          {
            id: "0f79ea13-f40a-4e8b-a8b5-5e8f13167a1a",
            name: "In progress",
            color: "#3092F5",
            value: "in_progress",
          },
          {
            id: "df9cb378-a31d-42b6-8115-46a2e04bf69d",
            name: "Completed",
            color: "#30F558",
            value: "completed",
          },
          {
            id: "ae7cd059-26d8-49aa-b0d1-5697c1ce2fa7",
            name: "Pending",
            color: "#BCBCBC",
            value: "pending",
          },
          {
            id: "2b73d3de-7f29-4c56-9bae-4d4f08726de2",
            name: "Archived",
            color: "#6C757D",
            value: "archived",
          },
        ];

    // Find the status in the taskStatuses array - try multiple matching methods
    let statusObj = availableStatuses.find(
      (s) =>
        s.name === statusValue ||
        s.name.toLowerCase() === statusValue?.toLowerCase() ||
        s.value === normalizedStatusValue
    );

    // If not found, try matching by converting spaces to underscores
    if (!statusObj && statusValue.includes(" ")) {
      statusObj = availableStatuses.find(
        (s) => s.value === statusValue.toLowerCase().replace(/ /g, "_")
      );
    }

    if (statusObj) {
      return {
        bg: "bg-white",
        styles: {
          borderColor: statusObj.color,
          color: statusObj.color,
          backgroundColor: `${statusObj.color}20`, // 20 is hex for 12% opacity
        },
        dotStyle: {
          backgroundColor: statusObj.color,
        },
        hexColor: statusObj.color,
      };
    }

    // Default colors if status not found - use common status colors
    const defaultColors = {
      completed: "#30F558",
      in_progress: "#3092F5",
      pending: "#BCBCBC",
      not_started_yet: "#DC3464",
      archived: "#6C757D",
    };

    const colorKey =
      normalizedStatusValue in defaultColors
        ? normalizedStatusValue
        : "pending";
    const color = defaultColors[colorKey];

    return {
      bg: "bg-gray-100",
      styles: {
        borderColor: color,
        color: color,
      },
      dotStyle: {
        backgroundColor: color,
      },
      hexColor: color,
    };
  };

  // Toggle status dropdown
  const toggleStatusDropdown = (e) => {
    e.preventDefault();
    const newOpen = !statusDropdownOpen;
    setStatusDropdownOpen(newOpen);
    setHighlightedStatusIndex(-1);
    setStatusSearchTerm("");
  };

  // Helper function to check if task matches current filters
  const taskMatchesFilters = useCallback((updatedTaskPosition) => {
    // If no status filter is applied, task always matches
    if (!currentFilters ||
      !currentFilters.taskPosition ||
      currentFilters.taskPosition === "" ||
      (Array.isArray(currentFilters.taskPosition) && currentFilters.taskPosition.length === 0)) {
      return true;
    }

    // Handle both string and array formats for taskPosition filter
    const filterPositions = Array.isArray(currentFilters.taskPosition)
      ? currentFilters.taskPosition
      : [currentFilters.taskPosition];

    // Check if the updated task position matches any of the filtered statuses
    // Normalize both values for comparison (handle case sensitivity)
    const normalizedUpdatedPosition = updatedTaskPosition?.toString().toLowerCase();
    return filterPositions.some(
      filterStatus => filterStatus?.toString().toLowerCase() === normalizedUpdatedPosition
    );
  }, [currentFilters]);

  // Update handleStatusChange to work with taskPosition
  const handleStatusChange = async (statusName) => {
    // Use default statuses if taskStatuses is empty
    const availableStatuses =
      taskStatuses?.length > 0
        ? taskStatuses
        : [
          {
            id: "2f6844d9-fe9d-4bd4-a1cb-be99f2896dc2",
            name: "Not Started Yet",
            color: "#DC3464",
            value: "not_started_yet",
          },
          {
            id: "0f79ea13-f40a-4e8b-a8b5-5e8f13167a1a",
            name: "In progress",
            color: "#3092F5",
            value: "in_progress",
          },
          {
            id: "df9cb378-a31d-42b6-8115-46a2e04bf69d",
            name: "Completed",
            color: "#30F558",
            value: "completed",
          },
          {
            id: "ae7cd059-26d8-49aa-b0d1-5697c1ce2fa7",
            name: "Pending",
            color: "#BCBCBC",
            value: "pending",
          },
          {
            id: "2b73d3de-7f29-4c56-9bae-4d4f08726de2",
            name: "Archived",
            color: "#6C757D",
            value: "archived",
          },
        ];

    // Get the status object from availableStatuses array
    const statusObj = availableStatuses.find((s) => s.name === statusName);

    if (!statusObj) {
      console.error(`Status not found for: ${statusName}`);
      toast.error("Invalid status selected");
      return;
    }

    // Use the name for UI but the value for API
    setTaskPosition(statusName);
    setStatusDropdownOpen(false);
    setHighlightedStatusIndex(-1);
    setStatusSearchTerm("");
    if (statusName === "Completed") {
      // confetti({
      //   particleCount: 200,
      //   spread: 90,
      //   origin: { y: 0.3 },
      //   colors: ["#0F6FFF", "#A026FF", "#6d42f8", "#9333ea", "#2DE072"],
      //   disableForReducedMotion: true,
      // });
      startConfetti()
    }

    // Update UI optimistically
    dispatch(
      updateTaskProperty({
        taskId: task?._id,
        property: "taskPosition",
        value: statusName,
      })
    );

    // Also update isComplete property
    dispatch(
      updateTaskProperty({
        taskId: task?._id,
        property: "isComplete",
        value: statusObj.value === "completed",
      })
    );

    try {
      // Call API to update task
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

      const formData = new FormData();
      // Send the value field to the API instead of the name
      formData.append("taskPosition", statusObj.value);
      // Also update isComplete based on status
      formData.append("isComplete", statusObj.value === "completed" ? "true" : "false");

      const data = await fetchAuthFilePut(apiUrl, {
        body: formData,
      });

      if (!data.status) {
        throw new Error(data.message || "Failed to update task status");
      }

      toast.success("Task status updated successfully", {
        position: "bottom-right",
        autoClose: 2000,
      });

      // Check if task still matches the current filter after status change
      // Wait for Redux state to update before checking filter
      requestAnimationFrame(() => {
        setTimeout(() => {
          const matchesFilter = taskMatchesFilters(statusObj.value);

          // If task doesn't match filter anymore, remove it from view (but keep panel open)
          // Panel will stay open until user manually closes it
          if (!matchesFilter) {
            dispatch(removeTaskFromState(task._id));

            // Don't close the panel automatically - let user close it manually
            // The task will be removed from the list, but panel stays open
          }
        }, 100); // Small delay to ensure Redux state is updated
      });
    } catch (error) {
      console.error("Error updating task status:", error);

      // Revert UI changes on error
      dispatch(
        updateTaskProperty({
          taskId: task?._id,
          property: "taskPosition",
          value: task.taskPosition,
        })
      );

      dispatch(
        updateTaskProperty({
          taskId: task?._id,
          property: "isComplete",
          value: task.isComplete,
        })
      );

      toast.error("Failed to update task status", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  // Handle section change
  const handleSectionChange = async (newSectionId) => {
    if (!newSectionId || newSectionId === currentSectionId) {
      setSectionDropdownOpen(false);
      return;
    }

    const oldSectionId = currentSectionId;

    // Update UI optimistically
    setCurrentSectionId(newSectionId);
    setSectionDropdownOpen(false);

    try {
      // Call API to update task section
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

      const formData = new FormData();
      formData.append("section", newSectionId);

      const data = await fetchAuthFilePut(apiUrl, {
        body: formData,
      });

      if (!data.status) {
        throw new Error(data.message || "Failed to update task section");
      }

      // Update Redux state
      dispatch(
        updateTaskProperty({
          taskId: task._id,
          property: "section",
          value: newSectionId,
        })
      );

      const newSectionName = availableSections?.find(s => s.id === newSectionId)?.name || "new section";
      toast.success(`Task moved to ${newSectionName}`, {
        position: "bottom-right",
        autoClose: 1500,
      });
    } catch (error) {
      console.error("Error changing task section:", error);
      // Revert on error
      setCurrentSectionId(oldSectionId);
      toast.error("Failed to move task to new section", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  // Toggle section dropdown
  const toggleSectionDropdown = (e) => {
    e.preventDefault();
    const newOpen = !sectionDropdownOpen;
    setSectionDropdownOpen(newOpen);
    setHighlightedSectionIndex(-1);
    setSectionSearchTerm("");
  };

  // Get style for current status
  const currentStatusStyle = getStatusColorAndIcon(taskPosition);

  // Update handleTaskNameChange to use the ref-based debounced function
  const handleTaskNameChange = (e) => {
    const newName = e.target.value;
    setTaskName(newName);

    // Update UI optimistically
    dispatch(
      updateTaskProperty({
        taskId: task?._id,
        property: "taskName",
        value: newName,
      })
    );

    // Cancel any previous pending debounced calls
    if (debouncedFnRef.current?.cancel) {
      debouncedFnRef.current.cancel();
    }

    // Call the debounced API update function
    debouncedFnRef.current(newName);
    // Reset height to auto to shrink if needed
    textareaRef.current.style.height = "auto";
    // Set height to scrollHeight to fit content
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  // Adjust height of task name field
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [taskName]);

  // Get project name by projectId
  const getProjectName = (projectId) => {
    try {
      if (!projectId) return "No project";
      if (!projects || !Array.isArray(projects)) {
        return "No project";
      }
      const project = projects.find((p) => p._id === projectId);
      return project ? project.name : "No project";
    } catch (error) {
      console.error("Error in getProjectName:", error);
      return "No project";
    }
  };

  // Get assignee details by userId
  const getAssignee = (userId) => {
    const user = users.find((u) => u._id === userId);
    return user ? `${user.first_name} ${user.last_name}` : "Unassigned";
  };

  // Get assignee email by userId
  const getAssigneeEmail = (userId) => {
    const user = users.find((u) => u._id === userId);
    return user ? user.email : "";
  };

  // Add a helper function to check if a task is completed
  const isTaskCompleted = () => {
    return (
      taskPosition === "completed" ||
      taskPosition === "Completed" ||

      (taskPosition && taskPosition.toLowerCase() === "completed")
    );
  };

  // Update the handleMarkComplete function to toggle completion state
  const handleMarkComplete = async () => {
    // Determine the new status based on current status
    const isCurrentlyCompleted = isTaskCompleted();


    // Find the appropriate status object
    const completedStatus = taskStatuses.find(
      (s) => s.name.toLowerCase() === "completed"
    );
    const pendingStatus =
      taskStatuses.find((s) => s.name.toLowerCase() === "pending") ||
      taskStatuses.find((s) => s.value === "pending");

    // Set new task position - use name for UI
    const newPositionName = isCurrentlyCompleted
      ? pendingStatus?.name || "Pending"
      : "Completed";
    const newPositionValue = isCurrentlyCompleted
      ? pendingStatus?.value || "pending"
      : completedStatus?.value || "completed";

    // Update UI optimistically
    setTaskPosition(newPositionName);

    // Update in Redux
    dispatch(
      updateTaskProperty({
        taskId: task?._id,
        property: "taskPosition",
        value: newPositionName,
      })
    );

    // Trigger confetti effect only when marking as completed
    if (!isCurrentlyCompleted) {
      // confetti({
      //   particleCount: 200,
      //   spread: 90,
      //   origin: { y: 0.3 },
      //   colors: ["#0F6FFF", "#A026FF", "#6d42f8", "#9333ea", "#2DE072"],
      //   disableForReducedMotion: true,
      // });
      startConfetti()
    }

    try {
      // Call API to update task
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

      const formData = new FormData();
      // Send the value field to the API
      formData.append("taskPosition", newPositionValue);

      await fetchAuthFilePut(apiUrl, {
        body: formData,
      });

      // Show success message
      toast.success(
        isCurrentlyCompleted
          ? "Task marked as incomplete"
          : "Task marked as complete",
        {
          position: "bottom-right",
          autoClose: 2000,
        }
      );

      // Check if task still matches the current filter after status change
      // Wait for Redux state to update before checking filter
      requestAnimationFrame(() => {
        setTimeout(() => {
          const matchesFilter = taskMatchesFilters(newPositionValue);

          // If task doesn't match filter anymore, remove it from view (but keep panel open)
          // Panel will stay open until user manually closes it
          if (!matchesFilter) {
            dispatch(removeTaskFromState(task._id));

            // Don't close the panel automatically - let user close it manually
            // The task will be removed from the list, but panel stays open
          }
        }, 100); // Small delay to ensure Redux state is updated
      });
    } catch (error) {
      console.error("Error updating task status:", error);

      // Revert UI state if API call fails
      setTaskPosition(task?.taskPosition || "Pending");

      toast.error("Failed to update task status", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  const handleRepeatUntilChange = (value) => {
    setRepeatUntil(value);
    setShowRepeatOptions(false);
  };

  // Update handlePriorityChange to call the API
  const handlePriorityChange = async (value) => {
    setPriority(value);

    // Update UI optimistically
    dispatch(
      updateTaskProperty({
        taskId: task?._id,
        property: "priority",
        value,
      })
    );

    try {
      // Call API to update task
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

      const formData = new FormData();
      formData.append("priority", value);

      const data = await fetchAuthFilePut(apiUrl, {
        body: formData,
      });

      if (!data.status) {
        throw new Error(data.message || "Failed to update task priority");
      }
    } catch (error) {
      console.error("Error updating task priority:", error);
      toast.error("Failed to update task priority", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  // Update handleDueDateChange to call the API
  const handleDueDateChange = async (e) => {
    const value = e.target.value;
    setDueDate(value);

    // Format for API submission - convert from YYYY-MM-DD to API format
    const formattedDate = value ? new Date(value).toISOString() : null;

    // Update UI optimistically
    dispatch(
      updateTaskProperty({
        taskId: task?._id,
        property: "dueDate",
        value: formattedDate,
      })
    );

    try {
      // Call API to update task
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

      const formData = new FormData();
      formData.append("dueDate", formattedDate);

      const data = await fetchAuthFilePut(apiUrl, {
        body: formData,
      });

      if (!data.status) {
        throw new Error(
          data.message || "Failed to update due date"
        );
      }

      // Success toast
      toast.success("Due date updated successfully", {
        position: "bottom-right",
        autoClose: 1500,
        hideProgressBar: true,
      });
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error("Failed to update due date", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  // Update task fields callback for TaskDescriptionComments
  const updateTaskFieldsLocal = (taskId, field, value) => {
    // If we have a parent updateTaskFields function (from inbox), use it preferentially
    if (typeof updateTaskFields === "function") {
      updateTaskFields(taskId, field, value);
      return;
    }

    // Fallback to Redux update for normal task page usage
    dispatch(
      updateTaskProperty({
        taskId,
        property: field,
        value,
      })
    );

    // Also update local task state when viewing nested subtasks (when setTask is provided)
    if (
      typeof setTask === "function" &&
      task &&
      (String(task._id) === String(taskId) || String(task.taskId) === String(taskId))
    ) {
      setTask({
        ...task,
        [field]: value,
      });
    }
  };

  // Update comment count callback for TaskDescriptionComments
  const updateCommentCount = (taskId, newCount) => {
    setCommentCount(newCount);
    dispatch(updateTaskCommentCount({ taskId, newCount }));
  };

  // Add a generic updateTaskField function to handle all task field updates with API calls
  const updateTaskField = async (field, value) => {
    if (!task?._id || !userInfo?._id) {
      console.error("Missing task ID or user ID");
      toast.error("Cannot update task: Missing task or user information");
      return;
    }

    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

      // Optimistic Redux update
      dispatch(
        updateTaskProperty({
          taskId: task._id,
          property: field,
          value: value,
        })
      );

      let data;
      if (field === "collaborators") {
        data = await fetchAuthPut(apiUrl, {
          body: { [field]: value },
        });
      } else {
        const formData = new FormData();
        formData.append(field, value);
        data = await fetchAuthFilePut(apiUrl, {
          body: formData,
        });
      }

      if (data.status) {
        // Update Redux state with actual backend response
        if (data.task_details) {
          dispatch(updateTask(data.task_details));
        }

        const toastFields = new Set([
          "taskName",
          "projectId",
          "status",
          "priority",
          "dueDate",
          "userId",
        ]);

        if (toastFields.has(field)) {
          toast.success(`Task ${field} updated successfully`, {
            position: "bottom-right",
            autoClose: 1500,
            hideProgressBar: true,
          });
        }
      } else {
        throw new Error(data.message || `Failed to update task ${field}`);
      }
    } catch (error) {
      console.error(`Error updating task ${field}:`, error);

      toast.error(
        `Failed to update task ${field}: ${error.message || "Unknown error"}`,
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
    }
  };

  // Complete overhaul of the handleCollaboratorChange function
  const handleCollaboratorChange = async (newSelectedEmployees) => {
    setCollaboratorLoading(true);

    try {
      await updateTaskField("collaborators", newSelectedEmployees);
    } catch (error) {
      console.error("Error in collaborator update:", error);
    } finally {
      setCollaboratorLoading(false);
    }
  };

  // Add the handleShare function
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Add the handleCopyUrl function
  const handleCopyUrl = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/tasks?taskId=${task?.taskId}`)
      .then(() => {
        setIsCopy(true);
        setTimeout(() => {
          setIsCopy(false);
        }, 1000);
      })
      .catch(() => {
        setIsCopy(false);
      });
  };

  // Add function to handle delete button click
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  // Update the deleteTask function to dispatch the removeTaskFromState action
  const deleteTask = async () => {
    try {
      setIsDeleting(true);
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;

      // Use taskId instead of _id to avoid temp IDs
      const taskIdToUse = task?.taskId || task?._id;
      // Use the correct API endpoint format
      const apiUrl = `${BaseUrl}/api/tasks/${taskIdToUse}/?userId=${userInfo._id}`;

      await fetchAuthDelete(apiUrl);
      if (task?.parent) {
        const foundTask = tasks.find(
          (task) => String(task.taskId) === String(task?.parent)
        );
        if (foundTask) {
          const params = new URLSearchParams(location.search);
          params.set("taskId", foundTask._id);
          navigate({ search: params.toString() });
          if (from === "task") {
            dispatch(setSelectedTask(foundTask));
          } else {
            setTask(foundTask)
          }
          dispatch(togglePanelVisibility(true));
        } else {
          try {
            const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${task?.parent}/`;
            const data = await fetchAuthGET(apiUrl, false);
            if (data?.status === 1) {
              const fetchedTask = data?.data;
              const params = new URLSearchParams(location.search);
              params.set("taskId", fetchedTask._id);
              navigate({ search: params.toString() });
              if (from === "task") {
                dispatch(setSelectedTask(fetchedTask));
              } else {
                setTask(fetchedTask)
              }
              dispatch(togglePanelVisibility(true));
            } else {
              console.error("Error fetching task details: invalid status");
            }
          } catch (error) {
            console.error("Error fetching task details:", error);
          }
        }
      } else {
        // Remove taskId from URL synchronously to avoid race condition
        if (location.search.includes("taskId")) {
          const params = new URLSearchParams(location.search);
          params.delete("taskId");
          const newUrl = `${location.pathname}?${params.toString()}`.replace(
            /\?$/,
            ""
          );
          window.history.replaceState(null, "", newUrl);
        }

        // 2. Remove task from Redux state
        dispatch(removeTaskFromState(task._id));

        if (currentPage) {
          dispatch(fetchTasks({ pageNo: currentPage, forceRefresh: true }));
        }

        // 3. Close the panel (toggles visibility & selectedTask null)
        onClose();
      }

      toast.success("Task deleted successfully", {
        position: "bottom-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task", {
        position: "bottom-right",
        autoClose: 3000,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Add this function to toggle priority dropdown
  const togglePriorityDropdown = (e) => {
    e.preventDefault();
    setPriorityDropdownOpen(!priorityDropdownOpen);
  };

  // Helper function to get priority color
  const getPriorityColor = (priorityValue) => {
    const colors = {
      low: "#FF5F1F", // green
      medium: "#FFB800", // yellow
      high: "#DC3464", // red
    };
    return colors[priorityValue.toLowerCase()] || "#BCBCBC";
  };

  const removeMediaFromContent = async (mediaUrl, context = "description") => {
    if (context === "description") {
      const editor = document.querySelector(".tf-editor-area");
      if (!editor) return;

      // Remove <img>
      const img = editor.querySelector(`img[src="${mediaUrl}"]`);
      if (img && img.parentNode) {
        img.parentNode.removeChild(img);
      }

      // Remove <video><source src="..."></video>
      const videoSource = editor.querySelector(`video source[src="${mediaUrl}"]`);
      if (videoSource && videoSource.closest("video")) {
        videoSource.closest("video").remove();
      }

      // Also handle <video src="..."> directly (if any)
      const videoDirect = editor.querySelector(`video[src="${mediaUrl}"]`);
      if (videoDirect && videoDirect.parentNode) {
        videoDirect.parentNode.removeChild(videoDirect);
      }

      const updatedHTML = editor.innerHTML;

      // Update backend and Redux
      let payload = new FormData();
      payload.append("description", updatedHTML);

      dispatch(updateTaskProperty({
        taskId: task?._id,
        property: "description",
        value: updatedHTML,
      }));

      dispatch(updateTask(task?._id, payload));
    }

    if (context === "comments") {
      const updatedComments = await Promise.all(
        commentChat.map(async (comment) => {
          if (!comment.message?.includes(mediaUrl)) return comment;

          const div = document.createElement("div");
          div.innerHTML = comment.message;

          // Remove <img>
          const imgs = div.querySelectorAll(`img[src="${mediaUrl}"]`);
          imgs.forEach((img) => img.remove());

          // Remove <video><source>
          const sources = div.querySelectorAll(`video source[src="${mediaUrl}"]`);
          sources.forEach((source) => {
            const video = source.closest("video");
            if (video) video.remove();
          });

          // Remove <video src="..."> directly
          const videoDirects = div.querySelectorAll(`video[src="${mediaUrl}"]`);
          videoDirects.forEach((video) => video.remove());

          const newMessage = div.innerHTML;

          try {
            await fetchAuthPut(`${import.meta.env.VITE_APP_DJANGO}/api/taskchat/${comment.id}/`, {
              body: { message: newMessage },
            });
          } catch (err) {
            console.error("Error updating comment after media delete:", err);
          }

          return { ...comment, message: newMessage };
        })
      );

      setCommentChat(updatedComments);
    }
  };


  const handleDeleteAttachment = async (attachment) => {
    try {
      setIsAttachmentDeleting(true);
      const result = await dispatch(
        deleteTaskAttachment({
          taskId: task.taskId,
          attachmentId: attachment.id,
        })
      ).unwrap();
      // Show success message
      toast.success(result.message || "Attachment deleted successfully", {
        autoClose: 2000,
      });

      await removeMediaFromContent(attachment.url, attachment.folder);
      dispatch(fetchTaskAttachments(task?.taskId));
    } catch (error) {
      console.error("Delete Attachment Error:", error);
      toast.error("Delete Attachment Failed");
    } finally {
      setIsAttachmentDeleting(false);
      setShowAttachmentDeleteModal(false);
      setAttachmentForDelete({});
    }
  };

  function shortenFilename(filename, maxLength = 25) {
    if (!filename) return;
    const extIndex = filename.lastIndexOf(".");
    if (extIndex === -1) return filename;

    const name = filename.slice(0, extIndex);
    const ext = filename.slice(extIndex);

    // If it's already short enough, return as-is
    if (filename.length <= maxLength) return filename;

    const start = name.slice(0, 15);
    const end = name.slice(-5);

    return `${start}...${end}${ext}`;
  }

  /*   // Add this pause timer function
  const pauseCurrentTimer = (taskId, e) => {
    // Implement if needed - this can be called by the TaskTracking component
    console.log("Pausing timer for task:", taskId);
  }; */

  // Add function to fetch project statuses
  const fetchProjectStatuses = async (projectId, companyId) => {
    if (!projectId || !companyId) return;

    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/project-status/${companyId}/${projectId}/`;

      const data = await fetchAuthGET(apiUrl);

      if (data.status && data.unique_statuses) {
        // Update state with the new statuses
        setTaskStatuses(data.unique_statuses);
      }
    } catch (error) {
      console.error("Error fetching project statuses:", error);
    }
  };

  // Function to update project statuses - this will be called from ProjectSelect
  const updateProjectStatuses = (projectId) => {
    if (projectId && userInfo?.companyId) {
      setProjectStatuses(projectId);
    }
  };

  const updateAllocatedTime = async (value, property) => {
    dispatch(updateTaskProperty({
      taskId: task?._id,
      property: property,
      value: value,
    }));
    try {
      // API call to update allocated hours on the backend
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

      await fetchAuthPut(apiUrl, { body: { allocated_time: value } });

    } catch (err) {
      console.error(err)
    }
  }

  // This will be triggered when projectStatuses state changes
  useEffect(() => {
    if (projectStatuses && userInfo?.companyId) {
      fetchProjectStatuses(projectStatuses, userInfo?.companyId);
    }
  }, [projectStatuses, userInfo?.companyId]);

  // Load task statuses when task mounts or changes
  useEffect(() => {
    if (task?.projectId && userInfo?.companyId) {
      fetchProjectStatuses(task.projectId, userInfo.companyId);
    }
  }, [task?.projectId, userInfo?.companyId]);

  // Update local likedBy state when task changes
  useEffect(() => {
    setLikedBy(task?.liked_by || []);
  }, [task]);

  // Like/unlike handler
  const handleLikeToggle = async () => {
    if (!task?._id || !userInfo?._id) return;
    setLikeLoading(true);
    const hasLiked = likedBy.includes(userInfo._id);
    // Optimistically update UI
    let newLikedBy;
    if (hasLiked) {
      newLikedBy = likedBy.filter((id) => id !== userInfo._id);
    } else {
      newLikedBy = [...likedBy, userInfo._id];
      // Trigger like animation
      setLikeAnimate(true);
      setTimeout(() => setLikeAnimate(false), 400);
    }
    setLikedBy(newLikedBy);
    dispatch(
      updateTaskProperty({
        taskId: task._id,
        property: "liked_by",
        value: newLikedBy,
      })
    );
    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/tasks/${task._id}/like/${userInfo._id}/`;
      const res = await fetchAuthPost(apiUrl, { body: {} });
      if (res.status && Array.isArray(res.liked_by)) {
        setLikedBy(res.liked_by);
        dispatch(
          updateTaskProperty({
            taskId: task._id,
            property: "liked_by",
            value: res.liked_by,
          })
        );
      }
    } catch (err) {
      // Revert UI if error
      setLikedBy(likedBy);
      dispatch(
        updateTaskProperty({
          taskId: task._id,
          property: "liked_by",
          value: likedBy,
        })
      );
      toast.error("Failed to update like", {
        position: "bottom-right",
        autoClose: 1500,
      });
    } finally {
      setLikeLoading(false);
    }
  };

  // Get users who liked the task
  let likedUsers =
    users && likedBy.length > 0
      ? users.filter((user) => likedBy.includes(user._id))
      : [];
  // Sort so current user is always first if they liked the task
  if (likedUsers.length > 1 && userInfo?._id) {
    likedUsers = [
      ...likedUsers.filter((u) => u._id === userInfo._id),
      ...likedUsers.filter((u) => u._id !== userInfo._id),
    ];
  }

  const getSubtasks = async (taskId) => {
    setSubtasksLoading(true);
    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/tasks/${taskId}/subtasks/`;
      const res = await fetchAuthGET(apiUrl, false);
      if (res.status && Array.isArray(res.subtasks)) {
        setSubtasks([...res?.subtasks].reverse());
      } else {
        setSubtasks([]);
      }
    } catch (err) {
      console.error("Error fetching subtasks:", err);
      setSubtasks([]);
    }
    finally {
      setSubtasksLoading(false);
    }
  }
  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim()) return;

    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/tasks/subtasks/create/?userId=${userInfo._id}`;
      const res = await fetchAuthPost(apiUrl, {
        body: {
          taskName: newSubtaskName.trim(),
          parent: task?._id,
          projectId: task?.projectId === null ? userInfo?.default_project_id : task?.projectId,
        }
      });

      if (res.status) {
        // Add the new subtask to the list
        const newSubtask = {
          ...res?.data,
          _id: String(res?.data?.taskId),
          parent_hierarchy: res?.data?.parent_hierarchy?.filter((hierarchy, i) => hierarchy?.taskId !== res?.data?.taskId)
        };
        setSubtasks(prev => [...prev, newSubtask]);
        setNewSubtaskName("");
        setIsAddingSubtask(false);
        toast.success("Subtask added successfully", {
          position: "bottom-right",
          autoClose: 1500,
        });
        dispatch(updateTaskSubtaskCount({
          taskId: task._id,
          newCount: subtasks?.length + 1 // new total, since you've just added one
        }));
      } else {
        throw new Error(res.message || "Failed to add subtask");
      }
    } catch (err) {
      console.error("Error adding subtask:", err);
      toast.error("Failed to add subtask", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  }

  const handleUpdateSubtask = async (subtaskId, newName) => {
    if (!newName.trim()) return;

    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${subtaskId}/${userInfo._id}/`;
      const response = await fetchAuthPut(apiUrl, { body: { taskName: newName.trim() } });

      if (!response.status) {
        throw new Error(response.message || "Failed to update subtask");
      }

      // Get current timestamp for immediate UI update
      const currentTime = new Date().toISOString();

      setSubtasks(prev =>
        prev.map(subtask =>
          subtask._id === subtaskId
            ? {
              ...subtask,
              taskName: newName.trim(),
              updatedAt: currentTime,
              edited_at: currentTime,
              last_edited: currentTime
            }
            : subtask
        )
      );
      setEditingSubtaskId(null);
      setEditingSubtaskName("");
      toast.success("Subtask updated successfully", {
        position: "bottom-right",
        autoClose: 1500,
      });
    } catch (err) {
      console.error("Error updating subtask:", err);
      toast.error("Failed to update subtask", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  }

  const handleToggleSubtaskComplete = async (subtaskId, currentStatus, taskPosition) => {
    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${subtaskId}/${userInfo._id}/`;
      const response = await fetchAuthPut(apiUrl, { body: { taskPosition: taskPosition === "completed" ? "pending" : "completed" } });

      if (!response.status) {
        throw new Error(response.message || "Failed to update subtask status");
      }

      // Get current timestamp for immediate UI update
      const currentTime = new Date().toISOString();

      setSubtasks(prev =>
        prev.map(subtask =>
          subtask._id === subtaskId
            ? {
              ...subtask,
              taskPosition: taskPosition === "completed" ? "pending" : "completed",
              updatedAt: currentTime,
              edited_at: currentTime,
              last_edited: currentTime
            }
            : subtask
        )
      );

      if (taskPosition !== "completed") {
        // confetti({
        //   particleCount: 200,
        //   spread: 90,
        //   origin: { y: 0.3 },
        //   colors: ["#0F6FFF", "#A026FF", "#6d42f8", "#9333ea", "#2DE072"],
        //   disableForReducedMotion: true,
        // });
        startConfetti()
      }
    } catch (err) {
      console.error("Error toggling subtask completion:", err);
      toast.error("Failed to update subtask status", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  }

  const handleStartEditing = (subtask) => {
    setEditingSubtaskId(subtask._id);
    setEditingSubtaskName(subtask.taskName);
  }

  const handleCancelEditing = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskName("");
  }

  const handleSaveEditing = () => {
    if (editingSubtaskName.trim()) {
      handleUpdateSubtask(editingSubtaskId, editingSubtaskName);
    }
  }

  const handleSubtaskDueDateChange = async (subtaskId, selectedDate) => {
    if (!selectedDate) return;

    // Format as "YYYY-MM-DD"
    const apiFormattedDate = moment(selectedDate).format("YYYY-MM-DD");

    // Optimistically update UI
    setSubtasks(prev =>
      prev.map(st =>
        st._id === subtaskId
          ? { ...st, dueDate: apiFormattedDate }
          : st
      )
    );

    try {
      // Call API to update subtask due date
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/task/${subtaskId}/${userInfo._id}/`;

      const formData = new FormData();
      formData.append("dueDate", apiFormattedDate);

      const data = await fetchAuthFilePut(apiUrl, {
        body: formData,
      });

      if (!data.status) {
        throw new Error(data.message || "Failed to update subtask due date");
      }

      toast.success("Due date updated successfully", {
        position: "bottom-right",
        autoClose: 1500,
        hideProgressBar: true,
      });
    } catch (error) {
      console.error("Error updating subtask due date:", error);
      toast.error("Failed to update subtask due date", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  const formatSubtaskDueDate = (date) => {
    if (!date) return null;

    const d = new Date(date);
    const today = new Date();

    // Normalize to midnight for accurate day comparison
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((d - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === -1) return "Yesterday";
    if (diffDays === 1) return "Tomorrow";

    const sameYear = d.getFullYear() === today.getFullYear();
    return sameYear
      ? format(d, "d MMM")        // e.g., "13 Aug"
      : format(d, "d MMM, yyyy"); // e.g., "13 Aug, 2026"
  };

  const handleConvertToSubtask = async (parentId) => {
    try {
      const updatedTask = await dispatch(
        updateTask({
          taskId: task._id,
          data: { parent: parentId },
        })
      ).unwrap();
      if (updatedTask?.status === 1) {
        dispatch(
          updateTaskProperty({
            taskId: task._id,
            property: "parent",
            value: parentId,
          })
        );
        dispatch(
          updateTaskProperty({
            taskId: task._id,
            property: "parent_hierarchy",
            value: updatedTask?.task_details?.parent_hierarchy,
          })
        );

        // Update local task state if setTask function is provided
        if (typeof setTask === 'function') {
          setTask(prevTask => ({
            ...prevTask,
            parent: parentId,
            parent_hierarchy: updatedTask?.task_details?.parent_hierarchy
          }));
        }
      }
    } catch (error) {
      console.error("❌ Update failed:", error);
    } finally {
      setShowConvertSubtaskInput(false);
      setQuery("")
      setOpenMenu(false)
    }
  }

  const isPast = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const getClassName = () => {
    if (from === "inbox") {
      return "w-full h-[calc(100vh-80px)]";
    }
    if (from === "dashboard") {
      return `bg-white dark:bg-gray-900 mx-auto ${isExpand
        ? "h-[100vh] pt-5"
        : " w-full sm:w-[90%] xl:w-2/3 h-[100vh] sm:h-[calc(100vh-120px)]"
        }`;
    }
    return `fixed right-0 w-full bg-white ${isExpand
      ? "z-[9999] h-screen top-0"
      : "sm:w-[650px] xl:w-[750px] h-[calc(100vh-53px)] top-[51px] rounded-lg z-50"
      } border border-[#E1E1E1] dark:border-slate-700`;
  };

  return (
    <div
      className={`${getClassName()} shadow-lg transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      ref={panelRef}
    >
      <div
        className={`flex flex-col  ${isExpand
          ? `mx-10 border border-[#E1E1E1] ${from === "dashboard"
            ? "h-[calc(100vh-20px)]"
            : "h-[calc(100vh-20px)] mt-5"
          }  rounded-md`
          : "h-full"
          } `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center">
            <div
              onClick={() => {
                dispatch(togglePanelVisibility(false));
                onClose();
              }}
              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1 transition-colors"
            >
              <Icon
                icon="heroicons-outline:x-mark"
                className="text-xl text-slate-700 dark:text-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div>
              {likedUsers.length > 0 ? (
                <ModernTooltip
                  content={
                    <div
                      className="space-y-2 max-w-xs min-w-[200px] max-h-80 overflow-y-auto"
                    >
                      {/* <div className="font-semibold text-sm text-gray-100">Liked by:</div> */}
                      {likedUsers.map((user, i) => (
                        <div
                          key={user?._id || i}
                          className="bg-transparent flex items-center gap-2 "
                        >
                          <ProfilePicture
                            user={user}
                            className="w-6 h-6 rounded-full object-cover border border-gray-300"
                          />
                          {user?._id == userInfo?._id ? (
                            <span className="text-sm font-normal dark:text-white">You</span>
                          ) : (
                            <span className="text-sm font-normal capitalize dark:text-white">
                              {user?.name ||
                                `${user.first_name} ${user.last_name}`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  }
                  placement="bottom"
                  theme="custom-light"
                  animation="scale-subtle"
                  interactive={true}
                  allowHTML={true}
                >
                  <button
                    className={`text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 p-1 flex items-end gap-1 transition-colors relative ${likeLoading ? "opacity-60 pointer-events-none" : ""
                      } ${likeAnimate ? "like-animate" : ""}`}
                    title={
                      likedBy.includes(userInfo._id)
                        ? "Unlike task"
                        : "Like task"
                    }
                    onClick={handleLikeToggle}
                    disabled={likeLoading}
                  >
                    <span className="mr-1 text-sm font-medium">
                      {likedBy?.length > 0 ? likedBy?.length : ""}
                    </span>
                    <Icon
                      icon={
                        likedBy.includes(userInfo._id)
                          ? "heroicons:hand-thumb-up-solid"
                          : "heroicons:hand-thumb-up"
                      }
                      className="text-xl"
                    />
                  </button>
                </ModernTooltip>
              ) : (
                <button
                  className={`text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 p-1 flex items-end gap-1 transition-colors relative ${likeLoading ? "opacity-60 pointer-events-none" : ""
                    } ${likeAnimate ? "like-animate" : ""}`}
                  title={
                    likedBy.includes(userInfo._id) ? "Unlike task" : "Like task"
                  }
                  onClick={handleLikeToggle}
                  disabled={likeLoading}
                >
                  <span className="mr-1 text-sm font-medium">
                    {likedBy?.length > 0 ? likedBy?.length : ""}
                  </span>
                  <Icon
                    icon={
                      likedBy.includes(userInfo._id)
                        ? "heroicons:hand-thumb-up-solid"
                        : "heroicons:hand-thumb-up"
                    }
                    className="text-xl"
                  />
                </button>
              )}
            </div>
            <div className="relative">
              <FileUpload
                taskId={task.taskId}
                index={task.taskId}
                from="taskpanelTop"
                task={task}
                isOpen={isOpen}
                onClose={onClose}
                totalAttachments={filteredAttachments?.length}
              />
              {/* {filteredAttachments?.length >= 1 && (
                <div
                  title={`${filteredAttachments?.length} files in attachments`}
                  className="absolute -top-3 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                  onClick={() => {
                    setActiveTabIndex(2);
                  }}
                >
                  {filteredAttachments?.length}
                </div>
              )} */}
            </div>
            <Button
              text={
                isMobile
                  ? ""
                  : isTaskCompleted()
                    ? "Completed"
                    : "Mark Complete"
              }
              className={`${isTaskCompleted()
                ? "bg-white dark:bg-slate-700 text-[#1AB631] border-[2px] border-[#1AB631] cursor-pointer"
                : "border-[2px] hover:border-green-600 text-[#475569] dark:text-slate-300 hover:bg-green-50 dark:hover:bg-slate-600"
                } text-xs font-medium px-3 py-1 rounded-lg flex items-center gap-1 transition-colors`}
              icon={
                isTaskCompleted()
                  ? "heroicons:check"
                  : "iconamoon:check-duotone"
              }
              onClick={handleMarkComplete}
            />
            <div className="border-[2px] bg-[#f9f9f9] dark:bg-slate-700 border-[#E1E1E1] dark:border-slate-600 rounded-md flex items-center justify-center">
              <button
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 p-1 flex items-center gap-1 transition-colors"
                onClick={handleShare}
                title="Share task"
              >
                <Icon icon="heroicons-outline:share" className="text-xl" />
              </button>
            </div>
            <div className="border-[2px] bg-[#f9f9f9] dark:bg-slate-700 border-[#E1E1E1] dark:border-slate-600 rounded-md flex items-center justify-center">
              <button
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors"
                onClick={handleDeleteClick}
                title="Delete Task"
              >
                <Icon icon="mdi:trash" className="text-xl" />
              </button>
            </div>
            {from !== "inbox" && (
              <div className="border-[2px] bg-[#f9f9f9] dark:bg-slate-700 border-[#E1E1E1] dark:border-slate-600 rounded-md hidden lg:flex items-center justify-center">
                <button
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 p-1  items-center gap-1 transition-colors flex"
                  title={isExpand ? "Collapse" : "Expand"}
                  onClick={() => {
                    setIsExpand((prev) => {
                      const next = !prev;
                      // Update the URL param
                      const params = new URLSearchParams(location.search);
                      if (next) {
                        params.set("isFocused", "true");
                      } else {
                        params.delete("isFocused");
                      }
                      navigate(
                        { search: params.toString() },
                        { replace: true }
                      );
                      return next;
                    });
                  }}
                >
                  {isExpand ? (
                    <Icon
                      icon="heroicons:arrows-pointing-in"
                      className="text-xl"
                    />
                  ) : (
                    <Icon
                      icon="heroicons:arrows-pointing-out"
                      className="text-xl"
                    />
                  )}
                </button>
              </div>
            )}

            {/* Seen By  */}
            <div>
              <Tooltip
                content={
                  <div
                    className="space-y-2 max-w-xs min-w-[200px] max-h-80 overflow-y-auto"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "#4B5563 transparent",
                    }}
                  >
                    <div className="font-normal text-sm dark:text-white">
                      Seen by:
                    </div>
                    {seenUsers.map((user, i) => (
                      <div
                        key={user?._id || i}
                        className="flex items-center gap-2"
                      >
                        <ProfilePicture
                          user={user}
                          className="w-6 h-6 rounded-full object-cover border border-gray-300"
                        />
                        <span className="text-sm font-normal dark:text-white">
                          {user?.first_name
                            ? `${user.first_name} ${user.last_name}`
                            : user?.email}
                        </span>
                      </div>
                    ))}
                  </div>
                }
                placement="bottom"
                theme="custom-light"
                animation="scale-subtle"
                interactive={true}
                allowHTML={true}
              >
                <div className="relative flex items-center ml-2 cursor-default">
                  {seenUsers?.slice(0, 2).map((user, i) => (
                    <div
                      key={user?._id || i}
                      className={`w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-semibold 
                        ${i !== 0 ? "-ml-2" : ""} `}
                      style={{ zIndex: 10 - i }}
                    >
                      <ProfilePicture
                        user={user}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  ))}

                  {seenUsers?.length > 2 && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-semibold -ml-2 shadow-sm "
                      style={{ zIndex: 1 }}
                    >
                      +{seenUsers.length - 2}
                    </div>
                  )}
                </div>
              </Tooltip>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                className=" hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md p-1 transition-colors"
                onClick={() => setOpenMenu((prev) => !prev)}
                title="More"
              >
                <Icon icon="tabler:dots" className="text-2xl" />
              </button>
              {openMenu && (
                <div className="absolute right-0  mt-1 w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-slate-700">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        if (task?.parent) {
                          handleConvertToSubtask(null)
                        } else {
                          setShowConvertSubtaskInput(true)
                          setOpenMenu(false)
                        }
                      }}
                      className="flex w-full items-center px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <Icon
                        icon="fluent:convert-range-20-regular"
                        className="w-4 h-4 mr-2"
                      />
                      <span>
                        {task?.parent ? "Remove as subtask" : "Convert to subtask"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {
          showConvertSubtaskInput &&
          <div className="border py-2 px-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">Make this task a subtask of another task.</p>
              <div
                onClick={() => {
                  setShowConvertSubtaskInput(false)
                  setQuery("")
                }}
                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1 transition-colors"
              >
                <Icon
                  icon="heroicons-outline:x-mark"
                  className="text-lg text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>
            {/* Searchable Select Box */}
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none my-2"
              />

              {/* Dropdown Options */}
              {query && (
                <div className="absolute top-11 z-10 w-full bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {loading && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Searching...
                    </div>
                  )}

                  {!loading && options.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No results
                    </div>
                  )}

                  {options.map((task) => (
                    <div
                      key={task?.id}
                      className="px-3 py-2 text-sm text-black-500 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        handleConvertToSubtask(task?.id)
                      }}
                    >
                      <span dangerouslySetInnerHTML={{ __html: task?.name }} />
                      <span className="ml-2 text-xs text-gray-500">{task?.project_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        }

        {/* Content */}
        <div
          ref={scrollableContentRef}
          className="flex-1 overflow-y-auto py-4 px-4 pb-48 dark:bg-slate-800"
          style={{ scrollbarWidth: "thin" }}
        >
          {
            task?.parent && task?.parent_hierarchy?.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mb-4">
                {
                  task?.parent_hierarchy?.map((parent, i) =>
                    <div className="flex items-center" key={i}>
                      <span className="text-sm font-medium text-gray-700 hover:text-electricBlue-100 hover:underline cursor-pointer "
                        onClick={async () => {
                          const foundTask = tasks.find(
                            (task) => String(task.taskId) === String(parent.taskId)
                          );
                          if (foundTask) {
                            // Use taskId instead of _id to avoid temp IDs
                            const taskIdToUse = foundTask.taskId || foundTask._id;
                            const params = new URLSearchParams(location.search);
                            params.set("taskId", taskIdToUse);
                            navigate({ search: params.toString() });
                            if (from === "task") {
                              dispatch(setSelectedTask(foundTask));
                            } else {
                              setTask(foundTask)
                            }
                            dispatch(togglePanelVisibility(true));
                          } else {
                            try {
                              const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${parent.taskId}/`;
                              const data = await fetchAuthGET(apiUrl, false);
                              if (data?.status === 1) {
                                const fetchedTask = data?.data;
                                // Use taskId instead of _id to avoid temp IDs
                                const taskIdToUse = fetchedTask.taskId || fetchedTask._id;
                                const params = new URLSearchParams(location.search);
                                params.set("taskId", taskIdToUse);
                                navigate({ search: params.toString() });
                                if (from === "task") {
                                  dispatch(setSelectedTask(fetchedTask));
                                } else {
                                  setTask(fetchedTask)
                                }
                                dispatch(togglePanelVisibility(true));
                              } else {
                                console.error("Error fetching task details: invalid status");
                              }
                            } catch (error) {
                              console.error("Error fetching task details:", error);
                            }
                          }
                        }}
                      >{parent?.taskName}</span>
                      {i !== task?.parent_hierarchy?.length - 1 || task?.parent_hierarchy?.length === 1 ? (
                        <Icon icon="heroicons:chevron-right-20-solid" className="w-4 h-4" />
                      )
                        : null}
                    </div>
                  )
                }
              </div>
            )
          }

          {/* Form layout based on the image */}
          <div className="grid grid-cols-1 gap-y-4">
            {/* Task Name */}
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Task Name:
                </span>
              </div>
              <div className="flex-1 ">
                {/* <input
                  type="text"
                  className="w-full px-3 py-[6px] text-sm border-[1px] border-[#E1E1E1] dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={taskName}
                  onChange={handleTaskNameChange}
                  placeholder="Task name"
                /> */}
                <textarea
                  ref={textareaRef}
                  className="w-full px-3 py-[7px] -mb-2 text-sm border-[1px] border-[#E1E1E1] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none overflow-hidden"
                  value={taskName}
                  onChange={handleTaskNameChange}
                  placeholder="Task name"
                  style={{
                    backgroundColor: "inherit",
                  }}
                  rows={1}
                />
              </div>
            </div>

            {/* Project */}
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
                <span className="font-medium text-[#747474] dark:text-slate-300">
                  Project:
                </span>
              </div>
              <div className="flex-1 relative">
                <div className="dark:border-slate-600 rounded-md">
                  <ProjectSelect
                    task={{ ...task, projectId: selectedProjectId }}
                    index={task?._id}
                    setIsAddProject={setIsAddProject}
                    setProjectStatuses={updateProjectStatuses}
                    from="taskpanel"
                    updateExistingTask={async (updatedTask, field) => {
                      // Update UI optimistically for projectId
                      dispatch(
                        updateTaskProperty({
                          taskId: task?._id,
                          property: "projectId",
                          value: updatedTask.projectId,
                        })
                      );

                      setSelectedProjectId(updatedTask.projectId);

                      // Also update projectName in UI
                      if (updatedTask.projectName) {
                        dispatch(
                          updateTaskProperty({
                            taskId: task?._id,
                            property: "projectName",
                            value: updatedTask.projectName,
                          })
                        );
                      }

                      // Update project statuses when project changes
                      updateProjectStatuses(updatedTask.projectId);

                      setCurrentSectionId(null);

                      try {
                        const BaseUrl = import.meta.env.VITE_APP_DJANGO;
                        const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;
                        const formData = new FormData();
                        formData.append("projectId", updatedTask.projectId);

                        const data = await fetchAuthFilePut(apiUrl, {
                          body: formData,
                        });

                        if (!data.status) {
                          throw new Error(
                            data.message || "Failed to update project"
                          );
                        }

                        // Update Redux state with the latest data from the response
                        // Ensure taskCode and project statuses are updated

                        // Update taskCode specifically if it changed (only for project updates)
                        if (data.task_details.taskCode && data.task_details.taskCode !== task.taskCode) {
                          dispatch(updateTaskProperty({
                            taskId: task._id,
                            property: "taskCode",
                            value: data.task_details.taskCode,
                          }));
                        }

                        // Update project statuses if they changed (only for project updates)
                        if (data.task_details.project_status && Array.isArray(data.task_details.project_status)) {
                          // Update the task's project_status property
                          dispatch(updateTaskProperty({
                            taskId: task._id,
                            property: "project_status",
                            value: data.task_details.project_status,
                          }));
                          // Also update local state immediately for UI responsiveness
                          setTaskStatuses(data.task_details.project_status);
                        }

                        if (data.task_details.project_sections && Array.isArray(data.task_details.project_sections)) {
                          setAvailableSections(data.task_details.project_sections);
                        }

                        // Preserve the local state properties that shouldn't be overridden by server response
                        if (data.task_details.taskPosition === "completed") {
                          dispatch(updateTaskProperty({
                            taskId: task._id,
                            property: "isComplete",
                            value: true,
                          }));
                        }
                      } catch (error) {
                        console.error("Error updating project:", error);
                        toast.error("Failed to update project", {
                          position: "bottom-right",
                          autoClose: 2000,
                        });
                      }
                    }}
                    projects={userProjects || []}
                  />
                </div>
              </div>
            </div>

            {/* Section */}
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Section:
                </span>
              </div>
              <div className="flex-1 relative" ref={sectionDropdownRef}>
                <button
                  className="w-full rounded-md px-2 py-[7px] flex items-center justify-between overflow-hidden dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                  style={{
                    border: "1px solid #E1E1E1",
                    borderColor: "inherit",
                  }}
                  onClick={toggleSectionDropdown}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">

                    <span className="text-sm truncate">
                      {availableSections?.find(s => s.id === currentSectionId)?.name || "Select Section"}
                    </span>
                  </div>
                  <div className="ml-1">
                    <Icon
                      icon="mingcute:down-fill"
                      className={`text-slate-400 w-4 h-4 flex-shrink-0 transition-transform duration-200 ${sectionDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {/* Section Dropdown Menu */}
                {sectionDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg max-h-64 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-slate-600">
                      <input
                        ref={sectionSearchInputRef}
                        type="text"
                        value={sectionSearchTerm}
                        onChange={(e) => setSectionSearchTerm(e.target.value)}
                        placeholder="Search sections..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-500 rounded bg-white dark:bg-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {getFilteredSections().map((section, idx) => {
                        const isSelected = currentSectionId === section.id;

                        return (
                          <div
                            key={section.id}
                            ref={(el) => (sectionDropdownItemsRef.current[idx] = el)}
                            className={`px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 ${highlightedSectionIndex === idx ? "bg-gray-100 dark:bg-slate-600" : ""}`}
                            onClick={() => handleSectionChange(section.id)}
                          >
                            <div
                              className="flex items-center gap-2 rounded-full px-2 py-1"

                            >

                              <span className="text-sm truncate dark:text-slate-200">
                                {section.name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {getFilteredSections().length === 0 && (
                        <div className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                          No sections found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assign To */}
            <div className="flex flex-col sm:flex-row ">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Assign To:
                </span>
              </div>
              <div className="flex-1 relative">
                <div className="">
                  {/* Using MultiUser component to handle multiple user assignments */}
                  {projectMembers.length > 0 && (
                    <div className="w-full">
                      <div className="relative">
                        <UserMultiSelect
                          task={{
                            ...task,
                            assigned_users: task.assigned_users,
                          }}
                          users={projectMembers}
                          index={task._id}
                          updateExistingTask={async (updatedTask, property) => {
                            if (property !== "assigned_users") return;

                            try {
                              // First update in Redux state immediately
                              dispatch(
                                updateTaskProperty({
                                  taskId: task._id,
                                  property: "assigned_users",
                                  value: updatedTask.assigned_users,
                                })
                              );

                              // Also sync with parent/local task if provided to avoid UI reset on reopen
                              updateTaskFieldsLocal(
                                task._id,
                                "assigned_users",
                                updatedTask.assigned_users
                              );

                              // Make API request
                              const BaseUrl = import.meta.env.VITE_APP_DJANGO;
                              const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

                              // Use fetchAuthPut for JSON data to handle empty arrays correctly
                              const response = await fetchAuthPut(apiUrl, {
                                body: {
                                  assigned_users:
                                    updatedTask.assigned_users || [],
                                },
                              });

                              if (!response.status) {
                                throw new Error(
                                  response.message ||
                                  "Failed to update assignees"
                                );
                              }
                            } catch (error) {
                              console.error("Error updating assignees:", error);
                              toast.error("Failed to update assignees", {
                                position: "bottom-right",
                                autoClose: 2000,
                              });
                            }
                          }}
                          isCompleted={task?.taskPosition === "completed"}
                          initiallyOpen={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Status - separate row on mobile */}
            <div className="flex flex-col sm:flex-row sm:mt-[-16px] ">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mt-3 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Status:
                </span>
              </div>
              <div
                className="w-full sm:ml-[18px] sm:mt-3 relative"
                ref={statusDropdownRef}
              >
                <button
                  className="w-full rounded-md px-2 py-[7px] flex items-center justify-between overflow-hidden "
                  style={{
                    border: `1px solid #E1E1E1`,
                    borderColor: "inherit",
                  }}
                  onClick={toggleStatusDropdown}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={currentStatusStyle.dotStyle}
                    ></div>
                    <span className="text-sm truncate">
                      {taskStatuses?.find(
                        (status) => status.value === taskPosition
                      )?.name || taskPosition}
                    </span>
                  </div>
                  <div className="ml-1">
                    <Icon
                      icon="mingcute:down-fill"
                      className={`text-slate-400 w-4 h-4 flex-shrink-0 transition-transform duration-200 ${statusDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </div>
                </button>

                {/* Status Dropdown Menu */}
                {statusDropdownOpen && (
                  <div className="absolute top-full z-50 left-0 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg max-h-64 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-slate-600">
                      <input
                        ref={statusSearchInputRef}
                        type="text"
                        value={statusSearchTerm}
                        onChange={(e) => setStatusSearchTerm(e.target.value)}
                        placeholder="Search status..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-500 rounded bg-white dark:bg-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    {/* Status Options */}
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {getFilteredStatuses().map((statusObj, idx) => {
                        const style = getStatusColorAndIcon(statusObj.name);
                        // Normalize for comparison
                        const normalizedCurrent = taskPosition
                          ? taskPosition.toLowerCase().replace(/ /g, "_")
                          : "";
                        const normalizedOption =
                          statusObj.value ||
                          statusObj.name.toLowerCase().replace(/ /g, "_");
                        const isSelected =
                          taskPosition === statusObj.name ||
                          normalizedCurrent === normalizedOption ||
                          normalizedCurrent === statusObj.name.toLowerCase();

                        // Check if this is the last status (e.g., Archive)
                        const defaultStatuses = [
                          {
                            id: "2f6844d9-fe9d-4bd4-a1cb-be99f2896dc2",
                            name: "Not Started Yet",
                            color: "#DC3464",
                            value: "not_started_yet",
                          },
                          {
                            id: "0f79ea13-f40a-4e8b-a8b5-5e8f13167a1a",
                            name: "In progress",
                            color: "#3092F5",
                            value: "in_progress",
                          },
                          {
                            id: "df9cb378-a31d-42b6-8115-46a2e04bf69d",
                            name: "Completed",
                            color: "#30F558",
                            value: "completed",
                          },
                          {
                            id: "ae7cd059-26d8-49aa-b0d1-5697c1ce2fa7",
                            name: "Pending",
                            color: "#BCBCBC",
                            value: "pending",
                          },
                          {
                            id: "2b73d3de-7f29-4c56-9bae-4d4f08726de2",
                            name: "Archived",
                            color: "#6C757D",
                            value: "archived",
                          },
                        ];
                        const statusArray =
                          taskStatuses?.length > 0
                            ? taskStatuses
                            : defaultStatuses;
                        const isLast = idx === statusArray.length - 1;
                        const isArchive =
                          statusObj.name.toLowerCase() === "archived" ||
                          statusObj.value === "archived";

                        // If this is the last status and is Archive, make it sticky
                        if (isLast && isArchive) {
                          return (
                            <div
                              key={statusObj.name}
                              ref={(el) => statusDropdownItemsRef.current[idx] = el}
                              className={`px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 sticky bottom-0 bg-white dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 ${highlightedStatusIndex === idx ? 'bg-gray-100 dark:bg-slate-600' : ''
                                }`}
                              onClick={() => handleStatusChange(statusObj.name)}
                              style={{ zIndex: 2 }}
                            >
                              <div
                                className="flex items-center gap-2 rounded-full px-2 py-1"
                                style={{
                                  backgroundColor: isSelected
                                    ? `${style.hexColor}15`
                                    : "transparent",
                                }}
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={style.dotStyle}
                                ></div>
                                <span className="text-sm truncate font-semibold text-red-600">
                                  {statusObj.name}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        // Normal status
                        return (
                          <div
                            key={statusObj.name}
                            ref={(el) => statusDropdownItemsRef.current[idx] = el}
                            className={`px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 ${highlightedStatusIndex === idx ? 'bg-gray-100 dark:bg-slate-600' : ''
                              }`}
                            onClick={() => handleStatusChange(statusObj.name)}
                          >
                            <div
                              className="flex items-center gap-2 rounded-full px-2 py-1"
                              style={{
                                backgroundColor: isSelected
                                  ? `${style.hexColor}15`
                                  : "transparent",
                              }}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={style.dotStyle}
                              ></div>
                              <span className="text-sm truncate dark:text-slate-200">
                                {statusObj.name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Due Date and Priority in one row */}
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Due Date:
                </span>
              </div>
              <div
                className={`${isMobile ? "w-full" : "w-full sm:w-[190px]"
                  } mb-3 sm:mb-0 sm:mr-6`}
              >
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <Flatpickr
                    className={
                      isMobile
                        ? "w-full px-3 py-[10px] pr-[170px] text-sm border-[1px] border-[#E1E1E1] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 mobile-date-input"
                        : "w-full px-4  py-[10px] text-sm border-[1px] border-[#E1E1E1] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    }
                    value={dueDate ? new Date(dueDate) : null}

                    placeholder={dueDate === "" ? "No Due Date" : undefined}
                    onChange={async (selectedDates, dateStr) => {
                      // Only handle date selection here, not clearing
                      if (selectedDates && selectedDates.length > 0) {
                        const selectedDate = selectedDates[0];
                        const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
                        setDueDate(formattedDate);

                        // Format for API submission - convert from YYYY-MM-DD to API format
                        const apiFormattedDate = moment(selectedDate).format("YYYY-MM-DD");

                        // Update UI optimistically
                        dispatch(
                          updateTaskProperty({
                            taskId: task?._id,
                            property: "dueDate",
                            value: apiFormattedDate,
                          })
                        );

                        try {
                          // Call API to update task
                          const BaseUrl = import.meta.env.VITE_APP_DJANGO;
                          const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

                          const formData = new FormData();
                          formData.append("dueDate", apiFormattedDate);

                          const data = await fetchAuthFilePut(apiUrl, {
                            body: formData,
                          });

                          if (!data.status) {
                            throw new Error(
                              data.message || "Failed to update due date"
                            );
                          }

                          // Success toast
                          toast.success("Due date updated successfully", {
                            position: "bottom-right",
                            autoClose: 1500,
                            hideProgressBar: true,
                          });
                        } catch (error) {
                          console.error("Error updating due date:", error);
                          toast.error("Failed to update due date", {
                            position: "bottom-right",
                            autoClose: 2000,
                          });
                        }
                      }
                    }}
                    options={{
                      dateFormat: "Y-m-d",
                      altInput: true,
                      altFormat: "d/m/Y",
                      allowInput: true,
                      clickOpens: true,
                      autoClose: true,
                      disableMobile: true,
                      static: true,
                      onOpen: function (selectedDates, dateStr, instance) {
                        // Stop event propagation to prevent panel close
                        const calendar = document.querySelector(
                          ".flatpickr-calendar"
                        );
                        if (calendar) {
                          calendar.addEventListener("click", function (e) {
                            e.stopPropagation();
                          });
                        }
                      },
                      onClose: function (selectedDates, dateStr, instance) {
                        // Handle both clearing and updating dates when calendar closes
                        const handleDateUpdate = async () => {
                          try {
                            const BaseUrl = import.meta.env.VITE_APP_DJANGO;
                            const apiUrl = `${BaseUrl}/task/${task._id}/${userInfo._id}/`;

                            const formData = new FormData();
                            let newFormattedDate = null;
                            let shouldUpdate = false;

                            if (!dateStr || dateStr.trim() === "") {
                              // Clear the date - only if current date is not already empty
                              if (dueDate && dueDate !== "") {
                                setDueDate("");
                                formData.append("dueDate", "");
                                newFormattedDate = null;
                                shouldUpdate = true;

                                // Update UI optimistically
                                dispatch(
                                  updateTaskProperty({
                                    taskId: task?._id,
                                    property: "dueDate",
                                    value: null,
                                  })
                                );
                              }
                            } else {
                              // Update with typed date
                              const parsedDate = moment(dateStr, "d/m/Y", true);
                              if (parsedDate.isValid()) {
                                const formattedDate = parsedDate.format("YYYY-MM-DD");

                                // Only update if the date is different from current
                                if (formattedDate !== dueDate) {
                                  setDueDate(formattedDate);
                                  formData.append("dueDate", formattedDate);
                                  newFormattedDate = formattedDate;
                                  shouldUpdate = true;

                                  // Update UI optimistically
                                  dispatch(
                                    updateTaskProperty({
                                      taskId: task?._id,
                                      property: "dueDate",
                                      value: formattedDate,
                                    })
                                  );
                                }
                              } else {
                                // Invalid date format, revert to current value
                                return;
                              }
                            }

                            // Only make API call if there's actually a change
                            if (shouldUpdate) {
                              const data = await fetchAuthFilePut(apiUrl, {
                                body: formData,
                              });

                              if (!data.status) {
                                throw new Error(
                                  data.message || "Failed to update due date"
                                );
                              }

                              // Success toast
                              const message = (!dateStr || dateStr.trim() === "")
                                ? "Due date cleared successfully"
                                : "Due date updated successfully";

                              toast.success(message, {
                                position: "bottom-right",
                                autoClose: 1500,
                                hideProgressBar: true,
                              });
                            }
                          } catch (error) {
                            console.error("Error updating due date:", error);
                            const message = (!dateStr || dateStr.trim() === "")
                              ? "Failed to clear due date"
                              : "Failed to update due date";

                            toast.error(message, {
                              position: "bottom-right",
                              autoClose: 2000,
                            });
                          }
                        };

                        handleDateUpdate();
                      },
                    }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Icon
                      icon="heroicons-outline:calendar"
                      className="w-5 h-5 text-gray-400 dark:text-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-[80px] flex items-center mb-1 mt-3 sm:mt-0 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Priority:
                </span>
              </div>
              <div
                className={`${isMobile ? "w-full" : "w-full sm:w-[120px]"
                  } relative mb-3 sm:mb-0`}
                ref={priorityDropdownRef}
              >
                <button
                  className="w-full rounded-md px-4 py-[10px] flex items-center justify-between overflow-hidden dark:bg-slate-800 dark:text-slate-200"
                  style={{
                    border: "1px solid #E1E1E1",
                    borderColor: "inherit",
                  }}
                  onClick={togglePriorityDropdown}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getPriorityColor(priority) }}
                    ></div>
                    <span className="text-sm  capitalize">{priority}</span>
                  </div>
                  <Icon
                    icon="heroicons-outline:chevron-down"
                    className={`text-slate-400 w-3.5 h-3.5 ml-[5rem] flex-shrink-0 mt-1 transition-transform duration-200 ${priorityDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {/* Priority Dropdown Menu */}
                {priorityDropdownOpen && (
                  <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg py-1">
                    {["High", "Medium", "Low"].map((priorityOption) => {
                      const color = getPriorityColor(priorityOption);
                      const isSelected =
                        priority.toLowerCase() === priorityOption.toLowerCase();

                      return (
                        <div
                          key={priorityOption}
                          className="px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600"
                          onClick={() => {
                            handlePriorityChange(priorityOption.toLowerCase());
                            setPriorityDropdownOpen(false);
                          }}
                        >
                          <div
                            className="flex items-center gap-2 rounded-full px-2 py-1"
                            style={{
                              backgroundColor: isSelected
                                ? `${color}15`
                                : "transparent",
                            }}
                          >
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-sm truncate dark:text-slate-200">
                              {priorityOption}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Allocated Hours:
                </span>
                <div className="flex items-center gap-1">
                  <AllocatedHours
                    task={task}
                    updateTaskDetails={updateAllocatedTime}
                  />
                  <span className="text-sm">Hours</span>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="flex items-center gap-2 flex-wrap">
              {filteredAttachments?.length > 0 && (
                <div className="flex items-center gap-2 ">
                  <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                    Attachments:
                  </span>

                  {/* <button className="w-[45px] h-[38px] flex items-center justify-center border-[1px] border-[#E1E1E1] dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Icon icon="mdi:pencil" className="text-slate-500" />
                </button> */}
                  {/* <FileUpload
                  taskId={task.taskId}
                  index={task.taskId}
                  from="taskpanel"
                  task={task}
                  isOpen={isOpen}
                  onClose={onClose}
                  totalAttachments={filteredAttachments?.length}
                /> */}
                </div>
              )}

              {filteredAttachments?.length > 0 &&
                filteredAttachments?.map((attachment, i) => (
                  <Tooltip
                    key={i}
                    animation="shift-away"
                    placement="top"
                    theme="custom-light"
                    content={
                      <div className="text-xs text-center">
                        <p className="font-medium">
                          {shortenFilename(attachment?.name)}
                        </p>
                        <p className="opacity-80">
                          {attachment?.type} •{" "}
                          {attachment?.name?.split(".").pop()?.toLowerCase()}
                        </p>
                      </div>
                    }
                  >
                    <div
                      className={`relative cursor-pointer border border-slate-300 dark:border-slate-600 rounded-lg flex items-center bg-white dark:bg-slate-700 shadow-sm hover:shadow-md transition group
              ${attachment?.type === "image"
                          ? "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          : attachment?.type === "document"
                            ? "hover:bg-sky-50 dark:hover:bg-sky-900/20"
                            : attachment?.type === "pdf"
                              ? "hover:bg-red-50 dark:hover:bg-red-900/20"
                              : attachment?.type === "video"
                                ? "hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                : ""
                        }`}
                      onClick={() => {
                        setAttachmentsForView(filteredAttachments);
                        handleAttachmentOpen(i);
                      }}
                    >
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachmentForDelete(attachment);
                          setShowAttachmentDeleteModal(true);
                        }}
                        className="absolute -top-2 -right-2 text-sm bg-red-600 rounded-full p-0.5  text-white sm:hidden sm:group-hover:block hover:scale-110"
                      // title="Delete"
                      >
                        <Icon icon="fe:close" className="w-4 h-4" />
                      </button>

                      <div className="p-1">
                        {attachment?.type === "image" && (
                          <img
                            src={attachment?.url}
                            alt=""
                            className="w-8 h-8 object-contain rounded-md "
                          />
                        )}
                        {attachment?.type === "document" && (
                          <img src={documentIcon} alt="" className="w-8 h-8" />
                        )}
                        {attachment?.type === "pdf" && (
                          <img src={pdfIcon} alt="" className="w-8 h-8" />
                        )}
                        {attachment?.type === "video" && (
                          <img src={videoIcon} alt="" className="w-8 h-8" />
                        )}
                      </div>
                    </div>
                  </Tooltip>
                ))}
            </div>

            {/* Subtasks Section */}
            <div id="subtasks-section" className="">
              <div className="">
                {
                  subtasks?.length > 0 &&
                  <div>
                    <h3 className="text-sm font-medium text-[#747474] dark:text-slate-300 py-2 border-b border-slate-200 dark:border-slate-800">Subtasks:</h3>
                    {/* Existing Subtasks */}
                    <div>
                      {subtasks?.map((subtask, index) => (
                        <div key={subtask._id || index} className="group flex items-center gap-1 md:gap-2 px-1 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 group">

                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggleSubtaskComplete(subtask._id, subtask.isComplete, subtask?.taskPosition)}
                            className="flex-shrink-0"
                          >
                            <Icon
                              icon={subtask?.taskPosition && subtask?.taskPosition.toLowerCase() === "completed" ? "heroicons:check-circle-solid" : "heroicons:check-circle"}
                              className={`w-4 h-4 md:w-5 md:h-5 ${subtask?.taskPosition && subtask?.taskPosition.toLowerCase() === "completed" ? 'text-green-500' : 'text-slate-400 dark:text-slate-500'}`}
                            />
                          </button>

                          {/* Subtask Name */}
                          <div className="flex-1 min-w-0">
                            {editingSubtaskId === subtask._id ? (
                              <div className="flex items-center gap-2">
                                <textarea
                                  ref={editSubtaskTextareaRef}
                                  className="px-2 py-0.5 text-xs font-medium text-black-800 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:outline-none resize-none overflow-hidden min-h-[24px] max-h-[200px] w-full"
                                  value={editingSubtaskName}
                                  onChange={(e) => {
                                    setEditingSubtaskName(e.target.value);

                                    // Auto-resize height
                                    if (editSubtaskTextareaRef.current) {
                                      editSubtaskTextareaRef.current.style.height = "auto";
                                      editSubtaskTextareaRef.current.style.height = `${editSubtaskTextareaRef.current.scrollHeight}px`;
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEditing();
                                    }
                                    if (e.key === 'Escape') {
                                      handleCancelEditing();
                                    }
                                  }}
                                  placeholder="Edit subtask..."
                                  rows={1}
                                />

                                {/* Save Button */}
                                <button
                                  onClick={handleSaveEditing}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Icon icon="heroicons:check" className="w-4 h-4" />
                                </button>

                                {/* Cancel Button */}
                                <button
                                  onClick={handleCancelEditing}
                                  className="text-slate-500 hover:text-slate-700"
                                >
                                  <Icon icon="heroicons:x-mark" className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div
                                className="flex items-center gap-1 md:gap-2 flex-1 cursor-pointer"
                                onClick={() => {
                                  // open task panel when clicking outside task name
                                  // Use taskId instead of _id to avoid temp IDs
                                  const taskIdToUse = subtask.taskId || subtask._id;
                                  const params = new URLSearchParams(location.search);
                                  params.set("taskId", taskIdToUse);
                                  navigate({ search: params.toString() });

                                  if (from === "task") {
                                    dispatch(setSelectedTask(subtask));
                                  } else {
                                    setTask(subtask)
                                  }
                                  dispatch(togglePanelVisibility(true));

                                  // Scroll the panel's content area
                                  setTimeout(() => {
                                    if (scrollableContentRef.current) {
                                      scrollableContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                  }, 100);
                                }}
                              >
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation(); // prevent triggering view panel
                                    handleStartEditing(subtask);
                                  }}
                                  className={`text-[11px] md:text-xs ${subtask.isComplete ? ' text-slate-500 dark:text-slate-400' : 'font-medium text-black-800 dark:text-slate-200'}  group-hover:bg-white  group-hover:outline group-hover:outline-1 group-hover:outline-slate-300 px-1 md:px-2 py-0.5 truncate`}
                                  style={{ cursor: 'text' }}
                                >
                                  {subtask.taskName}
                                </span>
                                {
                                  subtask?.subtask_count > 0 &&
                                  <Tooltip
                                    placement="top"
                                    theme="custom-light"
                                    content={`${subtask.subtask_count} ${subtask.subtask_count === 1 ? 'subtask' : 'subtasks'}`}
                                  >
                                    <span className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                                      <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold">{subtask?.subtask_count}</span>
                                      <Icon
                                        icon="cuida:subtask-outline"
                                        className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-500 dark:text-slate-400"
                                      />
                                    </span>
                                  </Tooltip>
                                }
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0 flex-nowrap">
                            {/* Due Date */}
                            <Tooltip
                              placement="top"
                              theme="custom-light"
                              content="Due Date"
                            >
                              <div className="cursor-pointer flex-shrink-0">
                                <Flatpickr
                                  value={subtask.dueDate ? new Date(subtask.dueDate) : null}
                                  onChange={([selectedDate]) => {
                                    if (selectedDate) {
                                      handleSubtaskDueDateChange(subtask._id, selectedDate);
                                    }
                                  }}
                                  options={{
                                    dateFormat: "Y-m-d",
                                    allowInput: true,
                                    disableMobile: true
                                  }}
                                  render={({ value, ...props }, ref) => {
                                    const past = isPast(subtask.dueDate);
                                    return (
                                      <button
                                        type="button"
                                        ref={ref}
                                        className={`${subtask?.dueDate
                                          ? ""
                                          : "h-6 w-6 flex items-center justify-center border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 rounded-full flex-shrink-0"
                                          }`}
                                      >
                                        {!subtask?.dueDate && (
                                          <Icon
                                            icon="heroicons-outline:calendar"
                                            className={`w-3.5 h-3.5 flex-shrink-0 ${past ? "text-red-500" : "text-gray-400"}`}
                                          />
                                        )}
                                        {subtask.dueDate && (
                                          <span
                                            className={`mr-0 md:mr-1 text-[10px] md:text-xs font-medium whitespace-nowrap flex-shrink-0 ${past ? "text-red-500" : "text-gray-500"
                                              }`}
                                          >
                                            {formatSubtaskDueDate(subtask.dueDate)}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  }}
                                />
                              </div>
                            </Tooltip>
                            {/* Assign users */}
                            <div className="cursor-pointer flex-shrink-0">
                              <UserMultiSelect
                                task={{
                                  ...subtask,
                                  assigned_users: subtask?.assigned_users,
                                }}
                                users={projectMembers}
                                index={subtask?._id}
                                updateExistingTask={async (updatedTask, property) => {
                                  if (property !== "assigned_users") return;

                                  try {
                                    // First update in Redux state immediately
                                    dispatch(
                                      updateTaskProperty({
                                        taskId: subtask?._id,
                                        property: "assigned_users",
                                        value: updatedTask.assigned_users,
                                      })
                                    );

                                    // Also sync with parent/local task if the open panel is for this subtask
                                    updateTaskFieldsLocal(
                                      subtask._id,
                                      "assigned_users",
                                      updatedTask.assigned_users
                                    );

                                    // Make API request
                                    const BaseUrl = import.meta.env.VITE_APP_DJANGO;
                                    const apiUrl = `${BaseUrl}/task/${subtask._id}/${userInfo._id}/`;

                                    // Use fetchAuthPut for JSON data to handle empty arrays correctly
                                    const response = await fetchAuthPut(apiUrl, {
                                      body: {
                                        assigned_users:
                                          updatedTask.assigned_users || [],
                                      },
                                    });

                                    if (!response.status) {
                                      throw new Error(
                                        response.message ||
                                        "Failed to update assignees"
                                      );
                                    }
                                  } catch (error) {
                                    console.error("Error updating assignees:", error);
                                    toast.error("Failed to update assignees", {
                                      position: "bottom-right",
                                      autoClose: 2000,
                                    });
                                  }
                                }}
                                isCompleted={subtask?.taskPosition === "completed"}
                                initiallyOpen={false}
                                from="subtask"
                              />
                            </div>
                            {/* Open panel */}
                            <Tooltip
                              placement="top"
                              theme="custom-light"
                              content="View Task"
                            >
                              <button
                                onClick={() => {
                                  // Open task panel for this subtask
                                  // Use taskId instead of _id to avoid temp IDs
                                  const taskIdToUse = subtask.taskId || subtask._id;
                                  const params = new URLSearchParams(location.search);
                                  params.set("taskId", taskIdToUse);
                                  navigate({ search: params.toString() });

                                  // Dispatch action to open task panel with subtask data
                                  if (from === "task") {
                                    dispatch(setSelectedTask(subtask));
                                  } else {
                                    setTask(subtask)
                                  }
                                  dispatch(togglePanelVisibility(true));

                                  // Scroll the panel's content area
                                  setTimeout(() => {
                                    if (scrollableContentRef.current) {
                                      scrollableContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                  }, 100);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              >
                                <Icon icon="heroicons:chevron-right-20-solid" className="w-5 h-5 flex-shrink-0" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                }

                {/* New Subtask Input Row */}
                {isAddingSubtask && (
                  <div className="flex items-center gap-1 md:gap-2 py-1 border-b border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/20 px-1 group rounded-md">

                    {/* Checkbox Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <Icon icon="heroicons:check-circle" className="w-4 h-4 md:w-5 md:h-5 text-slate-400 dark:text-slate-500" />
                    </div>

                    {/* Textarea & Buttons */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <textarea
                          ref={addSubtaskTextareaRef}
                          className="px-2 py-0.5 text-xs font-medium text-black-800 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200  focus:outline-none resize-none overflow-hidden min-h-[24px] max-h-[200px] w-full"
                          value={newSubtaskName}
                          onChange={(e) => {
                            setNewSubtaskName(e.target.value);

                            // Auto-resize height
                            if (addSubtaskTextareaRef.current) {
                              addSubtaskTextareaRef.current.style.height = "auto";
                              addSubtaskTextareaRef.current.style.height = `${addSubtaskTextareaRef.current.scrollHeight}px`;
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddSubtask();
                            }
                            if (e.key === 'Escape') {
                              setIsAddingSubtask(false);
                              setNewSubtaskName("");
                            }
                          }}
                          placeholder="Add a subtask..."
                          rows={1}
                          autoFocus
                        />

                        {/* Save Button */}
                        <button
                          onClick={handleAddSubtask}
                          className="text-green-600 hover:text-green-700"
                          title="Save subtask"
                        >
                          <Icon icon="heroicons:check" className="w-4 h-4" />
                        </button>

                        {/* Cancel Button */}
                        <button
                          onClick={() => {
                            setIsAddingSubtask(false);
                            setNewSubtaskName("");
                          }}
                          className="text-slate-500 hover:text-slate-700"
                          title="Cancel"
                        >
                          <Icon icon="heroicons:x-mark" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}



              </div>

              <div className="flex items-center gap-2 my-2">
                <button
                  className="px-2 py-1 text-xs border border-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => setIsAddingSubtask(true)}
                >
                  <Icon icon="heroicons-outline:plus" className="w-4 h-4" />
                  <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold">Add subtask</span>
                </button>
              </div>

            </div>

            {showAttachmentDeleteModal && attachmentForDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
                <div className="relative max-w-md w-full mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden transform transition-all border dark:border-slate-700">
                  <div className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <Icon
                          icon="mingcute:delete-2-fill"
                          className="h-6 w-6 text-red-600 dark:text-red-400"
                        />
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-4">
                      Delete Attachment
                    </h3>

                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                      Are you sure you want to delete this Attachment?
                    </p>

                    <div className="flex justify-center space-x-3">
                      <Button
                        text="Cancel"
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-md transition-colors"
                        onClick={() => setShowAttachmentDeleteModal(false)}
                      />

                      <Button
                        text="Delete"
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                        onClick={() =>
                          handleDeleteAttachment(attachmentForDelete)
                        }
                        isLoading={isAttachmentDeleting}
                        icon="mingcute:delete-2-fill"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Task Description and Comments - Using our new component */}
            {task && task._id && (
              <TaskDescriptionComments
                key={task._id}
                task={task}
                users={users}
                updateTaskCommentCount={updateCommentCount}
                updateTaskFields={updateTaskFieldsLocal}
                taskAttachments={taskAttachments}
                setAttachmentForDelete={setAttachmentForDelete}
                setShowAttachmentDeleteModal={setShowAttachmentDeleteModal}
                commentChat={commentChat}
                setCommentChat={setCommentChat}
                handleAttachmentOpen={handleAttachmentOpen}
                setAttachmentsForView={setAttachmentsForView}
                activeTab={activeTab} // Pass the activeTab from parent
                activeTabIndex={activeTabIndex}
                setActiveTabIndex={setActiveTabIndex}
                isExpand={isExpand}
                from={from}
              />
            )}
          </div>
        </div>

        {/* Updated Collaborators section - fixed position above the footer */}
        <div className="mt-auto">
          <div className="px-4 py-2 relative z-10 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mr-4">
                Collaborators:
              </span>
              <div className="flex-1 collaborators-container ">
                <Collaborators
                  employees={users}
                  onSelectionChange={handleCollaboratorChange}
                  className="w-full text-f13"
                  task={task}
                />
                {collaboratorLoading && (
                  <div className="ml-2 flex items-center absolute right-0 top-1/2 transform -translate-y-1/2">
                    <Icon
                      icon="eos-icons:loading"
                      className="animate-spin text-primary-500 w-5 h-5"
                    />
                    <span className="text-xs ml-1 text-gray-500 dark:text-slate-400">
                      Updating...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add styles to ensure the dropdown works properly */}
      <style jsx>{`
        .collaborators-container {
          position: relative;
          min-height: 40px;
        }

        :global(.select__menu) {
          z-index: 1000 !important;
          position: fixed !important;
          top: auto !important;
        }

        :global(.select__menu-list) {
          max-height: 200px !important;
        }

        :global(.select__control) {
          min-height: 38px !important;
          border-radius: 0.375rem !important;
        }

        .like-animate {
          animation: like-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes like-pop {
          0% { transform: scale(1); }
          30% { transform: scale(1.3) rotate(-8deg); }
          50% { transform: scale(0.95) rotate(4deg); }
          70% { transform: scale(1.1) rotate(-2deg); }
          100% { transform: scale(1) rotate(0); }
        
        /* Mobile optimization for flatpickr */
        :global(.mobile-date-input) {
          font-size: 16px !important; /* Prevents iOS zoom on focus */
          height: 42px !important;
          min-width: 100% !important;
          padding-right: 40px !important; /* Space for the calendar icon */
          box-sizing: border-box !important;
        }
        
        :global(.flatpickr-mobile) {
          font-size: 16px !important;
          min-width: 100% !important;
        }
      `}</style>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        taskId={task?._id}
        taskName={task?.taskName}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-3 max-w-[240px] w-full flex flex-col items-center border border-gray-300 dark:border-slate-700">
            {/* Warning Icon */}
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-1">
              <Icon
                icon="heroicons-outline:exclamation"
                className="text-red-500 dark:text-red-400 w-4 h-4"
              />
            </div>
            <h3 className="text-sm font-medium text-center dark:text-slate-200">
              Delete Task
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>
            <div className="flex w-full gap-2">
              <button
                type="button"
                className="flex-1 rounded-md px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 font-medium shadow-sm hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed border border-gray-300 dark:border-slate-600"
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-md px-2 py-1 text-xs bg-red-600 text-white font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed border border-red-700"
                onClick={deleteTask}
                disabled={isDeleting}
              >
                {isDeleting ? <span>Deleting...</span> : <span>Delete</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPanel;