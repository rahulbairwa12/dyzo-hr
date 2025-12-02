import {React} from 'react'

export const CardInfo = ({performanceData, performanceLoading}) => {
 

    return (
        <div className="profile-info-500 grid grid-cols-2 gap-6 md:gap-0 md:grid-cols-4 md:text-start text-center flex-1 max-w-[516px]">
            
            <div className="flex-1">
                <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                    {performanceLoading ? '...' : performanceData?.total_working_hours}
                </div>
                <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                    Working Hour
                </div>
            </div>

            <div className="flex-1">
                <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                    {performanceLoading ? '...' : performanceData?.total_completed_tasks}
                </div>
                <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                    Total Tasks
                </div>
            </div>

            <div className="flex-1">
                <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                    {performanceLoading ? '...' : performanceData?.total_missed_due_dates}
                </div>
                <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                    Missed Due Date
                </div>
            </div>

            <div className="flex-1">
                <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                    {performanceLoading ? '...' : performanceData?.total_approved_leaves}
                </div>
                <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                    Approved Leaves
                </div>
            </div>


        </div>
    )
}
