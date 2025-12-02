import React, { useEffect, useState, useRef } from "react";
import { fetchAuthGET, isAdmin, postAPI } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import Select from "react-select";
import { intialLetterName } from "@/helper/initialLetterName";
import { Icon } from "@iconify/react";

const TaskTrackingDateTimePicker = ({ onClose, taskId, userId, closeLog }) => {
  const today = new Date();
  const userInfo = useSelector((state) => state.auth.user);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(600);
  const [endTime, setEndTime] = useState(840);
  const [duration, setDuration] = useState(60);
  const [selectedEmployee, setSelectedEmployee] = useState(userId || "");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [employeeList, setEmployeeList] = useState([]);
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(null);
  const [durationHours, setDurationHours] = useState(Math.floor(duration / 60));
  const [durationMinutes, setDurationMinutes] = useState(duration % 60);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (!taskId) {
      console.error("TaskTrackingDateTimePicker: Missing taskId");
      onClose && onClose();
    }
  }, [taskId, userId, onClose]);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours
      .toString()
      .padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  };

  const isToday = (date) => {
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const isYesterday = (date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  };

  const formatDate = (date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitialLetterName = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getPercentage = (value, min = 0, max = 1440) =>
    ((value - min) / (max - min)) * 100;

  const getEmployee = async () => {
    try {
      const response = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/employee/list/${
          userInfo?.companyId
        }/`
      );
      if (response.status) {
        const activeEmployees = response.data.filter(
          (employee) => employee.isActive
        );
        setEmployeeList(activeEmployees);
      }
    } catch (error) {
      setEmployeeList([]);
    }
  };

  useEffect(() => {
    if (userInfo.companyId !== undefined && userInfo.isAdmin) {
      getEmployee();
    }
  }, [userInfo?.companyId]);

  const userOptions = employeeList.map((user) => ({
    value: user?._id?.toString(),
    label: user.name,
    image: user.profile_picture,
  }));

  const formatOptionLabel = ({ label, image }) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      {image ? (
        <img
          src={`${import.meta.env.VITE_APP_DJANGO}${image}`}
          alt={label}
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            marginRight: 10,
          }}
        />
      ) : (
        <span className="h-8 w-8 rounded-full text-sm bg-[#002D2D] text-white dark:bg-[#002D2D] mr-2 flex flex-col items-center justify-center font-medium -tracking-[1px]">
          {intialLetterName("", "", label)}{" "}
        </span>
      )}

      <div>{label}</div>
    </div>
  );

  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: "#ccc",
      "&:hover": { borderColor: "lightgray" },
      padding: "2px",
      borderRadius: "5px",
    }),
    option: (provided, state) => ({
      ...provided,
      color: "black",
      backgroundColor: state.isSelected ? "lightgray" : "white",
      "&:hover": {
        backgroundColor: "lightgray",
      },
    }),
  };

  const handleMouseDown = (type) => (e) => {
    e.preventDefault();
    setIsDragging(type);
  };

  // Update handleMouseMove logic to keep duration constant
  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    );
    const value = Math.round((percentage / 100) * (1440 - 0) + 0);
    const steppedValue = Math.round(value / 15) * 15;
    if (isDragging === "start") {
      // Move start handle and keep duration constant
      let newStart = Math.min(steppedValue, 1440 - duration); // ensure room for duration
      if (newStart < 0) newStart = 0;
      let newEnd = newStart + duration;
      setStartTime(newStart);
      setEndTime(newEnd);
    } else {
      // Move end handle and keep duration constant
      let newEnd = Math.max(steppedValue, duration); // at least duration
      if (newEnd > 1440) newEnd = 1440;
      let newStart = newEnd - duration;
      setEndTime(newEnd);
      setStartTime(newStart);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, startTime, endTime]);

  useEffect(() => {
    setDurationHours(Math.floor(duration / 60));
    setDurationMinutes(duration % 60);
  }, [duration]);

  const handleDurationHoursChange = (e) => {
    let hours = parseInt(e.target.value, 10);
    if (isNaN(hours) || hours < 0) hours = 0;
    if (hours > 23) hours = 23;
    setDurationHours(hours);
    const newDuration = hours * 60 + durationMinutes;
    if (newDuration > 0 && newDuration <= 1440) {
      setDuration(newDuration);
      setEndTime(startTime + newDuration);
    }
  };

  const handleDurationMinutesChange = (e) => {
    let minutes = parseInt(e.target.value, 10);
    if (isNaN(minutes) || minutes < 0) minutes = 0;
    if (minutes > 59) minutes = 59;
    setDurationMinutes(minutes);
    const newDuration = durationHours * 60 + minutes;
    if (newDuration > 0 && newDuration <= 1440) {
      setDuration(newDuration);
      setEndTime(startTime + newDuration);
    }
  };

  function updateDurationAndTimes(newDuration) {
    const now = new Date();
    let newEndTime;
    if (isToday(selectedDate)) {
      newEndTime = now.getHours() * 60 + now.getMinutes();
      newEndTime = Math.floor(newEndTime / 5) * 5;
    } else {
      newEndTime = 23 * 60 + 59;
    }
    let newStartTime = newEndTime - newDuration;
    if (newStartTime < 0) newStartTime = 0;
    setEndTime(newEndTime);
    setStartTime(newStartTime);
    setDuration(newDuration);
  }
  // Update handleStartTimeInput to keep duration constant
  const handleStartTimeInput = (e) => {
    const newStartTime = timeStringToMinutes(e.target.value);
    if (newStartTime >= 0 && newStartTime <= 1440 - duration) {
      setStartTime(newStartTime);
      setEndTime(newStartTime + duration);
    }
  };

  // Update handleEndTimeInput to keep duration constant
  const handleEndTimeInput = (e) => {
    const newEndTime = timeStringToMinutes(e.target.value);
    if (newEndTime >= duration && newEndTime <= 1440) {
      setEndTime(newEndTime);
      setStartTime(newEndTime - duration);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      let newEndTime;
      if (isToday(selectedDate)) {
        const now = new Date();
        newEndTime = now.getHours() * 60 + now.getMinutes();
        newEndTime = Math.floor(newEndTime / 5) * 5;
      } else {
        newEndTime = 23 * 60 + 59;
      }
      let newStartTime = newEndTime - duration;
      if (newStartTime < 0) newStartTime = 0;
      setEndTime(newEndTime);
      setStartTime(newStartTime);
    }
  }, [selectedDate]);

  const handleDateClick = () => {
    setIsDatePickerOpen(!isDatePickerOpen);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  const validateSession = () => {
    const sessionDate = new Date(selectedDate);
    const now = new Date();

    sessionDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    if (sessionDate > now) {
      setErrorMessage("Can't select future date.");
      return false;
    }

    if (endTime <= startTime) {
      setErrorMessage("End time must be after start time.");
      return false;
    }

    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(Math.floor(endTime / 60), endTime % 60, 0, 0);

    const currentDateTime = new Date();

    if (selectedDateTime > currentDateTime) {
      setErrorMessage("Can't select future time.");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const formatDateWithoutTimezone = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const handleAddSession = async () => {
    if (!validateSession()) return;

    setIsLoading(true);
    try {
      const sessionDate = new Date(selectedDate);
      const startDateTime = new Date(sessionDate);
      startDateTime.setHours(Math.floor(startTime / 60), startTime % 60, 0, 0);

      const endDateTime = new Date(sessionDate);
      endDateTime.setHours(Math.floor(endTime / 60), endTime % 60, 0, 0);

      const startISO = formatDateWithoutTimezone(startDateTime);
      const endISO = formatDateWithoutTimezone(endDateTime);

      const response = await postAPI(`create_task_log/`, {
        body: {
          taskId: taskId,
          userId: selectedEmployee,
          startTime: startISO,
          endTime: endISO,
        },
      });

      if (response?.status) {
        toast.success("Session added successfully.");
        onClose(taskId);
      } else {
        if (response?.response?.data?.non_field_errors) {
          setErrorMessage("Duplicate Time Log.");
          toast.error("Duplicate Time Log.");
        } else {
          setErrorMessage(response?.message || "Failed to add session.");
          toast.error(response?.message || "Failed to add session.");
        }
      }
    } catch (error) {
      setErrorMessage("Failed to add session. Please try again.");
      toast.error("Failed to add session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const minutesToTimeString = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const timeStringToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const handleQuickTimeSelect = (presetMinutes) => {
    const now = new Date();
    let newEndTime;
    if (isToday(selectedDate)) {
      newEndTime = now.getHours() * 60 + now.getMinutes();
      newEndTime = Math.floor(newEndTime / 5) * 5;
    } else {
      newEndTime = 23 * 60 + 59;
    }
    let newStartTime = newEndTime - presetMinutes;
    if (newStartTime < 0) newStartTime = 0;
    setEndTime(newEndTime);
    setStartTime(newStartTime);
    setDuration(presetMinutes);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        onClose();
        closeLog(e);
      }}
    >
      <div 
        className="w-full max-w-sm mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <Icon icon="lucide:clock" className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <h2 className="text-sm font-medium text-gray-800 dark:text-slate-200">Log Time</h2>
          </div>
          <button
            onClick={(e) => {
              onClose();
              closeLog(e);
            }}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <Icon icon="lucide:x" className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 space-y-3">
          {/* Date and Duration Row */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-6 space-y-0.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon icon="lucide:calendar" className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                <label className="text-xs font-medium text-gray-600 dark:text-slate-300">
                  Select Date
                </label>
              </div>
              <div className="relative">
                <button
                  onClick={handleDateClick}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-left border border-gray-200 dark:border-slate-600 rounded-md hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors bg-white dark:bg-slate-700"
                >
                  <div className="flex items-center space-x-2">
                    <Icon
                      icon="lucide:calendar-days"
                      className="h-3.5 w-3.5 text-gray-400 dark:text-slate-400"
                    />
                    <span className="text-gray-700 dark:text-slate-200 text-xs">{formatDate(selectedDate)}</span>
                  </div>
                  <Icon
                    icon={isDatePickerOpen ? "lucide:chevron-up" : "lucide:chevron-down"}
                    className="h-3 w-3 text-gray-400 dark:text-slate-400"
                  />
                </button>

                {isDatePickerOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 p-2 min-w-[260px] animate-fadeIn">
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setSelectedDate(newDate);
                        }}
                        className="p-0.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      >
                        <Icon icon="lucide:chevron-left" className="h-3 w-3 text-gray-600 dark:text-slate-300" />
                      </button>
                      <span className="font-medium text-gray-700 dark:text-slate-300 text-xs">
                        {selectedDate.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        onClick={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setSelectedDate(newDate);
                        }}
                        className="p-0.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      >
                        <Icon icon="lucide:chevron-right" className="h-3 w-3 text-gray-600 dark:text-slate-300" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                        <div key={day} className="p-0.5 font-medium text-gray-500 dark:text-slate-400 text-[10px]">
                          {day}
                        </div>
                      ))}
                      {calendarDays.map((date, index) => {
                        const isCurrentDay =
                          date.toDateString() === new Date().toDateString();
                        const isSelected =
                          date.toDateString() === selectedDate.toDateString();
                        const isDisabled =
                          date > new Date() ||
                          date.getMonth() !== selectedDate.getMonth();

                        return (
                          <button
                            key={index}
                            onClick={() => !isDisabled && handleDateSelect(date)}
                            disabled={isDisabled}
                            className={`p-0.5 text-[10px] rounded transition-all ${
                              isSelected
                                ? "bg-blue-500 text-white"
                                : isCurrentDay
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                : isDisabled
                                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-6 space-y-0.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon icon="lucide:clock" className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                <label className="text-xs font-medium text-gray-600 dark:text-slate-300">
                  Duration
                </label>
              </div>
              <div className="flex gap-1 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    min="0"
                    max="23"
                    value={durationHours}
                    onChange={handleDurationHoursChange}
                    className="w-full px-2 py-1.5 text-center border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    aria-label="Duration hours"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 text-xs">
                    h
                  </span>
                </div>
                <div className="relative flex-1">
                  <input
                    type="text"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={handleDurationMinutesChange}
                    className="w-full px-2 py-1.5 text-center border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    aria-label="Duration minutes"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 text-xs">
                    m
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* Time Range Section */}
          <div className="bg-gray-50 dark:bg-slate-700/40 p-2 rounded-lg border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-0.5">
                  Start Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={minutesToTimeString(startTime)}
                    onChange={handleStartTimeInput}
                    className="px-2 py-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors pr-2"
                    step="300"
                  />
{/*                 <Icon
                  icon="lucide:clock"
                  className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 h-3 w-3"
                /> */}
                </div>
              </div>

              <div className="h-px w-10 bg-gray-300 dark:bg-slate-600 hidden sm:block"></div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-0.5">
                  End Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={minutesToTimeString(endTime)}
                    onChange={handleEndTimeInput}
                    className="px-2 py-1 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors pr-2"
                    step="300"
                  />
                 {/*  <Icon
                  icon="lucide:clock"
                  className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 h-3 w-3"
                /> */}
                </div>
              </div>
            </div>

            <div className="relative mb-1">
              <div
                ref={sliderRef}
                className="relative h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full cursor-pointer"
              >
                {/* Current time indicator */}
                {isToday(selectedDate) && (
                  <div
                    className="absolute w-0.5 h-3 bg-red-500 dark:bg-red-400 rounded-full z-10"
                    style={{
                      left: `${getPercentage(
                        new Date().getHours() * 60 + new Date().getMinutes()
                      )}%`,
                      transform: "translateX(-50%) translateY(-0.5px)",
                    }}
                    title="Current time"
                  />
                )}

                <div
                  className="absolute h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-400 rounded-full"
                  style={{
                    left: `${getPercentage(startTime)}%`,
                    width: `${getPercentage(endTime) - getPercentage(startTime)}%`,
                  }}
                ></div>

                {/* Start handle */}
                <div
                  className="absolute h-3 w-3 rounded-full bg-white dark:bg-slate-200 border border-blue-500 top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-move z-20 shadow-sm"
                  style={{ left: `${getPercentage(startTime)}%` }}
                  onMouseDown={handleMouseDown("start")}
                  onTouchStart={handleMouseDown("start")}
                ></div>

                {/* End handle */}
                <div
                  className="absolute h-3 w-3 rounded-full bg-white dark:bg-slate-200 border border-blue-500 top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-move z-20 shadow-sm"
                  style={{ left: `${getPercentage(endTime)}%` }}
                  onMouseDown={handleMouseDown("end")}
                  onTouchStart={handleMouseDown("end")}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-400 mt-1">
                <span>12am</span>
                <span>6am</span>
                <span>12pm</span>
                <span>6pm</span>
                <span>12am</span>
              </div>
            </div>
          </div>

          {/* Error message if any */}
          {errorMessage && (
            <div className="text-red-500 dark:text-red-400 text-xs p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900/30">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleAddSession}
              disabled={isLoading}
              className={`flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors 
                ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <Icon icon="svg-spinners:180-ring" className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon icon="lucide:plus-circle" className="h-3.5 w-3.5" />
              )}
              Add Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskTrackingDateTimePicker;