import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import FileDropZone3 from "./FileDropZone3";
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import { fetchAuthDelete, fetchAuthFilePost, fetchAuthGET, fetchAuthPost } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { increment } from "@/store/counterReducer";
import { fetchTasksPaginated } from "@/features/section-task/store/sectionTaskSlice";
import ReactSelect from "react-select";
import Modal from "@/components/ui/Modal";
import { setFilters } from "@/features/tasks";
import CustomMenuList from "@/components/ui/CustomMenuList";
import AddProject from "@/components/Projects/AddProject";
import { Icon } from "@iconify/react";
import DeletePopup from "../../../pages/inviteemployee/DeletePopup";
import { ProfilePicture } from "@/components/ui/profilePicture";
import { formatDateWithMonthName, formatDateWithTime, formatLocalTime, formatTime } from "@/helper/helper";
import DyzoLogo from "@/assets/images/logo/dyzo-ai-logo.png"

const SidelineDatabaseTab = ({
  fields: initialFields,
  setFields,
  setshowCsv,
  getAllTasks,
  handleTabClick,
  fromProject = false,
  projectId = null,
  projectData = null,
  initialMode = "csv",
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [missingFields, setMissingFields] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loader, setLoader] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Use local state for fields instead of prop
  const [fields, setFieldsLocal] = useState([
    { dbField: "Task Name", column: "" },
    { dbField: "Description", column: "" }
  ]);

  const [filteredAssignes, setFilteredAssignes] = useState(null);
  const [filteredProjects, setFilteredProjects] = useState(null);
  // Change state to array for multiselect
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // New states for project-specific data
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectSections, setProjectSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);

  const [savedTemplates, setSavedTemplates] = useState([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState({})
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false)

  const [publicTemplates, setPublicTemplates] = useState([])

  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false)
  const [isTemplateDeleting, setIsTemplateDeleting] = useState(false)
  const [templateDeletingId, setTemplateDeletingId] = useState(null)

  const userInfo = useSelector((state) => state.auth.user);
  const { users } = useSelector((state) => state.users)
  const { deletedUserIds, deletedData } = useSelector((state) => state.users || { deletedUserIds: [], deletedData: [] });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const csvTemplateHeaders = ["Task Name", "Description"];
  const csvTemplateExampleRow = ["Sample Task", "This is a sample"];

  // Helper: Case-insensitive match
  const normalize = (str) => str.replace(/\s+/g, "").toLowerCase();

  const findMatchingHeader = (headers, dbField) => {
    return headers.find(
      (header) => normalize(header) === normalize(dbField)
    );
  };

  // Fetch employees and projects
  const fetchEmployee = async () => {
    try {
      const { data } = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/employee/list/${userInfo?.companyId
        }/`
      );
      const activeEmployees = data.filter((emp) => emp.isActive);
      setFilteredAssignes(activeEmployees);
    } catch (error) { }
  };

  const fetchProjects = async () => {
    try {
      let projects = [];
      if (userInfo?.user_type === "client") {
        const data = await fetchAuthGET(
          `${import.meta.env.VITE_APP_DJANGO}/api/client/${userInfo._id
          }/projects/`
        );
        if (data && data.projects) {
          projects = data.projects;
        }
      } else {
        const data = await fetchAuthGET(
          `${import.meta.env.VITE_APP_DJANGO}/project/company/${userInfo?.companyId
          }/${userInfo?._id}/`
        );
        if (data && data.projects) {
          projects = data.projects;
        }
      }
      const activeProjects = (projects || []).filter(
        (project) => project.isActive
      );
      setFilteredProjects(activeProjects);
      // setSelectedProject(userInfo.default_project_id);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Set project members from projectData
  const setProjectMembersFromData = (projectData) => {
    if (projectData && projectData.assignee_details) {
      const members = projectData.assignee_details;
      setProjectMembers(members);
      // Set current user as default if they are a member
      const currentUserIsMember = members.find(member => member._id === userInfo._id);
      if (currentUserIsMember) {
        setSelectedAssignees([userInfo._id]);
      }
    }
  };

  // Fetch project members (fallback when projectData is not provided)
  const fetchProjectMembers = async (projectId) => {
    try {
      const response = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/project-v2/${projectId}/${userInfo._id}/`
      );
      if (response.status === 1 && response.data) {
        const members = response.data.assigned_users || [];
        setProjectMembers(members);
        // Set current user as default if they are a member
        const currentUserIsMember = members.find(member => member._id === userInfo._id);
        if (currentUserIsMember) {
          setSelectedAssignees([userInfo._id]);
        }
      }
    } catch (error) {
      console.error("Error fetching project members:", error);
    }
  };

  // Fetch project sections
  const fetchProjectSections = async (projectId) => {
    try {
      const response = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/projects/${projectId}/sections/`
      );
      if (response && !response.error) {
        // Handle the response structure from the sections API
        const sections = response.results?.sections || response.sections || response;
        setProjectSections(Array.isArray(sections) ? sections : []);
      }
    } catch (error) {
      console.error("Error fetching project sections:", error);
    }
  };

  useEffect(() => {
    if (fromProject && projectId) {
      // When coming from a project, use project data or fetch project-specific data
      setSelectedProject(projectId);
      if (projectData) {
        setProjectMembersFromData(projectData);
      } else {
        fetchProjectMembers(projectId);
      }
      fetchProjectSections(projectId);
      fetchEmployee(); // Still need all employees for potential reassignment
      fetchSavedTemplates();
    } else {
      // Normal flow - fetch all data
      fetchEmployee();
      fetchProjects();
      fetchSavedTemplates();
      // Set current user as default selected employee on mount
      if (userInfo?._id) {
        setSelectedAssignees([userInfo._id]);
      }
    }
  }, [fromProject, projectId, projectData]);

  useEffect(() => {
    // If employee list is loaded and selectedAssignees is empty, set to current user
    if (filteredAssignes?.length > 0 && (!selectedAssignees || selectedAssignees.length === 0)) {
      setSelectedAssignees([userInfo?._id]);
    }
    // if (filteredProjects?.length > 0 && !selectedProject) {
    //   setSelectedProject(filteredProjects[0]?._id);
    // }
  }, [filteredAssignes, filteredProjects]);

  // File handler
  const handleFileChangeMethod = (file) => {
    setSelectedTemplate({})
    if (!file || !(file instanceof Blob)) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target.result;
      let parsedHeaders = [];

      if (file.name.endsWith(".csv")) {
        Papa.parse(data, {
          header: true,
          complete: (results) => {
            const cleanedData = results.data.filter((row) =>
              Object.values(row).some((value) => value !== null && value !== "")
            );
            if (cleanedData.length > 0) {
              parsedHeaders = Object.keys(cleanedData[0]);
              processHeaders(parsedHeaders, cleanedData);
            } else {
              setHeaders([]);
              setMissingFields(fields.map((f) => f.dbField));
              setParsedData([]);
            }
          },
        });
      } else if (file.name.endsWith(".xlsx")) {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
          header: 1,
        });
        parsedHeaders = worksheet[0];
        processHeaders(
          parsedHeaders,
          XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  // Process headers and auto-match
  const processHeaders = (headers, dataRows) => {
    const matchedFields = fields.map((field) => {
      const match = findMatchingHeader(headers, field.dbField);
      return { ...field, column: match || "" };
    });

    setFieldsLocal(matchedFields);

    const missing = matchedFields
      .filter((f) => !f.column)
      .map((f) => f.dbField);
    setMissingFields(missing);

    if (missing.length === 0) {
      setParsedData(dataRows);
      setShowModal(true);
    } else {
      setParsedData([]);
      toast.error("Missing required fields: " + missing.join(", "));
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }
    if (missingFields.length > 0) {
      toast.error("Missing required fields: " + missingFields.join(", "));
      return;
    }
    if (!selectedProject) {
      toast.error("Please select a project.");
      return;
    }
    if (!selectedAssignees || selectedAssignees.length == 0) {
      toast.error("Please select at least one assignee.");
      return;
    }
    if (fromProject && !selectedSection) {
      toast.error("Please select a section.");
      return;
    }

    setLoader(true);

    // Map file data to your fields 
    const keyMapping = fields.reduce((acc, map) => {
      if (map.column) {
        acc[map.column.toLowerCase()] = map.dbField;
      } else {

      }
      return acc;
    }, {});

    const transformedData = parsedData.map((item) => {
      const newItem = {};
      for (const key in item) {
        if (keyMapping[key.toLowerCase()]) {
          newItem[keyMapping[key.toLowerCase()]] = item[key];
        }
      }
      return newItem;
    });

    try {
      let response;

      if (fromProject && selectedSection) {
        // Use new import tasks API for project context
        const taskNames = transformedData.map((task) => task["Task Name"] || "untitled task");
        const payload = {
          section_id: selectedSection,
          tasks: taskNames,
          assigned_users: selectedAssignees
        };

        response = await fetchAuthFilePost(
          `${import.meta.env.VITE_APP_DJANGO}/api/tasks/import/`,
          { body: payload }
        );

        if (response && response.task_ids) {
          toast.success(response.message || "Tasks imported successfully");
          dispatch(increment());
          setshowCsv(false);

          // Refresh the section tasks to show newly imported tasks instantly
          if (selectedSection) {
            try {
              await dispatch(fetchTasksPaginated({
                sectionId: selectedSection,
                filters: {}, // Use empty filters or current filters
                page: 1,
                pageSize: 20,
                append: false // Replace existing tasks to show fresh data
              }));
            } catch (error) {
              console.error("Error refreshing section tasks:", error);
            }
          }

          // Update URL and switch tab
          const taskIds = response.task_ids.join(",");
          dispatch(
            setFilters({
              userId: "",
              projectId: "",
              taskPosition: [],
              dateRange: { startDate: "", endDate: "" },
              priority: "",
            })
          );
          localStorage.setItem("importedIds", JSON.stringify(taskIds));
          const newSearchParams = new URLSearchParams();
          newSearchParams.set("isImported", "true");
          navigate(`?${newSearchParams.toString()}`, { replace: true });
          handleTabClick("ImportedTask");
          getAllTasks();
        }
      } else {
        // Use existing bulk create API for non-project context
        const tasksPayload = transformedData.map((task) => ({
          taskName: task["Task Name"] || "untitled task",
          description: task["Description"] || "",
          userId: userInfo?._id,
          projectId: selectedProject,
          assigned_users: selectedAssignees,
          ...(selectedSection && { sectionId: selectedSection })
        }));

        const payload = { tasks: tasksPayload };

        response = await fetchAuthPost(
          `${import.meta.env.VITE_APP_DJANGO}/api/bulk-create-tasks/${userInfo._id
          }/`,
          { body: payload }
        );

        if (response) {
          toast.success("Task created successfully");
          dispatch(increment());
          setshowCsv(false);



          // Update URL and switch tab
          const taskIds = response.tasks.map((task) => task._id).join(",");
          dispatch(
            setFilters({
              userId: "",
              projectId: "",
              taskPosition: [],
              dateRange: { startDate: "", endDate: "" },
              priority: "",
            })
          );
          localStorage.setItem("importedIds", JSON.stringify(taskIds));
          const newSearchParams = new URLSearchParams();
          newSearchParams.set("isImported", "true");
          navigate(`?${newSearchParams.toString()}`, { replace: true });
          handleTabClick("ImportedTask");
          getAllTasks();
        }
      }
    } catch (error) {
      toast.error("Failed to create Task");
    }
    setLoader(false);
    setSelectedAssignees([]);
    setSelectedProject(null);
  };

  const handleTemplateTasksSubmit = async () => {
    if (!selectedProject) {
      toast.error("Select a project")
      return;
    }
    if (!selectedAssignees || selectedAssignees.length === 0) {
      toast.error("Please select at least one assignee.");
      return;
    }
    if (fromProject && !selectedSection) {
      toast.error("Please select a section.");
      return;
    }

    try {
      let response;

      if (fromProject && selectedSection) {
        // Use new import tasks API for project context
        const taskNames = selectedTemplate?.data?.map((task) => task.taskName) || [];
        const payload = {
          section_id: selectedSection,
          tasks: taskNames,
          assigned_users: selectedAssignees
        };

        response = await fetchAuthFilePost(

          `${import.meta.env.VITE_APP_DJANGO}/api/tasks/import/`,
          { body: payload }
        );

        if (response && response.task_ids) {
          toast.success(response.message || "Tasks imported successfully");
          setshowCsv(false);

          // Refresh the section tasks to show newly imported tasks instantly
          try {
            // Import the necessary actions from section task slice
            const { fetchTasksPaginated } = await import("@/features/section-task/store/sectionTaskSlice");

            // Fetch updated tasks for the specific section
            await dispatch(fetchTasksPaginated({
              sectionId: selectedSection,
              filters: {}, // Use empty filters or current filters
              page: 1,
              pageSize: 20,
              append: false // Replace existing tasks to show fresh data
            }));
          } catch (error) {
            console.error("Error refreshing section tasks:", error);
          }

          // Update URL and switch tab
          const taskIds = response.task_ids.join(",");
          dispatch(
            setFilters({
              userId: "",
              projectId: "",
              taskPosition: [],
              dateRange: { startDate: "", endDate: "" },
              priority: "",
            })
          );
          localStorage.setItem("importedIds", JSON.stringify(taskIds));
          const newSearchParams = new URLSearchParams();
          newSearchParams.set("tab", "tasks");
          navigate(`?${newSearchParams.toString()}`, { replace: true });

        }
      } else {
        // Use existing bulk create API for non-project context
        const tasksPayload = selectedTemplate?.data?.map((task) => ({
          taskName: task.taskName,
          description: task.description,
          userId: selectedAssignees[0],
          projectId: selectedProject,
          assigned_users: selectedAssignees,
          ...(selectedSection && { sectionId: selectedSection })
        }));

        const payload = { tasks: tasksPayload };

        response = await fetchAuthPost(
          `${import.meta.env.VITE_APP_DJANGO}/api/bulk-create-tasks/${userInfo._id
          }/`,
          { body: payload }
        );

        if (response.status === 1) {
          toast.success(response?.message || "Task created successfully");
          setshowCsv(false);


          // Update URL and switch tab
          const taskIds = response.tasks.map((task) => task._id).join(",");
          dispatch(
            setFilters({
              userId: "",
              projectId: "",
              taskPosition: [],
              dateRange: { startDate: "", endDate: "" },
              priority: "",
            })
          );
          localStorage.setItem("importedIds", JSON.stringify(taskIds));
          const newSearchParams = new URLSearchParams();
          newSearchParams.set("isImported", "true");
          navigate(`?${newSearchParams.toString()}`, { replace: true });
          handleTabClick("ImportedTask");
          getAllTasks();
        }
      }
    } catch (error) {

      // toast.error("Failed to create Task");
    }
  }

  // CSV Template Download
  const handleDownloadTemplate = () => {
    const csv = Papa.unparse([csvTemplateHeaders, csvTemplateExampleRow]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "task-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add this function to get initials from name
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // Custom format for employee options
  const formatEmployeeOption = ({ value, label, data }) => (
    <div className="flex items-center gap-2">
      {data.profile_picture ? (
        <img
          src={`${import.meta.env.VITE_APP_DJANGO}${data.profile_picture}`}
          alt={label}
          className="min-w-[25px] min-h-[25px] w-[25px] h-[25px] rounded-full object-cover"
        />
      ) : (
        <div className="min-w-[25px] min-h-[25px] w-[25px] h-[25px] rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
          {getInitials(label)}
        </div>
      )}
      <span className="text-sm">{label}</span>
    </div>
  );

  const fetchSavedTemplates = async () => {
    try {
      setIsTemplatesLoading(true)
      const apiUrl = `${import.meta.env.VITE_APP_DJANGO}/task-templates/company/${userInfo?.companyId}/${userInfo?._id}/v-2/`;
      const response = await fetchAuthGET(apiUrl, false);
      if (response.status === 1) {
        setPublicTemplates(response?.public_templates)
        setSavedTemplates(response?.company_templates)
      } else {
        console.error("Error in fetchSavedTemplates ", response.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTemplatesLoading(false)
    }
  }

  const handleTamplateClick = (template) => {
    setSelectedTemplate(template)
    setShowTemplateModal(true)
    setSelectedFile(null)
  }

  const handleDeleteTemplate = async () => {
    try {
      setIsTemplateDeleting(true)
      const url = `${import.meta.env.VITE_APP_DJANGO}/task-templates/delete/${templateDeletingId}`
      const response = await fetchAuthDelete(url);
      if (response.status === 1) {
        toast.success(response.message)
        setSavedTemplates(savedTemplates?.filter((template) => template?.id !== templateDeletingId))
        setIsTemplateDeleting(false)
        setTemplateDeletingId(null)
      }
      else {
        toast.error(response.error || "Error in deleting template.")
        console.error("Error in handleDeleteTemplate ", response.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTemplateDeleting(false)
    }
  }

  return (
    <div className="font-normal">
      {/* Prebuild Template */}
      {
        initialMode !== "csv" && (
          <div className="space-y-6 px-6">
            {/* Prebuild Templates Section */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Prebuild Templates</h2>
              {isTemplatesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 animate-pulse">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700" />
                        <div className="h-3 w-28 bg-gray-200 dark:bg-slate-700 rounded" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded" />
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : publicTemplates && publicTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 overflow-y-auto">
                  {publicTemplates.map((template, i) => {
                    return (
                      <div
                        key={`public-${i}`}
                        className="px-3 py-2 border rounded-lg bg-electricBlue-100/10 hover:bg-electricBlue-100/20 cursor-pointer"
                        onClick={() => handleTamplateClick(template)}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <div>
                            <img src={DyzoLogo} alt="logo" className="w-6 h-6 rounded-full object-cover" />
                          </div>
                          <span className="capitalize text-xs font-semibold truncate" title={template?.template_name}>
                            {template?.template_name}
                          </span>
                        </div>
                        <div className="bg-white rounded-sm h-[165px] overflow-hidden">
                          {template?.data?.slice(0, 5).map((task, i) => (
                            <p key={i} className="text-xs border-b px-2 py-2 text-black-900 whitespace-nowrap">
                              {task?.taskName}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap">
                            <span>{formatDateWithTime(template?.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-slate-400">No prebuild templates found.</div>
              )}
            </div>

            {/* Company Templates Section */}
            <div>
              <h2 className="text-lg font-semibold mb-2">{userInfo?.company_name}'s Templates</h2>
              {isTemplatesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 animate-pulse">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700" />
                        <div className="h-3 w-28 bg-gray-200 dark:bg-slate-700 rounded" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded" />
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded" />
                        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : savedTemplates && savedTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 overflow-y-auto pb-6">
                  {savedTemplates.map((template, i) => {
                    const employeeId = template?.user;

                    // Check if employee is in deleted users list
                    const isDeletedUser = deletedUserIds?.includes(employeeId) || deletedUserIds?.includes(String(employeeId));

                    // Find user in active users array
                    const activeUser = users && users?.find((user) => user?._id === employeeId);

                    // Find user in deleted users data if deleted
                    const deletedUser = deletedData?.find((user) => user?._id === employeeId || user?._id === String(employeeId));

                    // Use active user if found, otherwise use deleted user
                    const userData = activeUser || deletedUser;

                    // Check if user is deleted
                    const isUserDeleted = isDeletedUser || !activeUser || userData?.is_deleted || userData?.name?.toLowerCase().includes("(deleted)");

                    return (
                      <div
                        key={`company-${i}`}
                        className="px-3 py-2 border rounded-lg bg-electricBlue-100/10 hover:bg-electricBlue-100/20 cursor-pointer"
                        onClick={() => handleTamplateClick(template)}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <div title={isUserDeleted ? (userData?.name ? `${userData?.name} (Deleted)` : "(Deleted)") : userData?.name}>
                            <ProfilePicture
                              user={isUserDeleted ? (userData ? { ...userData, name: userData?.name || "(deleted)", is_deleted: true } : { name: "(deleted)", is_deleted: true }) : userData}
                              className="w-6 h-6 rounded-full border object-cover"
                            />
                          </div>
                          <span className="capitalize text-xs font-semibold truncate" title={template?.template_name}>
                            {template?.template_name}
                          </span>
                        </div>
                        <div className="bg-white rounded-sm h-[165px] overflow-hidden">
                          {template?.data?.slice(0, 5).map((task, i) => (
                            <p key={i} className="text-xs border-b px-2 py-2 text-black-900 whitespace-nowrap">
                              {task?.taskName}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap">
                            <span>{formatDateWithTime(template?.created_at)}</span>
                          </div>
                          <button
                            className="p-1 hover:bg-red-500/20 rounded-md"
                            title="Delete Template"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateDeletingId(template?.id);
                              setShowDeleteProjectModal(true);
                            }}
                          >
                            <Icon icon="heroicons:trash-16-solid" className="text-red-500 w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-slate-400">No company templates found.</div>
              )}
            </div>
          </div>
        )}

      {/* Import From CSV */}
      {initialMode !== "template" && (
        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between flex-wrap">

            <div className="flex gap-4 mt-2 sm:mt-0 justify-between">
              <Button
                text="View CSV"
                className="bg-white dark:bg-electricBlue-50 dark:border-slate-700 dark:border text-electricBlue-100 dark:text-white py-1.5 px-3 rounded-md flex items-center border-2 border-solid border-neutral-50 "
                onClick={() => setShowTemplatePreview(true)}
              />
              <Button
                text="Download Sample CSV"
                className="bg-electricBlue-50 dark:border-slate-700 dark:border text-white py-1.5 px-3 rounded-md flex items-center border-2 border-solid border-electricBlue-100 "
                onClick={handleDownloadTemplate}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 justify-between">
            <FileDropZone3
              placeholder="Drop file here or continue with your tasks"
              setFile={handleFileChangeMethod}
              setNext={() => { }} // No longer needed
            />
          </div>
          <div className="flex justify-between">
            <Button
              text="Back"
              className="btn-light bg-gray-200 dark:bg-gray-500 h-min text-sm font-normal px-10 py-2 my-5"
              onClick={() => setshowCsv(false)}
            />
            {
              selectedFile && missingFields.length === 0 &&
              <Button
                text="Next"
                className="btn-dark dark:bg-gray-900 h-min text-sm font-normal px-10 py-2 my-5"
                onClick={() => setShowModal(true)}
              />
            }
          </div>
        </div>
      )}

      {
        showDeleteProjectModal && templateDeletingId &&
        <DeletePopup
          title="Delete Template"
          description={`Are you sure you want to delete this template?\nThis action cannot be undone.`}
          setOpen={setShowDeleteProjectModal}
          setLoading={setIsTemplateDeleting}
          loading={isTemplateDeleting}
          onConfirm={handleDeleteTemplate}
        />
      }

      {/* Modal for project/employee selection and submit */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black-500 bg-opacity-80 backdrop-blur-sm px-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg mx-auto">
            <Card bodyClass="w-full mx-auto shadow-md p-0 overflow-visible">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-gray-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {fromProject ? "Select Sections and Members" : "Select Project and Members"}
                </h2>
                <button
                  className="text-gray-400 hover:text-red-500 text-2xl focus:outline-none"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              {/* Modal Message */}
              <div className="px-6 pt-3 pb-1">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {fromProject
                    ? "Please select a section and members to assign the imported tasks."
                    : "Please select a project and members to assign the imported tasks."
                  }
                </p>
              </div>
              {/* Selects */}
              <div className="px-6">
                {!fromProject && (
                  <div className="grid grid-cols-12 items-center my-4 ">
                    <label className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Project Name <span className="text-red-500" >*</span>
                    </label>
                    <div className="col-span-8">
                      <ReactSelect
                        options={filteredProjects?.map((project) => ({
                          value: project._id,
                          label: project.name,
                        }))}
                        value={
                          filteredProjects
                            ?.map((project) => ({
                              value: project._id,
                              label: project.name,
                            }))
                            .find((opt) => opt.value === selectedProject) || null
                        }
                        onChange={(option) =>
                          setSelectedProject(option ? option.value : null)
                        }
                        placeholder="Select Project"
                        components={{
                          MenuList: (props) => (
                            <CustomMenuList
                              {...props}
                              onButtonClick={() => setShowAddProjectModal(true)}
                              buttonText="Add Project"
                            />
                          ),
                        }}
                        styles={{
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected
                              ? '#0f172a'
                              : state.isFocused
                                ? '#E5E7EB' // gray-100
                                : base.backgroundColor,
                            color: state.isSelected
                              ? '#ffffff' : "#111827",
                            padding: '8px 12px',
                            fontSize: "14px",
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: '#FFFFFF',
                            color: '#111827',
                          }),
                          control: (base, state) => ({
                            ...base,
                            borderColor: state.isFocused ? '#000000' : base.borderColor,
                            boxShadow: state.isFocused ? '0 0 0 1px #000000' : base.boxShadow,
                            minHeight: '42px',
                            '&:hover': {
                              borderColor: '#000000',
                            },
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: '#111827',
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: '#6B7280', // gray-500
                          }),
                          input: (base) => ({
                            ...base,
                            color: '#111827',
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            padding: '0 4px',
                            fontSize: "14px"
                          }),
                        }}
                      />
                    </div>
                  </div>
                )}
                {fromProject && projectSections.length > 0 && (
                  <div className="grid grid-cols-12 items-center my-4 ">
                    <label className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                      Section
                    </label>
                    <div className="col-span-8">
                      <ReactSelect
                        options={projectSections?.map((section) => ({
                          value: section.id,
                          label: section.name,
                        }))}
                        value={
                          projectSections
                            ?.map((section) => ({
                              value: section.id,
                              label: section.name,
                            }))
                            .find((opt) => opt.value === selectedSection) || null
                        }
                        onChange={(option) =>
                          setSelectedSection(option ? option.value : null)
                        }
                        placeholder="Select Section"
                        isClearable
                        styles={{
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected
                              ? '#0f172a'
                              : state.isFocused
                                ? '#E5E7EB' // gray-100
                                : base.backgroundColor,
                            color: state.isSelected
                              ? '#ffffff' : "#111827",
                            padding: '8px 12px',
                            fontSize: "14px",
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: '#FFFFFF',
                            color: '#111827',
                          }),
                          control: (base, state) => ({
                            ...base,
                            borderColor: state.isFocused ? '#000000' : base.borderColor,
                            boxShadow: state.isFocused ? '0 0 0 1px #000000' : base.boxShadow,
                            minHeight: '42px',
                            '&:hover': {
                              borderColor: '#000000',
                            },
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: '#111827',
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: '#6B7280', // gray-500
                          }),
                          input: (base) => ({
                            ...base,
                            color: '#111827',
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            padding: '0 4px',
                            fontSize: "14px"
                          }),
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-12 items-center my-4 ">
                  <label className="col-span-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Member Name
                  </label>
                  <div className="col-span-8">
                    <ReactSelect
                      isMulti
                      options={(fromProject ? projectMembers : filteredAssignes)?.map((assignee) => ({
                        value: assignee._id,
                        label: assignee.name,
                        data: {
                          profile_picture: assignee.profile_picture,
                        },
                      }))}
                      value={(fromProject ? projectMembers : filteredAssignes)
                        ?.map((assignee) => ({
                          value: assignee?._id,
                          label: assignee?.name,
                          data: {
                            profile_picture: assignee?.profile_picture,
                          },
                        }))
                        .filter((opt) => selectedAssignees.includes(opt.value))}
                      onChange={(options) =>
                        setSelectedAssignees(options ? options.map((opt) => opt.value) : [])
                      }
                      placeholder="Select Assignees"
                      formatOptionLabel={formatEmployeeOption}
                      components={{
                        MenuList: (props) => (
                          <CustomMenuList
                            {...props}
                            onButtonClick={() => {
                              navigate("/invite-user");
                            }}
                            buttonText="Invite User"
                          />
                        ),
                      }}
                      styles={{
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#0f172a'
                            : state.isFocused
                              ? '#E5E7EB' // gray-100
                              : base.backgroundColor,
                          color: state.isSelected
                            ? '#ffffff' : "#111827",
                          padding: '8px 12px',
                        }),
                        menu: (base) => ({
                          ...base,
                          backgroundColor: '#FFFFFF',
                          color: '#111827',
                        }),
                        control: (base, state) => ({
                          ...base,
                          borderColor: state.isFocused ? '#000000' : base.borderColor,
                          boxShadow: state.isFocused ? '0 0 0 1px #000000' : base.boxShadow,
                          minHeight: '42px',
                          '&:hover': {
                            borderColor: '#000000',
                          },
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: '#111827',
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#6B7280', // gray-500
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#111827',
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          padding: '0 4px',
                        }),
                      }}
                    />
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex justify-between px-6 pb-6 pt-2 border-t border-gray-200 dark:border-slate-700 mt-2">
                <Button
                  text="Cancel"
                  className=" border bg-slate-100 hover:bg-slate-200 dark:bg-gray-500 hover:dark:bg-gray-600 h-min text-sm font-normal px-10 py-2"
                  onClick={() => setShowModal(false)}
                />
                <Button
                  text={loader ? "Submitting" : "Submit"}
                  className=" bg-electricBlue-100 hover:bg-electricBlue-100/90 text-white h-min text-sm font-normal px-10 py-2"
                  onClick={Object.keys(selectedTemplate).length > 0 ? handleTemplateTasksSubmit : handleSubmit}
                  disabled={loader ? true : false}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {showTemplatePreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black-500 bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-black-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 p-6 overflow-auto max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                CSV Template Preview
              </h4>
              <button
                className="text-gray-600 dark:text-gray-300 hover:text-red-500 transition"
                onClick={() => setShowTemplatePreview(false)}
              >
                ✕
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-sm border-collapse border rounded overflow-hidden">
                <thead>
                  <tr>
                    {csvTemplateHeaders.map((header, index) => (
                      <th
                        key={index}
                        className="border px-3 py-2 bg-gray-100 dark:bg-black-600 text-left font-medium text-gray-800 dark:text-gray-200"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {csvTemplateExampleRow.map((cell, index) => (
                      <td
                        key={index}
                        className="border px-3 py-2 text-gray-700 dark:text-gray-300"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 text-right">
              <Button
                text="Close Preview"
                className="btn-primary btn-sm"
                onClick={() => setShowTemplatePreview(false)}
              />
            </div>
          </div>
        </div>
      )}

      {
        selectedTemplate &&
        <Modal
          title={selectedTemplate?.template_name}
          labelclassName=""
          activeModal={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          centered
        >
          <p className="text-base font-semibold mb-2">Task Name</p>
          <div className="border p-2 max-h-[50vh] overflow-y-auto">
            {
              selectedTemplate && selectedTemplate?.data?.map((task, i) => (
                <p key={i} className={`text-sm ${selectedTemplate?.data?.length > i + 1 ? "border-b" : ""} p-4 text-black-900 `}>{task?.taskName}</p>
              ))
            }
          </div>
          <div className="flex justify-center mt-8">
            <button className="bg-electricBlue-100 hover:bg-electricBlue-100/80 text-white px-8 py-2 rounded-md" onClick={() => { setShowTemplateModal(false); setShowModal(true) }} >Import {selectedTemplate?.data?.length} {selectedTemplate?.data?.length > 1 ? "Tasks" : "Task"}</button>
          </div>
        </Modal>
      }

      <AddProject
        showAddProjectModal={showAddProjectModal}
        setShowAddProjectModal={setShowAddProjectModal}
      />
    </div>
  );
};

export default SidelineDatabaseTab;
