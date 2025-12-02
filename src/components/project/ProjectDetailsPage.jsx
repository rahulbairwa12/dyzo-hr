import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import TaskLists from "@/components/partials/widget/task-list";
import TeamTable from "@/components/partials/Table/team-table";
import { DateWithMonthName } from "@/helper/DateFormatWithMonthName";
import ProjectScreenShot from "./ProjectScreenShot";
import { fetchAuthGET } from "@/store/api/apiSlice";
import { toast } from 'react-toastify'
import { useParams } from "react-router-dom";
import LoaderCircle from "../Loader-circle";
import ProjectGroupChart from "./ProjectGroupChart";
import ProjectNotesWidget from "@/components/project/ProjectNotesWidget";
import EditProject from "./EditProject";
import Button from "../ui/Button";

const ProjectDetailsPage = () => {
  const { projectId } = useParams()
  const [project, setProject] = useState({})
  const [loading, setLoading] = useState(false)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Helper function to get completed tasks count
  const getCompletedTasks = (projectData) => {
    if (!projectData) return 0;

    // Try all possible property names
    const possibleProps = [
      'completed_tasks',
      'complete_task',
      'completed_task',
      'completed',
      'completedTasks',
      'completedTask',
      'completeTask',
      'complete_tasks',
      'done_tasks',
      'done_task',
      'finished_tasks',
      'finished_task'
    ];

    for (const prop of possibleProps) {
      if (projectData[prop] !== undefined && projectData[prop] !== null) {
        return projectData[prop];
      }
    }

    // Check for nested properties
    const nestedProps = ['tasks', 'stats', 'statistics', 'summary', 'details', 'info'];
    for (const parentProp of nestedProps) {
      if (projectData[parentProp]) {
        for (const childProp of possibleProps) {
          if (projectData[parentProp][childProp] !== undefined && projectData[parentProp][childProp] !== null) {
            return projectData[parentProp][childProp];
          }
        }
      }
    }

    // If we can't find a specific property, try to calculate it from total and incomplete
    if (projectData.total_tasks !== undefined && projectData.incomplete_tasks !== undefined) {
      const calculated = projectData.total_tasks - projectData.incomplete_tasks;
      return calculated;
    }

    // Check if there's a completion percentage and total tasks
    const percentageProps = ['completion_percentage', 'percent_complete', 'progress', 'completion'];
    for (const prop of percentageProps) {
      if (projectData[prop] !== undefined && projectData[prop] !== null && projectData.total_tasks) {
        const percentage = parseFloat(projectData[prop]);
        if (!isNaN(percentage)) {
          const calculated = Math.round((percentage / 100) * projectData.total_tasks);
          return calculated;
        }
      }
    }

    // Check if there's a 'tasks' array and count completed tasks
    if (Array.isArray(projectData.tasks)) {
      const completedCount = projectData.tasks.filter(task =>
        task.status === 'completed' ||
        task.status === 'done' ||
        task.completed === true ||
        task.is_completed === true
      ).length;

      if (completedCount > 0) {
        return completedCount;
      }
    }

    // Check if there's a task_stats object
    if (projectData.task_stats) {
      const statsProps = ['completed', 'done', 'finished', 'complete'];
      for (const prop of statsProps) {
        if (projectData.task_stats[prop] !== undefined && projectData.task_stats[prop] !== null) {
          return projectData.task_stats[prop];
        }
      }
    }

    // As a last resort, if we have total_tasks, assume at least 1 is completed
    if (projectData.total_tasks && projectData.total_tasks > 0) {
      return 1;
    }

    return 0;
  };

  useEffect(() => {
    const fetchProjectDetail = async () => {
      try {
        setLoading(true);
        const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/projects/detail/${projectId}/`);
        if (data) {
          const completedTasks = getCompletedTasks(data);
          setProject(data);
        }
      } catch (error) {
        toast.error('Failed to fetch project');
        console.error('Failed to fetch project', error);
      } finally {
        setLoading(false)
      }
    }

    fetchProjectDetail()
  }, [projectId])

  // Helper function to truncate long URLs
  const formatUrl = (url) => {
    if (!url || url.length === 0) return "";
    
    // For very small screens, show just the domain
    if (isMobile) {
      try {
        const domain = new URL(url).hostname;
        return domain;
      } catch (e) {
        return url.length > 20 ? url.substring(0, 20) + '...' : url;
      }
    }
    
    return url;
  };

  // Show loader while fetching project data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <LoaderCircle />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid grid-cols-12 gap-4 md:gap-5">
        {/* Left column - Project details */}
        <div className="xl:col-span-8 lg:col-span-7 col-span-12">
          <Card className="h-full">
            <div className="grid md:grid-cols-2 grid-cols-1 gap-3 md:gap-4">
              <ProjectGroupChart
                total_task={project?.total_tasks}
                completed_task={getCompletedTasks(project)}
                total_hour={project?.total_hours}
                bugdet={project?.budget}
                currency={project?.currencyType}
                projectId={projectId}
              />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-3 md:p-4 mt-3 md:mt-4">
              <span className="block dark:text-slate-400 text-xs md:text-sm text-slate-600 font-medium">
                Progress
              </span>
              <div className="flex items-center justify-between mb-1.5 md:mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {getCompletedTasks(project)} of {project?.total_tasks || 0} tasks completed
                </span>
                <span className="text-xs font-medium text-primary-500">
                  {(() => {
                    try {
                      // Make sure both values are valid numbers with explicit conversion
                      const completedTasks = parseInt(getCompletedTasks(project));
                      const totalTasks = parseInt(project?.total_tasks || 0);

                      // Prevent division by zero
                      if (totalTasks === 0) return "0%";

                      // Calculate percentage and handle NaN
                      const percentage = Math.round((completedTasks / totalTasks) * 100);
                      return isNaN(percentage) ? "0%" : `${percentage}%`;
                    } catch (error) {
                      console.error("Error calculating percentage:", error);
                      return "0%";
                    }
                  })()}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full"
                  style={{
                    width: (() => {
                      try {
                        // Make sure both values are valid numbers with explicit conversion
                        const completedTasks = parseInt(getCompletedTasks(project));
                        const totalTasks = parseInt(project?.total_tasks || 0);

                        // Prevent division by zero
                        if (totalTasks === 0) return "0%";

                        // Calculate percentage and handle NaN
                        const percentage = Math.round((completedTasks / totalTasks) * 100);
                        return isNaN(percentage) ? "0%" : `${percentage}%`;
                      } catch (error) {
                        console.error("Error calculating percentage for progress bar:", error);
                        return "0%";
                      }
                    })()
                  }}
                ></div>
              </div>
            </div>

            <div className="mt-4 md:mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 md:mb-4">
                <h3 className="font-semibold text-base text-slate-900 dark:text-slate-300">About project</h3>
                {showEditProjectModal && <EditProject
                  showEditProjectModal={showEditProjectModal}
                  setShowEditProjectModal={setShowEditProjectModal}
                  projectId={project?._id}
                  data={project}
                  setSelectedProject={setProject}
                />}
                <Button
                  icon="nimbus:edit"
                  text="Edit Details"
                  className="btn-dark dark:bg-slate-800 h-min text-xs md:text-sm font-normal w-fit"
                  iconClass="text-base md:text-lg"
                  onClick={() => setShowEditProjectModal(true)}
                />
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mb-4 md:mb-6">
                {(project?.description?.length > 0) ? project?.description : "No description"}
              </p>

              <div className="flex flex-wrap">
                <div className="w-full md:w-auto md:mr-8 mr-4 mb-3 space-y-1">
                  <div className="font-semibold text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Live Server Url
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-normal text-primary-600 dark:text-slate-300 rtl:space-x-reverse overflow-hidden">
                    <Icon icon="heroicons:link" className="flex-shrink-0" />
                    {
                      (project?.liveServerURL?.length > 0) ? (
                        <Link 
                          to={`${project?.liveServerURL}`} 
                          className="truncate hover:underline" 
                          target="_blank"
                          title={project?.liveServerURL}
                        >
                          {formatUrl(project?.liveServerURL)}
                        </Link>
                      ) : (
                        <p className="text-slate-400 dark:text-slate-500">No Live Server Url</p>
                      )
                    }
                  </div>
                </div>
                <div className="w-full md:w-auto md:mr-8 mr-4 mb-3 space-y-1">
                  <div className="font-semibold text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Staging Server Url
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-normal text-primary-600 dark:text-slate-300 rtl:space-x-reverse overflow-hidden">
                    <Icon icon="heroicons:link" className="flex-shrink-0" />
                    {
                      (project?.stagingServerURL?.length > 0) ? (
                        <Link 
                          to={`${project?.stagingServerURL}`} 
                          className="truncate hover:underline" 
                          target="_blank"
                          title={project?.stagingServerURL}
                        >
                          {formatUrl(project?.stagingServerURL)}
                        </Link>
                      ) : (
                        <p className="text-slate-400 dark:text-slate-500">No Staging Server Url</p>
                      )
                    }
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-700 rounded px-3 md:px-4 pt-3 md:pt-4 pb-1 grid grid-cols-2 md:flex md:flex-wrap md:justify-between mt-3 md:mt-6 gap-x-2">
                <div className="mb-3 space-y-1 md:space-y-2 md:mr-3">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Project owner
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                    {project?.client_name || "N/A"}
                  </div>
                </div>
                <div className="mb-3 space-y-1 md:space-y-2 md:mr-3">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Project Leader
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                    {project?.project_leader ? project?.project_leader : "No Project Leader"}
                  </div>
                </div>
                <div className="mb-3 space-y-1 md:space-y-2 md:mr-3">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Start date
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {DateWithMonthName(project?.dateAdded)}
                  </div>
                </div>
                <div className="mb-3 space-y-1 md:space-y-2 md:mr-3">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Deadline
                  </div>
                  <div className="text-xs text-warning-500">{DateWithMonthName(project?.dueDate)}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column - Project Notes Widget */}
        <div className="xl:col-span-4 lg:col-span-5 col-span-12">
          <ProjectNotesWidget projectId={projectId} />
        </div>
      </div>

      <div>
        <TaskLists title='Task List' projectId={projectId} />
      </div>

      <div>
        <div className="xl:col-span-8 lg:col-span-7 col-span-12">
          <Card title="Team members" noborder>
            <TeamTable projectId={projectId} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
