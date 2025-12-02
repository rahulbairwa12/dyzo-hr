import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import moment from "moment";
import confetti from "canvas-confetti";
import {
  updateTaskInSection,
  deleteTaskFromSection,
  toggleTaskPanel,
  setSelectedTask,
  updateTaskLocally,
  updateTaskSubtaskCount,
  updateTaskCommentCount,
  fetchSectionTaskAttachments,
  deleteSectionTaskAttachment,
  changeTaskSection,
  selectAllSections,
  removeTemporaryTask,
} from "../store/sectionTaskSlice";
import { fetchUsers } from "@/store/usersSlice";
import Button from "@/components/ui/Button";

import TaskDescriptionComments from "@/features/tasks/components/TaskDescriptionComments";
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
import AttachmentViewer from "@/components/Task/AttachmentViewer";

import { debounce, result } from "lodash";
import {
  fetchAuthPut,
  fetchAuthFilePut,
  fetchAuthPost,
  fetchAuthPatch,
  fetchAuthGET,
} from "@/store/api/apiSlice";

import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import UserMultiSelect from "@/components/dropdowns/UserMultiSelect";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { ProfilePicture } from "@/components/ui/profilePicture";
import ModernTooltip from "@/components/ui/ModernTooltip";
import AllocatedHours from "@/components/Task/AllocatedHours";

// Tooltip wrapper for disabled controls
const DisabledTooltip = ({ disabled, content, children }) => {
  if (!disabled) return children;
  return (
    <ModernTooltip
      content={content || "Viewer permissions - Editing disabled"}
      placement="top"
      theme="custom-light"
      animation="scale-subtle"
      interactive={false}
    >
      <div className="pointer-events-none">{children}</div>
    </ModernTooltip>
  );
};

