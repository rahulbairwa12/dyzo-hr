import { Icon } from "@iconify/react";
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAuthDelete, fetchAuthDeleteWithBody, fetchAuthGET, fetchAuthPatch, fetchAuthPost, fetchAuthPut } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { djangoBaseURL } from "@/helper";
import { HexColorPicker } from "react-colorful";
import Modal from "../ui/Modal";
import Textinput from "../ui/Textinput";
import Button from "../ui/Button";
import EditProjectModal from "./EditProjectModal";
import { updateProjectInList, removeProjectFromList, addProjectToTop } from "@/store/projectsSlice";
import SidelineDatabaseTab from "@/features/tasks/components/SidelineDatabaseTab";
import { useNavigate } from "react-router-dom";
import { update } from "@/store/api/auth/authSlice";
import { fetchUsers } from "@/store/usersSlice";

const allTabs = [
    { id: "overview", label: "Overview", icon: "mdi:chart-line", permissionKey: "canViewProjectOverview" },
    { id: "tasks", label: "Tasks", icon: "hugeicons:task-add-02", permissionKey: "canViewTasks" },
    { id: "members", label: "Project Members", icon: "f7:person-2", alwaysVisible: true },
    { id: "notes", label: "Notes", icon: "hugeicons:note-edit", permissionKey: "canAccessNotes" },
];

