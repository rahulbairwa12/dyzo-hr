import React from "react";

const LeaveCard = ({ tabData, onCardClick, selectedStatus }) => {
  const { counts = {} } = tabData;
  const statistics = [
    {
      title: "All Leaves",
      count: counts.totalLeave || 0,
      bg: "bg-[#E5F9FF] dark:bg-slate-900",
      status: "All Leaves",
    },
    {
      title: "Pending Requests",
      count: counts.pendingCount || 0,
      bg: "bg-[#FFEDE5] dark:bg-slate-900",
      status: "Pending Requests",
    },
    {
      title: "Approved Leaves",
      count: counts.approvedCount || 0,
      bg: "bg-[#EAE5FF] dark:bg-slate-900",
      status: "Approved Leaves",
    },
    {
      title: "Rejected Leaves",
      count: counts.declinedCount || 0,
      bg: "bg-[#FFE5E5] dark:bg-slate-900",
      status: "Rejected Leaves",
    },
  ];

  return (
    <>
      {statistics.map((item, i) => (
        <div
          key={i}
          className={`py-[18px] px-4 rounded-[6px] ${item.bg} ${selectedStatus === item.status ? 'border-2 border-blue-500' : ''} ${item.count === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          onClick={() => item.count !== 0 && onCardClick(item.status)}
        >
          <div className="flex items-center space-x-6 rtl:space-x-reverse">
            <div className="flex-1">
              <div className="text-slate-800 dark:text-slate-300 text-sm mb-1 font-medium">
                {item.title}
              </div>
              <div className="text-slate-900 dark:text-white text-lg font-medium">
                {item.count}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default LeaveCard;
