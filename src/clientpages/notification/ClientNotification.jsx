import React, { useEffect, useState, useCallback, Fragment, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "@headlessui/react";
import { fetchAuthGET, fetchAuthPatch } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import useDarkMode from "@/hooks/useDarkMode";
import Dropdown from "@/components/ui/Dropdown";
import Pagination from "@/components/ui/Pagination";

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
        if (days === 1) {
            return "1 day ago";
        } else if (days === 2) {
            return "2 days ago";
        }
        return days + " days ago";
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
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const userInfo = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_APP_DJANGO;
    const scrollContainerRef = useRef(null);
    const loadingRef = useRef(false);
    const [isDark] = useDarkMode();

    const fetchNotifications = useCallback(async (page, limit = itemsPerPage) => {
        if (loadingRef.current) return;
        
        loadingRef.current = true;
        
        if (page === 1) {
            setInitialLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const { data, total_pages, count } = await fetchAuthGET(`${baseURL}/client/notifications/recipient/${userInfo._id}/?page=${page}&limit=${limit}`);
            
            if (data && data.length > 0) {
                setNotifications(data);
                setNextPage(page + 1);
                setTotalPages(total_pages || 1);
                setCurrentPage(page);
                setTotalCount(count || 0);
                setHasMore(page < total_pages);
            } else {
                setNotifications([]);
                setTotalPages(1);
                setCurrentPage(1);
                setTotalCount(0);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
            setTotalPages(1);
            setCurrentPage(1);
            setTotalCount(0);
            setHasMore(false);
        } finally {
            setInitialLoading(false);
            setLoadingMore(false);
            loadingRef.current = false;
        }
    }, [baseURL, userInfo, itemsPerPage]);

    useEffect(() => {
        if (userInfo?._id) {
            fetchNotifications(1);
        }
    }, [userInfo, fetchNotifications]);

    const handleReadClick = async (id) => {
        try {
            const response = await fetchAuthPatch(`${baseURL}/api/notifications/${id}/mark-read/`, {});
            if (response.status) {
                setNotifications((prev) => prev.map(notification =>
                    notification.id === id ? { ...notification, read: true } : notification
                ));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const onNavigationHandler = (title, importantId) => {
        let basePath = '/dashboard';
        let detailPath = '';

        const lowerTitle = title.toLowerCase();

        if (lowerTitle.includes("task") || lowerTitle.includes("task completed")) {
            detailPath = importantId ? `/projecttasks?taskId=${importantId}` : '/projecttasks';
        } else if (lowerTitle.includes("team")) {
            detailPath = importantId ? `/team/${importantId}` : '/teamManagement';
        } else if (lowerTitle.includes("leave")) {
            detailPath = importantId ? `/leaves/${importantId}` : '/leaves';
        } else if (lowerTitle.includes("project")) {
            detailPath = importantId ? `/project-detail/${importantId}` : '/projects';
        } else if (lowerTitle.includes("chat liked")) {
            detailPath = importantId ? `/projecttasks?taskId=${importantId}` : '/projecttasks';
        } else {
            detailPath = '';
        }

        navigate(`${basePath}${detailPath}`);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            fetchNotifications(page);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
            }
        }
    };

    const handleItemsPerPageChange = (limit) => {
        setItemsPerPage(limit);
        fetchNotifications(1, limit);
    };

    const renderPagination = () => {
        const startEntry = (currentPage - 1) * itemsPerPage + 1;
        const endEntry = Math.min(currentPage * itemsPerPage, totalCount);

        return (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex-wrap gap-2">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    {totalCount > 0 ? `Showing ${startEntry} to ${endEntry} of ${totalCount} entries` : 'No entries'}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Show</span>
                    <Dropdown
                        classBlock=""
                        classContainer="inline-block"
                        contentClasses="min-w-[120px]"
                        label={
                            <button className="inline-flex justify-center items-center gap-1 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                {itemsPerPage}
                                <Icon icon="heroicons:chevron-down" className="w-4 h-4" />
                            </button>
                        }
                    >
                        <div className="py-1">
                            {[10, 25, 50, 100].map((limit) => (
                                <Menu.Item key={limit}>
                                    {({ active }) => (
                                        <button
                                            onClick={() => handleItemsPerPageChange(limit)}
                                            className={`${active ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'} block w-full text-left px-4 py-2 text-sm`}
                                        >
                                            {limit}
                                        </button>
                                    )}
                                </Menu.Item>
                            ))}
                        </div>
                    </Dropdown>
                    <span className="text-sm text-slate-500 dark:text-slate-400">entries</span>
                </div>
                
                <Pagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    handlePageChange={handlePageChange}
                    className="flex items-center space-x-2"
                />
            </div>
        );
    };

    const renderInitialLoading = () => (
        <div className="space-y-4 p-4">
            {[...Array(5)].map((_, index) => (
                <div key={index} className="flex justify-center items-center">
                    <div className="w-full mt-[-1px] bg-gray-200 dark:bg-slate-700 overflow-x-auto relative rounded-lg shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 animate-scroll rounded-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-800 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 mb-4 text-slate-400 dark:text-slate-600">
                <Icon icon="heroicons-outline:bell" className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">No notifications</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                You're all caught up! Check back later for new updates.
            </p>
        </div>
    );

    return (
        <div className="h-full">
            <Card bodyClass="p-0">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                        <Icon icon="heroicons-outline:bell" className="w-5 h-5 text-primary-500" />
                        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                            Notifications
                        </h2>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {totalCount} {totalCount === 1 ? 'notification' : 'notifications'}
                    </div>
                </div>

                {initialLoading ? (
                    renderInitialLoading()
                ) : notifications.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <div className="relative">
                        <div 
                            ref={scrollContainerRef}
                            className="overflow-y-auto max-h-[calc(100vh-300px)]"
                        >
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {notifications.map((item, i) => (
                                    <div
                                        key={item.id || i}
                                        className={`group relative px-6 py-4 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${
                                            !item.read ? 'bg-slate-50/50 dark:bg-slate-700/30' : ''
                                        }`}
                                        onClick={() => {
                                            onNavigationHandler(item.title, item.importantId);
                                            handleReadClick(item.id);
                                        }}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="relative">
                                                    <img
                                                        src={baseURL + item.sender_profile_picture}
                                                        alt=""
                                                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                                                    />
                                                    {!item.read && (
                                                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary-500 ring-2 ring-white dark:ring-slate-800"></span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                    {item.message}
                                                </p>
                                                <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
                                                    <Icon icon="heroicons-outline:clock" className="w-4 h-4 mr-1" />
                                                    {timeSince(item.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Card>
            {!initialLoading && loadingMore && (
                <div className="absolute bottom-[60px] left-0 right-0 bg-white dark:bg-slate-800 py-4">
                    <div className="flex justify-center items-center">
                        <div className="w-full max-w-md mx-4 bg-gray-200 dark:bg-slate-700 overflow-x-auto relative rounded-lg shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 animate-scroll rounded-lg"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {!initialLoading && notifications.length > 0 && renderPagination()}
        </div>
    );
};

export default NotificationPage;