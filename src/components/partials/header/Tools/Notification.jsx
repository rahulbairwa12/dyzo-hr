import React, { useEffect, useState, useCallback, useMemo } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "@headlessui/react";
import { fetchAuthGET, fetchAuthPatch, fetchAuthPost } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import { intialLetterName } from "@/helper/helper";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

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
        const days = Math.floor(interval);
        return days + (days === 1 ? " day ago" : " days ago");
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

const notifyLabel = (unreadCount) => {
    const displayCount = unreadCount > 99 ? "99+" : unreadCount;
    return (
        <span className="Notification relative lg:h-[32px] lg:w-[32px] lg:bg-slate-100 text-slate-900 lg:dark:bg-slate-900 dark:text-white cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center">
            <Icon icon="heroicons-outline:bell" className="animate-tada" />
            {unreadCount > 0 && (
                <span className="absolute lg:right-0 lg:top-0 -top-2 -right-2 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-[99]">
                    {displayCount}
                </span>
            )}
        </span>
    );
};

const Notification = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState('unread');
    const [specialNotifications, setSpecialNotifications] = useState([]);
    const userInfo = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_APP_DJANGO;
    const userId = userInfo?._id;
    const counterRead = useSelector((state) => state.counter.value);

    const fetchNotifications = async (page = 1, isReadTab = false) => {
        if (!userInfo?._id) return;

        const userId = userInfo._id;
        if (loading && page === 1) return;
        if (loadingMore && page > 1) return;

        try {
            page === 1 ? setLoading(true) : setLoadingMore(true);

            // Determine which endpoint to use based on whether we're loading for the read tab
            // For read tab, we need to specifically request read notifications
            const endpoint = isReadTab
                ? `${baseURL}/notifications/recipient/${userId}/?page=${page}&page_size=20&is_read=true`
                : `${baseURL}/notifications/recipient/${userId}/?page=${page}&page_size=20`;

            const response = await fetchAuthGET(endpoint , false);

            if (response.results?.status) {
                const data = response.results;

                // Format notifications
                const formattedNotifications = data.data.map(notif => ({
                    id: notif.id,
                    title: notif.title,
                    message: notif.message,
                    timestamp: notif.timestamp || notif.created_at,
                    read: notif.read || notif.is_read,
                    sender_name: notif.sender_name,
                    sender_first_name: notif.sender_first_name,
                    sender_last_name: notif.sender_last_name,
                    sender_profile_picture: notif.sender_profile_picture,
                    importantId: notif.important_id || notif.importantId,
                    image: notif.sender_profile_picture ? baseURL + notif.sender_profile_picture : null
                }));

                if (isReadTab) {
                    // For read tab, we're loading a separate set of notifications
                    setNotifications(prev => {
                        // Filter out read notifications and add the new ones
                        const unreadNotifs = prev.filter(n => !n.read);
                        return [...unreadNotifs, ...formattedNotifications];
                    });
                } else {
                    // Normal loading behavior
                    if (page === 1) {
                        setNotifications(formattedNotifications);
                    } else {
                        setNotifications(prev => [...prev, ...formattedNotifications]);
                    }
                }

                // Set next page if there are more notifications to load
                const hasMorePages = data.data.length === 20; // If we got a full page, there might be more
                setNextPage(hasMorePages ? page + 1 : null);

                // Count unread notifications (excluding special notifications)
                const apiUnreadCount = data.unread_count || 0;

                // Add special notifications count if they exist
                setUnreadCount(apiUnreadCount + specialNotifications.length);

            }
        } catch (error) {
            toast.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const detectPlatform = () => {
        const platform = window.navigator.platform.toLowerCase();
        if (platform.includes("win")) {
            return "windows";
        } else if (platform.includes("mac")) {
            return "mac";
        }
        return "unknown";
    };

    // const appendSpecialNotifications = useCallback(() => {
    //     const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedSpecialNotifications') || '{}');
    //     const platform = detectPlatform();
    //     let downloadLink = "#";
    //     if (platform === "windows") {
    //         downloadLink = "https://github.com/prpwebsteam/dyzo-electron/releases/download/v1.0.20/Dyzo.AI.Setup.1.0.20.exe";
    //     } else if (platform === "mac") {
    //         downloadLink = "https://github.com/prpwebsteam/dyzo-desktop-app/releases/download/mac1.0.1/Dyzo.AI-1.0.16.dmg";
    //     }
    //     const specialNotifs = [];
    //     // Desktop App
    //     if (!dismissedNotifications['desktop-app']) {
    //         specialNotifs.push({
    //             id: "desktop-app",
    //             title: "Desktop App",
    //             message: "Download the desktop application for tracking your time.",
    //             timestamp: new Date(),
    //             read: false,
    //             downloadLink,
    //             isSpecial: true
    //         });
    //     }
    //     // Chrome Extension
    //     if (!dismissedNotifications['chrome-extension']) {
    //         specialNotifs.push({
    //             id: "chrome-extension",
    //             title: "Chrome Extension",
    //             message: "Install the Dyzo Task Manager Chrome Extension for quick task management.",
    //             timestamp: new Date(),
    //             read: false,
    //             downloadLink: "https://chromewebstore.google.com/detail/dyzo-task-manager/lajocdihefihpcidhehkiodaibaibjaf",
    //             isSpecial: true
    //         });
    //     }
    //     // Book a Demo
    //     if (!dismissedNotifications['book-demo']) {
    //         specialNotifs.push({
    //             id: "book-demo",
    //             title: "Book a Free Demo",
    //             message: "Experience Dyzo in action by booking a free demo session.",
    //             timestamp: new Date(),
    //             read: false,
    //             demoLink: "https://calendly.com/tushar-46/dyzo-ai-demo-call",
    //             isSpecial: true
    //         });
    //     }
    //     setSpecialNotifications(specialNotifs);
    //     if (specialNotifs.length > 0) {
    //         setUnreadCount(prev => prev + specialNotifs.length);
    //     }
    // }, []);

    // useEffect(() => {
    //     appendSpecialNotifications();
    // }, [appendSpecialNotifications]);

    // Load initial notifications
    
    
    useEffect(() => {
        // Load unread notifications first
        fetchNotifications(1, false);

        // Then load read notifications after a short delay
        const timer = setTimeout(() => {
            fetchNotifications(1, true);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;

        // If scrolled to bottom and there's a next page
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && nextPage && !loading && !loadingMore) {
            // Load the correct type of notifications based on active tab
            fetchNotifications(nextPage, activeTab === 'read');
        }
    };

    const handleReadClick = async (id) => {
        try {
            // Send request to mark notification as read using the correct API endpoint
            const response = await fetchAuthPost(`${baseURL}/api/notifications/read/${id}/`, {});

            if (response.status) {
                // Update notification in state
                setNotifications(prev =>
                    prev.map(notification =>
                        notification.id === id
                            ? { ...notification, read: true }
                            : notification
                    )
                );

                // Decrease unread count
                setUnreadCount(prev => prev - 1);
            }
        } catch (error) {
            toast.error("Failed to mark notification as read");

            // For demo purposes, still update UI even if API fails
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === id
                        ? { ...notification, read: true }
                        : notification
                )
            );
            setUnreadCount(prev => prev - 1);
        }
    };

    const handleUnreadClick = async (id) => {
        try {
            // Send request to mark notification as unread using the correct API endpoint
            const response = await fetchAuthPost(`${baseURL}/api/notifications/unread/${id}/`, {});

            if (response.status) {
                // Update notification in state
                setNotifications(prev =>
                    prev.map(notification =>
                        notification.id === id
                            ? { ...notification, read: false }
                            : notification
                    )
                );

                // Increase unread count
                setUnreadCount(prev => prev + 1);
            }
        } catch (error) {
            toast.error("Failed to mark notification as unread");

            // For demo purposes, still update UI even if API fails
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === id
                        ? { ...notification, read: false }
                        : notification
                )
            );
            setUnreadCount(prev => prev + 1);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) {
            toast.info("No unread notifications");
            return;
        }

        setLoadingMore(true);
        try {
            const response = await fetchAuthPost(`${baseURL}/mark_notifications_as_read/${userId}/`, {});
            if (response.status) {
                // Update all notifications to read
                setNotifications((prev) => prev.map(notification => {
                    // Don't mark special notifications as read
                    if (notification.id === "desktop-app" || notification.id === "book-demo") {
                        return notification;
                    }
                    return { ...notification, read: true };
                }));

                // Update unread count (excluding special notifications)
                const specialNotificationsCount = notifications.filter(
                    n => (n.id === "desktop-app" || n.id === "book-demo") && !n.read
                ).length;

                setUnreadCount(specialNotificationsCount);
                toast.success("All notifications marked as read");
            } else {
                toast.error("Failed to mark notifications as read");
            }
        } catch (error) {
            toast.error("An error occurred");
            console.error("Error marking all as read:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const onNavigationHandler = (title, importantId) => {
        let detailPath = '';

        const lowerTitle = title.toLowerCase();

        if (lowerTitle.includes("task") || lowerTitle.includes("task completed")) {
            detailPath = importantId ? `/tasks?taskId=${importantId}` : '/tasks';
        } else if (lowerTitle.includes("team")) {
            detailPath = importantId ? `/team-management/${importantId}` : '/team-management';
        } else if (lowerTitle.includes("leave")) {
            detailPath = importantId ? `/leaves/leave-detail/${importantId}` : '/leaves';
        } else if (lowerTitle.includes("project")) {
            detailPath = importantId ? `/project-details/${importantId}` : '/projects-management';
        } else if (lowerTitle.includes("chat liked")) {
            detailPath = importantId ? `/tasks?taskId=${importantId}` : '/tasks';
        } else {
            detailPath = '/dashboard';
        }

        navigate(`${detailPath}`);
    };

    // Filter notifications based on active tab
    const filteredNotifications = useMemo(() => {
        // Count read notifications for debugging
        const readCount = notifications.filter(notification => notification.read).length;

        if (activeTab === 'unread') {
            // For unread tab, show unread notifications and special notifications
            return [
                ...specialNotifications,
                ...notifications.filter(notification => !notification.read && !notification.isSpecial)
            ];
        } else {
            // For read tab, show only read notifications (excluding special ones)
            return notifications.filter(notification => notification.read && !notification.isSpecial);
        }
    }, [activeTab, notifications, specialNotifications]);

    // Function to handle dismissing special notifications
    const handleDismissSpecial = (id) => {
        // Store dismissed notification in localStorage
        const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedSpecialNotifications') || '{}');
        dismissedNotifications[id] = true;
        localStorage.setItem('dismissedSpecialNotifications', JSON.stringify(dismissedNotifications));

        // Remove from special notifications
        setSpecialNotifications(prev => prev.filter(notification => notification.id !== id));

        // Update unread count
        setUnreadCount(prev => prev - 1);
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (notification.isSpecial) {
            if (notification.id === "book-demo") {
                window.open(notification.demoLink, "_blank");
            } else if (notification.id === "desktop-app") {
                window.open(notification.downloadLink, "_blank");
            }
        } else {
            // Navigate to the appropriate page based on notification type
            onNavigationHandler(notification.title, notification.importantId);
        }
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);

        // If switching to read tab, load read notifications
        if (tab === 'read') {
            // Load read notifications
            fetchNotifications(1, true);
        }
    };

    return (
        <Dropdown
            classMenuItems="md:w-[400px] w-[300px] dark:bg-slate-800 dark:border-slate-700 top-[58px]"
            label={notifyLabel(unreadCount)}
        >
            <div className="flex justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-600">
                <div className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-6">
                    Notifications
                </div>
                <div className="flex items-center space-x-3">
                    {activeTab === 'unread' && (
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={loadingMore || unreadCount === 0}
                            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            {loadingMore ? (
                                <span className="flex items-center">
                                    <Icon icon="heroicons-outline:refresh" className="animate-spin mr-1" />
                                    Marking...
                                </span>
                            ) : (
                                "Mark all as read"
                            )}
                        </button>
                    )}
                    <div className="text-slate-800 dark:text-slate-200 text-xs">
                        <Link to="/notifications" className="underline">
                            View all
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-700">
                <button
                    className={`flex-1 py-2 text-sm font-medium text-center ${activeTab === 'unread'
                        ? 'text-blue-500 border-b-2 border-blue-500'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    onClick={() => handleTabChange('unread')}
                >
                    Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                    className={`flex-1 py-2 text-sm font-medium text-center ${activeTab === 'read'
                        ? 'text-blue-500 border-b-2 border-blue-500'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    onClick={() => handleTabChange('read')}
                >
                    Read
                </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-[400px]" onScroll={handleScroll}>
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification, index) => (
                        <div
                            className="flex items-center p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                            key={index}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="flex-1 flex space-x-4 rtl:space-x-reverse">
                                <div className={`flex-none ${notification.image ? "" : "hidden"}`}>
                                    <div className="h-10 w-10 rounded-full">
                                        <img
                                            src={notification.image}
                                            alt=""
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-slate-800 dark:text-slate-300 text-sm font-medium mb-1">
                                        {notification.title}
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-300 text-xs">
                                        {notification.message}
                                    </div>
                                    {notification.id === "desktop-app" && (
                                        <a
                                            href={notification.downloadLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-primary-500 block mt-1 hover:underline"
                                        >
                                            Download Now
                                        </a>
                                    )}
                                    {notification.id === "chrome-extension" && (
                                        <a
                                            href={notification.downloadLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-primary-500 block mt-1 hover:underline"
                                        >
                                            Install Extension
                                        </a>
                                    )}
                                    {notification.id === "book-demo" && (
                                        <a
                                            href={notification.demoLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-primary-500 block mt-1 hover:underline"
                                        >
                                            Book Now
                                        </a>
                                    )}
                                    <div className="text-slate-400 dark:text-slate-400 text-xs mt-1">
                                        {notification.timestamp && formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                    </div>
                                </div>
                                <div className="flex-none">
                                    {notification.isSpecial ? (
                                        <button
                                            className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDismissSpecial(notification.id);
                                            }}
                                            title="Dismiss"
                                        >
                                            <Icon icon="heroicons-outline:x" className="text-lg" />
                                        </button>
                                    ) : notification.read ? (
                                        <button
                                            className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnreadClick(notification.id);
                                            }}
                                            title="Mark as unread"
                                        >
                                            <Icon icon="heroicons-outline:reply" className="text-lg" />
                                        </button>
                                    ) : (
                                        <button
                                            className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReadClick(notification.id);
                                            }}
                                            title="Mark as read"
                                        >
                                            <Icon icon="heroicons-outline:check" className="text-lg" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <div className="text-base text-slate-600 dark:text-slate-300">
                            {activeTab === 'unread' ? 'No unread notifications' : 'No read notifications'}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {activeTab === 'unread' ? 'You\'re all caught up!' : 'Notifications you\'ve read will appear here'}
                        </div>
                    </div>
                )}
            </div>
        </Dropdown>
    );
};

export default Notification;