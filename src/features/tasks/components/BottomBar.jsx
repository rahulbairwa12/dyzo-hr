import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'react-toastify';
import Modal from '@/components/ui/Modal';
import Select, { components } from 'react-select';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import Textinput from '@/components/ui/Textinput';
import Button from '@/components/ui/Button';
import { fetchAuthPost, fetchAuthGET } from '@/store/api/apiSlice';
import { useSelector } from 'react-redux';
import { clearSelectedTasks } from '../store/tasksSlice';
import { fetchProjects } from '@/store/projectsSlice';
import { useDispatch } from 'react-redux';
import { ProfilePicture } from '@/components/ui/profilePicture';
import { useNavigate } from 'react-router-dom';
import AddProject from '@/components/Projects/AddProject';

// Custom Menu components with sticky invite buttons
const CustomUserMenu = props => {
  const navigate = useNavigate();
  const handleInviteClick = (e) => {
    navigate("/invite-user")
  };

  return (
    <components.Menu {...props}>
      {props.children}
      <div className="sticky bottom-0 z-10 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-2">
        <button
          className="w-full px-3 py-2.5 flex items-center justify-center text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg transition-colors font-medium"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleInviteClick(e);
          }}
        >
          <Icon icon="heroicons:plus" className="w-5 h-5 mr-2" />
          <span>Invite User</span>
        </button>
      </div>
    </components.Menu>
  );
};

const CustomProjectMenu = ({ onAddProject, ...props }) => {
  const handleAddProject = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddProject) {
      onAddProject();
    }
  };

  return (
    <components.Menu {...props}>
      {props.children}
      <div className="sticky bottom-0 z-10 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-2">
        <button
          className="w-full px-3 py-2.5 flex items-center justify-center text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg transition-colors font-medium"
          onMouseDown={handleAddProject}
        >
          <Icon icon="heroicons:plus" className="w-5 h-5 mr-2" />
          <span>Add Project</span>
        </button>
      </div>
    </components.Menu>
  );
};

