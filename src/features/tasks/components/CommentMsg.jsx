import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import DOMPurify from "dompurify";
import {
  fetchAuthPost,
  fetchAuthDelete,
  fetchAuthPut,
  uploadtoS3,
  fetchAuthGET,
  fetchAuthPatch,
} from "@/store/api/apiSlice";
import { intialLetterName } from "@/helper/helper";
import { djangoBaseURL } from "@/helper";
import { Icon } from "@iconify/react";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { debounce } from "lodash";
// Remove ReactQuill imports
import "quill-emoji/dist/quill-emoji.css";
import ImageSlider from "@/components/ui/ImageSlider";
import useImageSlider from "@/hooks/useImageSlider";
import Tooltip from "@/components/ui/Tooltip";
import { ProfilePicture } from "@/components/ui/profilePicture";
// Import TextFlux
import Editor from "react-textflux";
import "react-textflux/dist/react-textflux.css";

// Remove Quill registrations
// const BlockEmbed = Quill.import('blots/block/embed');
// class VideoBlot extends BlockEmbed {
//   static create(value) {
//     const node = super.create();
//     node.setAttribute('contenteditable', 'false');
//     node.setAttribute('data-video', true);
//     // Create video element with controls
//     const video = document.createElement('video');
//     video.setAttribute('controls', true);
//     video.setAttribute('src', value);
//     video.setAttribute('class', 'quill-video');
//     video.setAttribute('preload', 'auto');
//     video.setAttribute('width', '100%');
//     node.appendChild(video);
//     return node;
//   }
//   static value(node) {
//     const video = node.querySelector('video');
//     return video ? video.getAttribute('src') : '';
//   }
// }
// VideoBlot.blotName = 'video';
// VideoBlot.tagName = 'div';
// Quill.register(VideoBlot);

// Update the styles to include mention dropdown
const editorStyles = `
.comment-textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: white;
  color: #1e293b;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
}

.dark .comment-textarea {
  background-color: #1e293b;
  border-color: #475569;
  color: #f8fafc;
}

.comment-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.comment-editor-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Reply thread styles */
.reply-thread {
  position: relative;
}



.dark .reply-thread::before {
  background: linear-gradient(to bottom, #4b5563, transparent);
}

.reply-toggle-btn {
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 4px 8px;
}

.reply-toggle-btn:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.dark .reply-toggle-btn:hover {
  background-color: rgba(59, 130, 246, 0.2);
}

.reply-form {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nested-replies {
  animation: slideDown 0.3s ease-out;
}

/* Mention dropdown styles */
.mention-dropdown {
  position: absolute;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  width: 250px;
}

.dark .mention-dropdown {
  background-color: #1e293b;
  border-color: #475569;
}

.mention-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mention-item:hover {
  background-color: #f3f4f6;
}

.dark .mention-item:hover {
  background-color: #334155;
}

.mention-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
}

.mention-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.dark .mention-name {
  color: #f8fafc;
}

.mention-role {
  font-size: 12px;
  color: #64748b;
}

.mention-tag {
  display: inline-block;
  background-color: #e0f2fe;
  color: #0369a1;
  border-radius: 4px;
  padding: 1px 4px;
  margin: 0 2px;
}

.dark .mention-tag {
  background-color: #0c4a6e;
  color: #7dd3fc;
}
`;

// Function to convert URLs to clickable links
const linkify = (text) => {
  if (!text) return "";

  let linkedText = text;

  // First, handle the case of @https:// specifically which is causing issues
  linkedText = linkedText.replace(
    /(@)(https?:\/\/\S+)/gi,
    function (match, atSymbol, url) {
      // Keep @ in display but remove it from the actual link
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">@${url}</a>`;
    }
  );

  // Then handle normal URLs (without @ prefix)
  linkedText = linkedText.replace(
    /(^|\s|[^@])(https?:\/\/\S+)(\s|$)/gi,
    function (match, prefix, url, suffix) {
      const cleanUrl = url.replace(/[.,;:!?]$/, ""); // Remove trailing punctuation
      return `${prefix}<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${cleanUrl}</a>${suffix}`;
    }
  );

  // Finally handle task paths
  linkedText = linkedText.replace(
    /(^|\s)(\/tasks\?[a-zA-Z0-9=&-]+)(\s|$)/gi,
    function (match, prefix, path, suffix) {
      return `${prefix}<a href="${path}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${path}</a>${suffix}`;
    }
  );

  return linkedText;
};

// Configure DOMPurify to allow anchor tags and their attributes
DOMPurify.addHook("afterSanitizeAttributes", function (node) {
  // Handle links
  if (node.nodeName && node.nodeName.toLowerCase() === "a") {
    // Set target and rel attributes for security
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
    // Add styling to links
    node.classList.add("text-blue-500", "hover:underline");
  }

  // Handle images - preserve their attributes
  if (node.nodeName && node.nodeName.toLowerCase() === "img") {
    // Ensure images have proper styling and attributes
    node.classList.add(
      "max-w-full",
      "sm:max-w-xs",
      "rounded-md",
      "my-2",
      "cursor-pointer"
    );

    // Only add style if it doesn't exist
    if (!node.hasAttribute("style")) {
      node.setAttribute("style", "max-height: 200px;");
    }

    // If alt is missing, add it
    if (!node.getAttribute("alt")) {
      node.setAttribute("alt", "Uploaded Image");
    }

    // Make sure the src attribute is preserved exactly as is
    if (node.hasAttribute("src")) {
      const src = node.getAttribute("src");
      if (src) {
        // Protect the src from being modified by ensuring it's set directly
        node.setAttribute("src", src);
      }
    }
  }
});

// Configure DOMPurify to allow image elements and their attributes
const purifyConfig = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "p",
    "br",
    "img",
    "span",
    "div",
    "ul",
    "ol",
    "li",
    "code",
    "pre",
    // Add video and source tags
    "video",
    "source",
  ],
  ALLOWED_ATTR: [
    "href",
    "target",
    "rel",
    "src",
    "alt",
    "class",
    "style",
    "data-denotation-char",
    "data-id",
    "data-value",
    "data-index",
    "width",
    "height",
    // Add video attributes
    "controls",
    "preload",
    "type",
    "contenteditable",
    "data-video",
  ],
  ADD_ATTR: ["target", "rel"], // Always add target="_blank" and rel="noopener noreferrer" to links
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  FORBID_TAGS: ["style", "script"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
};

