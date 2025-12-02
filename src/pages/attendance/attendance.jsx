import React, { useState, useEffect, Fragment } from "react";
import { Tab } from "@headlessui/react";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import AttendanceTable from "./attendanceTable";
import ExtraInfo from "./ExtraInfo";
import { useSelector } from "react-redux";
import { djangoBaseURL } from "@/helper";
import { toast, ToastContainer } from "react-toastify";
import { fetchAuthGET, fetchGET } from "@/store/api/apiSlice";
import { Icon } from "@iconify/react";
import Card from "@/components/ui/Card";
import Papa from "papaparse";
import CheckInOutTable from "./CheckInOutTable";
import moment from "moment";
import Dropdown from "@/components/ui/Dropdown";
import EmployeeAttendance from "./EmployeeAttendance";
import { useLocation, useNavigate } from "react-router-dom";

// Helper function to sum up time in "HH:MM" format
const sumWorkingHours = (attendance) => {
  let totalMinutes = 0;

  attendance.forEach(({ totalTimeSpent }) => {
    if (totalTimeSpent && totalTimeSpent !== "00:00") {
      const [hours, minutes] = totalTimeSpent.split(":").map(Number);
      totalMinutes += hours * 60 + minutes;
    }
  });

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `${String(totalHours).padStart(2, "0")}:${String(
    remainingMinutes
  ).padStart(2, "0")}`;
};

// Helper function to convert numeric days to names
const getDayNames = (days) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((day) => dayNames[day - 1]).join("-");
};

