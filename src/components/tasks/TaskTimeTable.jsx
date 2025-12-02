import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileCardWrapper from '@/components/ui/ProfileCardWrapper';
import { ProfilePicture } from '../ui/profilePicture';
import { useSelector } from "react-redux"

const getInitials = (fullName) => {
    if (!fullName) return '';
    const parts = String(fullName).trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || '').join('');
};

const formatTimeHM = (time) => {
    const safe = typeof time === 'string' ? time : '00:00';
    const [h, m] = safe.split(':');
    const hh = String(h || '0').padStart(2, '0');
    const mm = String(m || '0').padStart(2, '0');
    return `${hh}H ${mm}M`;
};

const TaskTimeTable = ({ rows = [], messageText = '' }) => {
    const navigate = useNavigate();
    const userInfo = useSelector((state) => state.auth.user);

    return (
        <>
            <div dangerouslySetInnerHTML={{ __html: messageText }}></div>       
            <div className="w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 mt-2">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {rows.map((row, idx) => {
                        const initials = getInitials(row.assignee_name);        
                        const goToTask = () => navigate(`/tasks?userId=${userInfo._id}&taskId=${row.task_id}`)
                        return (
                            <div
                                key={row.task_id || idx}
                                className="grid grid-cols-12 items-center px-4 py-4 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40"
                                onClick={goToTask}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') goToTask() }}
                            >
                                <div className="col-span-9">
                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-1">
                                        {row.task_name}
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-1">
                                        <span className="w-fit text-xs border bg-customPurple-50 border-neutral-50 rounded font-medium px-2 py-0.5 text-slate-700 dark:text-slate-100 mr-1">
                                            {row.project_name}
                                        </span>
                                        <span className="w-fit text-xs border bg-customPurple-200 border-customPurple-300 rounded font-semibold px-2 py-0.5 text-purple-800 dark:text-purple-100 mt-1 sm:mt-0">
                                            {row.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </span>
                                    </div>
                                </div>

                                <div className="col-span-1">
                                    <ProfileCardWrapper userId={row.assignee_id}>
                                        <ProfilePicture userId={row.assignee_id} className="h-7 w-7 rounded-full object-cover" />
                                    </ProfileCardWrapper>
                                </div>

                                <div className="col-span-2 text-right text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {formatTimeHM(row.time_spent)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default TaskTimeTable;


