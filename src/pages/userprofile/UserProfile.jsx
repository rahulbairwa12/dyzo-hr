import React, { useEffect, useState, Fragment } from "react";
import { Link, useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import BasicArea from "../chart/appex-chart/BasicArea";

import { Tab } from "@headlessui/react";

import { InfoCard } from "@/components/userProfile/InfoCard";
import { PersonalInfoCard } from "@/components/userProfile/PersonalInfoCard";
import { BankInfoCard } from "@/components/userProfile/BankInfoCard";
import Icons from "@/components/ui/Icon";
import { SkillsCard } from "@/components/userProfile/SkillsCard";
import FamilyDetail from "@/components/userProfile/FamilyDetail";
import ImageDropDownOptions from "@/components/userProfile/ImageDropDownOption";
import { useDispatch, useSelector } from 'react-redux';
import { update } from '@/store/api/auth/authSlice';
import { fetchAuthGET, fetchDelete, fetchPOST, fetchAuthPost } from "@/store/api/apiSlice";
import UserScreenshots from "@/components/userProfile/UserScreenshots";
import LoaderCircle from "@/components/Loader-circle";
import UserSetting from "@/components/userProfile/UserSetting";
import Attendance from "@/components/userProfile/Attendance";
import UserPermissionAccordion from "@/components/userProfile/UserPermissionAccordian";
import DatePickerStartAndEndDate from "@/components/userProfile/DatePickerStartAndEndDate";
import { toast, ToastContainer } from "react-toastify";
import { CardInfo } from "@/components/userProfile/CardInfo";
import Card from "@/components/ui/Card";

import Status from "@/components/userProfile/Status";

import { currentStatus } from "@/helper/helper";
import Tooltip from "@/components/ui/Tooltip";

const UserProfile = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation()
  const userInfo = useSelector((state) => state.auth.user);

  // Store the currently displayed employee data
  const [employeeDetail, setEmployeeDetail] = useState({});
  const [loading, setLoading] = useState(true);

  // Performance/Date-range states
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [performanceData, setPerformanceData] = useState({});
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModel, setTransferModel] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  // This controls the "Personal Info" editing modal from InfoCard
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Advanced Settings toggle (for showing Bank Info, Personal Info, etc.)
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Track whether the logged-in user is an admin or the same person as the profile
  const isAdmin = userInfo?.isAdmin;
  const isSelf = employeeDetail?._id === userInfo?._id;

  const tabs = [
    {
      title: "Profile",
      icon: "heroicons-outline:user",
      isHide: false,
    },
    {
      title: "Screenshots",
      icon: "material-symbols:camera",
      isHide: !(isAdmin || isSelf),
    },
    // {
    //   title: "Attendance",
    //   icon: "ic:outline-co-present",
    //   isHide: !(isAdmin || isSelf),
    // },
    {
      title: "Settings",
      icon: "uil:setting",
      isHide: !isAdmin,
    },
    {
      title: "Permissions",
      icon: "icon-park-outline:permissions",
      isHide: !isAdmin,
    },
  ];

  // If ?tab=UserScreenshots, default to 2nd tab; otherwise 1st
  const defaultTab = searchParams.get("tab");
  const defaultTabIndex = defaultTab === "UserScreenshots" ? 1 : 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Fetch the employee detail from the server
  const fetchEmployeeDetail = async () => {
    try {
      const { data } = await fetchAuthGET(
        `${import.meta.env.VITE_APP_DJANGO}/employee/me/${userId}/`, false
      );
      setEmployeeDetail(data);

      if (parseInt(data._id) === parseInt(userInfo._id)) {
        dispatch(update({
          ...userInfo,
          name: data.name,
          profile_picture: data.profile_picture, // ya data ka jo bhi naya field hai
          first_name: data.first_name,
          last_name: data.last_name,

        }));
      }
      // console.log(data)

      setSelectedStatus(data.status);

    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  // useEffect(() => {
  //   if (userInfo) {
  //     console.log("Updated userInfo", userInfo);
  //   }
  // }, [userInfo]);
  // Once we have userId, load the data
  useEffect(() => {
    fetchEmployeeDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Load performance data
  const fetchPerformanceData = async (start, end) => {
    try {
      setPerformanceLoading(true);
      const response = await fetchPOST(
        `${import.meta.env.VITE_APP_DJANGO}/api/employee-performance/`,
        {
          body: {
            employee_id: userId,
            start_date: start,
            end_date: end,
          },
        }
      );
      if (response) {
        setPerformanceData(response);
      }
    } catch (err) {
      console.error("Error fetching performance data: ", err);
    } finally {
      setPerformanceLoading(false);
    }
  };

  // Re-fetch performance whenever userId or date range changes
  useEffect(() => {
    fetchPerformanceData(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, startDate, endDate]);

  // Handle date range selection
  const handleRangeChange = (range) => {
    const [start, end] = range;
    const startISO = start.toISOString().split("T")[0];
    const endISO = end.toISOString().split("T")[0];
    setStartDate(startISO);
    setEndDate(endISO);
    fetchPerformanceData(startISO, endISO);
  };

  // Deleting an employee (admin only)
  const handleDeleteEmployee = async () => {
    try {
      setDeleteLoading(true);
      const resp = await fetchDelete(
        `${import.meta.env.VITE_APP_DJANGO}/employee/${employeeDetail?._id}/`
      );
      if (resp.status) {
        toast.success("Employee deleted successfully");
        setShowDeleteModal(false);
        navigate("/employees");
      }
    } catch (error) {
      toast.error("Failed to delete employee");
      navigate("/employees");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Transfer employee data (admin only)
  const handleTransfer = async (payload) => {
    try {
      const resp = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/api/transfer-employee-data/`, {
        body: payload,
      });
      toast.success("Employee data transferred successfully");
      setTransferModel(false);
      navigate("/employees");
    } catch (error) {
      console.error("Error during transfer:", error);
    } finally {
      setTransferModel(false);
    }
  };

  // For toggling the profile-pic dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return loading ? (
    <LoaderCircle />
  ) : (
    <div>
      <ToastContainer />
      <div className="space-y-5 profile-page">
        {/* ========= Profile Summary Header ========= */}
        <div className="profiel-wrap px-[35px] pb-10 md:pt-[84px] pt-10 rounded-lg bg-white dark:bg-slate-800 lg:flex lg:space-y-0 space-y-6 justify-between items-end relative z-[1]">
          <div className="bg-slate-900 dark:bg-slate-700 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>

          {/* -- Left side: Photo, Name, Designation -- */}
          <div className="profile-box flex-none md:text-start text-center">
            <div className="md:flex items-end md:space-x-6 rtl:space-x-reverse">
              {/* Profile photo */}
              <div className="flex-none">
                <div className="md:h-[186px] md:w-[186px] h-[140px] w-[140px] md:ml-0 md:mr-0 ml-auto mr-auto md:mb-0 mb-4 rounded-full ring-4 ring-slate-100 relative group">
                  {employeeDetail?.profile_picture ? (
                    <img
                      src={`${import.meta.env.VITE_APP_DJANGO}${employeeDetail.profile_picture}`}
                      alt={employeeDetail?.name}
                      className={`w-full h-full object-cover rounded-full transition-all duration-300 ease-in-out ${(isSelf || isAdmin) ? "group-hover:blur-sm" : ""
                        }`}
                    />
                  ) : (
                    <img
                      src={`${import.meta.env.VITE_APP_DJANGO}/media/images/defalut.jpg`}
                      alt="default"
                      className={`w-full h-full object-cover rounded-full transition-all duration-300 ease-in-out ${(isSelf || isAdmin) ? "group-hover:blur-sm" : ""
                        }`}
                    />
                  )}

                  {/* Status Dot (Active/Inactive) */}
                  {employeeDetail?.isActive ? (
                    <div
                      className="absolute bottom-5 right-1 md:bottom-8 md:right-2 h-5 w-5 rounded-full z-10 cursor-pointer"
                      onClick={() => {
                        // Only let them open the status modal if it's their own profile
                        if (isSelf) {
                          setShowStatusModal(true);
                        }
                      }}
                    >
                      {currentStatus(selectedStatus)}
                    </div>
                  ) : (
                    <div className="absolute bottom-8 right-3 md:bottom-10 md:right-4 h-5 w-5 rounded-full z-10">
                      <Icon
                        icon="icon-park-outline:dot"
                        className="w-10 h-10 text-red-500"
                      />
                    </div>
                  )}

                  {/* Pencil Icon overlay to update pic */}
                  {(isSelf || isAdmin) && (
                    <button
                      onClick={toggleDropdown}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <div className="relative bg-slate-50 text-slate-600 rounded-full shadow-sm flex items-center justify-center h-10 w-10">
                        <Icon icon="heroicons:pencil-square" className="w-6 h-6" />
                      </div>
                    </button>
                  )}
                  {/* Dropdown for updating pic */}
                  {(isSelf || isAdmin) && (
                    <ImageDropDownOptions
                      isOpen={dropdownOpen}
                      onClose={() => setDropdownOpen(false)}
                      employeeDetail={employeeDetail}
                      fetchEmployeeDetail={fetchEmployeeDetail}
                    />
                  )}
                </div>
              </div>

              {/* Name, Designation, Quick Links */}
              <div className="flex-1">
                <div
                  className="text-2xl font-medium text-slate-900 dark:text-slate-200 mb-[3px] capitalize flex items-center gap-2"
                  onClick={() => {
                    if (isSelf || isAdmin) {
                      setShowInfoModal(true);
                    }
                  }}
                >
                  {employeeDetail?.name}
                  {(isSelf || isAdmin) && (
                    <Icon
                      icon="heroicons:pencil-square"
                      className="w-5 h-5 text-black-500 cursor-pointer"
                    />
                  )}
                </div>
                <div className="text-sm font-light text-slate-600 dark:text-slate-400 capitalize">
                  {employeeDetail?.designation || ""}
                </div>

                {/* Quick action icons: mail, phone, delete, transfer */}
                <div className="text-sm justify-center md:justify-start font-light text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-3">
                  {/* Email */}
                  <Tooltip
                    title="Shift-away"
                    content="Mail"
                    placement="top"
                    className="btn btn-outline-dark"
                    arrow
                    animation="shift-away"
                  >
                    <Link to={`mailto:${employeeDetail?.email}`}>
                      <Icons icon="heroicons:envelope" className="w-6 h-6" />
                    </Link>
                  </Tooltip>
                  {/* Phone */}
                  <Tooltip
                    title="Shift-away"
                    content="Phone"
                    placement="top"
                    className="btn btn-outline-dark"
                    arrow
                    animation="shift-away"
                  >
                    <Link to={`tel:${employeeDetail?.phone}`}>
                      <Icons icon="heroicons:phone-arrow-up-right" className="w-5 h-5" />
                    </Link>
                  </Tooltip>

                  {/* Delete (admin only) */}
                  {isAdmin && userId != userInfo._id && (
                    <span onClick={() => setShowDeleteModal(true)}>
                      <Tooltip
                        title="Shift-away"
                        content="Delete Employee"
                        placement="top"
                        className="btn btn-outline-dark"
                        arrow
                        animation="shift-away"
                      >
                        <div>
                          <Icons
                            icon="ph:trash-light"
                            className="w-6 h-6 cursor-pointer"
                          />
                        </div>
                      </Tooltip>
                    </span>
                  )}

                  {/* Transfer (admin only, not yourself) */}
                  {isAdmin && !isSelf && (
                    <span onClick={() => setTransferModel(true)}>
                      <Tooltip
                        title="Shift-away"
                        content="Transfer Employee Data"
                        placement="top"
                        className="btn btn-outline-dark"
                        arrow
                        animation="shift-away"
                      >
                        <div>
                          <Icons
                            icon="mingcute:transfer-3-fill"
                            className="w-6 h-6 cursor-pointer"
                          />
                        </div>
                      </Tooltip>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side: date range + performance stats (if isSelf or isAdmin) */}
          {(isSelf || isAdmin) && (
            <div className="flex items-center flex-col justify-center gap-3">
              <DatePickerStartAndEndDate
                initialStartDate={startDate}
                initialEndDate={endDate}
                onRangeChange={handleRangeChange}
              />
              <CardInfo
                performanceData={performanceData}
                performanceLoading={performanceLoading}
              />
            </div>
          )}
        </div>

        {/* ======= Main Info Tabs ======= */}
        <Card title="More Information">
          <Tab.Group defaultIndex={defaultTabIndex}>
            <Tab.List className="lg:space-x-8 md:space-x-4 space-x-0 rtl:space-x-reverse">
              {tabs.map((item, i) => (
                <Tab as={Fragment} key={i}>
                  {({ selected }) => (
                    <button
                      className={`${item.isHide ? "hidden" : "block"
                        } inline-flex items-start text-sm font-medium mb-7 capitalize bg-white dark:bg-slate-800 ring-0 focus:ring-0 focus:outline-none px-2 transition duration-150 before:transition-all before:duration-150 relative before:absolute before:left-1/2 before:bottom-[-6px] before:h-[1.5px] before:bg-primary-500 before:-translate-x-1/2 ${selected
                          ? "text-primary-500 before:w-full"
                          : "text-slate-500 before:w-0 dark:text-slate-300"
                        }`}
                    >
                      <span className="text-base relative top-[1px] ltr:mr-1 rtl:ml-1">
                        <Icon icon={item.icon} />
                      </span>
                      {item.title}
                    </button>
                  )}
                </Tab>
              ))}
            </Tab.List>

            <Tab.Panels>
              {/* ---- Profile Tab ---- */}
              <Tab.Panel>
                <div className="grid grid-cols-12 gap-6">
                  {/* Left side: Basic info, advanced setting toggle */}
                  <div className="lg:col-span-4 col-span-12">
                    <InfoCard
                      employeeDetail={employeeDetail}
                      fetchEmployeeDetail={fetchEmployeeDetail}
                      showPersonalInfoModal={showInfoModal}
                      setShowPersonalInfoModal={setShowInfoModal}
                    />

                    {/* {(isSelf || isAdmin) && (
                      <div className="w-[150px] mt-4">
                        <label
                          className="form-label flex items-center text-blue-600 cursor-pointer"
                          onClick={() => setShowAdvanced((prev) => !prev)}
                        >
                          Advanced Settings{" "}
                          {showAdvanced ? (
                            <Icon
                              icon="eva:arrow-down-fill"
                              className="text-xl text-blue-600"
                            />
                          ) : (
                            <Icon
                              icon="eva:arrow-right-fill"
                              className="text-xl text-blue-600"
                            />
                          )}
                        </label>
                      </div>
                    )}

                    {showAdvanced && (isSelf || isAdmin) && (
                      <>
                        <div className="my-3 iconTwo">
                          <PersonalInfoCard />
                        </div>
                        <div className="my-3 iconThree">
                          <BankInfoCard />
                        </div>
                      </>
                    )} */}
                  </div>

                  {/* Right side: Performance, Family, Skills */}
                  <div className="lg:col-span-8 col-span-12">
                    {/* Performance chart if isSelf || isAdmin */}
                    {(isSelf || isAdmin) && (
                      <Card title="Performance">
                        <BasicArea
                          height={190}
                          performanceData={performanceData?.employee_year_chart}
                        />
                      </Card>
                    )}
                    {/* <div className="mt-2 iconFour">
                      {(isSelf || isAdmin) && <FamilyDetail />}
                    </div> */}
                    <div className="my-3 iconFive">
                      {/* <SkillsCard /> */}
                    </div>
                  </div>
                </div>
              </Tab.Panel>

              {/* ---- Screenshots Tab ---- */}
              <Tab.Panel>
                {(isSelf || isAdmin) ? (
                  <UserScreenshots
                    startDate={startDate}
                    endDate={endDate}
                  />
                ) : (
                  <div className="text-center p-4">
                    You do not have permission to view screenshots.
                  </div>
                )}
              </Tab.Panel>

              {/* ---- Attendance Tab ---- */}
              {/* <Tab.Panel>
                {(isSelf || isAdmin) ? (
                  <Attendance />
                ) : (
                  <div className="text-center p-4">No permission.</div>
                )}
              </Tab.Panel> */}

              {/* ---- Settings Tab ---- */}
              <Tab.Panel>
                {isAdmin ? (
                  <UserSetting
                    employeeDetail={employeeDetail}
                    fetchEmployeeDetail={fetchEmployeeDetail}
                  />
                ) : (
                  <div className="text-center p-4">
                    Only admins can view Settings.
                  </div>
                )}
              </Tab.Panel>

              {/* ---- Permissions Tab ---- */}
              <Tab.Panel>
                {(isSelf || isAdmin) ? (
                  <UserPermissionAccordion />
                ) : (
                  <div className="text-center p-4">No permission.</div>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </Card>
      </div>



      {/* ====== Status modal (for self) ====== */}
      <Status
        showStatusModal={showStatusModal}
        setShowStatusModal={setShowStatusModal}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        userId={userId}
      />
    </div>
  );
};

export default UserProfile;