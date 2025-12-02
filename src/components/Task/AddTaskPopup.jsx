import React, { useState, useEffect, useRef } from 'react';
import AddTaskModal from './AddTaskModal';
import { fetchAuthFilePost } from '@/store/api/apiSlice';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import useWidth from '@/hooks/useWidth';

const AddTaskPopUp = ({ showModal, setShowModal, projectId }) => {
    const [taskName, setTaskName] = useState('');
    const [tasks, setTasks] = useState([]);
    const textareaRef = useRef(null);
    const userInfo = useSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const location = useLocation();
    const { width, breakpoints } = useWidth();

    // Extract projectId from URL if we're on a project details page
    const getProjectIdFromUrl = () => {
        const pathParts = location.pathname.split('/');
        if (pathParts.includes('project-details')) {
            const projectIdIndex = pathParts.indexOf('project-details') + 1;
            if (projectIdIndex < pathParts.length) {
                return pathParts[projectIdIndex];
            }
        }
        return null;
    };

    const handleAddTask = async () => {
        if (!taskName.trim()) return;

        let payload = new FormData();
        payload.append("taskName", taskName);
        payload.append("description", "");
        payload.append("dueDate", moment(new Date()).format("YYYY-MM-DDTHH:mm"));

        // If user is a client, use their ID as both userId and clientId
        if (userInfo.user_type === "client") {
            payload.append("userId", userInfo._id); // This is the client ID
            payload.append("clientId", userInfo._id); // Explicitly set client ID
        } else {
            // For non-client roles (employees), use the user ID as before
            payload.append("userId", userInfo._id);
        }
        
        // Use the projectId prop if provided, or extract from URL, or fallback to user default
        const urlProjectId = getProjectIdFromUrl();
        const effectiveProjectId = projectId || urlProjectId || userInfo.default_project;
        payload.append("projectId", effectiveProjectId);

        payload.append("collaborators", userInfo._id);

        let response;
        // Use client-specific API endpoint for client users
        if (userInfo.user_type === "client") {
            // Use the client-specific API endpoint
            response = await fetchAuthFilePost(
                `${import.meta.env.VITE_APP_DJANGO}/create-task/${userInfo._id}/`,
                { body: payload }
            );
        } else {
            // Use the standard API endpoint for non-client users
            response = await fetchAuthFilePost(
                `${import.meta.env.VITE_APP_DJANGO}/create-task/${userInfo._id}/`,
                { body: payload }
            );
        }

        if (response.status === 1) {
            const newTask = {
                _id: response.taskId || response?.data?._id,
                taskId: response.taskId || response?.data?._id,
                assigned_users: response?.assigned_users,
                taskName,
                userId: userInfo._id,
                projectId: effectiveProjectId,
                taskPosition: "Not Started Yet",
                dueDate: moment(new Date()).format("YYYY-MM-DDTHH:mm"),
                created_at: new Date().toISOString(),
            };
            // Local list (not used globally)
            setTasks([...tasks, newTask]);
            setTaskName('');
            handleCloseModal();

            // Notify other parts of the app (e.g., Dashboard MyTasks) without navigation
            try {
                window.dispatchEvent(new CustomEvent('global-task-created', { detail: { task: newTask } }));
            } catch (_) {}

            // If on project details page specifically, keep legacy behavior to refresh local project lists
            if (urlProjectId) {
                window.location.reload();
            }
        }
    };

    const handleEnterKey = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTask();
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setTaskName('');
        setTasks([]);
    };

    const handleTaskNameChange = (e) => {
        const newName = e.target.value;
        setTaskName(newName);
        // Auto-resize logic
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [taskName]);

    return (
        <AddTaskModal title="Add Task" activeModal={showModal} onClose={handleCloseModal} className='p-0 max-w-[800px]'>
            <div className='mt-4 px-6 pb-8'>
                <textarea
                    ref={textareaRef}
                    className="form-control py-2 w-full border rounded-md text-gray-700 dark:text-white dark:bg-gray-900 dark:border-gray-700 resize-none overflow-hidden"
                    value={taskName}
                    onChange={handleTaskNameChange}
                    onKeyDown={handleEnterKey}
                    placeholder={width >= breakpoints.md ? "Add task and hit enter" : "Enter task name"}
                    autoFocus
                    rows={1}
                    style={{ backgroundColor: 'inherit' }}
                />
                <div className='flex justify-end md:hidden'>
                    <Button text="Add" className="btn btn-sm btn-dark mt-4 "
                    onClick={()=>handleAddTask()}
                    />
                </div>
            </div>
        </AddTaskModal>
    );
};

export default AddTaskPopUp;
