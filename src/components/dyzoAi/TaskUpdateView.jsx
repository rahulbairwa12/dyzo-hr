import React, { useState, useRef, useEffect } from 'react';
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import moment from "moment";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchUsers } from "@/store/usersSlice";
import { fetchAuthPut } from "@/store/api/apiSlice";
import UserMultiSelect from "@/components/dropdowns/UserMultiSelect";
import useDarkMode from "@/hooks/useDarkMode";

const TaskUpdateView = ({ taskData, message, changesMade, onDiscard, onConfirm }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { users, loading: loadingUsers } = useSelector((state) => state.users);
    const { user: userInfo } = useSelector((state) => state.auth);
    const { projects } = useSelector((state) => state.projects);
    const [isDark] = useDarkMode();

    const [editableTask, setEditableTask] = useState(taskData || null);
    const [editingField, setEditingField] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updatedTask, setUpdatedTask] = useState(null);

    // Fetch users on component mount
    useEffect(() => {
        if (users.length === 0) {
            dispatch(fetchUsers());
        }
    }, [dispatch, users.length]);

    // Click outside handler for modals
    useEffect(() => {
        const handleClickOutside = (event) => {
            const hasOpenModals = showUserModal || showDatePicker;

            if (hasOpenModals) {
                const isModalClick = event.target.closest('[data-modal]');
                const isButtonClick = event.target.closest('[data-modal-button]');
                const isUserMultiSelectClick =
                    event.target.closest('.multiuser-select-dropdown') ||
                    event.target.closest('.user-multiselect-scroll-area') ||
                    event.target.closest('.dropdown-search-area') ||
                    event.target.closest('.close-button-multiselect') ||
                    event.target.closest('.dropdown-header-multiselect');

                if (!isModalClick && !isButtonClick && !isUserMultiSelectClick) {
                    setShowUserModal(false);
                    setShowDatePicker(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserModal, showDatePicker]);

    // Helper functions for editing task
    const updateTaskField = (field, value) => {
        setEditableTask(prev => ({ ...prev, [field]: value }));
    };

    const handleFieldEdit = (field) => {
        setEditingField(prev => prev === field ? null : field);
    };

    const isEditing = (field) => {
        return editingField === field;
    };

    const handleDatePickerToggle = () => {
        setShowDatePicker(prev => !prev);
    };

    const handleDateChange = (dateValue) => {
        if (dateValue) {
            updateTaskField('dueDate', dateValue);
        }
        setShowDatePicker(false);
    };

    const handleUserAvatarClick = () => {
        setShowUserModal(prev => !prev);
    };

    const handleUserSelection = (updatedTaskData, property) => {
        // Return a promise to satisfy UserMultiSelect's async expectations
        return new Promise((resolve, reject) => {
            try {
                if (property === "assigned_users") {
                    // Update the assigned users field
                    updateTaskField('assigned_users', updatedTaskData.assigned_users || []);
                }
                resolve(updatedTaskData);
            } catch (error) {
                reject(error);
            }
        });
    };

    const handleDiscard = () => {
        // Reset all states
        setUpdatedTask(null);
        setEditingField(null);
        setShowDatePicker(false);
        setShowUserModal(false);
        setIsUpdating(false);

        // Call the original onDiscard function
        onDiscard();
    };

    const handleConfirmUpdate = async () => {
        if (!editableTask || !editableTask._id) {
            toast.error("No task to update");
            return;
        }

        setIsUpdating(true);

        try {
            const taskId = editableTask._id;
            const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/task/${taskId}/${userInfo._id}/`;

            // Field mapping: AI field name -> API field name
            const fieldMapping = {
                'status': 'taskPosition'
            };

            // Prepare the payload - include fields that were changed by AI or user
            const payload = {};

            // First, add fields from changesMade (AI suggested changes)
            if (changesMade) {
                Object.keys(changesMade).forEach(aiField => {
                    // Map AI field to actual task field (e.g., 'status' -> 'taskPosition')
                    const taskField = fieldMapping[aiField] || aiField;

                    // Check if the field exists in editableTask
                    if (editableTask[taskField] !== undefined && editableTask[taskField] !== null) {
                        // Use the mapped field name for the API payload
                        payload[taskField] = editableTask[taskField];
                    }
                });
            }

            // Then, add any fields that were modified by the user directly
            // Compare with original taskData to detect user modifications
            if (taskData) {
                Object.keys(editableTask).forEach(field => {
                    // Skip if already added from changesMade
                    if (payload[field]) return;

                    // Skip internal fields that shouldn't be sent to API
                    const skipFields = ['_id', 'createdAt', 'updatedAt', '__v', 'projectId'];
                    if (skipFields.includes(field)) return;

                    const originalValue = taskData[field];
                    const currentValue = editableTask[field];

                    // Special handling for arrays (like assigned_users)
                    if (Array.isArray(currentValue) && Array.isArray(originalValue)) {
                        // Compare arrays by their JSON representation
                        if (JSON.stringify(currentValue.sort()) !== JSON.stringify(originalValue.sort())) {
                            payload[field] = currentValue;
                        }
                    } else if (originalValue !== currentValue) {
                        // Add field if it was modified by user
                        payload[field] = currentValue;
                    }
                });
            }

            // If no fields to update, just show success with existing data
            if (Object.keys(payload).length === 0) {
                setUpdatedTask(editableTask);
                toast.success("Task confirmed");
                onConfirm(editableTask);
                setIsUpdating(false);
                return;
            }



            const response = await fetchAuthPut(apiUrl, {
                body: payload
            });

            if (response && response.status) {
                // Store updated task and show the success view
                setUpdatedTask({
                    ...editableTask,
                    ...response.task_details
                });

                toast.success("Task updated successfully");

                // Call the original onConfirm with the updated task
                onConfirm(response.task_details);
            } else {
                toast.error(response?.message || "Failed to update task");
            }
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("An error occurred while updating task");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleTaskClick = () => {
        const taskId = updatedTask?._id || editableTask?._id;
        if (taskId) {
            navigate(`/tasks?userId=${userInfo._id}&taskId=${taskId}`);
        }
    };

    const handleProjectClick = (projectId) => {
        if (projectId) {
            navigate(`/project/${projectId}`);
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

    // Get priority badge color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
            case 'low':
                return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    // Format changes made for display
    const formatChanges = () => {
        if (!changesMade || Object.keys(changesMade).length === 0) return null;

        return Object.entries(changesMade).map(([field, changes]) => {
            let fieldName = field;
            let oldValue = changes.old;
            let newValue = changes.new;

            // Format field names
            if (field === 'dueDate') {
                fieldName = 'Due Date';
                oldValue = changes.old ? moment(changes.old).format("MMM DD, YYYY") : 'None';
                newValue = changes.new ? moment(changes.new).format("MMM DD, YYYY") : 'None';
            } else if (field === 'priority') {
                fieldName = 'Priority';
                oldValue = changes.old || 'None';
                newValue = changes.new || 'None';
            } else if (field === 'taskName') {
                fieldName = 'Task Name';
            } else if (field === 'description') {
                fieldName = 'Description';
            } else if (field === 'status') {
                fieldName = 'Status';
                // Format status values for better display
                oldValue = changes.old ? changes.old.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None';
                newValue = changes.new ? changes.new.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'None';
            }

            return (
                <div key={field} className="text-xs">
                    <span className="font-medium ">{fieldName}:</span>{' '}
                    <span className="line-through text-red-500">{oldValue}</span>
                    {' → '}
                    <span className="text-green-600">{newValue}</span>
                </div>
            );
        });
    };

    // Show success view if task has been updated
    if (updatedTask) {
        const projectId = updatedTask.projectId || userInfo.default_project_id;
        const projectInfo = getProjectInfo(projectId);

        return (
            <div className={`rounded-lg border overflow-hidden`}>
                {/* Header */}
                <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} px-4 py-3`}>
                    <div className="flex items-center gap-2">
                        <Icon icon="ph:check-circle-fill" className="w-5 h-5 text-green-500" />
                        <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-sm font-medium`}>Task updated successfully</span>
                    </div>
                </div>

                {/* Updated Task Display */}
                <div className="p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-1.5 p-3  ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} rounded-lg border transition-colors`}
                    >
                        {/* Checkbox */}
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center">
                                <Icon icon="ph:check-circle-light" className="w-4 h-4 text-black-500" />
                            </div>
                        </div>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-2">
                                    {/* Task Name */}
                                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>
                                        {updatedTask.taskName}
                                    </h4>

                                    {/* Task Code */}
                                    {updatedTask.taskCode && (
                                        <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs`}>
                                            {updatedTask.taskCode}
                                        </p>
                                    )}

                                    {/* Project Info */}
                                    <button
                                        onClick={() => handleProjectClick(projectId)}
                                        className={`flex items-center gap-2 px-2 py-1 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded transition-colors cursor-pointer text-xs`}
                                    >
                                        <div
                                            className="w-2 h-2 rounded"
                                            style={{ backgroundColor: projectInfo.projectColor }}
                                        ></div>
                                        <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{projectInfo.name}</span>
                                    </button>

                                    {/* Priority and Due Date */}
                                    <div className="flex items-center gap-2">
                                        {updatedTask.priority && (
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(updatedTask.priority)}`}>
                                                {updatedTask.priority.charAt(0).toUpperCase() + updatedTask.priority.slice(1)}
                                            </span>
                                        )}
                                        {updatedTask.dueDate && (
                                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                                                <Icon icon="mdi:calendar" className="w-3 h-3" />
                                                {moment(updatedTask.dueDate).format("MMM DD, YYYY")}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Icons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* User Avatar */}
                                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
                                            {updatedTask.assigned_users?.length > 0 ? updatedTask.assigned_users.length : 'U'}
                                        </span>
                                    </div>

                                    {/* Arrow Icon - Clickable */}
                                    <button
                                        onClick={handleTaskClick}
                                        className={`w-6 h-6 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} flex items-center justify-center transition-colors cursor-pointer`}
                                        title="Open task"
                                    >
                                        <Icon icon="mdi:arrow-right" className={`w-3 h-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* AI Message */}
                {message && (
                    <div className={`px-4 pb-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {message}
                    </div>
                )}
            </div>
        );
    }

    // Show task update view
    if (!editableTask) return null;

    const projectInfo = getProjectInfo(editableTask.projectId);

    return (
        <div>
            {/* Header with Changes Summary */}
            <div className="bg-gradient-to-r from-electricBlue-50/70 via-electricBlue-50/20 to-electricBlue-50/50 px-4 py-3 rounded-md">
                <h3 className="text-white font-semibold text-lg">Update task</h3>


            </div>

            {/* Task Edit View */}
            <div className="p-4 space-y-3">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-1.5 p-3 ${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} rounded-lg border transition-colors`}
                >
                    {/* Checkbox */}
                    <div className="flex-shrink-0 mt-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center">
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
                                        {isEditing('taskName') ? (
                                            <input
                                                type="text"
                                                value={editableTask.taskName}
                                                onChange={(e) => updateTaskField('taskName', e.target.value)}
                                                onBlur={() => setEditingField(null)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setEditingField(null);
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
                                                onClick={() => handleFieldEdit('taskName')}
                                            >
                                                {editableTask.taskName}
                                            </h4>
                                        )}
                                    </div>
                                </div>
                                {/* Changes Summary */}
                                {changesMade && Object.keys(changesMade).length > 0 && (
                                    <div className="">
                                        <div className="flex items-start gap-2   ">
                                            <Icon icon="mdi:information-outline" className="w-4 h-4 mt-0.5 " />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium  mb-1">Changes made:</p>
                                                <div className="space-y-1">
                                                    {formatChanges()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}


                            </div>

                            {/* Action Icons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Calendar Icon - Date Picker */}
                                <div className="relative">
                                    <button
                                        onClick={handleDatePickerToggle}
                                        className={`w-6 h-6 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-blue-100'} flex items-center justify-center transition-colors`}
                                        data-modal-button
                                    >
                                        <Icon icon="mdi:calendar" className={`w-3 h-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                                    </button>

                                    {showDatePicker && (
                                        <div className="absolute top-8 right-0 z-50 bg-white shadow-lg border border-gray-200 rounded-lg p-2" data-modal>
                                            <div className="text-xs text-gray-500 mb-2">Select Date:</div>
                                            <input
                                                type="date"
                                                value={editableTask.dueDate ? moment(editableTask.dueDate).format('YYYY-MM-DD') : ''}
                                                onChange={(e) => handleDateChange(e.target.value)}
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
                                        onClick={handleUserAvatarClick}
                                        className="w-6 h-6 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center transition-colors cursor-pointer"
                                        title="Assign users"
                                        data-modal-button
                                    >
                                        <span className="text-white text-xs font-medium">
                                            {editableTask.assigned_users?.length > 0 ? editableTask.assigned_users.length : 'U'}
                                        </span>
                                    </button>

                                    {showUserModal && users.length > 0 && (
                                        <div className="absolute top-0 right-0 z-50" data-modal>
                                            <div className="p-3 min-w-[280px] max-w-[320px] max-h-64">
                                                <div className="max-h-48 overflow-y-auto">
                                                    <UserMultiSelect
                                                        task={{
                                                            ...editableTask,
                                                            assigned_users: editableTask.assigned_users,
                                                        }}
                                                        users={users}
                                                        index={editableTask._id}
                                                        updateExistingTask={handleUserSelection}
                                                        isCompleted={false}
                                                        initiallyOpen={true}
                                                        onClose={() => setShowUserModal(false)}
                                                        from="dyzoAi"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Footer Actions */}
            <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDiscard}
                        className="bg-white dark:bg-electricBlue-50 dark:border-slate-700 dark:border text-electricBlue-100 dark:text-white py-1.5 px-3 rounded-md flex items-center border-2 border-solid border-neutral-50 transition-colors hover:bg-gray-50 dark:hover:bg-electricBlue-100"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleConfirmUpdate}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-3 py-2 rounded-md border transition-colors bg-[#7A39FF] text-white"
                    >
                        {isUpdating ? (
                            <>
                                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Confirm Update'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskUpdateView;

