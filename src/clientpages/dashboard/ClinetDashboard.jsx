import { React, useEffect, useState, useCallback } from "react";
// import DashboardTopFields from "@/pages/dashboard/DashboardTopFields";
import { useSelector } from "react-redux";
import { Greeting } from "@/helper/helper";
// import DashboardWelcomeCard from "@/pages/dashboard/DashboardWelcomeCard";
import { fetchAuthPost } from "@/store/api/apiSlice";
import { toast } from "react-toastify";
// import DashboardInfoCard from "@/pages/dashboard/DashboardInfoCard";
import Card from "@/components/ui/Card";
// import TaskTable from "@/pages/dashboard/TaskTable";
import RadialsChart from "@/components/partials/widget/chart/radials";

const ClientDashboard = () => {
  const userInfo = useSelector((state) => state.auth.user);
  const hour = new Date().getHours();
  const [taskStatistcs, setTaskStatistcs] = useState({});
  const [taskLists, setTaskLists] = useState([]);
  const [taskCount, setTaskCount] = useState({});
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("2024-07-25");
  const [endDate, setEndDate] = useState("2024-07-25");
  const [selectedProject, setSelectedProject] = useState("0");

  const handleFilterChange = (newFilter) => {
  
    setStartDate(newFilter.startDate);
    setEndDate(newFilter.endDate);
    setSelectedProject(newFilter.projectId);
  };

  const fetchTaskStatistcs = useCallback(async () => {
    try {
      const taskStatistcs = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/api/client/${userInfo._id}/tasks-statistics/`, { body: { startDate, endDate } });
      if (taskStatistcs) {
        setTaskStatistcs(taskStatistcs);
      }
    } catch {

    }
  }, [startDate, endDate, userInfo._id]);

  const fetchTaskDetails = useCallback(async () => {
    try {
      const { data } = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/api/client/${userInfo._id}/tasks/`, { body: { startDate, endDate } });
      if (data) {
        setTaskLists(data);
      }
    } catch {

    }
  }, [startDate, endDate, userInfo._id]);

  const fetchTaskCount = useCallback(async () => {
    try {
      let response;
      if (selectedProject === "0") {
        response = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/client/${userInfo._id}/task-count/`, { body: { startDate, endDate } });
      } else {
        response = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/project/${selectedProject}/task-count/`, { body: { startDate, endDate } });
      }
      if (response) {
        setTaskCount(response);
      }
    } catch (error) {

    }
  }, [startDate, endDate, selectedProject, userInfo._id]);

  useEffect(() => {
    fetchTaskStatistcs();
  }, [fetchTaskStatistcs]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  useEffect(() => {
    fetchTaskCount();
  }, [fetchTaskCount]);

  return (
    <>
      {/* <DashboardTopFields title={`${Greeting(hour)} ${userInfo?.clientName}!`} onFilterChange={handleFilterChange} /> */}
      <div className="grid grid-cols-12 gap-5 mb-5">
        <div className="2xl:col-span-3 lg:col-span-4 col-span-12">
          {/* <DashboardWelcomeCard total_working_hours={taskStatistcs?.total_working_hours} /> */}
        </div>
        {/* <div className="2xl:col-span-9 lg:col-span-8 col-span-12">
          <Card bodyClass="p-4">
            <div className="grid md:grid-cols-3 col-span-1 gap-4">
              <DashboardInfoCard tabData={taskStatistcs} />
            </div>
          </Card>
        </div> */}
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
        {/* <Card title="Task Information">
          <TaskTable data={taskLists} />
        </Card> */}
        <Card title="Tasks">
          <RadialsChart totalTasksData={taskCount} />
        </Card>
      </div>
    </>
  );
};

export default ClientDashboard;