const SectionTaskPanel = ({
  task,
  isOpen,
  onClose,
  projects,
  from = "section-task",
  projectMembers = [],
  projectStatus = [],
  canCreateTasks = true,
}) => {


  const dispatch = useDispatch();
  const { users, loading: loadingUsers } = useSelector((state) => state.users);
  const { user: userInfo } = useSelector((state) => state.auth);
  const sections = useSelector(selectAllSections);
  // Get filters from Redux state to check if task still matches after updates
  const currentFilters = useSelector((state) => state.sectionTasks.filters);
  const [taskStatuses, setTaskStatuses] = useState(
    projectStatus && projectStatus.length > 0
      ? projectStatus.map(status => ({
        id: status.id || status.value || Math.random().toString(36),
        name: status.label || status.name,
        color: status.color,
        value: status.value,
      }))
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
      ]
  );

  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const [activeTab, setActiveTab] = useState("");
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

  // Section select state
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const sectionDropdownRef = useRef(null);
  const [currentSectionId, setCurrentSectionId] = useState(task?.sectionId || task?.section_id || task?.section);
  const [sectionSearchTerm, setSectionSearchTerm] = useState("");
  const [highlightedSectionIndex, setHighlightedSectionIndex] = useState(-1);
  const sectionSearchInputRef = useRef(null);
  const sectionDropdownItemsRef = useRef([]);
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

  // Update taskStatuses when projectStatus prop changes
  useEffect(() => {
    if (projectStatus && projectStatus.length > 0) {
      const updatedStatuses = projectStatus.map(status => ({
        id: status.id || status.value || Math.random().toString(36),
        name: status.label || status.name,
        color: status.color,
        value: status.value,
      }));
      setTaskStatuses(updatedStatuses);
    }
  }, [projectStatus]);
  const [activeJourneyTab, setActiveJourneyTab] = useState("all");
  const [taskJourney, setTaskJourney] = useState([]);
  const [isAttachmentDeleting, setIsAttachmentDeleting] = useState(false);
  const [showAttachmentDeleteModal, setShowAttachmentDeleteModal] = useState(false);
  const [attachmentForDelete, setAttachmentForDelete] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [isAddProject, setIsAddProject] = useState(false);

  // Add missing state variables for attachments
  const [taskAttachments, setTaskAttachments] = useState(task?.attachments || []);

  // Get filtered attachments from Redux state
  const sectionTaskAttachments = useSelector((state) => state.sectionTasks.taskAttachments);
  const filteredAttachments = sectionTaskAttachments?.filter(
    (att) => att.folder === "attachments"
  );

  // Attachment viewer state
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const [attachmentsForView, setAttachmentsForView] = useState([]);

  // Expand Task Panel
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const isFocusedParam = params.get("isFocused") === "true";
  const [isExpand, setIsExpand] = useState(isFocusedParam);

  // Tabs
  const [activeTabIndex, setActiveTabIndex] = useState(() => {
    // Fallback to activeTab logic
    const fallbackIndex = (() => {
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
    })();

    return fallbackIndex;
  });

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

    ws.onopen = () => 
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

  // Check for stored tab index when component mounts or task changes
  useEffect(() => {
    const storedTabIndex = sessionStorage.getItem('sectionTaskActiveTabIndex');
    const shouldScrollToSubtasks = sessionStorage.getItem('scrollToSubtasks');

    if (storedTabIndex !== null) {
      const index = parseInt(storedTabIndex);
      sessionStorage.removeItem('sectionTaskActiveTabIndex'); // Clear after reading

      // Add a small delay to ensure the component is fully rendered
      setTimeout(() => {
        setActiveTabIndex(index);
      }, 100);
    } else if (shouldScrollToSubtasks === 'true') {
      sessionStorage.removeItem('scrollToSubtasks'); // Clear after reading

      // Scroll to subtasks section
      setTimeout(() => {
        const subtasksSection = document.getElementById('subtasks-section');
        if (subtasksSection) {
          subtasksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Add temporary highlighting
          subtasksSection.style.backgroundColor = '#E8E5F9';
          setTimeout(() => {
            subtasksSection.style.backgroundColor = '';
          }, 2000);
        }
      }, 300);
    }
  }, [task?._id]); // Only run when task changes

  // Clear persisted state when task is deleted or no longer exists
  useEffect(() => {
    return () => {
      // Only clear if this is the last task panel being unmounted
      // and we're not navigating to another task
      const currentPath = window.location.pathname;
      const isStillInSectionTasks = currentPath.includes('/section-tasks') || currentPath.includes('/section-task');

      if (!isStillInSectionTasks) {
        // Clear persisted state when leaving section tasks entirely
        localStorage.removeItem('sectionTaskPanelState');
      }
    };
  }, []);

  const [seenBy, setSeenBy] = useState([]);



  // Create a ref to store the debounced function instance
  const debouncedFnRef = useRef(null);

  const [likedBy, setLikedBy] = useState(task?.liked_by || []);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeAnimate, setLikeAnimate] = useState(false);

  // Subtasks
  const [subtasks, setSubtasks] = useState([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskName, setEditingSubtaskName] = useState("");

  // Local state for assigned users
  const [assignedUsers, setAssignedUsers] = useState(task?.assigned_users || []);

  // Local state for collaborators
  const [collaborators, setCollaborators] = useState(task?.collaborators || []);

  // Flag to prevent double API calls when both onChange and onClose are triggered
  const isDateUpdatingRef = useRef(false);

  // Add this ref near the top of the component
  const scrollableContentRef = useRef(null);

  useEffect(() => {
    document.title = `${task?.taskName} - Section Task`;


    // optional cleanup
    return () => {
      document.title = "Dyzo"; // default title when component unmounts
    };
  }, [task?.taskName, task?._id]);

  //Expand Task Panel
  useEffect(() => {
    setIsExpand(isFocusedParam);
  }, [isFocusedParam]);

  // Add cleanup for debounced function on unmount or when dependencies change
  useEffect(() => {
    // Create a new debounced function for section tasks
    debouncedFnRef.current = debounce(async (newName) => {
      try {


        // Ensure we're using the correct task ID format
        const taskIdToUpdate = task._id || task.taskId;

        if (!taskIdToUpdate) {
          toast.error("Task ID not found", {
            position: "bottom-right",
            autoClose: 2000,
          });
          return;
        }

        const result = await dispatch(
          updateTaskInSection({
            taskId: Number(taskIdToUpdate), // Ensure it's a number
            updates: { taskName: newName },
            forceUpdate: true
          })
        ).unwrap();

       
      } catch (error) {
        console.error("Error updating task name:", error);
        toast.error("Failed to update task name: " + (error.message || "Unknown error"), {
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
  }, [task?._id, task?.taskId, dispatch]);

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

  // Track if we're currently editing to prevent state overwrites
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(false);

  // Update local state when task changes (but not during active editing)
  useEffect(() => {
    if (task && !isEditingRef.current) {
      setTaskName(task?.taskName || "");
      setSeenBy(task?.seen_by || []);
      setAssignedUsers(task?.assigned_users || []);
      setCollaborators(task?.collaborators || []);
      setCurrentSectionId(task?.sectionId || task?.section_id || task?.section);

      try {
        if (task.dueDate) {
          const date = parseISO(task.dueDate);
          setDueDate(format(date, "yyyy-MM-dd"));
        } else {
          setDueDate("");
        }
      } catch (error) {
        console.error("Error parsing date:", error);
        setDueDate("");
      }

      setTaskPosition(task.taskPosition || "Pending");
      setPriority(task.priority || "Medium");
    }
  }, [task?._id, task?.taskName, task?.dueDate, task?.taskPosition, task?.priority, task?.assigned_users, task?.collaborators, task?.section_id, task?.section]);

  // Reset editing flag and immediately sync local state when task changes (switching between tasks)
  useEffect(() => {
    isEditingRef.current = false;
    setIsEditing(false);

    // Immediately sync local UI state to the newly selected task
    setTaskName(task?.taskName || "");
    setSeenBy(task?.seen_by || []);
    setAssignedUsers(task?.assigned_users || []);
    setCollaborators(task?.collaborators || []);
    setCurrentSectionId(task?.sectionId || task?.section_id || task?.section);
    try {
      if (task?.dueDate) {
        const date = parseISO(task.dueDate);
        setDueDate(format(date, "yyyy-MM-dd"));
      } else {
        setDueDate("");
      }
    } catch (error) {
      console.error("Error parsing date:", error);
      setDueDate("");
    }
    setTaskPosition(task?.taskPosition || "Pending");
    setPriority(task?.priority || "Medium");
  }, [task?._id]);

  // Reset editing flag after a delay for same task updates
  useEffect(() => {
    if (task && isEditingRef.current) {
      const timer = setTimeout(() => {
        isEditingRef.current = false;
        setIsEditing(false);
      }, 1000); // Give API calls time to complete

      return () => clearTimeout(timer);
    }
  }, [task?.taskName, task?.dueDate, task?.taskPosition, task?.priority, task?.assigned_users, task?.collaborators, task?.section_id, task?.section]);

  // get sub tasks
  useEffect(() => {
    if (task?._id) {
      getSubtasks(task?._id);
    }
  }, [task?._id]);

  // Effect to scroll to subtasks section when activeTabIndex is 2 (subtasks tab)
  useEffect(() => {
    if (activeTabIndex === 2 && isOpen) {
      // Small delay to ensure the panel is fully rendered
      setTimeout(() => {
        const subtasksSection = document.getElementById("subtasks-section");
        if (subtasksSection) {
          // Scroll to the subtasks section
          subtasksSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          // Add highlight effect
          subtasksSection.style.backgroundColor = "#E8E5F9"; // Light yellow background
          subtasksSection.style.transition = "background-color 0.3s ease";

          // Remove highlight after 2 seconds
          setTimeout(() => {
            subtasksSection.style.backgroundColor = "";
          }, 2000);
        }
      }, 100);
    }
  }, [activeTabIndex, isOpen]);

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
  }, [editingSubtaskName]);;

  // Fetch task attachments
  useEffect(() => {
    if (task?.taskId && task.taskId !== "-") {
      dispatch(fetchSectionTaskAttachments(task.taskId));
    }
  }, [dispatch, task?.taskId]);

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
      if (event.target.closest(".tf-mention-item")) {
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

      // Prevent closing when clicking on SVG icons
      if (
        event.target.tagName === "svg" ||
        event.target.closest("svg") ||
        event.target.classList.contains("iconify") ||
        event.target.closest(".iconify")
      ) {
        return;
      }

      // Prevent closing when clicking on user name spans
      if (
        event.target.tagName === "SPAN" &&
        event.target.classList.contains("text-xs") &&
        event.target.classList.contains("font-medium")
      ) {
        return;
      }

      // Prevent closing when clicking on user-related elements
      if (
        event.target.closest(".user-name") ||
        event.target.closest(".user-info") ||
        event.target.closest(".assignee-info")
      ) {
        return;
      }

      // Prevent closing when clicking on "Clear all" button
      if (
        event.target.tagName === "BUTTON" &&
        event.target.classList.contains("p-0.5") &&
        event.target.classList.contains("mr-1") &&
        event.target.classList.contains("text-xs") &&
        event.target.classList.contains("text-red-500") &&
        event.target.classList.contains("hover:underline")
      ) {
        return;
      }

      // Prevent closing when clicking on any clear/reset buttons
      if (
        event.target.textContent?.toLowerCase().includes("clear") ||
        event.target.textContent?.toLowerCase().includes("reset") ||
        event.target.closest("button[class*='clear']") ||
        event.target.closest("button[class*='reset']")
      ) {
        return;
      }

      // Prevent closing when clicking on "Invite User" button
      if (
        event.target.tagName === "BUTTON" &&
        event.target.classList.contains("w-full") &&
        event.target.classList.contains("flex") &&
        event.target.classList.contains("items-center") &&
        event.target.classList.contains("gap-2") &&
        event.target.classList.contains("py-2.5") &&
        event.target.classList.contains("text-blue-800") &&
        event.target.classList.contains("hover:underline") &&
        event.target.classList.contains("text-xs")
      ) {
        return;
      }

      // Prevent closing when clicking on invite-related buttons
      if (
        event.target.textContent?.toLowerCase().includes("invite") ||
        event.target.textContent?.toLowerCase().includes("add user") ||
        event.target.textContent?.toLowerCase().includes("add member") ||
        event.target.closest("button[class*='invite']") ||
        event.target.closest("button[class*='add-user']") ||
        event.target.closest("button[class*='add-member']")
      ) {
        return;
      }

      if (panelRef.current && !panelRef.current.contains(event.target)) {
        if (from === "inbox") return;
        dispatch(toggleTaskPanel(false));
        onClose();
      }

      // Close status dropdown when clicking outside
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
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
  }, [onClose, isAddProject, isAttachmentViewerOpen, dispatch]);

  // Update Seen By
  const hasMarkedAsSeen = useRef(false);

  useEffect(() => {
    if (isOpen && task?.taskId && userInfo?._id && !hasMarkedAsSeen.current) {
      const userId = userInfo._id;
      const alreadySeen = task?.seen_by?.includes(userId);

      if (!alreadySeen) {
        hasMarkedAsSeen.current = true;

        const markTaskAsSeen = async () => {
          try {
            const currentSeenBy = Array.from(
              new Set([...(task.seen_by || []), userId])
            );

            // Update locally first
            dispatch(updateTaskLocally({
              taskId: task._id,
              updates: { seen_by: currentSeenBy }
            }));

            // Then update via API
            dispatch(updateTaskInSection({
              taskId: task._id,
              updates: { seen_by: currentSeenBy }
            }));

            setSeenBy(currentSeenBy);
          } catch (error) {
            console.error("Error marking task as seen:", error);
          }
        };

        markTaskAsSeen();
      }
    }
  }, [isOpen, task?.taskId, userInfo?._id, dispatch]);

  // Reset hasMarkedAsSeen when task changes or panel closes
  useEffect(() => {
    if (!isOpen || !task?.taskId) {
      hasMarkedAsSeen.current = false;
    }
  }, [isOpen, task?.taskId]);

  const seenUsers = users && users.filter((user) => seenBy.includes(user._id));

  // Get status color and icon from taskStatuses array
  const getStatusColorAndIcon = (statusValue) => {

    if (!statusValue)

      return {
        bg: "bg-gray-100",
        styles: { borderColor: "#BCBCBC", color: "#666666" },
        dotStyle: { backgroundColor: "#BCBCBC" },
        hexColor: "#BCBCBC",
      };

    const normalizedStatusValue = statusValue.toLowerCase().replace(/ /g, "_");

    const availableStatuses = taskStatuses?.length > 0 ? taskStatuses : [
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

    let statusObj = availableStatuses.find(
      (s) =>
        s.name === statusValue ||
        s.name.toLowerCase() === statusValue?.toLowerCase() ||
        s.value === normalizedStatusValue
    );

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
          backgroundColor: `${statusObj.color}20`,
        },
        dotStyle: {
          backgroundColor: statusObj.color,
        },
        hexColor: statusObj.color,
      };
    }

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

  // Helper to get filtered statuses based on search term
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

  // Helper to get filtered sections based on search term
  const getFilteredSections = () => {
    const availableSections = sections || [];
    if (!sectionSearchTerm.trim()) return availableSections;
    return availableSections.filter((section) =>
      section.name.toLowerCase().includes(sectionSearchTerm.toLowerCase())
    );
  };

  // Toggle status dropdown
  const toggleStatusDropdown = (e) => {
    e.preventDefault();
    const newOpen = !statusDropdownOpen;
    setStatusDropdownOpen(newOpen);
    setHighlightedStatusIndex(-1);
    setStatusSearchTerm("");
  };

  // Keyboard navigation for dropdown
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!statusDropdownOpen) return;

      const filteredStatuses = getFilteredStatuses();

      // When search is focused
      if (document.activeElement === statusSearchInputRef.current) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            setHighlightedStatusIndex((prev) =>
              prev < filteredStatuses.length - 1 ? prev + 1 : 0
            );
            break;
          case "ArrowUp":
            event.preventDefault();
            setHighlightedStatusIndex((prev) =>
              prev > 0 ? prev - 1 : filteredStatuses.length - 1
            );
            break;
          case "Enter":
            event.preventDefault();
            if (
              highlightedStatusIndex >= 0 &&
              highlightedStatusIndex < filteredStatuses.length
            ) {
              handleStatusChange(filteredStatuses[highlightedStatusIndex].name);
            }
            break;
          case "Escape":
            event.preventDefault();
            setStatusDropdownOpen(false);
            setHighlightedStatusIndex(-1);
            setStatusSearchTerm("");
            break;
        }
        return;
      }

      // When search is not focused
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedStatusIndex((prev) =>
            prev < filteredStatuses.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedStatusIndex((prev) =>
            prev > 0 ? prev - 1 : filteredStatuses.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (
            highlightedStatusIndex >= 0 &&
            highlightedStatusIndex < filteredStatuses.length
          ) {
            handleStatusChange(filteredStatuses[highlightedStatusIndex].name);
          }
          break;
        case "Escape":
          event.preventDefault();
          setStatusDropdownOpen(false);
          setHighlightedStatusIndex(-1);
          setStatusSearchTerm("");
          break;
        default:
          if (event.key.length === 1 && statusSearchInputRef.current) {
            statusSearchInputRef.current.focus();
          }
          break;
      }
    };

    if (statusDropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [statusDropdownOpen, highlightedStatusIndex, statusSearchTerm, taskStatuses]);

  // Keyboard navigation for section dropdown
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!sectionDropdownOpen) return;

      const filteredSections = getFilteredSections();

      // When search is focused
      if (document.activeElement === sectionSearchInputRef.current) {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            setHighlightedSectionIndex((prev) =>
              prev < filteredSections.length - 1 ? prev + 1 : 0
            );
            break;
          case "ArrowUp":
            event.preventDefault();
            setHighlightedSectionIndex((prev) =>
              prev > 0 ? prev - 1 : filteredSections.length - 1
            );
            break;
          case "Enter":
            event.preventDefault();
            if (
              highlightedSectionIndex >= 0 &&
              highlightedSectionIndex < filteredSections.length
            ) {
              handleSectionChange(filteredSections[highlightedSectionIndex].id);
            }
            break;
          case "Escape":
            event.preventDefault();
            setSectionDropdownOpen(false);
            setHighlightedSectionIndex(-1);
            setSectionSearchTerm("");
            break;
        }
        return;
      }

      // When search is not focused
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedSectionIndex((prev) =>
            prev < filteredSections.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedSectionIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSections.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (
            highlightedSectionIndex >= 0 &&
            highlightedSectionIndex < filteredSections.length
          ) {
            handleSectionChange(filteredSections[highlightedSectionIndex].id);
          }
          break;
        case "Escape":
          event.preventDefault();
          setSectionDropdownOpen(false);
          setHighlightedSectionIndex(-1);
          setSectionSearchTerm("");
          break;
        default:
          if (event.key.length === 1 && sectionSearchInputRef.current) {
            sectionSearchInputRef.current.focus();
          }
          break;
      }
    };

    if (sectionDropdownOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sectionDropdownOpen, highlightedSectionIndex, sectionSearchTerm, sections]);

  // Focus search input when dropdown opens and auto-highlight first
  useEffect(() => {
    if (statusDropdownOpen && statusSearchInputRef.current) {
      setTimeout(() => statusSearchInputRef.current?.focus(), 100);
      setHighlightedStatusIndex(0);
    }
  }, [statusDropdownOpen]);

  // Focus section search input when dropdown opens and auto-highlight first
  useEffect(() => {
    if (sectionDropdownOpen && sectionSearchInputRef.current) {
      setTimeout(() => sectionSearchInputRef.current?.focus(), 100);
      setHighlightedSectionIndex(0);
    }
  }, [sectionDropdownOpen]);

  // Auto-highlight first option when search results change
  useEffect(() => {
    if (statusDropdownOpen) {
      const filtered = getFilteredStatuses();
      setHighlightedStatusIndex(filtered.length > 0 ? 0 : -1);
    }
  }, [statusSearchTerm, taskStatuses, statusDropdownOpen]);

  // Auto-highlight first section when search results change
  useEffect(() => {
    if (sectionDropdownOpen) {
      const filtered = getFilteredSections();
      setHighlightedSectionIndex(filtered.length > 0 ? 0 : -1);
    }
  }, [sectionSearchTerm, sections, sectionDropdownOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (statusDropdownOpen && highlightedStatusIndex >= 0) {
      const el = statusDropdownItemsRef.current[highlightedStatusIndex];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [highlightedStatusIndex, statusDropdownOpen]);

  // Scroll highlighted section into view
  useEffect(() => {
    if (sectionDropdownOpen && highlightedSectionIndex >= 0) {
      const el = sectionDropdownItemsRef.current[highlightedSectionIndex];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [highlightedSectionIndex, sectionDropdownOpen]);

  // Get style for current status
  const currentStatusStyle = getStatusColorAndIcon(taskPosition);

  // Update handleTaskNameChange for section tasks
  const handleTaskNameChange = (e) => {
    const newName = e.target.value;
    setTaskName(newName);

    // Set editing flag to prevent state override
    isEditingRef.current = true;
    setIsEditing(true);

    // Update UI optimistically
    dispatch(updateTaskLocally({
      taskId: task._id,
      updates: { taskName: newName }
    }));

    // Cancel any previous pending debounced calls
    if (debouncedFnRef.current?.cancel) {
      debouncedFnRef.current.cancel();
    }

    // Call the debounced API update function
    debouncedFnRef.current(newName);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
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

  // Update the handleMarkComplete function for section tasks
  const handleMarkComplete = async () => {
    const isCurrentlyCompleted = isTaskCompleted();

    const completedStatus = taskStatuses.find(
      (s) => s.name.toLowerCase() === "completed"
    );
    const pendingStatus =
      taskStatuses.find((s) => s.name.toLowerCase() === "pending") ||
      taskStatuses.find((s) => s.value === "pending");

    const newPositionName = isCurrentlyCompleted
      ? pendingStatus?.name || "Pending"
      : "Completed";
    const newPositionValue = isCurrentlyCompleted
      ? pendingStatus?.value || "pending"
      : completedStatus?.value || "completed";

    // Set editing flag to prevent state override
    isEditingRef.current = true;
    setIsEditing(true);

    // Update UI optimistically
    setTaskPosition(newPositionName);

    // Prepare updates with both taskPosition and isComplete
    const updates = {
      taskPosition: newPositionValue,
      isComplete: !isCurrentlyCompleted
    };

    dispatch(updateTaskLocally({
      taskId: task._id,
      updates
    }));

    // Trigger confetti effect only when marking as completed
    if (!isCurrentlyCompleted) {
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.3 },
        colors: ["#0F6FFF", "#A026FF", "#6d42f8", "#9333ea", "#2DE072"],
        disableForReducedMotion: true,
      });
    }

    try {
      await dispatch(updateTaskInSection({
        taskId: task._id,
        updates: {
          taskPosition: newPositionValue,
          isComplete: !isCurrentlyCompleted
        },
        forceUpdate: true
      })).unwrap();

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

          // If task doesn't match filter anymore, remove it from view and close panel
          if (!matchesFilter && currentSectionId) {
            dispatch(removeTemporaryTask({
              sectionId: currentSectionId,
              taskId: task._id
            }));
            
            // Close the panel since the task is no longer visible
          //  dispatch(toggleTaskPanel(false));
           // dispatch(setSelectedTask(null));
           // onClose();
          }
        }, 100); // Small delay to ensure Redux state is updated
      });
    } catch (error) {
      console.error("Error updating task status:", error);
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

  // Update handlePriorityChange for section tasks
  const handlePriorityChange = async (value) => {
    // Set editing flag to prevent state override
    isEditingRef.current = true;
    setIsEditing(true);

    setPriority(value);

    dispatch(updateTaskLocally({
      taskId: task._id,
      updates: { priority: value }
    }));

    try {
      await dispatch(updateTaskInSection({
        taskId: task._id,
        updates: { priority: value },
        forceUpdate: true
      })).unwrap();
    } catch (error) {
      console.error("Error updating task priority:", error);
      toast.error("Failed to update task priority", {
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

    // Set editing flag to prevent state override
    isEditingRef.current = true;
    setIsEditing(true);

    const oldSectionId = currentSectionId;

    // Update UI optimistically
    setCurrentSectionId(newSectionId);
    setSectionDropdownOpen(false);

    try {
      await dispatch(
        changeTaskSection({
          taskId: task._id,
          newSectionId: newSectionId,
          oldSectionId: oldSectionId,
        })
      ).unwrap();

      const newSectionName = sections?.find(s => s.id === newSectionId)?.name || "new section";
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

  // Helper function to check if task matches current filters
  const taskMatchesFilters = useCallback((updatedTaskPosition) => {
    // If no status filter is applied, task always matches
    if (!currentFilters ||
      !currentFilters.taskPosition ||
      !Array.isArray(currentFilters.taskPosition) ||
      currentFilters.taskPosition.length === 0) {
      return true;
    }

    // Check if the updated task position matches any of the filtered statuses
    // Normalize both values for comparison (handle case sensitivity)
    const normalizedUpdatedPosition = updatedTaskPosition?.toString().toLowerCase();
    return currentFilters.taskPosition.some(
      filterStatus => filterStatus?.toString().toLowerCase() === normalizedUpdatedPosition
    );
  }, [currentFilters]);

  // Handle status change for section tasks
  const handleStatusChange = async (statusName) => {
    // Find the status object by name
    const selectedStatus = taskStatuses.find(
      (s) => s.name === statusName
    );

    if (!selectedStatus) {
      console.error("Status not found:", statusName);
      return;
    }

    // Set editing flag to prevent state override
    isEditingRef.current = true;
    setIsEditing(true);

    // Update UI optimistically
    setTaskPosition(selectedStatus.name);
    setStatusDropdownOpen(false);

    // Prepare updates with both taskPosition and isComplete
    const updates = {
      taskPosition: selectedStatus.value,
      isComplete: selectedStatus.value === "completed"
    };

    dispatch(updateTaskLocally({
      taskId: task._id,
      updates
    }));

    try {
      await dispatch(updateTaskInSection({
        taskId: task._id,
        updates,
        forceUpdate: true
      })).unwrap();

      if (selectedStatus.value === "completed") {
        confetti({
          particleCount: 500,
          spread: 100,
          origin: { y: 0.5 },
          colors: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF"],
          disableForReducedMotion: true,
        });
      }

      toast.success(`Task status updated to ${selectedStatus.name}`, {
        position: "bottom-right",
        autoClose: 2000,
      });

      // Check if task still matches the current filter after status change
      // Wait for Redux state to update before checking filter
      requestAnimationFrame(() => {
        setTimeout(() => {
          const matchesFilter = taskMatchesFilters(selectedStatus.value);

          // If task doesn't match filter anymore, remove it from view (but keep panel open)
          // Panel will stay open until user manually closes it
          if (!matchesFilter && currentSectionId) {
            dispatch(removeTemporaryTask({
              sectionId: currentSectionId,
              taskId: task._id
            }));
            
            // Don't close the panel automatically - let user close it manually
            // The task will be removed from the list, but panel stays open
          }
        }, 100); // Small delay to ensure Redux state is updated
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      setTaskPosition(task?.taskPosition || "Pending");
      toast.error("Failed to update task status", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  // Update handleDueDateChange for section tasks
  const handleDueDateChange = async (e) => {
    const value = e.target.value;

    // Set editing flag to prevent state override
    isEditingRef.current = true;
    setIsEditing(true);

    setDueDate(value);

    const formattedDate = value ? new Date(value).toISOString() : null;

    dispatch(updateTaskLocally({
      taskId: task._id,
      updates: { dueDate: formattedDate }
    }));

    try {
      await dispatch(updateTaskInSection({
        taskId: task._id,
        updates: { dueDate: formattedDate },
        forceUpdate: true
      })).unwrap();

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
  const updateTaskFields = (taskId, field, value) => {
    // Set editing flag to prevent state override for description and other field updates
    isEditingRef.current = true;
    setIsEditing(true);

    dispatch(updateTaskLocally({
      taskId,
      updates: { [field]: value }
    }));
  };

  // Update comment count callback for TaskDescriptionComments
  const updateCommentCount = (taskId, newCount) => {
    setCommentCount(newCount);
    // Update the comment count in Redux store so it reflects in EditableTaskRow
    dispatch(updateTaskCommentCount({ taskId, newCount }));
  };

  // Complete overhaul of the handleCollaboratorChange function for section tasks
  const handleCollaboratorChange = async (newSelectedEmployees) => {
    // Set editing flag to prevent state override
    isEditingRef.current = true;
    setIsEditing(true);

    // Update local state immediately
    setCollaborators(newSelectedEmployees || []);
    setCollaboratorLoading(true);

    // Update Redux store optimistically
    dispatch(updateTaskLocally({
      taskId: task._id,
      updates: { collaborators: newSelectedEmployees }
    }));

    try {
      await dispatch(updateTaskInSection({
        taskId: task._id,
        updates: { collaborators: newSelectedEmployees },
        forceUpdate: true
      })).unwrap();
    } catch (error) {
      console.error("Error in collaborator update:", error);
      // Revert local state on error
      setCollaborators(task?.collaborators || []);
      toast.error("Failed to update collaborators", {
        position: "bottom-right",
        autoClose: 2000,
      });
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
      .writeText(`${window.location.origin}/section-tasks?taskId=${task?._id}`)
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

  // Update the deleteTask function for section tasks
  const deleteTask = async () => {
    try {
      setIsDeleting(true);
      if (task?.parent) {
        try {
          const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${task?.parent}/`;
          const data = await fetchAuthGET(apiUrl, false);
          if (data?.status === 1) {
            const fetchedTask = data?.data;

            dispatch(setSelectedTask(fetchedTask));

          } else {
            console.error("Error fetching task details: invalid status");
          }
        } catch (error) {
          console.error("Error fetching task details:", error);
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

        // Delete via section task action
        await dispatch(deleteTaskFromSection({ taskId: task._id, userId: userInfo._id })).unwrap();

        // Close the panel
        onClose();
      }

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
      low: "#FF5F1F",
      medium: "#FFB800",
      high: "#DC3464",
    };
    return colors[priorityValue.toLowerCase()] || "#BCBCBC";
  };

  // Update local likedBy state when task changes (but not during active editing)
  useEffect(() => {
    if (task && !isEditingRef.current) {
      setLikedBy(task?.liked_by || []);
    }
  }, [task]);

  // Update taskAttachments when task changes
  useEffect(() => {
    if (task && !isEditingRef.current) {
      setTaskAttachments(task?.attachments || []);
    }
  }, [task?.attachments]);

  // Like/unlike handler for section tasks
  const handleLikeToggle = async () => {
    if (!task?._id || !userInfo?._id) return;

    // Set editing flag to prevent state override
    isEditingRef.current = true;
    setIsEditing(true);

    setLikeLoading(true);
    const hasLiked = likedBy.includes(userInfo._id);

    let newLikedBy;
    if (hasLiked) {
      newLikedBy = likedBy.filter((id) => id !== userInfo._id);
    } else {
      newLikedBy = [...likedBy, userInfo._id];
      setLikeAnimate(true);
      setTimeout(() => setLikeAnimate(false), 400);
    }
    setLikedBy(newLikedBy);

    dispatch(updateTaskLocally({
      taskId: task._id,
      updates: { liked_by: newLikedBy }
    }));

    try {
      await dispatch(updateTaskInSection({
        taskId: task._id,
        updates: { liked_by: newLikedBy },
        forceUpdate: true
      })).unwrap();
    } catch (err) {
      // Revert UI if error
      setLikedBy(likedBy);
      dispatch(updateTaskLocally({
        taskId: task._id,
        updates: { liked_by: likedBy }
      }));
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

  if (likedUsers.length > 1 && userInfo?._id) {
    likedUsers = [
      ...likedUsers.filter((u) => u._id === userInfo._id),
      ...likedUsers.filter((u) => u._id !== userInfo._id),
    ];
  }

  const updateAllocatedTime = async (value, property) => {
    dispatch(updateTaskInSection({
      taskId: task._id,
      updates: { allocated_time: value },
      forceUpdate: true
    }))
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
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim()) return;

    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/tasks/subtasks/create/?userId=${userInfo._id}`;
      const res = await fetchAuthPost(apiUrl, {
        body: {
          taskName: newSubtaskName.trim(),
          parent: task?._id || task?.taskId,
          projectId: task?.projectId || userInfo?.default_project_id,
        }
      });

      if (res.status) {
        // Add the new subtask to the list
        const newSubtask = {
          ...res?.data,
          _id: String(res?.data?.taskId || res?.data?._id), // Ensure consistent ID format
          parent_hierarchy: res?.data?.parent_hierarchy?.filter((hierarchy, i) => hierarchy?.taskId !== res?.data?.taskId)
        };
        setSubtasks(prev => {
          const updatedSubtasks = [...prev, newSubtask];
          // Update subtask count in the store
          dispatch(updateTaskSubtaskCount({
            taskId: task._id || task.taskId,
            newCount: updatedSubtasks.length
          }));
          return updatedSubtasks;
        });
        setNewSubtaskName("");
        setIsAddingSubtask(false);
        toast.success("Subtask added successfully", {
          position: "bottom-right",
          autoClose: 1500,
        });
      } else {
        throw new Error(res.message || "Failed to add subtask");
      }
    } catch (err) {
      console.error("Error adding subtask:", err);
      toast.error("Failed to add subtask: " + (err.message || "Unknown error"), {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  const handleUpdateSubtask = async (subtaskId, newName) => {
    if (!newName.trim()) return;

    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      // Ensure subtaskId is a number
      const subtaskIdNum = Number(subtaskId);
      const apiUrl = `${BaseUrl}/task/${subtaskIdNum}/${userInfo._id}/`;
      const response = await fetchAuthPut(apiUrl, { body: { taskName: newName.trim() } });

      if (!response.status) {
        throw new Error(response.message || "Failed to update subtask");
      }

      // Get current timestamp for immediate UI update
      const currentTime = new Date().toISOString();

      setSubtasks(prev =>
        prev.map(subtask =>
          subtask._id == subtaskId  // Use loose equality to handle string/number comparison
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
      toast.error("Failed to update subtask: " + (err.message || "Unknown error"), {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

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
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.3 },
          colors: ["#0F6FFF", "#A026FF", "#6d42f8", "#9333ea", "#2DE072"],
          disableForReducedMotion: true,
        });
      }
    } catch (err) {
      console.error("Error toggling subtask completion:", err);
      toast.error("Failed to update subtask status", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  const handleStartEditing = (subtask) => {
    setEditingSubtaskId(subtask._id);
    setEditingSubtaskName(subtask.taskName);
  };

  const handleCancelEditing = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskName("");
  };

  const handleSaveEditing = () => {
    if (editingSubtaskName.trim()) {
      handleUpdateSubtask(editingSubtaskId, editingSubtaskName);
    }
  };

  // Add missing attachment handling functions
  const handleDeleteAttachment = async (attachment) => {
    try {
      setIsAttachmentDeleting(true);
      setAttachmentForDelete(attachment);
      setShowAttachmentDeleteModal(true);
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment", {
        position: "bottom-right",
        autoClose: 2000,
      });
    } finally {
      setIsAttachmentDeleting(false);
    }
  };

  // Handle attachment viewer
  const handleAttachmentOpen = (index) => {
    setCurrentAttachmentIndex(index);
    setIsAttachmentViewerOpen(true);
  };

  const removeMediaFromContent = async (mediaUrl, context = "description") => {
    try {
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

        // Optimistic local update
        dispatch(updateTaskLocally({
          taskId: task?._id,
          updates: { description: updatedHTML },
        }));

        // Persist to backend
        await dispatch(
          updateTaskInSection({
            taskId: task?._id,
            updates: { description: updatedHTML },
            forceUpdate: true,
          }),
        ).unwrap();
      }

      if (context === "comments") {
        const updatedComments = await Promise.all(
          (commentChat || []).map(async (comment) => {
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
              await fetchAuthPatch(
                `${import.meta.env.VITE_APP_DJANGO}/api/taskchat/${comment.id}/`,
                {
                  body: { message: newMessage },
                },
              );
            } catch (err) {
              console.error("Error updating comment after media delete:", err);
            }

            return { ...comment, message: newMessage };
          }),
        );

        setCommentChat(updatedComments);
      }
    } catch (error) {
      console.error("Error removing media from content:", error);
      toast.error("Failed to remove media from content", {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  const shortenFilename = (filename, maxLength = 25) => {
    if (!filename) return "";
    if (filename.length <= maxLength) return filename;

    const extension = filename.split('.').pop();
    const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.'));
    const maxNameLength = maxLength - extension.length - 4; // 4 for "..."

    if (maxNameLength <= 0) return `...${extension}`;

    return `${nameWithoutExtension.substring(0, maxNameLength)}...${extension}`;
  };

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

      const data = await fetchAuthPut(apiUrl, {
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
        updateTaskInSection({
          taskId: task._id,
          updates: { parent: parentId },
          forceUpdate: true,
          skipChangeDetection: true
        })
      ).unwrap();

      // The backend response structure is: { status, message, task_details: {...} }
      // We need to extract data from task_details
      const taskDetails = updatedTask?.result?.task_details;
      const parentValue = taskDetails?.parent ?? null;
      const parentHierarchyValue = taskDetails?.parent_hierarchy ?? [];

      dispatch(updateTaskLocally({
        taskId: task._id,
        updates: {
          parent: parentValue,
          parent_hierarchy: parentHierarchyValue
        }
      }));

    } catch (error) {
      console.error("❌ Update failed:", error);
      console.error("❌ Error details:", error.message);
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
      : "sm:w-[650px] xl:w-[750px] h-[calc(100vh-50px)] top-[47px] rounded-lg z-50"
      } border border-[#E1E1E1] dark:border-slate-700`;
  };

  return (
    <div
      className={`${getClassName()} shadow-lg transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      ref={panelRef}
    >
      <div
        className={`flex flex-col ${isExpand
          ? `mx-10 border border-[#E1E1E1] ${from === "dashboard"
            ? "h-[calc(100vh-20px)]"
            : "h-[calc(100vh-20px)] mt-5"
          } rounded-md`
          : "h-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center">
            <div
              onClick={() => {
                dispatch(toggleTaskPanel(false));
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
            {/* Like Button */}
            <div>
              {likedUsers.length > 0 ? (
                <ModernTooltip
                  content={
                    <div className="space-y-2 max-w-xs min-w-[200px] max-h-80 overflow-y-auto">
                      {likedUsers.map((user, i) => (
                        <div
                          key={user?._id || i}
                          className="bg-transparent flex items-center gap-2"
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

            {/* File Upload */}
            <div className={`relative ${!canCreateTasks ? 'opacity-60' : ''}`}>
              <FileUpload
                taskId={task.taskId}
                index={task.taskId}
                from="taskpanelTop"
                task={task}
                isOpen={isOpen}
                onClose={onClose}
                totalAttachments={filteredAttachments?.length}
                isSectionTask={true}
                disabled={!canCreateTasks}
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

            {/* Mark Complete Button */}
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
                } text-xs font-medium px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${!canCreateTasks ? 'opacity-60 cursor-not-allowed' : ''}`}
              icon={
                isTaskCompleted()
                  ? "heroicons:check"
                  : "iconamoon:check-duotone"
              }
              onClick={canCreateTasks ? handleMarkComplete : undefined}
              disabled={!canCreateTasks}
            />

            {/* Share Button */}
            <div className={`border-[2px] bg-[#f9f9f9] dark:bg-slate-700 border-[#E1E1E1] dark:border-slate-600 rounded-md flex items-center justify-center `}>
              <button
                className={`text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 p-1 flex items-center gap-1 transition-colors `}
                onClick={handleShare}

              >
                <Icon icon="heroicons-outline:share" className="text-xl" />
              </button>
            </div>

            {/* Delete Button */}
            <div className={`border-[2px] bg-[#f9f9f9] dark:bg-slate-700 border-[#E1E1E1] dark:border-slate-600 rounded-md flex items-center justify-center ${!canCreateTasks ? 'opacity-60' : ''}`}>
              <button
                className={`text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors ${!canCreateTasks ? 'cursor-not-allowed' : ''}`}
                onClick={canCreateTasks ? handleDeleteClick : undefined}
                title={canCreateTasks ? "Delete Task" : "Viewer permissions - Cannot delete"}
                disabled={!canCreateTasks}
              >
                <Icon icon="mdi:trash" className="text-xl" />
              </button>
            </div>

            {/* Expand/Collapse Button */}
            {from !== "inbox" && (
              <div className="border-[2px] bg-[#f9f9f9] dark:bg-slate-700 border-[#E1E1E1] dark:border-slate-600 rounded-md hidden lg:flex items-center justify-center">
                <button
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 p-1 items-center gap-1 transition-colors flex"
                  title={isExpand ? "Collapse" : "Expand"}
                  onClick={() => {
                    setIsExpand((prev) => {
                      const next = !prev;
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

            {/* Seen By */}
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
                        ${i !== 0 ? "-ml-2" : ""}`}
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
                      className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-semibold -ml-2 shadow-sm"
                      style={{ zIndex: 1 }}
                    >
                      +{seenUsers.length - 2}
                    </div>
                  )}
                </div>
              </Tooltip>
            </div>

            <div className={`relative ${!canCreateTasks ? 'opacity-60' : ''}`} ref={menuRef}>
              <button
                className={`hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md p-1 transition-colors ${!canCreateTasks ? 'cursor-not-allowed' : ''}`}
                onClick={canCreateTasks ? () => setOpenMenu((prev) => !prev) : undefined}
                title={canCreateTasks ? "More" : "Viewer permissions - Limited options"}
                disabled={!canCreateTasks}
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
                placeholder="Find a task"
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
                          try {
                            const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${parent.taskId}/`;
                            const data = await fetchAuthGET(apiUrl, false);
                            if (data?.status === 1) {
                              const fetchedTask = data?.data;

                              dispatch(setSelectedTask(fetchedTask));

                            } else {
                              console.error("Error fetching task details: invalid status");
                            }
                          } catch (error) {
                            console.error("Error fetching task details:", error);
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
          {/* Form layout */}
          <div className="grid grid-cols-1 gap-y-4">
            {/* Task Name */}
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Task Name:
                </span>
              </div>
              <div className="flex-1">
                <DisabledTooltip disabled={!canCreateTasks} content="Viewer permissions - Cannot edit task name">
                  <textarea
                    ref={textareaRef}
                    className={`w-full px-3 py-[7px] -mb-2 text-sm border-[1px] border-[#E1E1E1] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md resize-none overflow-hidden ${!canCreateTasks ? 'cursor-not-allowed opacity-60' : 'focus:outline-none focus:ring-1 focus:ring-primary-500'}`}
                    value={taskName}
                    onChange={canCreateTasks ? handleTaskNameChange : undefined}
                    placeholder="Task name"
                    style={{
                      backgroundColor: "inherit",
                    }}
                    rows={1}
                    disabled={!canCreateTasks}
                    readOnly={!canCreateTasks}
                  />
                </DisabledTooltip>
              </div>
            </div>

            {/* Section Select */}
            <div className="flex flex-col sm:flex-row sm:mt-[-16px]">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mt-3 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Section:
                </span>
              </div>
              <div
                className="w-full sm:ml-[18px] sm:mt-3 relative"
                ref={sectionDropdownRef}
              >
                <DisabledTooltip disabled={!canCreateTasks} content="Viewer permissions - Cannot change section">
                  <button
                    className={`w-full rounded-md px-2 py-[7px] flex items-center justify-between overflow-hidden ${!canCreateTasks ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    style={{
                      border: `1px solid #E1E1E1`,
                      borderColor: "inherit",
                    }}
                    onClick={canCreateTasks ? toggleSectionDropdown : undefined}
                    disabled={!canCreateTasks}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">

                      <span className="text-sm truncate">
                        {sections?.find(s => s.id === currentSectionId)?.name || "Select Section"}
                      </span>
                    </div>
                    <div className="ml-1">
                      <Icon
                        icon="mingcute:down-fill"
                        className={`text-slate-400 w-4 h-4 flex-shrink-0 transition-transform duration-200 ${sectionDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                </DisabledTooltip>

                {/* Section Dropdown Menu */}
                {sectionDropdownOpen && (
                  <div className="absolute top-full z-50 left-0 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md shadow-lg max-h-64 overflow-hidden">
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
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Assign To:
                </span>
              </div>
              <div className="flex-1 relative">
                {(projectMembers.length > 0 || users.length > 0) && (
                  <div className="w-full">
                    <div className="relative">
                      <DisabledTooltip disabled={!canCreateTasks} content="Viewer permissions - Cannot assign users">
                        <UserMultiSelect
                          key={task?._id || "user-multi-select"}
                          task={{
                            ...task,
                            assigned_users: assignedUsers,
                          }}
                          users={projectMembers.length > 0 ? projectMembers : users}
                          index={task._id}
                          updateExistingTask={canCreateTasks ? async (updatedTask, property) => {
                            if (property !== "assigned_users") return Promise.resolve();

                            // Set editing flag to prevent state override
                            isEditingRef.current = true;
                            setIsEditing(true);

                            // Update local state immediately
                            setAssignedUsers(updatedTask.assigned_users || []);

                            try {
                              dispatch(updateTaskLocally({
                                taskId: task._id,
                                updates: { assigned_users: updatedTask.assigned_users }
                              }));

                              await dispatch(updateTaskInSection({
                                taskId: task._id,
                                updates: { assigned_users: updatedTask.assigned_users || [] },
                                forceUpdate: true
                              })).unwrap();

                              return Promise.resolve();
                            } catch (error) {
                              console.error("Error updating assignees:", error);
                              // Revert local state on error
                              setAssignedUsers(task?.assigned_users || []);
                              toast.error("Failed to update assignees", {
                                position: "bottom-right",
                                autoClose: 2000,
                              });
                              return Promise.reject(error);
                            }
                          } : undefined}
                          isCompleted={task?.taskPosition === "completed"}
                          initiallyOpen={false}
                          disabled={!canCreateTasks}
                        />
                      </DisabledTooltip>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col sm:flex-row sm:mt-[-16px]">
              <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mt-3 sm:mb-0">
                <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                  Status:
                </span>
              </div>
              <div
                className="w-full sm:ml-[18px] sm:mt-3 relative"
                ref={statusDropdownRef}
              >
                <DisabledTooltip disabled={!canCreateTasks} content="Viewer permissions - Cannot change status">
                  <button
                    className={`w-full rounded-md px-2 py-[7px] flex items-center justify-between overflow-hidden ${!canCreateTasks ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    style={{
                      border: `1px solid #E1E1E1`,
                      borderColor: "inherit",
                    }}
                    onClick={canCreateTasks ? toggleStatusDropdown : undefined}
                    disabled={!canCreateTasks}
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
                </DisabledTooltip>

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
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {getFilteredStatuses().map((statusObj, idx) => {
                        const style = getStatusColorAndIcon(statusObj.name);
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

                        const isLast = idx === taskStatuses.length - 1;
                        const isArchive =
                          statusObj.name.toLowerCase() === "archived" ||
                          statusObj.value === "archived";

                        // If this is the last status and is Archive, make it sticky
                        if (isLast && isArchive) {
                          return (
                            <div
                              key={statusObj.name}
                              ref={(el) => (statusDropdownItemsRef.current[idx] = el)}
                              className={`px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 sticky bottom-0 bg-white dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 ${highlightedStatusIndex === idx ? "bg-gray-100 dark:bg-slate-600" : ""
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
                            ref={(el) => (statusDropdownItemsRef.current[idx] = el)}
                            className={`px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 ${highlightedStatusIndex === idx ? "bg-gray-100 dark:bg-slate-600" : ""
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

            {/* Due Date and Priority */}
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
                  <DisabledTooltip disabled={!canCreateTasks} content="Viewer permissions - Cannot change due date">
                    <Flatpickr
                      className={
                        isMobile
                          ? `w-full px-3 py-[10px] pr-[170px] text-sm border-[1px] border-[#E1E1E1] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md mobile-date-input ${!canCreateTasks ? 'cursor-not-allowed opacity-60' : 'focus:outline-none focus:ring-1 focus:ring-primary-500'}`
                          : `w-full px-4 py-[10px] text-sm border-[1px] border-[#E1E1E1] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md ${!canCreateTasks ? 'cursor-not-allowed opacity-60' : 'focus:outline-none focus:ring-1 focus:ring-primary-500'}`
                      }
                      value={dueDate ? new Date(dueDate) : null}
                      placeholder={dueDate === "" ? "No Due Date" : undefined}
                      disabled={!canCreateTasks}
                      onChange={async (selectedDates, dateStr) => {
                        // Only handle date selection here, not clearing
                        if (selectedDates && selectedDates.length > 0) {
                          // Set flag to prevent onClose from making duplicate API call
                          isDateUpdatingRef.current = true;

                          // Set editing flag to prevent state override
                          isEditingRef.current = true;
                          setIsEditing(true);

                          const selectedDate = selectedDates[0];
                          const year = selectedDate.getFullYear();
                          const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                          const day = String(selectedDate.getDate()).padStart(2, "0");

                          // Always YYYY-MM-DD
                          const formattedDate = `${year}-${month}-${day}`;
                          setDueDate(formattedDate);

                          // Send YYYY-MM-DD to API (no timezone shift)
                          const apiFormattedDate = formattedDate;

                          dispatch(
                            updateTaskLocally({
                              taskId: task._id,
                              updates: { dueDate: apiFormattedDate },
                            })
                          );

                          try {
                            await dispatch(
                              updateTaskInSection({
                                taskId: task._id,
                                updates: { dueDate: apiFormattedDate },
                                forceUpdate: true,
                              })
                            ).unwrap();

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

                          // Reset flag after a longer delay to prevent onClose from running
                          setTimeout(() => {
                            isDateUpdatingRef.current = false;
                          }, 500);
                        }
                      }}
                      options={{
                        dateFormat: "Y-m-d", // backend-friendly format
                        altInput: true,
                        altFormat: "d/m/Y", // pretty UI format
                        allowInput: true,
                        clickOpens: true,
                        autoClose: true,
                        disableMobile: true,
                        static: true,
                        onOpen: function (selectedDates, dateStr, instance) {
                          const calendar = document.querySelector(".flatpickr-calendar");
                          if (calendar) {
                            calendar.addEventListener("click", function (e) {
                              e.stopPropagation();
                            });
                          }
                        },
                        onClose: function (selectedDates, dateStr, instance) {
                          // Handle both clearing and updating dates when calendar closes
                          const handleDateUpdate = async () => {
                            // Skip if onChange already handled the update (prevents double API calls)
                            if (isDateUpdatingRef.current) {
                              return;
                            }

                            // Additional check: if selectedDates exists and has a date, 
                            // it means onChange already handled it, so skip
                            if (selectedDates && selectedDates.length > 0) {
                              return;
                            }

                            try {
                              let newFormattedDate = null;
                              let shouldUpdate = false;

                              if (!dateStr || dateStr.trim() === "") {
                                // Clear the date - only if current date is not already empty
                                if (dueDate && dueDate !== "") {
                                  setDueDate("");
                                  newFormattedDate = null;
                                  shouldUpdate = true;

                                  // Update UI optimistically
                                  dispatch(
                                    updateTaskLocally({
                                      taskId: task._id,
                                      updates: { dueDate: null },
                                    })
                                  );
                                }
                              } else {
                                // Update with typed date - try multiple date formats
                                let parsedDate = null;

                                // Try different date formats that might be used
                                const formats = ["d/m/Y", "d-m-Y", "d.m.Y", "Y-m-d", "d/m/yyyy", "d-m-yyyy"];

                                for (const format of formats) {
                                  parsedDate = moment(dateStr, format, true);
                                  if (parsedDate.isValid()) {
                                    break;
                                  }
                                }

                                if (parsedDate && parsedDate.isValid()) {
                                  const formattedDate = parsedDate.format("YYYY-MM-DD");

                                  // Only update if the date is different from current
                                  if (formattedDate !== dueDate) {
                                    setDueDate(formattedDate);
                                    newFormattedDate = formattedDate;
                                    shouldUpdate = true;

                                    // Update UI optimistically
                                    dispatch(
                                      updateTaskLocally({
                                        taskId: task._id,
                                        updates: { dueDate: formattedDate },
                                      })
                                    );
                                  }
                                } else {
                                  // If moment parsing fails, try native Date parsing as fallback
                                  const nativeDate = new Date(dateStr);
                                  if (!isNaN(nativeDate.getTime())) {
                                    const year = nativeDate.getFullYear();
                                    const month = String(nativeDate.getMonth() + 1).padStart(2, "0");
                                    const day = String(nativeDate.getDate()).padStart(2, "0");
                                    const formattedDate = `${year}-${month}-${day}`;

                                    // Only update if the date is different from current
                                    if (formattedDate !== dueDate) {
                                      setDueDate(formattedDate);
                                      newFormattedDate = formattedDate;
                                      shouldUpdate = true;

                                      // Update UI optimistically
                                      dispatch(
                                        updateTaskLocally({
                                          taskId: task._id,
                                          updates: { dueDate: formattedDate },
                                        })
                                      );
                                    }
                                  } else {
                                    // Invalid date format, revert to current value

                                    return;
                                  }
                                }
                              }

                              // Only make API call if there's actually a change
                              if (shouldUpdate) {
                                await dispatch(
                                  updateTaskInSection({
                                    taskId: task._id,
                                    updates: { dueDate: newFormattedDate },
                                    forceUpdate: true,
                                  })
                                ).unwrap();

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
                  </DisabledTooltip>

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
                <DisabledTooltip disabled={!canCreateTasks} content="Viewer permissions - Cannot change priority">
                  <button
                    className={`w-full rounded-md px-4 py-[10px] flex items-center justify-between overflow-hidden dark:bg-slate-800 dark:text-slate-200 ${!canCreateTasks ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    style={{
                      border: "1px solid #E1E1E1",
                      borderColor: "inherit",
                    }}
                    onClick={canCreateTasks ? togglePriorityDropdown : undefined}
                    disabled={!canCreateTasks}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getPriorityColor(priority) }}
                      ></div>
                      <span className="text-sm capitalize">{priority}</span>
                    </div>
                    <Icon
                      icon="heroicons-outline:chevron-down"
                      className={`text-slate-400 w-3.5 h-3.5 ml-[5rem] flex-shrink-0 mt-1 transition-transform duration-200 ${priorityDropdownOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                </DisabledTooltip>

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
                  <DisabledTooltip disabled={!canCreateTasks} content="Viewer permissions - Cannot edit allocated hours">
                    <AllocatedHours
                      task={task}
                      updateTaskDetails={canCreateTasks ? updateAllocatedTime : undefined}
                      disabled={!canCreateTasks}
                    />
                  </DisabledTooltip>
                  <span className="text-sm">Hours</span>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="">
              <div className="flex items-center gap-2 flex-wrap">
                {filteredAttachments?.length > 0 && (
                  <div className="flex items-center gap-2 ">
                    <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                      Attachments:
                    </span>
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
                            handleDeleteAttachment(attachment);
                          }}
                          className="absolute -top-2 -right-2 text-sm bg-red-600 rounded-full p-0.5  text-white hidden group-hover:block hover:scale-110"
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
                        <div key={subtask._id || index} className="group flex items-center gap-2 px-1 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 group">

                          {/* Checkbox */}
                          <button
                            onClick={canCreateTasks ? () => handleToggleSubtaskComplete(subtask._id, subtask.isComplete, subtask?.taskPosition) : undefined}
                            className={`flex-shrink-0 ${!canCreateTasks ? 'cursor-not-allowed opacity-60' : ''}`}
                            disabled={!canCreateTasks}
                          >
                            <Icon
                              icon={subtask?.taskPosition && subtask?.taskPosition.toLowerCase() === "completed" ? "heroicons:check-circle-solid" : "heroicons:check-circle"}
                              className={`w-5 h-5 ${subtask?.taskPosition && subtask?.taskPosition.toLowerCase() === "completed" ? 'text-green-500' : 'text-slate-400 dark:text-slate-500'}`}
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
                                className="flex items-center gap-2 flex-1 cursor-pointer"
                                onClick={() => {
                                  dispatch(setSelectedTask(subtask));

                                  // Scroll the panel's content area
                                  setTimeout(() => {
                                    if (scrollableContentRef.current) {
                                      scrollableContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                  }, 100);
                                }}
                              >
                                <span
                                  onClick={canCreateTasks ? (e) => {
                                    e.stopPropagation(); // prevent triggering view panel
                                    handleStartEditing(subtask);
                                  } : undefined}
                                  className={`text-xs ${subtask.isComplete ? ' text-slate-500 dark:text-slate-400' : 'font-medium text-black-800 dark:text-slate-200'} ${canCreateTasks ? 'group-hover:bg-white group-hover:outline group-hover:outline-1 group-hover:outline-slate-300' : ''} px-2 py-0.5`}
                                  style={{ cursor: canCreateTasks ? 'text' : 'default' }}
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
                                    <span className="flex items-center gap-1">
                                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{subtask?.subtask_count}</span>
                                      <Icon
                                        icon="cuida:subtask-outline"
                                        className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
                                      />
                                    </span>
                                  </Tooltip>
                                }
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            {/* Due Date */}
                            <Tooltip
                              placement="top"
                              theme="custom-light"
                              content="Due Date"
                            >
                              <div className={canCreateTasks ? "cursor-pointer" : "cursor-not-allowed opacity-60"}>
                                <Flatpickr
                                  value={subtask.dueDate ? new Date(subtask.dueDate) : null}
                                  onChange={canCreateTasks ? ([selectedDate]) => {
                                    if (selectedDate) {
                                      handleSubtaskDueDateChange(subtask._id, selectedDate);
                                    }
                                  } : undefined}
                                  options={{
                                    dateFormat: "Y-m-d",
                                    allowInput: true
                                  }}
                                  disabled={!canCreateTasks}
                                  render={({ value, ...props }, ref) => {
                                    const past = isPast(subtask.dueDate);
                                    return (
                                      <button
                                        type="button"
                                        ref={ref}
                                        className={`${subtask?.dueDate
                                          ? ""
                                          : "h-6 w-6 flex items-center justify-center border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 rounded-full"
                                          }`}
                                      >
                                        {!subtask?.dueDate && (
                                          <Icon
                                            icon="heroicons-outline:calendar"
                                            className={`w-3 h-3 ${past ? "text-red-500" : "text-gray-400"}`}
                                          />
                                        )}
                                        {subtask.dueDate && (
                                          <span
                                            className={`mr-1 text-xs font-medium ${past ? "text-red-500" : "text-gray-500"
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
                            <div className={canCreateTasks ? "cursor-pointer" : "cursor-not-allowed opacity-60"}>
                              <UserMultiSelect
                                task={{
                                  ...subtask,
                                  assigned_users: subtask?.assigned_users,
                                }}
                                users={projectMembers.length > 0 ? projectMembers : users}
                                index={subtask?._id}
                                updateExistingTask={canCreateTasks ? async (updatedTask, property) => {
                                  if (property !== "assigned_users") return Promise.resolve();

                                  // Set editing flag to prevent state override
                                  isEditingRef.current = true;
                                  setIsEditing(true);

                                  // Optimistically update UI
                                  setSubtasks((prev) =>
                                    prev.map((st) =>
                                      st._id === subtask?._id
                                        ? { ...st, assigned_users: updatedTask.assigned_users }
                                        : st
                                    )
                                  );

                                  try {
                                    // Use direct API call for subtask updates (same pattern as other subtask updates)
                                    const BaseUrl = import.meta.env.VITE_APP_DJANGO;
                                    const apiUrl = `${BaseUrl}/task/${subtask?._id}/${userInfo._id}/`;

                                    const response = await fetchAuthPut(apiUrl, {
                                      body: { assigned_users: updatedTask.assigned_users || [] }
                                    });

                                    if (!response.status) {
                                      throw new Error(response.message || "Failed to update subtask assignees");
                                    }

                                    toast.success("Assignees updated successfully", {
                                      position: "bottom-right",
                                      autoClose: 1500,
                                    });

                                    return Promise.resolve();
                                  } catch (error) {
                                    console.error("Error updating assignees:", error);
                                    // Revert local state on error
                                    setSubtasks((prev) =>
                                      prev.map((st) =>
                                        st._id === subtask?._id
                                          ? { ...st, assigned_users: subtask.assigned_users }
                                          : st
                                      )
                                    );
                                    toast.error("Failed to update assignees", {
                                      position: "bottom-right",
                                      autoClose: 2000,
                                    });
                                    return Promise.reject(error);
                                  }
                                } : undefined}
                                isCompleted={subtask?.taskPosition === "completed"}
                                initiallyOpen={false}
                                from="subtask"
                                disabled={!canCreateTasks}
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
                                  // Dispatch action to open task panel with subtask data
                                  dispatch(setSelectedTask(subtask));

                                  // Scroll the panel's content area
                                  setTimeout(() => {
                                    if (scrollableContentRef.current) {
                                      scrollableContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                  }, 100);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="View Task"
                              >
                                <Icon icon="heroicons:chevron-right-20-solid" className="w-5 h-5" />
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
                  <div className="flex items-center gap-2 py-1 border-b border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/20 px-1 group rounded-md">

                    {/* Checkbox Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <Icon icon="heroicons:check-circle" className="w-5 h-5 text-slate-400 dark:text-slate-500" />
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

              {canCreateTasks && (
                <div className="flex items-center gap-2 my-2">
                  <button
                    className="px-2 py-1 text-xs border border-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    onClick={() => setIsAddingSubtask(true)}
                  >
                    <Icon icon="heroicons-outline:plus" className="w-4 h-4" />
                    <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold">Add subtask</span>
                  </button>
                </div>
              )}

            </div>

            {/* Task Description and Comments */}
            <div className="relative">
              <DisabledTooltip disabled={!canCreateTasks} content="Viewer permissions - Comments and description are read-only">
                <div className="relative">
                  {!canCreateTasks && (
                    <div className="absolute inset-0 z-10 cursor-not-allowed" />
                  )}
                  <TaskDescriptionComments
                    task={task}
                    users={(projectMembers && projectMembers.length > 0) ? projectMembers : users}
                    updateTaskCommentCount={canCreateTasks ? updateCommentCount : undefined}
                    updateTaskFields={canCreateTasks ? updateTaskFields : undefined}
                    taskAttachments={sectionTaskAttachments}
                    setAttachmentForDelete={canCreateTasks ? setAttachmentForDelete : undefined}
                    setShowAttachmentDeleteModal={canCreateTasks ? setShowAttachmentDeleteModal : undefined}
                    commentChat={commentChat}
                    setCommentChat={setCommentChat}
                    handleAttachmentOpen={handleAttachmentOpen}
                    setAttachmentsForView={setAttachmentsForView}
                    activeTab={activeTab}
                    activeTabIndex={activeTabIndex}
                    setActiveTabIndex={setActiveTabIndex}
                    isExpand={isExpand}
                    from="section-task"
                    readOnly={!canCreateTasks}
                  />
                </div>
              </DisabledTooltip>
            </div>
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
                <DisabledTooltip disabled={!canCreateTasks} content="Viewer permissions - Cannot change collaborators">
                  <Collaborators
                    employees={(projectMembers && projectMembers.length > 0) ? projectMembers : users}
                    onSelectionChange={canCreateTasks ? handleCollaboratorChange : undefined}
                    className="w-full text-f13"
                    task={{
                      ...task,
                      collaborators: collaborators,
                    }}
                    disabled={!canCreateTasks}
                  />
                </DisabledTooltip>
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
          z-index: 9999 !important;
        }

        :global(.select__menu-portal) {
          z-index: 9999 !important;
        }
      `}</style>

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          taskId={task?._id}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onCopyUrl={handleCopyUrl}
          isCopy={isCopy}
        />
      )}

      {/* Attachment Delete Modal */}
      {showAttachmentDeleteModal && attachmentForDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative max-w-md w-full mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden transform transition-all border dark:border-slate-700">
            <div className="p-6">
              {/* Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Icon
                    icon="mingcute:delete-2-fill"
                    className="h-6 w-6 text-red-600 dark:text-red-400"
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white mb-4">
                Delete Attachment
              </h3>

              {/* Description */}
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete this attachment?
              </p>

              {/* Actions */}
              <div className="flex justify-center space-x-3">
                <Button
                  text="Cancel"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-md transition-colors"
                  onClick={() => {
                    setShowAttachmentDeleteModal(false);
                    setAttachmentForDelete(null);
                  }}
                />

                <Button
                  text={isAttachmentDeleting ? "Deleting..." : "Delete"}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  onClick={async () => {
                    try {
                      setIsAttachmentDeleting(true);
                      const result = await dispatch(
                        deleteSectionTaskAttachment({
                          taskId: task.taskId,
                          attachmentId: attachmentForDelete.id
                        })
                      ).unwrap();

                      toast.success(result.message || "Attachment deleted successfully", {
                        position: "bottom-right",
                        autoClose: 2000,
                      });

                      await removeMediaFromContent(
                        attachmentForDelete.url,
                        attachmentForDelete.folder
                      );
                      dispatch(fetchSectionTaskAttachments(task?.taskId));
                    } catch (error) {
                      console.error("Delete Attachment Error:", error);
                      toast.error("Delete Attachment Failed", {
                        position: "bottom-right",
                        autoClose: 2000,
                      });
                    } finally {
                      setIsAttachmentDeleting(false);
                      setShowAttachmentDeleteModal(false);
                      setAttachmentForDelete(null);
                    }
                  }}
                  disabled={isAttachmentDeleting}
                  icon="mingcute:delete-2-fill"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Viewer */}
      {isAttachmentViewerOpen && (
        <AttachmentViewer
          attachments={attachmentsForView}
          initialIndex={currentAttachmentIndex}
          open={isAttachmentViewerOpen}
          onClose={() => setIsAttachmentViewerOpen(false)}
        />
      )}

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

export default SectionTaskPanel;