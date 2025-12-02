import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "@/components/ui/Modal";
import { ProfilePicture } from "@/components/ui/profilePicture";
import { fetchUsers } from "@/store/usersSlice";
import { Icon } from "@iconify/react";
import Button from "../ui/Button";
import Textinput from "../ui/Textinput";
import { fetchAuthPut, fetchAuthPost, fetchAuthDelete, fetchAPI } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { djangoBaseURL } from "@/helper";
import { HexColorPicker } from "react-colorful";
import StatusManager from "../project/StatusManager";
import { updateProjectInList, updateProjectMembers } from "@/store/projectsSlice";
import { useNavigate } from "react-router-dom";

const accessLevelOptions = [
    { value: "admin", label: "Admin" },
    { value: "editor", label: "Editor" },
    { value: "viewer", label: "Viewer" },
];

const EditProjectModal = ({ 
    open, 
    onClose, 
    projectData, 
    setProjectData,
    refreshJourney,
    permissions
}) => {
    const dispatch = useDispatch();
    const { users, loading } = useSelector((state) => state.users);
    const userInfo = useSelector((state) => state.auth.user);
    
    // Project editing states
    const [projectName, setProjectName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Snapshots for change detection
    const [initialName, setInitialName] = useState("");
    const [initialAssigneeIds, setInitialAssigneeIds] = useState("");
    const [initialAccessLevelsNorm, setInitialAccessLevelsNorm] = useState("");
    
    // Member management states
    const [assignees, setAssignees] = useState([]);
    const [accessLevels, setAccessLevels] = useState({});
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef(null);
    
    // Status management states
    const [statuses, setStatuses] = useState([]);
    const normalizeAccessLevels = (obj) => {
        const entries = Object.entries(obj || {}).map(([k, v]) => [String(k), String(v)]);
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        return JSON.stringify(entries);
    };
    const navigate = useNavigate();
    useEffect(() => {
        if (open) {
            setSearch('');
            dispatch(fetchUsers());
            setProjectName(projectData?.name || "");
            setAssignees(projectData?.assignee_details || []);
            setAccessLevels(projectData?.accessLevels || {});  
            setStatuses(projectData?.status || []);

            // Capture initial snapshots for change detection
            const initIds = (projectData?.assignee_details || []).map(u => u._id).sort().join(",");
            setInitialAssigneeIds(initIds);
            setInitialName(projectData?.name || "");
            setInitialAccessLevelsNorm(normalizeAccessLevels(projectData?.accessLevels || {}));
        }
    }, [open, dispatch, projectData]);
    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen]);


    // Filter assignees by search
    const filteredAssignees = assignees.filter(
        (user) =>
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase())
    );

    // Filter available users by search and not already assigned
    const filteredUsers = users.filter(
        (user) =>
            !assignees.some((u) => u._id === user._id) &&
            (user.name?.toLowerCase().includes(search.toLowerCase()) ||
                user.email?.toLowerCase().includes(search.toLowerCase()))
    );

    // Member management functions
    const handleSelect = (user) => {
        if (!assignees.some((u) => u._id === user._id)) {
            setAssignees([...assignees, user]);
            setAccessLevels({ ...accessLevels, [user._id]: "viewer" });
        }
    };

    const handleRemove = (userId) => {
        setAssignees(assignees.filter((u) => u._id !== userId));
        const newLevels = { ...accessLevels };
        delete newLevels[userId];
        setAccessLevels(newLevels);
    };

    const handleAccessLevelChange = (userId, level) => {
        setAccessLevels({ ...accessLevels, [userId]: level });
    };
    // Save project changes with change detection
    const handleSave = async () => {
        const trimmedName = projectName.trim();
        if (!trimmedName) {
            toast.error("Project name is required");
            return;
        }

        // Compute current normalized values
        const currentIds = assignees.map(u => u._id).sort().join(",");
        const currentAccessNorm = normalizeAccessLevels(accessLevels);

        const nameChanged = trimmedName !== initialName;
        const assigneesChanged = currentIds !== initialAssigneeIds;
        const accessChanged = currentAccessNorm !== initialAccessLevelsNorm;

        if (!nameChanged && !assigneesChanged && !accessChanged) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            const response = await dispatch(updateProjectMembers({
                projectId: projectData._id,
                userId: userInfo._id,
                assignees: assignees.map(u => u._id),      // current assigned user IDs
                accessLevels: accessLevels                 // current access level map
            }));
            
            if (response.payload) {
                // Update redux list for name/assignees/access_levels
                dispatch(updateProjectInList({ id: projectData._id, changes: { name: trimmedName } }));
                if (setProjectData) {
                    setProjectData({ 
                        ...projectData, 
                        name: trimmedName,
                        assignee_details: assignees,
                        accessLevels: accessLevels,
                        status: statuses
                    });
                }
                if (refreshJourney) {
                    refreshJourney();
                }
                onClose();
            } else {
                toast.error("Failed to update project");
            }
        } catch (error) {
            toast.error("Error updating project");
            console.error("Update error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            activeModal={open}
            onClose={onClose}
            title="Edit Project"
            className="max-w-lg w-full min-h-[595px]"
            themeClass="bg-white dark:bg-slate-800 border-b border-neutral-50 dark:border-slate-700"
            scrollContent={false}
            centered
        >
            <div className="flex flex-col space-y-6">
                {/* Project Name Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Project Name *
                    </label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[#A259D6] focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-300"
                        placeholder="Enter project name"
                    />
                </div>

                {/* Add Project Members Dropdown Trigger & Content */}
                {
                    permissions?.canManageMembers &&
                    ![userInfo?.default_project, userInfo?.default_project_id]
                        .filter(v => v !== undefined && v !== null && v !== '')
                        .some(v => String(v) === String(projectData?._id)) &&
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Add  Project Members
                        </label>
                        <div className="relative" ref={dropdownRef}>
                            <div
                                className={`w-full border border-neutral-50 dark:border-slate-700 rounded px-4 py-2 text-gray-500 dark:text-slate-300 bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer ${dropdownOpen ? 'ring-2 ring-[#A259D6]' : ''}`}
                                onClick={() => setDropdownOpen((prev) => !prev)}
                            >
                                {dropdownOpen ? (
                                    <div className="flex items-center flex-1 mr-2">
                                        <Icon icon="mdi:magnify" className="w-5 h-5 text-gray-400 mr-2" />
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Search Member"
                                            className="flex-1 bg-transparent outline-none text-gray-700 dark:text-slate-300 placeholder-gray-400"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                ) : (
                                    <span className="text-gray-400 select-none">
                                        {assignees.length === 0 ? 'Select Member' : `${assignees.length} member${assignees.length > 1 ? 's' : ''} selected`}
                                    </span>
                                )}
                                <Icon icon={dropdownOpen ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-5 h-5 text-gray-400" />
                            </div>
                            {dropdownOpen && (
                                <div className="absolute left-0 top-full mt-1 w-full z-50 bg-white dark:bg-slate-800 border border-neutral-50 dark:border-slate-700 rounded-b-lg shadow-lg max-h-96 overflow-y-auto">
                                    {/* Selected Members */}
                                    {filteredAssignees.length > 0 && (
                                        <div className="flex flex-col bg-white dark:bg-slate-800 border-b border-neutral-50 dark:border-slate-700 max-h-36 overflow-y-auto">
                                            {filteredAssignees.map((user) => (
                                                <div key={user._id} className="flex items-center gap-2 p-1.5 px-4 hover:bg-gray-50 dark:hover:bg-slate-700">
                                                    <ProfilePicture user={user} className="w-7 h-7 rounded-full" />
                                                    <span className="flex-1 text-customBlack-50 dark:text-customWhite-50 text-sm">{user.name}</span>
                                                    <select
                                                        className="border border-neutral-50 dark:border-slate-700 rounded px-2 py-1 text-xs bg-white dark:bg-slate-800 text-customBlack-50 dark:text-customWhite-50"
                                                        value={accessLevels[user._id] || "editor"}
                                                        onChange={e => handleAccessLevelChange(user._id, e.target.value)}
                                                    >
                                                        {accessLevelOptions.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    <button className="ml-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400" onClick={() => handleRemove(user._id)}>
                                                        <Icon icon="mdi:close" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Available Users */}
                                    <div className="bg-white dark:bg-slate-800 max-h-36 overflow-y-auto">
                                        {loading ? (
                                            <div className="flex items-center justify-center h-32 text-gray-500 dark:text-slate-400">Loading...</div>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <div
                                                    key={user._id}
                                                    onClick={() => handleSelect(user)}
                                                    className="flex items-center px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer group"
                                                >
                                                    <ProfilePicture user={user} className="w-7 h-7 rounded-full mr-3" />
                                                    <span className="flex-1 text-customBlack-50 dark:text-customWhite-50 text-sm">{user.name}</span>
                                                    <button
                                                        className="font-bold text-xl opacity-80 group-hover:opacity-100 text-gray-600 dark:text-slate-400"
                                                        disabled={assignees.some((u) => u._id === user._id)}
                                                    >
                                                        <Icon icon="mdi:plus" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {/* Invite Member Button */}
                                    <Button
                                        className="w-full py-2 rounded text-electricBlue-100 font-medium flex items-center rounded-tl-none rounded-tr-none gap-2 border-t border-neutral-50 dark:border-slate-700 justify-start mt-2"
                                        onClick={() => navigate("/invite-user")}
                                        icon="mdi:plus"
                                        text="Invite Member"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                }

                {/* Status Section (always visible, no dropdown) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Status *
                    </label>
                    <StatusManager
                        projectId={projectData?._id}
                        baseUrl={djangoBaseURL}
                        statuses={statuses}
                        setStatuses={setStatuses}
                        refreshJourney={refreshJourney}
                        setProjectData={setProjectData}
                    />
                </div>

                {/* Save Button */}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-[#A259D6] text-white rounded-md hover:bg-[#8e4bb8] transition-colors disabled:opacity-50 font-medium"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditProjectModal; 