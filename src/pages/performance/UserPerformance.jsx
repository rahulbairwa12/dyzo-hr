import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import GroupChart5 from "@/components/partials/widget/chart/group-chart5";
import GroupChart4 from "@/components/partials/widget/chart/group-chart-4";
import DonutChart2 from "@/components/partials/widget/chart/dount-chart2";
import OrderChart from "@/components/partials/widget/chart/order-chart";
import userAvatar from "@/assets/images/all-img/main-user.png";
import Datepicker from "react-tailwindcss-datepicker";
import { djangoBaseURL } from "@/helper";
import { fetchAuthPost } from "@/store/api/apiSlice";
import { useParams } from "react-router-dom";
import Grid from "@/components/skeleton/Grid";

const StatisticWidget = ({ userInfo, projectId }) => {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // Separate states for different parts of the response
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [taskStatusCounts, setTaskStatusCounts] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [totalWorkingHours, setTotalWorkingHours] = useState(null);
  const [datewiseWorkingHours, setDatewiseWorkingHours] = useState([]);

  // Loading state
  const [loading, setLoading] = useState(true); // default to true while fetching data

  const { userId } = useParams();

  const getCurrentMonthRange = () => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    return {
      startDate: start,
      endDate: end,
    };
  };

  // Set default date range to current month
  useEffect(() => {
    const currentMonthRange = getCurrentMonthRange();
    setDateRange(currentMonthRange);

    // Call the API with default date range on mount
    fetchUserData(currentMonthRange.startDate, currentMonthRange.endDate);
  }, []);

  const fetchUserData = async (startDate, endDate) => {
    setLoading(true); // Set loading to true before fetching data
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const data = await fetchAuthPost(`${djangoBaseURL}/api/employee/per/${userId}/`, {
        body: { start_date: formattedStartDate, end_date: formattedEndDate, projectId },
      });

      const {
        employee_info,
        task_status_counts,
        attendance_data,
        total_working_hours,
        datewise_working_hours,
      } = data;

      setEmployeeInfo(employee_info);
      setTaskStatusCounts(task_status_counts);
      setAttendanceData(attendance_data);
      setTotalWorkingHours(total_working_hours);
      setDatewiseWorkingHours(datewise_working_hours);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false); // Set loading to false after the API call is completed
    }
  };

  const handleDateChange = (newValue) => {
    const { startDate, endDate } = newValue;

    if (startDate && endDate) {
      const newStartDate = new Date(startDate);
      const newEndDate = new Date(endDate);

      setDateRange({
        startDate: newStartDate,
        endDate: newEndDate,
      });

      // Call the API with the new date range
      fetchUserData(newStartDate, newEndDate);
    }
  };

  // Render fallback card when loading
  if (loading) {
    return (
      <Card>
        <Grid count={3} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="date-range-custom relative">
        <Datepicker
          inputClassName="input-class"
          value={dateRange}
          onChange={handleDateChange}
          separator="To"
          placeholder="Select Date Range"
          showShortcuts={true}
          containerClassName="container-class"
        />
      </div>

      <Card>
        <div className="grid xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-2 grid-cols-1 gap-5 place-content-center">
          <div className="flex space-x-4 h-full items-center rtl:space-x-reverse">
            <div className="flex-none">
              <div className="h-20 w-20 rounded-full">
                {employeeInfo?.profile_picture ? (
                  <img
                    src={djangoBaseURL + employeeInfo.profile_picture}
                    alt=""
                    className="block w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <img
                    src={`${import.meta.env.VITE_APP_DJANGO}/media/images/defalut.jpg`}
                    alt="Default"
                    className="w-full h-full object-cover rounded-full"
                  />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-medium mb-2">
                <span className="block font-light">Performance of</span>
                <span className="block">
                  {employeeInfo?.first_name} {employeeInfo?.last_name}
                </span>
              </h4>
              <p className="text-sm dark:text-slate-300">{employeeInfo?.designation}</p>
            </div>
          </div>
          <GroupChart5 totalWorkingHours={totalWorkingHours} datewiseWorkingHours={datewiseWorkingHours} attendanceData={attendanceData} />
        </div>
      </Card>

      {/* Task charts */}
      <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-3">
        <Card>
          <span className="block text-slate-500 dark:text-slate-300 text-sm font-medium">
            Completed Tasks
          </span>
          <DonutChart2
            taskStatusCounts={taskStatusCounts}
            taskType="completed_tasks"
            label="Completed"
            colors={["#50C793", "#E5F3E5"]}
          />
        </Card>
        <Card>
          <span className="block text-slate-500 dark:text-slate-300 text-sm font-medium">
            Pending Tasks
          </span>
          <DonutChart2
            taskStatusCounts={taskStatusCounts}
            taskType="pending_tasks"
            label="Pending"
            colors={["#F1595C", "#F9E1E5"]}
          />
        </Card>
        <Card>
          <span className="block text-slate-500 dark:text-slate-300 text-sm font-medium">
            In Progress Tasks
          </span>
          <DonutChart2
            taskStatusCounts={taskStatusCounts}
            taskType="in_progress_tasks"
            label="In Progress"
            colors={["#F5B041", "#FCF3CF"]}
          />
        </Card>
        <Card>
          <span className="block text-slate-500 dark:text-slate-300 text-sm font-medium">
            Archived Tasks
          </span>
          <DonutChart2
            taskStatusCounts={taskStatusCounts}
            taskType="archive_tasks"
            label="Archived"
            colors={["#A0AEC0", "#EDF2F7"]}
          />
        </Card>
      </div>

      <div className="grid md:grid-cols-3 sm:grid-cols-1 grid-cols-1 gap-3">
        <Card>
          <OrderChart
            title="Half Day Count"
            value={attendanceData?.half_day_count || 0}
            description="Half Days in this period"  
          />
        </Card>
        <Card>
          <OrderChart
            title="Holiday Work Hours"
            value={attendanceData?.total_holiday_work_hours || "00:00:00"}
            description="Work done on holidays"
            seriesData={[parseFloat(attendanceData?.total_holiday_work_hours.split(":")[0]) || 0]}
          />
        </Card>
        <Card>
          <OrderChart
            title="Weekend Work Hours"
            value={attendanceData?.total_weekend_work_hours || "00:00:00"}
            description="Work done on weekends"
            seriesData={[parseFloat(attendanceData?.total_weekend_work_hours.split(":")[0]) || 0]}
          />
        </Card>
      </div>

      <div className="grid xl:grid-cols-2 grid-cols-1 gap-5">
        <Card title="Skills" noborder>
          <div className="overflow-x-auto overflow-y-auto h-64"> {/* Set a fixed height and allow scrolling */}
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700">
                  <thead className="border-t border-slate-100 dark:border-slate-800">
                    <tr>
                      <th scope="col" className="w-1/6 table-th">S.N.</th> {/* Fixed width for serial number */}
                      <th scope="col" className="w-5/6 table-th">Skill</th> {/* Fixed width for skill column */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                    {employeeInfo?.skills && employeeInfo.skills.length > 0 ? (
                      employeeInfo.skills.map((skill, index) => (
                        <tr key={index}>
                          <td className="table-td">{index + 1}</td> {/* Serial number */}
                          <td className="table-td truncate">{skill}</td> {/* Skill name with truncation for long content */}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="table-td text-center">No skills found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StatisticWidget;
