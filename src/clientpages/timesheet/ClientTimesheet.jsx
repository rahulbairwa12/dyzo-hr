import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Select from "react-select";
import { fetchAuthGET, fetchAuthFilePost } from "@/store/api/apiSlice";
import { djangoBaseURL, isAdmin } from "@/helper";
import moment from "moment";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import CustomModal from "@/components/ui/CustomModal";
import Textinput from "@/components/ui/Textinput";
import { useEmployeeAuth } from "@/context/EmployeeContext";
import { useLocation, useNavigate } from "react-router-dom";
import ReportOverview from "@/pages/reports/client/ReportOverview";
import TimeSheetTable from "@/pages/reports/timesheet/TimeSheetTable";

const ClientTimesheet = () => {
  const userInfo = useSelector((state) => state.auth.user);
  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(location.search);

  const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
  const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");

  const [startDate, setStartDate] = useState(
    urlParams.get("startDate") || startOfMonth
  );
  const [endDate, setEndDate] = useState(
    urlParams.get("endDate") || endOfMonth
  );
  const [projects, setProjects] = useState([]);
  const [employeeLists, setEmployeeLists] = useState([]);
  const [selectedProject, setSelectedProject] = useState(
    urlParams.get("projectId") || "0"
  );
  const [CurrentUserId, setCurrentUserId] = useState(
    urlParams.get("employeeId") || "0"
  );
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(
    urlParams.get("timePeriod") || "month"
  );
  const [isCustomDateRange, setIsCustomDateRange] = useState(
    selectedTimePeriod === "custom"
  );
  const [screenshotAllow, setScreenshotAllow] = useState(false);
  const [tasksData, setTasksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [totalPageOfTable, setTotalPageOfTable] = useState(0);
  const [currentPageOfTable, setCurrentPageOfTable] = useState(0);
  const [totalEntriesOfTable, setTotalEntriesOfTable] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const formattedDateRange = formatDateRangeDisplay(startDate, endDate);
  const [downloading, setDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { employeeList } = useEmployeeAuth();
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Only render if user is a client
  if (userInfo?.user_type !== "client") {
    return null;
  }

  const updateURLParams = (newParams = {}) => {
    const params = new URLSearchParams(location.search);
    Object.entries(newParams).forEach(([key, value]) => {
      params.set(key, value);
    });
    navigate({ search: params.toString() });
  };

  // Fetch Projects
  const getAllProjects = async () => {
    try {
      const data = await fetchAuthGET(
        `${djangoBaseURL}/api/client/${userInfo?._id}/projects/`
      );
      if (data.status) {
        setProjects(data.projects);
      }
    } catch (error) {
      setProjects([]);
    }
  };

  useEffect(() => {
    if (userInfo !== undefined) {
      getAllProjects();
    }
  }, [userInfo?.companyId]);

  // Project Options
  const projectOptions = [
    { value: "0", label: "All Projects" },
    ...projects.map((project) => ({
      value: project._id.toString(),
      label: project.name,
    })),
  ];

  const handleProjectChange = (selectedOption) => {
    setSelectedProject(selectedOption.value);
    updateURLParams({ projectId: selectedOption.value });
  };

  const handleEmployeeChange = (selectedOption) => {
    setCurrentUserId(selectedOption.value);
    updateURLParams({ employeeId: selectedOption.value });
  };

  useEffect(() => {
    if (employeeList) {
      setEmployeeLists(employeeList);
    }
  }, [employeeList]);

  useEffect(() => {
    if (employeeLists.length > 0 && CurrentUserId === "0") {
      setCurrentUserId("0"); // Default to "All Employees" if no specific employee is selected
    }
  }, [employeeLists]);

  const userOptions = [
    { value: "0", label: "All Employees" }, // Add "All Employees" option
    ...employeeLists?.map((user) => ({
      value: user?._id?.toString(),
      label: user.name,
      image: user.profile_picture,
    })),
  ];

  const handleTimePeriodChange = (selectedOption) => {
    const timePeriod = selectedOption.value;
    setSelectedTimePeriod(timePeriod);

    let newStartDate, newEndDate;
    if (timePeriod === "custom") {
      setIsCustomDateRange(true);
      newStartDate = startDate || moment().format("YYYY-MM-DD");
      newEndDate = endDate || moment().format("YYYY-MM-DD");
    } else {
      setIsCustomDateRange(false);
      switch (timePeriod) {
        case "day":
          newStartDate = moment().format("YYYY-MM-DD");
          newEndDate = moment().format("YYYY-MM-DD");
          break;
        case "week":
          newStartDate = moment().startOf("week").format("YYYY-MM-DD");
          newEndDate = moment().endOf("week").format("YYYY-MM-DD");
          break;
        case "month":
          newStartDate = moment().startOf("month").format("YYYY-MM-DD");
          newEndDate = moment().endOf("month").format("YYYY-MM-DD");
          break;
        case "year":
          newStartDate = moment().startOf("year").format("YYYY-MM-DD");
          newEndDate = moment().endOf("year").format("YYYY-MM-DD");
          break;
        default:
          newStartDate = startOfMonth;
          newEndDate = endOfMonth;
      }
      setStartDate(newStartDate);
      setEndDate(newEndDate);
    }

    // Update the URL with the new time period
    updateURLParams({
      timePeriod: timePeriod,
      startDate: newStartDate,
      endDate: newEndDate,
    });
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    updateURLParams({ startDate: e.target.value });
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    updateURLParams({ endDate: e.target.value });
  };

  const timePeriodOptions = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "year", label: "Year" },
    { value: "custom", label: "Custom" },
  ];

  const fetchTasksData = async (url) => {
    setLoading(true);
    try {
      const response = await fetchAuthGET(url);
      if (response.data.length === 0) {
        setTasksData([]);
      } else {
        setTasksData(response.data);
      }
      setNextPage(response.next_page_url);
      setPrevPage(response.prev_page_url);
      setCurrentPageOfTable(response.current_page);
      setTotalPageOfTable(response.total_pages);
      setTotalEntriesOfTable(response.total_items);
      setReportData({
        totalTasks: response.totalTasks,
        totalTimeSpent: response.totalTimeSpent,
        totalManualTimeSpent: response.totalManualTimeSpent,
        totalCompletedTasks: response.totalCompletedTasks,
      });
    } catch (error) {
      setTasksData([]);
      setReportData(null);
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };

  const fetchDataByTaskName = async () => {
    let url = `${djangoBaseURL}/api/client/${userInfo?._id}/tasks/summary-detail/?startDate=${startDate}&endDate=${endDate}&taskName=${searchQuery}`;
    if (selectedProject !== "0") {
      url += `&projectId=${selectedProject}`;
    }
    if (CurrentUserId !== "0") {
      url += `&employeeId=${CurrentUserId}`;
    }
    fetchTasksData(url);
  };

  const debounce = (func, delay = 500) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const debouncedFetchTasksData = debounce(fetchDataByTaskName, 300);

  useEffect(() => {
    debouncedFetchTasksData();
  }, [searchQuery, startDate, endDate, selectedProject, CurrentUserId]);

  const handlePageChange = (url) => {
    if (url) {
      fetchTasksData(url);
    }
  };

  const handlePageInputSubmit = (pageNumber) => {
    let url = `${djangoBaseURL}/api/tasks/summary-detail/${userInfo?.companyId}/?startDate=${startDate}&endDate=${endDate}&page=${pageNumber}`;
    if (selectedProject !== "0") {
      url += `&projectId=${selectedProject}`;
    }
    if (CurrentUserId !== "0") {
      url += `&employeeId=${CurrentUserId}`;
    }
    fetchTasksData(url);
  };

  useEffect(() => {
    if (userInfo?.companyId !== undefined) {
      getCompany();
    }
  }, [userInfo?.companyId]);

  const getCompany = async () => {
    try {
      setLoading(true);
      const data = await fetchAuthGET(
        `${djangoBaseURL}/company/${userInfo?.companyId}/`
      );
      if (data.status) {
        setScreenshotAllow(data.Screenshot_module);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousDate = () => {
    let newStartDate, newEndDate;
    switch (selectedTimePeriod) {
      case "day":
        newStartDate = moment(startDate)
          .subtract(1, "days")
          .format("YYYY-MM-DD");
        newEndDate = moment(endDate).subtract(1, "days").format("YYYY-MM-DD");
        break;
      case "week":
        newStartDate = moment(startDate)
          .subtract(1, "weeks")
          .format("YYYY-MM-DD");
        newEndDate = moment(endDate).subtract(1, "weeks").format("YYYY-MM-DD");
        break;
      case "month":
        newStartDate = moment(startDate)
          .subtract(1, "months")
          .format("YYYY-MM-DD");
        newEndDate = moment(endDate).subtract(1, "months").format("YYYY-MM-DD");
        break;
      case "year":
        newStartDate = moment(startDate)
          .subtract(1, "years")
          .format("YYYY-MM-DD");
        newEndDate = moment(endDate).subtract(1, "years").format("YYYY-MM-DD");
        break;
      default:
        return;
    }
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };
  const goToNextDate = () => {
    let newStartDate, newEndDate;
    switch (selectedTimePeriod) {
      case "day":
        newStartDate = moment(startDate).add(1, "days").format("YYYY-MM-DD");
        newEndDate = moment(endDate).add(1, "days").format("YYYY-MM-DD");
        break;
      case "week":
        newStartDate = moment(startDate).add(1, "weeks").format("YYYY-MM-DD");
        newEndDate = moment(endDate).add(1, "weeks").format("YYYY-MM-DD");
        break;
      case "month":
        newStartDate = moment(startDate).add(1, "months").format("YYYY-MM-DD");
        newEndDate = moment(endDate)
          .add(1, "months")
          .endOf("month")
          .format("YYYY-MM-DD");
        break;
      case "year":
        newStartDate = moment(startDate).add(1, "years").format("YYYY-MM-DD");
        newEndDate = moment(endDate).add(1, "years").format("YYYY-MM-DD");
        break;
      default:
        return;
    }
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  function formatDateRangeDisplay(startDate, endDate) {
    const options = { month: "short", day: "numeric" };
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (startDate === endDate) {
      return `${new Intl.DateTimeFormat("en-US", options).format(
        start
      )} ${start.getFullYear()}`;
    }
    const startFormat = new Intl.DateTimeFormat("en-US", options).format(start);
    const endFormat = endDate
      ? `${new Intl.DateTimeFormat("en-US", options).format(
        end
      )}, ${end.getFullYear()}`
      : "";
    return `${startFormat} to ${endFormat}`;
  }

  // Function to fetch all paginated data
  const fetchAllTasksData = async (url) => {
    let allData = [];
    let currentPage = 1;
    let totalPages = 1;
    let fetchUrl = `${url}&page=${currentPage}`;

    try {
      while (currentPage <= totalPages) {
        const response = await fetchAuthGET(fetchUrl);
        if (response.data) {
          allData = [...allData, ...response.data];
          currentPage = response.current_page + 1;
          totalPages = response.total_pages;
          fetchUrl = `${url}&page=${currentPage}`;
        } else {
          break;
        }
      }
    } catch (error) {
      console.error("Error fetching all data:", error);
    }

    return allData;
  };

  // Function to download CSV
  const downloadCSV = async () => {
    setDownloading(true);

    let url = `${djangoBaseURL}/api/tasks/summary-detail-download/${userInfo?.companyId}/?startDate=${startDate}&endDate=${endDate}&taskName=${searchQuery}`;
    if (selectedProject !== "0") {
      url += `&projectId=${selectedProject}`;
    }
    if (CurrentUserId !== "0") {
      url += `&employeeId=${CurrentUserId}`;
    }

    const allTasksData = await fetchAllTasksData(url);

    // Prepare CSV data
    const csvData = allTasksData.map((task) => ({
      "Tasks Name": task.taskName,
      "Task Position": task.taskPosition,
      "Is Complete": task.isComplete,
      "Total Time (HH:MM)": task.totalTimeSpent,
      "Manual Time (HH:MM)": task.manual_seconds,
      "Project Name": task.projectName,
      "Total Time (Decimal)": task.totalTimeSpentInDecimal,
      "Manual Time (Decimal)": task.manual_seconds,
      "Working Users": task.workingEmployees
        .map((emp) => emp.name)
        .join(", "),
    }));

    // Convert to CSV
    const csv = Papa.unparse(csvData);

    // Create a Blob from the CSV and save it
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const projectName =
      projects.find((project) => project._id.toString() === selectedProject)
        ?.name || "AllProjects";
    const fileName = `${projectName}_${startDate}_to_${endDate}_Timesheet.csv`;
    saveAs(blob, fileName);

    setDownloading(false);
  };

  // Function to send email with CSV attachment
  const downloadAndSendEmail = async (email) => {
    setIsModalOpen(false);
    toast.warn(`Sharing sheet in progress.`);
    let url = `${djangoBaseURL}/api/tasks/summary-detail-download/${userInfo?.companyId}/?startDate=${startDate}&endDate=${endDate}`;
    if (selectedProject !== "0") {
      url += `&projectId=${selectedProject}`;
    }
    if (CurrentUserId !== "0") {
      url += `&employeeId=${CurrentUserId}`;
    }

    const allTasksData = await fetchAllTasksData(url);

    // Prepare CSV data
    const csvData = allTasksData.map((task) => ({
      "Tasks Name": task.taskName,
      "Task Position": task.taskPosition,
      "Is Complete": task.isComplete,
      "Total Time (HH:MM)": task.totalTimeSpent,
      "Manual Time (HH:MM)": task.manual_seconds,
      "Project Name": task.projectName,
      "Total Time (Decimal)": task.totalTimeSpentInDecimal,
      "Manual Time (Decimal)": task.manual_seconds,
      "Working Users": task.workingEmployees
        .map((emp) => emp.name)
        .join(", "),
    }));

    // Convert to CSV
    const csv = Papa.unparse(csvData);

    // Generate a file name
    const projectName =
      projects.find((project) => project._id.toString() === selectedProject)
        ?.name || "AllProjects";
    const fileName = `${projectName}_${startDate}_to_${endDate}_Timesheet.csv`;

    // Prepare form data
    const formData = new FormData();
    formData.append("email", email);
    formData.append("csvData", csv);
    formData.append("csvFileName", fileName);
    formData.append("subject", "Timesheet Report(via Dyzo)");
    formData.append("body", "Please find the attached timesheet report.");

    try {
      const result = await fetchAuthFilePost(
        `${djangoBaseURL}/send-email-with-csv-attachment/`,
        { body: formData }
      );

      if (result.status === 1) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error sending email");
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      downloadAndSendEmail(email);
    } else {
      toast.error("Please enter a valid email address");
    }
  };

  return (
    <main>
      <nav className="py-2 flex justify-end gap-2">
        <Button
          icon="foundation:download"
          className="btn-primary"
          isLoading={downloading}
          onClick={downloadCSV}
        />
        <CustomModal
          activeModal={isModalOpen}
          buttonIcon="ri:mail-send-fill"
          labelClass="btn-primary"
          themeClass="bg-primary-500"
          title="Send Timesheet Report"
          uncontrol
        >
          <h4 className="font-medium text-lg mb-3 text-slate-900">
            Send Report via Email
          </h4>
          <form onSubmit={handleEmailSubmit}>
            <Textinput
              label="Email"
              id="email"
              type="email"
              placeholder="Enter email"
              error={errorMessage}
              msgTooltip
              onChange={handleEmailChange}
            />
            <Button
              text="Send Mail"
              type="submit"
              className="btn-primary mt-4"
            />
          </form>
        </CustomModal>
      </nav>
      <section className="pb-4 sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="relative py-1 md:py-0">
          <Select
            value={projectOptions.find(
              (option) => option.value === selectedProject
            )}
            onChange={handleProjectChange}
            options={projectOptions}
            className="absolute ltr:right-0 rtl:left-0 origin-top-right  border border-slate-100
            rounded bg-white dark:bg-slate-800 dark:border-slate-700 shadow-dropdown min-w-[260px]"
            classNamePrefix="select"
            placeholder="Select Project"
            isSearchable={true}
            noOptionsMessage={() => "No projects available"}
          />
        </div>
        <div className="relative py-1 md:py-0">
          <Select
            value={userOptions.find((option) => option.value === CurrentUserId)}
            onChange={handleEmployeeChange}
            options={userOptions}
            className="absolute ltr:right-0 rtl:left-0 origin-top-right  border border-slate-100
            rounded bg-white dark:bg-slate-800 dark:border-slate-700 shadow-dropdown min-w-[260px]"
            classNamePrefix="select"
            placeholder="Select Employee"
            isSearchable={true}
            noOptionsMessage={() => "No employees available"}
          />
        </div>
        <div className="relative py-1 md:py-0">
          <Select
            value={timePeriodOptions.find(
              (option) => option.value === selectedTimePeriod
            )}
            onChange={handleTimePeriodChange}
            options={timePeriodOptions}
            className="absolute ltr:right-0 rtl:left-0 origin-top-right  border border-slate-100
            rounded bg-white dark:bg-slate-800 dark:border-slate-700 shadow-dropdown min-w-[260px]"
            classNamePrefix="select"
            placeholder="Select Time Period"
            isSearchable={true}
            noOptionsMessage={() => "No time periods available"}
          />
        </div>
        <div
          className="relative py-[12px] mt-1 sm:mt-0 md:py-0 bg-white dark:bg-slate-800 border border-slate-100
         min-w-[260px] dark:border-slate-700 flex items-center justify-between shadow-md rounded-sm"
        >
          <div className="flex items-center justify-between">
            {selectedTimePeriod !== "custom" && (
              <button
                onClick={goToPreviousDate}
                className="flex items-center justify-center"
              >
                <Icon icon="mi:chevron-left" className="w-5 h-5" />
              </button>
            )}
            <span className="text-[12px] px-2">{formattedDateRange}</span>
            {selectedTimePeriod !== "custom" && (
              <button
                onClick={goToNextDate}
                className="flex items-center justify-center"
              >
                <Icon icon="mi:chevron-right" className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {isCustomDateRange && (
        <section className="pb-4 sm:flex gap-4">
          <div className="relative py-1 md:py-0">
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="cursor-pointer block w-full py-2 pl-5 pr-10 text-sm border rounded border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-dropdown appearance-none"
            />
          </div>
          <div className="relative py-1 md:py-0">
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="cursor-pointer block w-full py-2 pl-5 pr-10 text-sm border rounded border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 shadow-dropdown appearance-none"
            />
          </div>
        </section>
      )}

      <ReportOverview
        reportData={reportData}
        loading={loading}
        dataLoading={dataLoading}
      />

      <div className="my-2 w-96">
        <Textinput
          placeholder="Search Tasks ..."
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <TimeSheetTable
        tasksData={tasksData}
        loading={loading}
        dataLoading={dataLoading}
        nextPage={nextPage}
        prevPage={prevPage}
        onPageChange={handlePageChange}
        handlePageInputSubmit={handlePageInputSubmit}
        screenshotAllow={screenshotAllow}
        CurrentUserId={CurrentUserId}
        currentPageOfTable={currentPageOfTable}
        totalPageOfTable={totalPageOfTable}
        totalEntriesOfTable={totalEntriesOfTable}
        selectedProject={selectedProject}
        startDate={startDate}
        endDate={endDate}
        selectedTimePeriod={selectedTimePeriod}
        filterType={`timesheet`}
      />
    </main>
  );
};

export default ClientTimesheet;