// Function to calculate relative time (e.g. "2 mins ago")
const getRelativeTime = (date) => {
  // Check if date is valid first
  if (!date) {
    return "just now";
  }

  try {
    const dateObj = new Date(date);
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "just now";
    }

    const seconds = Math.floor((new Date() - dateObj) / 1000);

    // Handle negative time differences (future dates or clock skew)
    if (seconds < 0) {
      return "just now";
    }

    let interval = seconds / 31536000; // seconds in a year

    if (interval >= 1) {
      const years = Math.floor(interval);
      return years + (years === 1 ? " year ago" : " years ago");
    }
    interval = seconds / 2592000; // seconds in a month
    if (interval >= 1) {
      const months = Math.floor(interval);
      return months + (months === 1 ? " month ago" : " months ago");
    }
    interval = seconds / 86400; // seconds in a day
    if (interval > 1) {
      const days = Math.floor(interval);
      return days + (days === 1 ? " day ago" : " days ago");
    }
    interval = seconds / 3600; // seconds in an hour
    if (interval > 1) {
      const hours = Math.floor(interval);
      return hours + (hours === 1 ? " hour ago" : " hours ago");
    }
    interval = seconds / 60; // seconds in a minute
    if (interval > 1) {
      const mins = Math.floor(interval);
      return mins + (mins === 1 ? " min ago" : " mins ago");
    }
    if (seconds < 10) {
      return "just now";
    }
    return Math.floor(seconds) + (seconds === 1 ? " second ago" : " seconds ago");
  } catch (error) {
    console.error("Error calculating relative time:", error);
    return "just now";
  }
};

