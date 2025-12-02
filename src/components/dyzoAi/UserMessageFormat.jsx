import React from 'react';
import DOMPurify from 'dompurify';
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ProfileCardWrapper from "../ui/ProfileCardWrapper";
import { ProfilePicture } from "../ui/profilePicture";
import { Icon } from "@iconify/react";

const UserMessageFormat = ({ rawHtml, className = "" }) => {
    const navigate = useNavigate();
    const { users } = useSelector((state) => state.users);

    if (!rawHtml) return null;

    // Helper function to clean HTML from names for display
    const cleanName = (htmlString) => {
        return htmlString.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '')
    }

    // Normalize HTML and handle malformed cases
    let html = String(rawHtml).replace(/(data-user-id=['"][0-9]+['"]) *([A-Za-z])/g, "$1>$2");

    const nodes = [];
    let lastIndex = 0;

    // Combined regex to match both project-id and user-id spans
    const combinedRegex = /<span[^>]*class=['"](project-id|user-id|task-id|mention-item[^'"]*)['"][^>]*(?:data-project-id=['"](\d+)['"]|data-user-id=['"](\d+)['"]|data-task-id=['"](\d+)['"])[^>]*>([\s\S]*?)<\/span>/gi;
    let match;

    while ((match = combinedRegex.exec(html)) !== null) {
        const [full, spanType, projectId, userId, taskId, content] = match;
        const before = html.slice(lastIndex, match.index);

        if (before) {
            nodes.push(
                <span
                    key={`text-${lastIndex}`}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(before) }}
                />
            );
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
            // Extract additional task data from the span attributes
            const statusMatch = full.match(/data-status=['"](\w+)['"]/i);
            const priorityMatch = full.match(/data-priority=['"](\w+)['"]/i);
            const projectNameMatch = full.match(/data-project-name=['"]([^'"]+)['"]/i);

            nodes.push(
                <TaskMention
                    key={`t-${taskId}-${match.index}`}
                    taskId={taskId}
                    displayName={(content || "").trim()}
                    status={statusMatch ? statusMatch[1] : null}
                    priority={priorityMatch ? priorityMatch[1] : null}
                    projectName={projectNameMatch ? projectNameMatch[1] : null}
                />
            );
        }

        lastIndex = match.index + full.length;
    }

    const rest = html.slice(lastIndex);
    if (rest) {
        nodes.push(
            <span
                key={`text-rest-${lastIndex}`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rest) }}
            />
        );
    }

    return (
        <div className={className}>
            {nodes}
        </div>
    );
};

// User mention component with ProfileCardWrapper
const UserMention = ({ userId, displayName }) => {
    const cleanName = displayName.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '')

    return (
        <ProfileCardWrapper userId={userId}>
            <span className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer transition-colors duration-200">
                <ProfilePicture
                    userId={userId}
                    className="w-4 h-4 rounded-full border border-blue-200"
                />
                <span className="text-blue-700 font-medium text-sm">
                    {cleanName}
                </span>
            </span>
        </ProfileCardWrapper>
    );
};

// Project mention component
const ProjectMention = ({ projectId, displayName, status, color, teamCount }) => {
    const navigate = useNavigate();
    const handleProjectClick = () => {
    
        navigate(`/project/${projectId}`)
    };

    const cleanName = displayName.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '')

    return (
        <span
            onClick={handleProjectClick}
            className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md cursor-pointer transition-colors duration-200"
            title={`Project: ${cleanName} (ID: ${projectId})`}
        >
            <div
                className="w-4 h-4 rounded-[5px] border border-gray-300"
                style={{ backgroundColor: color || '#3b82f6' }}
            />
            <span className="text-green-700 font-medium text-sm">
                {cleanName}
            </span>
            {status && (
                <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                    {status}
                </span>
            )}
            {teamCount && (
                <span className="text-xs text-gray-500">
                    ({teamCount} members)
                </span>
            )}
        </span>
    );
};

// Task mention component
const TaskMention = ({ taskId, displayName, status, priority, projectName }) => {
    const navigate = useNavigate();
    const handleTaskClick = () => {
     
        navigate(`/tasks/?taskId=${taskId}`);
    };

    const cleanName = displayName.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '')

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

    return (
        <span
            onClick={handleTaskClick}
            className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md cursor-pointer transition-colors duration-200"
            title={`Task: ${cleanName} (ID: ${taskId})`}
        >
            {getStatusIcon(status)}
            <span className="text-purple-700 font-medium text-sm">
                {cleanName}
            </span>
            {priority && (
                <span className={`text-xs font-medium ${getPriorityColor(priority)}`}>
                    {priority.toUpperCase()}
                </span>
            )}
            {projectName && (
                <span className="text-xs text-gray-500">
                    in {projectName}
                </span>
            )}
        </span>
    );
};

export default UserMessageFormat;
