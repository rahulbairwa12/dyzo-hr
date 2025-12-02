import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '@iconify/react';
import Select, { components } from 'react-select';
import { fetchUsers } from '@/store/usersSlice';
import { fetchProjects } from '@/store/projectsSlice';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import dayjs from 'dayjs';
import { ProfilePicture } from '@/components/ui/profilePicture';
import { fetchAuthGET, fetchAuthFilePost } from '@/store/api/apiSlice';
import { djangoBaseURL } from '@/helper';
import Card from '@/components/ui/Card';
import { useTable, useSortBy, usePagination } from 'react-table';
import moment from 'moment';
import { toast, ToastContainer } from 'react-toastify';
import Modal from '@/components/ui/Modal';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ProfileCardWrapper from '@/components/ui/ProfileCardWrapper';
import TaskPanelSkeleton from '@/features/tasks/components/TaskPanelSkeleton';
import { TaskPanel } from '@/features/tasks';
import AttachmentViewer from '@/components/Task/AttachmentViewer';
import { updateTaskCommentCount } from '@/features/tasks/store/tasksSlice';
import TaskSummaryTable from './TaskSummaryTable';
import EmployeeSummaryTable from './EmployeeSummaryTable';
import Button from '@/components/ui/Button';
import CopyTaskNameButton from './CopyTaskNameButton';

