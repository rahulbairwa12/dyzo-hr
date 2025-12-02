import React from "react";
import Icon from "@/components/ui/Icon";

const GroupChart4 = ({ taskStatusCounts }) => {
  const statistics = [
    {
      title: "Total Task",
      count: taskStatusCounts?.total_tasks || 0,
      bg: "bg-info-500",
      text: "text-info-500",
      icon: "heroicons-outline:menu-alt-1",
    },
    {
      title: "Pending After Due",
      count: taskStatusCounts?.pending_after_due || 0,
      bg: "bg-warning-500",
      text: "text-warning-500",
      icon: "heroicons-outline:chart-pie",
    },
    {
      title: "Not Completed Before Due",
      count: taskStatusCounts?.not_completed_before_due || 0,
      bg: "bg-primary-500",
      text: "text-primary-500",
      icon: "heroicons-outline:clock",
    },
    {
      title: "Completed After Due",
      count: taskStatusCounts?.completed_after_due || 0,
      bg: "bg-success-500",
      text: "text-success-500",
      icon: "heroicons-outline:calculator",
    },
  ];

  return (
    <>
      {statistics.map((item, i) => (
        <div
          key={i}
          className={`${item.bg} rounded-md p-4 bg-opacity-[0.15] dark:bg-opacity-50 text-center`}
        >
          <div
            className={`${item.text} mx-auto h-10 w-10 flex flex-col items-center justify-center rounded-full bg-white text-2xl mb-4 `}
          >
            <Icon icon={item.icon} />
          </div>
          <span className="block text-sm text-slate-600 font-medium dark:text-white mb-1">
            {item.title}
          </span>
          <span className="block mb- text-2xl text-slate-900 dark:text-white font-medium">
            {item.count}
          </span>
        </div>
      ))}
    </>
  );
};

export default GroupChart4;
