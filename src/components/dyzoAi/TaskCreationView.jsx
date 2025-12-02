import React, { useState, useRef, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import moment from "moment";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchUsers } from "@/store/usersSlice";
import { fetchAuthPost } from "@/store/api/apiSlice";
import UserMultiSelect from "@/components/dropdowns/UserMultiSelect";
import useDarkMode from "@/hooks/useDarkMode";

const TaskCreationView = ({ tasks, message, onDiscard, onConfirm }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { users, loading: loadingUsers } = useSelector((state) => state.users);
    const { user: userInfo } = useSelector((state) => state.auth);
    const { projects } = useSelector((state) => state.projects);
    const [isDark] = useDarkMode();

    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [editableTasks, setEditableTasks] = useState(tasks || []);
    const [editingField, setEditingField] = useState({ taskIndex: null, field: null });
    const [showDatePicker, setShowDatePicker] = useState({});
    const [showUserModal, setShowUserModal] = useState({});
    const [createdTasks, setCreatedTasks] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showAllTasks, setShowAllTasks] = useState(false);
    const [showAllEditableTasks, setShowAllEditableTasks] = useState(false);
    // Fetch users on component mount
    useEffect(() => {
        if (users.length === 0) {
            dispatch(fetchUsers());
        }
    }, [dispatch, users.length]);

    // Click outside handler for modals
    useEffect(() => {
        const handleClickOutside = (event) => {
            const hasOpenModals = Object.values(showUserModal).some(Boolean) || Object.values(showDatePicker).some(Boolean);

            if (hasOpenModals) {
                const isModalClick = event.target.closest('[data-modal]');
                const isButtonClick = event.target.closest('[data-modal-button]');

                if (!isModalClick && !isButtonClick) {
                    setShowUserModal({});
                    setShowDatePicker({});
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserModal, showDatePicker]);

    // Helper functions for editing tasks
    const updateTask = (taskIndex, field, value) => {
        setEditableTasks(prev => prev.map((task, index) =>
            index === taskIndex ? { ...task, [field]: value } : task
        ));
    };

    const handleFieldEdit = (taskIndex, field) => {
        setEditingField(prev =>
            prev.taskIndex === taskIndex && prev.field === field
                ? { taskIndex: null, field: null }
                : { taskIndex, field }
        );
    };

    const isEditing = (taskIndex, field) => {
        return editingField.taskIndex === taskIndex && editingField.field === field;
    };

    const handleDatePickerToggle = (taskIndex) => {
        setShowDatePicker(prev => ({
            ...prev,
            [taskIndex]: !prev[taskIndex]
        }));
    };

    const handleDateChange = (taskIndex, dateValue) => {
        if (dateValue) {
            updateTask(taskIndex, 'dueDate', dateValue);
        }
        setShowDatePicker(prev => ({ ...prev, [taskIndex]: false }));
    };

    const handleUserAvatarClick = (taskIndex) => {
        setShowUserModal(prev => ({
            ...prev,
            [taskIndex]: !prev[taskIndex]
        }));
    };

    const handleUserSelection = (updatedTask, property) => {
        if (property === "assigned_users") {
            const taskIndex = editableTasks.findIndex(task => task._id === updatedTask._id);
            if (taskIndex !== -1) {
                updateTask(taskIndex, 'assigned_users', updatedTask.assigned_users);
            }
        }
        // Close all user modals
        setShowUserModal({});
    };

    const handleDeleteTask = (taskIndex) => {
        setEditableTasks(prev => prev.filter((_, index) => index !== taskIndex));
    };

    const handleDiscard = () => {
        // Reset all states
        setCreatedTasks(null);
        setShowAllTasks(false);
        setShowAllEditableTasks(false);
        setEditingField({ taskIndex: null, field: null });
        setShowDatePicker({});
        setShowUserModal({});
        setIsCreating(false);

        // Call the original onDiscard function
        onDiscard();
    };

    const handleConfirmTasks = async () => {
        if (!editableTasks || editableTasks.length === 0) {
            toast.error("No tasks to create");
            return;
        }

        setIsCreating(true);

        try {
            // Prepare the payload according to the required format
            const tasksPayload = editableTasks.map(task => ({
                taskName: task.taskName || "Untitled Task",
                description: task.description || null,
                userId: userInfo._id,
                projectId: task.project || userInfo.default_project_id, // Default project ID or from user info
                assigned_users: task.assigned_users?.map(user => user._id || user) || [userInfo._id],
                dueDate: task.dueDate || null
            }));

            const payload = { tasks: tasksPayload };



            const response = await fetchAuthPost(
                `${import.meta.env.VITE_APP_DJANGO}/api/bulk-create-tasks/${userInfo._id}/`,
                { body: payload }
            );

            if (response && response.status === 1) {
                // Store created tasks and show the success view
                const createdTasksWithProject = (response.tasks || []).map(task => ({
                    ...task,
                    projectId: task.projectId || userInfo.default_project_id
                }));
                setCreatedTasks(createdTasksWithProject);

                // Call the original onConfirm with the created tasks
                onConfirm(createdTasksWithProject);
            } else {
                toast.error(response?.message || "Failed to create tasks");
            }
        } catch (error) {
            console.error("Error creating tasks:", error);
            toast.error("An error occurred while creating tasks");
        } finally {
            setIsCreating(false);
        }
    };

    const handleTaskClick = (taskId) => {
        navigate(`/tasks?userId=${userInfo._id}&taskId=${taskId}`)
    };

    const handleProjectClick = (projectId) => {
        if (projectId) {
            const url = `/project/${projectId}`;
            navigate(url); // Navigate in same tab
        }
    };

    // Get project information from Redux based on project ID
    const getProjectInfo = (projectId) => {
        if (!projectId || !projects || projects.length === 0) {
            return { name: "Unknown Project", projectColor: "#846b8d" };
        }

        const project = projects.find(p => p._id === projectId);
        if (project) {
            return {
                name: project.name,
                projectColor: project.projectColor || "#846b8d"
            };
        }

        return { name: "Unknown Project", projectColor: "#846b8d" };
    };

    // Show success view if tasks have been created
    if (createdTasks) {
        // Get project info from the first task's project ID
        const projectId = createdTasks[0]?.projectId || userInfo.default_project_id;
        const projectInfo = getProjectInfo(projectId);

        return (
            <div className={`rounded-lg border overflow-hidden`}>
                {/* Header */}
                <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} px-4 py-3`}>
                    <div className="flex items-center gap-2">
                        <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{createdTasks.length} tasks added to</span>
                        <button
                            onClick={() => handleProjectClick(projectId)}
                            className={`flex items-center gap-2 px-3 py-1 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-full transition-colors cursor-pointer`}
                            title={`Click to view ${projectInfo.name} project`}
                        >
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: projectInfo.projectColor }}
                            ></div>
                            <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-sm font-medium`}>{projectInfo.name}</span>
                        </button>
                    </div>
                </div>

                {/* Created Tasks List */}
                <div className="p-4 px-0 space-y-3">
                    {(showAllTasks ? createdTasks : createdTasks.slice(0, 3)).map((task, index) => (
                        <motion.div
                            key={task._id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-start gap-1.5 p-3 ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} rounded-lg border transition-colors`}
                        >
                            {/* Checkbox */}
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-5 h-5 rounded-full   flex items-center justify-center">
                                    <Icon icon="ph:check-circle-light" className="w-4 h-4 text-black-500" />
                                </div>
                            </div>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-2">
                                        {/* Task Name */}
                                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>
                                            {task.taskName}
                                        </h4>

                                        {/* Task Description */}
                                        {task.description && (
                                            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs leading-relaxed`}>
                                                {task.description.length > 80
                                                    ? `${task.description.substring(0, 80)}...`
                                                    : task.description
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Icons */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {/* User Avatar */}
                                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                            <span className="text-white text-xs font-medium">
                                                {task.assigned_users?.length > 0 ? task.assigned_users.length : 'RP'}
                                            </span>
                                        </div>

                                        {/* Arrow Icon - Clickable */}
                                        <button
                                            onClick={() => handleTaskClick(task._id)}
                                            className={`w-6 h-6 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} flex items-center justify-center transition-colors cursor-pointer`}
                                            title="Open task"
                                        >
                                            <Icon icon="mdi:arrow-right" className={`w-3 h-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                {createdTasks.length > 3 && (
                    <div className="px-4 pb-3">
                        <button
                            onClick={() => setShowAllTasks(!showAllTasks)}
                            className={`text-sm transition-colors font-medium ${isDark
                                ? 'text-blue-400 hover:text-blue-300 hover:underline'
                                : 'text-blue-600 hover:text-blue-700 hover:underline'
                                }`}
                        >
                            {showAllTasks ? `Show less` : `See more (${Math.max(0, createdTasks.length - 3)} more)`}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Show original task creation view
    return (
        <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-electricBlue-50/70 via-electricBlue-50/20 to-electricBlue-50/50 px-4 py-3 rounded-md">
                <h3 className="text-white font-semibold text-lg">Create tasks</h3>
            </div>

            {/* Task List */}
            <div className="p-4 px-0 space-y-3">
                {(showAllEditableTasks ? editableTasks : editableTasks?.slice(0, 3)).map((task, index) => (
                    <motion.div
                        key={task._id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-start gap-1.5 p-3 ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} rounded-lg border transition-colors`}
                    >
                        {/* Checkbox */}
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-5 h-5 rounded-full   flex items-center justify-center">
                                <Icon icon="ph:check-circle-light" className="w-4 h-4 text-black-500" />
                            </div>
                        </div>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-2">
                                    {/* Task Name - Editable */}
                                    <div className="relative">
                                        <div className="min-h-[24px] flex items-center">
                                            {isEditing(index, 'taskName') ? (
                                                <input
                                                    type="text"
                                                    value={task.taskName}
                                                    onChange={(e) => updateTask(index, 'taskName', e.target.value)}
                                                    onBlur={() => setEditingField({ taskIndex: null, field: null })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            setEditingField({ taskIndex: null, field: null });
                                                        }
                                                    }}
                                                    className={`w-full px-2 py-1 text-sm font-semibold border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark
                                                        ? 'text-white bg-gray-800 border-gray-600 focus:border-blue-400'
                                                        : 'text-gray-900 bg-white border-blue-300 focus:border-blue-500'
                                                        }`}
                                                    autoFocus
                                                />
                                            ) : (
                                                <h4
                                                    className={`font-semibold ${isDark ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-blue-50'} text-sm cursor-pointer px-1 py-1 rounded min-h-[24px] flex items-center`}
                                                    onClick={() => handleFieldEdit(index, 'taskName')}
                                                >
                                                    {task.taskName}
                                                </h4>
                                            )}
                                        </div>
                                    </div>

                                    {/* Task Description - Editable */}
                                    <div className="relative">
                                        <div className="min-h-[32px]">
                                            {isEditing(index, 'description') ? (
                                                <textarea
                                                    value={task.description}
                                                    onChange={(e) => updateTask(index, 'description', e.target.value)}
                                                    onBlur={() => setEditingField({ taskIndex: null, field: null })}
                                                    rows={2}
                                                    className={`w-full px-2 py-1 text-xs border rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark
                                                        ? 'text-gray-300 bg-gray-800 border-gray-600 focus:border-blue-400'
                                                        : 'text-gray-600 bg-white border-blue-300 focus:border-blue-500'
                                                        }`}
                                                    placeholder="Enter task description..."
                                                    autoFocus
                                                />
                                            ) : (
                                                <p
                                                    className={`${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-blue-50'} text-xs leading-relaxed cursor-pointer px-1 py-1 rounded min-h-[32px] flex items-start`}
                                                    onClick={() => handleFieldEdit(index, 'description')}
                                                >
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Due Date Display */}
                                    {task.dueDate && (
                                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Due: {moment(task.dueDate).format("MMM DD, YYYY")}
                                        </div>
                                    )}
                                </div>

                                {/* Action Icons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Calendar Icon - Date Picker */}
                                    <div className="relative">
                                        <button
                                            onClick={() => handleDatePickerToggle(index)}
                                            className={`w-6 h-6 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-blue-100'} flex items-center justify-center transition-colors`}
                                            data-modal-button
                                        >
                                            <Icon icon="mdi:calendar" className={`w-3 h-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                                        </button>

                                        {showDatePicker[index] && (
                                            <div className="absolute top-8 right-0 z-50 bg-white shadow-lg border border-gray-200 rounded-lg p-2" data-modal>
                                                <div className="text-xs text-gray-500 mb-2">Select Date:</div>
                                                <input
                                                    type="date"
                                                    value={task.dueDate || ''}
                                                    onChange={(e) => handleDateChange(index, e.target.value)}
                                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark
                                                        ? 'text-white bg-gray-800 border-gray-600 focus:border-blue-400'
                                                        : 'text-gray-900 bg-white border-gray-300 focus:border-blue-500'
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* User Avatar - Clickable */}
                                    <div className="relative">
                                        <button
                                            onClick={() => handleUserAvatarClick(index)}
                                            className="w-6 h-6 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center transition-colors cursor-pointer"
                                            title="Assign users"
                                            data-modal-button
                                        >
                                            <span className="text-white text-xs font-medium">
                                                {task.assigned_users?.length > 0 ? task.assigned_users.length : 'RP'}
                                            </span>
                                        </button>

                                        {showUserModal[index] && users.length > 0 && (
                                            <div className="absolute top-0 right-0 z-50" data-modal>
                                                <div className=" p-3 min-w-[280px] max-w-[320px] max-h-64">

                                                    <div className="max-h-48 overflow-y-auto">
                                                        <UserMultiSelect
                                                            task={{
                                                                ...task,
                                                                assigned_users: task.assigned_users,
                                                            }}
                                                            users={users}
                                                            index={task._id}
                                                            updateExistingTask={handleUserSelection}
                                                            isCompleted={false}
                                                            initiallyOpen={true}
                                                            onClose={() => setShowUserModal(prev => ({ ...prev, [index]: false }))}
                                                            from="dyzoAi"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete Icon */}
                                    <button
                                        onClick={() => handleDeleteTask(index)}
                                        className={`w-6 h-6 rounded-full ${isDark ? 'bg-gray-700 hover:bg-red-900' : 'bg-gray-200 hover:bg-red-100'} flex items-center justify-center transition-colors`}
                                    >
                                        <Icon icon="mdi:close" className={`w-3 h-3 ${isDark ? 'text-gray-300 hover:text-red-400' : 'text-gray-600 hover:text-red-600'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Additional Options */}
            {editableTasks && editableTasks.length > 3 && (
                <div className="px-4 pb-3">
                    <button
                        onClick={() => setShowAllEditableTasks(!showAllEditableTasks)}
                        className={`text-sm transition-colors font-medium dark:text-blue-400 text-blue-600 hover:text-blue-800 hover:underline`}

                    >
                        {showAllEditableTasks ? `Show less` : `See more (${Math.max(0, editableTasks.length - 3)} more)`}
                    </button>
                </div>
            )}

            {/* Projects Section */}
            <div className="px-4 pb-3">
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Projects Add to projects
                </div>
            </div>

            {/* Footer Actions */}
            <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200 '} flex items-center justify-between`}>


                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDiscard}
                        className="bg-white dark:bg-electricBlue-50 dark:border-slate-700 dark:border text-electricBlue-100 dark:text-white py-1.5 px-3 rounded-md flex items-center border-2 border-solid border-neutral-50 transition-colors hover:bg-gray-50 dark:hover:bg-electricBlue-100"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleConfirmTasks}
                        disabled={isCreating}
                        className="flex items-center gap-2 px-3 py-2 rounded-md border transition-colors bg-[#7A39FF] text-white"
                    >
                        {isCreating ? (
                            <>
                                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Confirm'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskCreationView;
