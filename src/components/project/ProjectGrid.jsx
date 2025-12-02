import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import { Menu } from "@headlessui/react";
import Icon from "@/components/ui/Icon";
import ProgressBar from "@/components/ui/ProgressBar";
import { useNavigate } from "react-router-dom";
import { DateWithMonthName } from "@/helper/DateFormatWithMonthName";
import { intialLetterName } from "@/helper/helper";
import { calculateNumberOfDays } from "@/helper/helper";
import { ProfilePicture } from '@/components/ui/profilePicture';
import ModernTooltip from '@/components/ui/ModernTooltip';

const ProjectGrid = ({ project, setShowEditProjectModal, setShowDeleteProjectModal, setProjectId, setData , userInfo ,
  isFavouriteProject , isHiddenProject , toggleHideProject
 }) => {
  const { name, assignee, des, dateAdded, dueDate, total_tasks, completed_tasks, assignee_details, in_progress_tasks } = project;
  const navigate = useNavigate();

  const [totaldays, setTotaldays] = useState(0);

  useEffect(() => {
    const diffDays = calculateNumberOfDays(new Date(), new Date(dueDate));
    setTotaldays(diffDays);
  }, [dueDate]);

  const getProgress = (completedTasks, totalTasks) => {
    if (totalTasks === 0) {
      return 0;
    }
    return ((completedTasks / totalTasks) * 100)?.toFixed(2);
  };

  const progress = getProgress(completed_tasks, total_tasks);
  const completedPercentage = total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0;
  const inProgressPercentage = total_tasks > 0 ? Math.round(((in_progress_tasks || 0) / total_tasks) * 100) : 0;
  const totalProgress = completedPercentage + inProgressPercentage;

  const handleMembersClick = (e, projectId) => {
    e.stopPropagation(); // Prevent triggering the project card click
    navigate(`/project/${projectId}?tab=members`);
  };

  return (
    <Card>
      <div className='cursor-pointer' onClick={() => navigate(`/project/${project._id}`)}>
        <header className="flex justify-between items-end">
          <div className="flex space-x-4 items-center rtl:space-x-reverse">
            <div className="flex-none">
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center"
                style={{ backgroundColor: project?.projectColor || "#CBD5E1" }}
                title="Project color"
              />
            </div>
            <div className="font-medium text-base leading-6 flex items-center gap-2">
              <div className="dark:text-slate-200 text-slate-900 max-w-[160px] truncate">
                {name}
              </div>
              {/* {isFavouriteProject && (
                <Icon
                  icon="heroicons:star-16-solid"
                  className="w-4 h-4 text-favStar-100"
                  title="Favourite Project"
                />
              )} */}
            </div>
          </div>
          <div onClick={(event) => event.stopPropagation()}>
            <Dropdown
              classMenuItems="w-[220px]"
              label={
                <span className="text-lg inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-500-f7 dark:bg-slate-900 dark:text-slate-400">
                  <Icon icon="heroicons-outline:dots-vertical" />
                </span>
              }
            >
              <div>
                <Menu.Item>
                  <div
                    className="hover:bg-slate-900 dark:hover:bg-slate-600 dark:hover:bg-opacity-70 hover:text-white w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm dark:text-slate-300 last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse"
                    onClick={(e) => { e.stopPropagation(); navigate(`/project/${project._id}`); }}
                  >
                    <span className="text-base">
                      <Icon icon="majesticons:open" />
                    </span>
                    <span>Open</span>
                  </div>
                </Menu.Item>
                <Menu.Item>
                  <div
                    className="hover:bg-slate-900 dark:hover:bg-slate-600 dark:hover:bg-opacity-70 hover:text-white w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm dark:text-slate-300 last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse"
                    onClick={(event) => { event.stopPropagation(); setShowEditProjectModal(true); setProjectId(project._id); setData(project); }}
                  >
                    <span className="text-base">
                      <Icon icon="heroicons-outline:pencil-alt" />
                    </span>
                    <span>Edit</span>
                  </div>
                </Menu.Item>
                {
                  (project?._id !== Number(userInfo?.default_project_id) && project?._id !== userInfo?.default_project) &&
                <Menu.Item>
                  <div
                    className="hover:bg-slate-900 dark:hover:bg-slate-600 dark:hover:bg-opacity-70 hover:text-white w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm dark:text-slate-300 last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse"
                    onClick={(event) => { event.stopPropagation(); setShowDeleteProjectModal(true); setProjectId(project._id); }}
                  >
                    <span className="text-base">
                      <Icon icon="heroicons-outline:trash" />
                    </span>
                    <span>Delete</span>
                  </div>
                </Menu.Item>
                }
                {
                  isHiddenProject ? 
                  <Menu.Item>
                    <div
                      className="hover:bg-slate-900 dark:hover:bg-slate-600 dark:hover:bg-opacity-70 hover:text-white w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm dark:text-slate-300 last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse"
                      onClick={(event) => { event.stopPropagation(); toggleHideProject(project?._id)}}
                    >
                      <span className="text-base">
                        <Icon icon="bx:show" />
                      </span>
                      <span>Show on Dashboard</span>
                    </div>
                  </Menu.Item>
                  :
                  <Menu.Item>
                    <div
                      className="hover:bg-slate-900 dark:hover:bg-slate-600 dark:hover:bg-opacity-70 hover:text-white w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm dark:text-slate-300 last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse"
                      onClick={(event) => { event.stopPropagation(); toggleHideProject(project?._id)}}
                    >
                      <span className="text-base">
                        <Icon icon="bx:hide" />
                      </span>
                      <span>Hide from Dashboard</span>
                    </div>
                  </Menu.Item>
                }
              </div>
            </Dropdown>
          </div>
        </header>

        <div className="text-slate-600 dark:text-slate-400 text-sm pt-4 pb-8">
          {des}
        </div>

        <div className="flex space-x-4 rtl:space-x-reverse mt-5">
          <div>
            <span className="block date-label">Start date</span>
            <span className="block date-text">{DateWithMonthName(dateAdded)}</span>
          </div>
          <div>
            <span className="block date-label">Due date</span>
            <span className="block date-text">{DateWithMonthName(dueDate)}</span>
          </div>
        </div>

        {total_tasks === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Ready to get started
          </div>
        ) : (
          <div className="h-3 py-1 bg-gray-200 dark:bg-slate-700 rounded-lg w-full relative mt-2">
            {/* Completed tasks segment */}
            {completedPercentage > 0 && (
              <ModernTooltip
                content={`Completed: ${completedPercentage}%`}
                theme="custom-light"
                placement="top"
              >
                <div
                  className={`bg-electricBlue-50/80 h-3 absolute top-0 left-0 ${inProgressPercentage > 0 ? 'rounded-l-lg' : 'rounded-lg'} flex items-center justify-center cursor-pointer`}
                  style={{ width: `${completedPercentage}%`, transition: 'width 0.3s' }}
                >
                  {completedPercentage > 8 && (
                    <span className="text-white text-[10px] font-semibold">{completedPercentage}%</span>
                  )}
                </div>
              </ModernTooltip>
            )}
            {/* In-progress tasks segment */}
            {inProgressPercentage > 0 && (
              <ModernTooltip
                content={`In Progress: ${inProgressPercentage}%`}
                theme="custom-light"
                placement="top"
              >
                <div
                  className={`bg-electricBlue-50/50 h-3 absolute top-0 ${completedPercentage > 0 ? 'rounded-r-lg' : 'rounded-lg'} flex items-center justify-center cursor-pointer`}
                  style={{ left: `${completedPercentage}%`, width: `${inProgressPercentage}%`, transition: 'width 0.3s, left 0.3s' }}
                >
                  {inProgressPercentage > 8 && (
                    <span className="text-white text-[10px] font-semibold">{inProgressPercentage}%</span>
                  )}
                </div>
              </ModernTooltip>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <div className="text-slate-400 dark:text-slate-400 text-sm font-normal mb-3">
              Assigned to
            </div>
            <ModernTooltip
              content={
                <div className="flex flex-col gap-2 max-w-[250px]">
                  <span className="text-sm font-semibold mb-1">Assigned to ({assignee_details?.length}):</span>
                  {assignee_details?.map((user, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <ProfilePicture
                        user={user}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.name || "Unknown User"}
                      </span>
                    </div>
                  ))}
                </div>
              }
              theme="custom-light"
              placement="top"
            >
              <div className="flex justify-start -space-x-1.5 rtl:space-x-reverse cursor-pointer" 
              onClick={(e) => handleMembersClick(e, project._id)} >
                {assignee_details?.slice(0, 3).map((user, userIndex) => (
                  <div key={userIndex} className="h-6 w-6 rounded-full ring-1 ring-slate-100 transition-all">
                    <ProfilePicture 
                      user={user}
                      className="w-full h-full rounded-full"
                    />
                  </div>
                ))}
                {assignee_details?.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-300 text-xs ring-2 ring-slate-100 dark:ring-slate-700 flex items-center justify-center transition-all">
                    +{assignee_details?.length - 3}
                  </div>
                )}
              </div>
            </ModernTooltip>
          </div>

          <div className="ltr:text-right rtl:text-left">
            <span className={`inline-flex items-center space-x-1 text-xs font-normal px-2 py-1 rounded-full rtl:space-x-reverse ${totaldays >= 0 ? 'bg-success-500 text-success-500 bg-opacity-[0.16] ' : ' bg-opacity-[0.16]  bg-danger-500 text-danger-500'}`}>
              <span>
                <Icon icon="heroicons-outline:clock" />
              </span>
              <span>{totaldays}</span>
              <span>days {totaldays >= 0 ? 'left' : 'overdue'}</span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectGrid;
