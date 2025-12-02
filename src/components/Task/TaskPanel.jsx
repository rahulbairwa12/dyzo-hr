import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "quill-mention/dist/quill.mention.min.css";
import { useSelector } from "react-redux";
import Select from "react-select";
import {
  askChatGPT,
  fetchAuthGET,
  fetchAuthPost,
  fetchAuthPut,
  fetchAuthPatch,
  fetchAuthDelete,
  fetchDelete,
  uploadtoS3,
} from "@/store/api/apiSlice";
import { Link, useNavigate } from "react-router-dom";
import ImageResize from "quill-image-resize-module-react";
import ImageUploader from "quill-image-uploader";
import "quill-image-uploader/dist/quill.imageUploader.min.css";
import ShareUrlButtons from "./ShareUrlButtons";
import ShareModal from "./ShareModal";
import { sendNotification } from "@/helper/helper";
import CommentMsg from "@/features/tasks/components/CommentMsg";
import TaskAttachments from "./TaskAttachments";
import TaskStatus from "./TaskStatus";
import TaskTracking from "./TaskTracking";
import AllocatedHours from "./AllocatedHours";
import Collaborators from "./Collaborators";
import RowLoader from "./RowLoader";
import LoaderCircle from "../Loader-circle";
import moment from "moment";
import { Icon } from "@iconify/react";
import Mention from "quill-mention";
import { intialLetterName } from "@/helper/helper";
import Textinput from "../ui/Textinput";
import { Tab } from "@headlessui/react";
import { notifyAssignee } from "@/helper/tasknotification";
import Tooltip from "../ui/Tooltip";
import CustomMenuList from "../ui/CustomMenuList";
import AddProject from "../project/AddProject";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { ImageCrousal } from "../partials/screenshot/ImageCrousal";
import ImageSlider from "../ui/ImageSlider";
import useImageSlider from "@/hooks/useImageSlider";
import FileUpload from "./FileUpload";
import documentIcon from "@/assets/images/all-img/document.png";
import pdfIcon from "@/assets/images/all-img/pdf.png";
import imageIcon from "@/assets/images/all-img/image.png";
import videoIcon from "@/assets/images/all-img/video.png";
import Button from "../ui/Button";
// Import the new SeenByModal

Quill.register("modules/imageResize", ImageResize);
Quill.register("modules/mention", Mention, true);

// Compute a valid task id; if not available, do not render the panel.
const getValidTaskId = (task) =>
  task?.taskId && task.taskId !== "-" ? task.taskId : task?._id;

const SEEN_BY_DISPLAY_LIMIT = 2; // Define how many users to display directly

// Custom DropdownIndicator for consistent chevron
const DropdownIndicator = (props) => {
  const {
    selectProps: { menuIsOpen },
  } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingRight: 8 }}>
      <Icon
        icon="heroicons-outline:chevron-down"
        className={`transition-transform duration-200 w-4 h-4 text-gray-500 ${menuIsOpen ? 'rotate-180' : ''}`}
      />
    </div>
  );
};

