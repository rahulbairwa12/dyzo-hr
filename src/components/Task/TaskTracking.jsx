import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { djangoBaseURL, isAdmin } from "@/helper";
import { fetchAPI, fetchDelete, postAPI } from "@/store/api/apiSlice";
import { formatLocalDateToDayMonth, NewformatDateTime } from "@/helper/helper";
import TaskTrackingDateTimePicker from "@/features/tasks/components/TaskTrackingDateTimePicker";

const TaskTracking = ({
  element,
  runningTaskId,
  setRunningTaskId,
  pauseCurrentTimer,
  userInfo,
  onLogsUpdated,
}) => {
  const [timer, setTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const modalRef = useRef(null);
  const datePickerRef = useRef(null);
  const [modalTaskId, setModalTaskId] = useState(null);
  const [modalUserId, setModalUserId] = useState(null);
  const [currentTaskLogs, setCurrentTaskLogs] = useState([]);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [totalTaskTime, setTotalTaskTime] = useState(
    element?.total_time || "0:0"
  );

 

  // Fetch the latest total time from the API
  const fetchTaskTotalTime = async (taskId) => {
    try {
      // Use the correct API endpoint for task details
      const response = await fetchAPI(`api/task-details/${taskId}/`);
      if (response?.status) {
        // Update the total time from API response
        if (response.data?.total_time) {
          setTotalTaskTime(response.data.total_time);
        }
      }
    } catch (error) {
      console.error("Error fetching task total time:", error);
    }
  };

  useEffect(() => {
    // Fetch total time on initial mount
    if (element?.taskId && !runningTaskId) {
      fetchTaskTotalTime(element.taskId);
    }

    const storedTask = JSON.parse(localStorage.getItem("runningTask"));
    if (storedTask && storedTask.taskId === element.taskId) {
      setRunningTaskId(storedTask.taskId);
      const elapsed = Math.floor(
        (Date.now() - new Date(storedTask.startTime).getTime()) / 1000
      );
      setElapsedTime(elapsed);
      startTimer();
    }
  }, [element.taskId, setRunningTaskId]);

  // Update totalTaskTime whenever element.total_time changes
  useEffect(() => {
    if (element?.total_time) {
      setTotalTaskTime(element.total_time);
    }
  }, [element.total_time]);

  const fetchTaskLogs = async (taskId) => {
    try {
      const response = await fetchAPI(`taskLogs/task/${taskId}/`);
      if (response?.status) {
        setCurrentTaskLogs(response?.data);
      }
    } catch (error) {
      toast.error(`Failed to fetch task Logs. Please try again.`);
    }
  };

  const startTimer = () => {
    const timerId = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    setTimer(timerId);
  };

  const handleStartTimer = async (taskId, event) => {
    event.stopPropagation();
    if (runningTaskId && runningTaskId !== taskId) {
      const userId = userInfo?._id;
      const endTime = new Date().toISOString();
      const storedTask = JSON.parse(localStorage.getItem("runningTask"));
      try {
        const response = await postAPI(`create_task_log/`, {
          body: {
            taskId: storedTask?.taskId,
            userId: userId,
            startTime: storedTask?.startTime,
            endTime: endTime,
          },
        });
        if (response.status) {
          toast.success(`Previous task session added successfully`);
          localStorage.removeItem("runningTask");

          // Fetch the updated total time for the previous task
          if (storedTask?.taskId) {
            fetchTaskTotalTime(storedTask.taskId);
          }
        }
      } catch (error) {
        toast.error(`Failed to add session.`);
      } finally {
        localStorage.removeItem("runningTask");
      }
      pauseCurrentTimer(runningTaskId, event);
    }
    setRunningTaskId(taskId);
    const startTime = new Date().toISOString();
    localStorage.setItem("runningTask", JSON.stringify({ taskId, startTime }));
    setElapsedTime(0);
    startTimer();
  };

  const pauseTimer = async (taskId, event) => {
    event.stopPropagation();
    const userId = userInfo?._id;
    const endTime = new Date().toISOString();
    const storedTask = JSON.parse(localStorage.getItem("runningTask"));
    try {
      const response = await postAPI(`create_task_log/`, {
        body: {
          taskId: taskId,
          userId: userId,
          startTime: storedTask?.startTime,
          endTime: endTime,
        },
      });
      if (response.status) {
        toast.success(`Session added successfully`);
        localStorage.removeItem("runningTask");
        onLogsUpdated();
        // Fetch the updated total time after adding a new session
        fetchTaskTotalTime(taskId);
      }
    } catch (error) {
      toast.error(`Failed to add session.`);
    } finally {
      localStorage.removeItem("runningTask");
    }

    setRunningTaskId(null);
    clearInterval(timer);
  };

  // handle Time Tracking
  const handleTimeTracking = (event, taskdetails) => {
    event.stopPropagation();
    setModalTaskId(taskdetails?.taskId);
    setModalUserId(taskdetails?.userId);
    fetchTaskLogs(taskdetails?.taskId);
  };

  // handle manual time
  const handleManualTime = (taskId, event) => {
    event.preventDefault();
    event.stopPropagation(); // Make sure to stop propagation

    // Ensure modal task ID and user ID are set
  
    setModalTaskId(taskId);
    setModalUserId(userInfo?._id);
    setShowDateTimePicker(true);
  };

  const handleBack = (taskId) => {
  
    if (taskId !== undefined) {
      fetchTaskLogs(taskId);
      // Also fetch updated total time when returning from manual time entry
      fetchTaskTotalTime(taskId);
      onLogsUpdated();
    }
    setShowDateTimePicker(false);
  };

  // Click handler for outside clicks
  const handleClickOutside = (event) => {
    // For task logs modal
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setModalTaskId(null);
      setModalUserId(null);
    }

    // For date picker modal
    if (
      datePickerRef.current &&
      !datePickerRef.current.contains(event.target) &&
      !showDateTimePicker
    ) {
      setShowDateTimePicker(false);
    }
  };

  useEffect(() => {
    if (modalTaskId === element.taskId || showDateTimePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalTaskId, element.taskId, showDateTimePicker]);

  const onClose = (event) => {
    event.stopPropagation();
    setModalTaskId(null);
    setModalUserId(null);
  };

  const handleDeleteTaskLog = async (taskLogId, taskId, event) => {
    event.preventDefault();
    try {
      const response = await fetchDelete(
        `${djangoBaseURL}/api/tasklogs/delete/${taskLogId}/`
      );
      if (response.status) {
        toast.success(`Task log deleted successfully`);
        fetchTaskLogs(taskId);
        // Fetch updated total time after deleting a log
        fetchTaskTotalTime(taskId);
        onLogsUpdated();
      } else {
        toast.error(`Failed to delete task log`);
      }
    } catch (error) {
      toast.error(`Failed to delete task log`);
    }
  };

  const formatTotalTime = (time) => {
    if (!time) return "0 h 0 m";

    const [hours, minutes] = time.split(":").map(Number);

    return `${hours} h ${minutes} m`;
  };

  function formatTaskTime(startTimeStr, endTimeStr) {
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    const optionsDate = { day: "2-digit", month: "short" }; // e.g., 20 May
    const optionsTime = { hour: "numeric", minute: "2-digit", hour12: true }; // e.g., 5:55 AM

    const datePart = startTime.toLocaleDateString("en-US", optionsDate);
    const startPart = startTime.toLocaleTimeString("en-US", optionsTime);
    const endPart = endTime.toLocaleTimeString("en-US", optionsTime);

    return `${datePart} ${startPart} - ${endPart}`;
  }

  return (
    <div
      className="w-full"
      key={`timetracking-${element?.taskId}`}
      data-task-id={element?.taskId}
    >
      <div className="relative">
        {/* {isAdmin() ? ( */}
        <div>
          {runningTaskId === element.taskId ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-slate-700/50 rounded-md p-1.5 border border-blue-100 dark:border-slate-600">
              <div className="flex items-center">
                <div
                  className="bg-blue-500 dark:bg-blue-600 text-white p-1.5 rounded-md cursor-pointer mr-2 hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                  onClick={(e) => pauseTimer(element.taskId, e)}
                >
                  <Icon icon="bi:pause-fill" className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                    Timer running
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                    {new Date(elapsedTime * 1000).toISOString().substr(11, 8)}
                  </span>
                </div>
              </div>
              <div className="flex items-center bg-white/80 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                <span className="text-[10px] text-gray-500 dark:text-slate-400 mr-1">
                  Total
                </span>
                <span className="text-xs font-medium text-gray-800 dark:text-slate-200">
                  {formatTotalTime(totalTaskTime)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-md p-1.5 border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center">
                <div
                  className="bg-blue-500 dark:bg-blue-600 text-white p-1.5 rounded-md cursor-pointer mr-2 hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                  onClick={(e) => handleStartTimer(element.taskId, e)}
                >
                  <Icon icon="mingcute:play-fill" className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                    Start tracking
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                    {formatTotalTime(totalTaskTime)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-blue-100 dark:border-slate-600 flex items-center gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setModalTaskId(element.taskId);
                    setModalUserId(userInfo?._id);
                    setShowDateTimePicker(true);
                  
                  }}
                  title="Add time manually"
                >
                  <Icon icon="heroicons:plus-16-solid" className="h-3 w-3" />
                  <span className="hidden sm:inline">Add time</span>
                </button>
                <button
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-blue-100 dark:border-slate-600 flex items-center gap-1"
                  onClick={(e) => handleTimeTracking(e, element)}
                  title="View time entries"
                >
                  <Icon icon="heroicons:clock" className="h-3 w-3" />
                  <span className="hidden sm:inline">View Logs</span>
                </button>
              </div>
            </div>
          )}
        </div>
        {/* ) : (
                    <div className="flex items-center justify-between rounded-md p-2">
                        <div className="flex items-center">
                            <div className="bg-gray-200 dark:bg-slate-600 p-2 rounded-md mr-3">
                                <Icon
                                    icon="mingcute:time-fill"
                                    className="w-5 h-5 text-gray-500 dark:text-gray-300"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 dark:text-gray-300">
                                    Total time
                                </span>
                                <span className="text-lg font-medium">
                                    {formatTotalTime(totalTaskTime)}
                                </span>
                            </div>
                        </div>
                    </div>
                )} */}

        {/* Task Logs Modal */}
        {modalTaskId === element.taskId && !showDateTimePicker && (
          <div
            ref={modalRef}
            className="absolute w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 z-40 rounded-md shadow-lg -mt-1 right-0"
          >
            <div className="relative">
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-center pb-2 gap-2 sm:gap-0">
                  <h2 className="text-gray-800 dark:text-slate-200 text-base sm:text-lg font-semibold flex items-center gap-1.5">
                    <Icon
                      icon="mdi:clock-outline"
                      className="h-4 w-4 text-blue-500 dark:text-blue-400"
                    />
                    Time Tracking Log
                  </h2>
                  <button
                    className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={(e) => onClose(e)}
                  >
                    <Icon icon="lucide:x" className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>

                <div className="flex justify-center items-center py-1.5">
                  <button
                    className="border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium flex justify-center gap-1.5 items-center hover:bg-gray-50 dark:hover:bg-slate-700 rounded-md w-full sm:w-auto"
                    onClick={(e) => handleManualTime(element.taskId, e)}
                  >
                    <Icon icon="bi:plus" className="h-3.5 w-3.5" />
                    Add session manually
                  </button>
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block rounded-md border border-gray-200 dark:border-slate-700 mt-3 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                        <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 dark:text-slate-300">
                          Time
                        </th>
                        <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 dark:text-slate-300">
                          Duration
                        </th>
                        <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 dark:text-slate-300">
                          Type
                        </th>
                        <th className="text-left px-2 py-2 text-xs font-medium text-gray-500 dark:text-slate-300 w-16">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTaskLogs.length > 0 ? (
                        currentTaskLogs.map((taskLog, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                          >
                            <td className="px-2 py-2 text-xs font-medium text-gray-700 dark:text-slate-300">
                              {taskLog.manualAdd
                                ? formatTaskTime(
                                    taskLog.startTime,
                                    taskLog.endTime
                                  )
                                : NewformatDateTime(
                                    taskLog.startTime,
                                    taskLog.endTime
                                  )}
                            </td>
                            <td className="px-2 py-2 text-xs font-medium text-gray-700 dark:text-slate-300">
                              {taskLog.duration}
                            </td>
                            <td className="px-2 py-2 text-xs">
                              {taskLog.manualAdd ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-slate-300">
                                  <Icon
                                    icon="mdi:account"
                                    className="h-2.5 w-2.5 mr-0.5"
                                  />
                                  Manual
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  <Icon
                                    icon="mdi:clock-outline"
                                    className="h-2.5 w-2.5 mr-0.5"
                                  />
                                  Timer
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-xs">
                              {taskLog.manualAdd && (
                                <button
                                  className="h-6 w-6 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                                  onClick={(e) =>
                                    handleDeleteTaskLog(
                                      taskLog.taskLogId,
                                      taskLog.taskId,
                                      e
                                    )
                                  }
                                >
                                  <Icon icon="mdi:trash" className="h-3.5 w-3.5" />
                                  <span className="sr-only">Delete entry</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-3 py-6 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <Icon
                                icon="mdi:clock-outline"
                                className="h-6 w-6 text-gray-400 dark:text-gray-500"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                No time entries found
                              </p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                Start tracking time or add entries manually
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List - Improved for compactness */}
                <div className="sm:hidden mt-3 space-y-2">
                  {currentTaskLogs.length > 0 ? (
                    currentTaskLogs.map((taskLog, index) => (
                      <div
                        key={index}
                        className="rounded-md border border-gray-200 dark:border-slate-700 p-2 flex flex-col gap-1 bg-gray-50 dark:bg-slate-700/40"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1 items-center">
                            {taskLog.manualAdd ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-slate-300">
                                <Icon
                                  icon="mdi:account"
                                  className="h-2.5 w-2.5 mr-0.5"
                                />
                                Manual
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                <Icon
                                  icon="mdi:clock-outline"
                                  className="h-2.5 w-2.5 mr-0.5"
                                />
                                Timer
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium ml-1">
                              {taskLog.duration}
                            </span>
                          </div>
                          {taskLog.manualAdd && (
                            <button
                              className="h-6 w-6 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                              onClick={(e) =>
                                handleDeleteTaskLog(
                                  taskLog.taskLogId,
                                  taskLog.taskId,
                                  e
                                )
                              }
                            >
                              <Icon icon="mdi:trash" className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        
                        <div className="text-[10px] text-gray-700 dark:text-slate-300 font-medium">
                          {taskLog.manualAdd
                            ? formatTaskTime(taskLog.startTime, taskLog.endTime)
                            : NewformatDateTime(taskLog.startTime, taskLog.endTime)
                          }
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-6">
                      <Icon
                        icon="mdi:clock-outline"
                        className="h-6 w-6 text-gray-400 dark:text-gray-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No time entries found
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        Start tracking time or add entries manually
                      </p>
                    </div>
                  )}
                </div>

                {currentTaskLogs.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 mt-2 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 gap-1 sm:gap-0">
                    <span>Total entries: {currentTaskLogs.length}</span>
                    <span>Total time: {totalTaskTime}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Date Time Picker Modal - Completely separate from task logs modal */}
        {showDateTimePicker && (
          <div
            ref={datePickerRef}
            className="absolute w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 z-50 rounded-md shadow-2xl -mt-1 right-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:min-w-[350px] sm:min-h-[250px] relative">
              {console.log("Rendering separate date time picker modal", {
                taskId: modalTaskId,
                userId: modalUserId || userInfo?._id,
              })}
              <TaskTrackingDateTimePicker
                onClose={(id) => {

                  handleBack(id || modalTaskId);
                }}
                taskId={modalTaskId}
                userId={modalUserId || userInfo?._id}
                closeLog={(e)=>onClose(e)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskTracking;
