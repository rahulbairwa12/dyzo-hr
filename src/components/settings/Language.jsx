import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAuthPatch } from '@/store/api/apiSlice';
import Button from '../ui/Button';
import Select from "react-select";
import { setCompanyTimezone } from '@/store/planSlice';

const Language = () => {
    const userInfo = useSelector((state) => state.auth.user);
    const subscriptionData = useSelector((state) => state.plan.subscriptionData);
    const companyTimezone = subscriptionData?.company_details?.company_timezone || "UTC";
    const [selectedTimeZone, setSelectedTimeZone] = useState(companyTimezone);
    const [updatedLoading, setUpdateLoading] = useState(false)
    const dispatch = useDispatch();

    const timezoneOptions = [
        { value: "UTC", label: "Default" },
        { value: "-12:00", label: "(GMT -12:00) Eniwetok, Kwajalein" },
        { value: "-11:00", label: "(GMT -11:00) Midway Island, Samoa" },
        { value: "-10:00", label: "(GMT -10:00) Hawaii" },
        { value: "-09:50", label: "(GMT -9:30) Taiohae" },
        { value: "-09:00", label: "(GMT -9:00) Alaska" },
        { value: "-08:00", label: "(GMT -8:00) Pacific Time (US & Canada)" },
        { value: "-07:00", label: "(GMT -7:00) Mountain Time (US & Canada)" },
        { value: "-06:00", label: "(GMT -6:00) Central Time (US & Canada), Mexico City" },
        { value: "-05:00", label: "(GMT -5:00) Eastern Time (US & Canada), Bogota, Lima" },
        { value: "-04:50", label: "(GMT -4:30) Caracas" },
        { value: "-04:00", label: "(GMT -4:00) Atlantic Time (Canada), Caracas, La Paz" },
        { value: "-03:50", label: "(GMT -3:30) Newfoundland" },
        { value: "-03:00", label: "(GMT -3:00) Brazil, Buenos Aires, Georgetown" },
        { value: "-02:00", label: "(GMT -2:00) Mid-Atlantic" },
        { value: "-01:00", label: "(GMT -1:00) Azores, Cape Verde Islands" },
        { value: "+00:00", label: "(GMT) Western Europe Time, London, Lisbon, Casablanca" },
        { value: "+01:00", label: "(GMT +1:00) Brussels, Copenhagen, Madrid, Paris" },
        { value: "+02:00", label: "(GMT +2:00) Kaliningrad, South Africa" },
        { value: "+03:00", label: "(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg" },
        { value: "+03:50", label: "(GMT +3:30) Tehran" },
        { value: "+04:00", label: "(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi" },
        { value: "+04:50", label: "(GMT +4:30) Kabul" },
        { value: "+05:00", label: "(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent" },
        { value: "+05:50", label: "(GMT +5:30) Bombay, Calcutta, Madras, New Delhi" },
        { value: "+05:75", label: "(GMT +5:45) Kathmandu, Pokhara" },
        { value: "+06:00", label: "(GMT +6:00) Almaty, Dhaka, Colombo" },
        { value: "+06:50", label: "(GMT +6:30) Yangon, Mandalay" },
        { value: "+07:00", label: "(GMT +7:00) Bangkok, Hanoi, Jakarta" },
        { value: "+08:00", label: "(GMT +8:00) Beijing, Perth, Singapore, Hong Kong" },
        { value: "+08:75", label: "(GMT +8:45) Eucla" },
        { value: "+09:00", label: "(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk" },
        { value: "+09:50", label: "(GMT +9:30) Adelaide, Darwin" },
        { value: "+10:00", label: "(GMT +10:00) Eastern Australia, Guam, Vladivostok" },
        { value: "+10:50", label: "(GMT +10:30) Lord Howe Island" },
        { value: "+11:00", label: "(GMT +11:00) Magadan, Solomon Islands, New Caledonia" },
        { value: "+11:50", label: "(GMT +11:30) Norfolk Island" },
        { value: "+12:00", label: "(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka" },
        { value: "+12:75", label: "(GMT +12:45) Chatham Islands" },
        { value: "+13:00", label: "(GMT +13:00) Apia, Nukualofa" },
        { value: "+14:00", label: "(GMT +14:00) Line Islands, Tokelau" }
    ];

    const languageOptions = [
        { value: "en-US", label: "English (US)" }
    ];

    useEffect(() => {
        setSelectedTimeZone(companyTimezone);
    }, [companyTimezone]);

    const handleTimezoneChange = (option) => {
        setSelectedTimeZone(option.value);
    };
console.log(selectedTimeZone,"selectedTimeZone")
    const UpdateTimezone = async () => {
        console.log("settings-timezone")
        try {
            setUpdateLoading(true)
            const data = await fetchAuthPatch(`${import.meta.env.VITE_APP_DJANGO}/api/company/${userInfo?.companyId}/update_timezone/`, {body: { company_timezone: selectedTimeZone }   });
            console.log(data, "fasdfa")
            if (data.status) {
                dispatch(setCompanyTimezone(selectedTimeZone));
                toast.success("Timezone Updated");
            }
        } catch (error) {
            console.log("error", error)
            toast.error('Error: ' + error.message);
        } finally {
            setUpdateLoading(false)
        }
    };

    return (

        <div className='flex flex-col gap-4 max-w-md'>
            <ToastContainer/>
                <div className="mb-4">
                    <label htmlFor="settings-language" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select language</label>
                    <Select
                        inputId="settings-language"
                        name="language"
                        classNamePrefix="react-select"
                        value={languageOptions[0]}
                        options={languageOptions}
                        isDisabled
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="settings-timezone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Time Zone</label>
                    <Select
                        inputId="settings-timezone"
                        name="timezone"
                        classNamePrefix="react-select"
                        value={timezoneOptions.find(option => option.value === selectedTimeZone)}
                        onChange={handleTimezoneChange}
                        options={timezoneOptions}
                        isSearchable
                    />
                </div>
                {userInfo.isAdmin && (
                    <Button text="Update" className="btn-dark dark:bg-slate-800 w-28 h-min text-sm font-normal" onClick={UpdateTimezone} isLoading={updatedLoading} />
                )}

        </div>
    );
};

export default Language;