const CustomOption = ({ innerProps, isDisabled, isFocused, children }) => {
  const optionRef = useRef(null);
  useEffect(() => {
    if (isFocused && optionRef.current) {
      optionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isFocused]);

  const focusedStyles = {
    backgroundColor: '#f1f5f9', // Equivalent to bg-gray-100
    color: '#1e293b', // Equivalent to text-gray-800
  };

  const optionStyles = {
    padding: '8px 12px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    ...(isFocused && !isDisabled ? focusedStyles : {}),
  };

  return (
    <div ref={optionRef} {...innerProps} style={optionStyles}>
      {children}
    </div>
  );
};

export const DeleteTaskPopUp = ({ showModal, onClose, handleDelete, loading, taskCount = 0, selectedTasks = [] }) => {
  if (!showModal) return null;

  // Determine if we should show task details or just the count
  const showTaskDetails = selectedTasks && selectedTasks.length > 0 && selectedTasks.length <= 200;

  return (
    <div className="fixed inset-0 z-[112]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black-500 bg-opacity-50 backdrop-blur-sm transition-opacity"></div>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-10 text-center">
          <div className="rel12tive p-8 px-12 dark:bg-customBlack-200 dark:text-customWhite-50 transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-[400px] mx-auto">
            <div className="flex flex-col items-center">
              <div className="bg-[#FFEAE7] rounded-full p-1.5 mb-5">
                <div className="flex items-center justify-center p-1 rounded-full bg-[#F6D7D6]">
                  <Icon icon="fluent:error-circle-48-regular" className="text-customRed-50" width="30" height="30" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-customBlack-50 dark:text-customWhite-50" id="modal-title">Delete Tasks</h3>
              <div className="mt-2">
                <p className="text-base text-center text-customBlack-100 dark:text-customWhite-50">
                  Are you sure you want to delete {taskCount} {taskCount === 1 ? 'task' : 'tasks'}?
                  <br />
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Show warning about many tasks */}
            {!showTaskDetails && taskCount > 5 && (
              <div className="mt-3 md:mt-4 p-2 md:p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-md text-xs md:text-sm text-yellow-800 dark:text-yellow-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icon icon="heroicons:information-circle" className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                  </div>
                  <div className="ml-2 md:ml-3">
                    <p>You are about to delete {taskCount} tasks. Please review your selection carefully.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Task summary card for many tasks */}
            {!showTaskDetails && taskCount > 5 && selectedTasks && selectedTasks.length > 0 && (
              <div className="mt-3 md:mt-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-2 md:p-3">
                  <h4 className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Summary</h4>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Projects summary */}
                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center mb-1">
                        <Icon icon="heroicons:folder" className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-indigo-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Projects</span>
                      </div>
                      <div className="text-xs md:text-sm font-medium">
                        {new Set(selectedTasks.map(t => t.projectName).filter(Boolean)).size || '?'}
                      </div>
                    </div>

                    {/* Status summary */}
                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center mb-1">
                        <Icon icon="heroicons:tag" className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-blue-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Statuses</span>
                      </div>
                      <div className="text-xs md:text-sm font-medium">
                        {new Set(selectedTasks.map(t => t.status).filter(Boolean)).size || '?'}
                      </div>
                    </div>

                    {/* Assignees summary */}
                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center mb-1">
                        <Icon icon="heroicons:user" className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-green-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Assignees</span>
                      </div>
                      <div className="text-xs md:text-sm font-medium">
                        {new Set(selectedTasks.map(t => t.assigneeName).filter(Boolean)).size || '?'}
                      </div>
                    </div>

                    {/* Priority summary */}
                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">
                      <div className="flex items-center mb-1">
                        <Icon icon="heroicons:flag" className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-red-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</span>
                      </div>
                      <div className="text-xs md:text-sm font-medium">
                        {taskCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-7 gap-5 sm:flex-row flex-col">
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 px-10 py-1.5 bg-neutral-150 text-customBlack-100 font-bold shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md px-10 py-1.5 bg-red-600 text-white font-semibold shadow-sm hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionMoveModal = ({ showModal, onClose, handleSectionMove, loading, sections, selectedTasks }) => {
  const [selectedSection, setSelectedSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedSection) {
      toast.error("Please select a section");
      return;
    }

    setIsSubmitting(true);
    try {
      await handleSectionMove(selectedTasks, selectedSection.value);
      onClose();
      setSelectedSection(null);
    } catch (error) {
      console.error("Error moving tasks to section:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sectionOptions = sections?.map(section => ({
    value: section.id,
    label: section.name || `Section ${section.id}`
  })) || [];

  return (
    <Modal
      title="Move Tasks to Section"
      activeModal={showModal}
      onClose={onClose}
      centered
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Section
          </label>
          <Select
            value={selectedSection}
            onChange={setSelectedSection}
            options={sectionOptions}
            placeholder="Choose a section..."
            isDisabled={loading || isSubmitting}
            className="react-select-container"
            classNamePrefix="react-select"
            components={{ Option: CustomOption }}
            maxMenuHeight={200}
            menuPlacement="auto"
            isSearchable={true}
            menuPortalTarget={document.body}
            styles={{
              menu: (provided) => ({
                ...provided,
                zIndex: 99999,
                maxHeight: '200px',
                position: 'fixed'
              }),
              menuList: (provided) => ({
                ...provided,
                maxHeight: '200px',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9',
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f5f9',
                  borderRadius: '3px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e1',
                  borderRadius: '3px'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#94a3b8'
                }
              }),
              control: (provided, state) => ({
                ...provided,
                minHeight: '40px',
                borderColor: state.isFocused ? '#7A39FF' : '#d1d5db',
                boxShadow: state.isFocused ? '0 0 0 1px #7A39FF' : 'none',
                '&:hover': {
                  borderColor: '#7A39FF'
                }
              })
            }}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            text="Cancel"
            className="btn-outline-dark"
            onClick={onClose}
            disabled={isSubmitting}
          />
          <Button
            text={isSubmitting ? "Moving..." : "Move Tasks"}
            className="bg-[#7A39FF] text-white"
            onClick={handleSubmit}
            disabled={!selectedSection || isSubmitting}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </Modal>
  );
};

const BulkUpdateModal = ({ showModal, onClose, handleBulkUpdate, loading, projects, users, taskPositions, selectedTasks, hideProjectSelect = false, currentProjectId = null, onAddProjectClick }) => {
  const [updateValues, setUpdateValues] = useState({
    action: "update"
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const userInfo = useSelector(state => state.auth.user);

  const userOptions = Array.isArray(users) ? users.map(user => ({
    value: user._id,
    label: user.name || `${user.first_name || ''} ${user.last_name || ''}`,
    image: user.image
  })) : [];

  // Format option label with image for users
  const formatUserOptionLabel = ({ value, label, image }) => (
    <div className="flex items-center">
      <div className="w-6 h-6 mr-2">
        <ProfilePicture user={{ name: label, image }} />
      </div>
      <span>{label}</span>
    </div>
  );

  // Custom styles for Select component
  const customSelectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: 'white',
      borderColor: '#e2e8f0',
      minHeight: '42px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      '&:hover': {
        borderColor: '#cbd5e1'
      }
    }),
    option: (styles, { isSelected }) => ({
      ...styles,
      backgroundColor: isSelected ? '#3b82f6' : 'white',
      color: isSelected ? 'white' : '#334155',
      ':hover': {
        backgroundColor: isSelected ? '#3b82f6' : '#f1f5f9',
      }
    }),
    menu: (styles) => ({
      ...styles,
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    })
  };

  // Options for dropdowns
  const projectOptions = Array.isArray(projects) ? projects.map(project => ({
    value: project._id,
    label: project.name,
    color: project.projectColor || '#6366f1'
  })) : [];

  // Format option label with color indicator for projects
  const formatProjectOptionLabel = ({ label, color }) => (
    <div className="flex items-center">
      <span
        className="w-3 h-3 rounded-sm mr-2"
        style={{ backgroundColor: color }}
      ></span>
      <span>{label}</span>
    </div>
  );

  // Default status options if taskPositions is empty
  const defaultStatusOptions = [
    { value: "not_started_yet", label: "Not Started Yet", color: "#DC3464" },
    { value: "in_progress", label: "In progress", color: "#3092F5" },
    { value: "completed", label: "Completed", color: "#30F558" },
    { value: "pending", label: "Pending", color: "#BCBCBC" },
    { value: "archived", label: "Archived", color: "#6C757D" }
  ];

  // Function to fetch project-specific statuses
  const fetchProjectStatuses = async (projectId) => {
    if (!projectId || !userInfo?.companyId) {
      setProjectStatuses([]);
      return;
    }

    setLoadingStatuses(true);
    try {
      const BaseUrl = import.meta.env.VITE_APP_DJANGO;
      const apiUrl = `${BaseUrl}/project-status/${userInfo.companyId}/${projectId}/`;

      const data = await fetchAuthGET(apiUrl);

      if (data.status && data.unique_statuses) {
        // Convert API statuses to the format needed for the component
        const formattedStatuses = data.unique_statuses.map(status => ({
          value: status.status?.toLowerCase().replace(/\s+/g, '_') || status.value,
          label: status.status || status.name || status.label,
          color: status.color || "#6c757d"
        }));
        setProjectStatuses(formattedStatuses);
      } else {
        setProjectStatuses([]);
      }
    } catch (error) {
      console.error("Error fetching project statuses:", error);
      setProjectStatuses([]);
    } finally {
      setLoadingStatuses(false);
    }
  };

  // Fetch project statuses when project changes or when currentProjectId is provided
  useEffect(() => {
    const projectIdToFetch = hideProjectSelect ? currentProjectId : selectedProject?.value;

    if (projectIdToFetch && userInfo?.companyId) {
      fetchProjectStatuses(projectIdToFetch);
    } else {
      setProjectStatuses([]);
    }
  }, [selectedProject?.value, currentProjectId, hideProjectSelect, userInfo?.companyId]);

  // Reset status selection when project changes
  useEffect(() => {
    if (selectedProject?.value) {
      // Clear the taskPosition from updateValues and reset selected status when project changes
      setSelectedStatus(null);
      setUpdateValues(prev => {
        const newState = { ...prev };
        delete newState.taskPosition;
        return newState;
      });
    }
  }, [selectedProject?.value]);

  // Determine which status options to use
  const getStatusOptions = () => {
    // If hideProjectSelect is true and we have a currentProjectId, fetch statuses for that project
    if (hideProjectSelect && currentProjectId && projectStatuses.length > 0) {
      return projectStatuses;
    }
    // If a project is manually selected and we have its statuses
    else if (selectedProject?.value && projectStatuses.length > 0) {
      return projectStatuses;
    }
    // Default to the 5 predefined statuses
    else {
      return defaultStatusOptions;
    }
  };

  const statusOptions = getStatusOptions();

  // Custom styles specifically for status dropdown with reduced height
  const statusSelectStyles = {
    ...customSelectStyles,
    option: (styles, { isSelected }) => ({
      ...styles,
      backgroundColor: isSelected ? '#3b82f6' : 'white',
      color: isSelected ? 'white' : '#334155',
      padding: '6px 12px',
      fontSize: '0.875rem',
      ':hover': {
        backgroundColor: isSelected ? '#3b82f6' : '#f1f5f9',
      }
    }),
    menu: (styles) => ({
      ...styles,
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      maxHeight: '150px',
    }),
    menuList: (styles) => ({
      ...styles,
      maxHeight: '150px',
    })
  };

  // Handle update for all fields
  const handleUpdate = async () => {
    if (!handleBulkUpdate) {
      console.error("handleBulkUpdate function is not defined");
      toast.error("Update functionality is not available");
      return;
    }

    // Check if we have at least one field to update
    if (Object.keys(updateValues).length <= 1) {
      toast.error("Please select at least one field to update");
      return;
    }

    try {
      await handleBulkUpdate(updateValues);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error updating tasks:", error);
      toast.error("Failed to update tasks. Please try again.");
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-500/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-[90%] md:max-w-lg md:w-full p-5 md:p-6 border border-gray-200 dark:border-slate-700 transform transition-all duration-300 ease-in-out m-4 md:m-0">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Update Selected Tasks</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1"
          >
            <Icon icon="material-symbols-light:close" className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Assign To */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Tasks To</label>
            <Select
              options={userOptions}
              onChange={(selected) => {
                if (Array.isArray(selected)) {
                  // For multiple selections, extract all user IDs
                  const userIds = selected.map(option => option.value);
                  setUpdateValues(prev => ({ ...prev, assigned_users: userIds }));
                } else if (selected === null) {
                  // When cleared, remove assigned_users from the state
                  setUpdateValues(prev => {
                    const newState = { ...prev };
                    delete newState.assigned_users;
                    return newState;
                  });
                } else {
                  // Single selection fallback (should not happen with isMulti)
                  setUpdateValues(prev => ({ ...prev, assigned_users: [selected.value] }));
                }
              }}
              formatOptionLabel={formatUserOptionLabel}
              placeholder="Select users..."
              styles={customSelectStyles}
              isMulti
              isClearable
              className="text-sm"
              components={{ Menu: CustomUserMenu, Option: CustomOption }}
            />
          </div>

          {/* Project */}
          {!hideProjectSelect && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Change Project</label>
              <Select
                options={projectOptions}
                onChange={(selected) => {
                  setSelectedProject(selected);
                  setUpdateValues(prev => ({ ...prev, projectId: selected?.value }));
                }}
                placeholder="Select a project..."
                formatOptionLabel={formatProjectOptionLabel}
                styles={customSelectStyles}
                isClearable
                className="text-sm"
                components={{ Menu: (props) => <CustomProjectMenu {...props} onAddProject={onAddProjectClick} />, Option: CustomOption }}
              />
            </div>
          )}

          {/* Status */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Change Status
              {loadingStatuses && (
                <span className="ml-2 text-xs text-blue-500">Loading statuses...</span>
              )}
            </label>
            <Select
              value={selectedStatus}
              options={statusOptions}
              onChange={(selected) => {
                setSelectedStatus(selected);
                if (selected) {
                  setUpdateValues(prev => ({ ...prev, taskPosition: selected.value }));
                } else {
                  setUpdateValues(prev => {
                    const newState = { ...prev };
                    delete newState.taskPosition;
                    return newState;
                  });
                }
              }}
              placeholder="Select a status..."
              isLoading={loadingStatuses}
              formatOptionLabel={({ label, color }) => (
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                  ></span>
                  <span>{label}</span>
                </div>
              )}
              styles={statusSelectStyles}
              isClearable
              className="text-sm"
              components={{ Option: CustomOption }}
            />
            {selectedProject?.value && projectStatuses.length === 0 && !loadingStatuses && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No custom statuses found for this project. Using default statuses.
              </p>
            )}
          </div>
        </div>



        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || Object.keys(updateValues).length <= 1}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
          >
            {loading ? (
              <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Update Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

const BottomBar = ({
  selectedTasks,
  deleteTasks,
  exportTasks,
  copyTasks,
  closeBottomBar,
  bulkLoading,
  modalIsOpen,
  setModalIsOpen,
  getAllTasks,
  users,
  projects,
  handleBulkUpdate,
  taskStatuses = [],
  isCopy,
  savedEffect,
  setSavedEffect,
  hideProjectSelect = false,
  // Section move props
  sections = [],
  handleSectionMove,
  currentProjectId = null
}) => {
  const dispatch = useDispatch()
  const { user: userInfo } = useSelector((state) => state.auth);
  const { projects: reduxProjects } = useSelector((state) => state.projects);
  const [templateName, setTemplateName] = useState("")
  const [showError, setShowError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  // Ensure selectedTasks is always an array and extract task IDs if objects are passed
  const normalizedSelectedTasks = Array.isArray(selectedTasks)
    ? selectedTasks.map(task => {
      // If task is an object with _id or taskId, extract the ID
      if (typeof task === 'object' && task !== null) {
        return task._id || task.taskId || task.id;
      }
      // If task is already a number/string ID, return as is
      return task;
    }).filter(id => id !== undefined && id !== null)
    : [];

  // Calculate task count once
  const taskCount = normalizedSelectedTasks.length;


  // We'll use modalIsOpen state for two different modals: "delete" and "update".
  const openDeleteModal = () => {

    if (typeof setModalIsOpen === 'function') {
      setModalIsOpen("delete");
    } else {
      console.error("setModalIsOpen is not a function", setModalIsOpen);
    }
  };

  const openUpdateModal = () => {

    if (typeof setModalIsOpen === 'function') {
      setModalIsOpen("update");
    } else {
      console.error("setModalIsOpen is not a function", setModalIsOpen);
    }
  };

  const openTemplateModal = () => {

    if (typeof setModalIsOpen === 'function') {
      setModalIsOpen("template");
    } else {
      console.error("setModalIsOpen is not a function", setModalIsOpen);
    }
  };

  const openSectionMoveModal = () => {
    if (typeof setModalIsOpen === 'function') {
      setModalIsOpen("sectionMove");
    } else {
      console.error("setModalIsOpen is not a function", setModalIsOpen);
    }
  };

  const closeModal = () => {

    if (typeof setModalIsOpen === 'function') {
      setModalIsOpen("");
    } else {
      console.error("setModalIsOpen is not a function", setModalIsOpen);
    }
  };

  // Handle button click with safety checks
  const handleDeleteClick = () => {
    if (taskCount === 0) {
      toast.error("No tasks selected for deletion");
      return;
    }
    openDeleteModal();
  };

  const handleUpdateClick = () => {
    if (taskCount === 0) {
      toast.error("No tasks selected for update");
      return;
    }
    openUpdateModal();
  };

  const handleTemplateClick = () => {
    if (taskCount === 0) {
      toast.error("No tasks selected for update");
      return;
    }
    openTemplateModal();
  };

  const handleSectionMoveClick = () => {
    if (taskCount === 0) {
      toast.error("No tasks selected for section move");
      return;
    }
    if (!sections || sections.length === 0) {
      toast.error("No sections available");
      return;
    }
    openSectionMoveModal();
  };

  // Handle section move with refresh
  const handleSectionMoveWithRefresh = async (taskIds, sectionId) => {
    if (typeof handleSectionMove !== 'function') {
      console.error("handleSectionMove is not a function");
      toast.error("Section move functionality is not available");
      return;
    }

    try {
      await handleSectionMove(taskIds, sectionId);

      // Find the section name for the success message
      const section = sections.find(s => s.id === sectionId);
      const sectionName = section?.name || 'section';

      // Create appropriate message based on task count
      const taskCount = Array.isArray(taskIds) ? taskIds.length : 1;
      const message = taskCount === 1
        ? `Task moved to ${sectionName}!`
        : `${taskCount} tasks moved to ${sectionName}!`;

      // Clear selected tasks and close bottom bar after successful move
      dispatch(clearSelectedTasks());
      closeModal();
      closeBottomBar();
      toast.success(message);
    } catch (error) {
      console.error("Error moving tasks to section:", error);
      toast.error("Failed to move tasks to section. Please try again.");
    }
  };

  // Modified to include refresh after operation
  const handleDeleteConfirm = async () => {
    if (typeof deleteTasks !== 'function') {
      console.error("deleteTasks is not a function");
      toast.error("Delete functionality is not available");
      return;
    }

    try {
      await deleteTasks();
      // Clear selected tasks and close bottom bar after successful delete
      dispatch(clearSelectedTasks());
      closeModal();
      closeBottomBar();
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Failed to delete tasks. Please try again.");
    }
  };

  const handleCopyClick = () => {
    if (typeof copyTasks !== 'function') {
      console.error("copyTasks is not a function");
      toast.error("Copy functionality is not available");
      return;
    }
    copyTasks();

    closeBottomBar();
  };

  const handleExportClick = () => {
    if (typeof exportTasks !== 'function') {
      console.error("exportTasks is not a function");
      toast.error("Export functionality is not available");
      return;
    }
    exportTasks();

    closeBottomBar();
  };

  // Modified BulkUpdateModal component's handleUpdate function - state is updated by Redux reducer
  const handleBulkUpdateWithRefresh = async (updateValues) => {
    if (typeof handleBulkUpdate !== 'function') {
      console.error("handleBulkUpdate is not a function");
      toast.error("Update functionality is not available");
      return;
    }

    try {
      await handleBulkUpdate(updateValues);
      // Clear selected tasks, close modal, and close bottom bar after successful update
      // No need to fetchTasks - Redux reducer already updates the state
      dispatch(clearSelectedTasks());
      closeModal();
      closeBottomBar();
    } catch (error) {
      console.error("Error updating tasks:", error);
      toast.error("Failed to update tasks. Please try again.");
    }
  };

  const handleCloseClick = () => {
    if (typeof closeBottomBar !== 'function') {
      console.error("closeBottomBar is not a function");
      return;
    }
    closeBottomBar();
  };

  const handleSaveTemplate = async () => {
    if (!templateName || templateName.trim() === "") {
      setShowError(true)
      setTimeout(() => {
        setShowError(false);
      }, 3000);
      return;
    }

    try {
      setIsSaving(true)
      const payload = {
        template_name: templateName,
        companyId: userInfo?.companyId,
        taskIds: normalizedSelectedTasks
      };

      const response = await fetchAuthPost(
        `${import.meta.env.VITE_APP_DJANGO}/task-templates/create/${userInfo?._id}/`,
        { body: payload }
      );
      if (response.status === 1) {
        toast.success("Template Saved.", {
          position: "bottom-right",
          autoClose: 2000,
        })
        setSavedEffect(true);
        dispatch(clearSelectedTasks());
        closeModal();
        closeBottomBar();
        setTimeout(() => {
          setSavedEffect(false);
        }, 3000);
      } else {
        toast.error("Failed to save template")
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false)
    }
  }

  // Don't render if no tasks are selected
  if (taskCount === 0) {
    return null;
  }

  return (
    <div className="Bbar text-xs">
      <div className="BottomBar box-border border rounded-md shadow-[0px_12px_40px_rgba(0,0,0,0.25)] fixed bottom-0 md:bottom-16 bg-white flex flex-wrap md:flex-nowrap items-center justify-between border-t border-gray-200 w-full md:max-w-screen-sm slide-up mx-auto dark:bg-slate-800 dark:border-slate-700 z-40 p-0.5">
        {/* Mobile view - Two rows layout */}
        <div className="flex flex-col w-full md:hidden">
          {/* Top row with count and close button */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 w-full">
            <div className="flex items-center">
              <div className="bg-appbg text-black-500 dark:text-white px-2.5 py-2 text-[13px] font-semibold">
                {taskCount}
              </div>
              <span className="font-medium text-[12px] text-gray-700 dark:text-gray-300 ml-2">
                {taskCount > 1 ? "Tasks selected" : "Task selected"}
              </span>
            </div>
            <div
              onClick={handleCloseClick}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <Icon icon="material-symbols-light:close" className="w-5 h-5" />
            </div>
          </div>

          {/* Bottom row with action buttons */}
          <div className="grid grid-cols-6 w-full">
            <button
              className="flex flex-col items-center justify-center py-2 border-r border-gray-100 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
              onClick={handleCopyClick}
              disabled={taskCount === 0}
            >
              <Icon icon="uil:copy" className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-[11px] mt-0.5 text-gray-600 dark:text-gray-300">{isCopy ? "Copied" : "Copy"}</span>
            </button>
            <button
              className="flex flex-col items-center justify-center py-2 border-r border-gray-100 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
              onClick={handleExportClick}
              disabled={taskCount === 0}
            >
              <Icon icon="icon-park-outline:excel" className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-[11px] mt-0.5 text-gray-600 dark:text-gray-300">Export</span>
            </button>
            <button
              className="flex flex-col items-center justify-center py-2 border-r border-gray-100 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
              onClick={handleUpdateClick}
              disabled={taskCount === 0}
            >
              <Icon icon="fluent:edit-16-regular" className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-[11px] mt-0.5 text-gray-600 dark:text-gray-300">Update</span>
            </button>
            <button
              className="flex flex-col items-center justify-center py-2 border-r border-gray-100 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
              onClick={handleSectionMoveClick}
              disabled={taskCount === 0 || !sections || sections.length === 0}
            >
              <Icon icon="fluent:arrow-move-20-regular" className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-[11px] mt-0.5 text-gray-600 dark:text-gray-300">Move</span>
            </button>
            <button
              className="flex flex-col items-center justify-center py-2 border-r border-gray-100 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
              onClick={handleTemplateClick}
              disabled={taskCount === 0}
            >
              <Icon icon="fluent:save-28-regular" className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-[11px] mt-0.5 text-gray-600 dark:text-gray-300">Save</span>
            </button>
            <button
              className="flex flex-col items-center justify-center py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/50"
              onClick={handleDeleteClick}
              disabled={taskCount === 0}
            >
              <Icon icon="fluent:delete-16-regular" className="w-4 h-4 text-red-500 dark:text-red-400" />
              <span className="text-[11px] mt-0.5 text-red-500 dark:text-red-400">Delete</span>
            </button>
          </div>
        </div>

        {/* Desktop view - unchanged */}
        <div className="hidden md:flex items-center md:space-x-3">
          <div className="bg-appbg text-black-500 dark:text-white rounded-tl rounded-bl px-3 py-2 md:px-4 md:py-3 text-[14px] font-semibold">
            {taskCount}
          </div>
          <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{taskCount > 1 ? "Tasks selected" : "Task selected"}</span>
        </div>
        <div className="hidden md:flex gap-1.5 items-center w-auto justify-evenly text-sm">
          <button
            className="flex items-center material-icons flex-col justify-center border-0 p-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            onClick={handleCopyClick}
            disabled={taskCount === 0}
          >
            <Icon icon="uil:copy" className="w-5 h-5" />
            <span className="text-xs">{isCopy ? "Copied" : "Copy"}</span>
          </button>
          <button
            className="flex items-center material-icons flex-col justify-center border-0 p-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            onClick={handleExportClick}
            disabled={taskCount === 0}
          >
            <Icon icon="icon-park-outline:excel" className="w-5 h-5" />
            <span className="text-xs">Export</span>
          </button>
          <button
            className="flex items-center material-icons flex-col justify-center p-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            onClick={handleUpdateClick}
            disabled={taskCount === 0}
          >
            <Icon icon="fluent:edit-16-regular" className="w-5 h-5" />
            <span className="text-xs">Update</span>
          </button>
          <button
            className="flex items-center material-icons flex-col justify-center p-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            onClick={handleSectionMoveClick}
            disabled={taskCount === 0 || !sections || sections.length === 0}
          >
            <Icon icon="fluent:arrow-move-20-regular" className="w-5 h-5" />
            <span className="text-xs">Move To Section</span>
          </button>
          <button
            className="flex items-center material-icons flex-col justify-center p-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            onClick={handleTemplateClick}
            disabled={taskCount === 0}
          >
            <Icon icon="fluent:save-28-regular" className="w-5 h-5" />
            <span className="text-xs">Save Template</span>
          </button>
          <button
            className="flex items-center material-icons flex-col justify-center p-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:text-red-600 dark:hover:text-red-400"
            onClick={handleDeleteClick}
            disabled={taskCount === 0}
          >
            <Icon icon="fluent:delete-16-regular" className="w-5 h-5" />
            <span className="text-xs">Delete</span>
          </button>
          <div
            onClick={handleCloseClick}
            className="bg-appbg-600 text-appbg cursor-pointer rounded-tr rounded-br p-1.5 md:p-3 text-[14px] border-l close-bottomBar hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon icon="material-symbols-light:close" className="m-0 p-0 w-5 h-5" />
          </div>
        </div>
      </div>

      {modalIsOpen === "delete" && (
        <DeleteTaskPopUp
          showModal={true}
          onClose={closeModal}
          handleDelete={handleDeleteConfirm}
          loading={bulkLoading}
          taskCount={taskCount}
          selectedTasks={normalizedSelectedTasks}
        />
      )}

      {modalIsOpen === "update" && (
        <BulkUpdateModal
          showModal={true}
          onClose={closeModal}
          handleBulkUpdate={handleBulkUpdateWithRefresh}
          loading={bulkLoading}
          projects={projects}
          users={users}
          taskPositions={(() => {

            return taskStatuses;
          })()}
          selectedTasks={normalizedSelectedTasks}
          hideProjectSelect={hideProjectSelect}
          currentProjectId={currentProjectId}
          onAddProjectClick={() => setShowAddProjectModal(true)}
        />
      )}

      {modalIsOpen === "sectionMove" && (
        <SectionMoveModal
          showModal={true}
          onClose={closeModal}
          handleSectionMove={handleSectionMoveWithRefresh}
          loading={bulkLoading}
          sections={sections}
          selectedTasks={normalizedSelectedTasks}
        />
      )}

      {/* Template Modal */}
      <Modal
        title="Create Template"
        labelclassName=""
        activeModal={modalIsOpen === "template"}
        onClose={closeModal}
        centered
      >
        <div>
          <label className="block mb-1 md:mb-2 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Template Name <span className="text-red-500">*</span></label>
          <Textinput placeholder="Template name" type="text" name="templateName" value={templateName} onChange={(e) => setTemplateName(e.target.value)} error={showError} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveTemplate(); } }} />
          <div className="flex justify-center mt-8">
            <button className="bg-electricBlue-100 hover:bg-electricBlue-100/80 text-white px-8 py-2 rounded-md" onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Project Modal */}
      <AddProject
        showAddProjectModal={showAddProjectModal}
        setShowAddProjectModal={setShowAddProjectModal}
        projects={reduxProjects}
        setProjects={(updatedProjects) => {
          // Refetch projects to ensure consistency
          dispatch(fetchProjects());
        }}
      />
    </div>
  );
};

export default BottomBar;