const index = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: userInfo } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);
  const { users } = useSelector((state) => state.users);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [value, setValue] = useState({ startDate: '', endDate: '' });
  const [openDropdown, setOpenDropdown] = useState({
    project: false,
    assignee: false,
  });

  // Tabs
  const [activeTab, setActiveTab] = useState('taskSummary');

  // API data states
  const [tasksData, setTasksData] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Email modal states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Task panel states
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});
  const [taskLoading, setTaskLoading] = useState(false);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState(0);
  const [attachmentsForView, setAttachmentsForView] = useState([]);

  // Custom styles for Select components
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: '38px',
      backgroundColor: 'var(--select-bg, white)',
      borderColor: 'var(--select-border, #E1E1E1)',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'var(--select-border-hover, #CBD5E1)',
      },
      height: '38px',
      paddingBottom: '0',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderRadius: '0.375rem',
    }),
    menuList: (base) => ({
      ...base,
      padding: '0.5rem 0',
      maxHeight: '240px',
    }),
  };

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchProjects());
  }, [dispatch]);

  // Format projects for dropdown
  const favouriteIds = userInfo?.fav_projects || [];
  const favouriteProjects = projects.filter((p) => favouriteIds.includes(p._id));
  const otherProjects = projects.filter((p) => !favouriteIds.includes(p._id));

  const projectOptions = useMemo(() => {
    let options = [
      ...favouriteProjects.map((project) => ({
        value: project._id,
        label: project.name,
        projectColor: project.projectColor,
        __isAllProjectsOption: false,
      })),
      ...otherProjects.map((project) => ({
        value: project._id,
        label: project.name,
        projectColor: project.projectColor,
        __isAllProjectsOption: false,
      })),
    ];

    // Add "All Projects" option
    options.unshift({
      value: '',
      label: 'All Projects',
      __isAllProjectsOption: true,
    });

    return options;
  }, [projects, userInfo?.fav_projects]);

  // Format users for dropdown - matching SectionTaskPage pattern
  const userOptions = useMemo(() => {
    const formattedUsers = users.map((user) => {
      const displayName = user?.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email?.split("@")[0] || "";
      const profileImage = user?.profile_picture || user.profileImg || user.image || user.profilePic || user.avatar || null;

      return {
        value: user._id || user.id,
        label: displayName,
        name: displayName,
        image: profileImage,
        email: user.email,
      };
    }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

    // Add "All Users" option
    return [{ value: "", label: "All Users", name: "All Users" }, ...formattedUsers];
  }, [users]);

  // Handle date change
  const handleValueChange = (selectedDates, dateStr, instance) => {
    let formattedStartDate = '';
    let formattedEndDate = '';

    if (selectedDates && selectedDates.length > 0) {
      formattedStartDate = dayjs(selectedDates[0]).format('YYYY-MM-DD');
      if (selectedDates.length > 1) {
        formattedEndDate = dayjs(selectedDates[1]).format('YYYY-MM-DD');
      }
    }

    setValue({ startDate: formattedStartDate, endDate: formattedEndDate });
  };

  // API Functions
  const fetchTasksData = async (url) => {
    setLoading(true);
    try {
      const response = await fetchAuthGET(url, false);
      if (response.data && response.data.length > 0) {
        setTasksData(response.data);
      } else {
        setTasksData([]);
      }
      setCurrentPage(response.current_page || 1);
      setTotalPages(response.total_pages || 1);
      setTotalItems(response.total_items || 0);
      setReportData({
        totalTasks: response.totalTasks,
        totalTimeSpent: response.totalTimeSpent,
        totalTimeSpentInDecimal: response.totalTimeSpentInDecimal,
        totalManualTimeSpent: response.totalManualTimeSpent,
        totalManualTimeSpentInDecimal: response.totalManualTimeSpentInDecimal,
        totalCompletedTasks: response.totalCompletedTasks,
      });
    } catch (error) {
      setTasksData([]);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataByFilters = async () => {
    if (!userInfo?.companyId || !value.startDate || !value.endDate) return;

    let url = `${djangoBaseURL}/api/tasks/summary-detail/${userInfo?.companyId}/?startDate=${value.startDate}&endDate=${value.endDate}&page=${currentPage}`;

    if (selectedProject && selectedProject.value !== '') {
      url += `&projectId=${selectedProject.value}`;
    }

    // For non-admin users, always use their own ID
    if (userInfo && !userInfo?.isAdmin) {
      url += `&employeeId=${userInfo._id}`;
    } else if (selectedUser && selectedUser.value !== '') {
      url += `&employeeId=${selectedUser.value}`;
    }

    if (searchQuery) {
      url += `&taskName=${searchQuery}`;
    }

    fetchTasksData(url);
  };

  // Debounced search
  const debounce = (func, delay = 500) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Function to convert tasks data to CSV format
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    // Define CSV headers
    const headers = [
      'Task ID',
      'Task Name',
      'Employees',
      'Project',
      'Time Spent',
      'Status'
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(task => {
        // Format employees list
        const employees = task.workingEmployees
          ? task.workingEmployees.map(emp => emp.name).join('; ')
          : '';

        // Escape and format values
        const row = [
          `${task.taskCode || ''}`,
          `${task.taskName || ''}`,
          `${employees}`,
          `${task.projectName || ''}`,
          `${task.totalTimeSpent || '00:00'}`,
          `${task.taskPosition || ''}`
        ];

        return row.join(',');
      })
    ];

    return csvContent.join('\n');
  };

  // Function to download CSV file
  const downloadCSV = () => {
    if (!tasksData || tasksData.length === 0) {
      toast.error('No data available to download');
      return;
    }

    try {
      const csvContent = convertToCSV(tasksData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `timesheet-report-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV file');
    }
  };

  const debouncedFetchData = debounce(fetchDataByFilters, 300);

  // Function to send email with CSV attachment
  const sendEmailWithCSV = async () => {
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!tasksData || tasksData.length === 0) {
      toast.error('No data available to send');
      return;
    }

    setIsSending(true);
    try {
      // Generate CSV content
      const csvContent = convertToCSV(tasksData);

      // Generate file name
      const startDate = value.startDate ? moment(value.startDate).format('DD-MM-YY') : moment().format('DD-MM-YY');
      const endDate = value.endDate ? moment(value.endDate).format('DD-MM-YY') : moment().format('DD-MM-YY');
      const fileName = `${startDate}_to_${endDate}_Timesheet.csv`;

      // Create form data
      const formData = new FormData();
      formData.append("email", email);
      formData.append("csvData", csvContent);
      formData.append("csvFileName", fileName);
      formData.append("subject", "Timesheet Report(via Dyzo)");
      formData.append("body", "Please find the attached timesheet report.");

      // Send email
      const data = await fetchAuthFilePost(`${djangoBaseURL}/send-email-with-csv-attachment/`, {
        body: formData,
      });

      if (data.status === 1) {
        toast.success(data.message || 'Email sent successfully!');
        setIsEmailModalOpen(false);
        setEmail('');
      } else {
        toast.error(data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // Set default date range on mount and read filters from URL params
  useEffect(() => {
    const projectId = searchParams.get("projectId");
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const page = searchParams.get("page");

    // --- Step 1: Wait for dropdown data ---
    if (!projects.length || !users.length) return;

    // --- Step 2: Set Dates ---
    if (startDate && endDate) {
      setValue({ startDate, endDate });
    } else {
      const today = moment().format("YYYY-MM-DD");
      setValue({ startDate: today, endDate: today });
    }

    // --- Step 3: Search + Page ---
    if (search) setSearchQuery(search);
    if (page) setCurrentPage(parseInt(page));

    // --- Step 4: Set Project ---
    if (projectId) {
      const foundProject = projectOptions.find(
        (p) => String(p.value) === String(projectId)
      );
      if (foundProject) setSelectedProject(foundProject);
    }

    // --- Step 5: Set Employee ---
    if (employeeId) {
      const foundUser = userOptions.find(
        (u) => String(u.value) === String(employeeId)
      );
      if (foundUser) setSelectedUser(foundUser);
    } else if (userInfo && !userInfo?.isAdmin) {
      // For non-admins, default to current user
      const currentUserOption = userOptions.find(
        (u) => u.value === userInfo._id
      );
      if (currentUserOption) setSelectedUser(currentUserOption);
    }
  }, [projects, users, projectOptions, userOptions]);

  // Set selected user to current user if not admin and prevent changes
  useEffect(() => {
    if (userInfo && !userInfo?.isAdmin) {
      const currentUserOption = userOptions.find(user => user.value === userInfo._id);
      if (currentUserOption) {
        setSelectedUser(currentUserOption);
      }
      // Switch to task summary tab if non-admin user is on employee summary tab
      if (activeTab === 'employeeSummary') {
        setActiveTab('taskSummary');
      }
    }
  }, [userInfo, userOptions, activeTab]);

  // Fetch data when filters change and update URL parameters
  useEffect(() => {
    if (value.startDate && value.endDate) {
      // Update URL parameters
      const params = {};

      if (selectedProject && selectedProject.value) {
        params.projectId = selectedProject.value;
      }

      if (selectedUser && selectedUser.value) {
        params.employeeId = selectedUser.value;
      }

      if (value.startDate) {
        params.startDate = value.startDate;
      }

      if (value.endDate) {
        params.endDate = value.endDate;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (currentPage > 1) {
        params.page = currentPage;
      }

      setSearchParams(params);

      debouncedFetchData();
    }
  }, [selectedProject, selectedUser, value.startDate, value.endDate, searchQuery, currentPage]);

  // Fetch task details API function
  const fetchTaskDetails = async (taskId) => {
    setTaskLoading(true);
    try {
      const apiUrl = `${djangoBaseURL}/api/tasks/${taskId}/`;
      const data = await fetchAuthGET(apiUrl, false);
      if (data?.status === 1) {
        setSelectedTask(data?.data);
        setIsTaskPanelOpen(true);
        // Fetch projects if not already loaded
        // dispatch(fetchProjects());

      } else {
        setSelectedTask({});
        console.error("Error fetching task details:");
      }
    } catch (error) {
      setSelectedTask({});
      console.error("Error fetching task details:", error);
    }
    setTaskLoading(false);
  };

  // Table columns configuration
  const columns = useMemo(
    () => [
      {
        Header: 'Task Id',
        accessor: "taskCode",
        Cell: ({ value, row }) => {
          const task = row?.original;
          const taskId = task?._id;
          return (
            <div className="text-xs font-medium text-slate-600 cursor-pointer hover:text-electricBlue-50" onClick={() => fetchTaskDetails(taskId)}>
              {value}
            </div>
          )
        },
      },
      {
        Header: 'Task',
        accessor: 'taskName',
        Cell: ({ value, row }) => {
          const task = row?.original;
          const taskId = task?._id;
          return (
            <div className="flex items-center justify-between gap-2 min-w-[230px]">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate cursor-pointer hover:text-electricBlue-50 flex-1" title={value} onClick={() => fetchTaskDetails(taskId)} >
                {value}
              </div>
              <div className="flex-shrink-0">
                <CopyTaskNameButton taskName={value} />
              </div>
            </div>
          )
        },
      },
      {
        Header: 'Working Users',
        accessor: 'workingEmployees',
        Cell: ({ value }) => (
          <div className="flex items-center gap-1">
            {value?.slice(0, 3).map((employee, index) => (
              <ProfileCardWrapper userId={employee.id} >
                <ProfilePicture
                  key={employee.id}
                  user={{
                    name: employee.name,
                    image: employee.profilePicUrl ? `${employee.profilePicUrl}` : null,
                  }}
                  className="w-7 h-7 rounded-full border-2 border-white"
                />
              </ProfileCardWrapper>
            ))}
            {value?.length > 2 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                +{value.length - 2}
              </div>
            )}
          </div>
        ),
      },
      {
        Header: 'Project',
        accessor: 'projectName',
        Cell: ({ value, row }) => (
          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[150px] cursor-pointer hover:text-electricBlue-50" title={value} onClick={() => { navigate(`/project/${row?.original?.projectId}?tab=tasks`); }}>
            {value}
          </div>
        ),
      },
      {
        Header: 'Time',
        accessor: 'totalTimeSpent',
        Cell: ({ value }) => (
          <div className="text-xs font-medium text-slate-900 dark:text-white">
            {value || '00:00'}
          </div>
        ),
      },
      {
        Header: 'Status',
        accessor: 'taskPosition',
        Cell: ({ value, row }) => {
          const statusColor = row?.original?.statusColor;
          return (
            <span className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium `}
              style={{
                backgroundColor: statusColor + '1a',
                color: statusColor,
              }}>
              {value}
            </span>
          );
        },
      },
      {
        Header: 'Action',
        Cell: ({ row }) => {
          const task = row?.original;
          return (
            <div className="flex items-center gap-2">
              <Link
                title="Task Logs"
                to={`/timesheet-report/timesheet-logs/${task._id}`}
                state={{
                  task: task,
                  startDate: value.startDate,
                  endDate: value.endDate,
                  selectedUser: selectedUser
                }}
                className="w-8 h-8 flex items-center justify-center bg-electricBlue-50/10 hover:bg-electricBlue-50/20 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon icon="heroicons:document-text" className="w-5 h-5 text-electricBlue-50" />
              </Link>
              <Link
                title="Task Screenshots"
                to={`/timesheet-report/timelog-screenshots/${task._id}`}
                state={{
                  task: task,
                  startDate: value.startDate,
                  endDate: value.endDate,
                  selectedUser: selectedUser
                }}
                className="w-8 h-8 flex items-center justify-center bg-electricBlue-50/10 hover:bg-electricBlue-50/20 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon icon="iconoir:screenshot" className="w-5 h-5 text-electricBlue-50" />
              </Link>
            </div>
          )
        }
      },
    ],
    [currentPage, value, selectedUser]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data: tasksData,
    },
    useSortBy
  );

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    const pages = [];

    // Always show page 1
    pages.push(
      <button
        key={1}
        onClick={() => handlePageChange(1)}
        className={`px-3 py-1 mx-1 rounded-md text-sm font-medium transition-colors ${1 === currentPage
          ? 'bg-electricBlue-50 text-white'
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
          }`}
      >
        1
      </button>
    );

    // Add ellipsis if current page is far from start
    if (currentPage > 3) {
      pages.push(
        <span key="start-ellipsis" className=" py-1 mx-1 text-gray-500">
          ...
        </span>
      );
    }

    // Show current page and its neighbors (but not page 1 or last page)
    const startRange = Math.max(2, currentPage - 1);
    const endRange = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startRange; i <= endRange; i++) {
      // Skip if it's page 1 (already added) or last page (will be added later)
      if (i === 1 || i === totalPages) continue;

      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded-md text-sm font-medium transition-colors ${i === currentPage
            ? 'bg-electricBlue-50 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
        >
          {i}
        </button>
      );
    }

    // Add ellipsis if current page is far from end
    if (currentPage < totalPages - 2) {
      pages.push(
        <span key="end-ellipsis" className=" py-1 mx-1 text-gray-500">
          ...
        </span>
      );
    }

    // Always show last page (if it's not page 1)
    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 mx-1 rounded-md text-sm font-medium transition-colors ${totalPages === currentPage
            ? 'bg-electricBlue-50 text-white'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center sm:justify-end py-10">
        {/* Start button */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
        >
          <Icon icon="material-symbols:first-page" className='w-6 h-6' />
        </button>

        {/* Previous button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
        >
          <Icon icon="ion:caret-back" className='w-6 h-6' />
        </button>

        {/* Page numbers */}
        {pages}

        {/* Next button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hidden sm:block"
        >
          <Icon icon="ion:caret-forward" className='w-6 h-6' />
        </button>

        {/* Last button */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="mx-1 rounded-md text-sm font-medium bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed  hidden sm:block"
        >
          <Icon icon="material-symbols:last-page" className='w-6 h-6' />
        </button>
      </div>
    );
  };

  // Function to update task fields from child components
  const handleTaskUpdate = (taskId, field, value) => {
    setSelectedTask(prevTask => ({
      ...prevTask,
      [field]: value
    }));
  };

  const handleCommentCountUpdate = (taskId, newCount) => {
    dispatch(updateTaskCommentCount({ taskId, newCount }));
  };

  const handleAttachmentOpen = (index) => {
    setCurrentAttachment(index);
    setIsAttachmentViewerOpen(true);
  };

  const closeTaskPanel = () => {
    setIsTaskPanelOpen(false);
    setSelectedTask({});
    setTaskLoading(false);
    fetchDataByFilters();
  };

  const handleResetFilters = () => {
    const today = moment().format("YYYY-MM-DD");
    setValue({ startDate: today, endDate: today });
    setSelectedProject(null);
    setSelectedUser(null);
  };

  const parsedStartDate = value?.startDate ? dayjs(value.startDate).toDate() : null;
  const parsedEndDate = value?.endDate ? dayjs(value.endDate).toDate() : null;

  function parseTimeStringToMinutes(timeStr) {
    if(!timeStr) return ;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function formatMinutesToTimeStr(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  function calculateAutomateTime(totalTimeSpent, totalManualTimeSpent) {
    const totalMinutes = parseTimeStringToMinutes(totalTimeSpent);
    const manualMinutes = parseTimeStringToMinutes(totalManualTimeSpent);
    const automateMinutes = totalMinutes - manualMinutes;
    return automateMinutes > 0 ? formatMinutesToTimeStr(automateMinutes) : '0:00';
  }

  return (
    <>
      <ToastContainer />
      <div className="bg-white min-h-[calc(100vh-80px)] w-full p-6">
        <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Project Select */}
            <div className="w-full">
              <Select
                value={selectedProject}
                onChange={setSelectedProject}
                options={projectOptions}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select Project"
                isSearchable={true}
                onMenuOpen={() => setOpenDropdown(prev => ({ ...prev, project: true }))}
                onMenuClose={() => setOpenDropdown(prev => ({ ...prev, project: false }))}
                components={{
                  DropdownIndicator: (props) => (
                    <components.DropdownIndicator {...props}>
                      <Icon
                        icon={openDropdown.project ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
                        className="w-4 h-4 text-slate-500"
                      />
                    </components.DropdownIndicator>
                  ),
                  Option: ({ children, ...props }) => {
                    const { data, innerRef, innerProps, isFocused, isSelected } = props;
                    const projectColor = data?.projectColor;

                    return (
                      <div
                        ref={innerRef}
                        {...innerProps}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer truncate text-sm ${isSelected ? 'bg-electricBlue-50/10 text-electricBlue-50 dark:bg-slate-600 font-semibold' : ''
                          } ${isFocused && !isSelected ? 'bg-gray-200 dark:bg-slate-700' : ''
                          }`}
                      >
                        {!data?.__isAllProjectsOption && (
                          <div
                            className="w-3 h-3 rounded-[3px] flex-shrink-0 border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: projectColor }}
                          />
                        )}
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate max-w-[150px] text-sm font-normal" title={data.label}>
                            {data.label}
                          </span>
                        </div>
                      </div>
                    );
                  },
                  SingleValue: (props) => {
                    const { data } = props;
                    const projectColor = data?.projectColor;

                    return (
                      <components.SingleValue {...props}>
                        <div
                          className="flex items-center gap-2 truncate text-sm "
                        >
                          {!data?.__isAllProjectsOption && (
                            <div
                              className="w-3 h-3 rounded-[3px] flex-shrink-0 border border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: projectColor }}
                            />
                          )}
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate max-w-[150px] text-sm font-normal" title={data.label}>
                              {data.label}
                            </span>
                          </div>
                        </div>
                      </components.SingleValue>
                    );
                  },
                }}
                styles={customStyles}
              />
            </div>

            {/* User Select */}
            <div className="w-full">
              <Select
                value={selectedUser}
                onChange={(selectedOption) => {
                  // Only allow changing user if admin
                  if (userInfo?.isAdmin) {
                    setSelectedUser(selectedOption);
                  }
                }}
                options={userOptions}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select User"
                isSearchable={true}
                isDisabled={userInfo && !userInfo?.isAdmin}
                onMenuOpen={() => setOpenDropdown(prev => ({ ...prev, assignee: true }))}
                onMenuClose={() => setOpenDropdown(prev => ({ ...prev, assignee: false }))}
                components={{
                  DropdownIndicator: (props) => (
                    <components.DropdownIndicator {...props}>
                      <Icon
                        icon={openDropdown.assignee ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
                        className="w-4 h-4 text-slate-500"
                      />
                    </components.DropdownIndicator>
                  ),
                  Option: (props) => {
                    const { data, innerRef, innerProps, isFocused, isSelected } = props;

                    return (
                      <div
                        ref={innerRef}
                        {...innerProps}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm ${isSelected ? 'bg-electricBlue-50/10 text-electricBlue-50 dark:bg-slate-600 font-semibold' : ''
                          } ${isFocused && !isSelected ? 'bg-gray-200 dark:bg-slate-700' : ''
                          }`}
                      >
                        <ProfilePicture
                          user={data}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <div className="text-sm font-medium truncate max-w-[140px]">
                          {data.label || ''}
                        </div>
                      </div>
                    );
                  },
                  SingleValue: (props) => {
                    const { data } = props;
                    return (
                      <components.SingleValue {...props}>
                        <div className="flex items-center gap-2">
                          <ProfilePicture
                            user={data}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-sm font-medium truncate">
                            {data.label || ''}
                          </span>
                        </div>
                      </components.SingleValue>
                    );
                  },
                }}
                styles={customStyles}
              />
            </div>

            {/* Date Picker */}
            <div className="relative w-full">
              <Flatpickr
                className="w-full h-[38px] cursor-pointer p-2 bg-white dark:bg-slate-700 border border-neutral-50 dark:border-slate-600 rounded-md text-sm"
                value={
                  parsedStartDate && parsedEndDate
                    ? [parsedStartDate, parsedEndDate]
                    : parsedStartDate
                      ? [parsedStartDate]
                      : ''
                }
                onChange={handleValueChange}
                options={{
                  mode: 'range',
                  dateFormat: 'd-m-Y',
                  allowInput: false,
                  clickOpens: true,
                  placeholder: 'Select date range',
                  showMonths: 1,
                  static: false,
                  position: 'below'
                }}
                placeholder="Select date range"
              />
              <Icon
                icon="cuida:calendar-outline"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
          <Button
            onClick={handleResetFilters}
            text="Reset"
            className="h-[38px] w-20 px-2 md:px-3 lg:px-5 text-xs md:text-xs lg:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 ms-auto"
          />
        </div>

        {/* Summary Cards */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className="border-2 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {reportData.totalTimeSpent || '00:00'}
                </div>
                <div className="w-8 h-8 bg-electricBlue-50/20 rounded-full flex items-center justify-center">
                  <Icon icon="heroicons:clock" className="w-5 h-5 text-electricBlue-50" />
                </div>
              </div>
              <div className="text-sm text-electricBlue-50 font-bold mt-1">Total Time</div>
            </div>

            <div className="border-2 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {calculateAutomateTime(reportData?.totalTimeSpent, reportData?.totalManualTimeSpent) || '00:00'}
                </div>
                <div className="w-8 h-8 bg-electricBlue-50/20 rounded-full flex items-center justify-center">
                  <Icon icon="tabler:clock-play" className="w-5 h-5 text-electricBlue-50" />
                </div>
              </div>
              <div className="text-sm text-electricBlue-50 font-bold mt-1">Automate Time</div>
            </div>

            <div className="border-2 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {reportData.totalManualTimeSpent || '00:00'}
                </div>
                <div className="w-8 h-8 bg-electricBlue-50/20 rounded-full flex items-center justify-center">
                  <Icon icon="tabler:clock-plus" className="w-5 h-5 text-electricBlue-50" />
                </div>
              </div>
              <div className="text-sm text-electricBlue-50 font-bold mt-1">Manual Time</div>
            </div>

            <div className="border-2 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {reportData.totalTasks || 0}
                </div>
                <div className="w-8 h-8 bg-electricBlue-50/20 rounded-full flex items-center justify-center">
                  <Icon icon="icon-park-outline:view-list" className="w-5 h-5 text-electricBlue-50" />
                </div>
              </div>
              <div className="text-sm text-electricBlue-50 font-bold mt-1">Total Tasks</div>
            </div>

            <div className="border-2 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {reportData.totalCompletedTasks || 0}
                </div>
                <div className="w-8 h-8 bg-electricBlue-50/20 rounded-full flex items-center justify-center">
                  <Icon icon="fluent:tasks-app-28-regular" className="w-5 h-5 text-electricBlue-50" />
                </div>
              </div>
              <div className="text-sm text-electricBlue-50 font-bold mt-1">Tasks Completed</div>
            </div>
          </div>
        )}

        {userInfo?.isAdmin && (
          <div className="flex space-x-4 border-b my-4">
            <button
              className={`text-sm font-semibold border-b-2 pb-1 flex items-center gap-1 ${activeTab === 'taskSummary' ? 'border-electricBlue-50 text-electricBlue-50' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('taskSummary')}
            >
              <Icon icon="fluent:tasks-app-28-regular" />
              Task Summary
            </button>
            <button
              className={`text-sm font-semibold border-b-2 pb-1 flex items-center gap-1 ${activeTab === 'employeeSummary' ? 'border-electricBlue-50 text-electricBlue-50' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('employeeSummary')}
            >
              <Icon icon="flowbite:users-group-outline" />
              Users Summary
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center justify-end sm:justify-between mt-6 flex-wrap ">
          <div className="relative">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search Tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-neutral-50 rounded-md text-sm focus:outline-none focus:border-electricBlue-50"
            />
          </div>
          {
            activeTab === "taskSummary" &&
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button
                className="px-3 py-2 bg-electricBlue-50 text-white rounded-md text-sm font-medium hover:bg-electricBlue-100 transition-colors flex items-center gap-2"
                title='Download Report in CSV'
                onClick={downloadCSV}
              >
                <Icon icon="heroicons:arrow-down-tray" className="w-5 h-5" />
              </button>
              <button
                className="px-3 py-2 bg-electricBlue-50 text-white rounded-md text-sm font-medium hover:bg-electricBlue-100 transition-colors flex items-center gap-2"
                title='Send Report via Email'
                onClick={() => setIsEmailModalOpen(true)}
              >
                <Icon icon="mingcute:mail-send-fill" className="w-5 h-5" />
              </button>
            </div>
          }
        </div>

        {/* Task Summary Table */}
        {activeTab === "taskSummary" && (
          <TaskSummaryTable
            loading={loading}
            getTableProps={getTableProps}
            getTableBodyProps={getTableBodyProps}
            headerGroups={headerGroups}
            rows={rows}
            prepareRow={prepareRow}
            columns={columns}
            totalPages={totalPages}
            renderPagination={renderPagination}
          />
        )}

        {/* Employee Summary Table */}
        {activeTab === "employeeSummary" && userInfo?.isAdmin &&
          <EmployeeSummaryTable
            selectedProject={selectedProject}
            selectedUser={selectedUser}
            value={value}
            userInfo={userInfo}
          />
        }
      </div>

      {/* Email Modal */}
      <Modal
        activeModal={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Send Timesheet Report"
        className="max-w-2xl rounded-xl shadow-lg border border-neutral-50"
        footerContent={
          <>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
              onClick={() => setIsEmailModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-electricBlue-50 text-white rounded-md text-sm font-medium hover:bg-electricBlue-100 transition-colors flex items-center gap-2"
              onClick={sendEmailWithCSV}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Email'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">Enter the email address where you want to send the timesheet report.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && email && !isSending) {
                  sendEmailWithCSV();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-electricBlue-50 focus:border-electricBlue-50"
              placeholder="Enter email address"
            />
          </div>
        </div>
      </Modal>

      {/* Task Panel Modal */}
      {isTaskPanelOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black-500/70 backdrop-blur-sm w-full h-screen">
          <div
            className="w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {taskLoading ? (
              <TaskPanelSkeleton from="dashboard" />
            ) : Object.keys(selectedTask).length > 0 ? (
              <TaskPanel
                task={selectedTask}
                isOpen={true}
                projects={projects}
                onClose={closeTaskPanel}
                onUpdateCommentCount={handleCommentCountUpdate}
                handleAttachmentOpen={handleAttachmentOpen}
                setAttachmentsForView={setAttachmentsForView}
                isAttachmentViewerOpen={isAttachmentViewerOpen}
                from="dashboard"
                setTask={setSelectedTask}
                updateTaskFields={handleTaskUpdate}
              />
            ) : (
              <div className="p-8 text-center">
                <div className="text-red-500 mb-2">
                  <Icon icon="heroicons-outline:exclamation-triangle" className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Task Not Found</h3>
                <p className="text-gray-500 dark:text-slate-400 mb-4">We couldn't find the details for this task.</p>
                <button
                  onClick={closeTaskPanel}
                  className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attachment Viewer */}
      {isAttachmentViewerOpen && (
        <AttachmentViewer
          attachments={attachmentsForView && attachmentsForView}
          initialIndex={currentAttachment}
          open={isAttachmentViewerOpen}
          onClose={() => setIsAttachmentViewerOpen(false)}
        />
      )}
    </>
  );
};

export default index;