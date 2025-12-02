import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import useWidth from "@/hooks/useWidth";
import { useSelector } from "react-redux";
import { fetchAuthGET } from "@/store/api/apiSlice";
import Datepicker from "react-tailwindcss-datepicker";
import Select from "react-select";
import ApplyLeave from "./ApplyLeave";
import dayjs from "dayjs";
import { intialLetterName } from "@/helper/helper";
import LeaveCard from "./LeaveCard";
import LeaveTable from "./LeaveTable";
import SkeletionTable from "@/components/skeleton/Table";
import { useSearchParams } from "react-router-dom";
import { getAuthToken } from "@/utils/authToken";
import ApplyLeaveForOther from "./ApplyLeaveForOther";
import { Icon } from "@iconify/react";
import Cookies from "js-cookie";
import { ToastContainer } from "react-toastify";

const Leaves = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openProjectModal, setOpenProjectModel] = useState(false);
  const { width, breakpoints } = useWidth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [users, setUsers] = useState([]);
  const userInfo = useSelector((state) => state?.auth.user);
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const [currentUserId, setCurrentUserId] = useState(searchParams.get("user") || "0");
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Initialize the date range from URL (or default to current month)
  const initialStartDate =
    searchParams.get("startDate") || dayjs().startOf("month").format("YYYY-MM-DD");
  const initialEndDate =
    searchParams.get("endDate") || dayjs().endOf("month").format("YYYY-MM-DD");
  const [value, setValue] = useState({
    startDate: initialStartDate,
    endDate: initialEndDate,
  });
  const [leaves, setLeaves] = useState([]);
  const [tabData, setTabData] = useState({});
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get("status") || "All Leaves"
  );
  const [showDatePick, setShowDatePick] = useState(false);
  const [openOtherEmployeeLeaveModel, setOpenOtherEmployeeLeaveModel] = useState(false);
  const [dropMenu, setDropMenu] = useState(false);

  // Sync state with URL search params when they change (e.g. on navigating back)
  useEffect(() => {
    const startDateFromParams = searchParams.get("startDate");
    const endDateFromParams = searchParams.get("endDate");
    if (startDateFromParams && endDateFromParams) {
      if (
        startDateFromParams !== value.startDate ||
        endDateFromParams !== value.endDate
      ) {
        setValue({ startDate: startDateFromParams, endDate: endDateFromParams });
      }
    }
    const userParam = searchParams.get("user");
    if (userParam && userParam !== currentUserId) {
      setCurrentUserId(userParam);
    }
    const statusParam = searchParams.get("status");
    if (statusParam && statusParam !== selectedStatus) {
      setSelectedStatus(statusParam);
    }
  }, [searchParams]);

  // API call for leaves – note we build the query string using the current value state
  const fetchLeaves = async (selectedEmployeeId = null) => {
    try {
      setIsLoaded(true);
      let apiUrl = "";
      const params = new URLSearchParams();
      if (value.startDate) params.append("start_date", value.startDate);
      if (value.endDate) params.append("end_date", value.endDate);

      if (userInfo?.isAdmin) {
        apiUrl = `${baseURL}/company/${userInfo?.companyId}/leaves/`;
      } else if (userInfo.team_leader) {
        apiUrl = `${baseURL}/api/leaves/team-leader/${userInfo?._id}/`;
      } else {
        apiUrl = `${baseURL}/employee/${userInfo?._id}/leaves/`;
      }

      // const data = await fetchAuthGET(`${apiUrl}?${params.toString()}`);
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      )


      if (response.ok) {
        const data = await response.json();
        let filteredData = data;
        if (selectedEmployeeId && selectedEmployeeId !== "0") {
          filteredData = data.filter(
            (leave) => leave.employee_id === parseInt(selectedEmployeeId)
          );
        }

        const approvedCount = filteredData.filter(
          (leave) => leave.status === "Approved"
        ).length;
        const declinedCount = filteredData.filter(
          (leave) => leave.status === "Rejected"
        ).length;
        const pendingCount = filteredData.filter(
          (leave) => leave.status === "Pending"
        ).length;
        const totalLeave = filteredData.length;

        setLeaves(filteredData);
        setTabData({
          totalTaskProject: filteredData,
          incompleteTaskProject: filteredData.filter(
            (leave) => leave.status === "Pending"
          ),
          completedTaskProject: filteredData.filter(
            (leave) => leave.status === "Approved"
          ),
          rejectedTaskProject: filteredData.filter(
            (leave) => leave.status === "Rejected"
          ),
          counts: {
            totalLeave,
            approvedCount,
            declinedCount,
            pendingCount,
          },
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoaded(false);
    }
  };

  // When any dependency changes (user info, selected user, or date range), fetch data.
  useEffect(() => {
    const getAllEmployee = async () => {
      try {
        let data;
        if (userInfo?.isAdmin) {
          // Using the dedicated activeUsers endpoint to fetch only active employees
          data = await fetchAuthGET(
            `${baseURL}/employee/list/activeUsers/${userInfo?.companyId}`
          );
        } else if (userInfo?.team_leader) {
          data = await fetchAuthGET(
            `${baseURL}/api/team/members/${userInfo?._id}`
          );
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
    { value: "0", label: "All", name: "All" },
    ...users.map((user) => ({
      value: user._id?.toString(),
      label: user.name,
      image: user.profile_picture,
      name: user.name,
    })),
  ];

  const handleUserChange = (selectedOption) => {
    setCurrentUserId(selectedOption.value);
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      user: selectedOption.value,
    });
    // fetchLeaves will be triggered by useEffect on currentUserId change
  };

  const handleValueChange = (newValue) => {
    const formattedStartDate = dayjs(newValue.startDate).format("YYYY-MM-DD");
    const formattedEndDate = dayjs(newValue.endDate).format("YYYY-MM-DD");
    setValue({ startDate: formattedStartDate, endDate: formattedEndDate });
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      startDate: formattedStartDate,
      endDate: formattedEndDate,
    });
    // useEffect will trigger fetchLeaves when value changes
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
        startDate = endDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
        break;
      case "thisWeek":
        startDate = dayjs().startOf("week").format("YYYY-MM-DD");
        endDate = dayjs().endOf("week").format("YYYY-MM-DD");
        break;
      case "thisMonth":
        startDate = dayjs().startOf("month").format("YYYY-MM-DD");
        endDate = dayjs().endOf("month").format("YYYY-MM-DD");
        break;
      case "thisYear":
        startDate = dayjs().startOf("year").format("YYYY-MM-DD");
        endDate = dayjs().endOf("year").format("YYYY-MM-DD");
        break;
      case "lastWeek":
        startDate = dayjs().subtract(1, "week").startOf("week").format("YYYY-MM-DD");
        endDate = dayjs().subtract(1, "week").endOf("week").format("YYYY-MM-DD");
        break;
      case "lastMonth":
        startDate = dayjs().subtract(1, "month").startOf("month").format("YYYY-MM-DD");
        endDate = dayjs().subtract(1, "month").endOf("month").format("YYYY-MM-DD");
        break;
      case "lastYear":
        startDate = dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD");
        endDate = dayjs().subtract(1, "year").endOf("year").format("YYYY-MM-DD");
        break;
      default:
        return;
    }
    setValue({ startDate, endDate });
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      startDate,
      endDate,
    });
  };

  const handleCardClick = (status) => {
    setSelectedStatus(status);
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      status,
    });
  };

  const formatOptionLabel = ({ value, label, image, name }) => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div>
        {image ? (
          <img
            src={`${baseURL}${image}`}
            alt={label}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              marginRight: 10,
            }}
          />
        ) : (
          <span className="bg-[#002D2D] text-white h-[2rem] w-[2rem] flex justify-center items-center rounded-full mr-2 font-bold text-lg leading-none custom-avatar">
            {intialLetterName("", "", name)}
          </span>
        )}
      </div>
      <div>{label}</div>
    </div>
  );

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap justify-between items-center relative mb-4 md:mb-2">
          <h4 className="font-medium text-xl md:text-2xl capitalize text-slate-900 dark:text-white mb-2 md:mb-0">
            Leaves
          </h4>

          <div
            className="cursor-pointer flex items-center text-base md:text-lg gap-1 md:gap-2 text-black-500 dark:text-white"
            onClick={() => (dropMenu ? setDropMenu(false) : setDropMenu(true))}
          >
            <Icon icon="ion:filter" fontSize={isMobile ? 20 : 25} />
            <span>Filter</span>
          </div>
        </div>

        {dropMenu && (
          <div className="bg-white absolute right-0 top-10 z-10 max-w-xl dark:bg-slate-800 rounded-lg shadow-lg p-4 mb-5 border border-slate-200 dark:border-slate-700">
            <div className="flex  flex-col gap-3 md:gap-5">
              {userInfo?.isAdmin || userInfo?.team_leader ? (
                <div className="w-full">
                  <label className="form-label mb-2 text-sm md:text-base">Select Employee:</label>
                  <Select
                    className="react-select"
                    classNamePrefix="select"
                    defaultValue={userOptions.find(
                      (option) => option.value === currentUserId
                    )}
                    options={userOptions}
                    formatOptionLabel={formatOptionLabel}
                    onChange={handleUserChange}
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: isMobile ? '38px' : '42px'
                      })
                    }}
                  />
                </div>
              ) : null}

              <div className="w-full">
                <label className="form-label mb-2 text-sm md:text-base">Select Time Period:</label>
                <select
                  onChange={handleRangeChange}
                  className="cursor-pointer block w-full py-2 px-3 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="lastYear">Last Year</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {showDatePick && (
                <div className="date-range-custom relative md:col-span-2">
                  <Datepicker
                    value={value}
                    inputClassName="input-class"
                    containerClassName="container-class"
                    onChange={handleValueChange}
                    popoverDirection={isMobile ? "up" : "down"}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className="flex flex-col md:flex-row-reverse md:justify-start gap-3 md:gap-4 my-3 md:my-4"
        >
          {userInfo?.isAdmin && (
            <Button
              icon="heroicons-outline:plus"
              text="Apply Other Employee Leave"
              className="btn-dark dark:bg-slate-800 w-full md:w-auto h-min text-xs md:text-sm font-normal"
              iconClass="text-base md:text-lg"
              onClick={() => setOpenOtherEmployeeLeaveModel(true)}
            />
          )}

          <Button
            icon="heroicons-outline:plus"
            text="Apply Leave"
            className="btn-dark dark:bg-slate-800 w-full md:w-auto h-min text-xs md:text-sm font-normal whitespace-nowrap"
            iconClass="text-base md:text-lg"
            onClick={() => setOpenProjectModel(true)}
          />
        </div>
      </div>
      <div className="2xl:col-span-9 lg:col-span-8 col-span-12 my-2">
        <Card bodyClass={isMobile ? "p-3" : "p-4"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <LeaveCard
              tabData={tabData}
              onCardClick={handleCardClick}
              selectedStatus={selectedStatus}
            />
          </div>
        </Card>
      </div>

      {isLoaded && (
        <div className="loader">
          <SkeletionTable count={isMobile ? "10" : "20"} />
        </div>
      )}

      {!isLoaded && (
        <LeaveTable
          data={leaves.filter((leave) => {
            if (selectedStatus === "All Leaves") return true;
            if (selectedStatus === "Pending Requests") return leave.status === "Pending";
            if (selectedStatus === "Approved Leaves") return leave.status === "Approved";
            if (selectedStatus === "Rejected Leaves") return leave.status === "Rejected";
            return false;
          })}
          fetchLeaves={fetchLeaves}
        />
      )}

      <ApplyLeave
        openProjectModal={openProjectModal}
        setOpenProjectModel={setOpenProjectModel}
        fetchLeaves={fetchLeaves}
      />
      <ApplyLeaveForOther
        openProjectModal={openOtherEmployeeLeaveModel}
        setOpenProjectModel={setOpenOtherEmployeeLeaveModel}
        fetchLeaves={fetchLeaves}
      />
    </div>
  );
};

export default Leaves;
