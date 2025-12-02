import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import moment from "moment";
import Button from "@/components/ui/Button";
import {
  fetchAuthGET,
  fetchAuthPost,
  fetchAuthPut,
  uploadtoS3,
} from "@/store/api/apiSlice";
import { intialLetterName } from "@/helper/helper";
import CommentMsg from "@/features/tasks/components/CommentMsg";
import LoaderCircle from "@/components/Loader-circle";
import { Tab } from "@headlessui/react";
import documentIcon from "@/assets/images/all-img/document.png";
import pdfIcon from "@/assets/images/all-img/pdf.png";
import imageIcon from "@/assets/images/all-img/image.png";
import videoIcon from "@/assets/images/all-img/video.png";
import { useDispatch } from "react-redux";
import {
  deleteTaskAttachment,
  fetchTaskAttachments,
  updateTaskTimeData as updateTaskTimeDataInTasksSlice,
} from "../store/tasksSlice";
// Section-task equivalents for attachments
import {
  fetchSectionTaskAttachments,
  deleteSectionTaskAttachment,
  updateTaskTimeData as updateTaskTimeDataInSectionTaskSlice,
} from "@/features/section-task/store/sectionTaskSlice";
import TaskTracking from "@/components/Task/TaskTracking";

import { ProfilePicture } from "@/components/ui/profilePicture";
import Editor from "react-textflux";
import "react-textflux/dist/react-textflux.css";
import { updateTaskProperty } from "../store/tasksSlice";
import Tooltip from "@/components/ui/Tooltip";

// Add these constants at the top of the file, after imports
const MAX_VIDEO_SIZE_MB = 15;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const TaskDescriptionComments = ({
  task,
  users = [],
  updateTaskCommentCount = () => { },
  updateTaskFields = () => { },
  handleEmployeeSelectionChange = () => { },
  taskAttachments,
  setShowAttachmentDeleteModal,
  setAttachmentForDelete,
  commentChat,
  setCommentChat,
  setAttachmentsForView,
  handleAttachmentOpen,
  activeTab = null, // Don't default to comments tab
  activeTabIndex,
  setActiveTabIndex,
  isExpand,
  from,
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.user);
  const BaseUrl = import.meta.env.VITE_APP_DJANGO;
  const baseUrl = window.location.origin;
  const validTaskId = task?.taskId || task?._id;
  const allUsers = useSelector((state) => state.users.users);

  // WebSocket ref
  const ws = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  // Get commentId from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const commentIdFromUrl = searchParams.get("commentId");
  const isFocusedFromUrl = searchParams.get("isFocused") === "true";

  // State for comment highlighting
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);
  const [hasScrolledToComment, setHasScrolledToComment] = useState(false);

  // Function to clean up URL by removing commentId parameter
  const cleanupUrl = useCallback(() => {
    if (commentIdFromUrl) {
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete("commentId");
      navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
    }
  }, [commentIdFromUrl, location, navigate]);

  // Description state
  const [description, setDescription] = useState(task?.description || "");
  const descriptionRef = useRef(description);
  const [lastDescriptionContent, setLastDescriptionContent] = useState(
    task?.description || "",
  );
  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  const [isDescriptionFullScreen, setIsDescriptionFullScreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [descImgLoading, setDescImgLoading] = useState(false);
  const lastSavedDescription = useRef(task?.description || "");


  // Comments state
  const [comments, setComments] = useState("");
  const [taskJourney, setTaskJourney] = useState([]);
  const [taskLogs, setTaskLogs] = useState({});
  const [commentLoading, setcommentLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pinnedCommentIds, setPinnedCommentIds] = useState(() => {
    const savedPinnedComments = localStorage.getItem(
      `pinned_comments_${validTaskId}`,
    );
    return savedPinnedComments ? JSON.parse(savedPinnedComments) : [];
  });
  const [isCommentDel, setIsCommentDel] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [showCommentBox, setShowCommentBox] = useState(true);
  // Determine if rich-text HTML actually contains meaningful content
  const hasContent = (html) => {
    if (!html) return false;
    // If there is media or attachment-like link, treat as content
    const mediaPattern = /(\<img\b|\<video\b|\<audio\b|\<iframe\b)/i;
    if (mediaPattern.test(html)) return true;
    // Strip common empty HTML artifacts and whitespace
    const textOnly = html
      .replace(/<br\s*\/?>(\s|&nbsp;|&#160;)*$/gi, "")
      .replace(/<br\s*\/?>(\s|&nbsp;|&#160;)*/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;|&#160;|\u200B|\u200C|\u200D|\uFEFF|\s/g, "");
    return textOnly.length > 0;
  };

  // Tabs
  // const [activeTabIndex, setActiveTabIndex] = useState(() => {

  //   // Map activeTab string to the correct tab index
  //   switch (activeTab) {

  //     case "comments":
  //       return 0;
  //     case "all-activities":
  //       return 1;
  //     case "all-attachments":
  //       return 2;
  //     case "time-logs":
  //       return 3;
  //     default:
  //       return -1;
  //   }
  // });

  // Refs
  const latestCommentRef = useRef(null);
  const commentInputRef = useRef(null);
  const sendCommentMessageRef = useRef(null);
  const commentsTabRef = useRef(null);
  const activitiesTabRef = useRef(null);
  const attachmentsTabRef = useRef(null);
  const timeLogsTabRef = useRef(null);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [currAttachmentTab, setCurrAttachmentTab] = useState("all");
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const dropdownRef = useRef([]);
  // dropdown for all attachments
  const toggleMenu = (index) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };
  const filteredTabAttachments = taskAttachments?.filter((attachment) => {
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

  const refreshAttachments = () => {
    if (task?.taskId && task.taskId !== "-") {
      if (from === "section-task") {
        dispatch(fetchSectionTaskAttachments(task.taskId));
      } else {
        dispatch(fetchTaskAttachments(task.taskId));
      }
    }
  };

  // Function to scroll to and highlight a specific comment
  const scrollToComment = useCallback((commentId) => {
    if (!commentId || !commentChat || commentChat.length === 0) {
      return;
    }

    // Find the comment in the chat
    const targetComment = commentChat.find(comment =>
      comment.id?.toString() === commentId?.toString() ||
      comment._id?.toString() === commentId?.toString()
    );

    if (!targetComment) {
      console.warn(`Comment with ID ${commentId} not found`);
      // Clean up URL even if comment not found
      setTimeout(cleanupUrl, 1000);
      return;
    }

    // Set the highlighted comment
    setHighlightedCommentId(commentId);

    // Switch to comments tab if not already there
    if (activeTabIndex !== 0) {
      setActiveTabIndex(0);
    }

    // Wait for the DOM to update and then scroll
    setTimeout(() => {
      const commentElement = commentRefs.current[targetComment.id];
      if (commentElement) {
        // Scroll to the comment
        commentElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });



        // Remove highlight after 3 seconds and clean up URL
        setTimeout(() => {

          setHighlightedCommentId(null);
          cleanupUrl();
        }, 3000);
      }
    }, 300); // Wait for tab switch and DOM update
  }, [commentChat, activeTabIndex, setActiveTabIndex, cleanupUrl]);

  // Effect to handle commentId from URL
  useEffect(() => {
    if (commentIdFromUrl && !hasScrolledToComment && commentChat && commentChat.length > 0) {
      scrollToComment(commentIdFromUrl);
      setHasScrolledToComment(true);
    }
  }, [commentIdFromUrl, hasScrolledToComment, commentChat, scrollToComment]);

  // Reset scroll state when task changes
  useEffect(() => {
    setHasScrolledToComment(false);
    setHighlightedCommentId(null);
  }, [validTaskId]);

  // Fetch comments on mount
  useEffect(() => {
    if (validTaskId) {
      fetchCommentChat(validTaskId);
      fetchTaskJourney(validTaskId);
      fetchTaskLog(validTaskId);
    }
  }, [validTaskId]);

  useEffect(() => {
    setComments(getDraftFromLocal(validTaskId, userInfo._id));
  }, [validTaskId, userInfo._id]);

  // Store the current sendCommentMessage function in the ref
  useEffect(() => {
    sendCommentMessageRef.current = sendCommentMessage;
  }, [comments, commentChat, validTaskId, userInfo]);

  // Comment Draft
  const TASK_DRAFTS_KEY = "task_comment_drafts";

  // Save draft for specific taskId and userId
  function saveDraftToLocal(taskId, userId, draft) {
    const drafts = JSON.parse(localStorage.getItem(TASK_DRAFTS_KEY) || "{}");
    const key = `${taskId}_${userId}`;
    drafts[key] = draft;
    localStorage.setItem(TASK_DRAFTS_KEY, JSON.stringify(drafts));
  }

  // Remove draft for specific taskId and userId
  function removeDraftFromLocal(taskId, userId) {
    const drafts = JSON.parse(localStorage.getItem(TASK_DRAFTS_KEY) || "{}");
    const key = `${taskId}_${userId}`;
    delete drafts[key];
    localStorage.setItem(TASK_DRAFTS_KEY, JSON.stringify(drafts));
  }

  // Get draft for specific taskId and userId
  function getDraftFromLocal(taskId, userId) {
    const drafts = JSON.parse(localStorage.getItem(TASK_DRAFTS_KEY) || "{}");
    const key = `${taskId}_${userId}`;
    return drafts[key] || "";
  }

  const sendTypingStart = (taskId) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
  


    ws.current.send(
      JSON.stringify({
        type: "typing_start",
        task_id: String(taskId),
      })
    );

    // Reset inactivity timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(taskId);
    }, 1000);
  };

  const sendTypingStop = (taskId) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(
      JSON.stringify({
        type: "typing_stop",
        task_id: String(taskId),
      })
    );

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Open WebSocket connection and handle incoming messages
  useEffect(() => {
    if (!userInfo?._id) return;

    ws.current = new WebSocket(`${import.meta.env.VITE_WEBSOCKET_URL}chat/user/${userInfo._id}/`);

    ws.current.onopen = () => {
  
    };

    ws.current.onclose = () => {
    
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (String(data.task_id) !== String(validTaskId)) return;

        if (data.type === "typing_started") {
          setTypingUsers((prev) => {
            if (prev.some((u) => u.id === data.user.id)) return prev;
            return [...prev, data.user];
          });
        } else if (data.type === "typing_stopped") {
          setTypingUsers((prev) =>
            prev.filter((u) => u.id !== data.user.id)
          );
        } else if (data.type === "task_chat_message" && data.message_data) {
          if (data.message_data?.sender === userInfo?._id) return;
          setCommentChat((prev) => {
            if (prev.some((msg) => msg.id === data.message_data.id)) {
              return prev; // skip duplicate
            }
            return [...prev, data.message_data];
          });
        } else if (data.type === "task_chat_delete" && data.message_data) {
          // Remove message with matching id
          setCommentChat((prev) => prev.filter((msg) => msg.id !== data.message_data));
        } else if (data.message_data) {
          setCommentChat((prev) =>
            prev.map((msg) =>
              msg.id === data.message_data.id ? { ...msg, ...data.message_data } : msg
            )
          );
        }
      } catch (err) {
        console.warn("Invalid WebSocket message:", err);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [userInfo?._id, validTaskId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStop(validTaskId);
    };
  }, [validTaskId]);

  // Update tab index when activeTab prop changes
  useEffect(() => {
    let newTabIndex;
    switch (activeTab) {
      case "comments":
        newTabIndex = 0;
        break;
      case "all-activities":
        newTabIndex = 1;
        break;
      case "all-attachments":
        newTabIndex = 2;
        break;
      case "time-logs":
        newTabIndex = 3;
        break;
      default:
        newTabIndex = null;
    }

    if (newTabIndex !== activeTabIndex) {
      setActiveTabIndex(newTabIndex);
    }
  }, [activeTab]);

  // Scroll to the selected tab panel when activeTabIndex changes
  useEffect(() => {
    // Use a slightly longer timeout to ensure the tab panel is fully rendered
    setTimeout(() => {
      let targetRef;
      switch (activeTabIndex) {
        case 0:
          targetRef = commentsTabRef;
          break;
        case 1:
          targetRef = activitiesTabRef;
          break;
        case 2:
          targetRef = attachmentsTabRef;
          break;
        case 3:
          targetRef = timeLogsTabRef;
          break;
        default:
          targetRef = null;
      }

      if (targetRef && targetRef.current) {
        // First scroll the panel into view
        targetRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Then scroll the parent container to show the tab content
        const parentElement = document.querySelector(
          ".custom-editor.comment-editor",
        );
        if (parentElement) {
          parentElement.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }

        // Add focus to the panel for accessibility
        targetRef.current.focus();
      }
    }, 200);
  }, [activeTabIndex]);

  // Create transformLinks function to call the API
  const transformLinks = async (content, from) => {
    if (!content) return content;

    try {
      const data = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/change-message/`, {
        body: { message: content },
      });
      setTimeout(() => {
        let editor;
        if (from === "description") {
          editor = document.querySelector('.description-editor-area .tf-editor-area');
        } else {
          editor = document.querySelector('.comment-editor-area .tf-editor-area');
        }

        if (editor) {
          editor.focus();

          if (editor instanceof HTMLTextAreaElement || editor instanceof HTMLInputElement) {
            // For textarea / input
            editor.value = editor.value + " "; // add space
            const length = editor.value.length;
            editor.setSelectionRange(length, length); // caret after space
          } else {
            // For contenteditable
            // Add a space text node at the end
            editor.innerHTML = editor.innerHTML + "&nbsp;";

            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false); // caret at end
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      }, 200);

      if (data.status === 1) {
        return data.message;
      }
      return content;
    } catch (error) {
      console.error("Error transforming links:", error);
      return content;
    }
  };

  // Create a state to track if we're currently transforming links
  const [isTransformingLinks, setIsTransformingLinks] = useState(false);

  const debouncedSaveDescription = useCallback(
    debounce(async () => {
      // Get the latest content from the ref to avoid stale state
      const contentToSave = descriptionRef.current;
      if (contentToSave !== lastSavedDescription.current) {
        await updateTaskDetails(contentToSave, "description");
        lastSavedDescription.current = contentToSave;
      }
    }, 1000),
    [validTaskId],
  );

  // When task changes, reset description-related state so the editor shows the correct content
  // useEffect(() => {
  //   const nextDescription = task?.description || "";
  //   setDescription(nextDescription);
  //   setLastDescriptionContent(nextDescription);
  //   lastSavedDescription.current = nextDescription;
  // }, [validTaskId, task?.description]);

  // Cancel any pending debounced saves when switching tasks to avoid saving previous task's content
  useEffect(() => {
    return () => {
      if (debouncedSaveDescription?.cancel) {
        debouncedSaveDescription.cancel();
      }
    };
  }, [validTaskId, debouncedSaveDescription]);

  // Create debounced versions of transformLinks
  const debouncedTransformLinks = useCallback(
    debounce(async (content, setContentFunc, from) => {
      setIsTransformingLinks(true);
      try {
        const transformedContent = await transformLinks(content, from);

        if (transformedContent !== content) {
          setContentFunc(transformedContent);
        }
      } finally {
        setIsTransformingLinks(false);
      }
    }, 100),
    [],
  );

  // console.log(description);


  // Functions for description
  const handleDescChange = (content) => {
    // No need to check for content !== description, as the Editor component handles this.
    // This function is only called on actual changes.
    setDescription(content);
    dispatch(updateTaskProperty(validTaskId, "description", content));

    // Check if content was likely pasted by comparing length
    // This is a heuristic - substantial content length increases likely mean paste operations
    if (content.length > lastDescriptionContent.length + 20) {
      // Check if the newly added content contains a URL
      const newContent = content.substring(lastDescriptionContent.length);
      const hasLinks = /https?:\/\/[^\s]+/i.test(newContent);

      if (hasLinks) {
        debouncedTransformLinks(content, setDescription, "description");
      }
    }

    // Update last content for next comparison
    setLastDescriptionContent(content);

    debouncedSaveDescription();
  };

  // Toggle description editor full screen mode
  const toggleDescriptionFullScreen = () => {
    setIsDescriptionFullScreen(!isDescriptionFullScreen);
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

  // Update task details
  const updateTaskDetails = async (value, field) => {
    try {
      if (field === "description") {
        setDescription(value);

        // Generate current UTC time in required format
        const now = new Date();
        const pad = (n, z = 2) => ('00' + n).slice(-z);
        const ms = ('000000' + now.getMilliseconds() * 1000).slice(-6); // microseconds
        const utcString = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}T${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}.${ms}Z`;

        // Update both description and description_updated_at
        updateTaskFields?.(validTaskId, "description", value);
        updateTaskFields?.(validTaskId, "description_updated_at", utcString);

        setIsSaving(true);
        setSaveSuccess(false);

        const usedMediaUrls = extractMediaUrls(value);
        const response = await fetchAuthGET(
          `${import.meta.env.VITE_APP_DJANGO}/api/task/${validTaskId}/attachments/`,
          false,
        );
        const newAttachments = response?.attachments || [];

        const unusedAttachments = newAttachments?.filter(
          (att) =>
            (att.type === "image" || att.type === "video") &&
            att.folder === "description" &&
            !usedMediaUrls.some((url) => url.startsWith(att.url)),
        );
        if (unusedAttachments.length > 0) {
          for (const attachment of unusedAttachments) {
            if (from === "section-task") {
              await dispatch(
                deleteSectionTaskAttachment({
                  taskId: validTaskId,
                  attachmentId: attachment.id,
                }),
              ).unwrap();
            } else {
              await dispatch(
                deleteTaskAttachment({
                  taskId: validTaskId,
                  attachmentId: attachment.id,
                }),
              ).unwrap();
            }
          }
          refreshAttachments();
        }
      }

      // We don't need to transform links again here as we're passing
      // already transformed content to this function
      const finalValue = value;

      let data;

      // Handle arrays like collaborators differently
      if (field === "collaborators" && Array.isArray(finalValue)) {
        // For collaborators, use JSON format instead of FormData
        const jsonData = {
          collaborators: finalValue,
        };

        data = await fetchAuthPut(
          `${BaseUrl}/task/${validTaskId}/${userInfo?._id}/`,
          {
            body: JSON.stringify(jsonData),
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      } else {
        // For other fields, use FormData as before
        let payload = new FormData();
        payload.append(field, finalValue);

        data = await fetchAuthPut(
          `${BaseUrl}/task/${validTaskId}/${userInfo?._id}/`,
          { body: payload },
        );
      }

      if (data.status) {
        if (field === "description") {
          // setDescription(finalValue);
          setIsSaving(false);
          setSaveSuccess(true);
          setTimeout(() => {
            setSaveSuccess(false);
          }, 5000);

          // Show a success notification
          // toast.success("Description saved successfully", {
          //   position: "bottom-right",
          //   autoClose: 2000,
          //   hideProgressBar: true,
          //   closeOnClick: true,
          //   pauseOnHover: true,
          //   draggable: true,
          //   progress: undefined,
          // });
        } else if (field === "collaborators") {
          // Show a success notification for collaborator updates
          toast.success("Collaborators updated successfully", {
            position: "bottom-right",
            autoClose: 2000,
            hideProgressBar: true,
          });
        }

        updateTaskFields?.(validTaskId, field, finalValue);
      } else {
        console.error("Error in updating task");
        if (field === "collaborators") {
          toast.error("Failed to update collaborators", {
            position: "bottom-right",
            autoClose: 3000,
          });
        }
      }
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
      } else if (field === "collaborators") {
        toast.error("Failed to update collaborators", {
          position: "bottom-right",
          autoClose: 3000,
        });
      }
    }
  };

  // Create state to track the last content
  const [lastContent, setLastContent] = useState("");

  const handleComments = (html) => {
    setComments(html);
    sendTypingStart(validTaskId);
    saveDraftToLocal(validTaskId, userInfo?._id, html);

    // Check if content was likely pasted by comparing length
    // This is a heuristic - substantial content length increases likely mean paste operations
    if (html.length > lastContent.length + 10) {
      // Check if the newly added content contains a URL
      const newContent = html.substring(lastContent.length);
      const hasLinks = /https?:\/\/[^\s]+/i.test(newContent);

      if (hasLinks) {
        debouncedTransformLinks(html, setComments, "comment");
      }
    }

    // Update last content for next comparison
    setLastContent(html);
  };

  // Fetch comments
  const fetchCommentChat = async (id) => {
    try {
      const apiUrl = `${BaseUrl}/api/tasks/chat/${id}/`;
      const data = await fetchAuthGET(apiUrl, false);
      setCommentChat(data?.data || []);

      // Update comment count in parent component when comments are fetched
      if (updateTaskCommentCount && data?.data) {
        updateTaskCommentCount(id, data.data.length);
      }
    } catch (error) {
      console.error("Error fetching task chats:", error);
    }
  };

  // Fetch Task Journey
  const fetchTaskJourney = async (id) => {
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/task-journey/${id}/`;
      const data = await fetchAuthGET(apiUrl, false);
      setTaskJourney(data?.data);
    } catch (error) {
      console.error("Error fetching leave details:", error);
    }
  };

  // Fetch Task logs
  const fetchTaskLog = async (id) => {
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO
        }/api/task-details/${id}/`;
      const response = await fetchAuthGET(apiUrl, false);
      if (response.status) {
        setTaskLogs(response.data);

        // Update Redux state with new time data
        if (response.data?.total_time !== undefined) {
          const timeUpdate = {
            taskId: id,
            total_time: response.data.total_time,
            timer_type: response.data.timer_type,
          };

          // Dispatch to both slices (one will handle it based on which view is active)
          dispatch(updateTaskTimeDataInTasksSlice(timeUpdate));
          dispatch(updateTaskTimeDataInSectionTaskSlice(timeUpdate));
        }
      }
    } catch (error) {
      console.error("Error fetching task logs:", error);
    }
  };

  // Send comment
  const sendCommentMessage = async () => {
    if (comments.trim() === "") return;
    try {
      setcommentLoading(true);
      setIsFocused(false); // Reset focus state after submitting

      // Create a sanitized version of the comment that preserves image tags and formatting
      const sanitizedComment = comments;

      // Transform links before sending
      const transformedComment = await transformLinks(sanitizedComment);

      const newObject = {
        id: Date.now(),
        message: transformedComment,
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

      // Extract user mentions for notifications
      const regex = /data-value="([^"]+)"/g;
      const matches = [];
      let match;
      while ((match = regex.exec(sanitizedComment)) !== null) {
        matches.push(match[1]);
      }

      // Create a JSON object instead of FormData to better preserve HTML content
      const jsonData = {
        message: transformedComment, // Use the transformed comment
        taskId: validTaskId,
        sender: userInfo?._id,
        mentionedEmails:
          matches?.length > 0
            ? JSON.stringify(
              users
                .filter((user) => matches.includes(user.name))
                .map((user) => user.email),
            )
            : undefined,
      };

      // Use JSON content-type for better HTML preservation
      let data;
      if (
        userInfo?.user_type === "employee" ||
        userInfo?.user_type === "client"
      ) {
        data = await fetchAuthPost(`${BaseUrl}/api/task-chats/`, {
          body: jsonData,
        });
      }

      if (data?.status) {
        setActiveTabIndex(0)
        fetchCommentChat(validTaskId);
        removeDraftFromLocal(validTaskId, userInfo?._id);
        setComments("");
        setcommentLoading(false);
        await cleanUnusedCommentImages();

        // Update the task comment count in the task row
        if (updateTaskCommentCount) {
          // If we have the current count, increment it, otherwise fetch the latest
          const newCount = commentChat.length + 1;
          updateTaskCommentCount(validTaskId, newCount);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setcommentLoading(false);
    }
  };

  // Delete comment
  const DeleteCommentChat = async (id) => {
    try {
      setIsCommentDel(true);

      // Update the UI
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
          (pinnedId) => pinnedId !== id,
        );
        setPinnedCommentIds(newPinnedIds);
        localStorage.setItem(
          `pinned_comments_${validTaskId}`,
          JSON.stringify(newPinnedIds),
        );
      }
    } catch (error) {
      console.error("Error updating UI after comment deletion:", error);
    } finally {
      setIsCommentDel(false);
    }
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
        JSON.stringify(newPinnedIds),
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
            : comment,
        ),
      );

      // Refresh comments from server to get the latest data
      fetchCommentChat(validTaskId);

      return true;
    } catch (error) {
      console.error("Error editing comment:", error);
      fetchCommentChat(validTaskId);
      throw error;
    }
  };

  function extractAllCommentMediaUrls(commentChat) {
    const allMediaUrls = [];
    commentChat.forEach((comment) => {
      const div = document.createElement("div");
      div.innerHTML = comment.message || "";

      // Extract image URLs
      const images = div.querySelectorAll("img");
      images.forEach((img) => allMediaUrls.push(img.src));

      // Extract video URLs
      const videos = div.querySelectorAll("video");
      videos.forEach((video) => allMediaUrls.push(video.src));
    });
    return allMediaUrls;
  }

  const cleanUnusedCommentImages = async () => {
    // First fetch the latest comments to ensure we have up-to-date data
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO
        }/api/tasks/chat/${validTaskId}/`;
      const data = await fetchAuthGET(apiUrl, false);
      const latestComments = data?.data || [];

      const usedUrls = extractAllCommentMediaUrls(latestComments);

      const unused = taskAttachments?.filter(
        (att) =>
          (att.type === "image" || att.type === "video") &&
          att.folder === "comments" &&
          !usedUrls.some((url) => url.startsWith(att.url)),
      );

      if (unused.length > 0) {
        for (const att of unused) {
          if (from === "section-task") {
            await dispatch(
              deleteSectionTaskAttachment({
                taskId: validTaskId,
                attachmentId: att.id,
              }),
            ).unwrap();
          } else {
            await dispatch(
              deleteTaskAttachment({
                taskId: validTaskId,
                attachmentId: att.id,
              }),
            ).unwrap();
          }
        }
      }

      // Update the commentChat state with latest data
      setCommentChat(latestComments);
      refreshAttachments(); // Refresh view
    } catch (error) {
      console.error("Error cleaning unused comment media:", error);
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
  // In your component:
  const commentRefs = useRef({});
  const seenComments = useRef(new Set());

  useEffect(() => {
    if (!commentChat || commentChat.length === 0) return;

    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const commentId = entry.target.dataset.id;
          if (
            entry.isIntersecting &&
            entry.intersectionRatio === 1 &&
            commentId &&
            !seenComments.current.has(commentId)
          ) {
            seenComments.current.add(commentId);

            // Find the full comment data to get the database ID
            const comment = commentChat.find(c => c.id.toString() === commentId || (c._id && c._id.toString() === commentId));
            const dbId = comment?.id || comment?._id;
            if (comment?.seen_by?.includes(userInfo?._id)) {
              seenComments.current.add(commentId);
            
              return;
            }

            seenComments.current.add(commentId);
            if (dbId) {
              fetchAuthPost(`${BaseUrl}/api/notify-comment-viewed/${dbId}/user/${userInfo?._id}/`, {
                body: {},
              });
            }
          }
        });
      },
      { threshold: 1.0 }
    );

    // Observe all comment elements
    Object.values(commentRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [commentChat, BaseUrl, userInfo?._id]);

  const handleDownloadAttachment = async (attachment) => {
    try {
      // First, try the fetch approach for non-CORS restricted files
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name || "download"; // clean filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Fetch download failed, trying fallback method:", error);

      // Fallback method for CORS-restricted files (like AWS S3 images)
      try {
        const link = document.createElement("a");
        link.href = attachment.url;
        link.download = attachment.name || "download";
        link.target = "_blank"; // Open in new tab as fallback
        link.rel = "noopener noreferrer";

        // For images, we might need to force download by setting the filename
        if (attachment.type === "image") {
          // Try to add download attribute with proper filename
          const urlParts = attachment.url.split('/');
          const filename = attachment.name || urlParts[urlParts.length - 1] || 'image';
          link.download = filename;
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError);
        // Final fallback - just open the URL in a new tab
        window.open(attachment.url, '_blank', 'noopener,noreferrer');
      }
    }
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

  const getTimestampedFilename = (originalName) => {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
    const dot = originalName.lastIndexOf(".");
    if (dot === -1) return `${originalName}_${timestamp}`;
    return `${originalName.slice(0, dot)}_${timestamp}${originalName.slice(dot)}`;
  };

  // for showing relative time
  const getRelativeTime = (utcTimestamp) => {
    if (!utcTimestamp) return "";

    const now = new Date();
    const past = new Date(utcTimestamp);
    const diffMs = now - past; // difference in milliseconds

    if (diffMs < 0) return ""; // future date guard

    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 10) {
      // less than 10 seconds
      return "just now";
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 1) {
      return `${diffSeconds} ${diffSeconds === 1 ? 'second' : 'seconds'} ago`;
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'min' : 'mins'} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  // Update handleMediaUpload to accept folder
  const handleMediaUpload = async (file, type, folder) => {
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error("File size exceeds the maximum allowed size of 15MB");
      return;
    }
    const fileType = getFileCategory(file);
    setImgLoading(true);
    const uploadUrl =
      "https://ht69f1dwe5.execute-api.us-east-1.amazonaws.com/store_task_attachments";
    const companyId = userInfo.companyId;
    const userId = userInfo?._id;
    const taskId = task?.taskId || task?._id;
    // const fileName = file.name + new Date().toISOString().replace(/[-:.TZ]/g, "");
    const fileName = getTimestampedFilename(file.name);
    try {
      const uploadedUrl = await uploadtoS3(
        uploadUrl,
        companyId,
        userId,
        taskId,
        folder,
        fileName,
        file,
      );
      // Save attachment to database
      const response = await fetchAuthPost(
        `${import.meta.env.VITE_APP_DJANGO}/api/task/${taskId}/attachments/`,
        {
          body: JSON.stringify({
            attachments: [
              {
                url: uploadedUrl,
                type: fileType,
                name: file.name,
                folder: folder,
              },
            ],
          }),
        },
      );
      if (response.status) {
        if (from === "section-task") {
          dispatch(fetchSectionTaskAttachments(task.taskId));
        } else {
          dispatch(fetchTaskAttachments(task.taskId));
        }
      }

      return {
        url: uploadedUrl,
        type: fileType,
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
    const taskId = task?.taskId || task?._id;
    const fileName = getTimestampedFilename(file.name);
    const folder = "attachments";

    try {
      setIsUploading(true);

      const uploadedUrl = await uploadtoS3(
        uploadUrl,
        companyId,
        userId,
        taskId,
        folder,
        fileName,
        file
      );

      const response = await fetchAuthPost(
        `${import.meta.env.VITE_APP_DJANGO}/api/task/${taskId}/attachments/`,
        {
          body: JSON.stringify({
            attachments: [
              {
                url: uploadedUrl,
                type: fileType,
                name: file.name,
                folder: folder,
              },
            ],
          }),
        }
      );

      if (response.status && response.attachments?.length > 0) {
        const att = response.attachments.at(-1);
        newValue += `<a href="${att.url}" target="_blank" rel="noopener noreferrer" class="tf-link" contenteditable="false">${att.name}</a><br/>`;

        if (from === "section-task") {
          dispatch(fetchSectionTaskAttachments(task.taskId));
        } else {
          dispatch(fetchTaskAttachments(task.taskId));
        }
      }
    } catch (error) {
      toast.error("Failed to upload file: " + file.name);
    } finally {
      setIsUploading(false);
    }

    setTimeout(() => {
      setValue(newValue);
      if (updateTaskDetailsIfNeeded) {
        updateTaskDetailsIfNeeded(newValue, field);
      }
    }, 0);
  };
  const handleEnter = async (e) => {
    e.preventDefault();
    await sendCommentMessage();
  };

  const handleInsertCommentLink = (commentLinkHtml) => {
    setShowCommentBox(true)
    // Insert the fetched formatted comment link HTML into comment editor value
    setComments(commentLinkHtml);
  };

  function formatTime(timeStr) {
    // Assumes format 'HH:MM:SS'
    const [h, m, s] = timeStr.split(':').map(Number);
    let result = '';
    if (h) result += `${h}h `;
    if (m) result += `${m}m`;
    if (s) result += `${s}s`;
    return result.trim();
  }

  return (
    <>
      {/* Description Section */}
      <div
        className={`${isDescriptionFullScreen
          ? "fixed inset-0 z-50 bg-white dark:bg-slate-800 p-6 overflow-auto descriptionFullScreen"
          : "p-0 bg-white dark:bg-slate-800"
          } custom-editor relative`}
      >
        {/* Loader overlay for description upload */}
        {descImgLoading && (
          <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 pointer-events-auto`}
          >
            <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <Icon
                icon="eos-icons:loading"
                className="text-4xl text-primary-500 mb-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">
                Uploading...
              </span>
            </div>
          </div>
        )}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="description"
              className="font-semibold text-sm flex items-center text-[#747474] dark:text-slate-300"
            >
              Description:
              {task?.description_updated_at && (
                <Tooltip
                  content={
                    task?.description_updated_at
                      ? moment(task?.description_updated_at).format("MMM D, YYYY [at] h:mma")
                      : "Unknown time"
                  }
                  placement="top"
                  arrow={true}
                  theme="custom-light"
                  animation="shift-away"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {getRelativeTime(task?.description_updated_at)} (edited)
                  </span>
                </Tooltip>
              )}
            </label>
            <button
              type="button"
              onClick={toggleDescriptionFullScreen}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              title={
                isDescriptionFullScreen ? "Exit Full Screen" : "Full Screen"
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

          <div className="relative description-editor-area"
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
                  updateTaskDetailsIfNeeded: updateTaskDetails
                });
              }
            }}
            onDragOver={e => e.preventDefault()}
          >
            <Editor
              className={`mt-1 block w-full p-0 text-sm quill-editor-main dark:text-gray-100 ${isDescriptionFullScreen ? "h-[calc(100vh-200px)]" : ""}`}
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
              onChange={handleDescChange}
              onMediaUpload={(file, type) =>
                handleMediaUpload(file, type, "description")
              }
              mediaFullscreen={true}
            />
          </div>

          {isUploading && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
              <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                <Icon
                  icon="eos-icons:loading"
                  className="text-4xl text-primary-500 mb-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  Uploading...
                </span>
              </div>
            </div>
          )}

          {/* Save button for small description editor */}
          {!isDescriptionFullScreen && (
            <div className="flex justify-between mb-2 pt-2 dark:border-gray-700">
              <div className="flex items-center mr-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Press <span className="font-medium mx-1">Enter</span> for new
                  line. Changes auto-save after typing.
                </span>
              </div>
            </div>
          )}

          {/* Save and Cancel buttons for full screen mode */}
          {isDescriptionFullScreen && (
            <div className="mt-6 flex justify-end fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg">
              <div className="flex items-center mr-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Press <span className="font-medium mx-1">Enter</span> for new
                  line. Changes auto-save after typing.
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

      {/* All Tabs Section */}
      <div className="p-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-gray-300 custom-editor comment-editor">
        <Tab.Group selectedIndex={activeTabIndex} onChange={setActiveTabIndex}>
          <Tab.List
            className={`flex space-x-1 border-b border-slate-200 dark:border-slate-600 overflow-x-auto pb-1 w-full ${from === "inbox" ? "2xl:space-x-4" : "sm:space-x-4 no-scrollbar"}`}
          >
            <Tab
              className={({ selected }) =>
                `px-2 ${from === "inbox" ? "2xl:px-4" : "sm:px-4"} py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${selected
                  ? "border-primary-500 text-primary-500 border-b-2"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`
              }
            >
              Comments
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-2 ${from === "inbox" ? "2xl:px-4" : "sm:px-4"} py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${selected
                  ? "border-primary-500 text-primary-500 border-b-2"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`
              }
            >
              All Activities
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-2 ${from === "inbox" ? "2xl:px-4" : "sm:px-4"} py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${selected
                  ? "border-primary-500 text-primary-500 border-b-2"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`
              }
            >
              All Attachments
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-2 ${from === "inbox" ? "2xl:px-4" : "sm:px-4"} py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${selected
                  ? "border-primary-500 text-primary-500 border-b-2"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`
              }
            >
              Time Logs {taskLogs?.total_time && taskLogs?.total_time !== "00:00:00" &&
                <span className="text-sm text-blue-600" title={`Total time log - ${taskLogs?.total_time}`}>
                  {`[${formatTime(taskLogs?.total_time)}]`}
                </span>}
            </Tab>
          </Tab.List>

          <Tab.Panels className={showCommentBox ? "mb-40 sm:mb-28" : "-mb-24"}>
            <Tab.Panel ref={commentsTabRef} className="pt-4" tabIndex="-1">
              <div className="block mb-4 text-slate-700 dark:text-slate-300 text-sm">
                <span className="font-bold">
                  {
                    users?.find((item) => item.value === task?.assignBy)?.name
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
                      className="w-4 h-4 mr-2 text-blue-500"
                    />
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      Pinned Comments
                    </h3>
                  </div>
                  <div className="bg-blue-50 dark:bg-slate-800 p-3 rounded-b-md">
                    {commentChat
                      ?.filter((comment) =>
                        pinnedCommentIds.includes(comment.id),
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
                          setImgLoading={setImgLoading}
                          cleanCommentImages={cleanUnusedCommentImages}
                          setAttachmentsForView={setAttachmentsForView}
                          handleAttachmentOpen={handleAttachmentOpen}
                          handleMediaUpload={handleMediaUpload}
                          isHighlighted={highlightedCommentId === data.id?.toString() || highlightedCommentId === data._id?.toString()}
                          onInsertCommentLink={handleInsertCommentLink}
                          taskId={validTaskId}
                          scrollToComment={scrollToComment}
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
                    data-id={data.id}
                    ref={el => {
                      commentRefs.current[data.id] = el;
                      if (index === commentChat.length - 1) latestCommentRef.current = el;
                    }}
                  >
                    <CommentMsg
                      chat={data}
                      DeleteCommentChat={DeleteCommentChat}
                      users={users}
                      isPinned={pinnedCommentIds.includes(data.id)}
                      onPinToggle={handleTogglePin}
                      onEditComment={handleEditComment}
                      setImgLoading={setImgLoading}
                      cleanCommentImages={cleanUnusedCommentImages}
                      setAttachmentsForView={setAttachmentsForView}
                      handleAttachmentOpen={handleAttachmentOpen}
                      handleMediaUpload={handleMediaUpload}
                      isHighlighted={highlightedCommentId === data.id?.toString() || highlightedCommentId === data._id?.toString()}
                      onInsertCommentLink={handleInsertCommentLink}
                      taskId={validTaskId}
                      scrollToComment={scrollToComment}
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

            <Tab.Panel
              ref={activitiesTabRef}
              className="pt-4"
              tabIndex="-1"
              style={{
                scrollbarWidth: "none",
              }}
            >
              <div className="mb-6 px-1 sm:px-2">
                {taskJourney?.length > 0 ? (
                  (() => {
                    // Grouping logic
                    const groups = [];
                    let lastGroup = null;
                    const TIME_GAP_MINUTES = 60; // 1 hour

                    for (let i = 0; i < taskJourney.length; i++) {
                      const activity = taskJourney[i];
                      const prev =
                        lastGroup?.activities?.[
                        lastGroup.activities.length - 1
                        ];

                      // Helper: get date string (YYYY-MM-DD)
                      const activityDate = moment(activity.timestamp).format(
                        "YYYY-MM-DD",
                      );
                      const prevDate = prev
                        ? moment(prev.timestamp).format("YYYY-MM-DD")
                        : null;

                      // Helper: time diff in minutes
                      const timeDiff = prev
                        ? moment(activity.timestamp).diff(
                          moment(prev.timestamp),
                          "minutes",
                        )
                        : null;

                      // Start new group if:
                      // - different user
                      // - different date
                      // - time gap > 1 hour
                      if (
                        !lastGroup ||
                        activity.actor !== lastGroup.actor ||
                        activityDate !== prevDate ||
                        timeDiff > TIME_GAP_MINUTES
                      ) {
                        lastGroup = {
                          actor: activity.actor,
                          actor_name: activity.actor_name,
                          actor_image: (
                            users.find((u) => u.value === activity.actor) || {}
                          ).image,
                          activities: [activity],
                          date: activityDate,
                        };
                        groups.push(lastGroup);
                      } else {
                        lastGroup.activities.push(activity);
                      }
                    }

                    // Get primary color (purple) from branding
                    const primaryColor = "rgb(122, 57, 255)";
                    const primaryColorLight = "rgba(122, 57, 255, 0.1)";

                    // Render groups with timeline style
                    return groups.map((group, groupIdx) => (
                      <div
                        key={groupIdx}
                        className="mb-8 animate-fade-in-up relative"
                      >
                        {/* Timeline connector */}
                        {groupIdx > 0 && (
                          <div className="absolute -top-6 left-4 sm:left-6 h-6 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                        )}

                        {/* Group Header with timeline dot */}
                        <div className="flex items-start relative">
                          {/* Timeline dot */}
                          <div className="relative z-10">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white dark:border-slate-700 shadow-md flex-shrink-0 overflow-hidden bg-white dark:bg-slate-800">
                              <ProfilePicture
                                user={{
                                  name: group.actor_name,
                                  image: group.actor_image,
                                }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          {/* Name and date */}
                          <div className="ml-3 sm:ml-4 flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                              {group.actor_name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {(() => {
                                // If today, show 'Today', else formatted date
                                const today = moment().format("YYYY-MM-DD");
                                if (group.date === today) {
                                  return `Today at ${moment(group.activities[0].timestamp).format("hh:mm A")}`;
                                } else {
                                  return moment(
                                    group.activities[0].timestamp,
                                  ).format("MMM DD, YYYY [at] hh:mm A");
                                }
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Activities with timeline */}
                        <div className="mt-3 pl-4 sm:pl-6 ml-0 sm:ml-2 relative">
                          {/* Vertical timeline line */}
                          <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 -ml-[2px]"></div>

                          <div className="flex flex-col gap-4 relative">
                            {group.activities.map((activity, idx) => {
                              // Determine color based on action type
                              let bgColor, textColor, borderColor, icon;
                              if (
                                activity.action_type
                                  .toLowerCase()
                                  .includes("created")
                              ) {
                                bgColor = "bg-green-50 dark:bg-green-900/20";
                                textColor =
                                  "text-green-700 dark:text-green-400";
                                borderColor =
                                  "border-green-200 dark:border-green-700";
                                icon = "heroicons:plus-circle";
                              } else if (
                                activity.action_type
                                  .toLowerCase()
                                  .includes("assigned")
                              ) {
                                bgColor = "bg-blue-50 dark:bg-blue-900/20";
                                textColor = "text-blue-700 dark:text-blue-400";
                                borderColor =
                                  "border-blue-200 dark:border-blue-700";
                                icon = "heroicons:user-plus";
                              } else if (
                                activity.action_type
                                  .toLowerCase()
                                  .includes("updated") ||
                                activity.action_type
                                  .toLowerCase()
                                  .includes("changed")
                              ) {
                                bgColor = "bg-amber-50 dark:bg-amber-900/20";
                                textColor =
                                  "text-amber-700 dark:text-amber-400";
                                borderColor =
                                  "border-amber-200 dark:border-amber-700";
                                icon = "heroicons:pencil-square";
                              } else if (
                                activity.action_type
                                  .toLowerCase()
                                  .includes("deleted") ||
                                activity.action_type
                                  .toLowerCase()
                                  .includes("removed")
                              ) {
                                bgColor = "bg-red-50 dark:bg-red-900/20";
                                textColor = "text-red-700 dark:text-red-400";
                                borderColor =
                                  "border-red-200 dark:border-red-700";
                                icon = "heroicons:trash";
                              } else if (
                                activity.action_type
                                  .toLowerCase()
                                  .includes("completed")
                              ) {
                                bgColor = "bg-teal-50 dark:bg-teal-900/20";
                                textColor = "text-teal-700 dark:text-teal-400";
                                borderColor =
                                  "border-teal-200 dark:border-teal-700";
                                icon = "heroicons:check-circle";
                              } else if (
                                activity.action_type
                                  .toLowerCase()
                                  .includes("pending") ||
                                activity.action_type
                                  .toLowerCase()
                                  .includes("started")
                              ) {
                                bgColor = "bg-purple-50 dark:bg-purple-900/20";
                                textColor =
                                  "text-purple-700 dark:text-purple-400";
                                borderColor =
                                  "border-purple-200 dark:border-purple-700";
                                icon = "heroicons:clock";
                              } else {
                                bgColor = "bg-gray-50 dark:bg-slate-800/60";
                                textColor = "text-gray-700 dark:text-gray-300";
                                borderColor =
                                  "border-gray-200 dark:border-gray-700";
                                icon = "heroicons:information-circle";
                              }

                              return (
                                <div
                                  key={activity.id || idx}
                                  className="relative"
                                >
                                  {/* Timeline dot for activity */}
                                  <div className="absolute -left-4 sm:-left-6 top-3 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 z-10 transform -translate-x-1/2"></div>

                                  <div
                                    className={`rounded-lg ${bgColor} p-3 sm:p-4 flex flex-col gap-2 border ${borderColor} shadow-sm ml-2 animate-fade-in-up`}
                                  >
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Icon and action type badge */}
                                      <div
                                        className={`flex items-center gap-1 ${textColor} text-xs font-semibold px-2 py-1 rounded-full animate-pop-in`}
                                      >
                                        <Icon
                                          icon={icon}
                                          className="w-3.5 h-3.5"
                                        />
                                        <span className="capitalize">{activity.action_type?.replace(/_/," ")}</span>
                                      </div>

                                      {/* Time with tooltip */}
                                      <span
                                        className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer ml-auto"
                                        title={moment(
                                          activity.timestamp,
                                        ).format(
                                          "MMMM DD, YYYY [at] hh:mm:ss A",
                                        )}
                                      >
                                        {moment(activity.timestamp).format(
                                          "hh:mm A",
                                        )}
                                      </span>
                                    </div>

                                    {/* Rich comment/message with better formatting for mobile */}
                                    {activity.comment && (
                                      <div
                                        className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1 break-words"
                                        dangerouslySetInnerHTML={{
                                          __html: activity.comment,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ));
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                      <Icon
                        icon="heroicons:clock"
                        className="w-8 h-8 text-slate-400 dark:text-slate-500"
                      />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No activities recorded yet.
                    </p>
                  </div>
                )}
              </div>
            </Tab.Panel>

            <Tab.Panel ref={attachmentsTabRef} className="pt-4" tabIndex="-1">
              <div className="px-4 py-2 flex items-center justify-start gap-3">
                <sapn
                  className={`px-4 py-1 text-sm rounded-full cursor-pointer ${currAttachmentTab === "all"
                    ? "bg-black-900 text-white"
                    : "bg-gray-200 dark:bg-slate-600"
                    }  `}
                  onClick={() => {
                    setCurrAttachmentTab("all");
                  }}
                >
                  All
                </sapn>
                <sapn
                  className={`px-4 py-1 text-sm rounded-full cursor-pointer ${currAttachmentTab === "media"
                    ? "bg-black-900 text-white"
                    : "bg-gray-200 dark:bg-slate-600"
                    }  `}
                  onClick={() => {
                    setCurrAttachmentTab("media");
                  }}
                >
                  Media
                </sapn>
                <sapn
                  className={`px-4 py-1 text-sm rounded-full cursor-pointer ${currAttachmentTab === "documents"
                    ? "bg-black-900 text-white"
                    : "bg-gray-200 dark:bg-slate-600"
                    }  `}
                  onClick={() => {
                    setCurrAttachmentTab("documents");
                  }}
                >
                  Documents
                </sapn>
              </div>
              <div className="p-4">
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
                        setAttachmentsForView(filteredTabAttachments);
                        handleAttachmentOpen(index);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          {attachment?.type === "image" && (
                            <img
                              src={attachment?.url}
                              alt=""
                              className="w-8 h-8 object-contain"
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
                            <img src={videoIcon} alt="" className="w-8 h-8" />
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
                            {attachment?.folder && (
                              <>
                                <span className="mx-1">•</span>
                                <span className="text-xs">
                                  {attachment?.folder}
                                </span>
                              </>
                            )}
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
                  <p className="text-sm text-center my-8">
                    No attachments found !
                  </p>
                )}
              </div>
            </Tab.Panel>

            <Tab.Panel ref={timeLogsTabRef} className="pt-4" tabIndex="-1">
              <div className="mb-6">
                {/* Timer Control Section */}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2 sm:mb-0">
                    Time Tracking
                  </h3>

                  {/* Improved mobile responsive layout for TaskTracking */}
                  <div className="w-full sm:w-auto flex justify-end mt-2 bg-white dark:bg-slate-800 rounded-md border p-1">
                    <TaskTracking
                      element={task}
                      runningTaskId={runningTaskId}
                      setRunningTaskId={setRunningTaskId}
                      pauseCurrentTimer={pauseCurrentTimer}
                      userInfo={userInfo}
                      onLogsUpdated={() => {
                        // Refresh logs when updated
                        fetchTaskLog(task?.taskId);
                      }}
                    />
                  </div>
                </div>

                {/* Summary Table - More mobile friendly */}
                <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-slate-200">
                  Time Summary
                </h3>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                    <thead className="bg-gray-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Total Time
                        </th>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Manual Time
                        </th>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Automated Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-700 dark:divide-gray-600">
                      <tr>
                        <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                          {taskLogs?.total_time || "0:00"}
                        </td>
                        <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                          {taskLogs?.total_manual_time || "0:00"}
                        </td>
                        <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                          {taskLogs?.total_automated_time || "0:00"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Employees Table - More mobile friendly */}
                <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-slate-200">
                  Employee Time Breakdown
                </h3>
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                    <thead className="bg-gray-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Employee
                        </th>
                        <th className="px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Time Spent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-700 dark:divide-gray-600">
                      {taskLogs?.work?.length > 0 ? (
                        taskLogs.work.flatMap((dateEntry, dateIndex) => [
                          // Date row
                          <tr key={`date-${dateEntry.date}`}>
                            <td className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">
                              {(() => {
                                const date = new Date(dateEntry.date);
                                const day = date
                                  .getDate()
                                  .toString()
                                  .padStart(2, "0");
                                const month = (date.getMonth() + 1)
                                  .toString()
                                  .padStart(2, "0");
                                const year = date.getFullYear();
                                return `${day}/${month}/${year}`;
                              })()}
                            </td>
                            <td
                              colSpan="2"
                              className="px-3 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                            >
                              Total: {dateEntry.date_total_time}
                            </td>
                          </tr>,
                          // User rows for this date
                          ...dateEntry.user.map((user, userIndex) => (
                            <tr
                              key={`date-${dateEntry.date}-user-${user.employee_id || userIndex}`}
                            >
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300"></td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                                <div className="flex items-center">
                                  {(() => {
                                    // Find matching user from the users array by ID
                                    const matchingUser = users.find(
                                      (u) =>
                                        u.value === user.employee_id ||
                                        u._id === user.employee_id,
                                    );

                                    if (matchingUser?.image) {
                                      return (
                                        <img
                                          src={matchingUser.image}
                                          alt={user.employee_name}
                                          className="w-6 h-6 rounded-full object-cover mr-2"
                                        />
                                      );
                                    } else {
                                      return (
                                        <div className="bg-[#002D2D] text-white flex justify-center items-center rounded-full font-medium text-xs w-6 h-6 mr-2">
                                          {intialLetterName(user.employee_name)}
                                        </div>
                                      );
                                    }
                                  })()}
                                  {user.employee_name}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-gray-300">
                                {user.total_time || "0:00"}
                              </td>
                            </tr>
                          )),
                        ])
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                          >
                            No task work found for this task.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Comment Input */}
      <div className="w-full bg-white dark:bg-slate-800 dark:text-white custom-editor comment-editor quill-comments-area">
        {/* Loader overlay for comment upload */}
        {imgLoading && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 pointer-events-auto">
            <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <Icon
                icon="eos-icons:loading"
                className="text-4xl text-primary-500 mb-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">
                Uploading...
              </span>
            </div>
          </div>
        )}
        <div
          className={`comment-editor-wrapper px-2 pt-2 pb-2 sm:px-4 ${showCommentBox ? "sm:pt-4" : ""} fixed bottom-14 border-y border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${isExpand ? "w-[calc(100%-80px)] right-10 border-x" : "w-full right-0"}`}
        >
          {
            typingUsers && typingUsers.filter(user => user.id != userInfo._id).length > 0 &&
            <div className="flex items-center space-x-1 px-10 py-1 -mt-4 ">
              <div className="flex -space-x-2 overflow-hidden ">
                {
                  typingUsers && typingUsers.filter(user => user.id != userInfo._id).slice(0, 2).map((user, i) => {
                    const userData = allUsers.find(u => u._id == user.id);
                    return userData ? (
                      <ProfilePicture
                        key={i}
                        user={userData}
                        className={`w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 object-cover relative ${i === 0 ? 'z-20' : 'z-10'}`}
                      />
                    ) : null;
                  })
                }
                {/* Show +X indicator if more than 2 users */}
                {typingUsers && typingUsers.filter(user => user.id != userInfo._id).length > 2 && (
                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                    +{typingUsers.length - 2}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {(() => {
                  const typingUserInfos = typingUsers.filter(user => user.id != userInfo._id)
                    .map(user => allUsers.find(u => u._id == user.id))
                    .filter(Boolean);
                  if (typingUserInfos.length === 1) {
                    return `${typingUserInfos[0].name} is typing`;
                  } else if (typingUserInfos.length === 2) {
                    return `${typingUserInfos[0].name} and ${typingUserInfos[1].name} are typing`;
                  } else if (typingUserInfos.length > 2) {
                    return `${typingUserInfos[0].name} and ${typingUserInfos.length - 1} others are typing`;
                  }
                  return '';
                })()}
                <Icon icon="svg-spinners:3-dots-bounce" className="text-lg inline ml-1 text-gray-500" />
              </span>
            </div>
          }
          {
            showCommentBox &&
            <div className="flex items-start gap-2">
              <ProfilePicture user={userInfo} className="w-7 h-7 rounded-full border object-cover flex-shrink-0" />
              <div className="comment-editor-area flex-1 min-w-0"
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

                  if (docFiles.length === 1) {
                    const file = docFiles[0];
                    if (file.size > MAX_VIDEO_SIZE_BYTES) {
                      toast.error("File size exceeds 15MB");
                      return;
                    }

                    handleEditorDropGeneric(e, {
                      currentValue: comments,
                      setValue: setComments,
                      field: "comments",
                      folderName: "comments",
                      updateTaskDetailsIfNeeded: null
                    });
                  }
                }}
                onDragOver={e => e.preventDefault()}
              >
                <Editor
                  className="mt-1 block text-sm w-full p-0"
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
                  value={comments}
                  onChange={handleComments}
                  onMediaUpload={(file, type) =>
                    handleMediaUpload(file, type, "comments")
                  }
                  onEnter={handleEnter}
                  mediaFullscreen={true}
                />
                <div className="sm:flex justify-between flex-wrap items-center mt-2">
                  {/* <div className="text-xs text-slate-600 dark:text-gray-400 flex items-center">
                    <Icon icon="tabler:keyboard" className="w-3 h-3 mr-1" />
                    Press <span className="font-medium mx-1">Enter</span> to send,{" "}
                    <span className="font-medium mx-1">Shift+Enter</span> for new
                    line
                  </div> */}

                  <button
                    onClick={() => setShowCommentBox(!showCommentBox)}
                    className="flex py-2 items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    title={showCommentBox ? "Hide Comment Box" : "Show Comment Box"}
                  >
                    <Icon
                      icon={showCommentBox ? "mdi:comment-remove-outline" : "mdi:comment-text-outline"}
                      width="12"
                      height="12"
                    />
                    {showCommentBox ? "Hide" : "Show"}
                  </button>

                  <div className="bg-white dark:bg-slate-700 mt-2 sm:mt-0">
                    <div className="flex justify-end">
                      {hasContent(comments) && (

                        <Button
                          text={commentLoading ? "commenting..." : "Comment"}
                          className="bg-white dark:bg-electricBlue-50 dark:border-slate-700 dark:border text-electricBlue-100 dark:text-white py-0.5 px-3 rounded-md flex items-center border font-normal border-solid border-neutral-50 "
                          iconClass="font-bold text-lg mr-1"
                          onClick={sendCommentMessage}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
          {
            !showCommentBox &&
            <button
              onClick={() => setShowCommentBox(!showCommentBox)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title={showCommentBox ? "Hide Comment Box" : "Show Comment Box"}
            >
              <Icon
                icon={showCommentBox ? "mdi:comment-remove-outline" : "mdi:comment-text-outline"}
                width="12"
                height="12"
              />
              {showCommentBox ? "Hide" : "Show"}
            </button>
          }

        </div>
      </div>

      {/* Keep the CSS styles for comment section */}
      <style jsx>{`
        .comment-editor-wrapper {
          z-index: 30;
        }
        .ql-tooltip {
          left: 114px !important;
          position: relative;
          right: 0px !important;
          transform: translateX(-10px) !important;
          min-width: 150px;
          text-align: right;
        }
        @media (max-width: 600px) {
          .ql-tooltip {
            display: none !important;
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Keep general styles */
        :global(.ql-toolbar) {
          z-index: 50 !important;
        }
        :global(.ql-container) {
          z-index: 40 !important;
        }
        /* Mobile optimizations */
        @media (max-width: 640px) {
          :global(.ql-toolbar) {
            padding: 4px !important;
          }
          :global(.ql-toolbar .ql-formats) {
            margin-right: 6px !important;
          }
          :global(.ql-toolbar button) {
            width: 22px !important;
            height: 22px !important;
          }
        }
      `}</style>
    </>
  );
};

export default TaskDescriptionComments;

/* Inject animation keyframes and classes at the bottom of the component */
<style jsx global>{`
  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(24px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @keyframes pop-in {
    0% {
      transform: scale(0.7);
      opacity: 0;
    }
    80% {
      transform: scale(1.1);
      opacity: 1;
    }
    100% {
      transform: scale(1);
    }
  }
  .animate-pop-in {
    animation: pop-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
`}</style>;