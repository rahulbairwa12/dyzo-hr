import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import moment from "moment";
// Import attachment icons
import documentIcon from "@/assets/images/all-img/document.png";
import pdfIcon from "@/assets/images/all-img/pdf.png";
import imageIcon from "@/assets/images/all-img/image.png";
import videoIcon from "@/assets/images/all-img/video.png";
import AttachmentViewer from "@/components/Task/AttachmentViewer";


import {
  togglePanelVisibility,
  updateRecurringTaskInState,
  removeRecurringTaskFromState,
  syncRecurringTaskUpdate,
  createRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
} from "../store/tasksSlice";
import Button from "@/components/ui/Button";
import ProjectSelect from "@/components/dropdowns/ProjectSelect";
import UserMultiSelect from "@/components/dropdowns/UserMultiSelect";
import Tooltip from "@/components/ui/Tooltip";
import { toast } from "react-toastify";
import Flatpickr from "react-flatpickr";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import FrequencyDropdown from "./FrequencyDropdown";
import { ProfilePicture } from "@/components/ui/profilePicture";
import { uploadtoS3, fetchAuthPatch, fetchAuthPatchSumit, fetchAuthPost } from "@/store/api/apiSlice";
import Editor from "react-textflux";
import "react-textflux/dist/react-textflux.css";
import { deleteBulkRecurringTasks } from "../store/tasksSlice";
import FileUpload from "@/components/Task/FileUpload";

