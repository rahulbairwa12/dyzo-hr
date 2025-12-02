import React, { useEffect, useState, useCallback, Fragment, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "@headlessui/react";
import { fetchAuthGET, fetchAuthPatch, fetchAuthPost } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import Card from "@/components/ui/Card";
import { intialLetterName } from "@/helper/helper";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { djangoBaseURL } from "@/helper";
import ListSkeleton from "../table/ListSkeleton";
import { useDispatch } from "react-redux";
import { increment } from "@/store/counterReducer";

const timeSince = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return "a few moments ago";
};

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [nextPage, setNextPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true); 
  const userInfo = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const scrollContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const [markRead, setmarkRead] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldScrollHeight, setOldScrollHeight] = useState(0);
  const [oldScrollTop, setOldScrollTop] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastScrollTop = useRef(0);

  const dispatch = useDispatch();

  const detectPlatform = () => {
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes("win")) {
      return "windows";
    } else if (platform.includes("mac")) {
      return "mac";
    }
    return "unknown";
  };

  const appendDesktopAppNotification = () => {
    const platform = detectPlatform(); 
    let downloadLink = "#";
    if (platform === "windows") {
      downloadLink = "https://staging.api.dyzo.ai/downloads/windows/latest-build";
    } else if (platform === "mac") {
      downloadLink = "https://github.com/prpwebsteam/dyzo-desktop-app/releases/download/mac1.0.1/Dyzo.AI-1.0.16.dmg";
    }
  
    const desktopNotification = {
      id: "desktop-app",
      title: "Desktop App",
      message: "Download the desktop application for tracking your time.",
      timestamp: new Date(),
      read: false,
      downloadLink,
    };

    const chromeExtensionNotification = {
      id: "chrome-extension",
      title: "Chrome Extension",
      message: "Install the Dyzo Task Manager Chrome Extension for quick task management.",
      timestamp: new Date(),
      read: false,
      downloadLink: "https://chromewebstore.google.com/detail/dyzo-task-manager/lajocdihefihpcidhehkiodaibaibjaf",
    };
  
    const demoNotification = {
      id: "book-demo",
      title: "Book a Free Demo",
      message: "Experience Dyzo AI in action by booking a free demo session.",
      timestamp: new Date(),
      read: false,
      demoLink: "https://calendly.com/tushar-46/dyzo-ai-demo-call",
    };
  
    setNotifications((prev) => [desktopNotification, chromeExtensionNotification, demoNotification, ...prev]);
  };

  const fetchNotifications = useCallback(
    async (page) => {
      setLoading(true);
      try {
        const response = await fetchAuthGET(
          `${baseURL}/notifications/recipient/${userInfo._id}/?page=${page}`
        );
        if (response.results.status) {
          if (response.results.data.length > 0) {
            setNotifications((prev) => [...prev, ...response.results.data]);
            setNextPage(page + 1);
          } else {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [baseURL, userInfo]
  );

  useEffect(() => {
    if (userInfo?._id) {
      fetchNotifications(1);
      appendDesktopAppNotification();
      setIsInitialLoad(false);
    }
  }, [userInfo, fetchNotifications]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isInitialLoad) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // Check if scrolling down
    if (scrollTop < lastScrollTop.current) {
      lastScrollTop.current = scrollTop;
      return; // Don't load more if scrolling up
    }
    
    lastScrollTop.current = scrollTop;
    const scrollPosition = scrollTop + clientHeight;
    
    if (scrollPosition >= 0.95 * scrollHeight && !loading && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setOldScrollHeight(scrollHeight);
      setOldScrollTop(scrollTop);
      fetchNotifications(nextPage);
    }
  }, [loading, hasMore, isLoadingMore, nextPage, fetchNotifications, isInitialLoad]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    if (isLoadingMore && scrollContainerRef.current) {
      requestAnimationFrame(() => {
        const newScrollHeight = scrollContainerRef.current.scrollHeight;
        const scrollDiff = newScrollHeight - oldScrollHeight;
        scrollContainerRef.current.scrollTop = oldScrollTop + scrollDiff;
        setIsLoadingMore(false);
      });
    }
  }, [notifications, isLoadingMore, oldScrollHeight, oldScrollTop]);

  const handleReadClick = async (id) => {
    try {
      const response = await fetchAuthPatch(
        `${baseURL}/api/notifications/${id}/mark-read/`,
        {}
      );
      if (response.status) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? { ...notification, read: true }
              : notification
          )
        );
        dispatch(increment())
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const onNavigationHandler = (title, importantId) => {
    let detailPath = "";

    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("task") || lowerTitle.includes("task completed")) {
      detailPath = importantId ? `/tasks?taskId=${importantId}` : "/tasks";
    } else if (lowerTitle.includes("team")) {
      detailPath = importantId
        ? `/team-management/${importantId}`
        : "/team-management";
    } else if (lowerTitle.includes("leave")) {
      detailPath = importantId
        ? `/leaves/leave-detail/${importantId}` : "/leaves";
    } else if (lowerTitle.includes("project")) {
      detailPath = importantId
        ? `/project-details/${importantId}` : "/projects-management";
    } else if (lowerTitle.includes("chat liked")) {
      detailPath = importantId ? `/tasks?taskId=${importantId}` : "/tasks";
    } else {
      detailPath = "/dashboard";
    }

    navigate(`${detailPath}`);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetchAuthPost(
        `${djangoBaseURL}/mark_notifications_as_read/${userInfo?._id}/`,
        {}
      );
      if (response.status) {
        toast.success("All notifications marked as read");
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
        dispatch(increment())
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  return (
    <div>
      <Card bodyClass="p-0">
        <div className="flex justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-600">
          <div className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-6">
            All Notifications
          </div>
          <Button
            icon="ic:baseline-mark-email-read"
            className="btn-primary"
            text="Read all"
            onClick={handleMarkAllAsRead}
          />
        </div>

        {notifications.length === 0 ? (
          <div className="text-center text-slate-600 dark:text-slate-300 p-4">
            No Notifications
          </div>
        ) : (
          <div
            className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto"
            ref={scrollContainerRef}
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            <Menu as={Fragment}>
              {notifications.map((item, i) => (
                <Menu.Item key={i}>
                  {({ active }) => (
                    <div
                      className={`${
                        active
                          ? "bg-slate-100 dark:bg-slate-700 dark:bg-opacity-70 text-slate-800"
                          : "text-slate-600 dark:text-slate-300"
                      } block w-full px-4 py-2 text-sm cursor-pointer`}
                      onClick={() => {
                        if (item.id === "book-demo") {
                          window.open(item.demoLink, "_blank");
                        } else if (item.id !== "desktop-app") {
                          onNavigationHandler(item.title, item.importantId);
                          handleReadClick(item.id);
                        }
                      }}
                    >
                      <div className="flex ltr:text-left rtl:text-right">
                        <div className="flex-none ltr:mr-3 rtl:ml-3">
                          {!(item.id === "desktop-app" || item.id === "chrome-extension" || item.id === "book-demo") && (
                            <div className="h-8 w-8 bg-white rounded-full">
                              {item.sender_profile_picture ? (
                                <img
                                  src={baseURL + item.sender_profile_picture}
                                  alt=""
                                  className="block w-full h-full object-cover rounded-full border"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-700 flex justify-center items-center">
                                  {intialLetterName(
                                    item.sender_first_name,
                                    item.sender_last_name,
                                    item.sender_name,
                                    ""
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-200 leading-4">
                            {item.message}
                          </div>
                          {item.id === "desktop-app" && (
                            <Button
                              icon="heroicons-outline:download"
                              text="Download"
                              className="text-blue-500 text-xs mt-2 inline-flex items-center underline"
                              onClick={() => window.open(item.downloadLink, "_blank")}
                            />
                          )}
                          {item.id === "chrome-extension" && (
                            <Button
                              icon="heroicons-outline:puzzle"
                              text="Install Extension"
                              className="text-blue-500 text-xs mt-2 inline-flex items-center underline"
                              onClick={() => window.open(item.downloadLink, "_blank")}
                            />
                          )}
                          {item.id === "book-demo" && (
                            <Button
                              icon="heroicons-outline:calendar"
                              text="Book Demo"
                              className="text-blue-500 text-xs mt-2 inline-flex items-center underline"
                              onClick={() => window.open(item.demoLink, "_blank")}
                            />
                          )}
                          <div className="text-slate-400 dark:text-slate-400 text-xs mt-1">
                            {timeSince(item.timestamp)}
                          </div>
                        </div>
                        {!item.read && item.id !== "desktop-app" && (
                          <div className="flex-0">
                            <span className="h-[10px] w-[10px] bg-danger-500 border border-white dark:border-slate-400 rounded-full inline-block"></span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Menu.Item>
              ))}
            </Menu>
            {loading && hasMore && (
              <div className="p-4 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                <span className="ml-2 text-sm text-slate-500">Loading more...</span>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationPage;
