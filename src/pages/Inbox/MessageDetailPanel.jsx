import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { fetchAuthGET } from "@/store/api/apiSlice";
import { RecurringTaskPanel, TaskPanel } from "@/features/tasks";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import {
  togglePanelVisibility,
  toggleTaskPanel,
  updateTaskCommentCount,
} from "@/features/tasks/store/tasksSlice";
import AttachmentViewer from "@/components/Task/AttachmentViewer";
import { fetchProjects } from "@/store/projectsSlice";
import TaskPanelSkeleton from "@/features/tasks/components/TaskPanelSkeleton";
import Avatar from "@/components/ui/Avatar";
import { toast } from "react-toastify";
import CommentWithMentions from "@/components/ui/CommentWithMentions";
import ProfileCardWrapper from "@/components/ui/ProfileCardWrapper";
import { ProfilePicture } from "@/components/ui/profilePicture";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns"
import dyzoAiLogo from '../../assets/images/logo/dyzo-ai-logo.png'
const MessageDetailPanel = ({ message, onClose }) => {
  const navigate = useNavigate();
  const [messageCategory, setMessageCategory] = useState("");
  const [task, setTask] = useState({});
  const { projects } = useSelector((state) => state.projects);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(0);
  const [attachmentsForView, setAttachmentsForView] = useState([]);
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const [taskLoading, setTaskLoading] = useState(false);
  if (!message) return null;

  useEffect(() => {
    if (message?.category !== "") {
      setMessageCategory(message.category);
    } else {
      if (message) {
        const lowerTitle = message?.title.toLowerCase();
        if (
          lowerTitle.includes("task") ||
          lowerTitle.includes("task completed")
        ) {
          setMessageCategory("task");
        } else if (lowerTitle.includes("leave")) {
          setMessageCategory("leave");
        } else if (lowerTitle.includes("chat liked")) {
          setMessageCategory("task");
        } else {
          setMessageCategory("");
        }
      }
    }
  }, [message]);

  const fetchTaskLog = async (id) => {
    setTaskLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/api/tasks/${id}/`;
      const data = await fetchAuthGET(apiUrl, false);
      if (data?.status === 1) {
        setTask(data?.data);
      } else {
        setTask({});
        console.error("Error fetching task details:");
      }
    } catch (error) {
      setTask({});
      console.error("Error fetching leave details:", error);
    }
    setTaskLoading(false);
  };

  // Function to update task fields from child components
  const handleTaskUpdate = (taskId, field, value) => {
    setTask(prevTask => ({
      ...prevTask,
      [field]: value
    }));
  };

  const fetchRecurringTaskLog = async (id) => {
    setTaskLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/api/recurring-task/${id}/`;
      const data = await fetchAuthGET(apiUrl, false);
      if (data?.status === 1) {
        setTask(data?.data);
      } else {
        setTask({});
        console.error("Error fetching task details:");
      }
    } catch (error) {
      setTask({});
      console.error("Error fetching leave details:", error);
    }
    setTaskLoading(false);
  };

  useEffect(() => {
    if (messageCategory === "task" && message?.importantId) {
      dispatch(fetchProjects());
      fetchTaskLog(message?.importantId);
    } else if (messageCategory === "recurring" && message?.importantId) {
      dispatch(fetchProjects());
      fetchRecurringTaskLog(message?.importantId);
    }
    else {
      setTask({});
      setTaskLoading(false);
    }
  }, [messageCategory, message?.importantId]);

  const handleCommentCountUpdate = (taskId, newCount) => {
    dispatch(updateTaskCommentCount({ taskId, newCount }));
  };

  const handleAttachmentOpen = (index) => {
    setCurrentAttachment(index);
    setIsAttachmentViewerOpen(true);
  };

  const handleRestoreTask = async (id) => {
    try {
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/restore-task/${id}/`
      const response = await fetchAuthGET(apiUrl)
      if (response?.status === 1) {
        setTask(response?.data);
        toast.success(response?.message || "Task Restored Successfully")
      } else {
        toast.error(response?.message || "Failed to restore task")
      }
    } catch (error) {
      console.error(error)
    }
  }

  const formatDueDate = (date) => {
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

  const displayName =
    message.sender_name ||
    `${message.sender_first_name} ${message.sender_last_name}`;
  const senderUser = (users || []).find(u => String(u._id) === String(message?.sender));

  return (
    <div className="h-full w-full  bg-white relative">
      {messageCategory === "task" ? (
        taskLoading ? (
          <TaskPanelSkeleton from="inbox" />
        ) : Object.keys(task).length > 0 ? (
          <div>
            {
              task?.isDelete &&
              <div className="w-full h-full absolute top-0 right-0 bg-white/50 z-[50] flex flex-col items-center justify-center">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg flex flex-col items-center">
                  <h3 className="text-lg font-medium text-red-600 mb-2">This task is deleted</h3>
                  <p className="text-gray-700 text-sm mb-4">You can restore this task or cancel to go back.</p>
                  <div className="flex gap-4">
                    <button
                      className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 text-sm bg-electricBlue-50 text-white rounded hover:bg-electricBlue-100"
                      onClick={() => handleRestoreTask(task?.taskId)}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            }
            <div className={`${task?.isDelete ? "pointer-events-none " : ""}`}>
              <TaskPanel
                task={task}
                isOpen={true}
                projects={projects}
                onClose={onClose}
                onUpdateCommentCount={handleCommentCountUpdate}
                handleAttachmentOpen={handleAttachmentOpen}
                setAttachmentsForView={setAttachmentsForView}
                isAttachmentViewerOpen={isAttachmentViewerOpen}
                from="inbox"
                setTask={setTask}
                updateTaskFields={handleTaskUpdate}
              />
            </div>
          </div>
        ) : (
          <div className="p-4">
            <button
              className=" text-gray-500 hover:text-gray-600 transition-all duration-200 hover:scale-105"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 my-4 sm:mx-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-red-800 text-lg">
                    Task Not Found
                  </h4>
                  <p className="text-red-600 text-sm mt-1 leading-relaxed">
                    We couldn't find any details for this task. It may have been
                    deleted or is unavailable.
                  </p>
                </div>
              </div>
            </div>
            {/* Main Card */}
            <div className="w-full flex flex-col items-center justify-center ">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl mb-1 capitalize">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(message.timestamp).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {/* Content */}
              <div className="space-y-4 mb-6 sm:mx-10 w-full">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Title
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{message.title}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Message
                    </span>
                  </div>
                  <div className="text-sm mt-0.5 text-gray-900 break-words dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: message?.message }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : messageCategory === "recurring" ? (
        taskLoading ? (
          <TaskPanelSkeleton from="inbox" />
        ) : Object.keys(task).length > 0 ? (
          <div>
            <RecurringTaskPanel
              task={task}
              isOpen={true}
              onClose={onClose}
              projects={projects}
              users={users}
              from="inbox"
            />
          </div>
        ) : (
          <div className="p-4">
            <button
              className=" text-gray-500 hover:text-gray-600 transition-all duration-200 hover:scale-105"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 my-4 sm:mx-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-red-800 text-lg">
                    Task Not Found
                  </h4>
                  <p className="text-red-600 text-sm mt-1 leading-relaxed">
                    We couldn't find any details for this task. It may have been
                    deleted or is unavailable.
                  </p>
                </div>
              </div>
            </div>
            {/* Main Card */}
            <div className="w-full flex flex-col items-center justify-center ">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl mb-1 capitalize">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(message.timestamp).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {/* Content */}
              <div className="space-y-4 mb-6 sm:mx-10 w-full">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Title
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{message.title}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Message
                    </span>
                  </div>
                  <div className="text-sm mt-0.5 text-gray-900 break-words dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: message?.message }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )
        : messageCategory === "project" || messageCategory === "task_section" || messageCategory === "notice" ? (
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            <button
              className=" text-gray-500 hover:text-gray-600 transition-all duration-200 hover:scale-105"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {/* Author Info */}
            <div className="flex items-center gap-4 my-6 p-4 bg-neutral-50 dark:bg-slate-800/70 rounded-xl border border-neutral-100 dark:border-slate-700">
              {message?.sender!=null ? <ProfileCardWrapper userId={message?.sender}>
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-electricBlue-100/20">
                  <ProfilePicture user={senderUser} className="w-12 h-12 rounded-full object-cover" />
                </div>
              </ProfileCardWrapper>:
              <img src={dyzoAiLogo} alt="AI Icon" className="w-12 h-12" />}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg capitalize">{message?.sender!=null ? displayName : "Dyzo AI"}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <Icon icon="heroicons:calendar" className="w-4 h-4" />
                  <time dateTime={message.timestamp}>
                    {new Date(message.timestamp).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-6">
              {/* Title Section */}
              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-electricBlue-100/10 flex items-center justify-center">
                    <Icon icon="mdi:tag" className="w-4 h-4 text-electricBlue-100" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Subject</span>
                  </div>
                </div>
                <div className="ml-11 p-4 bg-white dark:bg-slate-800 border border-neutral-100 dark:border-slate-700 rounded-xl hover:border-electricBlue-100/30 transition-colors">
                  <p className="text-gray-900 dark:text-white font-medium leading-relaxed">{message.title}</p>
                </div>
              </div>

              {/* Message Section */}
              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-electricBlue-100/10 flex items-center justify-center">
                    <Icon icon="mdi:message-text-outline" className="w-4 h-4 text-electricBlue-100" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Message</span>
                  </div>
                </div>
                <div className="ml-11 p-4 bg-white dark:bg-slate-800 border border-neutral-100 dark:border-slate-700 rounded-xl hover:border-electricBlue-100/30 transition-colors">
                  <div className="text-sm leading-relaxed text-gray-900 dark:text-slate-200 prose prose-sm max-w-none dark:prose-invert">
                    <CommentWithMentions className="contents" rawHtml={message?.message} />
                  </div>
                </div>
              </div>
            </div>
          </div>
      ) : messageCategory === "due_task" ? (
        <div className="p-4 h-full">
            <button
              className=" text-gray-500 hover:text-gray-600 transition-all duration-200 hover:scale-105"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="h-full">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100 ">
                <span className="text-xs font-bold ">Task Name</span>
                <span className="text-xs font-bold ">Due Date</span>
              </div>
              <div className="h-[calc(100%-60px)] overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#9ca3af transparent",
              }}>
                <style>{`
                  div::-webkit-scrollbar {
                    width: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div::-webkit-scrollbar-thumb {
                    background-color: #9ca3af; /* Tailwind gray-400 */
                    border-radius: 4px;
                  }
                `}</style>
                {message?.navigation && 
                  (Array.isArray(message.navigation) 
                    ? message.navigation 
                    : JSON.parse(message.navigation)
                  )?.map((task, i) => (
                    <div key={i} onClick={()=>window.open(`/tasks?taskId=${task?.taskId}&isFocused=true`, "_blank")} className={`text-xs border-t border-x  ${i === JSON.parse(message.navigation).length - 1 ? "border-b" : ""} py-1 px-2 cursor-pointer overflow-hidden font-semibold hover:bg-electricBlue-100/10 flex items-start justify-between gap-2 group`}>
                      <p> {task?.name} </p>
                      <div className="flex items-center gap-1 ">
                        <span className="text-red-500 whitespace-nowrap ">{formatDueDate(task?.dueDate)}</span>
                        <p title="View Task">
                          <Icon icon="heroicons:chevron-right-20-solid" className="w-4 h-4 hidden group-hover:block" />
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
        </div>
      ) : messageCategory === "leave" ? (
          <div className="p-4">
            <button
              className=" text-gray-500 hover:text-gray-600 transition-all duration-200 hover:scale-105"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 my-4 sm:mx-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V7h2v3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-yellow-800 text-lg">
                    Leave Details Not Available
                  </h4>
                  <p className="text-yellow-600 text-sm mt-1 leading-relaxed">
                    Leave details will be available soon. Stay tuned!
                  </p>
                </div>
              </div>
            </div>

            {/* Main Card */}
            <div className="w-full flex flex-col items-center justify-center">
              {/* Header */}
              <div className="flex items-start justify-between mb-6 ">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl mb-1 capitalize">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(message.timestamp).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-6 sm:mx-10 w-full">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Title
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{message.title}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Message
                    </span>
                  </div>
                  <div className="text-sm mt-0.5 text-gray-900 break-words dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: message?.message }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <button
              className=" text-gray-500 hover:text-gray-600 transition-all duration-200 hover:scale-105"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 my-4 sm:mx-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 2a1 1 0 00-1 1v3a1 1 0 002 0V9a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-800 text-lg">
                    No Details Found
                  </h4>
                  <p className="text-blue-600 text-sm mt-1 leading-relaxed">
                    We couldn't find any details for this message.
                  </p>
                </div>
              </div>
            </div>
            {/* Main Card */}
            <div className="w-full flex flex-col items-center justify-center ">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-xl mb-1 capitalize">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(message.timestamp).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {/* Content */}
              <div className="space-y-4 mb-6 sm:mx-10 w-full">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Title
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{message.title}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                      Message
                    </span>
                  </div>
                  <div className="text-sm mt-0.5 text-gray-900 break-words dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: message?.message }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {isAttachmentViewerOpen && (
        <AttachmentViewer
          attachments={attachmentsForView && attachmentsForView}
          initialIndex={currentAttachment}
          open={isAttachmentViewerOpen}
          onClose={() => setIsAttachmentViewerOpen(false)}
        />
      )}
    </div>
  );
};

export default MessageDetailPanel;
