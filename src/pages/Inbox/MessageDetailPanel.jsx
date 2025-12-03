import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { fetchAuthGET } from "@/store/api/apiSlice";

import Avatar from "@/components/ui/Avatar";
import { toast } from "react-toastify";
import CommentWithMentions from "@/components/ui/CommentWithMentions";
import ProfileCardWrapper from "@/components/ui/ProfileCardWrapper";
import { ProfilePicture } from "@/components/ui/profilePicture";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns"

const MessageDetailPanel = ({ message, onClose }) => {
  const navigate = useNavigate();
  const [messageCategory, setMessageCategory] = useState("");
  const { users } = useSelector((state) => state.users);
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
      {messageCategory === "task" || messageCategory === "recurring" ? (
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
              <div className="flex-1">
                <h4 className="font-bold text-blue-800 text-lg">
                  Task Details Unavailable
                </h4>
                <p className="text-blue-600 text-sm mt-1 leading-relaxed">
                  Task features have been disabled.
                </p>
              </div>
            </div>
          </div>
        </div>
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
              {message?.sender != null ? <ProfileCardWrapper userId={message?.sender}>
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-electricBlue-100/20">
                  <ProfilePicture user={senderUser} className="w-12 h-12 rounded-full object-cover" />
                </div>
              </ProfileCardWrapper> :
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon icon="heroicons:cpu-chip" className="w-6 h-6 text-gray-500" />
                </div>}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg capitalize">{message?.sender != null ? displayName : "System"}</h3>
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
                    <div key={i} onClick={() => window.open(`/tasks?taskId=${task?.taskId}&isFocused=true`, "_blank")} className={`text-xs border-t border-x  ${i === JSON.parse(message.navigation).length - 1 ? "border-b" : ""} py-1 px-2 cursor-pointer overflow-hidden font-semibold hover:bg-electricBlue-100/10 flex items-start justify-between gap-2 group`}>
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


    </div>
  );
};

export default MessageDetailPanel;
