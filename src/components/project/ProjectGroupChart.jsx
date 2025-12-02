import React from "react";
import Icon from "@/components/ui/Icon";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const ProjectGroupChart = ({ total_task, completed_task, total_hour, bugdet, projectId }) => {
    const navigate = useNavigate(); // Initialize navigate 
    
   
    
    const handleNavigation = (path) => {
        navigate(path);
    };

    const statistics = [
        {
            title: "Total Task",
            count: Number(total_task) || 0,
            bg: "bg-info-500",
            text: "text-info-500",
            icon: "heroicons-outline:menu-alt-1",
            onClick: () => handleNavigation(`/tasks?projectId=${projectId}`), // Navigate to task page
        },
        {
            title: "Completed",
            count: Number(completed_task) || 0,
            bg: "bg-warning-500",
            text: "text-warning-500",
            icon: "heroicons-outline:chart-pie",
            onClick: () => handleNavigation(`/tasks?projectId=${projectId}&taskStatus=completed`), // Navigate to completed tasks
        },
        {
            title: "Hours",
            count: Number(total_hour) || 0,
            bg: "bg-primary-500",
            text: "text-primary-500",
            icon: "heroicons-outline:clock",
            onClick: () => handleNavigation(`/timesheet-reports?projectId=${projectId}`), // Navigate to timesheet reports
        },
        {
            title: "Budget",
            count: `${Number(bugdet) || 0}`,
            bg: "bg-success-500",
            text: "text-success-500",
            icon: "heroicons-outline:calculator",
            onClick: null, // No click action for Budget
        },
    ];

    return (
        <>
            {statistics.map((item, i) => (
                <div
                    key={i}
                    className={`${item.bg} rounded-md p-4 bg-opacity-[0.15] dark:bg-opacity-50 text-center cursor-pointer`}
                    onClick={item.onClick ? item.onClick : null} // Add onClick only if item has onClick defined
                    style={item.onClick ? { cursor: 'pointer' } : { cursor: 'default' }} // Show pointer cursor for clickable items
                >
                    <div
                        className={`${item.text} mx-auto h-10 w-10 flex flex-col items-center justify-center rounded-full bg-white text-2xl mb-4`}
                    >
                        <Icon icon={item.icon} />
                    </div>
                    <span className="block text-sm text-slate-600 font-medium dark:text-white mb-1">
                        {item.title}
                    </span>
                    <span className="block text-2xl text-slate-900 dark:text-white font-medium">
                        {isNaN(item.count) ? '0' : item.count}
                    </span>
                </div>
            ))}
        </>
    );
};

export default ProjectGroupChart;
