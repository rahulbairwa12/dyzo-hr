// TaskOnboarding.jsx
import React, { useState, useEffect, useRef } from 'react';
import dyzoLogo from '../../assets/images/landing_page/dyzonamelogo.png';
import Textinput from '../ui/Textinput';
import { useForm } from "react-hook-form";
import { fetchPOST, fetchAuthPost } from '../../store/api/apiSlice';
import { useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

const TaskOnboarding = ({ stepSize, setStepSize }) => {
    const [loading, setLoading] = useState(false);
    const userInfo = useSelector((state) => state.auth.user);
    const project = JSON.parse(localStorage.getItem('project'));
    const { project_id, project_name } = project || {};
    const [tasksCreated, setTasksCreated] = useState([]);
    const navigate = useNavigate();

    const { register, handleSubmit, reset, watch, setValue } = useForm();

    // Ref for auto-focusing the first task field
    const taskOneRef = useRef(null);

    // States for typing animation for taskNameOne
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [animationDone, setAnimationDone] = useState(false);

    const fullText = 'Schedule a Meeting with my team';
    const typingSpeed = 100; // Typing speed in ms
    const deletingSpeed = 50; // Deleting speed in ms
    const pauseAfterTyping = 1000; // Pause before deleting in ms

    // Auto-Typing Effect for taskNameOne
    useEffect(() => {
        if (animationDone) return;

        if (!isDeleting && displayText === fullText) {
            // Pause before starting to delete
            const timeout = setTimeout(() => setIsDeleting(true), pauseAfterTyping);
            return () => clearTimeout(timeout);
        }

        if (isDeleting && displayText === '') {
            setAnimationDone(true);
            return;
        }

        const timeout = setTimeout(() => {
            setDisplayText(prev => isDeleting ? prev.slice(0, -1) : prev + fullText.charAt(prev.length));
        }, isDeleting ? deletingSpeed : typingSpeed);

        return () => clearTimeout(timeout);
    }, [displayText, isDeleting, animationDone, deletingSpeed, typingSpeed, fullText, pauseAfterTyping]);

    // Update taskNameOne in the form when displayText changes (only during animation)
    useEffect(() => {
        if (!animationDone) {
            setValue('taskNameOne', displayText);
        }
    }, [displayText, animationDone, setValue]);

    // Auto-Focus on taskNameOne using useEffect and useRef (Alternative Method)
    useEffect(() => {
        if (taskOneRef.current) {
            taskOneRef.current.focus();
        }
    }, []);

    // Optionally, respect user's motion preferences to disable animations
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            setDisplayText(fullText);
            setValue('taskNameOne', fullText);
            setAnimationDone(true);
        }
    }, [fullText, setValue]);

    // Handle form submission
    const onSubmit = async (data) => {
        try {
            // Prepare an array of tasks based on user input
            const tasks = [];

            if (data.taskNameOne && data.taskNameOne.trim() !== '') {
                tasks.push({ taskName: data.taskNameOne.trim(), projectId: project_id, userId: userInfo._id });
            }
            if (data.taskNameTwo && data.taskNameTwo.trim() !== '') {
                tasks.push({ taskName: data.taskNameTwo.trim(), projectId: project_id, userId: userInfo._id });
            }
            if (data.taskNameThree && data.taskNameThree.trim() !== '') {
                tasks.push({ taskName: data.taskNameThree.trim(), projectId: project_id, userId: userInfo._id });
            }

            if (tasks.length === 0) {
                // No tasks to create, proceed to next step or handle accordingly
                setStepSize(stepSize + 1);
                navigate("/"); // or any other action
                return;
            }

            setLoading(true);

            // Build payload for bulk create
            const bulkPayload = tasks.map((t) => ({
                taskName: t.taskName,
                description: t.description ?? "",
                userId: userInfo._id,
                projectId: project_id,
                assigned_users: [userInfo._id],
            }));

            // Call bulk create endpoint
            const result = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/api/bulk-create-tasks/${userInfo._id}/`, {
                body: { tasks: bulkPayload },
            });

            // Normalize created tasks from response
            let created = [];
            if (Array.isArray(result)) created = result;
            else if (Array.isArray(result?.data)) created = result.data;
            else if (Array.isArray(result?.tasks)) created = result.tasks;

            if (created.length > 0) {
                setStepSize(prev => prev + 1);

                // Store all created tasks in localStorage
                const existingTasks = JSON.parse(localStorage.getItem('tasks')) || [];
                const newTasks = created.map(task => ({
                    id: task.id || task.taskId,
                    name: task.taskName || task.name,
                    project_name: project_name
                }));
                localStorage.setItem('tasks', JSON.stringify([...existingTasks, ...newTasks]));

                // Optionally, update the component state to reflect created tasks
                setTasksCreated(prev => [...prev, ...newTasks]);
            }

            reset();
        } catch (error) {
            console.error('Unable to create task', error);
            // Optionally, display an error message to the user
        } finally {
            setLoading(false);
        }
    };

    // Watch task inputs to display them in the UI
    const taskOne = watch('taskNameOne');
    const taskTwo = watch('taskNameTwo');
    const taskThree = watch('taskNameThree');

    return (
        <div className="p-8 dark:bg-white">
            <div>
                <img src={dyzoLogo} alt="Dyzo logo" className="rounded-full" />
            </div>

            <div className="flex flex-col-reverse lg:grid lg:grid-cols-[0.3fr_0.7fr] gap-5 px-4 mt-8">
                <div>
                    <p className="my-4 text-xl leading-7 font-medium text-[#1e1f21] mb-12 dark:text-black-500">
                        What are a few tasks that you have to do <br /> for {project_name}?
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-4">
                        {/* Task 1 with Auto-Typing and Auto-Focus */}
                        <Textinput
                            type="text"
                            placeholder="Task 1"
                            name="taskNameOne"
                            className={`w-full p-2 border border-gray-300 rounded dark:border-gray-300 dark:bg-white dark:text-black-500 text-lg`}
                            register={register}
                            onChange={(e) => {
                                // If user manually types, stop the auto-typing animation
                                if (!animationDone) {
                                    setAnimationDone(true);
                                }
                            }}
                            value={taskOne || ''}
                            ref={taskOneRef} // Ref for auto-focus
                            autoComplete="off"
                            autoFocus // Auto-focus using the autoFocus attribute
                        />

                        {/* Task 2 */}
                        <Textinput
                            type="text"
                            placeholder="Task 2"
                            name="taskNameTwo"
                            className={`w-full p-2 border border-gray-300 rounded dark:border-gray-300 dark:bg-white dark:text-black-500 text-lg`}
                            register={register}
                            onChange={() => { /* Handle changes if necessary */ }}
                            value={taskTwo || ''}
                            autoComplete="off"
                        />

                        {/* Task 3 */}
                        <Textinput
                            type="text"
                            placeholder="Task 3"
                            name="taskNameThree"
                            className={`w-full p-2 border border-gray-300 rounded dark:border-gray-300 dark:bg-white dark:text-black-500 text-lg`}
                            register={register}
                            onChange={() => { /* Handle changes if necessary */ }}
                            value={taskThree || ''}
                            autoComplete="off"
                        />

                        <button
                            type="submit"
                            className="bg-black-500 text-white px-4 py-2 rounded hover:bg-black-600 transition-colors flex items-center justify-center"
                            disabled={loading}>
                            {loading ? <Icon icon="tabler:circle" className='w-5 h-5 m-auto animate-spin' /> : 'Next'}
                        </button>
                    </form>

                    <div className='text-center'>
                        <button
                            className="text-blue-600 px-1 py-1 mt-3 underline text-sm rounded hover:text-blue-700 transition-colors"
                            onClick={() => { navigate(`/tasks?userId=${userInfo._id}`) }}>
                            Skip
                        </button>
                    </div>
                </div>

                <div className="border-t-8 border-gray-300 rounded-lg overflow-hidden">
                    <div className="w-full h-8 bg-gray-300 flex items-center px-4 space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center mb-4 gap-7">
                            <div className="bg-teal-200 p-4 rounded">
                                <Icon icon="gravity-ui:dots-9" className="w-8 h-8 text-white" />
                            </div>

                            <h1 className="ml-4 text-2xl font-bold dark:text-black-500">{project_name}</h1>
                        </div>

                        <ul className="space-y-6">
                            {/* Task 1 Display */}
                            <li className="flex items-center space-y-2 dark:text-black-600">
                                <Icon icon="gg:check-o" className="w-10 h-10 mr-3" />
                                <div className="ml-2 w-full text-gray-700 text-lg">
                                    {taskOne ? (
                                        <span>{taskOne}</span>
                                    ) : (
                                        <div className="w-full h-8 bg-gray-200 rounded animate-pulse"></div>
                                    )}
                                </div>
                            </li>

                            {/* Task 2 Display */}
                            <li className="flex items-center space-y-2 dark:text-black-600">
                                <Icon icon="gg:check-o" className="w-10 h-10 mr-3" />
                                <div className="ml-2 w-full text-gray-700 text-lg">
                                    {taskTwo ? (
                                        <span>{taskTwo}</span>
                                    ) : (
                                        <div className="w-full h-8 bg-gray-200 rounded animate-pulse"></div>
                                    )}
                                </div>
                            </li>

                            {/* Task 3 Display */}
                            <li className="flex items-center space-y-2 dark:text-black-600">
                                <Icon icon="gg:check-o" className="w-10 h-10 mr-3" />
                                <div className="ml-2 w-full text-gray-700 text-lg">
                                    {taskThree ? (
                                        <span>{taskThree}</span>
                                    ) : (
                                        <div className="w-full h-8 bg-gray-200 rounded animate-pulse"></div>
                                    )}
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskOnboarding;
