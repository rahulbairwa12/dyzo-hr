import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  updateNotification,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications
} from "@/store/notificationsSlice";
import { ProfilePicture } from "@/components/ui/profilePicture";
import ProfileCardWrapper from "@/components/ui/ProfileCardWrapper";
import { fetchUsers } from "@/store/usersSlice";
import CommentWithMentions from "@/components/ui/CommentWithMentions";
import { toast } from "react-toastify";
import DeletePopup from "../inviteemployee/DeletePopup";
import dyzoAiLogo from '../../assets/images/logo/dyzo-ai-logo.png'

const InboxData = ({ onMessageSelect, selectedMessage }) => {
  const [notifications, setNotifications] = useState([]);
  const [showUnread, setShowUnread] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const { users } = useSelector((state) => state.users);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [filterParams, setFilterParams] = useState({});
  const dispatch = useDispatch();
  const {
    notifications: reduxNotifications,
    count: totalCountRedux,
    loading: reduxLoading,
    unread_count,
  } = useSelector((state) => state.notifications);
  const pagingRef = useRef(false);
  const [openClearPopup, setOpenClearPopup] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);

  // Priority and filter handlers
  const handlePriorityChange = (priority) => {
    setSelectedPriority(priority);
    updateFilterParams(priority, selectedFilter);
    setPage(1);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
    updateFilterParams(selectedPriority, filter);
    setPage(1);
  };

  const updateFilterParams = (priority, filter) => {
    let params = { isArchive: false }; // Default: exclude archived

    // Apply priority filter
    if (priority !== "All") {
      params.priorty = priority.toLowerCase();
    }

    // Apply secondary filter
    if (filter === "Unread") {
      params.read = false;
    } else if (filter === "Mentions") {
      params.isMention = true;
    } else if (filter === "Later") {
      params.later = true;
    } else if (filter === "Archive") {
      params.isArchive = true;
      delete params.isArchive; // Remove default
      params.isArchive = true;
    } else if (filter === "Starred") {
      params.starred = true;
    } else if (filter === "Read") {
      params.read = true;
    }

    setFilterParams(params);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Users
  useEffect(() => {
    if (!users || users.length === 0) {
      dispatch(fetchUsers());
    }
  }, [users, dispatch]);

  // Initial fetch and on filter change
  useEffect(() => {
    if (userInfo?._id) {
      if (reduxLoading) return;
      setPage(1);
      dispatch(
        fetchNotifications({
          userId: userInfo._id,
          params: filterParams,
          page: 1,
          append: false,
          useCache: false,
        })
      );
    }
    // eslint-disable-next-line
  }, [userInfo?._id, filterParams, dispatch]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (
        container &&
        !reduxLoading &&
        !pagingRef.current &&
        reduxNotifications.length < totalCountRedux &&
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 100
      ) {
        pagingRef.current = true;
        setPage((prev) => prev + 1);
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
    // Only run on mount/unmount
    // eslint-disable-next-line
  }, [reduxLoading, reduxNotifications.length, totalCountRedux]);

  // Reset pagingRef when reduxLoading completes
  useEffect(() => {
    if (!reduxLoading) {
      pagingRef.current = false;
    }
  }, [reduxLoading]);


  // Fetch more on page change
  useEffect(() => {
    if (page > 1 && userInfo?._id) {
      if (reduxLoading) return;
      dispatch(
        fetchNotifications({
          userId: userInfo._id,
          params: filterParams,
          page: page,
          append: true,
          useCache: false,
        })
      );
    }
    // eslint-disable-next-line
  }, [page]);

  // Auto-load more if not scrollable and more data is available
  useEffect(() => {
    if (
      containerRef.current &&
      !reduxLoading &&
      reduxNotifications.length < totalCountRedux
    ) {
      const container = containerRef.current;
      if (container.scrollHeight <= container.clientHeight) {
        setPage((prev) => prev + 1);
      }
    }
    // eslint-disable-next-line
  }, [reduxNotifications, reduxLoading, totalCountRedux]);

  // Client-side filtering for notifications
  let filteredNotifications = reduxNotifications;

  // Priority filtering (main tabs)
  if (selectedPriority !== "All") {
    filteredNotifications = filteredNotifications.filter(
      (n) => n.priorty === selectedPriority.toLowerCase()
    );
  }

  // Secondary filter (dropdown)
  if (selectedFilter === "Unread") {
    filteredNotifications = filteredNotifications.filter((n) => !n.read && !n.isArchive);
  } else if (selectedFilter === "Read") {
    filteredNotifications = filteredNotifications.filter((n) => n.read && !n.isArchive);
  } else if (selectedFilter === "Mentions") {
    filteredNotifications = filteredNotifications.filter(
      (n) => n.isMention && !n.isArchive
    );
  } else if (selectedFilter === "Later") {
    filteredNotifications = filteredNotifications.filter((n) => n.later);
  } else if (selectedFilter === "Archive") {
    filteredNotifications = filteredNotifications.filter((n) => n.isArchive);
  } else if (selectedFilter === "Starred") {
    filteredNotifications = filteredNotifications.filter((n) => n.starred && !n.isArchive);
  } else {
    // "All" filter: exclude archived by default
    filteredNotifications = filteredNotifications.filter((n) => !n.isArchive);
  }

  function formatDateTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    // Remove time for comparison
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = nowOnly - dateOnly;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    // Format time
    const time = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Format date as dd/mm/yy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    const formattedDate = `${day}/${month}/${year}`;

    if (diffDays === 0) return `${time} Today`;
    if (diffDays === 1) return `${time} Yesterday`;
    return `${time} ${formattedDate}`;
  }


  const handleMessageClick = (msg, e) => {
    // Prevent navigation if clicking on action buttons
    if (e.target.closest("button")) {
      return;
    }

    // Mark as read if not already
    // if (!msg.read) {
    //   dispatch(markNotificationRead({ id: msg.id }));
    // }

    // If there's already a selected message, show detail panel
    if (onMessageSelect) {
      onMessageSelect(msg);
    }
  };

  // Handler to update archive or later status
  const handleNotificationUpdate = (id, field, currentValue) => {
    if (userInfo?._id) {
      dispatch(
        updateNotification({
          id,
          field,
          value: !currentValue,
          userId: userInfo._id,
          params: filterParams,
        })
      );
    }
  };

  const handleReadClick = (id) => {
    dispatch(markNotificationRead({ id }));
  };

  const handleUnreadClick = (id) => {
    dispatch(markNotificationUnread({ id }));
  };

  const handleMarkAllAsRead = async () => {
    if (!userInfo?._id) return;
    if (unread_count < 1) return;
    await dispatch(markAllNotificationsRead({ userId: userInfo._id }));
    // Refresh notifications after marking all as read
    dispatch(
      fetchNotifications({
        userId: userInfo._id,
        params: filterParams,
        page: 1,
        append: false,
        useCache: false,
      })
    );
  };

  const handleDelete = async (id) => {
    if (!userInfo?._id) return;
    try {
      const result = await dispatch(deleteNotification({ ids: [id] })).unwrap();
      toast.success("Notification deleted successfully");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    if (!userInfo?._id) return;
    try {
      await dispatch(clearAllNotifications({ userId: userInfo._id })).unwrap();
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Failed to clear notifications");
    } finally {
      setLoadingClear(false);
      setOpenClearPopup(false);
    }
  };

  // Skeleton loader component
  const SkeletonLoader = () => (
    <>
      {[...Array(10)].map((_, idx) => (
        <div key={idx} className="p-4 border-b animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="flex gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
              <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="h-3 w-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </>
  );

  // Extract plain text from provided HTML snippets (e.g., task_info)
  function getTextContentFromHtml(htmlString) {
    if (!htmlString) return "";
    const container = document.createElement("div");
    container.innerHTML = htmlString;
    const text = container.textContent || container.innerText || "";
    return text.trim();
  }

  // Render project badge/name from object or legacy HTML string
  function renderProject(project) {
    if (!project) return null;
    // New format: object with id/name/color
    if (typeof project === "object") {
      const color = project.color || "#9ca3af";
      const name = project.name || `Project ${project.id ?? ""}`;
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (project.id) {
              navigate(`/project/${project.id}?tab=tasks`);
            }
          }}
          className="inline-flex items-center text-left text-[11px] text-black-700 dark:text-slate-300"
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: color,
              display: "inline-block",
              marginRight: 5,
            }}
          />
          <span className="truncate max-w-[220px] sm:max-w-[280px]">{name}</span>
        </button>
      );
    }
    // Legacy format: HTML string coming from server
    return (
      <div
        className="text-[11px] text-black-700 dark:text-slate-300 break-words w-full"
        dangerouslySetInnerHTML={{ __html: project || "" }}
      />
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-black-800 p-2 sm:p-4 flex flex-col max-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Inbox</h1>
      </div>

      {/* Priority Tabs (Main Tabs) */}
      <div className="flex items-center justify-between border-b border-[#E1E1E1] dark:border-slate-700">
        <div className="flex items-center">
          {/* Filter Dropdown */}
          <div className="relative mr-2" ref={dropdownRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-black-700 rounded transition-colors"
              title="Filter"
              type="button"
            >
              <Icon icon="mi:filter" className="w-5 h-5" />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-black-700 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 z-50 py-1">
                {[
                  { label: "All", icon: "material-symbols:mail-outline" },
                  { label: "Unread", icon: "fluent:mail-unread-16-regular" },
                  { label: "Read", icon: "material-symbols:mark-email-read" },
                  { label: "Mentions", icon: "heroicons:at-symbol" },
                  { label: "Later", icon: "heroicons:bookmark" },
                  { label: "Archive", icon: "material-symbols-light:archive-outline" },
                ].map((filter) => (
                  <button
                    key={filter.label}
                    onClick={() => handleFilterChange(filter.label)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-black-600 flex items-center gap-2 ${selectedFilter === filter.label
                      ? "bg-electricBlue-50/20 dark:bg-black-600 text-electricBlue-100 font-medium"
                      : "text-gray-700 dark:text-gray-300"
                      }`}
                    type="button"
                  >
                    <Icon icon={filter.icon} className="w-4 h-4" />
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Tabs */}
          <div className="flex">
            {[
              { label: "All", icon: "material-symbols:inbox" },
              { label: "Primary", icon: "material-symbols:label-important" },
              { label: "Updates", icon: "material-symbols:info-outline" },
              { label: "Others", icon: "material-symbols:folder-outline" },
            ].map((priority) => (
              <button
                key={priority.label}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-300 border-b-2 focus:outline-none ${selectedPriority === priority.label
                  ? "border-black-500 dark:border-electricBlue-100 text-black-500 dark:text-electricBlue-100"
                  : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                  }`}
                onClick={() => handlePriorityChange(priority.label)}
                type="button"
              >
                <span className="flex items-center gap-1">
                  <Icon icon={priority.icon} className="w-4 h-4" />
                  {priority.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {unread_count > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
              className="p-1 hover:bg-gray-200 dark:hover:bg-black-600 rounded"
            >
              <Icon
                icon="ic:baseline-mark-email-read"
                className="w-5 h-5 cursor-pointer"
              />
            </button>
          )}
          {reduxNotifications?.length > 0 && (
            <button
              onClick={() => setOpenClearPopup(true)}
              title="Clear all notifications"
              className="p-1 hover:bg-red-100 rounded"
            >
              <Icon icon="heroicons:trash" className="w-5 h-5 text-red-500 cursor-pointer" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden mt-2 "
        ref={containerRef}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#9ca3af transparent",
        }}
      >
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
        {reduxLoading && reduxNotifications.length === 0 ? (
          <SkeletonLoader />
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No notifications found.
          </div>
        ) : (
          <>
            {filteredNotifications?.map((msg, i) => {
              const userData = users?.find(u => u._id === Number(msg?.sender));
              return (
                <div
                  key={msg?.id}
                  className={`px-2 py-1 cursor-pointer border-b border-gray-400 hover:scale-[1.005] transition duration-200 ease-in-out w-full max-w-full ${!msg.read ? "hover:bg-slate-50 dark:hover:bg-black-900 " : " bg-neutral-100/80 dark:bg-black-700"
                    } ${selectedMessage?.id === msg?.id ? "bg-dededed" : ""}`}
                  onClick={(e) => handleMessageClick(msg, e)}
                >
                  {/* Top row: Project name */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 w-full">
                    <div>
                      {
                        msg?.category === "notice" ?
                          <div className="flex gap-1">
                            <img src={dyzoAiLogo} alt="logo" className="w-4" />
                            <span className="text-[11px] font-medium text-black-700 dark:text-slate-300">Dyzo</span>
                          </div> :
                          renderProject(msg?.task_project)
                      }
                    </div>
                    <div className="flex gap-1 mt-1 sm:mt-0 self-end sm:self-auto">
                      <button
                        className=" sm:p-1  hover:bg-gray-200 dark:hover:bg-black-600 rounded flex items-center justify-center"
                        title={msg?.isArchive ? "Remove from archive" : "Add to archive"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationUpdate(
                            msg?.id,
                            "isArchive",
                            msg?.isArchive
                          );
                        }}
                      >
                        {msg?.isArchive ? (
                          <Icon
                            icon="material-symbols-light:archive-rounded"
                            className="w-5 h-5 text-black-700 dark:text-slate-200"
                          />
                        ) : (
                          <Icon
                            icon="material-symbols-light:archive-outline"
                            className="w-5 h-5 text-black-700 dark:text-slate-200"
                          />
                        )}
                      </button>

                      <button
                        className=" sm:p-1 hover:bg-gray-200 dark:hover:bg-black-600 rounded flex items-center justify-center"
                        title={msg?.later ? "Remove from later" : "Add to later"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationUpdate(msg?.id, "later", msg?.later);
                        }}
                      >
                        {msg?.later ? (
                          <Icon
                            icon="heroicons:bookmark-solid"
                            className={`w-5 h-5 `}
                          />
                        ) : (
                          <Icon
                            icon="heroicons:bookmark"
                            className={`w-5 h-5 `}
                          />
                        )}
                      </button>

                      <button
                        className=" sm:p-1 hover:bg-gray-200 dark:hover:bg-black-600 rounded flex items-center justify-center"
                        title={msg?.read ? "Mark as unread" : "Mark as read"}
                        onClick={(e) => {
                          e.stopPropagation();
                          msg?.read ? handleUnreadClick(msg?.id) : handleReadClick(msg?.id)
                        }}
                      >
                        {msg?.read ? (
                          <Icon
                            icon="material-symbols:mark-email-read"
                            className={`w-5 h-5 `}
                          />
                        ) : (
                          <Icon
                            icon="material-symbols:mark-email-read-outline"
                            className={`w-5 h-5 `}
                          />
                        )}
                      </button>

                      <button
                        className=" sm:p-1 hover:bg-red-100 rounded flex items-center justify-center"
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(msg?.id)
                        }}
                      >
                        <Icon icon="heroicons:trash" className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Middle row: Task name */}
                  <div className="mt-0.5">
                    <p className="text-sm font-semibold text-black-900 dark:text-slate-100 break-words">
                      {msg?.task_info ? getTextContentFromHtml(msg?.task_info) : (msg?.title || "")}
                    </p>
                  </div>

                  {/* Bottom row: Actor + update message + time */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 w-full pl-3">
                    <div className="flex items-start gap-3 sm:gap-4 w-full">
                      {/* <Avatar
                      src={msg?.sender_profile_picture}
                      name={msg?.sender_name}
                      size="sm"
                      className="mt-1 flex-shrink-0"
                    /> */}

                      <div className="flex-1 min-w-0">
                        <div className="text-xs mt-0.5 text-black-700 break-words dark:text-slate-200"><CommentWithMentions rawHtml={msg?.message} /></div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right sm:text-left ">
                      <span className="text-xs text-black-700 whitespace-nowrap dark:text-slate-200" >
                        {formatDateTime(msg?.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            {loadingMore && (
              <div className="text-center text-gray-400 py-4">
                Loading more...
              </div>
            )}
            {reduxNotifications?.length >= totalCountRedux && (
              <div className="text-center text-gray-300 py-4 text-xs">
                No more notifications.
              </div>
            )}
          </>
        )}
      </div>

      {openClearPopup && (
        <DeletePopup
          title="Clear All Notifications"
          description={`Are you sure you want to delete all notifications?\nThis action cannot be undone.`}
          setOpen={setOpenClearPopup}
          setLoading={setLoadingClear}
          loading={loadingClear}
          onConfirm={handleClearAll}
        />
      )}
    </div>
  );
};

export default InboxData;