const CommentMsg = ({
  chat,
  DeleteCommentChat,
  users,
  isPinned,
  onPinToggle,
  onEditComment,
  cleanCommentImages,
  setImgLoading,
  setAttachmentsForView,
  handleAttachmentOpen,
  handleMediaUpload,
  isHighlighted = false,
  onInsertCommentLink,
  taskId,
  scrollToComment,
  depth = 0, // New prop to track nesting depth
  onReply, // New prop for handling replies
  maxDepth = 3 // Maximum nesting depth
}) => {
  const userInfo = useSelector((state) => state.auth.user);
  const { deletedUserIds, deletedData } = useSelector((state) => state.users || { deletedUserIds: [], deletedData: [] });
  const [isDelete, setIsDelete] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relativeTime, setRelativeTime] = useState(
    getRelativeTime(chat?.timestamp)
  );
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);
  const replyEditorRef = useRef(null);
  const today = moment().startOf("day");
  const chatTimestamp = moment.utc(chat?.timestamp).startOf("day");
  const isBeforeToday = chatTimestamp.isBefore(today);
  const [liked, setLiked] = useState(chat?.likes?.includes(userInfo?._id));
  const [likes, setLikes] = useState(chat?.likes);
  const [showDropdown, setShowDropdown] = useState(false);
  const commentDropdownRef = useRef(null);

  // New state for reply functionality
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const mentionDropdownRef = useRef(null);

  const imageSlider = useImageSlider();

  // Helper function to check if reply message is empty (handles HTML content)
  const isReplyMessageEmpty = useMemo(() => {
    if (!replyMessage) return true;

    // Remove HTML tags and check if there's actual text content
    const textContent = replyMessage
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove other HTML entities
      .trim();

    return textContent.length === 0;
  }, [replyMessage]);

  // New function to handle reply submission
  const handleSubmitReply = useCallback(async () => {
    // Use the same empty check logic as isReplyMessageEmpty
    if (isReplyMessageEmpty) return;

    setIsSubmittingReply(true);
    try {
      // Transform links before submitting the reply
      const transformedReplyMessage = await transformLinks(replyMessage);

      // Extract mentions from reply message (prefer data-id, fallback to data-value)
      const mentionIdRegex = /data-id="([^"]+)"/g;
      const mentionNameRegex = /data-value="([^"]+)"/g;
      const mentions = [];
      let m;
      while ((m = mentionIdRegex.exec(transformedReplyMessage)) !== null) {
        mentions.push({ id: String(m[1]) });
      }
      if (mentions.length === 0) {
        let n;
        while ((n = mentionNameRegex.exec(transformedReplyMessage)) !== null) {
          mentions.push({ name: n[1] });
        }
      }

      // Construct payload in the exact format specified
      const payload = {
        taskId: taskId,
        sender: userInfo._id,
        message: transformedReplyMessage, // Use transformed message
        reply_to: chat.id
      };

      // Add mentioned emails if there are mentions as JSON string (e.g., "[\"a@b.com\"]")
      if (mentions.length > 0) {
        const emails = users
          .filter((user) => {
            const uid = String(user._id);
            const uname = user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim();
            return mentions.some((m) => (m.id ? String(m.id) === uid : m.name === uname));
          })
          .map((user) => user.email)
          .filter(Boolean);
        if (emails.length > 0) {
          payload.mentionedEmails = JSON.stringify(emails);
        }
      }

      const result = await fetchAuthPost(`${djangoBaseURL}/api/task-chats/`, {
        body: payload,
      });

      // Call parent callback to refresh comments
      if (onReply) {
        await onReply();
      }

      // Reset reply form
      setReplyMessage("");
      setIsReplying(false);

      toast.success("Reply posted successfully", {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error("Failed to post reply: " + (error.message || "Please try again."), {
        position: "bottom-right",
        autoClose: 4000,
      });
    } finally {
      setIsSubmittingReply(false);
    }
  }, [isReplyMessageEmpty, replyMessage, taskId, userInfo, chat.id, users, onReply]);

  // New function to handle direct reply button click
  const handleDirectReply = () => {
    setIsReplying(true);
    setShowDropdown(false);
    // Focus will be handled by the useEffect hook
  };

  // Handle Enter key in reply editor using DOM event listener
  useEffect(() => {
    if (!isReplying) return;

    const handleKeyDown = (e) => {
      // Submit on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        // Check if the message is not empty
        if (!isReplyMessageEmpty) {
          e.preventDefault();
          e.stopPropagation();
          handleSubmitReply();
        }
      }
    };

    // Wait for the editor to be rendered and find the contenteditable element
    const setupListener = () => {
      const replyForm = document.querySelector('.reply-form');
      if (!replyForm) return null;

      const editableElement = replyForm.querySelector('[contenteditable="true"]');
      if (editableElement) {
        editableElement.addEventListener('keydown', handleKeyDown);
        return editableElement;
      }
      return null;
    };

    // Try to set up the listener with retries
    const timeoutId = setTimeout(() => {
      const element = setupListener();
      replyEditorRef.current = element;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (replyEditorRef.current) {
        replyEditorRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isReplying, isReplyMessageEmpty, handleSubmitReply]);

  // Check if the current user is the comment sender
  // Handle string vs numeric ID comparison to avoid issues
  const isCurrentUserSender = useMemo(() => {
    if (!userInfo || !chat) return false;
    // Convert both IDs to strings to ensure consistent comparison
    const currentUserId = String(userInfo._id);
    const senderId = String(chat.sender || chat.ClientSender || "");

    // Debug comparison to ensure we're matching correctly

    return currentUserId === senderId;
  }, [userInfo, chat]);

  // Debug logging to help troubleshoot the visibility issue

  // Enhanced link processing to detect and format image URLs and links
  const processLinks = (html) => {
    if (!html) return "";

    // First, let's properly handle image tags that might already be in the message
    // to make sure they are correctly formatted and aren't nested incorrectly
    let processed = html.replace(
      /<img[^>]+src="([^"]+)"[^>]*>/gi,
      (match, src) => {
        // Skip if it's already properly formatted
        if (
          match.includes('class="max-w-full') &&
          match.includes('style="max-height: 200px;"')
        ) {
          return match;
        }

        // Ensure full URL for relative paths
        const fullSrc = src.startsWith("http") ? src : `${djangoBaseURL}${src}`;
        return `<img src="${fullSrc}" alt="Uploaded Image" class="max-w-full sm:max-w-xs rounded-md my-2 cursor-pointer" style="max-height: 200px;">`;
      }
    );

    // Remove contenteditable="false" from links to make them clickable
    processed = processed.replace(
      /<a([^>]+)contenteditable="false"([^>]*)>/gi,
      '<a$1$2>'
    );

    // Now handle S3 image URLs that are just text in the content
    // This careful regex detects S3 image URLs but avoids matching them if they're already in image tags
    const s3UrlRegex =
      /(?<!<img[^>]*src=["'])(https:\/\/[\w.-]+\.s3\.[\w.-]+\.amazonaws\.com\/[^\s"<>]+\.(jpg|jpeg|png|gif|webp))(?![^<]*["']>)/gi;
    processed = processed.replace(s3UrlRegex, (match) => {
      return `<img src="${match}" alt="Uploaded Image" class="max-w-full sm:max-w-xs rounded-md my-2 cursor-pointer" style="max-height: 200px;">`;
    });

    // Then process regular links, but avoid processing URLs inside existing anchor tags or image src attributes
    processed = processed.replace(
      /(?<!<a[^>]*href=["'])(?<!src=["'])(https?:\/\/(?![\/\w.-]+\.s3\.amazonaws\.com)[^\s"<>]+)(?![^<]*["']>)/gi,
      (match) => {
        // Skip if this is inside an HTML tag
        if (match.includes('"') || match.includes("'")) {
          return match;
        }
        const cleanUrl = match.replace(/[.,;:!?]$/, ""); // Remove trailing punctuation
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${cleanUrl}</a>`;
      }
    );

    // Finally handle task paths
    processed = processed.replace(
      /(^|\s)(\/tasks\?[a-zA-Z0-9=&-]+)(\s|$)/gi,
      function (match, prefix, path, suffix) {
        return `${prefix}<a href="${path}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${path}</a>${suffix}`;
      }
    );

    return processed;
  };

  // Use this enhanced processing for the message
  const processedMessage = useMemo(() => {
    if (!chat?.message) return "";
    return processLinks(chat.message);
  }, [chat?.message]);

  // Add transformLinks function similar to TaskDescriptionComments.jsx
  const transformLinks = async (content) => {
    if (!content) return content;

    try {
      const data = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/change-message/`, {
        body: { message: content },
      });

      if (data.status === 1) {
        return data.message;
      }
      return content;
    } catch (error) {
      console.error("Error transforming links:", error);
      return content;
    }
  };

  // Create debounced version of transformLinks
  const debouncedTransformLinks = useCallback(
    debounce(async (content, setContentFunc) => {
      try {
        const transformedContent = await transformLinks(content);
        if (transformedContent !== content) {
          setContentFunc(transformedContent);
        }
      } catch (error) {
        console.error("Error in debounced transform links:", error);
      }
    }, 100),
    []
  );

  // Create state to track the last reply content
  const [lastReplyContent, setLastReplyContent] = useState("");

  // Handle reply message changes with link transformation
  const handleReplyMessageChange = (html) => {
    setReplyMessage(html);

    // Check if content was likely pasted by comparing length
    // This is a heuristic - substantial content length increases likely mean paste operations
    if (html.length > lastReplyContent.length + 10) {
      // Check if the newly added content contains a URL with taskId parameter
      const newContent = html.substring(lastReplyContent.length);
      const hasTaskLinks = /https?:\/\/[^\s]*taskId=[^\s]*/i.test(newContent);

      if (hasTaskLinks) {
        debouncedTransformLinks(html, setReplyMessage);
      }

      setTimeout(() => {
        const editor = document.querySelector('.reply-form .tf-editor-area');

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
      }, 500);
    }

    // Update last content for next comparison
    setLastReplyContent(html);
  };

  // Add a click outside handler for the new dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDelete(false);
      }

      // Close comment dropdown when clicking outside
      if (
        commentDropdownRef.current &&
        !commentDropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }

      // Close mention dropdown when clicking outside
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target) &&
        event.target !== textareaRef.current
      ) {
        setShowMentions(false);
      }
    }

    if (isDelete || showMentions || showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDelete, showMentions, showDropdown]);

  useEffect(() => {
    setLikes(chat?.likes || []);
    setLiked(chat?.likes?.includes(userInfo?._id));
  }, [chat?.likes, userInfo?._id]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Focus reply textarea when replying starts
  useEffect(() => {
    if (isReplying) {
      const focusReplyEditor = () => {
        try {


          // Find the editor element using DOM queries since ref doesn't work with function components
          const replyForm = document.querySelector('.reply-form');
          if (!replyForm) {

            return;
          }

          // Try different selectors for TextFlux editor
          const selectors = [
            '.tf-editor-area',
            '.ql-editor',
            '[contenteditable="true"]',
            'textarea',
            'input[type="text"]',
            '.editor-content',
            '.textflux-editor'
          ];

          for (const selector of selectors) {
            const editorElement = replyForm.querySelector(selector);

            if (editorElement && editorElement.focus) {
              editorElement.focus();

              return;
            }
          }


        } catch (error) {
          console.warn('Could not focus reply editor:', error);
        }
      };

      // Use multiple attempts with different timeouts
      const timeoutId1 = setTimeout(focusReplyEditor, 100);
      const timeoutId2 = setTimeout(focusReplyEditor, 300);
      const timeoutId3 = setTimeout(focusReplyEditor, 500);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
      };
    }
  }, [isReplying]);

  // Helper function to convert HTML to plain text for editing
  const htmlToPlainText = (html) => {
    // Instead of converting to plain text, we'll keep the HTML
    return html;
  };

  // Simple editor initialization
  const handleEditClick = () => {
    setIsEditing(true);
    // Keep the original HTML content for editing
    setEditedMessage(chat.message || "");
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMessage("");
    setShowMentions(false);
  };

  // Save edited comment
  const handleSaveEdit = async () => {
    if (editedMessage.trim() === "") return;

    setIsSaving(true);
    try {
      // Keep the original HTML formatting
      let formattedMessage = editedMessage;

      // Extract any images from the rich text content
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;
      const imageUrls = [];
      while ((match = imgRegex.exec(formattedMessage)) !== null) {
        imageUrls.push(match[1]);
      }

      // Extract mentions (prefer data-id, fallback to data-value)
      const editMentionIdRegex = /data-id="([^"]+)"/g;
      const editMentionNameRegex = /data-value="([^"]+)"/g;
      const mentions = [];
      let em;
      while ((em = editMentionIdRegex.exec(formattedMessage)) !== null) {
        mentions.push({ id: String(em[1]) });
      }
      if (mentions.length === 0) {
        let en;
        while ((en = editMentionNameRegex.exec(formattedMessage)) !== null) {
          mentions.push({ name: en[1] });
        }
      }

      // Use the correct API endpoint for updating task chats
      const result = await fetchAuthPatch(`${djangoBaseURL}/api/taskchat/${chat.id}/`, {
        body: {
          message: formattedMessage,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          mentionedEmails:
            mentions.length > 0
              ? (() => {
                const emails = users
                  .filter((user) => {
                    const uid = String(user._id);
                    const uname = user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim();
                    return mentions.some((m) => (m.id ? String(m.id) === uid : m.name === uname));
                  })
                  .map((user) => user.email)
                  .filter(Boolean);
                return emails.length > 0 ? JSON.stringify(emails) : undefined;
              })()
              : undefined,
        },
      });
      await cleanCommentImages();

      if (onEditComment) {
        await onEditComment(chat.id, formattedMessage);
      }

      setIsEditing(false);

      toast.success("Comment updated successfully", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(
        "Failed to save comment: " + (error.message || "Please try again."),
        {
          position: "bottom-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle textarea input to detect @ symbol for mentions
  const handleTextareaChange = (e) => {
    const newValue = e.target.value;
    setEditedMessage(newValue);

    // Get cursor position
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);

    // Check if @ was just typed
    if (newValue[cursorPos - 1] === "@") {
      // Calculate position for dropdown
      const textareaRect = textareaRef.current.getBoundingClientRect();
      const lineHeight = parseInt(
        window.getComputedStyle(textareaRef.current).lineHeight
      );

      // Count newlines before cursor to estimate vertical position
      const textBeforeCursor = newValue.substring(0, cursorPos);
      const lines = textBeforeCursor.split("\n").length - 1;

      // Set position for dropdown
      setMentionPosition({
        top: textareaRect.top + lineHeight * lines + 30, // Adjust as needed
        left: textareaRect.left + 20, // Adjust as needed
      });

      setMentionFilter("");
      setShowMentions(true);
    } else if (showMentions) {
      // Check if we're still typing a mention
      const textBeforeCursor = newValue.substring(0, cursorPos);
      const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

      if (lastAtSymbol !== -1) {
        const mentionText = textBeforeCursor.substring(lastAtSymbol + 1);
        setMentionFilter(mentionText);
      } else {
        // If no @ symbol before cursor, close the dropdown
        setShowMentions(false);
      }
    }
  };

  // Handle selecting a mention from the dropdown
  const handleSelectMention = (user) => {
    // Get text before and after the current mention
    const textBeforeCursor = editedMessage.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");
    const textBeforeMention = editedMessage.substring(0, lastAtSymbol);
    const textAfterCursor = editedMessage.substring(cursorPosition);

    // Insert the mention
    const userName =
      user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim();
    const newText = `${textBeforeMention}@${userName} ${textAfterCursor}`;

    setEditedMessage(newText);
    setShowMentions(false);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Set cursor position after the inserted mention
        const newPosition = lastAtSymbol + userName.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Filter users for mention dropdown
  const filteredUsers =
    users?.filter((user) => {
      const userName =
        user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim();
      return userName.toLowerCase().includes(mentionFilter.toLowerCase());
    }) || [];

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);

      // Use apiSlice method for delete request
      await fetchAuthDelete(`${djangoBaseURL}/api/taskchat/${chat.id}/`);

      // Delete operation was successful
      await cleanCommentImages();

      // If the DeleteCommentChat prop function exists, call it to update UI in parent
      // This should ONLY update the UI, not make another API call
      if (DeleteCommentChat) {
        DeleteCommentChat(chat.id);
      }

      // Show success toast
      toast.success("Comment deleted successfully", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Close the modal
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error in delete operation:", error);
      toast.error(
        "Failed to delete comment: " + (error.message || "Please try again."),
        {
          position: "bottom-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLikeClick = async () => {
    try {
      if (!liked) {
        await fetchAuthPost(
          `${djangoBaseURL}/api/like-chat/${userInfo?._id}/${chat.id}/`,
          { body: true }
        );
        setLiked(true);
        setLikes([...likes, userInfo?._id]);
      } else {
        await fetchAuthPost(
          `${djangoBaseURL}/api/dislike-chat/${userInfo?._id}/${chat.id}/`,
          { body: false }
        );
        setLiked(false);
        setLikes(likes.filter((id) => id !== userInfo?._id));
      }
    } catch (error) {
      console.error("Error liking/unliking the chat:", error);
    }
  };

  // Prepare liked users array for tooltip
  const likedUsers = likes
    ?.map((likeId) => users?.find((user) => user._id === likeId))
    .filter((user) => user && user.name);

  // Get the user object for avatar display
  const selectedUser = useMemo(() => {
    if (!chat || !users) return null;

    const senderId = String(chat.sender || chat.ClientSender || "");

    // Find user in active users array
    const activeUser = users?.find((user) => String(user._id) === senderId);

    // Find user in deleted users data if deleted
    const deletedUser = deletedData?.find((user) => String(user._id) === senderId);

    // Use active user if found, otherwise use deleted user
    return activeUser || deletedUser;
  }, [chat?.sender, chat?.ClientSender, chat?.sender_name, users, deletedUserIds, deletedData]); // Only depend on these values

  // Check if user is deleted
  const isUserDeleted = useMemo(() => {
    const senderId = String(chat.sender || chat.ClientSender || "");
    const isDeletedInList = deletedUserIds?.includes(senderId);
    const activeUser = users?.find((user) => String(user._id) === senderId);
    return isDeletedInList || !activeUser || selectedUser?.is_deleted || selectedUser?.name?.toLowerCase().includes("(deleted)");
  }, [chat?.sender, chat?.ClientSender, users, deletedUserIds, selectedUser]);

  // Compute a display name for the sender (works for both parent and replies)
  const senderDisplayName = useMemo(() => {
    if (isUserDeleted) {
      if (selectedUser?.name) return `${selectedUser.name} (Deleted)`;
      return "(Deleted)";
    }
    if (chat?.sender_name) return chat.sender_name;
    if (selectedUser?.name) return selectedUser.name;
    const firstLast = `${selectedUser?.first_name || ""} ${selectedUser?.last_name || ""}`.trim();
    if (firstLast) return firstLast;
    return "Unknown User";
  }, [chat?.sender_name, selectedUser, isUserDeleted]);

  // Detect if message has media that shouldn't be inlined next to the name
  const hasInlineBlockingMedia = useMemo(() => {
    const raw = chat?.message || "";
    return /<(img|video)/i.test(raw);
  }, [chat?.message]);



  // Function to handle image clicks in comments
  const handleImageClick = (e) => {
    if (e.target.tagName === "IMG") {
      // Find the parent element that contains the image, with fallbacks to avoid null errors
      let commentContainer =
        e.target.closest(".uploaded-content") ||
        e.target.closest(".comment-body") ||
        e.target.parentElement;

      // If we still don't have a valid container, just use the clicked image alone
      if (!commentContainer) {
        const clickedImage = e.target.src;
        if (clickedImage) {
          const url = new URL(clickedImage);
          const parts = url.pathname.split("/");
          const folder = parts.includes("comments") ? "comments" : "";
          const filenameWithTimestamp = parts[parts.length - 1];

          const match = filenameWithTimestamp.match(
            /^(.*?\.png|jpg|jpeg|gif|webp)/i
          );
          const name = match ? match[1] : filenameWithTimestamp;

          setAttachmentsForView([
            {
              url: clickedImage,
              name: name,
              type: "image",
              folder: folder,
            },
          ]);
          handleAttachmentOpen(0);
        }
        return;
      }

      // Get all images from the container
      const images = Array.from(commentContainer.querySelectorAll("img"))
        .map((img) => img.src)
        .filter((src) => src)
        .map((src) => {
          const url = new URL(src);
          const parts = url.pathname.split("/");
          const folder = parts.includes("comments") ? "comments" : "";
          const filenameWithTimestamp = parts[parts.length - 1];

          const match = filenameWithTimestamp.match(
            /^(.*?\.png|jpg|jpeg|gif|webp)/i
          );
          const name = match ? match[1] : filenameWithTimestamp;

          return {
            url: src,
            name: name,
            type: "image",
            folder: folder,
          };
        });

      // Get the clicked image index
      const clickedImage = e.target.src;
      const currentIndex = images.findIndex((img) => img.url === clickedImage);

      // Open the slider with the clicked image and all images
      if (images.length > 0) {
        setAttachmentsForView(images);
        handleAttachmentOpen(currentIndex >= 0 ? currentIndex : 0);
      }
    }
  };

  const handlePinToggle = () => {
    onPinToggle(chat.id);
  };

  // Add a useEffect to update the relative time every minute
  useEffect(() => {
    // Debug logging for timestamp data

    // Initial calculation
    setRelativeTime(getRelativeTime(chat?.timestamp));

    // Set up interval to update every minute
    const intervalId = setInterval(() => {
      setRelativeTime(getRelativeTime(chat?.timestamp));
    }, 60000); // Update every minute

    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, [chat?.timestamp]);

  // Add click event listener to comment content
  useEffect(() => {
    const commentContent = document.querySelector(".uploaded-content");
    if (commentContent) {
      commentContent.addEventListener("click", handleImageClick);
    }
    return () => {
      if (commentContent) {
        commentContent.removeEventListener("click", handleImageClick);
      }
    };
  }, [chat.id]);



  // Add a useEffect to initialize tooltips for the editor
  useEffect(() => {
    // Add tooltip styles for Quill buttons
    const styleElement = document.createElement("style");
    styleElement.id = "quill-tooltip-styles";
    styleElement.textContent = `
      .ql-toolbar button,
      .ql-toolbar .ql-picker {
        position: relative;
      }
      
      .ql-toolbar button[data-tooltip]:hover::after,
      .ql-toolbar .ql-picker[data-tooltip]:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: -28px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
      }
      
      .ql-toolbar button[data-tooltip]::before,
      .ql-toolbar .ql-picker[data-tooltip]::before {
        content: "";
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 5px;
        border-style: solid;
        border-color: transparent transparent #333 transparent;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        z-index: 1000;
      }
      
      .ql-toolbar button[data-tooltip]:hover::before,
      .ql-toolbar .ql-picker[data-tooltip]:hover::before {
        bottom: -12px;
        opacity: 1;
        visibility: visible;
      }
    `;
    document.head.appendChild(styleElement);

    // Add tooltips to buttons after a small delay to ensure DOM is ready
    setTimeout(() => {
      const addTooltips = () => {
        const toolbar = document.querySelector(".comment-editor .ql-toolbar");
        if (!toolbar) return;

        // Bold
        const boldBtn = toolbar.querySelector(".ql-bold");
        if (boldBtn) boldBtn.setAttribute("data-tooltip", "Bold (Ctrl+B)");

        // Italic
        const italicBtn = toolbar.querySelector(".ql-italic");
        if (italicBtn)
          italicBtn.setAttribute("data-tooltip", "Italic (Ctrl+I)");

        // Underline
        const underlineBtn = toolbar.querySelector(".ql-underline");
        if (underlineBtn)
          underlineBtn.setAttribute("data-tooltip", "Underline (Ctrl+U)");

        // Strike
        const strikeBtn = toolbar.querySelector(".ql-strike");
        if (strikeBtn) strikeBtn.setAttribute("data-tooltip", "Strikethrough");

        // Blockquote
        const blockquoteBtn = toolbar.querySelector(".ql-blockquote");
        if (blockquoteBtn) blockquoteBtn.setAttribute("data-tooltip", "Quote");

        // Ordered list
        const olBtn = toolbar.querySelector('.ql-list[value="ordered"]');
        if (olBtn) olBtn.setAttribute("data-tooltip", "Numbered List");

        // Bullet list
        const ulBtn = toolbar.querySelector('.ql-list[value="bullet"]');
        if (ulBtn) ulBtn.setAttribute("data-tooltip", "Bullet List");

        // Link
        const linkBtn = toolbar.querySelector(".ql-link");
        if (linkBtn) linkBtn.setAttribute("data-tooltip", "Insert Link");

        // Image
        const imageBtn = toolbar.querySelector(".ql-image");
        if (imageBtn) imageBtn.setAttribute("data-tooltip", "Insert Image");

        // Emoji
        const emojiBtn = toolbar.querySelector(".ql-emoji");
        if (emojiBtn) emojiBtn.setAttribute("data-tooltip", "Insert Emoji");

        // Clean
        const cleanBtn = toolbar.querySelector(".ql-clean");
        if (cleanBtn) cleanBtn.setAttribute("data-tooltip", "Clear Formatting");
      };

      // Initial tooltip setup
      addTooltips();

      // Create an observer to handle dynamically created editors
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            addTooltips();
          }
        }
      });

      // Start observing document body for any new editors
      observer.observe(document.body, { childList: true, subtree: true });

      // Cleanup
      return () => {
        observer.disconnect();
        const styleElem = document.getElementById("quill-tooltip-styles");
        if (styleElem) styleElem.remove();
      };
    }, 500);
  }, [isEditing]);

  const handleCopyCommentLink = async () => {
    try {
      setShowDropdown(false);
      const urlForSend = `${window.location.origin}/`

      const response = await fetchAuthPost(
        `${djangoBaseURL}/api/taskchat/${chat?.id}/get-formatted-link/`, {
        body: {
          base_url: urlForSend
        }
      });

      const data = response;

      if (data.status !== 1) {
        throw new Error(data.message || "Failed to get formatted comment link");
      }

      // Create a temporary div to hold the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.html_content;
      document.body.appendChild(tempDiv);

      // Select the content
      const range = document.createRange();
      range.selectNode(tempDiv);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);

      try {
        // Try copying with HTML
        const successful = document.execCommand('copy');
        if (!successful) {
          // Fallback to plain text
          await navigator.clipboard.writeText(`${data.html_content}`);
        }
      } finally {
        // Clean up
        document.body.removeChild(tempDiv);
        window.getSelection().removeAllRanges();
      }

      toast.success(
        "comment link copied!",
        {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

    } catch (error) {
      toast.error(error.message || "Failed to copy formatted comment link", {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleReplyClick = async () => {
    setShowDropdown(false);

    try {
      const urlForSend = `${window.location.origin}/`;

      const response = await fetchAuthPost(
        `${djangoBaseURL}/api/taskchat/${chat?.id}/get-formatted-link/`,
        {
          body: { base_url: urlForSend },
        }
      );

      if (response.status !== 1) {
        throw new Error(response.message || "Failed to get formatted comment link");
      }

      // Use parent's callback to insert the comment link into the editor
      if (onInsertCommentLink) {
        onInsertCommentLink(response.html_content);
        setTimeout(() => {
          const editor = document.querySelector('.comment-editor-area .tf-editor-area');

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
        }, 500);
      }

    } catch (error) {
      toast.error(error.message || "Failed to load comment link for reply", {
        position: "bottom-right",
        autoClose: 3000,
      });
    }
  };

  function handleLinkClick(event) {
    const target = event.target;
    // Traverse up if inside <a> tag
    let anchor = target;
    while (anchor && anchor.tagName !== 'A') {
      anchor = anchor.parentElement;
    }
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    try {
      const url = new URL(href, window.location.origin);
      const clickedTaskId = url.searchParams.get('taskId');
      const clickedCommentId = url.searchParams.get('commentId')
      if (clickedTaskId === String(taskId)) {
        // Same taskId, prevent navigation
        event.preventDefault();
        scrollToComment(clickedCommentId)

      }
    } catch (error) {
      // Invalid URL, allow default behavior
    }
  };

  function addListClasses(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    doc.querySelectorAll('ol').forEach(ol => {
      ol.classList.add('list-decimal', 'list-inside');
    });

    doc.querySelectorAll('ul').forEach(ul => {
      ul.classList.add('list-disc', 'list-inside');
    });

    return doc.body.innerHTML;
  }

  return (
    <div
      className={`${isPinned
        ? " bg-blue-50 dark:bg-slate-800/50 rounded-lg"
        : ""
        } ${isHighlighted ? "bg-dededed p-1 rounded-md" : ""}`}
    >
      <style>{editorStyles}</style>

      <div className={`flex`}>
        {/* Avatar - Only show for top-level comments */}
        {depth === 0 && (
          <div className="flex-shrink-0 mt-1">
            <ProfilePicture
              user={isUserDeleted ? (selectedUser ? { ...selectedUser, name: selectedUser?.name || "(deleted)", is_deleted: true } : { name: "(deleted)", is_deleted: true }) : selectedUser}
              className="w-7 h-7 rounded-full object-cover"
            />

          </div>
        )}

        {/* Comment Content */}
        <div className={`flex-1 relative ${depth === 0 ? 'ml-2' : ''}`}>
          {/* Header with username and actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 flex-1 min-w-0 whitespace-nowrap">

              {depth > 0 && (
                <>

                  {/* Inline avatar for replies */}
                  <ProfilePicture
                    user={isUserDeleted ? (selectedUser ? { ...selectedUser, name: selectedUser?.name || "(deleted)", is_deleted: true } : { name: "(deleted)", is_deleted: true }) : selectedUser}
                    className="w-7 h-7 rounded-full object-cover mr-1"
                  />
                </>
              )}
              {/* Sender name for both parent and replies */}
              {senderDisplayName && (
                <span className={` text-sm  font-medium text-[#0f0f0f] dark:text-[#f1f1f1] mt-1  truncate`}>
                  {senderDisplayName}
                </span>
              )}

              {/* Inline message removed as per requirement */}

              {/* timestamp moved to actions on the right */}
            </div>

            {/* Action buttons - always visible */}
            <div className="flex items-center space-x-2">
              {/* Timestamp - always near like button */}
              <Tooltip
                content={
                  chat?.timestamp
                    ? moment(chat.timestamp).format("MMM D, YYYY [at] h:mma")
                    : "Unknown time"
                }
                placement="top"
                arrow={true}
                theme="custom-light"
                animation="shift-away"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1 whitespace-nowrap">
                  {/second/.test(relativeTime) ? "Just now" : relativeTime}
                  {chat.isEdited && <span className="ml-1">(edited)</span>}
                </span>
              </Tooltip>
              {/* Like button - always visible */}
              <Tooltip

                content={
                  likedUsers && likedUsers.length > 0 ? (
                    <div className="">


                      {/* Users in a grid if more than 3 */}
                      <div
                        className={`${likedUsers.length > 3
                          ? "flex flex-col gap-2"
                          : "space-y-2"
                          } max-h-48 overflow-y-auto`}
                      >
                        {likedUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center space-x-2 p-0 rounded hover:bg-gray-700/30"
                          >
                            <ProfilePicture
                              user={user}
                              className="w-6 h-6 rounded-full object-cover border border-gray-300 flex-shrink-0"
                            />
                            <span
                              className="text-[13px] leading-[20px] font-medium text-[#0f0f0f] dark:text-[#f1f1f1] truncate"
                              title={user?._id && userInfo?._id && user._id === userInfo._id ? "You" : user?.name}
                            >
                              {user?._id && userInfo?._id && user._id === userInfo._id ? "You" : user?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm font-normal dark:text-white">
                      Be the first to like!
                    </span>
                  )
                }
                placement="bottom-start"
                arrow={true}
                theme="custom-light"
                animation="shift-away"
                allowHTML={true}
                interactive={true}
                offset={[0, 8]}
              >
                <button
                  onClick={handleLikeClick}
                  className="relative inline-flex items-center space-x-1.5 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  <Icon
                    icon={
                      liked
                        ? "material-symbols:thumb-up"
                        : "material-symbols:thumb-up-outline"
                    }
                    className={`w-4 h-4 transition-colors ${liked
                      ? "text-blue-500"
                      : "text-gray-500 hover:text-blue-500 dark:text-gray-400"
                      }`}
                  />

                  {/* Like count text */}
                  {likes && likes.length > 0 && (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {likes.length}
                    </span>
                  )}
                </button>
              </Tooltip>

              {/* Direct Reply Button */}


              {/* Dropdown arrow - always visible */}
              <div className="relative" ref={commentDropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                  title="More options"
                >
                  <Icon
                    icon="heroicons-outline:chevron-down"
                    className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0  mt-1 w-36 bg-white dark:bg-slate-800 rounded-md shadow-lg z-[9999] border border-gray-200 dark:border-slate-700">
                    <div className="py-1 z-[9999]">
                      <button
                        onClick={handleDirectReply}
                        className="flex w-full items-center px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        <Icon
                          icon="material-symbols:reply-rounded"
                          className="w-3.5 h-3.5 mr-2"
                        />
                        <Tooltip
                          content="Reply"
                          placement="left"
                          arrow={true}
                          theme="custom-light"
                          animation="shift-away"
                        >
                          <span>
                            Reply
                          </span>
                        </Tooltip>
                      </button>
                      {/* Edit option - only show for own comments */}
                      {isCurrentUserSender && !isEditing && (
                        <button
                          onClick={() => {
                            handleEditClick();
                            setShowDropdown(false);
                          }}
                          className="flex w-full items-center px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          <Icon
                            icon="fluent:edit-16-regular"
                            className="w-3.5 h-3.5 mr-2"
                          />
                          <Tooltip
                            content="Edit this comment"
                            placement="left"
                            arrow={true}
                            theme="custom-light"
                            animation="shift-away"
                          >
                            <span>Edit comment</span>
                          </Tooltip>
                        </button>
                      )}

                      {/* Pin/Unpin option - only for parent comments */}
                      {depth === 0 && (
                        <button
                          onClick={() => {
                            handlePinToggle();
                            setShowDropdown(false);
                          }}
                          className="flex w-full items-center px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          <Icon
                            icon={isPinned ? "mdi:pin-off" : "mdi:pin"}
                            className={`w-3.5 h-3.5 mr-2 ${isPinned ? "text-blue-500" : ""
                              }`}
                          />
                          <Tooltip
                            content={
                              isPinned ? "Unpin this comment" : "Pin this comment"
                            }
                            placement="left"
                            arrow={true}
                            theme="custom-light"
                            animation="shift-away"
                          >
                            <span>
                              {isPinned ? "Unpin comment" : "Pin comment"}
                            </span>
                          </Tooltip>
                        </button>
                      )}
                      {depth === 0 && (
                        <button
                          onClick={handleCopyCommentLink}
                          className="flex w-full items-center px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          <Icon
                            icon="heroicons-outline:link"
                            className="w-3.5 h-3.5 mr-2"
                          />
                          <Tooltip
                            content="Copy link to this comment"
                            placement="left"
                            arrow={true}
                            theme="custom-light"
                            animation="shift-away"
                          >
                            <span>Copy link</span>
                          </Tooltip>
                        </button>
                      )}

                      {/* Delete option - only show for own comments */}
                      {isCurrentUserSender && (
                        <button
                          onClick={() => {
                            handleDeleteClick();
                            setShowDropdown(false);
                          }}
                          className="flex w-full items-center px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Icon
                            icon="fluent:delete-16-regular"
                            className="w-3.5 h-3.5 mr-2"
                          />
                          <Tooltip
                            content="Delete this comment"
                            placement="left"
                            arrow={true}
                            theme="custom-light"
                            animation="shift-away"
                          >
                            <span>Delete</span>
                          </Tooltip>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comment content */}
          {isEditing ? (
            <div className="bg-white dark:bg-slate-700 rounded-lg overflow-visible dark:border-slate-600">
              {/* Replace ReactQuill with TextFlux Editor */}
              <Editor
                className="mt-1 block w-full p-0 text-sm comment-editor dark:text-gray-100"
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
                value={editedMessage}
                onChange={setEditedMessage}
                onMediaUpload={(file, type) =>
                  handleMediaUpload(file, type, "comments")
                }
                placeholder="Edit your comment..."
              />
              <div className="flex justify-end gap-2 p-2 bg-gray-50 dark:bg-slate-800">
                <Button
                  text="Cancel"
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-md transition-colors"
                  onClick={handleCancelEdit}
                />
                <Button
                  text="Save"
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  onClick={handleSaveEdit}
                  isLoading={isSaving}
                />
              </div>
            </div>
          ) : (
            <div className={`comment-body mt-1 ${depth > 0 ? 'ml-8' : ''}`}>
              {chat?.message && (
                <div className={`group relative max-w-full ${depth > 0 ? 'text-xs' : 'text-sm'} text-[#0f0f0f] dark:text-[#f1f1f1]`}>
                  {typeof chat?.message === "string" &&
                    chat?.message?.length > 0 && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            addListClasses(processedMessage),
                            purifyConfig
                          ),
                        }}
                        onClick={(e) => {
                          handleImageClick(e);
                          handleLinkClick(e);
                        }}
                        className="uploaded-content  w-full overflow-hidden whitespace-pre-wrap  [overflow-wrap:anywhere] text-sm font-normal text-[#0f0f0f] dark:text-[#f1f1f1] [&_p]:my-1 [&_strong]:font-medium [&_em]:italic [&_a]:text-[#065fd4] dark:[&_a]:text-[#3ea6ff] [&_a:hover]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ml-5 [&_ol]:ml-5 [&_img]:my-2 [&_img]:rounded-md [&_img]:max-w-full"
                      ></div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 bg-gray-50 dark:bg-slate-800 rounded-md p-3 reply-form">
              <Editor
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
                value={replyMessage}
                onChange={handleReplyMessageChange}
                onMediaUpload={(file, type) =>
                  handleMediaUpload(file, type, "comments")
                }
                placeholder={`Reply to ${chat?.sender_name}...`}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  text="Cancel"
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-md transition-colors"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyMessage("");
                  }}
                />
                <Button
                  text="Reply"
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  onClick={handleSubmitReply}
                  isLoading={isSubmittingReply}
                  disabled={isReplyMessageEmpty}
                />
              </div>
            </div>
          )}

          {/* Replies Section */}
          {chat?.replies && chat.replies.length > 0 && (
            <div className="reply-thread">
              {/* Show/Hide Replies Toggle */}
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center space-x-1 text-xs font-medium text-electricBlue-50 hover:text-electricBlue-50 dark:text-blue-400 dark:hover:text-blue-300 reply-toggle-btn"
              >
                <Icon
                  icon={showReplies ? "mdi:chevron-down" : "mdi:chevron-right"}
                  className="w-4 h-4 transition-transform duration-200"
                />
                <span>
                  {showReplies ? "Hide" : "Show"} {chat.replies.length === 1 ? "Reply" : "Replies"} ({chat.replies.length})
                </span>
              </button>

              {/* Nested Replies */}
              {showReplies && (
                <div className="space-y-0 nested-replies">
                  {chat.replies.map((reply, index) => (
                    <CommentMsg
                      key={reply.id || index}
                      chat={reply}
                      DeleteCommentChat={DeleteCommentChat}
                      users={users}
                      isPinned={false}
                      onPinToggle={onPinToggle}
                      onEditComment={onEditComment}
                      cleanCommentImages={cleanCommentImages}
                      setImgLoading={setImgLoading}
                      setAttachmentsForView={setAttachmentsForView}
                      handleAttachmentOpen={handleAttachmentOpen}
                      handleMediaUpload={handleMediaUpload}
                      isHighlighted={isHighlighted}
                      onInsertCommentLink={onInsertCommentLink}
                      taskId={taskId}
                      scrollToComment={scrollToComment}
                      depth={depth + 1}
                      onReply={onReply}
                      maxDepth={maxDepth}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteModal && (
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
                Delete Comment
              </h3>

              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete this comment? This action cannot
                be undone.
              </p>

              <div className="flex justify-center space-x-3">
                <Button
                  text="Cancel"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-md transition-colors"
                  onClick={() => setShowDeleteModal(false)}
                />

                <Button
                  text="Delete"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  onClick={confirmDelete}
                  isLoading={isDeleting}
                  icon="mingcute:delete-2-fill"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <ImageSlider
        isOpen={imageSlider.isOpen}
        onClose={imageSlider.closeSlider}
        images={imageSlider.images}
        currentIndex={imageSlider.currentIndex}
        onPrevious={imageSlider.handlePrevious}
        onNext={imageSlider.handleNext}
      />

      <style>
        {`
                ${editorStyles}
                
                .uploaded-content img {
                    max-width: 100%;
                    max-height: 200px;
                    height: auto;
                    border-radius: 6px;
                    margin: 10px 0;
                    cursor: pointer;
                    transition: transform 0.2s;
                    display: block;
                }
                
                .uploaded-content img:hover {
                    transform: scale(1.02);
                }
                
                .uploaded-content a {
                    word-break: break-word;
                }
                
                /* Fix for nested p tags */
                .uploaded-content p {
                    margin-bottom: 0.5rem;
                }
                
                /* Prevent nesting issues */
                .uploaded-content a img {
                    display: block;
                    margin: 10px 0;
                }
                
                @media (min-width: 640px) {
                    .uploaded-content img {
                        max-width: 300px;
                    }
                }

                /* Video styling for videos */
                .uploaded-content video {
                    max-width: 100%;
                    border-radius: 6px;
                    margin: 10px 0;
                    background: #000;
                    aspect-ratio: 16/9;
                    display: block;
                }
                `}
      </style>
    </div>
  );
};

export default CommentMsg;
