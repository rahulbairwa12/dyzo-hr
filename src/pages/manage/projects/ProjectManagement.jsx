import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { enforceSubscriptionLimit } from "@/store/planSlice";
import useWidth from "@/hooks/useWidth";
import { fetchGET, fetchDelete, fetchAuthGET, fetchAuthDeleteWithBody, fetchAuthPatch } from "@/store/api/apiSlice";
import { toast, ToastContainer } from "react-toastify";
import Button from "@/components/ui/Button";
import ProjectGrid from "@/components/project/ProjectGrid";
import ProjectList from "@/components/project/ProjectList";
import AddProject from "@/components/Projects/AddProject";
import EditProjectModal from "@/components/Projects/EditProjectModal";
import Grid from "@/components/skeleton/Grid";
import SkeletionTable from "@/components/skeleton/Table";
import Modal from "@/components/ui/Modal";
import GlobalFilter from "@/pages/table/react-tables/GlobalFilter";
import { TourContext } from "@/components/tourguide/TourConext";
import Datepicker from "react-tailwindcss-datepicker";
import Select from "react-select";
import { formatDate, intialLetterName } from "@/helper/helper";
import { djangoBaseURL } from "@/helper";
import { Icon } from "@iconify/react";
import debounce from "lodash/debounce"
import { ProfilePicture } from '@/components/ui/profilePicture';
import { removeProjectFromList } from "@/store/projectsSlice";
import { update } from "@/store/api/auth/authSlice";

