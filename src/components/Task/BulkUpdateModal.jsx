import React, { useState, useRef, useEffect } from "react";
import Select from "react-select";
import { Icon } from "@iconify/react";
import { TASK_STATUSES } from "../../utils/taskStatusStyles";

const BulkUpdateModal = ({
  showModal,
  onClose,
  handleBulkUpdate,
  loading,
  projects,
  users,
  taskStatuses, // If provided, this should be an array of objects like:
  // [{ status: 'pending', color: '#3490dc', label: "Pending" }, ...]
}) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal, onClose]);

  const onSubmit = () => {
    // Build the update payload object. Only include fields that have been chosen.
    const updateData = {};
    if (selectedProject) updateData.projectId = selectedProject.value;
    if (selectedUser) updateData.userId = selectedUser.value;
    if (selectedTaskStatus)
      updateData.taskPosition = selectedTaskStatus.value;
    if (selectedPriority)
      updateData.priority = selectedPriority.value;

    handleBulkUpdate(updateData);
    onClose(); // Close the modal immediately after submitting
  };

  if (!showModal) return null;

  // Map projects and users to react-select options
  const projectOptions = projects?.map((proj) => ({
    value: proj._id,
    label: proj.name,
  }));
  const userOptions = users?.map((user) => ({
    value: user._id,
    label: user.name,
  }));

  // Use the standardized task statuses from our utility
  const taskStatusList = taskStatuses && taskStatuses.length > 0 ? taskStatuses : TASK_STATUSES;

  const taskStatusOptions = taskStatusList.map((pos) => ({
    value: pos.status,
    label: pos.label,
  }));

  // Custom styles for the task status dropdown
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? state.data.color : 'white',
      color: state.isSelected ? 'white' : 'black',
      '&:hover': {
        backgroundColor: state.data.color,
        color: 'white',
      },
    }),
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm z-50">
      <div ref={modalRef} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-96 max-w-[90%] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          aria-label="Close modal"
        >
          <Icon icon="material-symbols:close" className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white pr-8">Update Multiple Tasks</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Project</label>
          <Select
            instanceId="projectId"
            className="basic-single text-sm"
            classNamePrefix="select"
            options={projectOptions}
            value={selectedProject}
            onChange={(option) => setSelectedProject(option)}
            name="projectId"
            styles={{
              control: (base) => ({
                ...base,
                border: "1px solid #ccc",
                boxShadow: "none",
                "&:hover": { borderColor: "#666" },
                height: "40px",
                minHeight: "40px",
                backgroundColor: "white",
              }),
            }}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Assignee</label>
          <Select
            instanceId="userId"
            className="basic-single text-sm"
            classNamePrefix="select"
            options={userOptions}
            value={selectedUser}
            onChange={(option) => setSelectedUser(option)}
            name="userId"
            styles={{
              control: (base) => ({
                ...base,
                border: "1px solid #ccc",
                boxShadow: "none",
                "&:hover": { borderColor: "#666" },
                height: "40px",
                minHeight: "40px",
                backgroundColor: "white",
              }),
            }}
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Task Status</label>
          <Select
            instanceId="taskStatus"
            className="basic-single text-sm"
            classNamePrefix="select"
            options={taskStatusOptions}
            value={selectedTaskStatus}
            onChange={(option) => setSelectedTaskStatus(option)}
            name="taskStatus"
            styles={customStyles}
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Tasks"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUpdateModal;
