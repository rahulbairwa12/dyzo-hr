import React from "react";
const ReportOverview = ({ reportData, loading, dataLoading }) => {

    const statistics = [
        {
            title: "Total Time",
            report: reportData?.totalTimeSpent,
            bg: "bg-[#E5F9FF] dark:bg-slate-900	",
        },
        {
            title: "Manual Time",
            report: reportData?.totalManualTimeSpent,
            bg: "bg-[#FFEDE5] dark:bg-slate-900	",
        },
        {
            title: "Total Tasks",
            report: reportData?.totalTasks,
            bg: "bg-[#EAE5FF] dark:bg-slate-900	",
        },
        {
            title: "Task Completed",
            report: reportData?.totalCompletedTasks,
            bg: "bg-[#E5FFE7] dark:bg-slate-900	",
        },
    ];
    return(
        <div className="grid xl:grid-cols-4 md:grid-cols-4 grid-cols-1 gap-5 my-4">
            {statistics.map((item, i) => (
                <div className={`py-[18px] px-4 rounded-[6px] shadow-md border border-slate-300 dark:border-slate-700  ${item.bg}`} key={i}>
                    <div className="flex items-center space-x-6 rtl:space-x-reverse">
                        <div className="flex-1">
                            <div className="text-slate-800 dark:text-slate-300 text-sm mb-1 font-medium">
                                {item.title}
                            </div>
                            {(loading ||dataLoading) ? "Loading..." :
                                <div className="text-slate-900 dark:text-white text-lg font-medium">
                                    {item.report}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            ))} 
        </div>
    )
};

export default ReportOverview;