const ProjectHeader = ({ activeTab, setActiveTab, projectData, setProjectData, permissions, isDefaultProject }) => {
    const dispatch = useDispatch();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [editedColor, setEditedColor] = useState("");
    const [isSavingColor, setIsSavingColor] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const inputRef = useRef(null);
    const colorPickerRef = useRef(null);
    const userInfo = useSelector((state) => state.auth.user);
    const { users, activeUsers } = useSelector((state) => state.users);
    // Save as Template
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState("")
    const [showError, setShowError] = useState(false)
    const [isTemplateSaving, setIsTemplateSaving] = useState(false)
    // CSV Export
    const [isExportingCSV, setIsExportingCSV] = useState(false);
    const [showImportCSVModal, setShowImportCSVModal] = useState(false);
    const [importMode, setImportMode] = useState("csv");
    const [openSubmenuIndex, setOpenSubmenuIndex] = useState(null);

    // Duplicate Project
    const [isDuplicatingProject, setIsDuplicatingProject] = useState(false);
    const [showDuplicateProjectModal, setShowDuplicateProjectModal] = useState(false);
    const [duplicateProjectName, setDuplicateProjectName] = useState("");
    const [showErrorDuplicate, setShowErrorDuplicate] = useState(false);
    const [projectDetails, setProjectDetails] = useState({
        duplicate_description: true,
        duplicate_due_date: true,
        // duplicate_leader: true,
        duplicate_color: true,
        duplicate_notes: true,
        duplicate_assignees: true,
        duplicate_sections: true,
        // duplicate_collaborators: true,
        // duplicate_task_templates: true,
        duplicate_tasks: true,
    });
    const [taskDetails, setTaskDetails] = useState({
        description: true,
        due_date: true,
        assigned_users: true,
        subtasks: true,
        attachments: true
    })

    // Delete Project
    const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
    const [deleteWithTasks, setDeleteWithTasks] = useState(false);
    const [isDeletingProject, setIsDeletingProject] = useState(false);

    // Tabs
    const tabs = allTabs.filter(tab => {
        // Hide members tab if this is the default project
        if (tab.id === "members" && isDefaultProject) {
            return false;
        }
        if (tab.alwaysVisible) return true; // ✅ show for all users
        return !tab.permissionKey || permissions[tab.permissionKey];
    });

    // Favourite Project
    const [isFavourite, setIsFavourite] = useState(false)

    useEffect(() => {
        if (userInfo?.fav_projects?.includes(projectData?._id)) {
            setIsFavourite(true);
        } else {
            setIsFavourite(false);
        }
    }, [userInfo, projectData?._id]);

    // Fetch users if not already loaded
    useEffect(() => {
        if (!users || users.length === 0) {
            dispatch(fetchUsers());
        }
    }, [dispatch, users]);

    const navigate = useNavigate();


    const allDropdownOptions = [
        { label: "Edit", icon: "mdi:pencil", action: () => setShowEditModal(true), permissionKey: "canEditProjectDetails" },
        { label: "Copy project link", icon: "mdi:paperclip", action: () => handleCopyProjectLink() },
        { label: "Duplicate project", icon: "mdi:content-duplicate", action: () => setShowDuplicateProjectModal(true), permissionKey: "canDuplicateProject" },
        { label: "Save as template", icon: "mdi:folder-outline", action: () => setShowTemplateModal(true), permissionKey: "canSaveAsTemplate" },
        { label: "Import tasks", icon: "mdi:download", action: null, permissionKey: "canImportCSV", hasSubmenu: true },
        { label: "Export CSV", icon: "mdi:upload", action: () => handleExportCSV(), permissionKey: "canExportCSV" },
        { label: "Delete Project", icon: "mdi:delete", action: () => setShowDeleteProjectModal(true), permissionKey: "canDeleteProject", isDestructive: true, isHide: projectData?._id === Number(userInfo?.default_project_id) || projectData?._id === userInfo?.default_project },
    ];

    const dropdownOptions = allDropdownOptions?.filter(opt => {
        if (opt.isHide) return false;
        if (!opt.permissionKey) return true; // always visible if no key
        return permissions[opt?.permissionKey];
    });

    // set project name in templateName & duplicateProjectName
    useEffect(() => {
        if (projectData?.name) {
            setTemplateName(projectData?.name);
            setDuplicateProjectName(`Duplicate of ${projectData?.name}`);
        }
    }, [showTemplateModal, showDuplicateProjectModal])

    // Removed debounced auto-save; saving will occur on Enter key or on input blur

    // Close color picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
                handleColorCancel();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleDropdownAction = (action) => {
        action();
        setIsDropdownOpen(false);
    };

    const handleNameClick = () => {
        setIsEditingName(true);
        setEditedName(projectData?.name || "");
        // Focus the input after a small delay to ensure it's rendered
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 10);
    };

    const handleNameChange = (e) => {
        setEditedName(e.target.value);
    };

    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveName();
        } else if (e.key === 'Escape') {
            setIsEditingName(false);
            setEditedName(projectData?.name || "");
        }
    };

    const handleNameBlur = () => {
        if (isSaving) return;
        if (editedName !== projectData?.name) {
            handleSaveName();
        } else {
            setIsEditingName(false);
        }
    };

    const handleSaveName = async () => {
        if (!editedName.trim() || editedName === projectData?.name) {
            setIsEditingName(false);
            setEditedName(projectData?.name || "");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetchAuthPut(
                `${djangoBaseURL}/project-v2/${projectData._id}/${userInfo._id}/`,
                {
                    body: JSON.stringify({
                        name: editedName.trim()
                    })
                }
            );

            if (response.status === 1) {
                toast.success("Project name updated successfully");
                setIsEditingName(false);
                // Update redux list
                dispatch(updateProjectInList({ id: projectData._id, changes: { name: editedName.trim() } }));
                // Call the callback to update parent component
                if (setProjectData) {
                    setProjectData({ ...projectData, name: editedName.trim() });
                }
                // Refresh journey data
                if (projectData?.refreshJourney) {
                    projectData.refreshJourney();
                }
            } else {
                toast.error("Failed to update project name");
                setEditedName(projectData?.name || "");
            }
        } catch (error) {
            toast.error("Error updating project name");
            console.error("Update error:", error);
            setEditedName(projectData?.name || "");
        } finally {
            setIsSaving(false);
        }
    };

    const handleColorClick = () => {
        setIsColorPickerOpen(!isColorPickerOpen);
        setEditedColor(projectData?.projectColor || '#E6A5D6');
    };

    const handleColorChange = (color) => {
        setEditedColor(color);
    };

    const handleColorCancel = () => {
        setIsColorPickerOpen(false);
        setEditedColor(projectData?.projectColor || '#E6A5D6');
    };

    const handleColorSave = async () => {
        if (!editedColor || editedColor === projectData?.projectColor) {
            setIsColorPickerOpen(false);
            return;
        }

        setIsSavingColor(true);
        try {
            const response = await fetchAuthPut(
                `${djangoBaseURL}/project-v2/${projectData._id}/${userInfo._id}/`,
                {
                    body: JSON.stringify({
                        projectColor: editedColor
                    })
                }
            );

            if (response.status === 1) {

                toast.success("Project color updated successfully");
                setIsColorPickerOpen(false);
                // Update redux list
                dispatch(updateProjectInList({ id: projectData._id, changes: { projectColor: editedColor } }));
                // Call the callback to update parent component
                if (setProjectData) {
                    setProjectData({ ...projectData, projectColor: editedColor });
                }
                // Refresh journey data
                if (projectData?.refreshJourney) {
                    projectData.refreshJourney();
                }
            } else {
                toast.error("Failed to update project color");
            }
        } catch (error) {
            toast.error("Error updating project color");
            console.error("Update error:", error);
        } finally {
            setIsSavingColor(false);
        }
    };

    // Save project as Template
    const handleSaveTemplate = async () => {
        if (!templateName || templateName.trim() === "") {
            setShowError(true)
            setTimeout(() => {
                setShowError(false);
            }, 3000);
            return;
        }
        if (!userInfo?._id && !projectData?._id) return;
        try {
            setIsTemplateSaving(true)
            const payload = {
                name: templateName,
            };

            const response = await fetchAuthPost(
                `${import.meta.env.VITE_APP_DJANGO}/project-template/${userInfo?._id}/${projectData?._id}/`,
                { body: payload }
            );
            if (response.status === 1) {
                toast.success("Template Saved.", {
                    position: "bottom-right",
                    autoClose: 2000,
                })
                setShowTemplateModal(false);
            } else {
                toast.error(response?.error?.error || "Failed to save template")
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsTemplateSaving(false)
        }
    };

    // Export Project as CSV
    const handleExportCSV = async () => {
        if (!projectData?._id) return;
        setIsExportingCSV(true);
        try {
            const response = await fetchAuthGET(
                `${import.meta.env.VITE_APP_DJANGO}/export-tasks/${projectData._id}/`,
                false
            );

            if (response.status === 1) {
                const tasks = response?.tasks;
                if (tasks?.length > 0) {
                    // Format date from ISO string to readable format
                    const formatDate = (dateString) => {
                        if (!dateString) return 'None';
                        try {
                            const date = new Date(dateString);
                            return date.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit' 
                            });
                        } catch (e) {
                            return dateString || 'None';
                        }
                    };

                    // Format status from taskPosition
                    const formatStatus = (taskPosition) => {
                        if (!taskPosition) return '';
                        const statusMap = {
                            'not_started_yet': 'Not Started',
                            'in_progress': 'In Progress',
                            'completed': 'Completed'
                        };
                        return statusMap[taskPosition] || taskPosition;
                    };

                    // Format assigned users array to comma-separated string with names
                    const formatAssignedUsers = (assignedUsers) => {
                        if (!assignedUsers || !Array.isArray(assignedUsers) || assignedUsers.length === 0) {
                            return '';
                        }
                        
                        // Use activeUsers from Redux if available, otherwise fall back to users
                        const usersList = activeUsers && activeUsers.length > 0 ? activeUsers : users;
                        
                        // Map user IDs to names
                        const userNames = assignedUsers.map(userId => {
                            // Find user by _id in activeUsers or users array
                            // Handle both string and number ID comparisons
                            const user = usersList?.find(u => 
                                String(u._id) === String(userId) || 
                                String(u.value) === String(userId) ||
                                u._id === userId || 
                                u.value === userId
                            );
                            return user?.name || user?.label?.split(' (')[0] || userId;
                        });
                        
                        return userNames.join(', ');
                    };

                    // Define custom headers
                    const headers = [
                        'ID',
                        'Name',
                        'Due Date',
                        'Priority',
                        'Status',
                        'Project',
                        'Assigned To'
                    ];

                    // Map tasks to CSV rows with only the specified fields
                    const csvRows = [
                        headers.join(","), // header row
                        ...tasks.map(task => {
                            const row = [
                                task.taskCode || '',
                                task.taskName || '',
                                formatDate(task.dueDate),
                                task.priority || '',
                                formatStatus(task.taskPosition),
                                projectData?.name || '',
                                formatAssignedUsers(task.assigned_users)
                            ];
                            // JSON.stringify each field to handle commas and quotes in CSV
                            return row.map(field => JSON.stringify(field ?? "")).join(",");
                        })
                    ];

                    const csvContent = csvRows.join("\n");
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${projectData.name} tasks.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else {
                    toast.error("No tasks to export");
                }
            }
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Failed to export tasks");
        } finally {
            setIsExportingCSV(false);
        }
    };

    // Copy Project link to clipboard
    const handleCopyProjectLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/project/${projectData?._id}`);
            toast.success("Project link copied to clipboard");
        } catch (error) {
            console.error("Failed to copy link:", error);
        }
    }

    // Delete project with conditions
    const handleDeleteProject = async () => {
        if (!projectData?._id) return;
        if (projectData?._id === Number(userInfo?.default_project_id) || projectData?._id === userInfo?.default_project) return;
        setIsDeletingProject(true);
        try {
            const payload = {
                project_id: projectData?._id,
                with_task: deleteWithTasks
            }

            const response = await fetchAuthDeleteWithBody(`${import.meta.env.VITE_APP_DJANGO}/api/delete-project-with-condition/`, { body: payload });
            if (response?.status) {
                toast.success(response?.message || "Project deleted Successfully.");
                dispatch(removeProjectFromList(projectData._id)); // Remove from Redux state
                setShowDeleteProjectModal(false)
                navigate("/projects"); // Redirect to all projects route
            } else {
                toast.error("Failed to delete project");
            }
        } catch (error) {
            console.error("Delete project error:", error);
        } finally {
            setIsDeletingProject(false);
        }
    }

    // Get the current color to display (edited color when picker is open, original otherwise)
    const getCurrentDisplayColor = () => {
        if (isColorPickerOpen) {
            return editedColor;
        }
        return projectData?.projectColor || '#E6A5D6';
    };

    const handleProjectDetailChange = (e) => {
        const { name, checked } = e.target;
        setProjectDetails((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleTaskDetailChange = (e) => {
        const { name, checked } = e.target;
        setTaskDetails((prev) => ({
            ...prev,
            [name]: checked
        }))
    }

    // Duplicate project
    const handleDuplicateProject = async () => {
        if (!duplicateProjectName || duplicateProjectName.trim() === "") {
            setShowErrorDuplicate(true)
            setTimeout(() => {
                setShowErrorDuplicate(false);
            }, 3000);
            return;
        }
        if (!projectData?._id && !userInfo?._id) return;
        setIsDuplicatingProject(true);
        try {
            const payload = {
                name: duplicateProjectName,
                companyId: userInfo?.companyId,
                include: {
                    ...taskDetails
                },
                ...projectDetails,
            }

            const response = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/api/project-duplicate/${projectData?._id}/${userInfo?._id}/`, { body: payload });
            if (response.status) {
                toast.success(`Project duplicated successfully!`)
                dispatch(addProjectToTop(response.data)); // Add duplicated project to Redux state
                setShowDuplicateProjectModal(false);
            } else {
                toast.error(`Failed to duplicate project.`)
            }
        } catch (error) {
            console.error("Duplicate project error:", error);
        } finally {
            setIsDuplicatingProject(false);
        }
    }

    const handleAddToFavourite = async (projectId) => {
        if (!projectId || !userInfo?._id) return;
        try {
            // Prepare updated fav_projects array
            const updatedFavProjects = isFavourite
                ? userInfo.fav_projects.filter((id) => id !== projectId) // remove
                : [...(userInfo.fav_projects || []), projectId];         // add

            // Call employee PATCH API
            const response = await fetchAuthPatch(
                `${import.meta.env.VITE_APP_DJANGO}/employee/${userInfo._id}/`,
                { body: { fav_projects: updatedFavProjects } }
            );
            if (response.status) {
                // Update redux auth.user
                dispatch(update({
                    ...userInfo,
                    fav_projects: updatedFavProjects
                }));

                // Local UI update
                setIsFavourite(!isFavourite);
                toast.success(
                    isFavourite ? "Removed from favourites" : "Added to favourites"
                );
            } else {
                toast.error("Failed to update favourites");
            }
        } catch (error) {
            console.error("Favourite update error:", error);
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 px-4 pt-6 flex flex-col gap-2 border-b border-neutral-50 dark:border-slate-700">
            <div className="flex items-center gap-3">
                <div className="relative" ref={colorPickerRef}>
                    <div
                        className={`w-6 h-6 rounded-md relative group transition-all duration-200  ${permissions?.canChangeProjectColor ? "cursor-pointer hover:scale-110" : ""}`}
                        style={{ backgroundColor: getCurrentDisplayColor() }}
                        onClick={permissions?.canChangeProjectColor ? handleColorClick : null}
                    >
                        {/* Edit icon overlay on hover */}
                        {
                            permissions?.canChangeProjectColor &&
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-md flex items-center justify-center transition-all duration-200">
                                <Icon
                                    icon="mdi:pencil"
                                    className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                />
                            </div>
                        }
                    </div>

                    {/* Color Picker Popup */}
                    {isColorPickerOpen && (
                        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 p-4">
                            <div className="mb-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                                    Choose Project Color
                                </label>
                                <HexColorPicker
                                    color={editedColor}
                                    onChange={handleColorChange}
                                    className="w-48 h-48"
                                />
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="text"
                                    value={editedColor}
                                    onChange={(e) => setEditedColor(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-[#A259D6] bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-300"
                                    placeholder="#000000"
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                />
                                <div
                                    className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600"
                                    style={{ backgroundColor: editedColor }}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleColorSave}
                                    disabled={isSavingColor}
                                    className="px-3 py-1 text-xs bg-[#A259D6] text-white rounded hover:bg-[#8e4bb8] transition-colors disabled:opacity-50"
                                >
                                    {isSavingColor ? "Saving..." : "Save"}
                                </button>
                                <button
                                    onClick={handleColorCancel}
                                    className="px-3 py-1 text-xs text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {isEditingName ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editedName}
                        onChange={handleNameChange}
                        onKeyDown={handleNameKeyDown}
                        onBlur={handleNameBlur}
                        className="text-xl font-semibold text-customBlack-50 dark:text-customWhite-50 bg-transparent border-b-2 border-neutral-50 dark:border-slate-600 focus:outline-none px-1 py-0"
                        disabled={isSaving}
                        placeholder="Enter project name..."
                    />
                ) : (
                    <h1
                        className={`text-xl font-semibold text-customBlack-50 dark:text-customWhite-50 transition-colors ${permissions?.canEditProjectDetails ? "cursor-pointer hover:text-[#A259D6]" : ""}`}
                        onClick={permissions?.canEditProjectDetails ? handleNameClick : null}
                    >
                        {projectData?.name || "Loading..."}
                    </h1>
                )}
                <div className="relative flex items-center">
                    <button
                        onClick={toggleDropdown}
                        className="ml-1 text-lg  dark:text-slate-500 text-gray-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <Icon
                            icon={isDropdownOpen ? "mdi:chevron-up" : "mdi:chevron-down"}
                            className="w-6 h-6"
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-neutral-50 dark:border-slate-600 bg-white dark:bg-slate-800 z-50">
                            <div className="py-0.5 px-4 flex flex-col divide-y divide-neutral-50 dark:divide-slate-600">
                                {dropdownOptions.map((option, index) => (
                                    <div key={index} className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (option.hasSubmenu) {
                                                    setOpenSubmenuIndex(openSubmenuIndex === index ? null : index);
                                                    return;
                                                }
                                                handleDropdownAction(option.action)
                                            }}
                                            className={`w-full py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${option.isDestructive ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-slate-300'
                                                }`}
                                        >
                                            <Icon icon={option.icon} className="w-4 h-4" />
                                            <span className="text-xs font-medium">{option.label}</span>
                                            {option.hasSubmenu && (
                                                <Icon icon="mdi:chevron-right" className="w-4 h-4 ml-auto" />
                                            )}
                                        </button>

                                        {/* Import Submenu */}
                                        {option.hasSubmenu && option.label === "Import tasks" && openSubmenuIndex === index && (
                                            <div className="absolute left-full top-0 ml-1 w-40 rounded-lg border border-neutral-50 dark:border-slate-600 bg-white dark:bg-slate-800 z-50 shadow-lg">
                                                <div className="py-0.5 px-2 flex flex-col">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setImportMode("template");
                                                            setShowImportCSVModal(true);
                                                            setIsDropdownOpen(false);
                                                            setOpenSubmenuIndex(null);
                                                        }}
                                                        className="w-full py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-slate-300"
                                                    >
                                                        <Icon icon="mdi:view-dashboard-outline" className="w-4 h-4" />
                                                        <span className="text-xs font-medium">From template</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setImportMode("csv");
                                                            setShowImportCSVModal(true);
                                                            setIsDropdownOpen(false);
                                                            setOpenSubmenuIndex(null);
                                                        }}
                                                        className="w-full py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-slate-300"
                                                    >
                                                        <Icon icon="mdi:file-delimited" className="w-4 h-4" />
                                                        <span className="text-xs font-medium">From CSV</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {/* <button onClick={()=>handleAddToFavourite(projectData?._id)} title={isFavourite ? "Remove from Favourite" : "Add to Favourite"}>
                    {elative flex items-center
                        isFavourite ? 
                        <Icon icon="heroicons:star-16-solid" className="w-5 h-5 text-favStar-100" /> 
                        :
                        <Icon icon="heroicons:star" className="w-5 h-5 text-favStar-100" />
                    }
                </button> */}
            </div>
            <div className="-mx-4 md:mx-0">
                <div className="overflow-x-auto md:overflow-visible px-4 md:px-0">
                    <nav className="flex flex-nowrap space-x-6 md:space-x-8 min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`shrink-0 py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                                    ? "border-customBlack-50 dark:border-customWhite-50 text-customBlack-50 dark:text-customWhite-50"
                                    : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500"
                                    }`}
                            >
                                <Icon icon={tab.icon} className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Backdrop to close dropdown when clicking outside */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => { setIsDropdownOpen(false); setOpenSubmenuIndex(null); }}
                />
            )}

            {/* Template Modal */}
            <Modal
                title="Save as template"
                labelclassName=""
                activeModal={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                centered
            >
                <div>
                    <label className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Template Name <span className="text-red-500">*</span></label>
                    <Textinput placeholder="Template name" type="text" name="templateName" defaultValue={projectData?.name} value={templateName} onChange={(e) => setTemplateName(e.target.value)} error={showError} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTemplate(); } }} />
                    <div className="flex justify-center mt-8">
                        <button className="bg-electricBlue-100 hover:bg-electricBlue-100/80 text-white px-8 py-2 rounded-md" onClick={handleSaveTemplate} disabled={isTemplateSaving}>
                            {isTemplateSaving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                title="Are you sure you want to delete this project?"
                labelclassName=""
                activeModal={showDeleteProjectModal}
                onClose={() => setShowDeleteProjectModal(false)}
                centered
            >
                <div className="space-y-4">
                    <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="radio"
                                name="deleteType"
                                value={deleteWithTasks}
                                checked={!deleteWithTasks}
                                onChange={(e) => setDeleteWithTasks(false)}
                                className="cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {`Delete this project and keep all tasks inside it.`}
                            </span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="radio"
                                name="deleteType"
                                value={deleteWithTasks}
                                checked={deleteWithTasks}
                                onChange={(e) => setDeleteWithTasks(true)}
                                className="cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {`Delete this project along with all tasks.`}
                            </span>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <Button
                        onClick={() => setShowDeleteProjectModal(false)}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteProject}
                        disabled={isDeletingProject}
                        className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeletingProject ? "Deleting..." : "Delete project"}
                    </Button>
                </div>
            </Modal>

            {/* Duplicate Project Modal */}
            <Modal
                title="Duplicate Project"
                labelclassName=""
                activeModal={showDuplicateProjectModal}
                onClose={() => setShowDuplicateProjectModal(false)}
                centered
            >
                <div className="space-y-3">
                    <div className="">
                        <label className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Project Name <span className="text-red-500">*</span></label>
                        <Textinput placeholder="Project name" type="text" name="projectName" defaultValue={`Duplicate of ${projectData?.name}`} value={duplicateProjectName} onChange={(e) => setDuplicateProjectName(e.target.value)} error={showErrorDuplicate} />
                    </div>

                    <div>
                        <span className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Project Details</span>
                        <div className="bg-black-100 border rounded-md p-4 flex flex-wrap">
                            {Object.keys(projectDetails).map((key) => (
                                <div className="w-full md:w-1/2 capitalize font-semibold" key={key}>
                                    <label key={key} className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name={key}
                                            checked={projectDetails[key]}
                                            onChange={handleProjectDetailChange}
                                            className="mr-2 cursor-pointer"
                                        />
                                        {key.replace(/_/g, " ")}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {
                        projectDetails?.duplicate_tasks &&
                        <div>
                            <span className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Task Details</span>
                            <div className="bg-black-100 border rounded-md p-4 flex flex-wrap">
                                {Object.keys(taskDetails).map((key) => (
                                    <div className="w-full md:w-1/2 capitalize font-semibold" key={key}>
                                        <label key={key} className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name={key}
                                                checked={taskDetails[key]}
                                                onChange={handleTaskDetailChange}
                                                className="mr-2 cursor-pointer"
                                            />
                                            {key.replace(/_/g, " ")}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    }

                    <div className="flex justify-center mt-8">
                        <button className="bg-electricBlue-100 hover:bg-electricBlue-50 text-white px-4 py-2 rounded-md text-sm disabled:cursor-not-allowed disabled:opacity-50" onClick={handleDuplicateProject} disabled={isDuplicatingProject}>
                            {isDuplicatingProject ? "Duplicating..." : "Duplicate Project"}
                        </button>
                    </div>
                </div>

            </Modal>

            {isExportingCSV && (
                <div className="fixed inset-0 bg-black-500 bg-opacity-30 backdrop-blur-sm z-[1000] flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col items-center gap-4 w-80">
                        <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        <p className="text-center text-sm font-medium text-gray-800 dark:text-white">
                            Exporting tasks... Please wait.
                        </p>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            <EditProjectModal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                projectData={projectData}
                setProjectData={setProjectData}
                refreshJourney={projectData?.refreshJourney}
                permissions={permissions && permissions}
            />

            {/* Import CSV Modal */}
            {showImportCSVModal && (
                <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black-500 bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-7xl w-full mx-4 p-6 overflow-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                {importMode === "template"
                                    ? `Import from template to ${projectData?.name}`
                                    : importMode === "csv"
                                        ? `Import from CSV to ${projectData?.name}`
                                        : `Import tasks to ${projectData?.name}`}
                            </h2>
                            <button
                                onClick={() => setShowImportCSVModal(false)}
                                className="text-gray-400 hover:text-red-500 text-2xl focus:outline-none"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>
                        <SidelineDatabaseTab
                            fields={[
                                { dbField: "Task Name", column: "" },
                                { dbField: "Description", column: "" }
                            ]}
                            setFields={() => { }}
                            setshowCsv={() => setShowImportCSVModal(false)}
                            getAllTasks={() => {
                                // Refresh project data if needed
                                if (projectData?.refreshJourney) {
                                    projectData.refreshJourney();
                                }
                            }}
                            handleTabClick={() => { }}
                            initialMode={importMode}
                            fromProject={true}
                            projectId={projectData?._id}
                            projectData={projectData}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectHeader;