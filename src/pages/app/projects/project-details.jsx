import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import GroupChart4 from "@/components/partials/widget/chart/group-chart-4";
import DonutChart from "@/components/partials/widget/chart/donut-chart";
import TaskLists from "@/components/partials/widget/task-list";
import TeamTable from "@/components/partials/Table/team-table";
import { DateWithMonthName } from "../../../helper/DateFormatWithMonthName";
import { fetchAuthGET } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import ProjectNotesWidget from "@/components/project/ProjectNotesWidget";

const ProjectDetailsPage = () => {
  // const { state } = useLocation()
  const { projectId } = useParams()
  const [project, setProject] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProjectDetail = async () => {
      try {
        setLoading(true);
        const { data } = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/projects/detail/${projectId}/`);
        if (data) {
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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-12 gap-5">
        <div className="xl:col-span-8 lg:col-span-7 col-span-12">
          <Card title="Project Details" className="h-full">
            {loading ? (
              <div className="animate-pulse p-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md mb-4 w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md mb-4 w-1/2"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3"></div>
              </div>
            ) : (
              <div className="p-4">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  {project.name || 'Project Name'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  {project.description || 'No description available'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Project Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Client:</span>
                        <span className="text-xs text-slate-900 dark:text-white">{project.client_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Start Date:</span>
                        <span className="text-xs text-slate-900 dark:text-white">{project.dateAdded ? DateWithMonthName(project.dateAdded) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Due Date:</span>
                        <span className="text-xs text-warning-500">{project.dueDate ? DateWithMonthName(project.dueDate) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                        <span className="text-xs text-slate-900 dark:text-white">{project.status || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Project Links</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Icon icon="heroicons:link" className="text-primary-500 mr-2" />
                        <a 
                          href={project.liveServerURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary-500 hover:underline"
                        >
                          {project.liveServerURL || 'No live server URL'}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <Icon icon="heroicons:link" className="text-primary-500 mr-2" />
                        <a 
                          href={project.stagingServerURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary-500 hover:underline"
                        >
                          {project.stagingServerURL || 'No staging server URL'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-md p-3">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Project Progress</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {project.complete_task || 0} of {project.total_tasks || 0} tasks completed
                    </span>
                    <span className="text-xs font-medium text-primary-500">
                      {project.total_tasks ? Math.round((project.complete_task / project.total_tasks) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div 
                      className="bg-primary-500 h-1.5 rounded-full" 
                      style={{ width: `${project.total_tasks ? Math.round((project.complete_task / project.total_tasks) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
        
        <div className="xl:col-span-4 lg:col-span-5 col-span-12">
          <ProjectNotesWidget projectId={projectId} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12">
          <TaskLists title='Project Tasks' projectId={projectId} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12">
          <Card title="Team Members" noborder>
            <TeamTable projectId={projectId} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
