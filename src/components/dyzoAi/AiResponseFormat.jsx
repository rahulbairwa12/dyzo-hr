import React from 'react';
import DOMPurify from 'dompurify';
import UserMention from '../ui/UserMention';
import { useNavigate } from 'react-router-dom';
import { Icon } from "@iconify/react";

const AiResponseFormat = ({ rawHtml, className = "", message = null }) => {
    try {
        if (message.messageType == "task_list" && message.text) {
            return <TaskListRenderer message={message.text} className={className} />;
        }
    } catch (e) {
        // Not JSON, continue with normal processing
    }

    // Normalize HTML and handle malformed cases
    let html = String(rawHtml).replace(/(data-user-id=['"][0-9]+['"]) *([A-Za-z])/g, "$1>$2");

    const nodes = [];
    let lastIndex = 0;

    // Combined regex to match project-id, user-id, and task-id spans
    const combinedRegex = /<span[^>]*class=['"](project-id|user-id|task-id)['"][^>]*(?:data-project-id=['"](\d+)['"]|data-user-id=['"](\d+)['"]|data-task-id=['"](\d+)['"])[^>]*>(.*?)<\/span>/gi;
    let match;

    while ((match = combinedRegex.exec(html)) !== null) {
        const [full, spanType, projectId, userId, taskId, content] = match;
        const before = html.slice(lastIndex, match.index);

        if (before) {
            // Process the before text for URLs
            nodes.push(...processTextWithUrls(before, `text-${lastIndex}`));
        }

        if (spanType === 'project-id' && projectId) {
            // Extract additional project data from the span attributes
            const statusMatch = full.match(/data-status=['"](\w+)['"]/i);
            const colorMatch = full.match(/data-color=['"](#[a-fA-F0-9]{6})['"]/i);
            const teamCountMatch = full.match(/data-team-count=['"](\d+)['"]/i);

            nodes.push(
                <ProjectMention
                    key={`p-${projectId}-${match.index}`}
                    projectId={projectId}
                    displayName={(content || "").trim()}
                    status={statusMatch ? statusMatch[1] : null}
                    color={colorMatch ? colorMatch[1] : null}
                    teamCount={teamCountMatch ? parseInt(teamCountMatch[1]) : null}
                />
            );
        } else if (spanType === 'user-id' && userId) {
            nodes.push(
                <UserMention
                    key={`u-${userId}-${match.index}`}
                    userId={userId}
                    displayName={(content || "").trim()}
                />
            );
        } else if (spanType === 'task-id' && taskId) {
            nodes.push(
                <TaskMention
                    key={`t-${taskId}-${match.index}`}
                    taskId={taskId}
                    displayName={(content || "").trim()}
                />
            );
        }

        lastIndex = match.index + full.length;
    }

    const rest = html.slice(lastIndex);
    if (rest) {
        // Process the rest text for URLs
        nodes.push(...processTextWithUrls(rest, `text-rest-${lastIndex}`));
    }

    return (
        <div className={className}>
            {nodes}
        </div>
    );
};

// Helper function to process text and convert URLs to clickable links
const processTextWithUrls = (text, keyPrefix) => {
    const nodes = [];
    // Regex to match URLs (http, https, www)
    const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;
    let lastIndex = 0;
    let match;

    const urlMatches = [...text.matchAll(urlRegex)];
    
    if (urlMatches.length === 0) {
        // No URLs found, return sanitized text
        nodes.push(
            <span
                key={keyPrefix}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
            />
        );
        return nodes;
    }

    urlMatches.forEach((match, index) => {
        const url = match[0];
        const matchIndex = match.index;

        // Add text before URL
        if (matchIndex > lastIndex) {
            const beforeText = text.slice(lastIndex, matchIndex);
            nodes.push(
                <span
                    key={`${keyPrefix}-text-${index}`}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(beforeText) }}
                />
            );
        }

        // Add URL as clickable link
        nodes.push(
            <LinkMention
                key={`${keyPrefix}-url-${index}`}
                url={url}
            />
        );

        lastIndex = matchIndex + url.length;
    });

    // Add remaining text after last URL
    if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex);
        nodes.push(
            <span
                key={`${keyPrefix}-text-end`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(remainingText) }}
            />
        );
    }

    return nodes;
};

// Project mention component
const ProjectMention = ({ projectId, displayName, status, color, teamCount }) => {
    const navigate = useNavigate();
    const handleProjectClick = (e) => {
        e.stopPropagation();
        navigate(`/project/${projectId}`)
    };

    return (
        <span
            onClick={handleProjectClick}
            className="inline-flex items-center gap-1 bg-slate-100  px-1 rounded-md text-[13px] text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-200 border border-white"
            title={`Project: ${displayName} (ID: ${projectId})`}
        >
            <div
                className="w-2 h-2 rounded-[2px]"
                style={{ backgroundColor: color || '#3b82f6' }}
            />
            <span>
                {displayName}
            </span>
        </span>
    );
};

// Task List Renderer Component
const TaskListRenderer = ({ message, className = "" }) => {
    const navigate = useNavigate();

    // Parse the message to extract task list
    const parseTaskList = (htmlString) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // Extract title (text before ul)
        const titleMatch = htmlString.match(/<b>(.*?)<\/b>/);
        const title = titleMatch ? titleMatch[1] : "Tasks";

        // Extract tasks from ul
        const taskItems = doc.querySelectorAll('ul.task-list li');
        const tasks = Array.from(taskItems).map(li => {
            return {
                taskId: li.getAttribute('data-task-id'),
                status: li.getAttribute('data-status'),
                projectName: li.getAttribute('data-project-name'),
                dueDate: li.getAttribute('data-due-date'),
                priority: li.getAttribute('data-priority'),
                text: li.textContent.trim()
            };
        });

        // Extract summary (text after ul)
        const summaryMatch = htmlString.match(/Total: (.*?)$/m);
        const summary = summaryMatch ? summaryMatch[1] : "";

        return { title, tasks, summary };
    };

    const { title, tasks, summary } = parseTaskList(message);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-green-500" />;
            default:
                return <Icon icon="ph:check-circle-light" className="w-4 h-4 text-gray-400" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'text-red-500';
            case 'medium':
                return 'text-yellow-500';
            case 'low':
                return 'text-green-500';
            default:
                return 'text-gray-500';
        }
    };

    const formatDueDate = (dueDate) => {
        if (dueDate === 'No due date') return 'No due date';
        try {
            const date = new Date(dueDate);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dueDate;
        }
    };

    const handleTaskClick = (taskId) => {
        navigate(`/tasks/?taskId=${taskId}`);
    };

    return (
        <div className={`${className} space-y-4`}>
            {/* Title */}
            <div className="text-lg font-semibold text-gray-800 dark:text-white">
                {title}
            </div>

            {/* Task List */}
            <div className="space-y-2">
                {tasks.map((task, index) => (
                    <div
                        key={task.taskId || index}
                        onClick={() => task.taskId && handleTaskClick(task.taskId)}
                        className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer ${task.taskId ? 'cursor-pointer' : 'cursor-default'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            {/* Status Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                                {getStatusIcon(task.status)}
                            </div>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {task.text}
                                    </span>
                                    {task.priority && (
                                        <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                            {task.priority.toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Task Details */}
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    {task.projectName && (
                                        <span className="flex items-center gap-1">
                                            <Icon icon="mdi:folder-outline" className="w-3 h-3" />
                                            {task.projectName}
                                        </span>
                                    )}
                                    {task.dueDate && (
                                        <span className="flex items-center gap-1">
                                            <Icon icon="mdi:calendar" className="w-3 h-3" />
                                            {formatDueDate(task.dueDate)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            {summary && (
                <div className="text-sm text-gray-500 dark:text-gray-400 border-t pt-3">
                    {summary}
                </div>
            )}
        </div>
    );
};

// Task Mention component
const TaskMention = ({ taskId, displayName }) => {
    const navigate = useNavigate();
    const handleTaskClick = (e) => {
        e.stopPropagation();
        navigate(`/tasks?taskId=${taskId}`);
    };
    return (
        <span
            onClick={handleTaskClick}
            className="bg-slate-100 p-0.5 px-1 rounded-md text-[13px] text-purple-500 hover:text-purple-700 cursor-pointer transition-colors duration-200 border border-white"
            title={`Task: ${displayName} (ID: ${taskId})`}
        >
            {displayName}
        </span>
    );
};

// Link Mention component - for clickable URLs
const LinkMention = ({ url }) => {
    const handleLinkClick = (e) => {
        e.stopPropagation();
        // Ensure URL has protocol
        let fullUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            fullUrl = 'https://' + url;
        }
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <span
            onClick={handleLinkClick}
            className="inline-flex items-center gap-1  px-1 rounded-md text-[13px] text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-200 border border-white underline"
            title={`Open link: ${url}`}
        >
            <Icon icon="mdi:link-variant" className="w-3 h-3" />
            <span>{url}</span>
        </span>
    );
};

export default AiResponseFormat;