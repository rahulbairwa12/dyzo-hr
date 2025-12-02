

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Card from "@/components/ui/Card";
import { fetchAuthGET, fetchGET } from "@/store/api/apiSlice";
import { djangoBaseURL } from "@/helper";
import { toast } from "react-toastify";
import React from "react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";

function getAllDatesInMonth(year, month) {
  const date = new Date(year, month, 1);
  const dates = [];
  while (date.getMonth() === month) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

// Helper function to format date to DD/MM/YYYY
const formatDateToDDMMYYYY = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to format date with month name for CSV
const formatDateForCSV = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Helper function to format date with weekday
const formatDateWithWeekday = (dateString, isMobile = false) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const weekDay = date.toLocaleDateString("en-US", {
    weekday: isMobile ? "short" : "long",
  });
  return `${day}/${month}/${year} (${weekDay})`;
};

const EmployeeAttendance = ({ selectedMonth, userInfo }) => {
  console.log("Selected Month:", selectedMonth);
  const [employeeAttendanceData, setEmployeeAttendanceData] = useState([]);
  const [employeeAttendanceLoading, setEmployeeAttendanceLoading] =
    useState(false);
  const [employeeAttendanceError, setEmployeeAttendanceError] = useState(null);
  const [holidayData, setHolidayData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [employeeDetailsLoading, setEmployeeDetailsLoading] = useState(false);

  // Reference for the table container
  const tableContainerRef = React.useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Function to handle scroll events
  const handleScroll = () => {
    if (tableContainerRef.current) {
      const {
        scrollLeft,
        scrollWidth,
        clientWidth,
        scrollTop,
        scrollHeight,
        clientHeight,
      } = tableContainerRef.current;

      // Horizontal scroll checks
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5); // 5px buffer

      // Force redraw of sticky elements on scroll to fix rendering issues
      const stickyElements =
        tableContainerRef.current.querySelectorAll(".sticky");
      stickyElements.forEach((el) => {
        el.style.transform = "translateZ(0)";
      });
    }
  };

  // Function to handle body scroll lock when modal is open
  useEffect(() => {
    const body = document.body;

    if (showModal) {
      // Store current scroll position
      const scrollY = window.scrollY;

      // Add styles to lock scroll
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
      body.style.overflowY = "hidden";
    } else {
      // Get scroll position
      const scrollY = body.style.top;

      // Remove styles
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflowY = "";

      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      // Cleanup in case component unmounts while modal is open
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflowY = "";
    };
  }, [showModal]);

  // Function to scroll table horizontally
  const scrollTable = (direction) => {
    if (tableContainerRef.current) {
      // Get the column width based on mobile or desktop view
      const columnWidth = isMobile ? 100 : 130;
      const currentScroll = tableContainerRef.current.scrollLeft;
      tableContainerRef.current.scrollTo({
        left:
          direction === "left"
            ? currentScroll - columnWidth
            : currentScroll + columnWidth,
        behavior: "smooth",
      });

      // Small delay to ensure proper redraw of borders after scrolling
      setTimeout(() => {
        handleScroll();
      }, 100);
    }
  };

  // Check scroll possibility on data load or window resize
  useEffect(() => {
    if (employeeAttendanceData.length > 0 && tableContainerRef.current) {
      handleScroll();

      // Add event listener for scroll
      const scrollContainer = tableContainerRef.current;
      scrollContainer.addEventListener("scroll", handleScroll);

      // Add resize event listener
      window.addEventListener("resize", handleScroll);

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [employeeAttendanceData]);

  // Function to fetch employee attendance data
  const fetchEmployeeAttendanceData = async () => {
    setEmployeeAttendanceLoading(true);
    setEmployeeAttendanceError(null);
    try {
      const [year, month] = selectedMonth.split("-");
      const formattedMonth = `${month}-${year}`;

      const attendanceResponse = await fetchGET(
        `${djangoBaseURL}/api/company/month-attendance/?company_id=${userInfo?.companyId}&month=${formattedMonth}`
      );

      if (!attendanceResponse) {
        throw new Error("Failed to fetch attendance data");
      }

      const filteredDataForEmployee = attendanceResponse?.filter(
        (data) => data?.employee?._id === userInfo?._id
      );

      const filteredDataForAdmin = attendanceResponse?.filter(
        (data) => data?.employee?.is_client === false
      );

      const processedData = processEmployeeAttendanceData(
        userInfo?.isAdmin ? filteredDataForAdmin : filteredDataForEmployee
      );
      setEmployeeAttendanceData(processedData);
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
      "Tushar jangid",
    ];

    // Get holidays
    const holidays = holidayData?.map((h) => h.date) || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return attendanceData
      .map((employeeData) => {
        const { employee, attendance_info } = employeeData;
        if (!employee || !attendance_info) return null;

        // Trackers
        let onTimeCount = 0;
        let shortLeaveCount = 0;
        let halfDayCount = 0;
        let leaveCount = 0;
        let weekendCount = 0;
        let holidayCount = 0;
        let totalHours = 0;
        const leaveDetails = [];
        const attendanceDetails = [];
        const holidayDetails = [];
        // For tracking first late/early occurrences
        let firstLateOccurred = false;
        let firstEarlyOccurred = false;

        // Set shift timings
        const isSpecialShift = specialShiftEmployees.includes(employee.name);
        const startHour = isSpecialShift
          ? employee.name === "Tushar jangid" || employee.name === "Divyanshu"
            ? 9
            : 10
          : 8;
        const endHour = isSpecialShift
          ? employee.name === "Tushar jangid" || employee.name === "Divyanshu"
            ? 19
            : 17
          : 17;
        const lateThresholdHour = isSpecialShift
          ? employee.name === "Tushar jangid" || employee.name === "Divyanshu"
            ? 10
            : 10
          : 8;
        const lateThresholdMinute = 15;
        const officialEndHour = 17; // 5:00 PM
        attendance_info.forEach((dayInfo) => {
          if (!dayInfo || !dayInfo.date) return;

          const date = new Date(dayInfo.date);
          date.setHours(0, 0, 0, 0); // Normalize to start of day
          const dayOfWeek = date.getDay();

          // Skip today or future dates
          if (date >= today) {
            attendanceDetails.push({
              date: dayInfo.date,
              status: "-",
              checkin: "-",
              checkout: "-",
              workingHours: "-",
              isLate: false,
              isEarlyCheckout: false,
            });
            return;
          }

          // 1. Check for weekends
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendCount++;
            attendanceDetails.push({
              date: dayInfo.date,
              status: "Weekend",
              checkin: "-",
              checkout: "-",
              workingHours: "-",
              isLate: false,
              isEarlyCheckout: false,
            });
            return;
          }

          // 2. Check for holidays (highest priority)
          if (holidays.includes(dayInfo.date)) {
            holidayCount++;
            const holiday = holidayData.find((h) => h.date === dayInfo.date);
            holidayDetails.push({
              date: dayInfo.date,
              name: holiday?.name || "Holiday",
              type: "Company Holiday",
            });
            attendanceDetails.push({
              date: dayInfo.date,
              status: "Holiday",
              checkin: "-",
              checkout: "-",
              workingHours: "-",
              isLate: false,
              isEarlyCheckout: false,
            });
            return;
          }

          const logs = dayInfo.attendance_logs || [];
          // 3. No check-in = Full Leave
          if (logs.length === 0) {
            leaveCount++;
            leaveDetails.push({
              date: dayInfo.date,
              type: "Full Day Leave",
              reason: "No Check-in",
            });
            attendanceDetails.push({
              date: dayInfo.date,
              status: "Leave",
              checkin: "-",
              checkout: "-",
              workingHours: "-",
              isLate: false,
              isEarlyCheckout: false,
            });
            return;
          }

          // Get first check-in and last check-out
          const firstLog = logs[0];
          const lastLog = logs
            .slice()
            .reverse()
            .find((l) => l.checkout_timestamp);

          if (!firstLog?.checkin_timestamp) {
            leaveCount++;
            leaveDetails.push({
              date: dayInfo.date,
              type: "Full Day Leave",
              reason: "No Check-in",
            });
            attendanceDetails.push({
              date: dayInfo.date,
              status: "Leave",
              checkin: "-",
              checkout: "-",
              workingHours: "-",
              isLate: false,
              isEarlyCheckout: false,
            });
            return;
          }

          const checkinTime = new Date(firstLog.checkin_timestamp);
          const checkoutTime = lastLog?.checkout_timestamp
            ? new Date(lastLog.checkout_timestamp)
            : null;

          // Calculate working hours
          const workingHours = checkoutTime
            ? (checkoutTime - checkinTime) / (1000 * 60 * 60)
            : 0;

          totalHours += workingHours;
          // Late arrival logic
          const lateThresholdTime = new Date(checkinTime);
          lateThresholdTime.setHours(lateThresholdHour, lateThresholdMinute, 0);

          const isLate = checkinTime > lateThresholdTime;
          const lateWindow = isSpecialShift
            ? checkinTime.getHours() >= 10 && checkinTime.getHours() < 12
            : checkinTime.getHours() >= 8 && checkinTime.getHours() < 10;

          // Early checkout logic
          const expectedEndTime = new Date(checkinTime);
          expectedEndTime.setHours(endHour, 0, 0);

          const isEarlyCheckout =
            checkoutTime && checkoutTime < expectedEndTime;
          const earlyWindow = isSpecialShift
            ? checkoutTime &&
              checkoutTime.getHours() >= 17 &&
              checkoutTime.getHours() < 19
            : checkoutTime &&
              checkoutTime.getHours() >= 15 &&
              checkoutTime.getHours() < 17;

          let status = "";

          // 1. Less than 2 hours = Absent (Leave)
          if (workingHours < 2) {
            status = "Leave";
            leaveCount++;
            leaveDetails.push({
              date: dayInfo.date,
              type: "Half Day Leave",
              reason: "Worked less than 2 hours",
              workingHours: workingHours.toFixed(2),
            });
          }
          // 2. Early checkout (before 5:00 PM), regardless of hours
          else if (
            checkoutTime &&
            (checkoutTime.getHours() < officialEndHour ||
              (checkoutTime.getHours() === officialEndHour &&
                checkoutTime.getMinutes() < 0))
          ) {
            if (earlyWindow) {
              if (!firstEarlyOccurred) {
                status = "Short leave";
                shortLeaveCount++;
                firstEarlyOccurred = true;
              } else {
                status = "Half/Day";
                halfDayCount++;
              }
            } else {
              status = "Half/Day";
              halfDayCount++;
            }
          }
          // 3. Late check-in (after 8:15 AM)
          else if (isLate) {
            if (lateWindow) {
              if (!firstLateOccurred) {
                status = "Short leave";
                shortLeaveCount++;
                firstLateOccurred = true;
              } else {
                status = "Half/Day";
                halfDayCount++;
              }
            } else {
              status = "Half/Day";
              halfDayCount++;
            }
          }
          // 4. Full day (8+ hours, not late/early)
          else if (workingHours >= 8) {
            status = "Present";
            onTimeCount++;
          }
          // 5. Half day (3-8 hours)
          else if (workingHours >= 3 && workingHours < 8) {
            status = "Half/Day";
            halfDayCount++;
          }

          attendanceDetails.push({
            date: dayInfo.date,
            status,
            checkin: checkinTime.toLocaleTimeString(),
            checkout: checkoutTime ? checkoutTime.toLocaleTimeString() : "None",
            workingHours: workingHours.toFixed(2),
            isLate,
            isEarlyCheckout,
          });
        });

        // Calculate attendance percentage
        const totalWorkingDays =
          attendance_info.length - weekendCount - holidayCount;
        const attendancePercentage =
          totalWorkingDays > 0
            ? (
                ((onTimeCount + shortLeaveCount * 0.75 + halfDayCount * 0.5) /
                  totalWorkingDays) *
                100
              ).toFixed(2)
            : 0;

        return {
          id: employee._id || "N/A",
          name: employee.name || "N/A",
          department: employee.department || "N/A",
          designation: employee.designation || "N/A",
          totalWorkingDays,
          onTimeDays: onTimeCount,
          shortLeaves: shortLeaveCount,
          halfDays: halfDayCount,
          leaves: leaveCount,
          weekendDays: weekendCount,
          holidayDays: holidayCount,
          totalHours: totalHours.toFixed(2),
          attendancePercentage,
          leaveDetails,
          attendanceDetails,
          holidayDetails,
        };
      })
      .filter(Boolean);
  };

  // Add this function to fetch holidays
  const fetchHolidays = async () => {
    try {
      const [year, month] = selectedMonth.split("-");

      const response = await fetchAuthGET(
        `${djangoBaseURL}/holidays/${userInfo?.companyId}/${year}/`
      );

      if (response.holidays) {
        const monthHolidays = response.holidays.filter((holiday) => {
          const holidayDate = new Date(holiday.date);
          const monthMatch =
            holidayDate.getMonth() + 1 === Number.parseInt(month);

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

  // Fetch data when tab is active or month changes
  useEffect(() => {
    if (selectedMonth && holidayData) {
      fetchEmployeeAttendanceData();
    }
  }, [selectedMonth, holidayData]);

  // Function to determine the CSS class for different status values
  const getStatusClass = (status) => {
    if (status === "Weekend" || status === "Holiday")
      return "italic text-gray-500";
    if (status === "Present") return "text-green-600 font-medium";
    if (status === "Short leave") return "text-amber-500 font-medium";
    if (status === "Half/Day") return "text-orange-500 font-medium";
    if (status === "Leave") return "text-red-600 font-medium";
    return "text-gray-400";
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
    setEmployeeDetailsLoading(true);

    // Fetch employee details from API
    const fetchEmployeeDetails = async () => {
      try {
        const response = await fetch(
          `https://api.dyzo.ai/employee/me/${employee.id}/`
        );
        const data = await response.json();

        if (data && data.status === 1 && data.data) {
          // Update employee with API data
          setSelectedEmployee((prev) => ({
            ...prev,
            designation: data.data.designation || prev.designation,
            email: data.data.email,
            gender: data.data.gender,
            status: data.data.status,
            team_leader: data.data.team_leader,
          }));
        }
      } catch (error) {
        console.error("Error fetching employee details:", error);
        toast.error("Failed to fetch complete employee details");
      } finally {
        setEmployeeDetailsLoading(false);
      }
    };

    fetchEmployeeDetails();
  };

  // Function to calculate leave summary for an employee
  const calculateLeaveSummary = (employee) => {
    // Default allowed leave amount
    const allowed = 1.75;

    // Calculate used leave
    const fullDay =
      employee.leaveDetails?.filter((leave) => leave.type === "Full Day Leave")
        .length || 0;

    const halfDay = (employee.halfDays || 0) * 0.5;
    const shortLeave = (employee.shortLeaves || 0) * 0.25;

    // Total used leave
    const used = fullDay + halfDay + shortLeave;
    const usedFormatted = used.toFixed(2);

    // Calculate remaining or extra leave
    const remaining = allowed - used;
    const remainingFormatted = Math.abs(remaining).toFixed(2);

    // Determine if employee has used more than allowed
    const isExtra = remaining < 0;

    return {
      used: usedFormatted,
      allowed: allowed.toFixed(2),
      remaining: remainingFormatted,
      isExtra,
      fullDay,
      halfDay: employee.halfDays || 0,
      shortLeave: employee.shortLeaves || 0,
      // Add new fields for better tracking
      remainingDays: isExtra ? 0 : remainingFormatted,
      extraDays: isExtra ? remainingFormatted : 0,
    };
  };

  // Create tooltip content for attendance status
  const getAttendanceTooltip = (status, detail) => {
    if (
      !detail ||
      status === "Weekend" ||
      status === "Holiday" ||
      status === "-"
    ) {
      return null;
    }

    // Format date string
    const formattedDate = detail.date ? formatDateToDDMMYYYY(detail.date) : "";

    // Format working hours with 2 decimal places
    const workingHours =
      typeof detail.workingHours === "string"
        ? detail.workingHours
        : detail.workingHours?.toFixed(2) || "-";

    return (
      <div className="absolute z-50 invisible group-hover:visible bg-white dark:bg-slate-800 shadow-lg rounded-lg p-2 w-48 text-xs border border-gray-200 dark:border-slate-700 top-full left-1/2 transform -translate-x-1/2 mt-2">
        <div className="font-semibold text-center mb-1 text-sm text-blue-600 dark:text-blue-400">
          {status === "Present" ? "Present (On Time)" : status}
        </div>
        <div className="space-y-0.5 text-gray-700 dark:text-gray-300">
          <div>Date: {formattedDate}</div>
          <div>Check-in: {detail.checkin || "-"}</div>
          <div>
            Check-out: {detail.checkout !== "None" ? detail.checkout : "-"}
          </div>
          <div>Working Hours: {workingHours}</div>
        </div>
        <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 bg-white dark:bg-slate-800 border-l border-t border-gray-200 dark:border-slate-700"></div>
      </div>
    );
  };

  // Create tooltip content for employee leave summary
  const getLeaveSummaryTooltip = (employee) => {
    return (
      <div className="absolute z-50 invisible group-hover:visible bg-white dark:bg-slate-800 shadow-lg rounded-lg p-4 w-64 text-sm border border-gray-200 dark:border-slate-700 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
        <div className="font-semibold text-center mb-2 text-base text-blue-600 dark:text-blue-400">
          Leave Summary
        </div>
        <div className="space-y-1 text-center text-gray-700 dark:text-gray-300">
          <div>
            Leave: <span className="font-bold">{employee.leaves || 0}</span>
          </div>
          <div>
            Short Leave:{" "}
            <span className="font-bold">{employee.shortLeaves || 0}</span>
          </div>
          <div>
            Half Day:{" "}
            <span className="font-bold">{employee.halfDays || 0}</span>
          </div>
        </div>
        <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 bg-white dark:bg-slate-800 border-r border-b border-gray-200 dark:border-slate-700"></div>
      </div>
    );
  };

  // Create tooltip content for leave summary cells
  const getCasualLeaveTooltip = (summary) => {
    return (
      <div className="absolute z-50 invisible group-hover:visible bg-white dark:bg-slate-800 shadow-lg rounded-lg p-2 w-48 text-xs border border-gray-200 dark:border-slate-700 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
        <div className="font-semibold text-center mb-1 text-sm text-blue-600 dark:text-blue-400">
          Leave Summary
        </div>
        <div className="space-y-0.5 text-gray-700 dark:text-gray-300">
          <div className="flex justify-between">
            <span>Used:</span>
            <span
              className={`font-medium ${
                summary.isExtra ? "text-red-600" : "text-blue-600"
              }`}
            >
              {summary.used}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Allowed:</span>
            <span className="font-medium text-green-600">
              {summary.allowed}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{summary.isExtra ? "Extra:" : "Remaining:"}</span>
            <span
              className={`font-medium ${
                summary.isExtra ? "text-red-600" : "text-green-600"
              }`}
            >
              {summary.isExtra ? summary.extraDays : summary.remainingDays}
            </span>
          </div>
          <div className="border-t border-gray-200 dark:border-slate-700 pt-0.5 mt-0.5">
            <div className="flex justify-between">
              <span>
                FD: <span className="text-blue-600">{summary.fullDay}</span>
              </span>
              <span>
                HD: <span className="text-orange-500">{summary.halfDay}</span>
              </span>
              <span>
                SL: <span className="text-green-600">{summary.shortLeave}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-45 bg-white dark:bg-slate-800 border-r border-b border-gray-200 dark:border-slate-700"></div>
      </div>
    );
  };

  // Function to generate and download CSV for employee attendance
  const downloadAttendanceCSV = async () => {
    setDownloading(true);

    try {
      if (!employeeAttendanceData || employeeAttendanceData.length === 0) {
        toast.error("No attendance data available to download");
        return;
      }

      // Get all dates in the selected month for CSV header
      const dates = getAllDatesInMonth(selectedMonth);
      const monthName = new Date(selectedMonth).toLocaleString("en-US", {
        month: "long",
      });
      const year = new Date(selectedMonth).getFullYear();

      // Create CSV header
      const header = [
        "Employee Name",
        "Department",
        "Present Days",
        "Absent Days",
        "Half Days",
        "Week Off",
        "Holidays",
        "Leaves",
        "Working Hours",
        "Overtime Hours",
        "Late Minutes",
        "Early Departure Minutes",
        "Total Days",
      ];

      // Add dates to header with month names
      dates.forEach((date) => {
        const day = String(date.getDate()).padStart(2, "0");
        header.push(`${day} ${monthName} ${year}`);
      });

      // Map employee data to CSV format
      const csvData = employeeAttendanceData.map((employee) => {
        const row = {
          "Employee Name": employee.name,
          Department: employee.department,
          "Present Days": employee.onTimeDays,
          "Absent Days": employee.leaves,
          "Half Days": employee.halfDays,
          "Week Off": employee.weekendDays,
          Holidays: employee.holidayDays,
          Leaves: employee.leaves,
          "Working Hours": employee.totalHours,
          "Overtime Hours": employee.overtimeHours,
          "Late Minutes": employee.lateMinutes,
          "Early Departure Minutes": employee.earlyDepartureMinutes,
          "Total Days": employee.totalWorkingDays,
        };

        // Add attendance details
        if (
          employee.attendanceDetails &&
          employee.attendanceDetails.length > 0
        ) {
          employee.attendanceDetails.forEach((detail) => {
            if (detail.date) {
              const day = String(new Date(detail.date).getDate()).padStart(
                2,
                "0"
              );
              const dateKey = `${day} ${monthName} ${year}`;
              row[dateKey] = detail.status;
            }
          });
        }

        return row;
      });

      // Convert to CSV
      const csvContent = [
        header.join(","),
        ...csvData.map((row) => {
          return header
            .map((header) => {
              const value = row[header] || "";
              // Handle commas in the data by wrapping in quotes
              return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : value;
            })
            .join(",");
        }),
      ].join("\n");

      // Create a Blob from the CSV content
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // Create a download link
      const link = document.createElement("a");
      if (link.download !== undefined) {
        // Set the file name with month name
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute(
          "download",
          `employee_attendance_${monthName}_${year}.csv`
        );

        // Append to body and click
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Attendance data downloaded successfully");
      } else {
        toast.error("Your browser does not support downloading files");
      }
    } catch (error) {
      console.error("Error downloading attendance data:", error);
      toast.error("Failed to download attendance data");
    } finally {
      setDownloading(false);
    }
  };

  // Download options for dropdown
  const downloadOptions = [
    {
      value: "csv",
      label: "Download CSV",
      icon: "heroicons:document-arrow-down",
      action: downloadAttendanceCSV,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Show title only on mobile since desktop has it in the card header */}
      {isMobile && (
        <div className="flex flex-col space-y-4 mb-4">
          <Button
            text="CSV"
            className="bg-gray-800 p-4 w-28  absolute  right-5 text-white dark:bg-gray-900 h-10 text-sm font-medium px-4 flex items-center gap-2 rounded shadow-md"
            icon="heroicons:arrow-down"
            isLoading={downloading}
            disabled={downloading || employeeAttendanceData.length === 0}
            onClick={downloadAttendanceCSV}
          />
          <div className="text-base font-medium text-gray-700 dark:text-gray-200">
            Employee Attendance
          </div>

          {/* Mobile CSV download controls - centered with arrows on sides */}
          <div className="flex items-center justify-end space-x-4 py-2 ">
            <button
              onClick={() => scrollTable("left")}
              disabled={!canScrollLeft}
              className={`p-2 rounded-md ${
                canScrollLeft
                  ? "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                  : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
              }`}
              aria-label="Scroll left"
            >
              <Icon icon="heroicons:chevron-left" className="w-5 h-5" />
            </button>

            <button
              onClick={() => scrollTable("right")}
              disabled={!canScrollRight}
              className={`p-2 rounded-md ${
                canScrollRight
                  ? "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                  : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
              }`}
              aria-label="Scroll right"
            >
              <Icon icon="heroicons:chevron-right" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Attendance Table */}
      {employeeAttendanceLoading ? (
        <div className="flex items-center justify-center p-12 md:p-0">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : employeeAttendanceError ? (
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <Icon
              icon="heroicons:exclamation-circle"
              className="w-12 h-12 mx-auto"
            />
          </div>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
            {employeeAttendanceError}
          </h3>
          <button
            onClick={fetchEmployeeAttendanceData}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Retry
          </button>
        </Card>
      ) : (
        <Card className="overflow-hidden border rounded-md relative">
          {/* Navigation and download controls - Different for desktop and mobile */}
          {isMobile ? (
            // Mobile layout - Empty header for spacing only
            <div className="h-2 bg-white dark:bg-slate-800"></div>
          ) : (
            // Desktop layout
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 px-4 py-3 border-b border-gray-200 dark:border-slate-600">
              <div className="text-base font-medium text-gray-700 dark:text-gray-200">
                Employee Attendance
              </div>
              <div className="flex items-center gap-3">
                <Button
                  text="Download CSV"
                  className="bg-gray-800 hover:bg-gray-900 text-white h-9 text-sm font-medium px-4 flex items-center gap-2 rounded"
                  icon="heroicons:document-arrow-down"
                  isLoading={downloading}
                  disabled={downloading || employeeAttendanceData.length === 0}
                  onClick={downloadAttendanceCSV}
                />
                <div className="flex items-center border-l border-gray-200 dark:border-slate-600 pl-3">
                  <button
                    onClick={() => scrollTable("left")}
                    disabled={!canScrollLeft}
                    className={`p-1.5 rounded-md ${
                      canScrollLeft
                        ? "text-primary-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                        : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    }`}
                    aria-label="Scroll left"
                  >
                    <Icon icon="heroicons:chevron-left" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollTable("right")}
                    disabled={!canScrollRight}
                    className={`p-1.5 rounded-md ${
                      canScrollRight
                        ? "text-primary-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                        : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    }`}
                    aria-label="Scroll right"
                  >
                    <Icon icon="heroicons:chevron-right" className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
          <div
            className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent max-h-[70vh] md:max-h-[70vh] attendance-container"
            ref={tableContainerRef}
            style={{ contain: "paint", isolation: "isolate" }}
          >
            <div
              className="min-w-full grid bg-white dark:bg-slate-800 attendance-grid"
              style={{
                gridTemplateColumns: isMobile
                  ? `120px repeat(${employeeAttendanceData.length}, 100px)`
                  : `150px repeat(${employeeAttendanceData.length}, 130px)`,
                gridAutoRows: "auto",
              }}
            >
              {/* Header Row */}
              <div className="contents">
                {/* Combined Date/Weekday Header Cell */}
                <div
                  className={`sticky left-0 top-0 z-50 px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 flex items-center ${
                    isMobile ? "w-[120px]" : "w-[150px]"
                  } shadow-md`}
                >
                  Date (Weekday)
                </div>
                {/* Employee Headers - Sorted alphabetically */}
                {[...employeeAttendanceData]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((employee, index) => (
                    <div
                      key={employee.id}
                      className={`sticky top-0 z-40 px-2 md:px-4 py-2 md:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 ${
                        index === 0
                          ? "border-l-2 border-l-gray-300 dark:border-l-slate-500"
                          : ""
                      } flex items-center justify-center`}
                    >
                      <a
                        href="#"
                        className="text-primary-500 hover:text-primary-700 hover:underline transition-colors duration-200"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEmployeeClick(employee);
                        }}
                      >
                        {isMobile ? employee.name.split(" ")[0] : employee.name}
                      </a>
                      {!isMobile && getLeaveSummaryTooltip(employee)}
                    </div>
                  ))}
              </div>

              {/* Data Rows */}
              {(() => {
                // Build list of dates in the selected month
                const [year, month] = selectedMonth.split("-");
                const allDates = getAllDatesInMonth(
                  Number(year),
                  Number(month) - 1
                );

                return allDates.map((date, idx) => {
                  const jsDate = new Date(date);
                  const dayOfWeek = jsDate.getDay(); // 0 = Sunday, 6 = Saturday
                  const formattedDate = formatDateWithWeekday(date, isMobile);
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <div key={date} className="contents">
                      {/* Combined Date/Weekday Cell */}
                      <div
                        className={`sticky left-0 z-40 px-2 md:px-4 py-2 md:py-3 text-sm text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-slate-600 ${
                          idx % 2 === 0
                            ? "bg-white dark:bg-slate-800"
                            : "bg-gray-50 dark:bg-slate-700"
                        } flex items-center ${
                          isMobile ? "w-[120px] text-xs" : "w-[150px]"
                        }`}
                      >
                        {formattedDate}
                      </div>

                      {/* Employee Data Cells */}
                      {[...employeeAttendanceData]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((employee, empIndex) => {
                          // Find attendance record for this date
                          const record = employee.attendanceDetails.find(
                            (detail) => detail.date === date
                          );

                          let status = record?.status || "-";
                          return (
                            <div
                              key={`${employee.id}-${date}`}
                              className={`px-2 md:px-4 py-2 md:py-3 text-sm border border-gray-200 dark:border-slate-600 ${getStatusClass(
                                status
                              )} ${
                                empIndex === 0
                                  ? "border-l-2 border-l-gray-300 dark:border-l-slate-500"
                                  : ""
                              } ${
                                idx % 2 === 0
                                  ? "bg-white dark:bg-slate-800"
                                  : "bg-gray-50 dark:bg-slate-700"
                              } group relative flex items-center justify-center ${
                                isMobile ? "text-xs" : ""
                              }`}
                              style={{ minWidth: isMobile ? "100px" : "130px" }}
                            >
                              {status}
                              {!isMobile &&
                                getAttendanceTooltip(status, record)}
                            </div>
                          );
                        })}
                    </div>
                  );
                });
              })()}

              {/* Add separator between regular rows and summary */}
              <div className="contents">
                <div
                  className={`sticky left-0 z-30 col-span-1 h-2 bg-blue-100 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-800 ${
                    isMobile ? "w-[120px]" : "w-[150px]"
                  }`}
                ></div>
                {employeeAttendanceData.map((_, index) => (
                  <div
                    key={`separator-${index}`}
                    className="h-2 bg-blue-100 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-800"
                  ></div>
                ))}
              </div>

              {/* Casual Leave Summary Row */}
              <div className="contents">
                {/* Summary Header - first column */}
                <div
                  className={`sticky left-0 z-40 px-2 md:px-4 py-2 md:py-3 text-sm font-medium text-blue-700 dark:text-blue-300 border border-gray-200 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/20 ${
                    isMobile ? "w-[120px] text-xs" : "w-[150px]"
                  }`}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-1">
                      <Icon
                        icon="heroicons:calendar"
                        className="text-blue-500"
                      />
                      <span>CL</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      (Casual Leave)
                    </span>
                    <div
                      className={`${
                        isMobile ? "text-[10px]" : "text-xs"
                      } text-blue-500 dark:text-blue-400`}
                    >
                      Allowed: 1.75
                    </div>
                  </div>
                </div>

                {/* Employee Summary Cells - add min-width to prevent collapsing */}
                {[...employeeAttendanceData]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((employee, index) => {
                    const summary = calculateLeaveSummary(employee);
                    const percentUsed = Math.min(
                      (summary.used / summary.allowed) * 100,
                      100
                    );

                    return (
                      <div
                        key={`${employee.id}-summary`}
                        className={`group relative px-2 md:px-4 py-2 md:py-3 text-sm border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 ${
                          index === 0
                            ? "border-l-2 border-l-gray-300 dark:border-l-slate-500"
                            : ""
                        }`}
                        style={{ minWidth: isMobile ? "100px" : "130px" }}
                      >
                        <div className="flex flex-col space-y-1">
                          {/* Used */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`${
                                isMobile ? "text-[10px]" : "text-xs"
                              } text-gray-500 dark:text-gray-400`}
                            >
                              ↑ Used
                            </span>
                            <span
                              className={`${
                                isMobile ? "text-[10px]" : "text-xs"
                              } font-medium ${
                                Number(summary.used) > 0
                                  ? summary.isExtra
                                    ? "text-red-600"
                                    : "text-blue-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {summary.used}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                summary.isExtra ? "bg-red-500" : "bg-green-600"
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            ></div>
                          </div>

                          {/* Allowed */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`${
                                isMobile ? "text-[10px]" : "text-xs"
                              } text-gray-500 dark:text-gray-400`}
                            >
                              ↑ Allowed
                            </span>
                            <span
                              className={`${
                                isMobile ? "text-[10px]" : "text-xs"
                              } font-medium text-green-600`}
                            >
                              {summary.allowed}
                            </span>
                          </div>

                          {/* Remaining or Extra */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`${
                                isMobile ? "text-[10px]" : "text-xs"
                              } text-gray-500 dark:text-gray-400`}
                            >
                              {summary.isExtra ? "↑ Extra" : "↑ Rem."}
                            </span>
                            <span
                              className={`${
                                isMobile ? "text-[10px]" : "text-xs"
                              } font-medium ${
                                summary.isExtra
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {summary.isExtra
                                ? summary.extraDays
                                : summary.remainingDays}
                            </span>
                          </div>

                          {/* Leave type breakdown */}
                          <div
                            className={`flex items-center justify-between ${
                              isMobile ? "text-[10px]" : "text-xs"
                            } text-gray-500 dark:text-gray-400 mt-1 border-t border-gray-200 dark:border-slate-700 pt-1`}
                          >
                            <span>
                              FD:{" "}
                              <span className="text-blue-600">
                                {summary.fullDay}
                              </span>
                            </span>
                            <span>
                              HD:{" "}
                              <span className="text-orange-500">
                                {summary.halfDay}
                              </span>
                            </span>
                            <span>
                              SL:{" "}
                              <span className="text-green-600">
                                {summary.shortLeave}
                              </span>
                            </span>
                            {!isMobile && (
                              <span title="FD=Full Day, HD=Half Day, SL=Short Leave">
                                <Icon
                                  icon="heroicons:information-circle"
                                  className="text-gray-400"
                                />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="absolute -top-3 left-14 z-50 pointer-events-none">
                          {/* Add casual leave tooltip - only on desktop */}
                          {!isMobile && getCasualLeaveTooltip(summary)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Employee Detail Modal */}
      {showModal && selectedEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-in-out overflow-y-auto"
          style={{
            backdropFilter: "blur(5px)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative mt-20 my-8 w-full max-w-2xl h-auto max-h-[85vh] overflow-auto rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-200 dark:border-slate-600 transform transition-transform duration-300 ease-out animate-fadeIn"
            style={{
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-slate-600">
              <button
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setShowModal(false)}
              >
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
              </button>

              <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
                {selectedEmployee.name}
                {employeeDetailsLoading && (
                  <span className="inline-block ml-2">
                    <Icon
                      icon="eos-icons:loading"
                      className="animate-spin text-primary-500 w-5 h-5"
                    />
                  </span>
                )}
              </h2>
              <div className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center">
                    <Icon
                      icon="heroicons:briefcase"
                      className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400"
                    />
                    <span>
                      Designation:{" "}
                      <span className="font-medium">
                        {selectedEmployee.designation || "N/A"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Icon
                      icon="heroicons:envelope"
                      className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400"
                    />
                    <span>
                      Email:{" "}
                      <span className="font-medium">
                        {selectedEmployee.email || "N/A"}
                      </span>
                    </span>
                  </div>

                  {selectedEmployee.status && (
                    <div className="flex items-center">
                      <Icon
                        icon="heroicons:user-circle"
                        className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400"
                      />
                      <span>
                        Status:{" "}
                        <span
                          className={`font-medium ${
                            selectedEmployee.status === "Active"
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {selectedEmployee.status}
                        </span>
                      </span>
                    </div>
                  )}

                  {selectedEmployee.team_leader && (
                    <div className="flex items-center">
                      <Icon
                        icon="heroicons:user-group"
                        className="w-4 h-4 mr-1 text-blue-500"
                      />
                      <span className="font-medium text-blue-600">
                        Team Leader
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 space-y-5">
              {/* Summary Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                  <Icon
                    icon="heroicons:chart-bar"
                    className="w-4 h-4 mr-1.5 text-blue-500"
                  />
                  Summary
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs md:text-sm">
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-md shadow-sm">
                    <div className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs">
                      Present
                    </div>
                    <div className="font-semibold text-blue-600">
                      {selectedEmployee.onTimeDays || 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-md shadow-sm">
                    <div className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs">
                      Half Day
                    </div>
                    <div className="font-semibold text-orange-500">
                      {selectedEmployee.halfDays || 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-md shadow-sm">
                    <div className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs">
                      Short Leave
                    </div>
                    <div className="font-semibold text-green-600">
                      {selectedEmployee.shortLeaves || 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-md shadow-sm">
                    <div className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs">
                      Leaves
                    </div>
                    <div className="font-semibold text-red-600">
                      {selectedEmployee.leaves || 0}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-md shadow-sm">
                    <div className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs">
                      Attendance %
                    </div>
                    <div className="font-semibold text-purple-600">
                      {selectedEmployee.attendancePercentage || 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Details Section */}
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                  <Icon
                    icon="heroicons:calendar"
                    className="w-4 h-4 mr-1.5 text-blue-500"
                  />
                  Attendance Details
                </div>
                <div className="overflow-x-auto border border-gray-200 dark:border-slate-600 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-700">
                        <th className="px-3 py-2 text-left text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300">
                          Check-in
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300">
                          Check-out
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-300">
                          Working Hours
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      {selectedEmployee.attendanceDetails &&
                      selectedEmployee.attendanceDetails.length > 0 ? (
                        selectedEmployee.attendanceDetails.map(
                          (detail, idx) => (
                            <tr
                              key={idx}
                              className={
                                idx % 2 === 0
                                  ? "bg-white dark:bg-slate-800"
                                  : "bg-gray-50 dark:bg-slate-700/30"
                              }
                            >
                              <td className="px-3 py-2 text-[10px] md:text-xs text-gray-800 dark:text-gray-200">
                                {formatDateToDDMMYYYY(detail.date)}
                              </td>
                              <td className="px-3 py-2 text-[10px] md:text-xs">
                                <span className={getStatusClass(detail.status)}>
                                  {detail.status}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[10px] md:text-xs text-gray-800 dark:text-gray-200">
                                {detail.checkin}
                              </td>
                              <td className="px-3 py-2 text-[10px] md:text-xs text-gray-800 dark:text-gray-200">
                                {detail.checkout}
                              </td>
                              <td className="px-3 py-2 text-[10px] md:text-xs text-gray-800 dark:text-gray-200">
                                {detail.workingHours}
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                          >
                            No attendance details
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add this CSS at the beginning of your file
const styles = document.createElement("style");
styles.innerHTML = `
  @keyframes fadeIn {
    0% { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  /* Fix sticky columns and scrolling */
  .attendance-container {
    display: block;
    width: 100%;
    overflow-x: auto;
  }
  
  .attendance-grid {
    width: max-content;
    min-width: 100%;
  }
`;
document.head.appendChild(styles);

export default EmployeeAttendance;