const TaskPanel = ({
  task,
  isOpen,
  onClose,
  projects,
  users,
  updateTaskFields,
  screenshotAllow,
  setOpen,
  updateTaskCommentCount,
  setTaskIdForDelete,
  setIsDeleteModalOpen,
  openViaComment,
  resetOpenViaComment,
  openViaTimeIcon,
  resetOpenViaTimeIcon,
  openViaAttachmentIcon,
  resetOpenViaAttachmentIcon,
  isDeleting,
  deleteTask,
  setShowDeletePopup,
  showDeletePopup,
  setAllAttachments,
  handleAttachmentOpen,
  updateTaskAttachmentCount, // Add this prop
  taskAttachmentCounts
}) => {
  const validTaskId = getValidTaskId(task);
  if (!validTaskId) return null;
  // If no valid task id exists, avoid rendering the panel.

  const [isActive, setIsActive] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const today = moment().set({ hour: 23, minute: 59 }).format();
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [commentLoading, setcommentLoading] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const [comments, setComments] = useState("");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority);
  const [currentId, setCurrentID] = useState(userInfo?._id || "");
  const [isCommentDel, setIsCommentDel] = useState(false);
  const [formData, setFormData] = useState({
    taskName: task?.taskName || "",
    projectId: task?.projectId || "",
    dueDate: task?.dueDate || "",
    userId: userInfo?._id || "",
    description: task?.description || "",
    priority: task?.priority || "low",
    repeat: task?.repeat || "not_repeatable",
    repeat_days: task?.repeat_days || "",
  });
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessage] = useState("");
  const [commentChat, setCommentChat] = useState([]);
  const [pinnedCommentIds, setPinnedCommentIds] = useState(() => {
    const savedPinnedComments = localStorage.getItem(
      `pinned_comments_${validTaskId}`
    );
    return savedPinnedComments ? JSON.parse(savedPinnedComments) : [];
  });
  const [taskJourney, setTaskJourney] = useState([]);
  const [taskLogs, setTaskLogs] = useState({});
  const [taskStatus, setTaskStatus] = useState(task?.taskStatus || "pending");
  const baseUrl = window.location.origin;
  const BaseUrl = import.meta.env.VITE_APP_DJANGO;
  const [isModalAiOpen, setIsModalAiOpen] = useState(false);
  const [inputText, setInputText] = useState(" write a brief description for the task");
  const [responseLoading, setResponseLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(task?.repeat_days || []);
  const [isCopy, setIsCopy] = useState(false);
  const navigate = useNavigate();
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [isDescriptionFullScreen, setIsDescriptionFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const [taskPosition, setTaskPosition] = useState(
    task?.taskPosition || "pending"
  );
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];
  const containerRef = useRef(null);
  const commentInputRef = useRef(null);
  const latestCommentRef = useRef(null);
  const latestTimeLogRef = useRef(null);
  const latestAttachmentRef = useRef(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0); // 0: Comments, 1: Activities, 2: Work

  const [attachments, setAttachments] = useState([]);
  const [showAttachmentDeleteModal, setShowAttachmentDeleteModal] = useState(
    false
  );
  const [isAttachmentDeleting, setIsAttachmentDeleting] = useState(false);
  const [attachmentForDelete, setAttachmentForDelete] = useState({});
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [currAttachmentTab, setCurrAttachmentTab] = useState("all");

  const dropdownRef = useRef([]);
  // Add state for the seen by modal
  const [showSeenByModal, setShowSeenByModal] = useState(false);
  const [seenByUsers, setSeenByUsers] = useState([]); // Add state for seenByUsers

  // dropdown for all attachments
  const toggleMenu = (index) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };
  useEffect(() => {
    if (isOpen && validTaskId && userInfo?._id) {
      const markTaskAsSeen = async () => {
        try {
          const url = `${BaseUrl}/task/${validTaskId}/${userInfo._id}/`;

          // 1. Fetch current task details to get existing seen_by array
          const currentTaskDetails = await fetchAuthGET(`${BaseUrl}/api/tasks/${validTaskId}/`, false);
      
          let currentSeenBy = currentTaskDetails?.data?.seen_by || [];


          // 2. Add current user to the seen_by array if not already present
          const userId = userInfo._id;
          if (!currentSeenBy.includes(userId)) {
            currentSeenBy = [...currentSeenBy, userId];
          }



          // 3. Send the updated seen_by array in the payload
          const payload = {
            seen_by: currentSeenBy
          };
          await fetchAuthPut(url, { body: payload });
       
        } catch (error) {
          console.error("Error marking task as seen:", error);
        }
      };

      markTaskAsSeen();
    }
  }, [isOpen, validTaskId, userInfo?._id, BaseUrl]); // Dependencies for this effect

  useEffect(() => {
    if (isOpen && validTaskId) {
      const fetchSeenByUsers = async () => {
        try {
          const response = await fetchAuthGET(`${BaseUrl}/api/tasks/${validTaskId}/`, false);
          if (response?.data?.seen_by) {
            // Map seen_by user IDs to user objects from the 'users' prop
            const usersWhoSaw = response.data.seen_by.map(seenById =>
              users.find(user => user.value === seenById)
            ).filter(Boolean); // Filter out undefined users
            setSeenByUsers(usersWhoSaw);
          }
        } catch (error) {
          console.error("Error fetching seen by users:", error);
        }
      };
      fetchSeenByUsers();
    }
  }, [isOpen, validTaskId, BaseUrl, users]); // Add 'users' to dependencies

  const filteredAttachments = attachments?.filter((attachment) => attachment.folder === "attachments")
  const filteredTabAttachments = attachments?.filter((attachment) => {
    switch (currAttachmentTab) {
      case "all":
        return true;
      case "media":
        return ["image", "video"].includes(attachment.type);
      case "documents":
        return ["document", "pdf"].includes(attachment.type);
      default:
        return false;
    }
  });

  // handle outside click for all attachments
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openMenuIndex !== null &&
        dropdownRef.current[openMenuIndex] &&
        !dropdownRef.current[openMenuIndex].contains(event.target)
      ) {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuIndex]);

  // Add effect to update document title
  useEffect(() => {
    if (task?.taskName) {
      document.title = `${task.taskName} - Tasks`;
    } else {
      document.title = "Tasks";
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = "Tasks";
    };
  }, [task?.taskName]);




  // Update formData when task changes, include validTaskId as dependency  useEffect(() => {    // Force refresh component data when task changes    if (task) {      setFormData({        taskName: task?.taskName || "",        projectId: task?.projectId || "",        dueDate: task?.dueDate || "",        userId: task?.userId || "",        description: task?.description || "",        priority: task?.priority || "low",        repeat: task?.repeat || "not_repeatable",        repeat_days: task?.repeat_days || [],      });            // Also update other state variables that depend on task      setDescription(task?.description || "");      setPriority(task?.priority || "low");      setTaskPosition(task?.taskPosition || "pending");      setSelectedDays(task?.repeat_days || []);      setTaskStatus(task?.taskStatus || "pending");            // Reset any loading states      setLoading(false);      setcommentLoading(false);      // Fetch task data immediately when task changes      fetchTaskDetail(validTaskId);      fetchCommentChat(validTaskId);      fetchTaskJourney(validTaskId);      fetchTaskLog(validTaskId);    }  }, [task, validTaskId]);

  // Create a ref to store the sendCommentMessage function
  const sendCommentMessageRef = useRef(null);

  // Function to pause any running timers (for TaskTracking component)
  const pauseCurrentTimer = (taskId) => {
    const taskTrackingElements = document.querySelectorAll("[data-task-id]");
    taskTrackingElements.forEach((element) => {
      const taskTrackingInstance = element.__reactFiber$
        ? element.__reactFiber$.stateNode
        : null;
      if (taskTrackingInstance && taskTrackingInstance.pauseTimer) {
        taskTrackingInstance.pauseTimer(taskId);
      }
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/tasks?taskId=${validTaskId}`)
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

  const handleShare = () => {
    setIsShareModalOpen(true);
    setIsActive(false); // Close the dropdown
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsActive(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  const shareIconSize = 2;

  useEffect(() => {
    setFormData((prev) => ({ ...prev, taskName: task?.taskName || "" }));
  }, [task]);

  const sendCommentMessage = async () => {
    if (comments.trim() === "") return;
    try {
      setcommentLoading(true);
      setIsFocused(false); // Reset focus state after submitting

      // Create a sanitized version of the comment that preserves image tags and formatting
      const sanitizedComment = comments;

      // Find and blur the editor
      const editorElement = document.querySelector(
        ".comment-editor .ql-editor"
      );
      if (editorElement) {
        editorElement.blur();
      }

      const newObject = {
        id: Date.now(),
        message: sanitizedComment,
        taskId: validTaskId,
        sender: userInfo._id,
        ClientSender: userInfo._id,
        sender_name: userInfo.name || userInfo.first_name,
        timestamp: new Date().toISOString(),
      };

      setCommentChat([...commentChat, newObject]);
      setComments("");
      setcommentLoading(false);

      // Scroll to the last comment
      setTimeout(() => {
        const comments = document.querySelectorAll(".comments-section > div");
        if (comments.length > 0) {
          comments[comments.length - 1].scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

      const formData = new FormData();
      formData.append("message", sanitizedComment);

      // Extract user mentions for notifications
      const regex = /data-value="([^"]+)"/g;
      const matches = [];
      let match;
      while ((match = regex.exec(sanitizedComment)) !== null) {
        matches.push(match[1]);
      }

      if (matches?.length > 0) {
        const filteredUsers = users.filter((user) =>
          matches.includes(user.name)
        );
        let namesArray = filteredUsers.map((user) => user.email);
        formData.append("mentionedEmails", JSON.stringify(namesArray));
      }
      if (userInfo?.user_type === "employee") {
        formData.append("sender", userInfo._id);
      } else if (userInfo?.user_type === "client") {
        formData.append("sender", userInfo._id);
      }
      formData.append("taskId", validTaskId);

      // Create a JSON object instead of FormData to better preserve HTML content
      const jsonData = {
        message: sanitizedComment,
        taskId: validTaskId,
        sender: userInfo?._id,
        mentionedEmails:
          matches?.length > 0
            ? JSON.stringify(
              users
                .filter((user) => matches.includes(user.name))
                .map((user) => user.email)
            )
            : undefined,
      };

      // Use JSON content-type for better HTML preservation
      let data;
      if (
        userInfo?.user_type === "employee" ||
        userInfo?.user_type === "client"
      ) {
        data = await fetchAuthPost(
          `${import.meta.env.VITE_APP_DJANGO}/api/task-chats/`,
          { body: jsonData }
        );
      }

      if (data.status) {
        fetchCommentChat(validTaskId);
        fetchTaskJourney(validTaskId);
        fetchTaskLog(validTaskId);
        setComments("");
        setcommentLoading(false);
        await cleanUnusedCommentImages();

        // Update the task comment count in the task row
        if (updateTaskCommentCount) {
          // If we have the current count, increment it, otherwise fetch the latest
          const newCount = commentChat.length + 1;
          updateTaskCommentCount(validTaskId, newCount);
        }

        const taskDetail = await fetchTaskDetail(data?.data?.taskId);

        taskDetail.collaborators.forEach(async (id) => {
          if (userInfo?._id !== id) {
            await sendNotification(
              `${data?.data?.sender_name} comment on ${taskDetail.taskName}`,
              `Comment Update`,
              "userId",
              `${id}`,
              { message: "Task comment" },
              `${baseUrl}/login?redirect=/tasks/?taskId=${data?.data?.taskId}`
            );
          }
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setcommentLoading(false);
    }
  };

  // Store the current sendCommentMessage function in the ref
  useEffect(() => {
    sendCommentMessageRef.current = sendCommentMessage;
  }, [comments, commentChat, validTaskId, userInfo]);

  const modulesDescription = useMemo(
    () =>
      initializeModules(
        userInfo,
        task,
        uploadtoS3,
        setImgLoading,
        users,
        "description"
      ),
    [userInfo]
  );

  const modulesComments = useMemo(
    () =>
      initializeModules(
        userInfo,
        task,
        uploadtoS3,
        setImgLoading,
        users,
        "comments",
        sendCommentMessageRef
      ),
    [userInfo]
  );

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const options = projects.map((project) => ({
    value: project._id,
    label: project.name,
  }));

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
    setFormData({
      taskName: task?.taskName || "",
      projectId: task?.projectId || "",
      dueDate: task?.dueDate || today,
      userId: task?.userId || userInfo?._id,
      description: task?.description || "",
      priority: task?.priority || "",
      repeat: task?.repeat || "not_repeatable",
      repeat_days: task?.repeat_days || [],
    });
    setCurrentID(userInfo?._id || "");

    if (task && validTaskId) {
      fetchCommentChat(validTaskId);
      fetchTaskJourney(validTaskId);
      fetchTaskLog(validTaskId);
    }
  }, [validTaskId]);

  useEffect(() => {
    if (showAddProjectModal) return;

    const handleClickOutside = (event) => {
      const panelElement = document.getElementById("detailsPanel");
      if (isOpen && panelElement && !panelElement.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, showAddProjectModal]);

  // const handleChange = (e, field) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  //   if (field === "taskName") {
  //     task.taskName = e.target.value;
  //     updateTaskFields(validTaskId, "taskName", e.target.value);
  //   }
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "taskName") {
      debouncedUpdate(value);
    }
  };

  const debouncedUpdate = useCallback(
    debounce((value) => {
      if (value.trim() !== "") {
        updateTaskFields(validTaskId, "taskName", value);
      }
    }, 300),
    [validTaskId]
  );

  const repetitionOptions = [
    { value: "not_repeatable", label: "Not Repeatable" },
    { value: "everyday", label: "Everyday" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "custom", label: "Custom" },
  ];

  const handleRepetitionChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, repeat: selectedOption.value }));
    task.repeat = selectedOption.value;
    updateTaskDetails(selectedOption.value, "repeat");
    if (selectedOption.value !== "custom") setSelectedDays([]);
  };

  const handleDaySelection = (day) => {
    const updatedDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(updatedDays);
    updateTaskDetails(updatedDays, "repeat_days");
  };

  const handleProjectChange = async (event, name) => {
    setFormData({ ...formData, [name]: event.value });
    let labelValue = event ? event.label : "";
    if (name === "userId") {
      task.userId = event.value;
      setCurrentID(event.value);
      updateTaskFields(task, "user_name", labelValue);
    } else {
      task.projectId = event.value;
      task.projectName = labelValue;
      updateTaskFields(task, "projectName", labelValue);
    }
    await updateTaskDetails(event.value, name);
  };

  const handleComments = (html) => setComments(html);

  // Create a separate modules configuration for the description editor

  const handleDescChange = (content) => {

    setDescription(content);
    handleDescriptionAutoSave(content);
  };

  function extractImageUrls(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    const images = div.querySelectorAll("img");
    return Array.from(images).map((img) => img.src);
  }

  const updateTaskDetails = async (value, field) => {
    try {
      setLoading(true);
      if (field === "description") {
        setDescription(value);
        setIsSaving(true);
        setSaveSuccess(false);

        const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/api/task/${validTaskId}/attachments/`;
        const response = await fetchAuthGET(apiUrl, false);
        const latestAttachments = response.attachments || [];
        setAttachments(latestAttachments)

        const usedImageUrls = extractImageUrls(value);

        const unusedAttachments = latestAttachments?.filter(
          (att) =>
            att.type === "image" &&
            att.folder === "description" &&
            !usedImageUrls.some((url) => url.startsWith(att.url))
        );

        if (unusedAttachments.length > 0) {
          for (const attachment of unusedAttachments) {
            await fetchAuthDelete(
              `${import.meta.env.VITE_APP_DJANGO
              }/api/task/${validTaskId}/attachments/${attachment.id}/`
            );
          }
          fetchAttachments();
        }

      }

      let payload = new FormData();
      if (field === "isComplete") {
        payload.append(field, 1);
      } else if (field === "taskName") {
        payload.append(field, value);
      } else if (field === "collaborators") {
        value?.forEach((item) => payload.append("collaborators[]", item));
      } else {
        payload.append(field, value);
      }
      let data = await fetchAuthPut(
        `${import.meta.env.VITE_APP_DJANGO}/task/${validTaskId}/${userInfo?._id
        }/`,
        { body: payload }
      );
      if (data.status) {
        if (field === "isComplete") setIsComplete(true);
        if (field === "description") {
          task.description = value;
          setDescription(value);
          setIsSaving(false);
          setSaveSuccess(true);

          // Show success indicator for 2 seconds
          setTimeout(() => {
            setSaveSuccess(false);
          }, 5000);

          // Show a success notification
          toast.success("Description saved successfully", {
            position: "bottom-right",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
        if (field === "taskPosition") setTaskPosition(value);
        if (field === "taskName") task.taskName = value;
        if (field === "priority") setPriority(value);
        if (field === "projectName") task.projectName = value;
        updateTaskFields(validTaskId, field, value);
        fetchTaskJourney(validTaskId);
        fetchTaskLog(validTaskId);
        await notifyAssignee(field, value, task);
        updateTaskCommentCount(validTaskId);
      } else {
        console.error("Error in updating task");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      if (field === "description") {
        setIsSaving(false);
        setSaveSuccess(false);
        toast.error("Failed to save description", {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
        });
      }
      setLoading(false);
    }
  };

  // Function to handle auto-save for description
  const handleDescriptionAutoSave = useCallback(
    debounce((content) => {
      if (content !== task?.description) {
        updateTaskDetails(content, "description");
      }
    }, 5000),
    [task?.description]
  );

  const handleDueDateChange = (e) => {
    const { name, value } = e.target;
    const dateTimeValue = moment(value)
      .set({ hour: 23, minute: 59 })
      .format("YYYY-MM-DDTHH:mm");
    setFormData({ ...formData, [name]: dateTimeValue });
    task.dueDate = dateTimeValue;
    updateTaskDetails(dateTimeValue, name);
  };

  // const handleBlurMethod = (e) => {
  //   if (task.taskName.trim() !== "") {
  //     updateTaskDetails(formData.taskName, "taskName");
  //   }
  // };

  useEffect(() => {
    if (openViaTimeIcon) {
      setActiveTabIndex(3); // Correct index for Time Logs tab
      setTimeout(() => {
        if (latestTimeLogRef.current) {
          latestTimeLogRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          resetOpenViaTimeIcon();
        }
      }, 50);
    }
  }, [openViaTimeIcon, resetOpenViaTimeIcon, taskLogs]);

  useEffect(() => {
    if (openViaAttachmentIcon) {
      setActiveTabIndex(2); // Correct index for All Attachments tab
      setTimeout(() => {
        if (latestAttachmentRef.current) {
          latestAttachmentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          resetOpenViaAttachmentIcon();
        }
      }, 50);
    }
  }, [openViaAttachmentIcon, resetOpenViaAttachmentIcon, attachments]);

  const handleBlurMethod = (e) => {
    const { value } = e.target;
    if (value.trim() !== "") {
      updateTaskDetails(value, "taskName");
    }
  };

  async function fetchTaskDetail(taskId) {
    try {
      const { data } = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${taskId}/`, false
      );
      return data;
    } catch (error) {
      console.error("Error fetching task details:", error);
    }
  }

  function extractAllCommentImageUrls(commentChat) {
    const allImageUrls = [];
    commentChat.forEach((comment) => {
      const div = document.createElement("div");
      div.innerHTML = comment.message || "";
      const images = div.querySelectorAll("img");
      images.forEach((img) => allImageUrls.push(img.src));
    });
    return allImageUrls;
  }

  const cleanUnusedCommentImages = async () => {
    // First fetch the latest comments to ensure we have up-to-date data
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO
        }/api/tasks/chat/${validTaskId}/`;
      const data = await fetchAuthGET(apiUrl, false);
      const latestComments = data?.data || [];

     
      const usedUrls = extractAllCommentImageUrls(latestComments);
   

      const unused = attachments?.filter(
        (att) =>
          att.type === "image" &&
          att.folder === "comments" &&
          !usedUrls.some((url) => url.startsWith(att.url))
      );

   

      if (unused.length > 0) {
        for (const att of unused) {
          await fetchAuthDelete(
            `${import.meta.env.VITE_APP_DJANGO
            }/api/task/${validTaskId}/attachments/${att.id}/`
          );
        }
      }

      // Update the commentChat state with latest data
      setCommentChat(latestComments);
      fetchAttachments(); // Refresh view
    } catch (error) {
      console.error("Error cleaning unused comment images:", error);
    }
  };

  const fetchCommentChat = async (id) => {
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/api/tasks/chat/${id}/`;
      const data = await fetchAuthGET(apiUrl, false);
      setCommentChat(data?.data);

      // Update comment count in parent component when comments are fetched
      if (updateTaskCommentCount && data?.data) {
        updateTaskCommentCount(id, data.data.length);
      }
    } catch (error) {
      console.error("Error fetching task chats:", error);
    }
  };

  const fetchTaskJourney = async (id) => {
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/task-journey/${id}/`;
      const data = await fetchAuthGET(apiUrl, false);
      setTaskJourney(data?.data);
    } catch (error) {
      console.error("Error fetching leave details:", error);
    }
  };

  const fetchTaskLog = async (id) => {
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO
        }/api/task-details/${id}/`;
      const data = await fetchAuthGET(apiUrl, false);
      setTaskLogs(data?.data);
    } catch (error) {
      console.error("Error fetching leave details:", error);
    }
  };

  const DeleteCommentChat = async (id) => {
    try {
      setIsCommentDel(true);
      // REMOVE THE API CALL: This is now handled in the CommentMsg component
      // await fetchAuthDelete(`${import.meta.env.VITE_APP_DJANGO}/api/task-chats/${id}/`);

      // Only update the UI
      setCommentChat((prev) => {
        const updatedComments = prev.filter((item) => item.id !== id);

        // Update the task comment count in the task row
        if (updateTaskCommentCount) {
          updateTaskCommentCount(validTaskId, updatedComments.length);
        }

        return updatedComments;
      });

      // Also remove from pinned comments if it was pinned
      if (pinnedCommentIds.includes(id)) {
        const newPinnedIds = pinnedCommentIds.filter(
          (pinnedId) => pinnedId !== id
        );
        setPinnedCommentIds(newPinnedIds);
        localStorage.setItem(
          `pinned_comments_${validTaskId}`,
          JSON.stringify(newPinnedIds)
        );
      }

    } catch (error) {
      console.error("Error updating UI after comment deletion:", error);
    } finally {
      setIsCommentDel(false);
    }
  };

  const handleEmployeeSelectionChange = (newSelectedEmployees) => {
    updateTaskDetails(newSelectedEmployees, "collaborators");
  };

  const handleChatGPTResponse = async () => {
    try {
      setResponseLoading(true);
      const formatedText = `Generate a brief description for task: "${task?.taskName}"
      Based on user input: ${inputText}`;
      const response = await askChatGPT(formatedText);
      if (response.status === 200) {
        const value = response.data.choices[0].message.content;
        const formattedText = value
          .split(/(?:^|\s)(\d+\.)/g)
          .map((item) => item.trim())
          .filter((item) => item && !/^\d+\.$/.test(item))
          .map((item, i) => {
            // Format special characters and markdown-style formatting
            let formattedItem = item
              // Bold text with **
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
              // Italic text with * or _
              .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
              .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
              // Numbered and bullet lists
              .replace(/^[-•]\s+(.*)/g, '<li class="ml-4">$1</li>')
              .replace(/^\d+\.\s+(.*)/g, '<li class="ml-4 list-decimal">$1</li>')
              // Headings with #
              .replace(/^###\s+(.*)/g, '<h3 class="text-lg font-semibold my-2">$1</h3>')
              .replace(/^##\s+(.*)/g, '<h2 class="text-xl font-semibold my-2">$1</h2>')
              .replace(/^#\s+(.*)/g, '<h1 class="text-2xl font-bold my-3">$1</h1>')
              // Links [text](url)
              .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-500 hover:underline" target="_blank">$1</a>');

            // Return with proper formatting for each item
            if (i === 0) {
              return `<div class="task-description">${formattedItem}</div>`;
            }
            return `<div class="task-item mt-2"><span class="font-medium text-blue-600">${i}.</span> ${formattedItem}</div>`;
          })
          .join("\n");
        if (!description) {
          setDescription(formattedText);
        } else {
          const newDescription = description + formattedText;
          setDescription(newDescription);
        }
        setInputText("");
        setIsModalAiOpen(false);
      }
    } catch (error) {
    } finally {
      setResponseLoading(false);
    }
  };

  const formatUserLabel = ({ value, label, image, name, status }) => {
    const statusInfo = statusMapping[status] || {
      text: "Unknown",
      emoji: "❓",
      color: "bg-gray-400",
    };
    return (
      <div className="flex items-center">
        <div className="relative w-8 h-8 mr-2">
          {image && image !== "null" && image !== null ? (
            <img
              src={image}
              alt={label}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => (e.target.style.display = "none")}
            />
          ) : (
            <span className="bg-[#002D2D] text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-base leading-none">
              {intialLetterName("", "", name)}
            </span>
          )}
        </div>
        <span className="text-sm">{label}</span>
      </div>
    );
  };
  const statusMapping = {
    Active: { emoji: "🟢", color: "bg-green-400", text: "Active" },
    Away: { emoji: "🕒", color: "bg-yellow-400", text: "Away" },
    "Do not disturb": {
      emoji: "⛔",
      color: "bg-red-500",
      text: "Do not disturb",
    },
    "In a meeting": { emoji: "📅", color: "bg-blue-500", text: "In a meeting" },
    "Out sick": { emoji: "🤒", color: "bg-pink-500", text: "Out sick" },
    Commuting: { emoji: "🚗", color: "bg-blue-300", text: "Commuting" },
    "On leave": { emoji: "🌴", color: "bg-purple-500", text: "On leave" },
    Focusing: { emoji: "🔕", color: "bg-gray-500", text: "Focusing" },
    "Working remotely": {
      emoji: "🏠",
      color: "bg-blue-400",
      text: "Working remotely",
    },
    Offline: { emoji: "📴", color: "bg-gray-300", text: "Offline" },
    "Out for Lunch": {
      emoji: "🍽️",
      color: "bg-yellow-300",
      text: "Out for Lunch",
    },
  };

  const userOptions = users
    .filter((user) => user.value !== "0")
    .map((user) => ({
      value: user._id,
      label: user.name,
      image: user.image || null,
      name: user.name,
      status: user.status,
    }));

  const handleAddProject = (e) => {
    e.stopPropagation(); // Prevent the click from bubbling up
    setShowAddProjectModal(true);
  };

  // Handler for toggling pinned comments with persistence
  const handleTogglePin = (commentId) => {
    setPinnedCommentIds((prev) => {
      let newPinnedIds;
      if (prev.includes(commentId)) {
        // Unpin if already pinned
        newPinnedIds = prev.filter((id) => id !== commentId);
      } else {
        // Pin if not already pinned
        newPinnedIds = [...prev, commentId];
      }
      // Save to localStorage
      localStorage.setItem(
        `pinned_comments_${validTaskId}`,
        JSON.stringify(newPinnedIds)
      );
      return newPinnedIds;
    });
  };

  // Handler for editing comments
  const handleEditComment = async (commentId, newMessage) => {
    try {
      // First update the UI optimistically
      setCommentChat((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, message: newMessage, edited: true }
            : comment
        )
      );

      // // Then send the update to the server
      // const formData = new FormData();
      // formData.append("message", newMessage);

      // // Process mentions - use the same regex pattern as in sendCommentMessage
      // const regex = /data-value="([^"]+)"/g;
      // const matches = [];
      // let match;
      // while ((match = regex.exec(newMessage)) !== null) {
      //   matches.push(match[1]);
      // }

      // // Add mentioned users to formData
      // if (matches?.length > 0) {
      //   const filteredUsers = users.filter((user) =>
      //     matches.includes(user.name)
      //   );
      //   let namesArray = filteredUsers.map((user) => user.email);
      //   formData.append("mentionedEmails", JSON.stringify(namesArray));
      // }

      // // Add user info
      // if (userInfo?.user_type === "employee") {
      //   formData.append("sender", userInfo._id);
      // } else if (userInfo?.user_type === "client") {
      //   formData.append("sender", userInfo._id);
      // }

      // // Use the correct API endpoint for updating task chats
      // await fetchAuthPost(
      //   `${import.meta.env.VITE_APP_DJANGO}/api/taskchat/${commentId}/`,
      //   { body: formData }
      // );

      // Refresh comments from server to get the latest data
      fetchCommentChat(validTaskId);

      return true;
    } catch (error) {
      console.error("Error editing comment:", error);

      // Revert the optimistic update on error
      fetchCommentChat(validTaskId);

      throw error;
    }
  };

  // Toggle description editor full screen mode
  const toggleDescriptionFullScreen = () => {
    setIsDescriptionFullScreen(!isDescriptionFullScreen);
    // Add/remove overflow hidden to body to prevent scrolling when in full screen
    if (!isDescriptionFullScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  };

  // Clean up body style when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Apply or remove the border style for the editor based on full screen state
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement("style");
    styleElement.id = "description-fullscreen-style";

    if (isDescriptionFullScreen) {
      // Add the CSS to remove borders when in full screen
      styleElement.textContent = `
        .dashcode-app .ql-editor {
          border: none !important;
        }
      `;
      document.head.appendChild(styleElement);
    } else {
      // Remove the style element if it exists
      const existingStyle = document.getElementById(
        "description-fullscreen-style"
      );
      if (existingStyle) {
        existingStyle.remove();
      }
    }

    // Clean up when component unmounts
    return () => {
      const existingStyle = document.getElementById(
        "description-fullscreen-style"
      );
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isDescriptionFullScreen]);

  // Add CSS for properly styling images in the ReactQuill editor
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.id = "quill-image-styles";
    styleElement.textContent = `
      .ql-editor img.comment-image {
        max-width: 300px;
        height: auto;
        border-radius: 6px;
        margin: 10px 0;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .ql-editor img.comment-image:hover {
        transform: scale(1.02);
      }

      .ql-editor p {
        margin-bottom: 0.5rem;
      }

      .ql-mention-list-container {
      z-index: 9999 !important;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      max-height:320px;
      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15);
    }

    .ql-mention-list-item {
      padding: 0px 0px;
      cursor: pointer;
      white-space: nowrap;
    }

    .ql-mention-list-item.selected {
      background-color: #f3f4f6;
    }

      .ql-editor img {
        max-width: 100%;
        object-fit: contain;
      }

      /* Task description styling */
      .task-description {
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 1rem;
      }

      .task-item {
        padding: 0.5rem 0;
        line-height: 1.5;
      }

      .task-item:hover {
        background-color: rgba(0,0,0,0.02);
      }

      .dark-mode .task-item:hover {
        background-color: rgba(255,255,255,0.05);
      }

      .ql-editor ul, .ql-editor ol {
        padding-left: 1.5rem;
        margin: 0.5rem 0;
      }

      .ql-editor li {
        padding: 0.2rem 0;
      }

    `;
    document.head.appendChild(styleElement);

    // Create a mutation observer to watch for editor content changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" &&
          mutation.target.classList.contains("ql-editor")
        ) {
          const images = mutation.target.querySelectorAll("img");
          images.forEach((img) => {
            if (!img.classList.contains("comment-image")) {
              img.classList.add("comment-image");
            }
          });
        }
      });
    });

    // Start observing both editors
    const descriptionEditor = document.querySelector(
      ".custom-editor .ql-editor"
    );
    const commentsEditor = document.querySelector(
      ".comments-section .ql-editor"
    );

    if (descriptionEditor) {
      observer.observe(descriptionEditor, { childList: true, subtree: true });
    }
    if (commentsEditor) {
      observer.observe(commentsEditor, { childList: true, subtree: true });
    }

    return () => {
      const existingStyle = document.getElementById("quill-image-styles");
      if (existingStyle) {
        existingStyle.remove();
      }
      observer.disconnect();
    };
  }, []);

  const handleTaskComplete = async () => {
    const newPosition = taskPosition === "completed" ? "pending" : "completed";
    setTaskPosition(newPosition); // Update local state immediately
    await updateTaskDetails(newPosition, "taskPosition");
  };

  // Add keyboard shortcut prevention
  useEffect(() => {
    const preventKeyboardShortcuts = (e) => {
      // Check if we're in an input or editor
      const isInInput =
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.className.includes("ql-editor");

      // If we're in an input, allow normal behavior
      if (isInInput) return;

      // List of keys to prevent when used with ctrl/cmd
      const preventedKeys = ["r", "a", "n"];

      // Check if ctrl/cmd is pressed along with our prevented keys
      if (
        (e.ctrlKey || e.metaKey) &&
        preventedKeys.includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Add the event listener when the panel is open
    if (isOpen) {
      document.addEventListener("keydown", preventKeyboardShortcuts, true);
    }

    // Cleanup
    return () => {
      document.removeEventListener("keydown", preventKeyboardShortcuts, true);
    };
  }, [isOpen]);

  const imageSlider = useImageSlider();

  // Function to handle image clicks
  const handleImageClick = (e) => {
    if (e.target.tagName === "IMG") {
      // Get all images from both description and comments
      const descriptionImages = Array.from(
        document.querySelectorAll(".ql-editor img")
      );
      const commentImages = Array.from(
        document.querySelectorAll(".comments-section .ql-editor img")
      );

      // Combine all images and filter out any without valid src
      const allImages = [...descriptionImages, ...commentImages]
        .filter(
          (img) => img.src && img.src !== "null" && img.src !== "undefined"
        )
        .map((img) => img.src);

      // Get the clicked image src
      const clickedImage = e.target.src;

      // Only open slider if we have valid images
      if (allImages.length > 0) {
        imageSlider.openSlider(clickedImage, allImages);
      } else {
        console.warn("No valid images found to display in slider");
      }
    }
  };

  // Add click event listener to both description and comments editors
  useEffect(() => {
    const descriptionEditor = document.querySelector(
      ".custom-editor .ql-editor"
    );
    const commentsEditor = document.querySelector(
      ".comments-section .ql-editor"
    );

    if (descriptionEditor) {
      descriptionEditor.addEventListener("click", handleImageClick);
    }
    if (commentsEditor) {
      commentsEditor.addEventListener("click", handleImageClick);
    }

    return () => {
      if (descriptionEditor) {
        descriptionEditor.removeEventListener("click", handleImageClick);
      }
      if (commentsEditor) {
        commentsEditor.removeEventListener("click", handleImageClick);
      }
    };
  }, []);

  useEffect(() => {
    if (
      openViaComment &&
      latestCommentRef.current &&
      commentChat.length > 0
    ) {
      const raf = requestAnimationFrame(() => {
        latestCommentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        resetOpenViaComment();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [openViaComment, resetOpenViaComment, commentChat]);

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

  const fetchAttachments = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO
        }/api/task/${validTaskId}/attachments/`;
      const response = await fetchAuthGET(apiUrl, false);
      if (response.status) {
        setAttachments(response?.attachments);
        if (updateTaskAttachmentCount && task?.taskId && response?.attachments) {
          updateTaskAttachmentCount(task.taskId, response.attachments.length);
        }
      } else {
        toast.error("Error in fetch attachments");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, []);

  const removeImageFromQuill = async (imageUrl, context = "description") => {
    if (context === "description") {
      const editor = document.querySelector(".custom-editor .ql-editor");
      if (!editor) return;

      const img = editor.querySelector(`img[src="${imageUrl}"]`);
      if (img && img.parentNode) {
        img.parentNode.removeChild(img);
      }

      const updatedHTML = editor.innerHTML;
      setDescription(updatedHTML);
      await updateTaskDetails(updatedHTML, "description");
    }

    if (context === "comments") {
      const updatedComments = await Promise.all(
        commentChat.map(async (comment) => {
          if (!comment.message?.includes(imageUrl)) return comment;

          const div = document.createElement("div");
          div.innerHTML = comment.message;

          const imgs = div.querySelectorAll(`img[src="${imageUrl}"]`);
          imgs.forEach((img) => img.remove());

          const newMessage = div.innerHTML;

          // ✅ Direct PATCH call
          try {
            await fetchAuthPatch(
              `${import.meta.env.VITE_APP_DJANGO}/api/taskchat/${comment.id}/`,
              {
                body: { message: newMessage }
              }
            );
          } catch (err) {
            console.error("Error updating comment after image delete:", err);
          }

          return { ...comment, message: newMessage };
        })
      );

      setCommentChat(updatedComments); // ✅ Update local state
    }
  };

  const handleDeleteAttachment = async (attachment) => {
    setIsAttachmentDeleting(true);
    try {
      const response = await fetchAuthDelete(
        `${import.meta.env.VITE_APP_DJANGO
        }/api/task/${validTaskId}/attachments/${attachment.id}/`
      );
      if (response.status) {
        toast.success(response.message, {
          autoClose: 1000,
        });
        await removeImageFromQuill(attachment.url, attachment.folder);
        fetchAttachments();
      } else {
        toast.error("Delete Attachment Failed");
      }
    } catch (error) {
      console.error(`Delete Attachment Error : ${error}`);
    } finally {
      setIsAttachmentDeleting(false);
      setShowAttachmentDeleteModal(false);
    }
  };

  const handleDownloadAttachment = (attachment) => {
    const link = document.createElement("a");
    link.href = attachment.url;
    link.setAttribute("download", attachment.name || "download");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAttachment = async (attachment) => {
    if (!attachment) return;
    try {
      await navigator.clipboard.writeText(attachment?.url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
      toast.error("Failed to copy link.");
    }
  };

  useEffect(() => {
    // Function to add the mousedown preventDefault listener to mention lists
    function preventBlurOnMentionClick() {
      const mentionContainers = document.querySelectorAll(".ql-mention-list-container");
      mentionContainers.forEach(container => {
        container.addEventListener("mousedown", (e) => {
          e.preventDefault(); // Prevent editor from losing focus
        });
      });
    }

    // Run once on mount or when modulesComments changes
    preventBlurOnMentionClick();

    // Optional: You can also set an interval or mutation observer if mention list appears dynamically later
  }, [modulesComments]);

  // Filter users who have seen the task
  // const seenByUsers = useMemo(() => {
  //   if (!task?.seen_by || !users) return [];
  //   // Ensure unique users, as task.seen_by might contain duplicates or non-existent IDs
  //   const uniqueSeenByIds = [...new Set(task.seen_by)];
  //   return uniqueSeenByIds
  //     .map(seenById => users.find(user => user._id === seenById))
  //     .filter(Boolean); // Filter out any undefined users
  // }, [task?.seen_by, users]);

  return (
    isOpen && validTaskId && (
      <div
        id="detailsPanel"
        className={`fixed z-[999] top-0 right-0 w-[98%] sm:w-[45%] h-full bg-gray-50 shadow-lg transform overflow-auto lg:w-[45%] md:w-[45%] ${isOpen ? "translate-x-0 slide-enter" : "translate-x-full slide-exit"
          } transition-transform duration-300 ease-in-out dark:bg-slate-700`}
      >
        <div className="task-panel-header">
          <div className="action-buttons-container">
            <button
              type="button"
              onClick={handleTaskComplete}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${taskPosition === "completed"
                ? "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                } border border-transparent hover:border-current`}
            >
              <Icon
                icon={
                  taskPosition === "completed"
                    ? "heroicons:check-circle"
                    : "heroicons:check-circle-outline"
                }
                className={`w-5 h-5 ${taskPosition === "completed"
                  ? "text-green-600 dark:text-green-400"
                  : "text-blue-600 dark:text-blue-400"
                  }`}
              />
              {taskPosition === "completed" ? "Completed" : "Mark Complete"}
            </button>

            {task && (
              <FileUpload
                taskId={task.taskId}
                index={task.taskId}
                from="taskpanelTop"
                task={task}
                isOpen={isOpen}
                onClose={onClose}
                fetchAttachments={fetchAttachments}
                totalAttachments={filteredAttachments?.length}
              />
            )}

            <div className="action-icons-group relative">
              <button
                className="action-icon flex items-center gap-1"
                onClick={handleCopyUrl}
                title={isCopy ? "Copied!" : "Copy URL"}
              >
                <Icon icon="uil:copy" className="w-4 h-4" />
                {isCopy && <span className="text-xs text-blue-600">Copied!</span>}
              </button>

              <a
                className="action-icon"
                href={`/screenshots/${validTaskId}`}
                title="Screenshots"
              >
                <Icon icon="mdi:monitor-screenshot" className="w-4 h-4" />
              </a>

              <a
                className="action-icon"
                href={`/timesheet/task-logs/${validTaskId}`}
                title="Task Logs"
              >
                <Icon icon="radix-icons:list-bullet" className="w-4 h-4" />
              </a>

              <div className="relative" ref={containerRef}>
                <div className="relative group">
                  <button className="action-icon" title="Share" onClick={handleShare}>
                    <Icon icon="oi:share" className="w-4 h-4" />
                  </button>
                  {isActive && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg opacity-100 transition-all duration-200 z-50"
                      role="menu"
                    >
                      <div className="py-1">
                        <button
                          onClick={handleShare}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                          role="menuitem"
                        >
                          <Icon icon="ri:whatsapp-fill" className="w-4 h-4 mr-2 text-green-500" />
                          Share on WhatsApp
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
              {!showDeletePopup &&

                <button
                  className="action-icon delete-icon"
                  // onClick={() => { setTaskIdForDelete(task?.taskId); setIsDeleteModalOpen(true) }}
                  onClick={() => { setTaskIdForDelete(task?.taskId); setShowDeletePopup(true) }}
                  title="Delete Task"
                >
                  <Icon icon="ic:delete" className="w-4 h-4" />
                </button>
              }
              {showDeletePopup && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1 ml-2">
                  <span className="text-sm text-red-700 font-medium">Delete task?</span>
                  <div className="flex gap-1">
                    <button
                      onClick={deleteTask}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? "..." : "Yes"}
                    </button>
                    <button
                      onClick={() => setShowDeletePopup(false)}
                      disabled={isDeleting}
                      className="bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-md transition-colors border border-gray-200"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </div>
            {seenByUsers.length > 0 && (
              <div className="flex">
                <Tooltip
                  placement="bottom-start"
                  trigger="mouseenter focus"
                  interactive={true}
                  theme="custom-light"
                  content={
                    <div className="bg-white rounded-md p-4 w-[250px] max-h-[300px] overflow-y-auto shadow-lg">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2 sticky top-0 bg-white py-2">
                        Seen By <span className="text-base"> ({seenByUsers.length})</span>
                      </h4>

                      <div className="space-y-4">
                        {seenByUsers.map((user, index) => (
                          <div key={user.id + "-" + index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {user.image ? (
                                <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                  {intialLetterName(user.name)}
                                </div>
                              )}
                              <span className="text-slate-800 dark:text-slate-200 font-medium">{user.name}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-slate-500 dark:text-slate-400">


                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  }
                >
                  <div
                    className=" flex  items-center  cursor-pointer absolute right-[69px] top-1/2 -translate-y-1/2"
                  >
                    <div className="flex ">
                      {seenByUsers.slice(0, SEEN_BY_DISPLAY_LIMIT).map((user, index) => (
                        user?.image ? (
                          <img
                            key={index}
                            className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover"
                            src={user?.image}
                            alt="Seen By"
                          />
                        ) : (
                          <div
                            key={index}
                            className="w-[25px] h-[25px] rounded-full border-2 border-white flex justify-center items-center font-semibold bg-slate-200 text-f13"
                          >
                            {intialLetterName(user.first_name, user.last_name, user.name)}
                          </div>
                        )
                      ))}
                      {seenByUsers.length > SEEN_BY_DISPLAY_LIMIT && (
                        <div className="w-[25px] h-[25px] rounded-full border-2 border-white bg-slate-200 text-f13 flex justify-center items-center text-gray-700">
                          +{seenByUsers.length - SEEN_BY_DISPLAY_LIMIT}
                        </div>
                      )}
                    </div>
                    {seenByUsers.length > 0 && (
                      <span className="ml-2 text-f13 text-gray-500 dark:text-white">
                        {seenByUsers.length === 1 ? "1 view" : `${seenByUsers.length} seen`}
                      </span>
                    )}
                  </div>
                </Tooltip>
              </div>
            )}
          </div>

          <button onClick={onClose} className="close-button" title="Close">
            <Icon icon="material-symbols-light:close" className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto h-[calc(100%-180px)] ">
          <RowLoader loading={loading} />

          <div className="bg-white dark:bg-slate-700 dark:text-white">
            <div className="p-4">
              <input
                type="text"
                name="taskName"
                className="border rounded px-2 py-1 w-full text-sm text-gray-900 bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600"
                placeholder="Write a Task name..."
                value={formData?.taskName}
                onChange={(e) => handleChange(e, "taskName")}
                onBlur={(e) => handleBlurMethod(e)}
              />
            </div>

            <div className="py-2 px-4">
              <div className="flex items-center">
                <span className="font-semibold mr-2 text-sm">Assign To:</span>
                <div className="py-1 px-2 rounded-lg w-[50%]">
                  <Select
                    instanceId="userId"
                    className="basic-single text-sm"
                    classNamePrefix="select"
                    options={userOptions}
                    value={userOptions.find(
                      (option) => option.value === task?.userId
                    )}
                    onChange={(option) => handleProjectChange(option, "userId")}
                    name="userId"
                    formatOptionLabel={formatUserLabel}
                    components={{
                      MenuList: (props) => (
                        <CustomMenuList
                          {...props}
                          onButtonClick={() => navigate("/invite-user")}
                          buttonText="Invite User"
                        />
                      ),
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="py-2 px-4">
              <div className="flex items-center">
                <span className="font-semibold mr-3 text-sm">Due date: </span>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  placeholder="Due Date and Time"
                  onChange={(e) => handleDueDateChange(e)}
                  value={moment.utc(formData?.dueDate).format("YYYY-MM-DD")}
                  className="text-sm border block rounded-md py-1.5 px-1 text-gray-900 sm:text-sm sm:leading-6 w-[48%]"
                />
                <span className="text-sm ml-3">
                  {moment
                    .utc(formData.dueDate)
                    .format("dddd, MMM DD [at] hh:mm A")}
                </span>
              </div>
            </div>

            <div className="py-2 px-4">
              <div className="flex items-center">
                <span className="font-semibold mr-5 text-sm">Projects: </span>
                <div className="py-1 px-2 rounded-lg w-[50%]">
                  <Select
                    instanceId="projectId"
                    className="text-sm basic-single"
                    classNamePrefix="select"
                    options={options}
                    value={options?.find(
                      (option) => option.value === task?.projectId
                    )}
                    onChange={(e) => handleProjectChange(e, "projectId")}
                    name="projectId"
                    components={{
                      MenuList: (props) => (
                        <CustomMenuList
                          {...props}
                          onButtonClick={handleAddProject}
                          buttonText="Add Project"
                        />
                      ),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Time Tracking Section */}
            <div className="py-2 px-4 border-t border-gray-100 dark:border-slate-600">
              <div className="flex flex-col">
                <h3 className="font-semibold text-sm mb-2">Time Tracking</h3>
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 p-2">
                  <TaskTracking
                    element={task}
                    runningTaskId={runningTaskId}
                    setRunningTaskId={setRunningTaskId}
                    pauseCurrentTimer={pauseCurrentTimer}
                    userInfo={userInfo}
                    onLogsUpdated={() => fetchTaskLog(validTaskId)}
                  />
                </div>
              </div>
            </div>

            <div className="py-2 px-4">
              <div className="flex items-center">
                <span className="font-semibold mr-5 text-sm">Repetition: </span>
                <Select
                  instanceId="repeat"
                  className="text-sm basic-single"
                  classNamePrefix="select"
                  options={repetitionOptions}
                  value={repetitionOptions.find(
                    (option) => option.value === formData.repeat
                  )}
                  onChange={handleRepetitionChange}
                  name="repeat"
                />
              </div>
            </div>

            {formData.repeat == "custom" && (
              <div className="py-2 px-4">
                <span className="font-semibold mr-5 text-sm">
                  Select Days:{" "}
                </span>
                <div className="flex flex-wrap">
                  {[
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                  ].map((day) => (
                    <div key={day} className="flex items-center mr-3">
                      <input
                        type="checkbox"
                        id={day}
                        value={day}
                        checked={selectedDays.includes(day)}
                        onChange={() => handleDaySelection(day)}
                      />
                      <label htmlFor={day} className="ml-2 text-sm">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="py-2 px-4">
              <div className="flex items-center">
                <span className="font-semibold mr-7 text-sm">Priority: </span>
                <Select
                  instanceId="priority"
                  className="text-sm basic-single"
                  classNamePrefix="select"
                  options={priorityOptions}
                  value={priorityOptions.find(
                    (option) => option.value === formData.priority
                  )}
                  onChange={(selectedOption) => {
                    setFormData((prev) => ({
                      ...prev,
                      priority: selectedOption.value,
                    }));
                    task.priority = selectedOption.value
                    updateTaskDetails(selectedOption.value, "priority");
                  }}
                  name="priority"
                />
              </div>
            </div>

            <div className="py-2 px-4">
              <div className="flex items-center">
                <span className="font-semibold mr-7 text-sm">Status: </span>
                <TaskStatus
                  task={task}
                  updateTaskDetails={updateTaskDetails}
                  from="taskpanel"
                  taskPanel
                />

              </div>
            </div>

            <div className="py-2 px-4">
              <div className="flex items-center">
                <span className="font-semibold mr-7 text-sm">
                  Allocated Hours:{" "}
                </span>
                <AllocatedHours
                  task={task}
                  updateTaskDetails={updateTaskDetails}
                />
                <span className="text-sm ml-3">Hours</span>
              </div>
            </div>

            <div className="py-2 px-4 task-panel-attachments">
              <div className="flex items-center">
                <span className="font-semibold mr-5 text-sm">
                  Attachments:{" "}
                </span>

                {task && (
                  <TaskAttachments
                    task={task}
                    isOpen={isOpen}
                    onClose={onClose}
                    fetchAttachments={fetchAttachments}
                    totalAttachments={filteredAttachments?.length}
                  />
                )}
              </div>
              <div className="my-2">
                {filteredAttachments?.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {filteredAttachments?.map((attachment, i) => (
                      <Tooltip
                        key={i}
                        animation="shift-away"
                        theme="custom-light"
                        placement="top"
                        content={
                          <div className="text-xs text-center text-white">
                            <p className="font-medium">{shortenFilename(attachment?.name)}</p>
                            <p className="opacity-80">
                              {attachment?.type} • {attachment?.name?.split(".").pop()?.toLowerCase()}
                            </p>
                          </div>
                        }
                      >
                        <div
                          className={`relative ${attachment?.type === "image" ? "cursor-pointer" : ""} border border-slate-300 rounded-lg flex items-center bg-white shadow-sm hover:shadow-md transition
                ${attachment?.type === "image"
                              ? "hover:bg-blue-50"
                              : attachment?.type === "document"
                                ? "hover:bg-sky-50"
                                : attachment?.type === "pdf"
                                  ? "hover:bg-red-50"
                                  : attachment?.type === "video"
                                    ? "hover:bg-purple-50"
                                    : ""
                            }`}
                          onClick={() => {
                            setAllAttachments(filteredAttachments);
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
                            className="absolute -top-2 -right-2 text-sm text-red-600 rounded-full p-0.5 border border-red-200 bg-white hover:bg-red-50"
                            title="Delete"
                          >
                            <Icon icon="fe:close" className="w-5 h-5" />
                          </button>

                          <div className="p-2">
                            {attachment?.type === "image" && (
                              <img
                                src={attachment?.url}
                                alt=""
                                className="w-16 h-16 object-cover rounded-md border border-gray-200"
                              />
                            )}
                            {attachment?.type === "document" && (
                              <img src={documentIcon} alt="" className="w-16 h-16" />
                            )}
                            {attachment?.type === "pdf" && (
                              <img src={pdfIcon} alt="" className="w-16 h-16" />
                            )}
                            {attachment?.type === "video" && (
                              <img src={videoIcon} alt="" className="w-16 h-16" />
                            )}
                          </div>
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`${isDescriptionFullScreen
                ? "fixed inset-0 z-50 bg-white dark:bg-slate-800 p-6 overflow-auto descriptionFullScreen"
                : "p-4"
                } custom-editor`}
            >
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="description"
                    className="font-semibold text-sm flex items-center"
                  >
                    Description:
                    {isSaving && (
                      <span className="ml-2 text-yellow-500 flex items-center text-xs">
                        <Icon
                          icon="eos-icons:loading"
                          className="animate-spin mr-1"
                        />
                        Saving...
                      </span>
                    )}
                    {saveSuccess && (
                      <span className="ml-2 text-green-500 flex items-center text-xs">
                        <Icon icon="mdi:check-circle" className="mr-1" />
                        Saved
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={toggleDescriptionFullScreen}
                    className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    title={
                      isDescriptionFullScreen
                        ? "Exit Full Screen"
                        : "Full Screen"
                    }
                  >
                    <Icon
                      icon={
                        isDescriptionFullScreen
                          ? "mdi:fullscreen-exit"
                          : "mdi:fullscreen"
                      }
                      className="w-5 h-5"
                    />
                  </button>
                </div>

                <div className="dark:bg-gray-900 dark:text-black-500 relative">
                  <ReactQuill
                    name="description"
                    className={`mt-1 block w-full p-0 text-sm dark:bg-gray-800 ${isDescriptionFullScreen ? "h-[calc(100vh-200px)]" : ""
                      }`}
                    value={description}
                    onChange={handleDescChange}
                    theme="snow"
                    modules={modulesDescription}
                    formats={TaskPanel.formats}
                  />
                  {!isDescriptionFullScreen && (
                    <span
                      className="flex justify-end z-10 absolute right-2 bottom-3 cursor-pointer text-black-500"
                      onClick={() => setIsModalAiOpen(!isModalAiOpen)}
                    >
                      <Icon
                        icon="mdi:sparkles-outline"
                        className="w-6 h-6 cursor-pointer"
                      />
                    </span>
                  )}
                </div>

                {isModalAiOpen && !isDescriptionFullScreen && (
                  <div className="relative">
                    <Textinput
                      type="text"
                      placeholder="Ask to AI"
                      className="my-2"
                      value={inputText}
                      onChange={(event) => setInputText(event.target.value)}
                    />
                    <span
                      onClick={handleChatGPTResponse}
                      className="float-right absolute right-2 bottom-2"
                    >
                      {responseLoading ? (
                        <Icon
                          icon="ic:outline-circle"
                          className="w-6 h-6 cursor-pointer"
                          disabled="true"
                        />
                      ) : (
                        <Icon
                          icon="carbon:send"
                          className="w-6 h-6 cursor-pointer"
                        />
                      )}
                    </span>
                  </div>
                )}

                {/* Save button for small description editor - fixed positioning to prevent overlapping */}
                {!isDescriptionFullScreen && (
                  <div className="flex justify-between mt-6 mb-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mr-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Press{" "}
                        <span className="font-medium mx-1">Enter</span>{" "}
                        for new line. Changes auto-save after typing.
                      </span>
                    </div>

                  </div>
                )}

                {/* Save and Cancel buttons for full screen mode */}
                {isDescriptionFullScreen && (
                  <div className="mt-6 flex justify-end fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg">
                    <div className="flex items-center mr-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Press{" "}
                        <span className="font-medium mx-1">Enter</span>{" "}
                        for new line. Changes auto-save after typing.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateTaskDetails(description, "description");
                        toggleDescriptionFullScreen();
                      }}
                      className="btn btn-dark text-center px-5 py-2 me-2"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <span className="flex items-center">
                          <Icon
                            icon="eos-icons:loading"
                            className="animate-spin mr-2"
                          />
                          Saving...
                        </span>
                      ) : (
                        "Save & Close"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={toggleDescriptionFullScreen}
                      className="btn btn-outline-dark text-center px-5 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-slate-700 text-sm dark:text-gray-300 custom-editor comment-editor">
            <Tab.Group selectedIndex={activeTabIndex} onChange={setActiveTabIndex}>
              <Tab.List className="flex space-x-4 border-b">
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 text-sm font-semibold transition-colors duration-300 ${selected
                      ? "border-primary-500 text-primary-500 border-b-2"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white"
                    }`
                  }
                >
                  Comments
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 text-sm font-semibold transition-colors duration-300 ${selected
                      ? "border-primary-500 text-primary-500 border-b-2"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white"
                    }`
                  }
                >
                  All Activities
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 text-sm font-semibold transition-colors duration-300 ${selected
                      ? "border-primary-500 text-primary-500 border-b-2"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white"
                    }`
                  }
                >
                  All Attachments
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-4 py-2 text-sm font-semibold transition-colors duration-300 ${selected
                      ? "border-primary-500 text-primary-500 border-b-2"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white"
                    }`
                  }
                >
                  Time Logs
                </Tab>
              </Tab.List>

              <Tab.Panels className="mb-60">
                <Tab.Panel className="pt-4">
                  <div className="block my-4">
                    <span className="font-bold">
                      {
                        users?.find((item) => item.value === task?.assignBy)
                          ?.name
                      }{" "}
                    </span>
                    created this task -{" "}
                    {moment
                      .utc(task?.dateCreated)
                      .local()
                      .format("MMM DD [at] hh:mm A")}
                  </div>

                  {/* Pinned Comments Section */}
                  {pinnedCommentIds.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center mb-2 bg-blue-50 dark:bg-slate-800 p-2 rounded-t-md border-b border-blue-200 dark:border-slate-700">
                        <Icon
                          icon="mdi:pin"
                          className="w-5 h-5 mr-2 text-blue-500"
                        />
                        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          Pinned Comments
                        </h3>
                      </div>
                      <div className="bg-blue-50 dark:bg-slate-800 p-3 rounded-b-md shadow-sm">
                        {commentChat
                          ?.filter((comment) =>
                            pinnedCommentIds.includes(comment.id)
                          )
                          .map((data, index) => (
                            <CommentMsg
                              key={`pinned-${index}`}
                              chat={data}
                              DeleteCommentChat={DeleteCommentChat}
                              users={users}
                              isPinned={true}
                              onPinToggle={handleTogglePin}
                              onEditComment={handleEditComment}
                              cleanCommentImages={cleanUnusedCommentImages}
                              setImgLoading={setImgLoading}
                              depth={0}
                              onReply={() => {
                                // Refresh comments after reply
                                fetchCommentChat(validTaskId);
                              }}
                              maxDepth={3}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Comments */}
                  <div className="comments-section">
                    {commentChat?.map((data, index) => (
                      <div
                        key={data.id || index}
                        ref={index === commentChat.length - 1 ? latestCommentRef : null}
                      >
                        <CommentMsg
                          chat={data}
                          DeleteCommentChat={DeleteCommentChat}
                          users={users}
                          isPinned={pinnedCommentIds.includes(data.id)}
                          onPinToggle={handleTogglePin}
                          onEditComment={handleEditComment}
                          cleanCommentImages={cleanUnusedCommentImages}
                          setImgLoading={setImgLoading}
                          depth={0}
                          onReply={() => {
                            // Refresh comments after reply
                            fetchCommentChat(validTaskId);
                          }}
                          maxDepth={3}
                        />
                      </div>
                    ))}
                  </div>
                </Tab.Panel>

                <Tab.Panel className="pt-4">
                  <div className="my-6">
                    {taskJourney?.length > 0 ? (
                      taskJourney?.map((activity) => {
                        const selectedUser = users.find(
                          (user) => user.value === activity.actor
                        );
                        return (
                          <div
                            key={activity.id}
                            className="flex items-start space-x-4 border-b py-3"
                          >
                            <div className="flex-none">
                              {selectedUser?.image ? (
                                <img
                                  src={selectedUser.image}
                                  alt={selectedUser.name}
                                  className="w-[40px] h-[40px] rounded-full border object-cover"
                                />
                              ) : (
                                <div className="text-f13 w-[40px] h-[40px] rounded-full border flex justify-center items-center font-semibold bg-slate-200">
                                  {intialLetterName(activity.actor_name)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 dark:text-white">
                                {activity.actor_name} -{" "}
                                <span className="text-primary-500">
                                  {activity.action_type}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {moment
                                  .utc(activity.timestamp)
                                  .local()
                                  .format("MMM DD [at] hh:mm A")}
                              </div>
                              <div className="text-sm mt-1">
                                {activity.comment}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No activities yet.
                      </p>
                    )}
                  </div>
                </Tab.Panel>

                <Tab.Panel className="pt-4">
                  <div className="px-4 py-2 flex items-center justify-start gap-3">
                    <sapn className={`px-4 py-1 text-sm rounded-full cursor-pointer ${currAttachmentTab === "all" ? "bg-black-900 text-white" : "bg-gray-200"
                      }  `}
                      onClick={() => { setCurrAttachmentTab("all") }}
                    >All</sapn>
                    <sapn className={`px-4 py-1 text-sm rounded-full cursor-pointer ${currAttachmentTab === "media" ? "bg-black-900 text-white" : "bg-gray-200"
                      }  `}
                      onClick={() => { setCurrAttachmentTab("media") }}
                    >Media</sapn>
                    <sapn className={`px-4 py-1 text-sm rounded-full cursor-pointer ${currAttachmentTab === "documents" ? "bg-black-900 text-white" : "bg-gray-200"
                      }  `}
                      onClick={() => { setCurrAttachmentTab("documents") }}
                    >Documents</sapn>
                  </div>
                  <div className="p-4" ref={openViaAttachmentIcon ? latestAttachmentRef : null}>
                    {filteredTabAttachments?.length > 0 ? (
                      filteredTabAttachments?.map((attachment, index) => (
                        <div
                          key={index}
                          className={`border border-slate-300 p-2 rounded-md flex items-center justify-between bg-white mb-2 cursor-pointer ${attachment?.type === "image"
                            ? "hover:bg-blue-50"
                            : attachment?.type === "document"
                              ? "hover:bg-sky-50"
                              : attachment?.type === "pdf"
                                ? "hover:bg-red-50"
                                : attachment?.type === "video"
                                  ? "hover:bg-purple-50"
                                  : ""
                            }`}
                          onClick={() => {
                            setAllAttachments(filteredTabAttachments);
                            handleAttachmentOpen(index);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div>
                              {attachment?.type === "image" && (
                                <img
                                  src={imageIcon}
                                  alt=""
                                  className="w-8 h-8"
                                />
                              )}
                              {attachment?.type === "document" && (
                                <img
                                  src={documentIcon}
                                  alt=""
                                  className="w-8 h-8"
                                />
                              )}
                              {attachment?.type === "pdf" && (
                                <img src={pdfIcon} alt="" className="w-8 h-8" />
                              )}
                              {attachment?.type === "video" && (
                                <img
                                  src={videoIcon}
                                  alt=""
                                  className="w-8 h-8"
                                />
                              )}
                            </div>
                            <div>
                              <p className="text-base">
                                {shortenFilename(attachment?.name)}
                              </p>
                              <p className="text-xs">
                                {attachment?.type}
                                <span className="mx-1">•</span>
                                <span>
                                  {(attachment?.name)
                                    .split(".")
                                    .pop()
                                    .toLowerCase()}
                                </span>
                                {
                                  attachment?.folder &&
                                  <>
                                    <span className="mx-1">•</span>
                                    <span className="text-xs">{attachment?.folder}</span>
                                  </>
                                }
                              </p>

                            </div>
                          </div>
                          {/* Attachment menu dropdown */}
                          <div
                            className="relative"
                            ref={(el) => (dropdownRef.current[index] = el)}
                          >
                            <button
                              className="text-slate-500 hover:bg-slate-300 p-1 rounded-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(index);
                              }}
                            >
                              <Icon
                                icon="heroicons-outline:dots-vertical"
                                className="w-5 h-5"
                              />
                            </button>

                            {openMenuIndex === index && (
                              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 shadow-lg rounded-md z-[9999]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadAttachment(attachment);
                                    setOpenMenuIndex(null);
                                  }}
                                  className="flex items-center gap-2 w-full text-left  p-2 text-sm hover:bg-slate-100 border-b"
                                >
                                  <Icon
                                    icon="material-symbols:download"
                                    className="w-4 h-4"
                                  />
                                  <span>Download</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyAttachment(attachment);
                                    setOpenMenuIndex(null);
                                  }}
                                  className="flex items-center gap-2 w-full text-left  p-2 text-sm hover:bg-slate-100 border-b"
                                >
                                  <Icon icon="cil:copy" className="w-4 h-4" />
                                  <span>Copy URL</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachmentForDelete(attachment);
                                    setShowAttachmentDeleteModal(true);
                                    setOpenMenuIndex(null);
                                  }}
                                  className="flex items-center gap-2 w-full text-left  p-2 text-sm hover:bg-red-100 text-red-500"
                                >
                                  <Icon icon="ic:delete" className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-lg text-center my-8">
                        No attachments found !
                      </p>
                    )}
                  </div>
                </Tab.Panel>

                <Tab.Panel className="pt-4">
                  <div className="p-4 bg-white shadow rounded-lg dark:bg-slate-800" ref={openViaTimeIcon ? latestTimeLogRef : null}>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                      Task Logs
                    </h3>
                    <table className="table-auto w-full border-collapse border border-gray-300">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border border-gray-300 text-left">
                            Total Time
                          </th>
                          <th className="px-4 py-2 border border-gray-300 text-left">
                            Manual Time
                          </th>
                          <th className="px-4 py-2 border border-gray-300 text-left">
                            Automated Time
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="px-4 py-2 border border-gray-300">
                            {taskLogs?.total_time}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {taskLogs?.manual_time}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {taskLogs?.non_manual_time}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <h3 className="text-lg font-semibold mt-6 mb-4 text-gray-800 dark:text-white">
                      Employees
                    </h3>
                    <table className="table-auto w-full border-collapse border border-gray-300">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 border border-gray-300 text-left">
                            Employee
                          </th>
                          <th className="px-4 py-2 border border-gray-300 text-left">
                            Time Spent
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {taskLogs?.employees?.length > 0 ? (
                          taskLogs?.employees?.map((employee, index) => (
                            <tr key={employee.employee_id} ref={index === taskLogs?.employees?.length - 1 && openViaTimeIcon ? latestTimeLogRef : null}>
                              <td className="px-4 py-2 border border-gray-300">
                                <div className="flex items-center">
                                  {employee?.profile_picture ? (
                                    <img
                                      src={employee.profile_picture}
                                      alt={employee.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="rounded-full" key={index}>
                                      <span className="bg-[#002D2D] text-white flex justify-center border-2 border-white items-center rounded-full font-bold text-lg leading-none custom-avatar w-10 h-10 bg-cover bg-center">
                                        {intialLetterName(
                                          employee?.first_name,
                                          employee?.last_name,
                                          employee?.name
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  <span className="ml-3">{employee.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2 border border-gray-300">
                                {employee.time_spent}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-4 py-2 text-center border border-gray-300 text-gray-500"
                            >
                              No task work found for this task.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>

        {showAttachmentDeleteModal && attachmentForDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative max-w-md w-full mx-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden transform transition-all">
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
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-md transition-colors"
                    onClick={() => setShowAttachmentDeleteModal(false)}
                  />

                  <Button
                    text="Delete"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    onClick={() => handleDeleteAttachment(attachmentForDelete)}
                    isLoading={isAttachmentDeleting}
                    icon="mingcute:delete-2-fill"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full z-20 fixed bottom-1 bg-gray-50 dark:bg-slate-700 dark:text-white custom-editor comment-editor taskfooter">
          <RowLoader loading={imgLoading} />
          <div className="comment-editor-wrapper">
            <div className="flex items-start gap-2">
              {userInfo?.image ? (
                <img
                  src={userInfo.image}
                  alt="User"
                  className="w-[25px] h-[25px] rounded-full"
                />
              ) : (
                <p className="text-f13 w-[25px] h-[25px] rounded-full border flex justify-center items-center font-semibold bg-slate-200">
                  {userInfo?.name ? intialLetterName(userInfo.name) : "?"}
                </p>
              )}
              <div className="flex-1">
                <ReactQuill
                  ref={commentInputRef}
                  className={`mt-1 block bg-white dark:bg-slate-700 dark:text-black-500 text-sm w-full p-0 ${!isFocused ? "focus-with-toolbar" : ""
                    }`}
                  name="comments"
                  value={comments}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  onChange={handleComments}
                  theme="snow"
                  modules={modulesComments}
                  formats={TaskPanel.formats}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                  <Icon icon="tabler:keyboard" className="w-3 h-3 mr-1" />
                  Press <span className="font-medium mx-1">Enter</span> to send,{" "}
                  <span className="font-medium mx-1">Shift+Enter</span> for new
                  line
                </div>
              </div>
            </div>

            <div className="dark:bg-slate-700">
              <div className="flex justify-end">
                <button
                  onClick={sendCommentMessage}
                  type="button"
                  className="btn btn-dark text-center px-5 py-2 me-2"
                >
                  {commentLoading ? (
                    <div className="flex mx-2">
                      {" "}
                      <LoaderCircle />{" "}
                    </div>
                  ) : (
                    "Comment"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pb-3 dark:bg-slate-700 dark:text-white">
            <div className="flex items-center justify-between">
              <div className="pr-4 flex items-center mr-2 collaboraters">
                <span className="mx-4 block text-f13 text-gray-500 dark:text-white">
                  Collaborators
                </span>
                <Collaborators
                  employees={users}
                  onSelectionChange={handleEmployeeSelectionChange}
                  className="ml-2 w-[100%] text-f13"
                  task={task}
                />
              </div>
            </div>
          </div>
        </div>

        <AddProject
          showAddProjectModal={showAddProjectModal}
          setShowAddProjectModal={setShowAddProjectModal}
        />

        <ImageSlider
          isOpen={imageSlider.isOpen}
          onClose={imageSlider.closeSlider}
          images={imageSlider.images}
          currentIndex={imageSlider.currentIndex}
          onPrevious={imageSlider.handlePrevious}
          onNext={imageSlider.handleNext}
        />

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          taskId={validTaskId}
          taskName={task?.taskName}
        />
      </div>
    )
  );
};

const initializeModules = (
  userInfo,
  task,
  uploadtoS3,
  setImgLoading,
  users,
  editorContext,
  sendCommentMessageRef,
  fetchAttachments
) => ({
  toolbar: [
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image", "video"],
    ["clean"],
  ],
  keyboard: {
    bindings: {
      enter: {
        key: 13,
        handler: function (range, context) {
          if (editorContext === 'description') {
            // For description editor, always allow Enter to create new line
            return true;
          } else {
            const mentionList = document.querySelector(".ql-mention-list-container");
            const mentionListVisible =
              mentionList &&
              mentionList.offsetParent !== null && // visible check
              mentionList.querySelector(".ql-mention-list-item");

            if (mentionListVisible) {
              // Let mention module handle Enter (select mention)
              return true;
            }
            // Check if shift key is pressed
            if (context.shiftKey) {
              // If Shift+Enter, insert a normal line break (default behavior)
              return true;
            } else {
              // If just Enter, submit the comment and prevent default
              setTimeout(() => {
                const plainText = this.quill.getText().trim();
                const htmlContent = this.quill.root.innerHTML?.trim();

                // Avoid submitting if empty (or just <p><br></p>)
                const isEmpty = !plainText || htmlContent === "<p><br></p>";

                if (!isEmpty) {
                  this.quill.blur();
                  sendCommentMessageRef.current?.(); // Don't rely on stale state
                }
              }, 0);
              return false;
            }
          }
        },
      },
      tab: {
        key: 9,
        handler: function (range, context) {
          // Check if mention list is visible
          const mentionList = document.querySelector(
            ".ql-mention-list-container"
          );
          if (mentionList && mentionList.style.visibility === "visible") {
            // Get the currently selected item
            const selectedItem = mentionList.querySelector(
              '.ql-mention-list-item[data-index="0"]'
            );
            if (selectedItem) {
              // Get the mention data
              const value = selectedItem.getAttribute("data-value");
              const id = selectedItem.getAttribute("data-id");

              // Create a mention item object
              const mentionItem = {
                value: value,
                id: id,
              };

              // Insert the mention
              this.quill.getModule("mention").onSelect(mentionItem, (item) => {
                this.quill.getModule("mention").insertItem(item);
              });

              // Prevent default tab behavior
              return false;
            }
          }
          // If mention list is not visible, allow default tab behavior
          return true;
        },
      },
    },
  },
  mention: {
    allowedChars: /^[A-Za-z\s]*$/,
    mentionDenotationChars: ["@"],
    source: function (searchTerm, renderList) {
      const updatedUsers =
        users && users.length > 0
          ? users.map((user) => ({
            ...user,
            value:
              user.name || `${user.first_name || ""} ${user.last_name || ""}`,
            id: user._id || user.value,
          }))
          : [];

      const matchedUsers = updatedUsers.filter((user) =>
        (user.name || user.label || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );



      renderList(matchedUsers);
    },
    renderItem: function (item) {
      try {
        const hasImage = item && item.image;
        const name =
          item &&
          (item.name ||
            item.label ||
            `${item.first_name || ""} ${item.last_name || ""}`);
        const initials = name
          ? name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
          : "";

        const container = document.createElement("div");
        container.className =
          "flex items-center space-x-2 px-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer";

        if (hasImage) {
          const img = document.createElement("img");
          img.src = item.image;
          img.alt = name;
          img.className = "w-[30px] h-[30px] rounded-full object-cover";
          container.appendChild(img);
        } else {
          const placeholder = document.createElement("div");
          placeholder.className =
            "w-[30px] h-[30px] rounded-full border flex justify-center items-center text-f13 font-semibold bg-slate-200";
          placeholder.textContent = initials;
          container.appendChild(placeholder);
        }

        const nameContainer = document.createElement("div");
        nameContainer.className = "flex flex-col";

        const nameElement = document.createElement("span");
        nameElement.textContent = name;
        nameElement.className = "text-f13 font-medium";
        nameContainer.appendChild(nameElement);

        if (item.role || item.position) {
          const roleElement = document.createElement("span");
          roleElement.textContent = item.role || item.position || "";
          roleElement.className = "text-f11 text-gray-500";
          nameContainer.appendChild(roleElement);
        }

        container.appendChild(nameContainer);
        return container.outerHTML;
      } catch (error) {
        console.error("Error rendering mention item:", error);
        return `<div>${item.name || item.label || "User"}</div>`;
      }
    },
    onSelect: function (item, insertItem) {
      insertItem(item);

      const cursorPos = this.quill.getSelection(true).index;
      this.quill.insertText(cursorPos, " ", Quill.sources.USER);
      this.quill.setSelection(cursorPos + 1, Quill.sources.SILENT);
      this.quill.focus();
    },
    positioningStrategy: 'fixed',
    listItemClass: 'ql-mention-list-item',
    mentionListClass: 'ql-mention-list',
    mentionContainerClass: 'ql-mention-list-container',
    mentionListContainerClass: 'ql-mention-list-container-wrapper',
    mentionListContainerStyle: {
      position: 'absolute',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 9999,
      maxHeight: '320px',
      // overflowY: 'auto',
      width: 'auto',
      minWidth: '200px'
    },
    mentionListStyle: {
      margin: 0,
      padding: 0,
      listStyle: 'none'
    },
    mentionListItemStyle: {
      padding: '8px 12px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    mentionListItemSelectedStyle: {
      backgroundColor: '#f3f4f6'
    }
  },
  imageUploader: {
    upload: async (file) => {
      setImgLoading(true);
      const uploadUrl =
        "https://ht69f1dwe5.execute-api.us-east-1.amazonaws.com/store_task_attachments";
      const companyId = userInfo.companyId;
      const userId = userInfo?._id;
      const taskId = task?.taskId;
      const folder = "comments";
      const fileName =
        file.name + new Date().toISOString().replace(/[-:.TZ]/g, "");
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

        const editorRoot = document.querySelector(".ql-editor");

        const saveAttachment = async () => {
          try {
            await fetchAuthPost(
              `${import.meta.env.VITE_APP_DJANGO
              }/api/task/${taskId}/attachments/`,
              {
                body: JSON.stringify({
                  attachments: [
                    {
                      url: uploadedUrl,
                      type: "image",
                      name: file.name,
                      folder: editorContext,
                    },
                  ],
                }),
              }
            );

            // ✅ Now fetch updated attachments
            await fetchAttachments?.(); // only if it's defined
          } catch (apiError) {
            console.error("Failed to save image attachment to DB:", apiError);
          }
        };

        const alreadyInserted = editorRoot?.querySelectorAll("img");
        const found = Array.from(alreadyInserted || []).some((img) =>
          img.src.includes(uploadedUrl)
        );

        if (found) {
          // ✅ Image already in editor — safe to save
          await saveAttachment();
        } else {
          // 🕵️‍♂️ Wait for image to appear, then save
          await new Promise((resolve) => {
            const observer = new MutationObserver(async (mutations, obs) => {
              for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                  if (
                    node.tagName === "IMG" &&
                    node.src.includes(uploadedUrl)
                  ) {
                    obs.disconnect();
                    await saveAttachment();
                    resolve(); // only resolve after save is complete
                    return;
                  }
                }
              }
            });

            observer.observe(editorRoot, {
              childList: true,
              subtree: true,
            });

            // ⏱️ Optional: Fallback timeout in case image is never inserted
            setTimeout(() => {
              console.warn(
                "Timeout waiting for image insertion, saving anyway."
              );
              observer.disconnect();
              saveAttachment().then(resolve);
            }, 5000);
          });
        }
        return uploadedUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
      } finally {
        setImgLoading(false);
      }
    },
  },
  clipboard: { matchVisual: false },
  "emoji-toolbar": true,
  "emoji-textarea": false,
  "emoji-shortname": true,
});

export default TaskPanel;

TaskPanel.formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "video",
  "mention",
  "code-block",
];
