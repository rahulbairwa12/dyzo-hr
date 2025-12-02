import { Icon } from '@iconify/react';
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux';
import UserInfo from './UserInfo';
import UserScreenshots from './UserScreenshots';
import BasicArea from '../chart/appex-chart/BasicArea';
import Analytics from './Analytics';
import { ProfilePicture } from '@/components/ui/profilePicture';
import { Link, useParams } from 'react-router-dom';
import { fetchAuthGET } from '@/store/api/apiSlice';
import { update } from '@/store/api/auth/authSlice';
import LoaderCircle from '@/components/Loader-circle';
import { useDispatch } from 'react-redux';
import useDarkmode from '@/hooks/useDarkMode';
import NotificationSettings from './NotificationSettings';
import Tooltip from '@/components/ui/Tooltip';
import { ToastContainer } from 'react-toastify';
import ImageDropDownOptions from '@/components/userProfile/ImageDropDownOption';

const index = () => {
    const { userId } = useParams();
    const userInfo = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const [isDark, setDarkMode] = useDarkmode();
    const [selectedTab, setSelectedTab] = useState("Details");

    const [employeeDetail, setEmployeeDetail] = useState({});
    const [loading, setLoading] = useState(true);

    // For toggling the profile-pic dropdown
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    const isAccessable =  Number(userInfo?._id) === Number(userId) || userInfo?.isAdmin;

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    const fetchEmployeeDetail = async () => {
        if (!userId) return;
        try {
        const { data } = await fetchAuthGET(
            `${import.meta.env.VITE_APP_DJANGO}/employee/me/${userId}/`, false
        );
        setEmployeeDetail(data);
    
        if (parseInt(data._id) === parseInt(userInfo._id)) {
            dispatch(update({
            ...userInfo,
            name: data.name,
            profile_picture: data.profile_picture,
            first_name: data.first_name,
            last_name: data.last_name,
            }));
        }
    
        } catch (error) {
        console.error(error.message);
        } finally {
        setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchEmployeeDetail();
    }, [userId]);

  return loading ? (
  <LoaderCircle/>
  ) : (
    <>
    <ToastContainer/>
    <div className="w-full bg-white dark:bg-black-800 p-2 sm:p-6 h-full min-h-[calc(100vh-80px)]">
       <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-6 items-center">
                <div onClick={toggleDropdown} className="relative cursor-pointer rounded-full flex items-center justify-center group">
                    <ProfilePicture user={employeeDetail} className="w-32 h-32 rounded-full object-cover border group-hover:scale-[1.02] group-hover:blur-[1px] " />
                    <Icon icon="mdi:image-edit-outline" className="text-4xl absolute text-white bg-gray-700 p-2 rounded-full opacity-0 group-hover:opacity-100" />
                    <ImageDropDownOptions 
                        isOpen={dropdownOpen}
                        onClose={() => setDropdownOpen(false)}
                        employeeDetail={employeeDetail}
                        fetchEmployeeDetail={fetchEmployeeDetail}
                        isAccessable={isAccessable}
                    />
                </div>
                <div className="space-y-2">
                    <p className="capitalize text-lg text-black-800 dark:text-gray-300 font-semibold">{employeeDetail?.name}</p>
                    <div className="flex gap-4">
                        <Tooltip
                            title="Shift-away"
                            content="Mail"
                            placement="top"
                            className="btn btn-outline-dark"
                            arrow
                            animation="shift-away"
                        >
                        <Link to={`mailto:${employeeDetail?.email}`}>
                            <Icon icon="bi:envelope" className="text-lg text-black-800 dark:text-gray-300"/>
                        </Link>
                        </Tooltip>

                        <Tooltip
                            title="Shift-away"
                            content="Phone"
                            placement="top"
                            className="btn btn-outline-dark"
                            arrow
                            animation="shift-away"
                        >
                        <Link to={`tel:${employeeDetail?.phone}`}>
                            <Icon icon="bi:telephone-outbound" className="text-lg text-black-800 dark:text-gray-300"/>
                        </Link>
                        </Tooltip>
                    </div>
                </div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
            <span className="me-3 text-sm font-medium text-gray-900 dark:text-gray-300 flex gap-1 items-center">
                <Icon icon="heroicons:sun" />
                Light
            </span>
            <input
                type="checkbox"
                checked={isDark}
                onChange={() => setDarkMode(!isDark)}
                className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none   rounded-full peer dark:bg-gray-700 
            peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
            peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
            after:start-[2px] after:bg-white after:border-gray-300 after:border 
            after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 
            peer-checked:bg-electricBlue-50 dark:peer-checked:bg-electricBlue-50">
            </div>
            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 flex gap-1 items-center">
                <Icon icon="heroicons:moon" />
                Dark
            </span>
            </label>
       </div>
       <div className="my-8">
        {
            isAccessable &&
            <div className="flex overflow-x-auto">
                {[
                    { label: "Details", icon: "solar:user-outline"},
                    { label: "Screenshots", icon: "iconoir:screenshot"},
                    { label: "Analytics", icon: "streamline-plump:graph-bar-increase"},
                    { label: "Notification Settings", icon: "material-symbols-light:notification-settings-outline"},
                ].map((tab) => (
                    <button
                    key={tab.label}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-300 border-b-2 focus:outline-none ${selectedTab === tab.label
                        ? "border-electricBlue-100 text-electricBlue-100"
                        : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                        }`}
                    onClick={() => handleTabChange(tab.label)}
                    type="button"
                    >
                    <span className="flex items-center gap-1">
                        <Icon icon={tab.icon} className="w-4 h-4" />
                        {tab.label}
                    </span>
                    </button>
                ))}
            </div>
        }
            <div>
                {
                    selectedTab === "Details" &&
                    <UserInfo employeeDetail={employeeDetail} fetchEmployeeDetail={fetchEmployeeDetail} isAccessable={isAccessable} />
                }
                {
                    isAccessable && selectedTab === "Screenshots" && 
                    <UserScreenshots employeeDetail={employeeDetail} />
                }
                {
                    isAccessable && selectedTab === "Analytics" &&
                    <Analytics employeeDetail={employeeDetail} />
                }
                {
                    isAccessable && selectedTab === "Notification Settings" && 
                    <NotificationSettings employeeDetail={employeeDetail} />
                }

            </div>
       </div>
    </div>
    </>
  )
}

export default index