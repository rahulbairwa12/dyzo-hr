import React from "react";
import Icon from "@/components/ui/Icon";


const GroupChart4 = ({total_task, completed_task, total_hour, bugdet}) => {

  const statistics = [
    {
      title: "Total Task",
      count: Number(total_task),
      bg: "bg-info-500",
      text: "text-info-500",
      icon: "heroicons-outline:menu-alt-1",
    },

    {
      title: "Completed ",
      count: Number(completed_task),
      bg: "bg-warning-500",
      text: "text-warning-500",
    
      icon: "heroicons-outline:chart-pie",
    },
    {
      title: "Hours",
      count: total_hour,
      bg: "bg-primary-500",
      text: "text-primary-500",
      icon: "heroicons-outline:clock",
    },
    {
      title: "Budget",
      count: `${Number(bugdet)}`,
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
