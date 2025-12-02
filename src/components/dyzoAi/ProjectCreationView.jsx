import React, { useState } from 'react';
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchPOST } from "@/store/api/apiSlice";
import { addProjectToTop } from "@/store/projectsSlice";
import useDarkMode from "@/hooks/useDarkMode";

const ProjectCreationView = ({ projectData, message, onDiscard, onConfirm }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user: userInfo } = useSelector((state) => state.auth);
    const [isDark] = useDarkMode();

    const [editableProject, setEditableProject] = useState(projectData || {});
    const [editingField, setEditingField] = useState(null);
    const [createdProject, setCreatedProject] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Helper functions for editing project
    const updateProject = (field, value) => {
        setEditableProject(prev => ({ ...prev, [field]: value }));
    };

    const handleFieldEdit = (field) => {
        setEditingField(prev => prev === field ? null : field);
    };

    const isEditing = (field) => {
        return editingField === field;
    };

    const handleDiscard = () => {
        // Reset all states
        setCreatedProject(null);
        setEditingField(null);
        setIsCreating(false);

        // Call the original onDiscard function
        onDiscard();
    };

    const handleConfirmProject = async () => {
        if (!editableProject || !editableProject.name || editableProject.name.trim() === "") {
            toast.error("Project name is required");
            return;
        }

        setIsCreating(true);

        try {
            // Prepare the payload according to the API format
            const projectPayload = {
                name: editableProject.name.trim(),
                description: editableProject.description || "",
                companyId: userInfo.companyId,
                assignee: editableProject.assignee || [],
            };

        

            const response = await fetchPOST(
                `${import.meta.env.VITE_APP_DJANGO}/project-v2/${userInfo._id}/`,
                { body: JSON.stringify(projectPayload) }
            );

            if (response && response._id) {
                // Store created project and show the success view
                setCreatedProject(response);

                // Add project to Redux store
                dispatch(addProjectToTop(response));

                toast.success("Project created successfully");

                // Call the original onConfirm with the created project
                onConfirm(response);
            } else {
                toast.error(response?.message || "Failed to create project");
            }
        } catch (error) {
            console.error("Error creating project:", error);
            toast.error("An error occurred while creating the project");
        } finally {
            setIsCreating(false);
        }
    };

    const handleProjectClick = (projectId) => {
        if (projectId) {
            navigate(`/project/${projectId}?tab=tasks`);
        }
    };

    // Show success view if project has been created
    if (createdProject) {
        return (
            <div className={`rounded-lg border overflow-hidden`}>
                {/* Header */}
                <div className={`${isDark ? 'bg-gradient-to-r from-green-900/30 to-green-800/20' : 'bg-gradient-to-r from-green-50 to-emerald-50'} px-5 py-4 border-b ${isDark ? 'border-green-800/30' : 'border-green-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-green-600' : 'bg-green-500'} flex items-center justify-center shadow-lg shadow-green-500/30`}>
                            <Icon icon="solar:check-circle-bold" className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className={`${isDark ? 'text-white' : 'text-gray-900'} text-base font-semibold block`}>
                                Project Created Successfully!
                            </span>
                            <span className={`${isDark ? 'text-green-400' : 'text-green-600'} text-xs`}>
                                Your project is ready to use
                            </span>
                        </div>
                    </div>
                </div>

                {/* Created Project Details */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-5 pb-5 mt-5"
                >
                    <div className="flex items-center justify-between gap-4">
                        {/* Project Name */}
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-base`}>
                            {createdProject.name}
                        </h4>

                        {/* View Project Button */}
                        <button
                            onClick={() => handleProjectClick(createdProject._id)}
                            className={`text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${isDark
                                ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                }`}
                        >
                            <Icon icon="solar:square-arrow-right-bold" className="w-4 h-4" />
                            <span>Open Project</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Show original project creation view
    return (
        <div>
            {/* Header */}
            <div className="bg-gradient-to-r from-electricBlue-50/70 via-electricBlue-50/20 to-electricBlue-50/50 px-5 py-4 rounded-lg">
                <div className="flex items-center gap-3">
                   
                    <div>
                        <h3 className="text-white font-semibold text-lg">Create Project</h3>
                        <p className="text-white/80 text-xs mt-0.5">Set up a new project workspace</p>
                    </div>
                </div>
            </div>

           

            {/* Project Details - Single Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 pb-4 mt-5"
            >
               {/* Project Name - Editable */}
                <div className="relative mb-4">
                    <div className="flex items-center gap-2 mb-1.5">

                        <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Project Name <span className="text-red-500">*</span>
                        </label>
                    </div>
                    <div className="flex items-center">
                        {isEditing('name') ? (
                            <input
                                type="text"
                                value={editableProject.name || ''}
                                onChange={(e) => updateProject('name', e.target.value)}
                                onBlur={() => setEditingField(null)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setEditingField(null);
                                    }
                                }}
                                className={`w-full px-3 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all ${isDark
                                    ? 'text-white bg-gray-800 border-gray-600 focus:border-purple-500'
                                    : 'text-gray-900 bg-white border-gray-300 focus:border-purple-500'
                                    }`}
                                autoFocus
                                placeholder="Enter project name"
                            />
                        ) : (
                            <div
                                className={`font-medium ${isDark ? 'text-white hover:bg-gray-800/50' : 'text-gray-900 hover:bg-gray-50'} text-sm cursor-pointer px-3 py-2 rounded-lg flex items-center w-full border transition-all ${isDark ? 'border-gray-700 hover:border-purple-500/50' : 'border-gray-200 hover:border-purple-300'}`}
                                onClick={() => handleFieldEdit('name')}
                            >
                                {editableProject.name || (
                                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                                        Click to enter project name
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Project Description - Editable */}
                <div className="relative">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Icon icon="solar:document-text-bold" className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Description <span className="text-gray-500 font-normal normal-case">(optional)</span>
                        </label>
                    </div>
                    <div>
                        {isEditing('description') ? (
                            <textarea
                                value={editableProject.description || ''}
                                onChange={(e) => updateProject('description', e.target.value)}
                                onBlur={() => setEditingField(null)}
                                rows={2}
                                className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all ${isDark
                                    ? 'text-gray-300 bg-gray-800 border-gray-600 focus:border-purple-500'
                                    : 'text-gray-600 bg-white border-gray-300 focus:border-purple-500'
                                    }`}
                                placeholder="Click to add description (optional)"
                                autoFocus
                            />
                        ) : (
                            <div
                                className={`${isDark ? 'text-gray-400 hover:bg-gray-800/50' : 'text-gray-600 hover:bg-gray-50'} text-sm leading-relaxed cursor-pointer px-3 py-2 rounded-lg min-h-[44px] flex items-start border transition-all ${isDark ? 'border-gray-700 hover:border-purple-500/50' : 'border-gray-200 hover:border-purple-300'}`}
                                onClick={() => handleFieldEdit('description')}
                            >
                                {editableProject.description ? (
                                    <span className="whitespace-pre-wrap">{editableProject.description}</span>
                                ) : (
                                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                                        Click to add description (optional)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Footer Actions */}
            <div className={`px-5 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-end gap-2`}>
                <button
                    onClick={handleDiscard}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${isDark
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    Discard
                </button>
                <button
                    onClick={handleConfirmProject}
                    disabled={isCreating || !editableProject.name}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${isCreating || !editableProject.name
                        ? 'bg-gray-400 cursor-not-allowed opacity-60'
                        : 'bg-[#7A39FF] hover:bg-[#6929EF]'
                        } text-white`}
                >
                    {isCreating ? (
                        <>
                            <Icon icon="svg-spinners:3-dots-fade" className="w-4 h-4" />
                            Creating...
                        </>
                    ) : (
                        'Confirm'
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProjectCreationView;