const ProjectHeader = () => {
  // Provide a default value in case the context is undefined
  const { isModalOpen, closeModal } = useContext(TourContext) || {
    isModalOpen: false,
    closeModal: () => { },
  };

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState("");
  const [filler, setfiller] = useState("grid");
  const { width, breakpoints } = useWidth();
  const [isLoaded, setIsLoaded] = useState(true);
  const userInfo = useSelector((state) => state.auth.user);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [data, setData] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteWithTasks, setDeleteWithTasks] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("0");
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState({ start: null, end: null });
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalProjects, setTotalProjects] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const favouriteIds = userInfo?.fav_projects || [];

  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchQuery(query);
    }, 500),
    []
  );
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        if (!userInfo) return;
        const url = `${djangoBaseURL}/employee/list/${userInfo.companyId}/`;
        const { data } = await fetchAuthGET(url);
        if (data) {
          const activeEmployees = data.filter((employee) => employee.isActive);
          setUsers(activeEmployees);
        }
      } catch (error) {
        console.error("Error fetching employee", error);
      }
    };

    fetchEmployee();
  }, []);

  useEffect(() => {
    if (currentUserId == 0) {
      setSelectedDate({ start: null, end: null });
    } else {
      setSelectedDate({
        start: new Date(
          today.getFullYear() - 1,
          today.getMonth(),
          today.getDate()
        ),
        end: today,
      });
    }
  }, [currentUserId]);

  const handleUserChange = (selectedOption) => {
    setPageNo(1)
    setCurrentUserId(selectedOption.value);
  };

  const formatOptionLabel = ({ value, label, image, name }) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div>
        <ProfilePicture
          user={{
            name: name,
            profile_picture: image
          }}
          className="w-[30px] h-[30px] rounded-full mr-2"
        />
      </div>
      <div>{label}</div>
    </div>
  );

  const fetchProjects = async () => {
    try {
      setIsLoaded(true);
      const formatStartDate = formatDate(selectedDate.start);
      const formatEndDate = formatDate(selectedDate.end);
      let url =
        currentUserId == 0 &&
          selectedDate.start == null &&
          selectedDate.end == null
          ? `/project/company/${userInfo.companyId}/${userInfo?._id}/?page=${pageNo}&page_size=${pageSize}&name=${searchQuery}`
          : `/project/company/${userInfo.companyId}/${userInfo?._id}/?start_date=${""}&end_date=${""}&project_leader=${currentUserId}&page=${pageNo}&page_size=${pageSize}&name=${searchQuery}`;

      const { results, count } = await fetchGET(
        `${import.meta.env.VITE_APP_DJANGO}${url}`,
        false
      );

      if (results?.projects) {
        setProjects(results?.projects);
        const sortedProjects = [...results?.projects].sort((a, b) => {
          const aFav = favouriteIds.includes(a._id);
          const bFav = favouriteIds.includes(b._id);

          if (aFav && !bFav) return -1; // a comes before b
          if (!aFav && bFav) return 1;  // b comes before a
          return 0; // keep relative order otherwise
        });
        setFilteredProjects(sortedProjects);
        setTotalProjects(count || 0);
      }
    } catch (error) {
      toast.error("Failed to fetch projects");
    } finally {
      setIsLoaded(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    if(projectId === Number(userInfo?.default_project_id) || projectId === userInfo?.default_project) return;
    setIsDeletingProject(true);
    try {
      const payload = { project_id: projectId, with_task: deleteWithTasks };
      const response = await fetchAuthDeleteWithBody(
        `${import.meta.env.VITE_APP_DJANGO}/api/delete-project-with-condition/`,
        { body: payload }
      );
      if (response?.status) {
        toast.success(response?.message || "Project deleted Successfully.");
        dispatch(removeProjectFromList(projectId));
        setShowDeleteProjectModal(false);
        setProjectId(null);
        fetchProjects();
      } else {
        toast.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Delete project error:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeletingProject(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [filler, selectedDate, currentUserId, pageNo, pageSize, searchQuery,showAddProjectModal]);

  // const handleFilterChange = (filter) => {
  //   setFilter(filter);
  //   if (filter) {
  //     setFilteredProjects(
  //       projects.filter((project) =>
  //         project.name.toLowerCase().includes(filter.toLowerCase())
  //       )
  //     );
  //   } else {
  //     setFilteredProjects(projects);
  //   }
  // };

  const handleFilterChange = (value) => {
    setPageNo(1)
    debouncedSearch(value);
  };

  useEffect(() => {
    if (isModalOpen) {
      setShowAddProjectModal(true);
    } else {
      setShowAddProjectModal(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!showAddProjectModal) {
      closeModal();
    }
  }, [showAddProjectModal]);

  const userOptions = [
    { value: "0", label: "All Employee", name: "All" },
    ...users.map((user) => ({
      value: user._id?.toString(),
      label: user.name,
      image: user.profile_picture,
      name: user.name,
    })),
  ];

  const handleValueChange = (newValue) => {
    const formattedStartDate = newValue.startDate;
    const formattedEndDate = newValue.endDate;
    setSelectedDate({ start: formattedStartDate, end: formattedEndDate });
  };

  const handlePageChange = (newPage) => {
    setPageNo(newPage);
  };

  const pageSizeOptions = [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
  ];

  // Add a handler for page size change
  const handlePageSizeChange = (selectedOption) => {
    setPageSize(selectedOption.value);
    setPageNo(1); // Reset to first page when changing page size
  };

  const toggleHideProject = async (projectId)=>{
    if(!projectId || !userInfo?._id) return;
    
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
      if(response?.status){
        // Update redux auth.user
          dispatch(update({
              ...userInfo,
              hidden_projects: updatedHiddenProjects
          }));

          toast.success(
            isHidden ? "Shown on Dashboard" : "Hidden from Dashboard"
          );
      }
      else {
          toast.error("Failed to update");
      }
    } catch (error) {
      console.error("Favourite update error:", error);
    }
  }

  return (
    <div className="bg-white min-h-screen dark:bg-slate-800 p-4">
      <ToastContainer />
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
          Projects
        </h4>
        <div
          className={`${width < breakpoints.md ? "space-x-3 space-y-3" : ""
            } md:flex md:space-x-4 md:justify-end items-center rtl:space-x-reverse`}
        >
          <Button
            icon="heroicons:list-bullet"
            text={`${width < breakpoints.md ? "" : "List View"}`}
            disabled={isLoaded}
            className={`${filler === "list"
              ? "bg-electricBlue-100 text-white"
              : "bg-white border-2 border-neutral-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              } h-min text-sm font-normal`}
            iconClass=" text-lg"
            onClick={() => setfiller("list")}
          />
          <Button
            icon="heroicons-outline:view-grid"
            text={`${width < breakpoints.md ? "" : "Grid View"}`}
            disabled={isLoaded}
            className={`${filler === "grid"
              ? "bg-electricBlue-100 text-white"
              : "bg-white border-2 border-neutral-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              } h-min text-sm font-normal`}
            iconClass=" text-lg"
            onClick={() => setfiller("grid")}
          />

          {(
              <Button
                icon="heroicons-outline:plus"
                text={`${width < breakpoints.md ? "" : "Add Project"}`}
                className="add-project-btn bg-electricBlue-100 text-white h-min text-sm font-medium"
                iconClass=" text-lg"
                onClick={() => {
                  const allowed = dispatch(enforceSubscriptionLimit());
                  if (!allowed) return;
                  setShowAddProjectModal(true);
                }}
              />
            )}
        </div>
      </div>

      <p
        className="text-xs text-right cursor-pointer"
        onClick={() => {
          setCurrentUserId("0");
          setSelectedDate({ start: null, end: null });
        }}
      >
        Clear Filter
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 m-auto mb-4">
        {/* <GlobalFilter filter={filter} setFilter={handleFilterChange} /> */}
        <div className="relative">
          <input
            type="text"
            className="form-control py-2"
            placeholder="Search projects..."
            onChange={(e) => handleFilterChange(e.target.value)}
          />
        </div>

        <Select
          value={userOptions.find(
            (option) => option.value === currentUserId?.toString()
          )}
          onChange={handleUserChange}
          formatOptionLabel={formatOptionLabel}
          options={userOptions}
          className="rounded-lg capitalize"
          classNamePrefix="select"
          placeholder="Select an employee"
          isSearchable={true}
          noOptionsMessage={() => "No Data"}
        />

        {/* <div className="date-range-custom relative">
          <Datepicker
            inputClassName="input-class"
            value={selectedDate}
            onChange={handleValueChange}
            separator="To"
            placeholder="Select Date Range"
            showShortcuts={true}
            containerClassName="container-class"
          />
        </div> */}
      </div>

      {isLoaded && filler === "grid" && <Grid count={pageSize} />}
      {isLoaded && filler === "list" && <SkeletionTable count={pageSize} />}

      {filler === "grid" &&
        !isLoaded &&
        (filteredProjects?.length > 0 ? (
          <>
            <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
              {filteredProjects.map((project, projectIndex) => (
                <ProjectGrid
                  project={project}
                  key={projectIndex}
                  setShowEditProjectModal={setShowEditProjectModal}
                  setShowDeleteProjectModal={setShowDeleteProjectModal}
                  setProjectId={setProjectId}
                  setData={setData}
                  isFavouriteProject ={userInfo?.fav_projects?.includes(project?._id)}
                  userInfo={userInfo}
                  isHiddenProject = {userInfo?.hidden_projects?.includes(project?._id)}
                  toggleHideProject={toggleHideProject}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-between mt-6">
              <div className="flex flex-wrap items-center justify-center md:justify-normal gap-2 md:gap-5">
                <div className="flex items-center space-x-3 rtl:space-x-reverse text-sm font-medium text-slate-600 dark:text-slate-300">
                  Showing {(pageNo - 1) * pageSize + 1} to{" "}
                  {Math.min(pageNo * pageSize, totalProjects)} of{" "}
                  {totalProjects} projects
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Show
                  </span>
                  <Select
                    value={pageSizeOptions.find(
                      (option) => option.value === pageSize
                    )}
                    onChange={handlePageSizeChange}
                    options={pageSizeOptions}
                    className="w-[90px]"
                    classNamePrefix="select"
                    isSearchable={false}
                  />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    entries
                  </span>
                </div>
              </div>
              <ul className="flex items-center space-x-3 mt-2 md:mt-0">
                <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                  <button
                    className={`${pageNo <= 1 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    onClick={() => handlePageChange(pageNo - 1)}
                    disabled={pageNo <= 1}
                  >
                    <Icon icon="heroicons-outline:chevron-left" />
                  </button>
                </li>
                {[...Array(Math.ceil(totalProjects / pageSize))].map(
                  (_, index) => {
                    const pageNumber = index + 1;
                    // Add logic to show only a limited number of page buttons with ellipsis
                    if (
                      pageNumber === 1 ||
                      pageNumber === Math.ceil(totalProjects / pageSize) ||
                      (pageNumber >= pageNo - 1 && pageNumber <= pageNo + 1)
                    ) {
                      return (
                        <li key={pageNumber}>
                          <button
                            className={`${pageNumber === pageNo
                              ? "bg-blue-500 text-white"
                              : "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-300"
                              } border border-gray-300 dark:border-slate-700 rounded h-min text-sm font-normal px-3 py-1`}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        </li>
                      );
                    } else if (
                      (pageNumber === pageNo - 2 && pageNo > 3) ||
                      (pageNumber === pageNo + 2 &&
                        pageNo < Math.ceil(totalProjects / pageSize) - 2)
                    ) {
                      return (
                        <li key={pageNumber}>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            ...
                          </span>
                        </li>
                      );
                    }
                    return null; // Don't render other page buttons
                  }
                )}
                <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                  <button
                    className={`${pageNo >= Math.ceil(totalProjects / pageSize)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                      }`}
                    onClick={() => handlePageChange(pageNo + 1)}
                    disabled={pageNo >= Math.ceil(totalProjects / pageSize)}
                  >
                    <Icon icon="heroicons-outline:chevron-right" />
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <p className="text-center capitalize">No project found</p>
        ))}

      {filler === "list" && !isLoaded && (
        <div>
          <ProjectList
            projects={filteredProjects}
            setData={setData}
            setShowEditProjectModal={setShowEditProjectModal}
            setShowDeleteProjectModal={setShowDeleteProjectModal}
            setProjectId={setProjectId}
            pageSize={pageSize}
            setPageSize={setPageSize}
            pageSizeOptions={pageSizeOptions}
            totalProjects={totalProjects}
            pageNo={pageNo}
            setPageNo={setPageNo}
            userInfo={userInfo}
            toggleHideProject={toggleHideProject}
          />
        </div>
      )}

      <AddProject
        showAddProjectModal={showAddProjectModal}
        setShowAddProjectModal={setShowAddProjectModal}
      />

      {showEditProjectModal && (
        <EditProjectModal
          open={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          projectData={data}
          setProjectData={setData}
          refreshJourney={fetchProjects}
        />
      )}

      {/* Delete Confirmation Modal (same UX as project header) */}
      <Modal
        title="Are you sure you want to delete this project?"
        labelclassName=""
        activeModal={showDeleteProjectModal}
        onClose={() => setShowDeleteProjectModal(false)}
        centered
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="deleteType"
                value={String(deleteWithTasks)}
                checked={!deleteWithTasks}
                onChange={() => setDeleteWithTasks(false)}
                className="cursor-pointer"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Delete this project and keep all tasks inside it.
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="deleteType"
                value={String(deleteWithTasks)}
                checked={deleteWithTasks}
                onChange={() => setDeleteWithTasks(true)}
                className="cursor-pointer"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Delete this project along with all tasks.
              </span>
            </label>
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={() => setShowDeleteProjectModal(false)}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProject}
            disabled={isDeletingProject}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeletingProject ? "Deleting..." : "Delete project"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectHeader;
