import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import useWidth from "@/hooks/useWidth";
import { useSelector, useDispatch } from "react-redux";
import { fetchAuthGET } from "@/store/api/apiSlice";
import Datepicker from "react-tailwindcss-datepicker";
import Select from "react-select";
import ApplyLeave from "./ApplyLeave";
import dayjs from "dayjs";
import { intialLetterName } from "@/helper/helper";
import LeaveCard from "./LeaveCard";
import LeaveTable from "./LeaveTable";
import SkeletionTable from "@/components/skeleton/Table";
import { useSearchParams } from 'react-router-dom';

const Leaves = (leave) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filler, setFiller] = useState("grid");
  const [openProjectModal, setOpenProjectModel] = useState(false);
  const { width, breakpoints } = useWidth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const userInfo = useSelector((state) => state?.auth.user);
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const [currentUserId, setCurrentUserId] = useState(searchParams.get('user') || "0");
  const [value, setValue] = useState({
    startDate: dayjs().startOf('year').format('YYYY-MM-DD'), // Start of the current year
    endDate: dayjs().endOf('year').format('YYYY-MM-DD'),     // End of the current year
  });
  const [leaves, setLeaves] = useState([]);
  const [tabData, setTabData] = useState({});
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || "All Leaves");
  const [showDatePick, setShowDatePick] = useState(false);


  const fetchLeaves = async (selectedEmployeeId = null) => {
    try {
      setIsLoaded(true);
      let apiUrl = '';
      const params = new URLSearchParams();
      if (value.startDate) params.append('start_date', value.startDate);
      if (value.endDate) params.append('end_date', value.endDate);


        apiUrl = `${baseURL}/employee/${leave.leave.employee}/leaves/`;

      const data = await fetchAuthGET(`${apiUrl}?${params.toString()}`);

      if (data) {
        let filteredData = data;
        if (selectedEmployeeId && selectedEmployeeId !== '0') {
          filteredData = data.filter((leave) => leave.employee_id === parseInt(selectedEmployeeId));
        }

        const approvedCount = filteredData.filter(leave => leave.status === 'Approved').length;
        const declinedCount = filteredData.filter(leave => leave.status === 'Rejected').length;
        const pendingCount = filteredData.filter(leave => leave.status === 'Pending').length;
        const totalLeave = filteredData.length;

        setLeaves(filteredData);
        setTabData({
          totalTaskProject: filteredData,
          incompleteTaskProject: filteredData.filter((leave) => leave.status === "Pending"),
          completedTaskProject: filteredData.filter((leave) => leave.status === "Approved"),
          rejectedTaskProject: filteredData.filter((leave) => leave.status === "Rejected"),
          counts: {
            totalLeave,
            approvedCount,
            declinedCount,
            pendingCount
          }
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoaded(false);
    }
  };

  useEffect(() => {
    const getAllEmployee = async () => {
      try {
        let data;
        if (userInfo?.isAdmin) {
          // Using the dedicated activeUsers endpoint to fetch only active employees
          data = await fetchAuthGET(`${baseURL}/employee/list/activeUsers/${userInfo?.companyId}`);
        } else if (userInfo?.team_leader) {
          data = await fetchAuthGET(`${baseURL}/api/team/members/${userInfo?._id}`);
        }

        if (data.status && data.data.length > 0) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    getAllEmployee();
    fetchLeaves(currentUserId);
  }, [userInfo, baseURL, currentUserId, value]);

  const userOptions = [
    { value: '0', label: 'All', name: 'All' },
    ...users.map(user => ({
      value: user._id?.toString(),
      label: user.name,
      image: user.profile_picture,
      name: user.name,
    }))
  ];

  const handleUserChange = (selectedOption) => {
    setCurrentUserId(selectedOption.value);
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      user: selectedOption.value,
    });
    fetchLeaves(selectedOption.value);
  };

  const handleValueChange = (newValue) => {
    const formattedStartDate = dayjs(newValue.startDate).format('YYYY-MM-DD');
    const formattedEndDate = dayjs(newValue.endDate).format('YYYY-MM-DD');
    setValue({ startDate: formattedStartDate, endDate: formattedEndDate });
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    });
    fetchLeaves(currentUserId);
  };

  const handleRangeChange = (e) => {
    const range = e.target.value;
    let startDate, endDate;

    setShowDatePick(range === "custom");

    switch (range) {
      case "today":
        startDate = endDate = dayjs().format("YYYY-MM-DD");
        break;
      case "yesterday":
        startDate = endDate = dayjs().subtract(1, 'day').format("YYYY-MM-DD");
        break;
      case "thisWeek":
        startDate = dayjs().startOf('week').format("YYYY-MM-DD");
        endDate = dayjs().endOf('week').format("YYYY-MM-DD");
        break;
      case "thisMonth":
        startDate = dayjs().startOf('month').format("YYYY-MM-DD");
        endDate = dayjs().endOf('month').format("YYYY-MM-DD");
        break;
      case "thisYear":
        startDate = dayjs().startOf('year').format("YYYY-MM-DD");
        endDate = dayjs().endOf('year').format("YYYY-MM-DD");
        break;
      case "lastWeek":
        startDate = dayjs().subtract(1, 'week').startOf('week').format("YYYY-MM-DD");
        endDate = dayjs().subtract(1, 'week').endOf('week').format("YYYY-MM-DD");
        break;
      case "lastMonth":
        startDate = dayjs().subtract(1, 'month').startOf('month').format("YYYY-MM-DD");
        endDate = dayjs().subtract(1, 'month').endOf('month').format("YYYY-MM-DD");
        break;
      case "lastYear":
        startDate = dayjs().subtract(1, 'year').startOf('year').format("YYYY-MM-DD");
        endDate = dayjs().subtract(1, 'year').endOf('year').format("YYYY-MM-DD");
        break;
      default:
        return;
    }
    setValue({ startDate, endDate });
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), startDate, endDate, });
    fetchLeaves(currentUserId);
  };

  const handleCardClick = (status) => {
    setSelectedStatus(status);
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      status,
    });
  };

  const formatOptionLabel = ({ value, label, image, name }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div>
        {image ? (
          <img src={`${baseURL}${image}`} alt={label} style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 10 }} />
        ) : (
          <span className="bg-[#002D2D] text-white h-[2rem] w-[2rem] flex justify-center items-center rounded-full mr-2 font-bold text-lg leading-none custom-avatar">
            {intialLetterName('', '', name)}
          </span>
        )}
      </div>
      <div>{label}</div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-4 p-4">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 dark:text-white inline-block ltr:pr-4 rtl:pl-4">
        {`All Leave of ${leave.leave.employeeName} for This Year`}
        </h4>

      </div>
      <div className="2xl:col-span-9 lg:col-span-8 col-span-12 my-2">
        <Card bodyClass="p-4">
          <div className="grid md:grid-cols-4 col-span-1 gap-4">
            <LeaveCard
              tabData={tabData}
              onCardClick={handleCardClick}
              selectedStatus={selectedStatus}
            />
          </div>
        </Card>
      </div>

      {
        isLoaded && (
          <div className="loader"><SkeletionTable count='20' /></div>
        )
      }

      {
        !isLoaded && (
          <LeaveTable data={leaves.filter((leave) => {
            if (selectedStatus === "All Leaves") return true;
            if (selectedStatus === "Pending Requests") return leave.status === "Pending";
            if (selectedStatus === "Approved Leaves") return leave.status === "Approved";
            if (selectedStatus === "Rejected Leaves") return leave.status === "Rejected";
            return false;
          })} fetchLeaves={fetchLeaves} />
        )
      }

      <ApplyLeave openProjectModal={openProjectModal} setOpenProjectModel={setOpenProjectModel} fetchLeaves={fetchLeaves} />
    </div>
  );
};

export default Leaves;
