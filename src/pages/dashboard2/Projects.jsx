import Button from '@/components/ui/Button';
import { ProfilePicture } from '@/components/ui/profilePicture';
import { fetchAuthGET, fetchAuthPatch } from '@/store/api/apiSlice';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { enforceSubscriptionLimit } from '@/store/planSlice';
import { useNavigate } from 'react-router-dom';
import ModernTooltip from '@/components/ui/ModernTooltip';
import Modal from '@/components/ui/Modal';
import Icon from '@/components/ui/Icon';
import AddProject from '@/components/Projects/AddProject';
import { update } from '@/store/api/auth/authSlice';
import { toast } from 'react-toastify';

const ProjectCardSkeleton = () => (
  <div className="mb-5 rounded-lg p-3 border-2 border-neutral-50 dark:border-slate-700 bg-white dark:bg-slate-700 animate-pulse">
    <div className="flex justify-between items-center mb-2">
      <div className="h-4 w-32 bg-gray-200 dark:bg-slate-600 rounded"></div>
      <div className="h-4 w-24 bg-gray-200 dark:bg-slate-600 rounded"></div>
    </div>
    <div className="h-3 w-20 bg-gray-200 dark:bg-slate-600 rounded mb-3"></div>
    <div className="grid grid-cols-2 items-center">
      <div className="h-2.5 bg-gray-200 dark:bg-slate-600 rounded-lg w-full mt-6"></div>
      <div className="flex items-center ml-auto gap-2">
        <div className="h-7 w-7 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
        <div className="h-7 w-7 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
        <div className="h-7 w-7 bg-gray-200 dark:bg-slate-600 rounded-full"></div>
      </div>
    </div>
  </div>
);
const Projects = ({ projectsData, projectLoading }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const userInfo = useSelector((state) => state.auth.user);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const dispatch = useDispatch();
  const favouriteIds = userInfo?.fav_projects || [];
  // Use projectsData if available, otherwise use projects state
  const displayProjects = projectsData || projects;

  // Filter projects based on search query
  const filteredProjects = displayProjects.filter(project =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter hidden projects
  const sortedProjects = filteredProjects?.filter((project) => !userInfo?.hidden_projects?.includes(project?._id))

  const fetchProjects = async (page = 1, append = false, newProject = null) => {
    try {
      setLoading(true);
      // If a new project is passed, prepend it to the list and filter out any duplicate by _id
      if (newProject) {
        setProjects(prev => {
          // Agar _id already exist karta hai, to purana array hi return karo
          if (prev.some(project => project._id === newProject._id)) {
            return prev;
          }
          // Nahi to naya project top pe add karo
          return [newProject, ...prev];
        });
        setLoading(false);
        return;
      }
      const response = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/project/company/${userInfo.companyId}/${userInfo._id}/?page=${page}&page_size=20`, false);

      if (response?.results?.projects) {
        const newProjects = response.results.projects;

        if (append) {
          setProjects(prev => [...prev, ...newProjects.filter(np => !prev.some(p => p._id === np._id))]);
        } else {
          setProjects(newProjects);
        }

        setNextPage(response.next ? page + 1 : null);
        setHasMore(!!response.next);
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

    // Load more when user scrolls to bottom (with 50px threshold)
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      if (nextPage) {
        fetchProjects(nextPage, true);
      }
    }
  }, [loading, hasMore, nextPage]);

  useEffect(() => {
    // Only fetch projects if projectsData is not provided
    if (!projectsData) {
      fetchProjects();
    }
  }, [projectsData]);

  useEffect(() => {
    // Only add scroll listener if using internal projects state (not projectsData)
    if (!projectsData) {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
      }
    }
  }, [handleScroll, projectsData]);

  // Calculate progress percentage
  const calculateProgress = (totalTasks, completedTasks) => {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle project click
  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}?tab=tasks`);
  };

  const toggleHideProject = async (projectId) => {
    if (!projectId || !userInfo?._id) return;
    const isHidden = userInfo?.hidden_projects?.includes(projectId);
    try {
      const updatedHiddenProjects = isHidden
        ? userInfo?.hidden_projects.filter((id) => id !== projectId) // remove
        : [...(userInfo?.hidden_projects || []), projectId];         // add

      // Call employee PATCH API
      const response = await fetchAuthPatch(
        `${import.meta.env.VITE_APP_DJANGO}/employee/${userInfo._id}/`,
        { body: { hidden_projects: updatedHiddenProjects } }
      );

      if (response?.status) {
        // Update redux auth.user
        dispatch(update({
          ...userInfo,
          hidden_projects: updatedHiddenProjects
        }));

        toast.success(
          isHidden ? "Shown on Dashboard" : "Hidden from Dashboard"
        );
      } else {
        toast.error("Failed to update");
      }
    } catch (error) {
      console.error("Favourite update error:", error);
    }
  }
  const handleMembersClick = (e, projectId) => {
    e.stopPropagation(); // Prevent triggering the project card click
    navigate(`/project/${projectId}?tab=members`);
  };

  // Permission check helper
  const canAddProject = true; // in future change to userInfo?.isAdmin === true || userInfo?.isSuperAdmin === true || userInfo?.team_leader === true

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-neutral-50 p-5 pr-1 min-h-[508px] overflow-hidden dark:border-slate-700 dark:border">
      <div className="flex md:flex-row flex-col md:justify-between md:items-center mb-4 md:pr-6 pr-2 gap-3">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-xl text-customBlack-50 dark:text-customWhite-50">Projects</span>
          </div>
          <div className="flex md:hidden items-center space-x-2">
            {!projectsData && (
              <button
                name="refresh"
                title="Refresh"
                className={`text-[#a78bfa] transition-transform duration-200 text-2xl ${loading ? 'animate-spin cursor-not-allowed opacity-50' : ''}`}
                onClick={() => fetchProjects(1)}
                disabled={loading}
              >
                <Icon icon="icons8:refresh" width="24" height="24" />
              </button>
            )}
            <Button
              icon="heroicons-outline:plus"
              text="Add Project"
              className="bg-white dark:bg-electricBlue-50 dark:border-slate-700 dark:border text-electricBlue-100 dark:text-white py-1.5 px-3 rounded-md flex items-center border-2 border-solid border-neutral-50  mt-0"
              iconClass="font-bold text-lg mr-1"
              onClick={() => {
                if (!canAddProject) {
                  setShowPermissionModal(true);
                  return;
                }
                const allowed = dispatch(enforceSubscriptionLimit());
                if (!allowed) return;
                setShowAddProjectModal(true);
              }}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-neutral-50 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-customBlack-50 dark:text-customWhite-50 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-electricBlue-50 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            )}
          </div>
          <div className="hidden md:flex items-center space-x-2">
            {!projectsData && (
              <button
                name="refresh"
                title="Refresh"
                className={`text-[#a78bfa] transition-transform duration-200 text-2xl ${loading ? 'animate-spin cursor-not-allowed opacity-50' : ''}`}
                onClick={() => fetchProjects(1)}
                disabled={loading}
              >
                <Icon icon="icons8:refresh" width="24" height="24" />
              </button>
            )}
            <Button
              icon="heroicons-outline:plus"
              text="Add Project"
              className="bg-white dark:bg-electricBlue-50 dark:border-slate-700 dark:border text-electricBlue-100 dark:text-white py-1.5 px-3 rounded-md flex items-center border-2 border-solid border-neutral-50  mt-0"
              iconClass="font-bold text-lg mr-1"
              onClick={() => {
                if (!canAddProject) {
                  setShowPermissionModal(true);
                  return;
                }
                const allowed = dispatch(enforceSubscriptionLimit());
                if (!allowed) return;
                setShowAddProjectModal(true);
              }}
            />
          </div>
        </div>
      </div>
      {/* AddProject Modal */}
      <AddProject
        showAddProjectModal={showAddProjectModal}
        setShowAddProjectModal={setShowAddProjectModal}
        projects={projects}
        setProjects={setProjects}
      />
      {/* Permission Warning Modal */}
      <Modal
        activeModal={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        title="Permission Denied"
        centered
        className='max-w-md'
        icon="fluent-color:warning-20"
      >
        <div className="text-center text-customRed-50 font-semibold text-lg mb-2">You do not have permission to add a project.</div>
        <div className="text-center text-customGray-300 text-sm">Please contact your Team Leader or Admin for access.</div>
        <div className="flex justify-center mt-6">
          <Button text="Close" onClick={() => setShowPermissionModal(false)} className="btn btn-dark bg-customRed-50 text-white" />
        </div>
      </Modal>
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto max-h-[428px] pr-2 bg-white dark:bg-slate-800"
      >
        {loading && displayProjects.length === 0 && (
          <>
            {[...Array(3)].map((_, idx) => (
              <ProjectCardSkeleton key={idx} />
            ))}
          </>
        )}

        {sortedProjects?.map((project, i) => {
          const progress = calculateProgress(project.total_tasks, project.completed_tasks);
          const completedPercentage = project.total_tasks > 0 ? Math.round((project.completed_tasks / project.total_tasks) * 100) : 0;
          const inProgressPercentage = project.total_tasks > 0 ? Math.round(((project.in_progress_tasks || 0) / project.total_tasks) * 100) : 0;
          const totalProgress = completedPercentage + inProgressPercentage;
          const startDate = formatDate(project.dateAdded);
          const assignedCount = project.assignee_details?.length || 0;
          const isFavouriteProject = userInfo?.fav_projects?.includes(project?._id);

          return (
            <div
              key={project._id}
              className="mb-5 rounded-lg p-3 border-2 border-neutral-50  cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 dark:border dark:border-slate-700 transition-colors duration-200 bg-white dark:bg-slate-800"
              onClick={() => handleProjectClick(project._id)}
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <span className="font-semibold md:text-base text-sm text-customBlack-50 dark:text-customWhite-50 flex items-start gap-2">{project.name}
                  {/* {isFavouriteProject && (
                    <Icon
                      icon="heroicons:star-16-solid"
                      className="min-w-[16px] w-4 h-4 text-favStar-100 mt-1"
                      title="Favourite Project"
                    />
                  )} */}
                </span>
                <div className="flex items-start gap-2">
                  <span className="md:text-base text-sm font-medium text-customBlack-100 dark:text-customGray-150 ">Start Date: {startDate}</span>
                  <ModernTooltip
                    content="Hide from dashboard"
                    theme="custom-light"
                  >
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleHideProject(project?._id);
                      }}
                      className="hover:bg-gray-200 p-1 rounded-md inline-block cursor-pointer"
                    >
                      <Icon icon="bx:hide" />
                    </div>
                  </ModernTooltip>
                </div>
              </div>
              <div className="grid grid-cols-2 items-center ">
                {project.total_tasks === 0 ?
                  <div>
                    <span className="text-sm text-neutral-300 dark:text-customGray-150">Ready to get started</span>
                  </div>
                  :
                  <div className="h-3 py-1 bg-gray-200 dark:bg-slate-700 rounded-lg w-full relative mt-2">
                    {/* Completed tasks segment (green) */}
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
                    {/* In-progress tasks segment (blue) - stacked after completed */}
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
                  </div>}
                <div className="flex items-center ml-auto">
                  <span className={`text-sm text-neutral-300 dark:text-customGray-150 ${project.assignee_details.length > 0 ? 'hidden md:inline' : ''}`}>{project.assignee_details.length > 0 ? 'Members:' : 'No members'}</span>
                  <ModernTooltip
                    content={
                      project.assignee_details && project.assignee_details.length > 0
                        ? (
                          <div>
                            {project.assignee_details.map((u, idx) => {
                              const name = u.name || u.fullName || u.email || "No Name";
                              const capitalized = name.replace(/\b\w/g, c => c.toUpperCase());
                              return (
                                <div key={idx} className="flex items-center gap-2 mb-1">
                                  <ProfilePicture user={u} className="w-7 h-7 rounded-full border-2 dark:border-slate-700 dark:border border-white object-cover" />
                                  <span className="dark:text-white font-normal">{capitalized}</span>
                                </div>
                              );
                            })}
                          </div>
                        )
                        : "No members"
                    }
                    theme="custom-light"
                  >
                    <div
                      className="flex -space-x-2 ml-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => handleMembersClick(e, project._id)}
                      title="Click to view project members"
                    >
                      {project.assignee_details?.slice(0, 3).map((user, idx) => (
                        <ProfilePicture key={idx} user={user} className="w-7 h-7 rounded-full border-2 dark:border-slate-700 dark:border border-white object-cover" />
                      ))}
                      {project.assignee_details?.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 border-2 dark:border-slate-700 dark:border border-white flex items-center justify-center text-xs text-gray-700 dark:text-customWhite-50 font-semibold">
                          +{project.assignee_details.length - 3}
                        </div>
                      )}
                    </div>
                  </ModernTooltip>
                </div>
              </div>
            </div>
          );
        })}

        {loading && displayProjects.length > 0 && !projectsData && (
          <div className="text-center py-4">
            <>
              {[...Array(1)].map((_, idx) => (
                <ProjectCardSkeleton key={idx} />
              ))}
            </>
          </div>
        )}

        {!hasMore && displayProjects.length > 0 && !projectsData && (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-customGray-150">
            No more projects to load
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects; 