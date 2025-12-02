import ManageSubscription from '@/components/settings/SubscriptionSetting';
import Textinput from '@/components/ui/Textinput';
import { djangoBaseURL } from '@/helper';
import { fetchAuthPatch } from '@/store/api/apiSlice';
import { Icon } from '@iconify/react';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from "react-select";
import { toast, ToastContainer } from 'react-toastify';

const options = [
  {
    label: "Privacy Mode - No Screenshots",
    value: "privacy_mode",
  },
  {
    label: "Sensitive Data Mode - Blurred (450×252)",
    value: "sensitive_data_hide_mode",
  },
  {
    label: "Random Interval Mode (1280×720)",
    value: "random_taken_screenshot_mode",
  },
  {
    label: "Fixed Interval Mode (1280×720)",
    value: "screenshot_by_given_time_mode",
  },
];

const styles = {
  multiValue: (base, state) => {
    return state.data.isFixed ? { ...base, opacity: "0.5" } : base;
  },
  multiValueLabel: (base, state) => {
    return state.data.isFixed
      ? { ...base, color: "#626262", paddingRight: 6 }
      : base;
  },
  multiValueRemove: (base, state) => {
    return state.data.isFixed ? { ...base, display: "none" } : base;
  },
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
  }),
  control: (base, state) => ({
    ...base,
    border: "1px solid #d2d6dc",
    borderColor: "#d2d6dc",
    borderRadius: "0.375rem",
    boxShadow: "none",
    "&:hover": { borderColor: "#d2d6dc" },
  }),
};

const index = () => {
    const userInfo = useSelector((state) => state.auth.user);
    const companyDetails = useSelector((state) => state.plan.subscriptionData?.company_details)
    const [selectedTab, setSelectedTab] = useState("Company Settings");
    const [companyName, setCompanyName] = useState(null);
    const [inactivityTime, setInactivityTime] = useState(null);
    const [screenshotInterval, setScreenshotInterval] = useState(null);
    const [screenshotMode, setScreenshotMode] = useState(null);
    const [updating , setUpdating] = useState(false)

    useEffect(() => {
        if (companyDetails?.company_name) setCompanyName(companyDetails.company_name);
        if (companyDetails?.screenshot_time) setScreenshotInterval(companyDetails.screenshot_time);
        if (companyDetails?.interval_time) setInactivityTime(companyDetails.interval_time);
        if (companyDetails?.screenshot_mode) setScreenshotMode(companyDetails.screenshot_mode);       
    }, [companyDetails]);

    const hasChanges = (companyName ?? "") !== (companyDetails?.company_name ?? "") ||
    Number(inactivityTime ?? 0) !== Number(companyDetails?.interval_time ?? 0) ||
    Number(screenshotInterval ?? 0) !== Number(companyDetails?.screenshot_time ?? 0) ||
    (screenshotMode ?? "") !== (companyDetails?.screenshot_mode ?? "");

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    const handleUpdate = async()=>{
        setUpdating(true);
        try {
            const settingsData = {
                company_name: companyName,
                screenshot_time: screenshotInterval,
                interval_time: inactivityTime,
                screenshot_mode: screenshotMode,
            };
            const response = await fetchAuthPatch(
                `${djangoBaseURL}/company/${userInfo?.companyId}/update/`,
                {
                    body: settingsData,
                }
            );
            if (response.status) {
                toast.success("Settings Update Successfully");
            }else {
                toast.error(response?.message);
            }
        } catch (error) {
            console.error(error)
        }finally{
            setUpdating(false)
        }
    }

  return (
    <>
        <ToastContainer/>
        <div className="w-full bg-white dark:bg-black-800 p-2 sm:p-6 h-full min-h-[calc(100vh-80px)]">
            <div>
                <div className="flex overflow-x-auto">
                    {[
                        { label: "Company Settings", icon: "tabler:building-cog" },
                        { label: "Manage Subscription", icon: "tabler:credit-card" }
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
                <div>
                    {
                        selectedTab === "Company Settings" && 
                        <div className="p-4 my-4 space-y-6">
                            <div className="space-y-4">
                                <h5 className="text-xl">Company Details</h5>
                                <div>
                                    <Textinput
                                        label="Company Name"
                                        id="Update_CompanyName"
                                        type="text"
                                        placeholder="Company Name"
                                        value={companyName}
                                        defaultValue={companyDetails?.company_name}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-electricBlue-100 focus:border-electricBlue-100 sm:text-sm"
                                        disabled={!userInfo?.isAdmin}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h5 className="text-xl">Screenshot Settings</h5>
                                <div>
                                    <label className="form-label">
                                        Screenshot Mode
                                    </label>
                                    <Select
                                        options={options}
                                        styles={styles}
                                        className="react-select capitalize "
                                        classNamePrefix="select"
                                        isMulti={false}
                                        name="screenshot_mode"
                                        inputId="Update_Screenshot_Mode"
                                        placeholder="Choose screenshot mode"
                                        isDisabled={!userInfo?.isAdmin}
                                        value={options.find((o) => o.value === screenshotMode) || null}
                                        onChange={(opt) => setScreenshotMode(opt?.value ?? null)}
                                    />
                                </div>
                                <div>
                                    <Textinput
                                        label="Inactivity Detection Time (Minutes)"
                                        id="Update_Inactivity"
                                        type="number"
                                        placeholder="Inactivity Detection Time (Minutes)"
                                        value={inactivityTime}
                                        defaultValue={companyDetails?.interval_time}
                                        onChange={(e) => setInactivityTime(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-electricBlue-100 focus:border-electricBlue-100 sm:text-sm"
                                        disabled={!userInfo?.isAdmin}
                                    />
                                </div>
                                <div>
                                    <Textinput
                                        label="Screenshot Interval (Minutes)"
                                        id="Update_Screenshot_Interval"
                                        type="number"
                                        placeholder="Screenshot Interval (Minutes)"
                                        value={screenshotInterval}
                                        defaultValue={companyDetails?.screenshot_time}
                                        onChange={(e) => setScreenshotInterval(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-electricBlue-100 focus:border-electricBlue-100 sm:text-sm"
                                        disabled={!userInfo?.isAdmin}
                                    />
                                </div>
                            </div>
                            {
                                hasChanges &&
                                <div className="ltr:text-right rtl:text-left">
                                    <button className="btn bg-electricBlue-100 hover:bg-electricBlue-50 text-center text-white py-1.5 px-4 disabled:opacity-80 disabled:cursor-not-allowed" onClick={handleUpdate} disabled={updating}>
                                        {updating ? "Updating..." : "Update"}
                                    </button>
                                </div>
                            }
                        </div>
                    }
                    {
                        selectedTab === "Manage Subscription" &&
                        <div>
                            <ManageSubscription/>
                        </div>
                    }
                </div>
            </div>
        </div>
    </>
  )
}

export default index