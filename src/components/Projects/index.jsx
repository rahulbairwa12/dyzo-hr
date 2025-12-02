import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import ProjectHeader from "./ProjectHeader"
import ProjectOverview from "./ProjectOverview"
import ProjectMembers from "./ProjectMembers"
import ProjectNotes from "./ProjectNotes"
import { djangoBaseURL } from "@/helper"
import { fetchAuthGET } from "@/store/api/apiSlice"
import { ToastContainer } from "react-toastify"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { fetchUsers } from "@/store/usersSlice"
import { useDispatch } from "react-redux"
import SectionTaskPage from "@/features/section-task/components/SectionTaskPage"
import { getUserPermissions } from "@/utils/accessLevelUtils"

export default function ProjectDashboard() {
  const { project_id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user);

  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.auth.user);
  const { users } = useSelector((state) => state.users)
  // Initialize active tab from URL (?tab=members|tasks|notes|overview)
  const getInitialTabFromUrl = () => {
    const params = new URLSearchParams(location.search)
    return params.get("tab") || "overview"
  }
  const [activeTab, setActiveTab] = useState(getInitialTabFromUrl())
  const [projectData, setProjectData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const permissions = getUserPermissions(projectData, userInfo?._id, userInfo?.isAdmin);

  // Helper to read query param as fallback (e.g., ?projectId=...)
  const getQueryParamId = () => {
    const params = new URLSearchParams(location.search)
    return params.get("projectId")
  }

  const resolvedProjectId = project_id || getQueryParamId()

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Keep state in sync when user navigates with browser back/forward
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabFromUrl = params.get("tab") || "overview"
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true)
        setError(null)
        if (!resolvedProjectId) {
          setError("No project selected")
          setProjectData(null)
          return
        }
        const response = await fetchAuthGET(`${djangoBaseURL}/projects/detail/${resolvedProjectId}/`, false)
        if (response.status === 1) {
          setProjectData(response.data)
        } else {
          setError("Failed to fetch project data")
        }
      } catch (err) {
        setError("Error fetching project data: " + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData(resolvedProjectId)
  }, [resolvedProjectId])

  const handleProjectUpdate = (updatedProjectData) => {
    setProjectData(updatedProjectData)
    if (updatedProjectData?.refreshJourney) {
      updatedProjectData.refreshJourney();
    }
  }



  // Check if current project is user's default project
  const isDefaultProject =
    String(user?.default_project) === String(resolvedProjectId) ||
    String(user?.default_project_id) === String(resolvedProjectId) ||
    Number(user?.default_project) === Number(resolvedProjectId) ||
    Number(user?.default_project_id) === Number(resolvedProjectId);

  const tabs = [
    { id: "overview", label: "Overview", icon: "mdi:chart-line" },
    { id: "tasks", label: "Tasks", icon: "hugeicons:task-add-02" },
    { id: "members", label: "Project Members", icon: "f7:person-2" },
    { id: "notes", label: "Notes", icon: "hugeicons:note-edit" },
  ].filter(tab => {
    // Hide members tab if this is the default project
    if (tab.id === "members" && isDefaultProject) {
      return false;
    }
    return true;
  })

  // When tab changes via header clicks, update URL (?tab=...)
  const handleSetActiveTab = (nextTab) => {
    setActiveTab(nextTab)
    const params = new URLSearchParams(location.search)
    params.set("tab", nextTab)
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: false })
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-slate-300"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold text-customBlack-50 dark:text-customWhite-50">Error</p>
            <p className="text-customBlack-50 dark:text-customWhite-50">{error}</p>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case "overview":
        return <ProjectOverview projectData={projectData} setProjectData={setProjectData} permissions={permissions} isDefaultProject={isDefaultProject} setActiveTab={setActiveTab} />
      case "tasks":
        // Transform assignee_details to match TaskTable users data structure
        const transformedProjectMembers = (projectData?.assignee_details || []).map(user => ({
          value: user._id,
          designation: null, // Add default designation if not available
          label: `${user.name} (${user.email})`,
          first_name: user.name?.split(' ')[0] || '',
          last_name: user.name?.split(' ').slice(1).join(' ') || '',
          name: user.name,
          _id: user._id,
          email: user.email,
          status: "Active", // Add default status
          isActive: true, // Add default isActive
          image: user.profile_picture
        }));
        // Create projects array with current project for BottomBar
        const projectsForBottomBar = projectData ? [{
          _id: projectData._id,
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          project_status: projectData.status, // Include project status for BottomBar
          created_at: projectData.created_at,
          updated_at: projectData.updated_at
        }] : [];

        return <SectionTaskPage
          projectMembers={transformedProjectMembers}
          projectData={projectData}
          projectsForBottomBar={projectsForBottomBar}
        />
      case "members":
        return <ProjectMembers projectData={projectData} setProjectData={setProjectData} permissions={permissions} />
      case "notes":
        return <ProjectNotes projectData={projectData} setProjectData={setProjectData} users={users} permissions={permissions} />
      default:
        return <ProjectOverview projectData={projectData} setProjectData={setProjectData} permissions={permissions} isDefaultProject={isDefaultProject} setActiveTab={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-800">
      <ToastContainer position="top-right" newestOnTop style={{ zIndex: 2147483647 }} />
      <div className="bg-white dark:bg-slate-800">
        <ProjectHeader
          projectData={projectData}
          activeTab={activeTab}
          setActiveTab={handleSetActiveTab}
          setProjectData={setProjectData}
          permissions={permissions}
          isDefaultProject={isDefaultProject}
        />
      </div>

      <div className="p-4">{renderContent()}</div>
    </div>
  )
}