const RecurringTaskPanel = ({
  task,
  isOpen,
  onClose,
  projects,
  from = "task",
}) => {

  const dispatch = useDispatch();
  const { user: userInfo } = useSelector((state) => state.auth);
  const [taskName, setTaskName] = useState(task?.taskName || "");
  const [taskNameError, setTaskNameError] = useState("");
  const [frequency, setFrequency] = useState(task?.frequency || "weekly");
  const [interval, setInterval] = useState(task?.interval || 1);
  const [startDate, setStartDate] = useState(
    task?.start_date || moment().format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(
    task?.end_date || moment().add(30, "days").format("YYYY-MM-DD")
  );
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [taskPosition, setTaskPosition] = useState(
    task?.taskPosition || "Not Started Yet"
  );
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpand, setIsExpand] = useState(false);
  const [seenBy, setSeenBy] = useState(task?.seen_by || []);
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState(task?.description || "");
  const [imgLoading, setImgLoading] = useState(false);
  const [attachments, setAttachments] = useState(task?.attachments || []);
  const [attachmentForDelete, setAttachmentForDelete] = useState(null);
  const [showAttachmentDeleteModal, setShowAttachmentDeleteModal] = useState(false);
  const [attachmentsForView, setAttachmentsForView] = useState([]);
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);
  const [project, setProject] = useState("untitled");
  const [assignedUsers, setAssignedUsers] = useState(
    task?.assigned_users || []
  );
  const [isToggling, setIsToggling] = useState(false);
  const [isActive, setIsActive] = useState(task?.is_active);

  // Refs
  const panelRef = useRef(null);
  const textareaRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const users = useSelector((state) => state.users.users);

  const taskNameTimeoutRef = useRef(null);
  const descriptionTimeoutRef = useRef(null);
  const allocatedHoursTimeoutRef = useRef(null);
  const [allocatedHours, setAllocatedHours] = useState(
    task?.allocated_hours || ""
  );

  const taskNameRef = useRef(taskName);

  // For recurring tasks, use the attachments from the task object directly
  // For regular tasks, use the attachments from Redux
  const taskAttachments = useSelector((state) => state.tasks.taskAttachments);

  // Compute filtered attachments from multiple sources, prioritizing local state
  // This ensures UI updates immediately when attachments are deleted
  const filteredAttachments = useMemo(() => {
    // Always use the local attachments state as source of truth
    // The attachments state is explicitly set, even when empty
    if (attachments !== undefined) {
      return attachments;
    } else if (task?.attachments) {
      return task.attachments;
    } else if (taskAttachments) {
      return taskAttachments.filter(
        (att) => att.folder === "attachments"
      );
    }
    return [];
  }, [attachments, task?.attachments, taskAttachments]);

  // Add state for mobile view detection
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 800);

  // Update local state when task changes
  useEffect(() => {
    if (task) {
      setTaskName(task?.taskName || "");
      setFrequency(task?.frequency || "weekly");
      setInterval(task?.interval || 1);
      setStartDate(task?.start_date || moment().format("YYYY-MM-DD"));
      setEndDate(
        task?.end_date || moment().add(30, "days").format("YYYY-MM-DD")
      );
      setPriority(task?.priority || "Medium");
      setTaskPosition(task?.taskPosition || "Pending");
      setDescription(task?.description || "");
      setSeenBy(task?.seen_by || []);

      // Handle attachments specially to ensure empty arrays are properly set
      // This prevents the bug where attachments reappear after being deleted
      setAttachments(Array.isArray(task.attachments) ? [...task.attachments] : []);
    }
  }, [task]);


  const handleClosePanel = useCallback(() => {
    if (!taskNameRef.current.trim()) {
      setTaskNameError("Task name cannot be empty.");
      return;
    }
    dispatch(togglePanelVisibility(false));
    onClose();
  }, [dispatch, onClose]);

  // Handle click outside of panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check for task tabs that SHOULD close the panel
      let isTaskTab = false;
      let currentTabElement = event.target;





      // Check if the click is on a task tab or its children
      while (currentTabElement && currentTabElement !== document.body) {
        if (currentTabElement.classList) {
          const classListArray = Array.from(currentTabElement.classList);
          if (
            classListArray.some(
              (cls) =>
                cls.includes("task-tab") ||
                cls.includes("task-tab-icon") ||
                cls.includes("task-tab-active") ||
                cls.includes("task-tab-inactive")
            )
          ) {
            isTaskTab = true;
            break;
          }
        }
        currentTabElement = currentTabElement.parentElement;
      }

      if (isTaskTab) {
        handleClosePanel();
        return;
      }

      // Check for specific elements that SHOULD close the panel
      // like overlay/background elements
      if (
        typeof event.target.className === "string" &&
        event.target.className.includes("hidden md:block w-full h-full")
      ) {
        handleClosePanel();
        return;
      }

      // Special check for panel content elements that might be detected incorrectly
      // These are the classes we know should be considered as "inside" the panel
      const panelContentClasses = [
        "flex flex-col sm:flex-row",
        "w-full sm:w-[100px]",
        // Removed flex-1 from this list as it's too generic
        "grid grid-cols-1 gap-y-4",
      ];

      // Check if the clicked element or any parent has one of these classes
      let isInsidePanelContent = false;
      let currentEl = event.target;
      while (currentEl && currentEl !== document.body) {
        if (typeof currentEl.className === "string") {
          for (const className of panelContentClasses) {
            if (currentEl.className.includes(className)) {
              isInsidePanelContent = true;
              break;
            }
          }
        }
        if (isInsidePanelContent) break;
        currentEl = currentEl.parentElement;
      }

      // Check if click is on flatpickr elements (they exist outside panel DOM)
      const flatpickrElements = document.querySelectorAll(
        ".flatpickr-calendar, .flatpickr-input, .flatpickr-calendar *"
      );
      let isClickInFlatpickr = false;
      flatpickrElements.forEach((element) => {
        if (element === event.target || element.contains(event.target)) {
          isClickInFlatpickr = true;
        }
      });

      // Check dropdowns, select menus, and other common out-of-panel elements
      const dropdownSelectors = [
        ".react-select__menu",
        ".react-select__menu-list",
        ".react-select__option",
        ".dropdown-menu",
        ".editor-container",
        ".rdw-editor-toolbar",
        ".rdw-dropdown-optionwrapper",
        ".rdw-emoji-modal",
        ".textflux-mentions",
        ".textflux-mentions-item",
      ];

      const dropdownElements = document.querySelectorAll(
        dropdownSelectors.join(", ")
      );
      let isClickInDropdown = false;
      dropdownElements.forEach((element) => {
        if (element === event.target || element.contains(event.target)) {
          isClickInDropdown = true;
        }
      });

      // Check if target or any of its parents have specific classes indicating interactive elements
      let currentElement = event.target;
      let isClickInInteractiveElement = false;

      // Check if the click is on an element with prevent-dropdown-close class
      let hasPreventCloseClass = false;
      let preventCloseElement = event.target;
      while (preventCloseElement && preventCloseElement !== document.body) {
        if (typeof preventCloseElement.className === "string" &&
          preventCloseElement.className.includes("prevent-dropdown-close")) {
          hasPreventCloseClass = true;
          break;
        }
        preventCloseElement = preventCloseElement.parentElement;
      }

      // If element has prevent-dropdown-close class, don't close the panel
      if (hasPreventCloseClass) {
        return;
      }

      const interactiveClassPatterns = [
        "flatpickr",
        "react-select",
        "dropdown",
        "popup",
        "modal",
        "editor",
        "textflux",
        "rdw-",
        "mentions",
        "tooltip",
      ];

      // Walk up the DOM tree to check parent elements
      while (currentElement && currentElement !== document.body) {
        const classList = Array.from(currentElement.classList || []);
        const elemId = currentElement.id || "";
        const elemTagName = currentElement.tagName?.toLowerCase() || "";

        // Check if any class contains our interactive patterns
        if (
          interactiveClassPatterns.some(
            (pattern) =>
              classList.some((cls) => cls.includes(pattern)) ||
              elemId.includes(pattern)
          )
        ) {
          isClickInInteractiveElement = true;

          break;
        }

        // Check specifically for editor elements, but exclude task-tab buttons
        if (
          (elemTagName === "button" &&
            !classList.some((cls) => cls.includes("task-tab"))) ||
          elemTagName === "input" ||
          elemTagName === "textarea" ||
          elemTagName === "select" ||
          currentElement.getAttribute("role") === "button" ||
          currentElement.getAttribute("contenteditable") === "true"
        ) {
          isClickInInteractiveElement = true;

          break;
        }

        currentElement = currentElement.parentElement;
      }

      // Only close if the click is outside the panel AND not in any interactive elements
      // Also ensure we don't close if clicking on known panel content
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        !isClickInFlatpickr &&
        !isClickInDropdown &&
        !isClickInInteractiveElement &&
        !isInsidePanelContent
      ) {
        handleClosePanel();
      }
    };

    // Add event listener if panel is open
    if (isOpen) {
      // Use mousedown to ensure it fires before any other click handlers
      document.addEventListener("mousedown", handleClickOutside);
    }


    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClosePanel]);


  // Handle dropdowns close when clicking outside
  useEffect(() => {
    const handleDropdownsClickOutside = (event) => {
      // Close status dropdown when clicking outside
      if (
        statusDropdownOpen &&
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }

      // Close priority dropdown when clicking outside
      if (
        priorityDropdownOpen &&
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target)
      ) {
        setPriorityDropdownOpen(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleDropdownsClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleDropdownsClickOutside);
    };
  }, [statusDropdownOpen, priorityDropdownOpen]);

  // Handle task name change
  const handleTaskNameChange = (e) => {
    const newName = e.target.value;
    setTaskName(newName);
    taskNameRef.current = newName;

    if (newName.trim()) {
      setTaskNameError("");
    } else {
      setTaskNameError("Task name cannot be empty.");
    }

    // Clear the previous timeout
    if (taskNameTimeoutRef.current) {
      clearTimeout(taskNameTimeoutRef.current);
    }

    // Set a new timeout
    taskNameTimeoutRef.current = setTimeout(() => {
      // Update in Redux
      dispatch(
        syncRecurringTaskUpdate({
          _id: task._id || task.id,
          id: task.id,
          taskName: newName,
        })
      );
    }, 200);

    // Reset height to auto to shrink if needed
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      // Set height to scrollHeight to fit content
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

  // Handle frequency change
  const handleFrequencyChange = (value) => {
    setFrequency(value);

    // Update in Redux
    dispatch(
      syncRecurringTaskUpdate({
        _id: task._id || task.id,
        id: task.id,
        frequency: value,
      })
    );
  };

  // Handle interval change
  const handleIntervalChange = (value) => {
    setInterval(value);

    // Update in Redux
    dispatch(
      syncRecurringTaskUpdate({
        _id: task._id || task.id,
        id: task.id,
        interval: value,
      })
    );
  };

  // Handle start date change
  const handleStartDateChange = (selectedDates) => {
    if (selectedDates && selectedDates.length > 0) {
      const formattedDate = moment(selectedDates[0]).format("YYYY-MM-DD");
      setStartDate(formattedDate);

      let newEndDate = endDate;
      // If new start date is after current end date, set end date to one month after start date
      if (!endDate || moment(formattedDate).isAfter(moment(endDate))) {
        newEndDate = moment(formattedDate).add(1, 'month').format("YYYY-MM-DD");
        setEndDate(newEndDate);
      }

      // Update in Redux
      dispatch(
        syncRecurringTaskUpdate({
          _id: task._id || task.id,
          id: task.id,
          start_date: formattedDate,
        })
      );
      // Also update end date if changed
      if (newEndDate !== endDate) {
        dispatch(
          syncRecurringTaskUpdate({
            _id: task._id || task.id,
            id: task.id,
            end_date: newEndDate,
          })
        );
      }
    }
  };

  // Handle end date change
  const handleEndDateChange = (selectedDates) => {
    if (selectedDates && selectedDates.length > 0) {
      const formattedDate = moment(selectedDates[0]).format("YYYY-MM-DD");
      setEndDate(formattedDate);

      // Update in Redux
      dispatch(
        syncRecurringTaskUpdate({
          _id: task._id || task.id,
          id: task.id,
          end_date: formattedDate,
        })
      );
    }
  };

  // Toggle status dropdown
  const toggleStatusDropdown = (e) => {
    e.preventDefault();
    setStatusDropdownOpen(!statusDropdownOpen);
  };

  // Handle status change
  const handleStatusChange = (status) => {
    setTaskPosition(status);
    setStatusDropdownOpen(false);

    // Update in Redux
    dispatch(
      syncRecurringTaskUpdate({
        _id: task._id || task.id,
        id: task.id,
        taskPosition: status,
      })
    );
  };

  // Get status color and icon
  const getStatusColorAndIcon = (statusValue) => {
    if (!statusValue)
      return {
        bg: "bg-gray-100",
        styles: { borderColor: "#BCBCBC", color: "#666666" },
        dotStyle: { backgroundColor: "#BCBCBC" },
        hexColor: "#BCBCBC",
      };

    // Default status colors
    const statusColors = {
      not_started_yet: "#DC3464",
      in_progress: "#3092F5",
      completed: "#30F558",
      pending: "#BCBCBC",
      archived: "#6C757D",
    };

    const statusNames = {
      not_started_yet: "Not Started Yet",
      in_progress: "In Progress",
      completed: "Completed",
      pending: "Pending",
      archived: "Archived",
    };

    // Normalize the status value for comparison
    const normalizedStatusValue = statusValue.toLowerCase().replace(/ /g, "_");

    // Get color
    const color = statusColors[normalizedStatusValue] || "#BCBCBC";

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

  // Toggle priority dropdown
  const togglePriorityDropdown = (e) => {
    e.preventDefault();
    setPriorityDropdownOpen(!priorityDropdownOpen);
  };

  // Handle priority change
  const handlePriorityChange = (value) => {
    setPriority(value);
    setPriorityDropdownOpen(false);

    // Update in Redux
    dispatch(
      syncRecurringTaskUpdate({
        _id: task._id || task.id,
        id: task.id,
        priority: value,
      })
    );
  };

  // Helper function to get priority color
  const getPriorityColor = (priorityValue) => {
    const colors = {
      low: "#FF5F1F", // orange
      medium: "#FFB800", // yellow
      high: "#DC3464", // red
    };
    return colors[priorityValue.toLowerCase()] || "#BCBCBC";
  };

  // Function to handle delete button click
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  // Delete recurring task
  const deleteTask = async () => {
    try {
      setIsDeleting(true);

      if (String(task._id).startsWith("new-recurring-")) {
        // For new tasks that haven't been saved to server yet,
        // just remove them from the state without API call
        dispatch(removeRecurringTaskFromState(task._id || task.id));
      } else {
        // Only delete from server for existing tasks
        await dispatch(deleteRecurringTask(task._id || task.id)).unwrap();
      }

      toast.success("Recurring task deleted successfully", {
        position: "bottom-right",
        autoClose: 2000,
      });

      // Close the panel
      onClose();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete recurring task", {
        position: "bottom-right",
        autoClose: 3000,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  // Save recurring task
  const handleSaveRecurringTask = async () => {
    if (!taskName.trim()) {
      toast.error("Task name is required");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        _id: task._id || task.id,
        taskName,
        frequency,
        interval,
        start_date: startDate,
        end_date: endDate,
        priority: priority.toLowerCase(),
        taskPosition,
        description,
        company: userInfo.companyId,
        project: project || task.projectId,
        assigned_users: assignedUsers || task.assigned_users || [],
        userInfo,
      };

      if (task.initial || String(task._id).startsWith("new-recurring-")) {
        // Create new recurring task
        await dispatch(createRecurringTask(payload)).unwrap();
        toast.success("Recurring task created successfully");
      } else {
        // Update existing recurring task
        await dispatch(syncRecurringTaskUpdate(payload)).unwrap();
        toast.success("Recurring task updated successfully");
      }

      // Close panel
      onClose();
    } catch (error) {
      console.error("Error saving recurring task:", error);
      toast.error("Failed to save recurring task");
    } finally {
      setIsSaving(false);
    }
  };

  // Extract image URLs from HTML content
  function extractMediaUrls(html) {
    const div = document.createElement("div");
    div.innerHTML = html;

    // Get all images
    const images = div.querySelectorAll("img");
    const imageUrls = Array.from(images).map((img) => img.src);

    // Get all videos
    const videos = div.querySelectorAll("video");
    const videoUrls = Array.from(videos).map((video) => video.src);

    // Combine all media URLs
    return [...imageUrls, ...videoUrls];
  }

  // Handle description change with debouncing
  const handleDescriptionChange = (content) => {
    setDescription(content);
    const usedMediaUrls = extractMediaUrls(content);
    const unusedAttachments = attachments?.filter(
      (att) =>
        (att.type === "image" || att.type === "video") &&
        att.folder === "description" &&
        !usedMediaUrls.some((url) => url.startsWith(att.url)),
    );

    if (unusedAttachments.length > 0) {
      for (const attachment of unusedAttachments) {
        handleDeleteAttachment(attachment)
      }
    }


    // Clear the previous timeout
    if (descriptionTimeoutRef.current) {
      clearTimeout(descriptionTimeoutRef.current);
    }

    // Set a new timeout
    descriptionTimeoutRef.current = setTimeout(() => {
      // Update in Redux
      dispatch(
        syncRecurringTaskUpdate({
          _id: task._id || task.id,
          id: task.id,
          description: content,
        })
      );
    }, 500);
  };

  useEffect(() => {
    // Clear any existing timeout first to prevent multiple API calls
    if (allocatedHoursTimeoutRef.current) {
      clearTimeout(allocatedHoursTimeoutRef.current);
    }

    // Only sync with server if there's a value change
    if (allocatedHours !== task?.allocated_hours) {
      allocatedHoursTimeoutRef.current = setTimeout(() => {
        dispatch(
          syncRecurringTaskUpdate({
            _id: task._id || task.id,
            id: task.id,
            allocated_hours: allocatedHours,
          })
        );
      }, 1000);
    }

    // Cleanup on unmount or when value changes
    return () => {
      if (allocatedHoursTimeoutRef.current) {
        clearTimeout(allocatedHoursTimeoutRef.current);
      }
    };
  }, [allocatedHours]);

  // Add window resize handler for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Clean up all timeouts on unmount
  useEffect(() => {
    return () => {
      if (taskNameTimeoutRef.current) clearTimeout(taskNameTimeoutRef.current);
      if (descriptionTimeoutRef.current)
        clearTimeout(descriptionTimeoutRef.current);
      if (allocatedHoursTimeoutRef.current)
        clearTimeout(allocatedHoursTimeoutRef.current);
    };
  }, []);

  // Update isActive when task changes
  useEffect(() => {
    setIsActive(task?.is_active);
  }, [task?.is_active]);

  // Add these constants at the top of the file, after imports
  const MAX_VIDEO_SIZE_MB = 15;
  const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

  // Helper to get file category
  const getFileCategory = (file) => {
    const mime = file.type;
    if (mime.startsWith("image/")) return "image";
    if (mime === "application/pdf") return "pdf";
    if (
      mime.includes("csv") ||
      mime.includes("excel") ||
      mime.includes("spreadsheet") ||
      file.name.match(/\.(xls|xlsx|csv)$/i)
    )
      return "document";
    if (mime.startsWith("video/")) return "video";
    return "file";
  };

  // Helper to get timestamped filename
  const getTimestampedFilename = (originalName) => {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
    const dot = originalName.lastIndexOf(".");
    if (dot === -1) return `${originalName}_${timestamp}`;
    return `${originalName.slice(0, dot)}_${timestamp}${originalName.slice(dot)}`;
  };

  // Refactor handleMediaUpload to accept folder argument (default to 'description')
  const handleMediaUpload = async (file, type, folder = "description") => {
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error("File size exceeds the maximum allowed size of 15MB");
      return;
    }
    const fileType = getFileCategory(file);
    setImgLoading(true);
    const uploadUrl = "https://ht69f1dwe5.execute-api.us-east-1.amazonaws.com/store_task_attachments";
    const companyId = userInfo.companyId;
    const userId = userInfo?._id;
    const taskId = task?._id || task?.id;
    const fileName = getTimestampedFilename(file.name);
    try {
      const uploadedUrl = await uploadtoS3(
        uploadUrl,
        companyId,
        userId,
        taskId,
        folder,
        fileName,
        file
      );
      // Save attachment to database for recurring tasks
      const djangoBaseURL = import.meta.env.VITE_APP_DJANGO;
      const attachmentObj = {
        url: uploadedUrl,
        type: fileType,
        name: file.name,
        folder: folder,
      };
      const response = await fetchAuthPatchSumit(
        `${djangoBaseURL}/api/recurring-tasks/${taskId}/attachments/`,
        {
          body: JSON.stringify({ add_attachments: [attachmentObj] }),
          contentType: "application/json"
        }
      );
      if (response.status) {
        // Update local state
        setAttachments(response.attachments || []);
        toast.success("Attachment uploaded successfully");
      }
      return {
        url: uploadedUrl,
        type: type,
        name: file.name,
      };
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error("Failed to upload media");
      throw error;
    } finally {
      setImgLoading(false);
    }
  };

  // Drag-and-drop handler for description editor
  const handleEditorDropGeneric = async (e, {
    currentValue,
    setValue,
    field,
    folderName,
    updateTaskDetailsIfNeeded
  }) => {
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    // Optional: double-safety
    if (files.length > 1) {
      toast.error("Please drop only one document at a time");
      return;
    }

    const file = files[0];
    const fileType = getFileCategory(file);

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error("File size exceeds the maximum allowed size of 15MB");
      return;
    }

    if (!["document", "pdf"].includes(fileType)) {
      toast.error("Only documents or PDFs allowed here");
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    let newValue = currentValue;

    const uploadUrl = "https://ht69f1dwe5.execute-api.us-east-1.amazonaws.com/store_task_attachments";
    const companyId = userInfo.companyId;
    const userId = userInfo?._id;
    const taskId = task?._id || task?.id;
    const fileName = getTimestampedFilename(file.name);
    const folder = "attachments";

    try {
      setImgLoading(true);

      const uploadedUrl = await uploadtoS3(
        uploadUrl,
        companyId,
        userId,
        taskId,
        folder,
        fileName,
        file
      );

      const response = await fetchAuthPatchSumit(
        `${import.meta.env.VITE_APP_DJANGO}/api/recurring-tasks/${taskId}/attachments/`,
        {
          body: JSON.stringify({
            add_attachments: [{
              url: uploadedUrl,
              type: fileType,
              name: file.name,
              folder: folder,
            }]
          }),
          contentType: "application/json"
        }
      );

      if (response.status === "success" && response.attachments?.length > 0) {
        const att = response.attachments.at(-1);
        newValue += `<a href="${att.url}" target="_blank" rel="noopener noreferrer" class="tf-link" contenteditable="false">${att.name}</a><br/>`;

        setAttachments(response.attachments || []);
      }
    } catch (error) {
      toast.error("Failed to upload file: " + file.name);
    } finally {
      setImgLoading(false);
    }

    setTimeout(() => {
      setValue(newValue);
      if (updateTaskDetailsIfNeeded) {
        updateTaskDetailsIfNeeded(newValue, field);
      }
    }, 0);
  };

  // Attachment viewing handler
  const handleAttachmentOpen = (index) => {
    setActiveAttachmentIndex(index);
    setShowAttachmentViewer(true);
  };

  const removeMediaFromContent = async (mediaUrl) => {

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

    setDescription(updatedHTML)
    dispatch(
      syncRecurringTaskUpdate({
        _id: task._id || task.id,
        id: task.id,
        description: updatedHTML,
      })
    );
  };

  // Handle attachment deletion
  const handleDeleteAttachment = async (attachment) => {
    if (!attachment || !attachment.id) {
      toast.error("Invalid attachment");
      return;
    }

    try {
      const djangoBaseURL = import.meta.env.VITE_APP_DJANGO;

      // Make API call to remove attachment
      const response = await fetchAuthPatch(
        `${djangoBaseURL}/api/recurring-tasks/${task._id || task.id}/attachments/`,
        {
          body: {
            remove_ids: [attachment.id]
          }
        }
      );

      if (response && response.status === "success") {
        removeMediaFromContent(attachment?.url)
        // Update local state to remove the deleted attachment
        const updatedAttachments = attachments.filter(att => att.id !== attachment.id);

        // Explicitly set attachments, even if it's an empty array
        setAttachments(updatedAttachments);

        // Update the task object in Redux to reflect the change
        // Make sure to pass an empty array, not undefined, when no attachments remain
        dispatch(updateRecurringTaskInState({
          _id: task._id || task.id,
          id: task.id,
          attachments: updatedAttachments
        }));

        // Close modal and show success message
        setShowAttachmentDeleteModal(false);
        setAttachmentForDelete(null);
        toast.success("Attachment deleted successfully");
      } else {
        throw new Error(response.data?.message || "Failed to delete attachment");
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error(error.message || "Failed to delete attachment");
    }
  };

  // Helper function to shorten filenames for display
  const shortenFilename = (filename, maxLength = 25) => {
    if (!filename) return "";
    const extIndex = filename.lastIndexOf(".");
    if (extIndex === -1) return filename;

    const name = filename.slice(0, extIndex);
    const ext = filename.slice(extIndex);

    if (filename.length <= maxLength) return filename;

    const start = name.slice(0, 15);
    const end = name.slice(-5);
    return `${start}...${end}${ext}`;
  };

  // Get current status style
  const currentStatusStyle = getStatusColorAndIcon(taskPosition);

  // Handle status toggle
  const handleStatusToggle = async () => {
    if (isToggling) return;

    try {
      setIsToggling(true);
      const response = await fetchAuthPost(
        `${import.meta.env.VITE_APP_DJANGO}/recurring-task/${task.id}/toggle/`,
        { body: {} }
      );

      // Update local state immediately
      setIsActive(!isActive);

      // Update Redux state
      dispatch(
        updateRecurringTaskInState({
          _id: task._id || task.id,
          id: task.id,
          is_active: !isActive
        })
      );

      toast.success(response.message || `Task ${isActive ? 'deactivated' : 'activated'} successfully`, {
        position: "bottom-right",
        autoClose: 2000
      });

    } catch (error) {
      // Revert local state on error
      setIsActive(isActive);
      console.error("Error toggling task status:", error);
      if (!error.message?.includes("successfully")) {
        toast.error(error?.message || "Failed to toggle task status", {
          position: "bottom-right",
          autoClose: 2000
        });
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className={`${from === "inbox" ? "w-full h-[calc(100vh-80px)]" : "fixed right-0 sm:w-[650px] xl:w-[750px] h-[calc(100vh-57px)] rounded-lg z-50 border border-[#E1E1E1] dark:border-slate-700 shadow-lg "} w-full bg-white prevent-dropdown-close ${isMobileView ? "top-[58px]" : "top-[52px]"
        }   dark:bg-slate-800 transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      ref={panelRef}
    >
      {/* Header */}
      <div
        className={`flex items-center prevent-dropdown-close justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 ${isMobileView ? "pt-4" : ""
          }`}
      >
        <div className="flex items-center">
          <div
            onClick={handleClosePanel}
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1 transition-colors"
          >
            <Icon
              icon="heroicons-outline:x-mark"
              className="text-xl text-slate-700 dark:text-slate-300"
            />
          </div>
          <h2 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
            {isMobileView ? "Recurring Task Details" : ""}
          </h2>
        </div>
        {/* Desktop view icons - hidden on mobile */}
        <div className="hidden md:flex relative ml-[390px]">
          <FileUpload
            taskId={task._id || task.id}
            index={task._id || task.id}
            from="taskpanelTop"
            className="p-[9px]"
            task={task}
            isOpen={isOpen}
            onClose={onClose}
            totalAttachments={filteredAttachments?.length}
            isRecurring={true}
            updateAttachments={(newAttachments) => setAttachments(newAttachments)}
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



        {/* Mobile view icons */}
        <div className="flex items-center space-x-2">
          {/* Attachment upload for mobile */}
          <div className="relative md:hidden">
            <FileUpload
              taskId={task._id || task.id}
              index={task._id || task.id}
              from="taskpanelTop"
              task={task}
              isOpen={isOpen}
              onClose={onClose}
              totalAttachments={filteredAttachments?.length}
              isRecurring={true}
              updateAttachments={(newAttachments) => setAttachments(newAttachments)}
            />
            {filteredAttachments?.length >= 1 && (
              <div
                title={`${filteredAttachments?.length} files in attachments`}
                className="absolute -top-3 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
              >
                {filteredAttachments?.length}
              </div>
            )}
          </div>

          {/* Delete button - shown on all screen sizes */}
          <div className="border-[2px] bg-[#f9f9f9] dark:bg-slate-700 border-[#E1E1E1] dark:border-slate-600 rounded-md flex items-center justify-center">
            <button
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors"
              onClick={handleDeleteClick}
              title="Delete Task"
            >
              <Icon icon="mdi:trash" className="text-xl" />
            </button>
          </div>
          <div className="border-[2px] bg-[#f9f9f9] dark:bg-slate-700 border-[#E1E1E1] dark:border-slate-600 rounded-md hidden lg:flex items-center justify-center"></div>
        </div>
      </div>

      {/* Content area */}
      <div
        className="flex-1 overflow-auto py-4 px-4 dark:bg-slate-800"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Form layout based on the image */}
        <div className="grid grid-cols-1 gap-y-4">
          {/* Task Name */}
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
              <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                Task Name:
              </span>
            </div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                className={`w-full px-3 py-[7px] -mb-2 text-sm border-[1px] dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 resize-none overflow-hidden ${taskNameError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-[#E1E1E1] dark:border-slate-600 focus:ring-primary-500"
                  }`}
                value={taskName}
                onChange={handleTaskNameChange}
                placeholder="Recurring Task Name"
                style={{
                  backgroundColor: "inherit",
                }}
                rows={1}
              />
              {taskNameError && (
                <p className="text-red-500 text-xs mt-2">{taskNameError}</p>
              )}
            </div>
          </div>

          {/* Project */}
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
              <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                Project:
              </span>
            </div>
            <div className="flex-1 relative">
              <div className="dark:border-slate-600 rounded-md">
                <ProjectSelect
                  task={task}
                  index={task?._id || task?.id}
                  updateExistingTask={(updatedTask) => {
                    setProject(updatedTask.projectId);
                    dispatch(
                      syncRecurringTaskUpdate({
                        _id: task._id || task.id,
                        id: task.id,
                        projectId: updatedTask.projectId,
                        projectName: updatedTask.projectName,
                      })
                    );
                  }}
                  projects={projects || []}
                  setProjectStatuses={() => { }}
                  from="taskpanel"
                />
              </div>
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
              <div>
                {users.length > 0 && (
                  <div className="w-full">
                    <div className="relative">
                      <UserMultiSelect
                        task={task}
                        users={users}
                        index={task._id || task.id}
                        updateExistingTask={async (updatedTask, property) => {
                          if (property !== "assigned_users") return Promise.resolve();

                          try {
                            setAssignedUsers(updatedTask["assigned_users"]);
                            dispatch(
                              syncRecurringTaskUpdate({
                                _id: task._id || task.id,
                                id: task.id,
                                assigned_users: updatedTask["assigned_users"],
                              })
                            );

                            // Return success promise
                            return Promise.resolve();
                          } catch (error) {
                            console.error("Error updating recurring task assignees:", error);
                            // Return error promise
                            return Promise.reject(error);
                          }
                        }}
                        isCompleted={false}
                        initiallyOpen={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
            <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
              <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                Repetition:
              </span>
            </div>
            <div className="w-full sm:w-[150px] mr-0 sm:mr-4 mb-3 sm:mb-0">
              <FrequencyDropdown
                value={frequency}
                onChange={handleFrequencyChange}
                disabled={false}
                className="w-full h-[34px]"
              />
            </div>

            {/* Allocated Hours */}
            <div className="w-full sm:w-[120px] flex items-center ml-0 sm:ml-[5px] mb-1 sm:mb-0">
              <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                Allocated Hours:
              </span>
            </div>
            <div className="w-full sm:w-[80px]">
              <input
                type="text"
                value={allocatedHours}
                onChange={(e) => {
                  setAllocatedHours(e.target.value);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                min="0.5"
                step="0.5"
                placeholder="1.5"
              />
            </div>
          </div>

          {/* Start Date and End Date - stack vertically on mobile, horizontal on desktop */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
            <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
              <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                Start On:
              </span>
            </div>
            <div className="w-full sm:w-[150px] mr-0 sm:mr-4 mb-3 sm:mb-0">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <Flatpickr
                  className={
                    (isMobileView
                      ? "w-full px-3 py-2 pr-[204px] text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      : "w-full px-3 py-2  text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500") + " hide-caret"
                  }
                  value={startDate ? new Date(startDate) : null}
                  onChange={handleStartDateChange}
                  options={{
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "d/m/Y",
                    allowInput: true,
                    clickOpens: true,
                    disableMobile: true,
                    static: true,
                    minDate:
                      !startDate || new Date(startDate) >= new Date()
                        ? "today"
                        : startDate,
                    onReady: function (selectedDates, dateStr, instance) {
                      if (startDate) {
                        instance.setDate(startDate, false); // Don't trigger change event
                      }
                    },
                    onClose: function (selectedDates, dateStr, instance) {
                      if (!selectedDates.length && startDate) {
                        instance.setDate(startDate, false); // Reapply previous value
                      }
                    },
                  }}
                  readOnly={true}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Icon
                    icon="heroicons-outline:chevron-down"
                    className="w-4 h-4 text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
            {/* Repeat Until */}
            <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
              <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                Repeat Until:
              </span>
            </div>
            <div className="w-full sm:w-[150px]">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <Flatpickr
                  id="repeatUntilInput"
                  className={
                    (isMobileView
                      ? "w-full px-3 py-2 pr-[204px] text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      : "w-full px-3 py-2  text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500") + " hide-caret"
                  }
                  value={endDate ? new Date(endDate) : null}
                  onChange={handleEndDateChange}
                  options={{
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "d/m/Y",
                    allowInput: true,
                    clickOpens: true,
                    disableMobile: true,
                    static: true,
                    minDate: startDate ? new Date(startDate) : undefined,

                    // 💡 Fix disappearing value when calendar is closed
                    onReady: function (selectedDates, dateStr, instance) {
                      if (endDate) {
                        instance.setDate(endDate, false); // Prevent onChange
                      }
                    },
                    onClose: function (selectedDates, dateStr, instance) {
                      if (!selectedDates.length && endDate) {
                        instance.setDate(endDate, false); // Restore previous date
                      }
                    },
                  }}
                  readOnly={true}

                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Icon
                    icon="heroicons-outline:chevron-down"
                    className="w-4 h-4 text-gray-500"
                  />
                </div>
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
                    <div className="text-xs text-center ">
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

          {/* Status */}

          {/* Description */}
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-[100px] flex items-center mb-1 sm:mb-0">
              <span className="text-sm font-medium text-[#747474] dark:text-slate-300">
                Description:
              </span>
            </div>
          </div>
          <div className="w-full relative"
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();

              const files = Array.from(e.dataTransfer.files);
              if (!files.length) return;

              const mediaFiles = files.filter(file => {
                const type = getFileCategory(file);
                return type === "image" || type === "video";
              });

              const docFiles = files.filter(file => {
                const type = getFileCategory(file);
                return type === "document" || type === "pdf";
              });

              const unsupportedFiles = files.filter(file => {
                const type = getFileCategory(file);
                return !["image", "video", "document", "pdf"].includes(type);
              });

              //  Handle unsupported
              if (unsupportedFiles.length > 0) {
                toast.error("Unsupported file type(s) detected");
                return;
              }

              //  Block if both media + docs dropped together
              if (docFiles.length > 0 && mediaFiles.length > 0) {
                toast.error("Please drop media and documents separately");
                return;
              }

              //  Block multiple docs
              if (docFiles.length > 1) {
                toast.error("Please drop only one document at a time");
                return;
              }

              //  Let the editor handle media uploads automatically
              if (mediaFiles.length > 0) {
                return; // do nothing — editor will handle it via onMediaUpload
              }

              //  Handle document file
              if (docFiles.length === 1) {
                const file = docFiles[0];
                if (file.size > MAX_VIDEO_SIZE_BYTES) {
                  toast.error("File size exceeds 15MB");
                  return;
                }

                handleEditorDropGeneric(e, {
                  currentValue: description,
                  setValue: setDescription,
                  field: "description",
                  folderName: "description",
                  updateTaskDetailsIfNeeded: (val, field) => {
                    setDescription(val);
                    handleDescriptionChange(val);
                  }
                });
              }
            }}
            onDragOver={e => e.preventDefault()}>
            <Editor
              className="border rounded-md border-neutral-50"
              theme={
                document.documentElement.classList.contains("dark")
                  ? "dark"
                  : "light"
              }
              mentions={users
                .map((user) => ({
                  id: user._id || user.value,
                  name:
                    user.name ||
                    `${user.first_name || ""} ${user.last_name || ""}`,
                  profile_pic: user.image,
                }))
                .sort((a, b) => a.name.localeCompare(b.name))}
              value={description}
              onChange={handleDescriptionChange}
              mediaFullscreen={true}
              onMediaUpload={(file, type) => handleMediaUpload(file, type, "description")}
            // placeholder="Add description for this recurring task..."
            />
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center">
                <Icon
                  icon="heroicons-outline:information-circle"
                  className="w-3 h-3 mr-1"
                />
                Supports @mentions, emojis, and media uploads. Changes auto-save
                after typing.
              </span>
            </div>
          </div>
        </div>
      </div>




      {/* Fixed bottom action bar for mobile */}
      {isMobileView && String(task._id).startsWith("new-recurring-") && (
        <div className="absolute bottom-11 w-full p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-auto">
          <button
            onClick={handleSaveRecurringTask}
            disabled={isSaving}
            className="w-full px-4 py-2 text-sm bg-[#7A39FF] hover:bg-[#7A39FF]/90 text-white font-medium rounded-md shadow-sm"
          >
            {isSaving
              ? "Saving..."
              : task.initial || String(task._id).startsWith("new-recurring-")
                ? "Create Recurring Task"
                : "Update Recurring Task"}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-3 max-w-[240px] sm:max-w-xs w-full flex flex-col items-center border border-gray-300 dark:border-slate-700">
            {/* Warning Icon */}
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-1">
              <Icon
                icon="heroicons-outline:exclamation"
                className="text-red-500 dark:text-red-400 w-4 h-4"
              />
            </div>
            <h3 className="text-sm font-medium text-center dark:text-slate-200">
              Delete Recurring Task
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
              Are you sure you want to delete this recurring task? This action
              cannot be undone.
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

      {/* Attachment Delete Confirmation Modal */}
      {showAttachmentDeleteModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-3 max-w-[240px] sm:max-w-xs w-full flex flex-col items-center border border-gray-300 dark:border-slate-700">
            {/* Warning Icon */}
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-1">
              <Icon
                icon="heroicons-outline:exclamation"
                className="text-red-500 dark:text-red-400 w-4 h-4"
              />
            </div>
            <h3 className="text-sm font-medium text-center dark:text-slate-200">
              Delete Attachment
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
              Are you sure you want to delete this attachment? This action cannot be undone.
            </p>
            <div className="flex w-full gap-2">
              <button
                type="button"
                className="flex-1 rounded-md px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 font-medium shadow-sm hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors duration-200"
                onClick={() => setShowAttachmentDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-md px-2 py-1 text-xs bg-red-600 text-white font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors duration-200"
                onClick={() => handleDeleteAttachment(attachmentForDelete)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Viewer */}
      {showAttachmentViewer && (
        <AttachmentViewer
          attachments={attachmentsForView}
          initialIndex={activeAttachmentIndex}
          open={showAttachmentViewer}
          onClose={() => setShowAttachmentViewer(false)}
        />
      )}
    </div>
  );
};

export default RecurringTaskPanel;