const Attendance = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.user);

  const [currentMonth, setCurrentMonth] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [holidayData, setHolidayData] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [weekends, setWeekends] = useState([]);
  const [fullDays, setFullDays] = useState([]);
  const [halfDays, setHalfDays] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [extraInfo, setExtraInfo] = useState([]);
  const [extraInfoNextPage, setExtraInfoNextPage] = useState(null);
  const [extraInfoPrevPage, setExtraInfoPrevPage] = useState(null);
  const [extraInfoCurrentPage, setExtraInfoCurrentPage] = useState(1);
  const [extraInfoTotalPages, setExtraInfoTotalPages] = useState(null);
  const [extraInfoTotalCount, setExtraInfoTotalCount] = useState(null);
  const [extraInfoLoading, setExtraInfoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM"));
  const [checkInOutData, setCheckInAndCheckOutLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeAttendanceData, setEmployeeAttendanceData] = useState([]);
  const [employeeAttendanceLoading, setEmployeeAttendanceLoading] =
    useState(false);
  const [employeeAttendanceError, setEmployeeAttendanceError] = useState(null);
  const [holidayCount, setHolidayCount] = useState(0);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonthString = `${year}-${month}`;
    setCurrentMonth(currentMonthString);
    setSelectedMonth(currentMonthString);
    setDaysInMonth(new Date(year, now.getMonth() + 1, 0).getDate());
  }, []);

  // Add this useEffect to handle initial tab from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ["attendance", "extraInfo", "checkinout", "employeeAttendance"];
    
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      setSelectedTabIndex(validTabs.indexOf(tabFromUrl));
    } else {
      // Default to attendance if no valid tab in URL
      setActiveTab("attendance");
      setSelectedTabIndex(0);
      // Optionally update URL to reflect default tab if none was present
      // const newSearchParams = new URLSearchParams(location.search);
      // newSearchParams.set('tab', 'attendance');
      // navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
    }
  }, [location.search]); // Re-run if URL search params change

  // Add this useEffect to handle data fetch when tab is checkinout
  useEffect(() => {
    if (selectedMonth && userInfo?.companyId && activeTab === "checkinout") {
      fetchUserCheckInAndCheckOut();
    }
  }, [selectedMonth, userInfo?.companyId, activeTab]);

  const handleTabChange = (index) => {
    let tabName = "attendance";
    if (index === 0) {
      tabName = "attendance";
    } else if (index === 1) {
      tabName = "extraInfo";
    } else if (index === 2) {
      tabName = "checkinout";
    } else if (index === 3) {
      tabName = "employeeAttendance";
    }
    setActiveTab(tabName);
    setSelectedTabIndex(index);
    
    // Update URL with the new tab
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tabName);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  const handleMonthChange = (event) => {
    const selectedMonth = event.target.value;
    setSelectedMonth(selectedMonth);
    setSelectedDate(moment(selectedMonth).format("YYYY-MM"));
    const [year, month] = selectedMonth.split("-");
    setDaysInMonth(new Date(year, month, 0).getDate());
  };
  const refreshData = async () => {
    await fetchUserCheckInAndCheckOut(); // Refresh data from the API
  };

  const getExtraInfo = async () => {
    setExtraInfoLoading(true);
    let endpoint;
    if (userInfo?.isAdmin) {
      endpoint = `${djangoBaseURL}/api/attendance-extrainfo/${selectedMonth}/${userInfo?.companyId}/`;
    } else {
      endpoint = `${djangoBaseURL}/api/single-employee-extrainfo/${selectedMonth}/${userInfo?._id}/`;
    }
    try {
      const response = await fetchGET(endpoint);
      if (response.status) {
        setExtraInfo(response.data);
        setExtraInfoNextPage(response.next_page_url);
        setExtraInfoPrevPage(response.prev_page_url);
        setExtraInfoCurrentPage(response.current_page);
        setExtraInfoTotalPages(response.total_pages);
        setExtraInfoTotalCount(response.total_items);
      }
    } catch (error) {
      toast.error("Failed to fetch extra info");
    } finally {
      setExtraInfoLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab == "extraInfo") {
      getExtraInfo();
    }
  }, [activeTab]);

  const getExtraInformation = async (url) => {
    setExtraInfoLoading(true);
    try {
      const response = await fetchAuthGET(url);
      if (response.status) {
        setExtraInfo(response.data);
        setExtraInfoNextPage(response.next_page_url);
        setExtraInfoPrevPage(response.prev_page_url);
        setExtraInfoCurrentPage(response.current_page);
        setExtraInfoTotalPages(response.total_pages);
        setExtraInfoTotalCount(response.total_items);
      }
    } catch (error) {
      toast.error("Failed to fetch extra info");
    } finally {
      setExtraInfoLoading(false);
    }
  };

  const handlePageChange = (url) => {
    if (url) {
      getExtraInformation(url);
    }
  };

  const handlePageInputSubmit = (pageNumber) => {
    let url;
    if (userInfo?.isAdmin) {
      url = `${djangoBaseURL}/api/attendance-extrainfo/${selectedMonth}/${userInfo?.companyId}/?page=${pageNumber}`;
    } else {
      url = `${djangoBaseURL}/api/single-employee-extrainfo/${selectedMonth}/${userInfo?._id}/`;
    }
    getExtraInformation(url);
  };

  const getCompanySchedule = async () => {
    try {
      const response = await fetchAuthGET(
        `${djangoBaseURL}/schedule/${userInfo?.companyId}`
      );
      if (response.status) {
        setWeekends(response.weekends);
        setFullDays(response.full_day_hour);
        setHalfDays(response.half_day_hour);
      }
    } catch (error) {
      setWeekends([]);
      setFullDays([]);
      setHalfDays([]);
    }
  };

  useEffect(() => {
    if (userInfo?.companyId) {
      getCompanySchedule();
    }
  }, [userInfo]);

  const fetchAllExtraInfoPages = async () => {
    let allExtraInfo = [];
    let page = 1;
    let url;
    if (userInfo?.isAdmin) {
      url = `${djangoBaseURL}/api/attendance-extrainfo/${selectedMonth}/${userInfo?.companyId}/?page=${page}`;
    } else {
      url = `${djangoBaseURL}/api/single-employee-extrainfo/${selectedMonth}/${userInfo?._id}/?page=${page}`;
    }

    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const response = await fetchAuthGET(url);
        if (response.status) {
          allExtraInfo = [...allExtraInfo, ...response.data];
          url = response.next_page_url;
          hasNextPage = !!url;
        } else {
          hasNextPage = false;
        }
      } catch (error) {
        toast.error("Failed to fetch extra info");
        hasNextPage = false;
      }
    }
    return allExtraInfo;
  };

  const fetchAllAttendanceData = async (companyId, selectedMonth) => {
    let allAttendance = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      try {
        const response = await fetchGET(
          `${djangoBaseURL}/api/employee-pagination-attendance/${companyId}/?year_month=${selectedMonth}&page=${page}`
        );
        if (response.status) {
          allAttendance = allAttendance.concat(response.data);
          hasNext = response.pagination.hasNext;
          page = response.pagination.currentPage + 1;
        } else {
          hasNext = false;
        }
      } catch (error) {
        toast.error("Failed to fetch complete attendance data.");
        hasNext = false;
      }
    }
    return allAttendance;
  };

  const fetchUserCheckInAndCheckOut = async () => {
    if (!selectedMonth || !userInfo?.companyId) return; // Add this check
    setLoading(true);
    try {
      let checkInAndOutDate;
      const [year, month] = selectedMonth.split("-");
      const formattedMonth = `${month}-${year}`;

      checkInAndOutDate = await fetchGET(
        `${djangoBaseURL}/api/company/month-attendance/?company_id=${userInfo.companyId}&month=${formattedMonth}`,
        false
      );

      if (checkInAndOutDate.length > 0) {
        if (!userInfo.isAdmin) {
          const userSpecificData = checkInAndOutDate.filter(
            (entry) => entry.employee._id === userInfo._id
          );
          setCheckInAndCheckOutLogs(userSpecificData);
        } else {
          setCheckInAndCheckOutLogs(checkInAndOutDate);
        }
      } else {
        setCheckInAndCheckOutLogs([]);
      }
    } catch (error) {
      toast.error("Failed to fetch Check-In/Out logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "checkinout") {
      fetchUserCheckInAndCheckOut();
    } else if (activeTab === "employeeAttendance") {
      // If we already have checkInOutData, use it directly
      if (checkInOutData && checkInOutData.length > 0) {
        const processedData = processEmployeeAttendanceData(checkInOutData);
        setEmployeeAttendanceData(processedData);
      } else {
        // Otherwise fetch the data
        fetchEmployeeAttendanceData();
      }
    }
  }, [activeTab]);

  const handleTimeAttendance = async () => {
    setDownloading(true);
    let csvData = [];
    let headers = [];

    if (activeTab === "attendance") {
      const allAttendanceData = await fetchAllAttendanceData(
        userInfo?.companyId,
        selectedMonth
      );
      headers = [
        "Employee Name",
        ...Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`),
        "Total Working Hours",
      ];

      csvData = allAttendanceData.map((employee) => {
        const row = {
          "Employee Name": employee.employeeName,
          "Total Working Hours": sumWorkingHours(employee.attendance),
        };
        employee.attendance.forEach((att) => {
          row[`Day ${att.dayNumber}`] = att.totalTimeSpent;
        });
        return row;
      });
    } else if (activeTab === "extraInfo") {
      headers = ["Name"];
      if (extraInfo.length > 0) {
        const daysInMonth = extraInfo[0].working_hours.length;
        for (let day = 1; day <= daysInMonth; day++) {
          const date = extraInfo[0].working_hours[day - 1].date;
          headers.push(`${date} START`, `${date} END`, `${date} HOURS`);
        }
      }

      const allExtraInfo = await fetchAllExtraInfoPages();

      csvData = allExtraInfo.map((employee) => {
        let rowData = {
          Name: employee.name,
        };
        employee.working_hours.forEach((work, index) => {
          rowData[`${work.date} START`] = work.started_at;
          rowData[`${work.date} END`] = work.ended_at;
          rowData[`${work.date} HOURS`] = work.total_hours;
        });
        return rowData;
      });
    } else if (activeTab === "checkinout") {
      headers = ["Name"];
      if (checkInOutData.length > 0) {
        const sampleAttendance = checkInOutData[0].attendance_info || [];
        sampleAttendance.forEach((entry) => {
          const date = entry.date;
          headers.push(
            `${date} CHECKIN`,
            `${date} CHECKOUT`,
            `${date} DISTANCE`,
            `${date} TOTAL HOURS`
          );
        });
      }

      // Create one row per employee
      csvData = checkInOutData.map((employeeData) => {
        const { employee, attendance_info } = employeeData;
        let row = { Name: employee.name };

        attendance_info.forEach((dayInfo) => {
          let checkinTime = "";
          let checkoutTime = "";
          let distance = "";
          let totalHours = "";

          if (dayInfo.attendance_logs && dayInfo.attendance_logs.length > 0) {
            const logs = dayInfo.attendance_logs;
            // Use the moment library to format the check-in and check-out times
            checkinTime = logs[0].checkin_timestamp
              ? moment(logs[0].checkin_timestamp).format("h:mm A")
              : "";
            const lastLogWithCheckout = logs
              .slice()
              .reverse()
              .find((log) => log.checkout_timestamp);
            checkoutTime =
              lastLogWithCheckout && lastLogWithCheckout.checkout_timestamp
                ? moment(lastLogWithCheckout.checkout_timestamp).format(
                    "h:mm A"
                  )
                : "";
            // For distance, you might sum or choose the first value.
            distance = logs[0].checkin_distance || "";
            if (
              logs[0].checkin_timestamp &&
              lastLogWithCheckout &&
              lastLogWithCheckout.checkout_timestamp
            ) {
              const diffMs =
                new Date(lastLogWithCheckout.checkout_timestamp) -
                new Date(logs[0].checkin_timestamp);
              totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
            }
          }

          row[`${dayInfo.date} CHECKIN`] = checkinTime;
          row[`${dayInfo.date} CHECKOUT`] = checkoutTime;
          row[`${dayInfo.date} DISTANCE`] = distance;
          row[`${dayInfo.date} TOTAL HOURS`] = totalHours;
        });
        return row;
      });
    } else {
      setDownloading(true);
      csvData = [];
      headers = [
        "Employee Name",
        "Total Working Days",
        "Total Present",
        "Total Half Days",
        "Total Absent",
      ];

      let totalPresent = 0;
      let totalAbsent = 0;
      let totalHalfDay = 0;
      let totalWorkingDays = 0;

      const yearMonth = selectedMonth;
      const currentDate = new Date().toISOString().split("T")[0];

      const isHoliday = (day) =>
        holidayData.some(
          (holiday) =>
            holiday.date === `${yearMonth}-${String(day).padStart(2, "0")}`
        );
      const isWorkingDay = (day) =>
        !isWeekend(day, yearMonth) && !isHoliday(day);

      const [fullHours, fullMinutes, fullSeconds] = fullDays
        .split(":")
        .map(Number);
      const fullDayInHours = fullHours + fullMinutes / 60 + fullSeconds / 3600;

      const [halfHours, halfMinutes, halfSeconds] = halfDays
        .split(":")
        .map(Number);
      const halfDayInHours = halfHours + halfMinutes / 60 + halfSeconds / 3600;

      const allExtraInfo = await fetchAllExtraInfoPages();

      csvData = allExtraInfo.map((employee) => {
        let presentCount = 0;
        let halfDayCount = 0;
        let absentCount = 0;
        let workingDaysCount = 0;

        employee.working_hours.forEach((work) => {
          const {
            total_hours,
            started_at: start,
            ended_at: end,
            date,
          } = work || {};

          const workingDay = new Date(date).toISOString().split("T")[0];

          if (workingDay > currentDate) return;

          const dayNumber = new Date(date).getDate();

          if (isWorkingDay(dayNumber)) {
            workingDaysCount++;

            const [workedHours, workedMinutes] = (total_hours || "00:00")
              .split(":")
              .map(Number);
            const totalWorkedHours = workedHours + workedMinutes / 60;

            if (!total_hours || totalWorkedHours === 0) {
              absentCount++;
            } else if (
              totalWorkedHours > 0 &&
              totalWorkedHours <= fullDayInHours
            ) {
              halfDayCount++;
            } else if (totalWorkedHours > fullDayInHours) {
              presentCount++;
            }
          }
        });

        totalPresent += presentCount;
        totalAbsent += absentCount;
        totalHalfDay += halfDayCount;
        totalWorkingDays += workingDaysCount;
        return {
          "Employee Name": employee.name,
          "Total Working Days": workingDaysCount,
          "Total Present": presentCount,
          "Total Half Days": halfDayCount,
          "Total Absent": absentCount,
        };
      });

      // Add totals row
      csvData.push({
        "Employee Name": "Total",
        "Total Working Days": totalWorkingDays,
        "Total Present": totalPresent,
        "Total Half Days": totalHalfDay,
        "Total Absent": totalAbsent,
      });
    }

    const csv = Papa.unparse({ fields: headers, data: csvData });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${selectedMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloading(false);
  };

  const isWeekend = (day, yearMonth) => {
    const date = new Date(`${yearMonth}-${String(day).padStart(2, "0")}`);
    const dayOfWeek = date.getDay();
    return weekends.includes(dayOfWeek + 1);
  };
  const isFutureDate = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    return date > today; // Check if the date is in the future
  };

  const handlePresentAbsent = async () => {
    setDownloading(true);
    let csvData = [];
    let headers = [
      "Employee Name",
      "Total Working Days",
      "Total Present",
      "Total Half Days",
      "Total Absent",
      "Total Working Hours",
      "Total Office Hours",
      "Extra Work",
    ];

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalHalfDay = 0;
    let totalWorkingDays = 0;

    const yearMonth = selectedMonth; // assuming selectedMonth is in 'YYYY-MM' format
    const currentDate = new Date(); // Current date for future date comparison

    const isHoliday = (day) => {
      const date = `${yearMonth}-${String(day).padStart(2, "0")}`;
      return holidayData.some((holiday) => holiday.date === date);
    };

    const isWorkingDay = (day, yearMonth) => {
      return !isWeekend(day, yearMonth) && !isHoliday(day);
    };

    const calculateExtraWork = (totalWorkingHours, totalOfficeHours) => {
      const [workingHours, workingMinutes] = totalWorkingHours
        .split(":")
        .map(Number);
      const [officeHours, officeMinutes] = totalOfficeHours
        .split(":")
        .map(Number);

      let totalMinutesWorking =
        (workingHours || 0) * 60 + (workingMinutes || 0);
      let totalMinutesOffice = (officeHours || 0) * 60 + (officeMinutes || 0);

      let diffMinutes = totalMinutesWorking - totalMinutesOffice;
      const sign = diffMinutes >= 0 ? "+" : "-";

      diffMinutes = Math.abs(diffMinutes);

      const diffHours = Math.floor(diffMinutes / 60);
      const remainingMinutes = diffMinutes % 60;

      return `${sign}${String(diffHours).padStart(2, "0")}:${String(
        remainingMinutes
      ).padStart(2, "0")}:00`;
    };

    if (activeTab === "attendance") {
      const allAttendanceData = await fetchAllAttendanceData(
        userInfo?.companyId,
        selectedMonth
      );

      csvData = allAttendanceData.map((employee) => {
        let presentCount = 0;
        let halfDayCount = 0;
        let absentCount = 0;
        let workingDaysCount = 0;
        const totalHours = sumWorkingHours(employee.attendance);

        employee.attendance.forEach((att) => {
          const hours = att.totalTimeSpent;
          const date = `${yearMonth}-${String(att.dayNumber).padStart(2, "0")}`;

          if (isFutureDate(date)) return;

          if (isWorkingDay(att.dayNumber, yearMonth)) {
            workingDaysCount++;
            if (hours >= fullDays) {
              presentCount++;
            } else if (hours >= halfDays && hours < fullDays) {
              halfDayCount++;
            } else {
              absentCount++;
            }
          }
        });

        totalPresent += presentCount;
        totalAbsent += absentCount;
        totalHalfDay += halfDayCount;
        totalWorkingDays += workingDaysCount;

        const totalOfficeHours = `${String(
          workingDaysCount * parseInt(fullDays)
        ).padStart(2, "0")}:00:00`;
        const extraWork = calculateExtraWork(totalHours, totalOfficeHours);

        return {
          "Employee Name": employee.employeeName,
          "Total Working Days": workingDaysCount,
          "Total Working Hours": totalHours,
          "Total Office Hours": totalOfficeHours,
          "Extra Work": extraWork,
          "Total Present": presentCount,
          "Total Half Days": halfDayCount,
          "Total Absent": absentCount,
        };
      });
    } else if (activeTab === "extraInfo") {
      const allExtraInfo = await fetchAllExtraInfoPages();

      const timeStringToMinutes = (timeStr) => {
        if (!timeStr || timeStr === "00:00") return 0;
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const minutesToTimeString = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const paddedHours = String(hours).padStart(2, "0");
        const paddedMinutes = String(minutes).padStart(2, "0");
        return `${paddedHours}:${paddedMinutes}`;
      };

      let grandTotalWorkingMinutesSum = 0; // To accumulate working minutes for all employees
      let grandTotalPresent = 0;
      let grandTotalAbsent = 0;
      let grandTotalHalfDay = 0;
      let grandTotalWorkingDays = 0;

      csvData = allExtraInfo.map((employee) => {
        // Initialize per-employee counters.
        let presentCount = 0;
        let halfDayCount = 0;
        let absentCount = 0;
        let workingDaysCount = 0;

        // Calculate total working minutes for this employee.
        const totalEmployeeMinutes = employee.working_hours.reduce(
          (sum, work) => {
            const { total_hours, date } = work;
            if (isFutureDate(date)) return sum; // Skip future dates

            const dayNumber = new Date(date).getDate();
            if (isWorkingDay(dayNumber, yearMonth)) {
              workingDaysCount++;
              const minutes = timeStringToMinutes(total_hours);

              if (minutes >= timeStringToMinutes(fullDays)) {
                presentCount++;
              } else if (
                minutes >= timeStringToMinutes(halfDays) &&
                minutes < timeStringToMinutes(fullDays)
              ) {
                halfDayCount++;
              } else {
                absentCount++;
              }
            }
            return sum + timeStringToMinutes(total_hours);
          },
          0
        );

        // Accumulate the totals over all employees.
        grandTotalWorkingMinutesSum += totalEmployeeMinutes;
        grandTotalPresent += presentCount;
        grandTotalAbsent += absentCount;
        grandTotalHalfDay += halfDayCount;
        grandTotalWorkingDays += workingDaysCount;

        const officeMinutesPerDay = timeStringToMinutes(fullDays);
        const totalOfficeMinutes = workingDaysCount * officeMinutesPerDay;
        const totalOfficeHours = minutesToTimeString(totalOfficeMinutes);
        const extraWork = calculateExtraWork(
          minutesToTimeString(totalEmployeeMinutes),
          totalOfficeHours
        );

        return {
          "Employee Name": employee.name,
          "Total Working Days": workingDaysCount,
          "Total Present": presentCount,
          "Total Half Days": halfDayCount,
          "Total Absent": absentCount,
          "Total Working Hours": minutesToTimeString(totalEmployeeMinutes),
          "Total Office Hours": totalOfficeHours,
          "Extra Work": extraWork,
        };
      });

      // Add totals row using the accumulated grand totals.
      csvData.push({
        "Employee Name": "Total",
        "Total Working Days": grandTotalWorkingDays,
        "Total Present": grandTotalPresent,
        "Total Half Days": grandTotalHalfDay,
        "Total Absent": grandTotalAbsent,
        "Total Working Hours": minutesToTimeString(grandTotalWorkingMinutesSum),
        "Total Office Hours": "",
        "Extra Work": "",
      });
    } else if (activeTab === "checkinout") {
      // Helper functions:
      const timeStringToMinutes = (timeStr) => {
        if (!timeStr || timeStr === "00:00") return 0;
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
      };

      const minutesToTimeString = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const paddedHours = String(hours).padStart(2, "0");
        const paddedMinutes = String(minutes).padStart(2, "0");
        return `${paddedHours}:${paddedMinutes}`;
      };

      // These thresholds should be defined (for example, "08:00" for full day and "04:00" for half day)
      // In your state, fullDays and halfDays are available.
      // Convert thresholds to minutes.
      const fullDayThreshold = timeStringToMinutes(fullDays); // e.g., 480 minutes for 08:00
      const halfDayThreshold = timeStringToMinutes(halfDays); // e.g., 240 minutes for 04:00

      // Initialize grand totals
      let grandTotalWorkingMinutesSum = 0;
      let grandTotalPresent = 0;
      let grandTotalHalfDay = 0;
      let grandTotalAbsent = 0;
      let grandTotalWorkingDays = 0;

      // Process each employee's checkin/out summary.
      csvData = checkInOutData.map((employeeData) => {
        // Initialize per-employee counters.
        let totalEmployeeMinutes = 0;
        let workingDaysCount = 0;
        let presentCount = 0;
        let halfDayCount = 0;
        let absentCount = 0;

        if (
          employeeData.attendance_info &&
          Array.isArray(employeeData.attendance_info)
        ) {
          employeeData.attendance_info.forEach((dayInfo) => {
            // Check if the day has attendance logs.
            if (
              dayInfo.attendance_logs &&
              Array.isArray(dayInfo.attendance_logs) &&
              dayInfo.attendance_logs.length > 0
            ) {
              // For each day, use the first log's checkin and the last log's checkout
              const logs = dayInfo.attendance_logs;
              const firstLog = logs[0];
              const lastLog = logs
                .slice()
                .reverse()
                .find((log) => log.checkout_timestamp);
              if (firstLog?.checkin_timestamp && lastLog?.checkout_timestamp) {
                // Calculate the time difference for the day.
                const checkinTime = new Date(firstLog.checkin_timestamp);
                const expectedStartTime = new Date(checkinTime);
                expectedStartTime.setHours(8, 0, 0); // 8 AM is start time
                const lateThresholdTime = new Date(checkinTime);
                lateThresholdTime.setHours(8, 20, 0); // 8:20 AM is late threshold

                // Calculate late minutes
                const lateMinutes = Math.round(
                  (checkinTime - expectedStartTime) / (1000 * 60)
                );

                // Calculate working hours
                let workingHours = 0;
                if (lastLog?.checkout_timestamp) {
                  const checkoutTime = new Date(lastLog.checkout_timestamp);
                  const expectedEndTime = new Date(checkoutTime);
                  expectedEndTime.setHours(17, 0, 0); // 5 PM is end time

                  // Calculate total working hours
                  const diffMs = checkoutTime - checkinTime;
                  workingHours = diffMs / (1000 * 60 * 60);
                  totalHours += workingHours;

                  // Check for half day conditions
                  const isHalfDay =
                    // Check-in conditions
                    (checkinTime.getHours() >= 10 &&
                      checkinTime.getHours() <= 12) ||
                    // Working hours conditions
                    (workingHours >= 3 && workingHours <= 5);

                  if (workingHours >= 8) {
                    if (checkinTime <= lateThresholdTime) {
                      // On time check-in
                      onTimeCount++;
                      attendanceDetails.push({
                        date: dayInfo.date,
                        status: "On Time",
                        checkin: checkinTime.toLocaleTimeString(),
                        checkout: "Not Checked Out",
                        workingHours: workingHours.toFixed(2),
                      });
                    } else {
                      // Late check-in
                      lateCount++;
                      attendanceDetails.push({
                        date: dayInfo.date,
                        status: "Late",
                        checkin: checkinTime.toLocaleTimeString(),
                        checkout: "Not Checked Out",
                        lateMinutes: lateMinutes,
                        workingHours: workingHours.toFixed(2),
                      });
                    }
                  } else if (isHalfDay) {
                    // Half day
                    halfDayCount++;
                    attendanceDetails.push({
                      date: dayInfo.date,
                      status: "Half Day",
                      checkin: checkinTime.toLocaleTimeString(),
                      checkout: "Not Checked Out",
                      workingHours: workingHours.toFixed(2),
                    });
                  } else {
                    // Less than half day
                    absentCount++;
                    leaveDetails.push({
                      date: dayInfo.date,
                      type: "Half Day Leave",
                      reason: "Less than 3 hours worked",
                      workingHours: workingHours.toFixed(2),
                    });
                  }
                } else {
                  // No checkout time - check if check-in happened
                  const lastCheckinTime =
                    logs[logs.length - 1].checkin_timestamp;
                  if (lastCheckinTime) {
                    const lastCheckin = new Date(lastCheckinTime);
                    const expectedEndTime = new Date(lastCheckin);
                    expectedEndTime.setHours(endHour, 0, 0);

                    // Calculate working hours from first check-in to expected end time
                    const diffMs = expectedEndTime - checkinTime;
                    const workingHours = diffMs / (1000 * 60 * 60);

                    // Check for half day conditions
                    const isHalfDay =
                      // Check-in conditions
                      (checkinTime.getHours() >= startHour + 3 &&
                        checkinTime.getHours() <= startHour + 5) ||
                      // Working hours conditions
                      (workingHours >= 3 && workingHours <= 5);

                    if (workingHours >= 8) {
                      if (checkinTime <= lateThresholdTime) {
                        // On time check-in
                        onTimeCount++;
                        attendanceDetails.push({
                          date: dayInfo.date,
                          status: "On Time",
                          checkin: checkinTime.toLocaleTimeString(),
                          checkout: "Not Checked Out",
                          workingHours: workingHours.toFixed(2),
                        });
                      } else {
                        // Late check-in
                        lateCount++;
                        attendanceDetails.push({
                          date: dayInfo.date,
                          status: "Late",
                          checkin: checkinTime.toLocaleTimeString(),
                          checkout: "Not Checked Out",
                          lateMinutes: lateMinutes,
                          workingHours: workingHours.toFixed(2),
                        });
                      }
                    } else if (isHalfDay) {
                      // Half day
                      halfDayCount++;
                      attendanceDetails.push({
                        date: dayInfo.date,
                        status: "Half Day",
                        checkin: checkinTime.toLocaleTimeString(),
                        checkout: "Not Checked Out",
                        workingHours: workingHours.toFixed(2),
                      });
                    } else {
                      // Less than half day
                      absentCount++;
                      leaveDetails.push({
                        date: dayInfo.date,
                        type: "Half Day Leave",
                        reason: "Less than 3 hours worked",
                        workingHours: workingHours.toFixed(2),
                      });
                    }
                  } else {
                    // No check-in at all
                    absentCount++;
                    leaveDetails.push({
                      date: dayInfo.date,
                      type: "Full Day Leave",
                      reason: "No Check-in",
                    });
                  }
                }

                workingDaysCount++;
              }
            }
          });
        }

        // Update grand totals.
        grandTotalWorkingMinutesSum += totalEmployeeMinutes;
        grandTotalPresent += presentCount;
        grandTotalHalfDay += halfDayCount;
        grandTotalAbsent += absentCount;
        grandTotalWorkingDays += workingDaysCount;

        return {
          "Employee Name":
            employeeData.employee.name || employeeData.employeeName || "N/A",
          "Total Working Days": workingDaysCount,
          "Total Present": presentCount,
          "Total Half Days": halfDayCount,
          "Total Absent": absentCount,
          "Total Working Hours": minutesToTimeString(totalEmployeeMinutes),
          "Total Office Hours": "", // You may calculate this separately if needed.
          "Extra Work": "", // You may calculate extra work if required.
        };
      });

      // Add totals row using accumulated grand totals.
      csvData.push({
        "Employee Name": "Total",
        "Total Working Days": grandTotalWorkingDays,
        "Total Present": grandTotalPresent,
        "Total Half Days": grandTotalHalfDay,
        "Total Absent": grandTotalAbsent,
        "Total Working Hours": minutesToTimeString(grandTotalWorkingMinutesSum),
        "Total Office Hours": "",
        "Extra Work": "",
      });
    }

    const csv = Papa.unparse({ fields: headers, data: csvData });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${selectedMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloading(false);
  };

  const calculateEmployeeAttendance = async () => {
    setLoading(true);
    try {
      const allAttendanceData = await fetchAllAttendanceData(
        userInfo?.companyId,
        selectedMonth
      );
      const allExtraInfo = await fetchAllExtraInfoPages();

      const employeeStats = allAttendanceData.map((employee) => {
        let onTimeCount = 0;
        let lateCount = 0;
        let halfDayCount = 0;
        let absentCount = 0;
        let workingDaysCount = 0;
        let leaveCount = 0;
        let totalHours = 0;
        let leaveDetails = [];
        let attendanceDetails = [];

        employee.attendance.forEach((att) => {
          const date = `${selectedMonth}-${String(att.dayNumber).padStart(
            2,
            "0"
          )}`;
          if (isFutureDate(date)) return;

          if (isWorkingDay(att.dayNumber, selectedMonth)) {
            workingDaysCount++;
            if (att.totalTimeSpent >= fullDays) {
              onTimeCount++;
            } else if (
              att.totalTimeSpent >= halfDays &&
              att.totalTimeSpent < fullDays
            ) {
              halfDayCount++;
            } else {
              absentCount++;
            }
          }
        });

        // Calculate leaves from extra info
        const employeeExtraInfo = allExtraInfo.find(
          (info) => info.name === employee.employeeName
        );
        if (employeeExtraInfo) {
          leaveCount = employeeExtraInfo.working_hours.filter((work) => {
            const dayNumber = new Date(work.date).getDate();
            return (
              isWorkingDay(dayNumber, selectedMonth) &&
              (!work.total_hours || work.total_hours === "00:00")
            );
          }).length;
        }

        // Calculate late and early leave times
        const lateMinutes = Math.round(
          ((onTimeCount * 0.75 + lateCount * 0.75 + halfDayCount * 0.5) /
            workingDaysCount) *
            60
        );
        const avgLateMinutes =
          lateMinutes > 0 ? Math.round(lateMinutes / lateCount) : 0;

        // Calculate total working hours
        const totalWorkingHours = sumWorkingHours(employee.attendance);
        totalHours =
          totalWorkingHours.split(":")[0] +
          ":" +
          totalWorkingHours.split(":")[1];

        // Calculate attendance percentage
        const totalDays = onTimeCount + lateCount + halfDayCount + leaveCount;
        const attendancePercentage =
          totalDays > 0
            ? (
                ((onTimeCount + lateCount * 0.75 + halfDayCount * 0.5) /
                  totalDays) *
                100
              ).toFixed(2)
            : 0;

        return {
          name: employee.employeeName,
          totalWorkingDays: workingDaysCount,
          onTimeDays: onTimeCount,
          lateDays: lateCount,
          halfDays: halfDayCount,
          absentDays: absentCount,
          leaves: leaveCount,
          leaveDetails: leaveDetails,
          attendanceDetails: attendanceDetails,
          totalHours: totalHours,
          attendancePercentage: attendancePercentage,
          avgLateMinutes: avgLateMinutes,
        };
      });

      setEmployeeAttendanceData(employeeStats);
    } catch (error) {
      //   toast.error("Failed to calculate employee attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "employeeAttendance") {
      calculateEmployeeAttendance();
    }
  }, [activeTab, selectedMonth]);

  // Function to fetch employee attendance data
  const fetchEmployeeAttendanceData = async () => {
    setEmployeeAttendanceLoading(true);
    setEmployeeAttendanceError(null);
    try {
      // Use the existing checkInOutData instead of making a new API call
      if (checkInOutData && checkInOutData.length > 0) {
        const processedData = processEmployeeAttendanceData(checkInOutData);
        setEmployeeAttendanceData(processedData);
      } else {
        // If no data exists, fetch it
        const [year, month] = selectedMonth.split("-");
        const formattedMonth = `${month}-${year}`;

        const attendanceResponse = await fetchGET(
          `${djangoBaseURL}/api/company/month-attendance/?company_id=${userInfo?.companyId}&month=${formattedMonth}`
        );

        if (!attendanceResponse) {
          throw new Error("Failed to fetch attendance data");
        }

        const processedData = processEmployeeAttendanceData(attendanceResponse);
        setEmployeeAttendanceData(processedData);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setEmployeeAttendanceError(error.message);
      toast.error("Failed to fetch employee attendance data");
    } finally {
      setEmployeeAttendanceLoading(false);
    }
  };

  // Function to process attendance data
  const processEmployeeAttendanceData = (attendanceData) => {
    if (!Array.isArray(attendanceData)) {
      return [];
    }

    // Define special shift employees
    const specialShiftEmployees = [
      "Vikkas Yaduvanshi",
      "Divyanshu",
      "shubham prpwebs",
    ];

    // Get holidays from holidayData
    const holidays = holidayData.map((holiday) => holiday.date);

    const processedData = attendanceData
      .map((employeeData) => {
        const { employee, attendance_info } = employeeData;

        if (!employee || !attendance_info) {
          return null;
        }

        let onTimeCount = 0;
        let lateCount = 0;
        let halfDayCount = 0;
        let leaveCount = 0;
        let weekendCount = 0;
        let holidayCount = 0;
        let absentCount = 0;
        let totalHours = 0;
        let workingDaysCount = 0;
        let leaveDetails = [];
        let attendanceDetails = [];
        let holidayDetails = [];

        // Set shift timings based on employee
        const isSpecialShift = specialShiftEmployees.includes(employee.name);
        const startHour = isSpecialShift ? 10 : 8;
        const startMinute = isSpecialShift ? 0 : 0;
        const lateThresholdHour = isSpecialShift ? 10 : 8;
        const lateThresholdMinute = isSpecialShift ? 15 : 15;
        const endHour = isSpecialShift ? 19 : 17;

        // Process attendance info
        attendance_info.forEach((dayInfo) => {
          if (!dayInfo || !dayInfo.attendance_logs) return;

          const date = new Date(dayInfo.date);
          const dayOfWeek = date.getDay();

          // Check if it's a weekend
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendCount++;
            return;
          }

          // Check if it's a holiday
          if (holidays.includes(dayInfo.date)) {
            holidayCount++;
            workingDaysCount++; // Add holiday to working days count
            const holidayInfo = holidayData.find(
              (h) => h.date === dayInfo.date
            );
            holidayDetails.push({
              date: dayInfo.date,
              name: holidayInfo ? holidayInfo.name : "Holiday",
              type: "Company Holiday",
            });
            // Add holiday to attendance details
            attendanceDetails.push({
              date: dayInfo.date,
              status: "Holiday",
              checkin: "Holiday",
              checkout: "Holiday",
              workingHours: "0",
              holidayName: holidayInfo ? holidayInfo.name : "Holiday",
            });
            return; // Skip further processing for holidays
          }

          const logs = dayInfo.attendance_logs;
          if (logs.length === 0) {
            // No check-in means leave
            leaveCount++;
            leaveDetails.push({
              date: dayInfo.date,
              type: "Full Day Leave",
              reason: "No Check-in",
            });
            return;
          }

          const firstLog = logs[0];
          const lastLog = logs
            .slice()
            .reverse()
            .find((log) => log.checkout_timestamp);

          if (firstLog?.checkin_timestamp) {
            const checkinTime = new Date(firstLog.checkin_timestamp);
            const expectedStartTime = new Date(checkinTime);
            expectedStartTime.setHours(startHour, startMinute, 0);
            const lateThresholdTime = new Date(checkinTime);
            lateThresholdTime.setHours(
              lateThresholdHour,
              lateThresholdMinute,
              0
            );

            // Calculate late minutes
            const lateMinutes = Math.round(
              (checkinTime - expectedStartTime) / (1000 * 60)
            );

            // Calculate working hours
            let workingHours = 0;
            if (lastLog?.checkout_timestamp) {
              const checkoutTime = new Date(lastLog.checkout_timestamp);
              const expectedEndTime = new Date(checkoutTime);
              expectedEndTime.setHours(endHour, 0, 0);

              // Calculate total working hours
              const diffMs = checkoutTime - checkinTime;
              workingHours = diffMs / (1000 * 60 * 60);
              totalHours += workingHours;

              // Check for half day conditions
              const isHalfDay =
                // Check-in conditions
                (checkinTime.getHours() >= startHour + 3 &&
                  checkinTime.getHours() <= startHour + 5) ||
                (checkoutTime.getHours() <= endHour - 3 &&
                  checkoutTime.getHours() >= endHour - 5) ||
                // Working hours conditions
                (workingHours >= 3 && workingHours <= 5);

              if (workingHours >= 8) {
                if (checkinTime <= lateThresholdTime) {
                  // On time check-in
                  onTimeCount++;
                  attendanceDetails.push({
                    date: dayInfo.date,
                    status: "On Time",
                    checkin: checkinTime.toLocaleTimeString(),
                    checkout: lastLog?.checkout_timestamp
                      ? new Date(
                          lastLog.checkout_timestamp
                        ).toLocaleTimeString()
                      : "Not Checked Out",
                    workingHours: workingHours.toFixed(2),
                  });
                } else {
                  // Late check-in
                  lateCount++;
                  attendanceDetails.push({
                    date: dayInfo.date,
                    status: "Late",
                    checkin: checkinTime.toLocaleTimeString(),
                    checkout: lastLog?.checkout_timestamp
                      ? new Date(
                          lastLog.checkout_timestamp
                        ).toLocaleTimeString()
                      : "Not Checked Out",
                    lateMinutes: lateMinutes,
                    workingHours: workingHours.toFixed(2),
                  });
                }
              } else if (isHalfDay) {
                // Half day
                halfDayCount++;
                attendanceDetails.push({
                  date: dayInfo.date,
                  status: "Half Day",
                  checkin: checkinTime.toLocaleTimeString(),
                  checkout: lastLog?.checkout_timestamp
                    ? new Date(lastLog.checkout_timestamp).toLocaleTimeString()
                    : "Not Checked Out",
                  workingHours: workingHours.toFixed(2),
                });
              } else {
                // Less than half day
                absentCount++;
                leaveDetails.push({
                  date: dayInfo.date,
                  type: "Half Day Leave",
                  reason: "Less than 3 hours worked",
                  workingHours: workingHours.toFixed(2),
                });
              }
            } else {
              // No checkout time - check if check-in happened
              const lastCheckinTime = logs[logs.length - 1].checkin_timestamp;
              if (lastCheckinTime) {
                const lastCheckin = new Date(lastCheckinTime);
                const expectedEndTime = new Date(lastCheckin);
                expectedEndTime.setHours(endHour, 0, 0);

                const diffMs = expectedEndTime - checkinTime;
                const workingHours = diffMs / (1000 * 60 * 60);

                const isHalfDay =
                  // Check-in conditions
                  (checkinTime.getHours() >= startHour + 3 &&
                    checkinTime.getHours() <= startHour + 5) ||
                  // Working hours conditions
                  (workingHours >= 3 && workingHours <= 5);

                if (workingHours >= 8) {
                  if (checkinTime <= lateThresholdTime) {
                    // On time check-in
                    onTimeCount++;
                    attendanceDetails.push({
                      date: dayInfo.date,
                      status: "On Time",
                      checkin: checkinTime.toLocaleTimeString(),
                      checkout: "Not Checked Out",
                      workingHours: workingHours.toFixed(2),
                    });
                  } else {
                    // Late check-in
                    lateCount++;
                    attendanceDetails.push({
                      date: dayInfo.date,
                      status: "Late",
                      checkin: checkinTime.toLocaleTimeString(),
                      checkout: "Not Checked Out",
                      lateMinutes: lateMinutes,
                      workingHours: workingHours.toFixed(2),
                    });
                  }
                } else if (isHalfDay) {
                  // Half day
                  halfDayCount++;
                  attendanceDetails.push({
                    date: dayInfo.date,
                    status: "Half Day",
                    checkin: checkinTime.toLocaleTimeString(),
                    checkout: "Not Checked Out",
                    workingHours: workingHours.toFixed(2),
                  });
                } else {
                  // Less than half day
                  absentCount++;
                  leaveDetails.push({
                    date: dayInfo.date,
                    type: "Half Day Leave",
                    reason: "Less than 3 hours worked",
                    workingHours: workingHours.toFixed(2),
                  });
                }
              } else {
                // No check-in at all
                absentCount++;
                leaveDetails.push({
                  date: dayInfo.date,
                  type: "Full Day Leave",
                  reason: "No Check-in",
                });
              }
            }
            workingDaysCount++;
          }
        });

        // Calculate percentage based on 22 working days
        const totalWorkingDays = 22;
        const totalDays = onTimeCount + lateCount + halfDayCount + leaveCount;
        const attendancePercentage =
          totalDays > 0
            ? (
                ((onTimeCount + lateCount * 0.75 + halfDayCount * 0.5) /
                  totalWorkingDays) *
                100
              ).toFixed(2)
            : 0;

        const employeeStats = {
          id: employee._id || "N/A",
          name: employee.name || "N/A",
          department: employee.department || "N/A",
          designation: employee.designation || "N/A",
          totalWorkingDays: totalWorkingDays,
          onTimeDays: onTimeCount,
          lateDays: lateCount,
          halfDays: halfDayCount,
          weekendDays: weekendCount,
          holidayDays: holidayCount,
          leaves: leaveCount,
          absentDays: absentCount,
          leaveDetails: leaveDetails,
          attendanceDetails: attendanceDetails,
          holidayDetails: holidayDetails,
          totalHours: totalHours.toFixed(2),
          attendancePercentage: attendancePercentage,
        };

        return employeeStats;
      })
      .filter(Boolean);

    return processedData;
  };

  // Add this useEffect to log the final data being rendered
  useEffect(() => {
    if (employeeAttendanceData && employeeAttendanceData.length > 0) {
      // Log possible manual checkouts (exactly at 5:00:00 PM or 7:00:00 PM)
      employeeAttendanceData.forEach((employee) => {
        const manualCheckouts = (employee.attendanceDetails || []).filter(
          (detail) => {
            if (!detail.checkout || detail.checkout === "Not Checked Out")
              return false;
            return (
              detail.checkout.trim() === "5:00:00 PM" ||
              detail.checkout.trim() === "7:00:00 PM"
            );
          }
        );
        if (manualCheckouts.length > 0) {
        }
      });
    }
  }, [employeeAttendanceData]);

  // Fetch data when tab is active or month changes
  useEffect(() => {
    if (activeTab === "employeeAttendance" && selectedMonth) {
      fetchEmployeeAttendanceData();
    }
  }, [activeTab, selectedMonth]);

  // Add this function to fetch holidays
  const fetchHolidays = async () => {
    try {
      const [year, month] = selectedMonth.split("-");

      const response = await fetchAuthGET(
        `${djangoBaseURL}/holidays/${userInfo?.companyId}/${year}/`
      );

      if (response.holidays) {
        // Filter holidays for the selected month
        const monthHolidays = response.holidays.filter((holiday) => {
          const holidayDate = new Date(holiday.date);
          const monthMatch = holidayDate.getMonth() + 1 === parseInt(month);

          return monthMatch;
        });

        setHolidayData(monthHolidays);
      } else {
        console.log("No holidays in response");
        setHolidayData([]);
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to fetch holidays");
      setHolidayData([]);
    }
  };

  // Add this useEffect to fetch holidays when month changes
  useEffect(() => {
    if (selectedMonth && userInfo?.companyId) {
      fetchHolidays();
    }
  }, [selectedMonth, userInfo?.companyId]);

  // Add this useEffect to log checkout times
  useEffect(() => {
    if (employeeAttendanceData && employeeAttendanceData.length > 0) {
      const checkoutData = employeeAttendanceData.reduce((acc, employee) => {
        if (employee.attendanceDetails) {
          employee.attendanceDetails.forEach((detail) => {
            if (detail.checkout && detail.checkout !== "Not Checked Out") {
              acc.push({
                employee: employee.name,
                date: detail.date,
                checkout: detail.checkout,
              });
            }
          });
        }
        return acc;
      }, []);
    }
  }, [employeeAttendanceData]);

  const items = [
    {
      label: "Time",
      onClick: handleTimeAttendance,
    },
    {
      label: "Summary",
      onClick: handlePresentAbsent,
    },
  ];

  return (
    <main>
      <ToastContainer />
      <div className="flex gap-2 justify-between items-center mb-4">
        <Textinput
          type="month"
          value={selectedMonth}
          defaultValue={currentMonth}
          max={currentMonth}
          onChange={handleMonthChange}
          className="sm:w-52"
        />

        {/* Hide the dropdown button when on Employee Attendance tab */}
        {activeTab !== "employeeAttendance" && (
          <Dropdown
            classMenuItems="left-0  w-[220px] top-[110%] w-auto "
            label={
              <Button
                text="Download"
                className="btn-dark dark:bg-slate-800  h-min text-sm font-normal"
                icon="foundation:download"
                isLoading={downloading}
                disabled={downloading}
              />
            }
            items={items}
          />
        )}
      </div>

      <Tab.Group
        selectedIndex={selectedTabIndex}
        onChange={handleTabChange}
      >
        <Tab.List className="flex flex-wrap lg:space-x-8 md:space-x-4 space-x-2 rtl:space-x-reverse overflow-x-auto whitespace-nowrap pb-2">
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`inline-flex items-start text-xs sm:text-sm font-medium mb-7 capitalize ring-0 foucs:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute
                                    before:left-1/2 before:bottom-[-6px] before:h-[1.5px]
                                    before:bg-primary-500 before:-translate-x-1/2
                              
                                    ${
                                      selected
                                        ? "text-primary-500 before:w-full"
                                        : "text-slate-500 before:w-0 dark:text-slate-300"
                                    }
                                `}
              >
                <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                  <Icon icon="arcticons:khatabook" />
                </span>
                Attendance
              </button>
            )}
          </Tab>

          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`inline-flex items-start text-xs sm:text-sm font-medium mb-7 capitalize ring-0 foucs:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute
                                    before:left-1/2 before:bottom-[-6px] before:h-[1.5px]
                                    before:bg-primary-500 before:-translate-x-1/2
                              
                                    ${
                                      selected
                                        ? "text-primary-500 before:w-full"
                                        : "text-slate-500 before:w-0 dark:text-slate-300"
                                    }
                                `}
              >
                <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                  <Icon icon="arcticons:pdf-extra" />
                </span>
                Extra Info
              </button>
            )}
          </Tab>

          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`inline-flex items-start text-xs sm:text-sm font-medium mb-7 capitalize ring-0 foucs:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute
                                    before:left-1/2 before:bottom-[-6px] before:h-[1.5px]
                                    before:bg-primary-500 before:-translate-x-1/2
                              
                                    ${
                                      selected
                                        ? "text-primary-500 before:w-full"
                                        : "text-slate-500 before:w-0 dark:text-slate-300"
                                    }
                                `}
              >
                <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                  <Icon icon="icon-park-outline:check-in" />
                </span>
                Check In/Out
              </button>
            )}
          </Tab>

          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={`inline-flex items-start text-xs sm:text-sm font-medium mb-7 capitalize ring-0 foucs:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute
                                    before:left-1/2 before:bottom-[-6px] before:h-[1.5px]
                                    before:bg-primary-500 before:-translate-x-1/2
                              
                                    ${
                                      selected
                                        ? "text-primary-500 before:w-full"
                                        : "text-slate-500 before:w-0 dark:text-slate-300"
                                    }
                                `}
              >
                <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                  <Icon icon="mdi:account-group" />
                </span>
                Employee Attendance
              </button>
            )}
          </Tab>
        </Tab.List>
        
        {/* Show mobile summary cards */}
        {activeTab === "attendance" && (
          <Card className="mt-4 sm:hidden">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex gap-2 items-center">
                  <Icon icon="mdi:progress-tick" className="text-green-400" />
                  <h4 className="text-sm">Full Day</h4>
                </div>
                <p className="pl-4 text-xs">{fullDays}</p>
              </div>
              <div>
                <div className="flex gap-2 items-center">
                  <Icon
                    icon="mdi:progress-clock"
                    className="text-yellow-400"
                  />
                  <h4 className="text-sm">Half Day</h4>
                </div>
                <p className="pl-4 text-xs">{halfDays}</p>
              </div>
              <div>
                <div className="flex gap-2 items-center">
                  <Icon
                    icon="material-symbols-light:weekend-outline"
                    className="text-blue-400"
                  />
                  <h4 className="text-sm">Weekends</h4>
                </div>
                <p className="pl-4 text-xs">{getDayNames(weekends)}</p>
              </div>
              <div>
                <div className="flex gap-2 items-center">
                  <Icon
                    icon="fontisto:holiday-village"
                    className="text-purple-400"
                  />
                  <h4 className="text-sm">Holidays</h4>
                </div>
                <p className="pl-4 text-xs">{holidayData?.length || 0}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Similar mobile card for Check In/Out tab */}
        {activeTab === "checkinout" && (
          <Card className="mt-4 sm:hidden">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex gap-2 items-center">
                  <Icon icon="mdi:progress-tick" className="text-green-400" />
                  <h4 className="text-sm">Full Day</h4>
                </div>
                <p className="pl-4 text-xs">{fullDays}</p>
              </div>
              <div>
                <div className="flex gap-2 items-center">
                  <Icon
                    icon="mdi:progress-clock"
                    className="text-yellow-400"
                  />
                  <h4 className="text-sm">Half Day</h4>
                </div>
                <p className="pl-4 text-xs">{halfDays}</p>
              </div>
              <div>
                <div className="flex gap-2 items-center">
                  <Icon
                    icon="material-symbols-light:weekend-outline"
                    className="text-blue-400"
                  />
                  <h4 className="text-sm">Weekends</h4>
                </div>
                <p className="pl-4 text-xs">{getDayNames(weekends)}</p>
              </div>
              <div>
                <div className="flex gap-2 items-center">
                  <Icon
                    icon="fontisto:holiday-village"
                    className="text-purple-400"
                  />
                  <h4 className="text-sm">Holidays</h4>
                </div>
                <p className="pl-4 text-xs">{holidayData?.length || 0}</p>
              </div>
            </div>
          </Card>
        )}

        <Tab.Panels className="mt-4">
          <Tab.Panel>
            {/* Only show summary card on desktop */}
            <Card className="mt-4 hidden sm:block">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon icon="mdi:progress-tick" className="text-green-400" />
                    <h4 className="text-[16px]">Full Day</h4>
                  </div>
                  <p className="pl-4">{fullDays}</p>
                </div>
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon
                      icon="mdi:progress-clock"
                      className="text-yellow-400"
                    />
                    <h4 className="text-[16px]">Half Day</h4>
                  </div>
                  <p className="pl-4">{halfDays}</p>
                </div>
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon
                      icon="material-symbols-light:weekend-outline"
                      className="text-blue-400"
                    />
                    <h4 className="text-[16px]">Weekends</h4>
                  </div>
                  <p className="pl-4">{getDayNames(weekends)}</p>
                </div>
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon
                      icon="system-uicons:cross-circle"
                      className="text-red-400"
                    />
                    <h4 className="text-[16px]">Absent</h4>
                  </div>
                </div>
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon
                      icon="fontisto:holiday-village"
                      className="text-purple-400"
                    />
                    <h4 className="text-[16px]">Holidays</h4>
                  </div>
                  <div className="pl-4">
                    <p>{holidayData?.length || 0} Holidays</p>
                    {holidayData && holidayData.length > 0 ? (
                      <div className="text-xs text-gray-500 mt-1">
                        {holidayData.map((holiday) => (
                          <div key={holiday.id} className="mb-1">
                            <div className="font-semibold">
                              {new Date(holiday.date).toLocaleDateString()} -{" "}
                              {holiday.name}
                            </div>
                            {holiday.reason && (
                              <div className="text-gray-600">
                                Reason: {holiday.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">
                        No holidays this month
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            <div className="pt-4">
              <AttendanceTable
                daysInMonth={daysInMonth}
                weekends={weekends}
                selectedMonth={selectedDate}
                currentMonth={currentMonth}
                halfDays={halfDays}
                fullDays={fullDays}
                holidayData={holidayData}
              />
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <ExtraInfo
              extraInfo={extraInfo}
              extraInfoLoading={extraInfoLoading}
              getExtraInfo={getExtraInfo}
              extraInfoNextPage={extraInfoNextPage}
              extraInfoPrevPage={extraInfoPrevPage}
              extraInfoCurrentPage={extraInfoCurrentPage}
              extraInfoTotalPages={extraInfoTotalPages}
              extraInfoTotalCount={extraInfoTotalCount}
              onPageChange={handlePageChange}
              handlePageInputSubmit={handlePageInputSubmit}
            />
          </Tab.Panel>

          <Tab.Panel>
            {/* Only show summary card on desktop */}
            <Card className="mt-4 hidden sm:block">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon icon="mdi:progress-tick" className="text-green-400" />
                    <h4 className="text-[16px]">Full Day</h4>
                  </div>
                  <p className="pl-4">{fullDays}</p>
                </div>
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon
                      icon="mdi:progress-clock"
                      className="text-yellow-400"
                    />
                    <h4 className="text-[16px]">Half Day</h4>
                  </div>
                  <p className="pl-4">{halfDays}</p>
                </div>
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon
                      icon="material-symbols-light:weekend-outline"
                      className="text-blue-400"
                    />
                    <h4 className="text-[16px]">Weekends</h4>
                  </div>
                  <p className="pl-4">{getDayNames(weekends)}</p>
                </div>
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon
                      icon="system-uicons:cross-circle"
                      className="text-red-400"
                    />
                    <h4 className="text-[16px]">Absent</h4>
                  </div>
                </div>
                <div>
                  <div className="flex gap-2 items-center">
                    <Icon
                      icon="fontisto:holiday-village"
                      className="text-purple-400"
                    />
                    <h4 className="text-[16px]">Holidays</h4>
                  </div>
                  <div className="pl-4">
                    <p>{holidayData?.length || 0} Holidays</p>
                    {holidayData && holidayData.length > 0 ? (
                      <div className="text-xs text-gray-500 mt-1">
                        {holidayData.map((holiday) => (
                          <div key={holiday.id} className="mb-1">
                            <div className="font-semibold">
                              {new Date(holiday.date).toLocaleDateString()} -{" "}
                              {holiday.name}
                            </div>
                            {holiday.reason && (
                              <div className="text-gray-600">
                                Reason: {holiday.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">
                        No holidays this month
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
            <div className="pt-4">
              <CheckInOutTable
                checkInOutData={checkInOutData}
                loading={loading}
                refreshData={refreshData}
              />
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <EmployeeAttendance
              selectedMonth={selectedMonth}
              userInfo={userInfo}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </main>
  );
};

export default Attendance;
