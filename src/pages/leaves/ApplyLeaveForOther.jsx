import React, { useState, useEffect } from "react";
import Select from "react-select";
import Modal from "@/components/ui/Modal";
import { useSelector } from "react-redux";
import Flatpickr from "react-flatpickr";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { fetchGET, fetchPOST, fetchAuthFilePost, askChatGPT } from "@/store/api/apiSlice";
import { Icon } from '@iconify/react';
import moment from "moment";
import { sendNotification } from "@/helper/helper";
import Textinput from "@/components/ui/Textinput";

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
};

const leaveTypes = [
    { value: "Half Day", label: "Half Day" },
    { value: "Work from Home", label: "Work from Home" },
    { value: "Casual Leave", label: "Casual Leave" },
    { value: "Sick Leave", label: "Sick Leave" },
    { value: "Unpaid Leave", label: "Unpaid Leave" },
    { value: "Emergency Leave", label: "Emergency Leave" },
    { value: "Personal Leave", label: "Personal Leave" },
    { value: "Short Leave", label: "Short Leave" },
    { value: "Direct Contact for Leave", label: "Direct Contact for Leave" }
];

const getColorClass = (leaveType) => {
    switch (leaveType) {
        case 'HalfDay':
            return 'bg-blue-500';
        case 'WFH':
            return 'bg-green-500';
        case 'CasualLeave':
            return 'bg-purple-500';
        case 'SickLeave':
            return 'bg-red-500';
        case 'UnpaidLeave':
            return 'bg-orange-500';
        case 'EmergencyLeave':
            return 'bg-yellow-500';
        case 'PersonalLeave':
            return 'bg-pink-500';
        case 'ShortLeave':
            return 'bg-gray-500';
        default:
            return 'bg-gray-400';
    }
};

const formatKey = (key) => {
    switch (key) {
        case 'HalfDay':
            return 'Half Day';
        case 'WorkfromHome':
            return 'WFH';
        case 'CasualLeave':
            return 'Casual';
        case 'SickLeave':
            return 'Sick';
        case 'UnpaidLeave':
            return 'Unpaid';
        case 'EmergencyLeave':
            return 'Emergency';
        case 'PersonalLeave':
            return 'Personal';
        case 'ShortLeave':
            return 'Short';
        default:
            return key;
    }
};

const ApplyLeave = ({ openProjectModal, setOpenProjectModel, fetchLeaves }) => {
    const today = moment().format('YYYY-MM-DD');
    const userInfo = useSelector((state) => state.auth?.user);
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [leaveReport, setLeaveReport] = useState(null);
    const [showApplyButton, setShowApplyButton] = useState(true);
    const [loading, setLoading] = useState(false);
    const [attachedFileName, setAttachedFileName] = useState('');
    const [showCasualLeaveMessage, setShowCasualLeaveMessage] = useState(false);
    const [casualLeavesPerMonth, setCasualLeavesPerMonth] = useState(0);
    const [casualApplyBeforeLeaves, setCasualApplyBeforeLeaves] = useState(0);
    const [selectedSenior, setSelectedSenior] = useState(null);
    const [list, setList] = useState([]);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [showChatGptModal, setShowChatGptModal] = useState(false);
    const [inputText, setInputText] = useState('');
    const [responseLoading, setResponseLoading] = useState(false);
    const baseUrl = window.location.origin;
    const[selectedUser ,setSelectedUser] = useState(null)

    useEffect(() => {
        if (moment(endDate).isBefore(startDate)) setEndDate(startDate)
    }, [startDate, endDate]);

    useEffect(() => {
        const getCompanySettings = async () => {
            try {
                const response = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/schedule/${userInfo?.companyId}/`);
                if (response) {
                    setCasualLeavesPerMonth(response.casual_leaves_per_month);
                    setCasualApplyBeforeLeaves(response.casual_leave_apply_before);
                }
            } catch (error) {
                toast.error('Failed to fetch company settings');
            }
        };

        getCompanySettings();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { final_list } = await fetchGET(`${import.meta.env.VITE_APP_DJANGO}/api/userinfo/${userInfo?._id}/`);
                setList(final_list);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [userInfo?._id]);

    const fetchLeaveReport = async () => {
        try {
            const response = await fetchPOST(`${import.meta.env.VITE_APP_DJANGO}/leave-report/`, {
                body: JSON.stringify({
                    employee_id: userInfo._id,
                    start_date: moment().startOf('month').format('YYYY-MM-DD'),
                    end_date: moment().endOf('month').format('YYYY-MM-DD'),
                }),
            });

            if (response) {
                setLeaveReport(response);
                if (response.individual_leave_counts.CasualLeave > casualLeavesPerMonth) {
                    setShowApplyButton(false);
                } else {
                    setShowApplyButton(true);
                }
            } else {
                toast.error('Failed to fetch leave report.');
            }
        } catch (error) {
            // toast.error('Error: ' + error.message);
        }
    };

    useEffect(() => {
        const fetchEmployeeList = async () => {
            try {
                // Using the dedicated activeUsers endpoint to fetch only active employees
                const { data } = await fetchGET(
                    `${import.meta.env.VITE_APP_DJANGO}/employee/list/activeUsers/${userInfo.companyId}/`
                );
                // Convert to React-Select options
                const options = data.map((emp) => ({
                    value: emp._id,
                    label: emp.name,
                    image: `${import.meta.env.VITE_APP_DJANGO}${emp.profile_picture}`,
                    email: emp.email,
                }));
                setEmployeeOptions(options);
            } catch (error) {
                console.error("Error fetching employees:", error);
            }
        };

        fetchEmployeeList();
        fetchLeaveReport();
    }, [userInfo.companyId]);

    const FormValidationSchema = yup.object({
        leave_type: yup.string().required("Leave type is required"),
        start_date: yup.date().required("Start date is required"),
        end_date: yup.date().required("End date is required").min(yup.ref('start_date'), "End date can't be before start date"),
        reason: yup.string().required("Reason is required").min(50, "Reason must be at least 50 characters"),
    }).required();

    const { register, control, reset, handleSubmit, setValue, formState: { errors }, watch } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    useEffect(() => {
        setValue('start_date', startDate);
        setValue('end_date', endDate);
    }, [startDate, endDate]);

    const leaveType = watch('leave_type');

    // ADDED / MODIFIED: Check conditions whenever leaveType or startDate changes
    useEffect(() => {
        if (leaveType === 'Casual Leave') {
            const daysDifference = moment(startDate).diff(moment(), 'days');
            if (daysDifference < casualApplyBeforeLeaves) {
                setShowCasualLeaveMessage(true);
                setShowApplyButton(false);
            } else {
                setShowCasualLeaveMessage(false);
                // Ensure we haven't exceeded monthly limit from leaveReport
                if (leaveReport && leaveReport.individual_leave_counts.CasualLeave > casualLeavesPerMonth) {
                    setShowApplyButton(false);
                } else {
                    setShowApplyButton(true);
                }
            }
        } else {
            setShowCasualLeaveMessage(false);
            setShowApplyButton(true);
        }
    }, [leaveType, startDate, casualApplyBeforeLeaves, leaveReport, casualLeavesPerMonth]);

    const onSubmit = async (data) => {
        setLoading(true);
        const formData = new FormData();

        // Append formatted start_date and end_date
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);

        // Append other fields
        formData.append('leave_type', data.leave_type);
        formData.append('reason', data.reason);
        if (data.senior) {
            formData.append('senior', data.senior);
        }

        if (attachedFileName) {
            formData.append('attachment', attachedFileName);
        }

        if (data.leave_type === 'Half Day' && data.half_day_shift) {
            formData.append('reason', `${data.reason} (${data.half_day_shift.label})`);
        } else if (data.leave_type === 'Short Leave' && data.short_leave_start_time && data.short_leave_end_time) {
            formData.append('reason', `${data.reason} (From ${data.short_leave_start_time} to ${data.short_leave_end_time})`);
        }

        try {
            const response = await fetchAuthFilePost(`${import.meta.env.VITE_APP_DJANGO}/leave-create/${selectedUser?.value}/`, { body: formData });
            if (response.status === 1) {
                toast.success(`Leave request created successfully.`);
                setOpenProjectModel(false)
                reset();
                setStartDate(today);
                setEndDate(today);
                {
                    list.map((userId) => sendNotification(`${response?.employeeName} requested a ${response?.leave_type}`, 'Leave Request', 'userId', userId, { 'Message': 'Leave Request' }, `${baseUrl}/login?redirect=/leaves/leave-detail/${response.leaveId}`)
                    )
                }
            } else {
                toast.error(`Failed to create leave request.`);
            }
        } catch (error) {
            toast.error(`Error: ${error.message || 'An error occurred'}`);
        } finally {
            setLoading(false);
            fetchLeaveReport();
            fetchLeaves();

        }
    };

    const handleChatGPTResponse = async () => {
        try {
            setResponseLoading(true)
            const formatedText = `write a reason for leave not more than 150 char : ${inputText}`;
            const response = await askChatGPT(formatedText);
            if (response.status === 200) {
                const value = response.data.choices[0].message.content;
                setValue('reason', value);
                setInputText('');
                setShowChatGptModal(false);

            }
        } catch (error) {
        } finally {
            setResponseLoading(false)
        }
    }

    return (
        <div>
            <Modal
                title="Apply Leave"
                labelclassName="btn-outline-dark"
                activeModal={openProjectModal}
                onClose={() => setOpenProjectModel(false)}
            >
                {leaveReport && (
                    <div className="mt-6">
                        <h5 className="text-black dark:text-white text-sm mb-4">Your Leave Report for {moment().format('MMMM YYYY')}</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(leaveReport.individual_leave_counts).map(([key, value]) => (
                                <div key={key} className="flex justify-between bg-gray-200 dark:bg-gray-700 items-center p-2 rounded shadow-sm border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${getColorClass(key)}`}></span>
                                        <span className="text-[12px] text-gray-900 dark:text-gray-300">{formatKey(key)}:</span>
                                    </div>
                                    <span className="text-[12px] text-gray-900 dark:text-gray-300">
                                        {key === 'CasualLeave' ? `${value}/${casualLeavesPerMonth}` : value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="my-2">
                        <label htmlFor="leave_type" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">Select leave type</label>
                        <div className="mt-2">
                            <Controller
                                name="leave_type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={leaveTypes}
                                        styles={styles}
                                        className="react-select"
                                        classNamePrefix="select"
                                        onChange={(option) => {
                                            field.onChange(option.value); // Store the string value
                                        }}
                                        value={leaveTypes.find(option => option.value === field.value)} // Find the option object based on the string value
                                    />
                                )}
                            />
                            {errors.leave_type && <p className="text-red-500 text-sm mt-2">{errors.leave_type.message}</p>}
                            {showCasualLeaveMessage && (
                                <p className="text-red-500 text-sm mt-2">You must apply for Casual Leave at least {casualApplyBeforeLeaves} days in advance.</p>
                            )}
                        </div>
                    </div>

                    <div>

                        <label htmlFor="employee" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">Select employee</label>
                        <div className="mt-2">
                            <Controller
                                name="employee"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        options={employeeOptions}
                                        styles={styles}
                                        className="react-select"
                                        classNamePrefix="select"
                                        placeholder="Select a employee"
                                        onChange={((option) => { setSelectedUser(option) })}
                                    />
                                )}
                            />
                        </div>

                    </div>

                    <div className="flex flex-row gap-4 justify-between">
                        <div className="w-1/2">
                            <label htmlFor="start_date" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">From date</label>
                            <div className="mt-2">
                                <Controller
                                    name="start_date"
                                    control={control}
                                    render={({ field }) => (
                                        <Flatpickr
                                            className="form-control py-2 dark:bg-gray-800 dark:text-white"
                                            placeholder="yyyy, dd M"
                                            value={startDate}
                                            onChange={(date) => {
                                                const selectedDate = moment(date[0]).format('YYYY-MM-DD')
                                                setStartDate(selectedDate);
                                                if (moment(endDate).isBefore(selectedDate)) setEndDate(selectedDate)
                                            }}
                                            options={{
                                                altInput: true,
                                                altFormat: "d F Y",
                                                dateFormat: "Y-m-d",
                                            }}
                                        />
                                    )}
                                />
                                {errors.start_date && <p className="text-red-500 text-sm mt-2">{errors.start_date.message}</p>}
                            </div>
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="end_date" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">To date</label>
                            <div className="mt-2">
                                <Controller
                                    name="end_date"
                                    control={control}
                                    render={({ field }) => (
                                        <Flatpickr
                                            className="form-control py-2 dark:bg-gray-800 dark:text-white"
                                            placeholder="yyyy, dd M"
                                            value={endDate}
                                            onChange={(date) => {
                                                setEndDate(moment(date[0]).format('YYYY-MM-DD'));
                                            }}
                                            options={{
                                                altInput: true,
                                                altFormat: "d F Y",
                                                dateFormat: "Y-m-d",
                                                minDate: startDate,
                                            }}
                                        />
                                    )}
                                />
                                {errors.end_date && <p className="text-red-500 text-sm mt-2">{errors.end_date.message}</p>}
                            </div>
                        </div>
                    </div>

                    {leaveType === 'Half Day' && (
                        <div>
                            <label htmlFor="half_day_shift" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">Select shift</label>
                            <div className="mt-2">
                                <Controller
                                    name="half_day_shift"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            options={[
                                                { value: 'Morning Shift', label: 'Morning Shift' },
                                                { value: 'Evening Shift', label: 'Evening Shift' }
                                            ]}
                                            styles={styles}
                                            className="react-select"
                                            classNamePrefix="select"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {leaveType === 'Short Leave' && (
                        <>
                            <div className="flex flex-row gap-4 justify-between">
                                <div className="w-1/2">
                                    <label htmlFor="short_leave_start_time" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">Start Time</label>
                                    <div className="mt-2">
                                        <Controller
                                            name="short_leave_start_time"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    type="time"
                                                    className="form-control py-2 dark:bg-gray-800 dark:text-white"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="w-1/2">
                                    <label htmlFor="short_leave_end_time" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">End Time</label>
                                    <div className="mt-2">
                                        <Controller
                                            name="short_leave_end_time"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    type="time"
                                                    className="form-control py-2 dark:bg-gray-800 dark:text-white"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-red-500 text-sm mt-2">End time must be greater than start time.</p>
                        </>
                    )}

                    {leaveType === 'Direct Contact for Leave' && (
                        <div>
                            <label htmlFor="senior" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">Select your senior</label>
                            <div className="mt-2">
                                <Controller
                                    name="senior"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            options={employeeOptions}
                                            styles={styles}
                                            className="react-select"
                                            classNamePrefix="select"
                                            placeholder="Select a senior"
                                            onChange={((option) => { setSelectedSenior(option) })}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="relative">
                            <label htmlFor="reason" className="block text-sm font-medium leading-6 text-[#747474] dark:text-gray-300 text-left">Leave reason</label>
                            <div className="mt-2">
                                <textarea
                                    id="reason"
                                    name="reason"
                                    required
                                    placeholder="Please provide a valid reason for your leave application (50 characters minimum)"
                                    className="border block w-full rounded-md py-3 px-3 text-gray-900 dark:text-white dark:bg-gray-800 sm:text-sm sm:leading-6"
                                    {...register('reason')}
                                />

                            </div>
                            <span className="absolute bottom-2 right-3 cursor-pointer" onClick={() => setShowChatGptModal(!showChatGptModal)} >
                                <Icon icon="mdi:sparkles" className="w-6 h-6 dark:text-white" />
                            </span>

                        </div>
                        {showChatGptModal && (

                            <div className='relative'>
                                <Textinput type='text' placeholder="Ask to ai" className="my-2" value={inputText} onChange={(event) => setInputText(event.target.value)} />

                                <span onClick={handleChatGPTResponse} className="float-right absolute right-2 bottom-2">
                                    {responseLoading ? <Icon icon="ic:outline-circle" className="w-6 h-6 cursor-pointer" disabled='true' /> : <Icon icon="carbon:send" className="w-6 h-6 cursor-pointer" />}
                                </span>
                            </div>
                        )}

                    </div>
                    {errors.reason && <p className="text-red-500 text-sm mt-2">{errors.reason.message}</p>}

                    <div className="mb-3">
                        <label htmlFor="formFile" className="mb-2 inline-block text-[#747474] dark:text-gray-300">Attach File</label>
                        <div className="flex items-center">
                            <input
                                type="file"
                                id="formFile"
                                name="attachment"
                                className="relative m-0 block w-full min-w-0 flex-auto rounded border border-solid border-neutral-300 dark:border-neutral-600 bg-clip-padding px-3 py-[0.32rem] text-base font-normal text-neutral-700 dark:text-neutral-200 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 dark:file:bg-neutral-700 file:px-3 file:py-[0.32rem] file:text-neutral-700 dark:file:text-neutral-100 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] hover:file:bg-neutral-200 dark:hover:file:bg-neutral-600 focus:border-primary focus:text-neutral-700 dark:focus:text-neutral-200 focus:shadow-te-primary focus:outline-none"
                                onChange={(e) => setAttachedFileName(e.target.files[0])}
                            />
                        </div>
                    </div>


                    <div className="flex justify-center">
                        {leaveType === 'Direct Contact for Leave' && selectedSenior ? (
                            <button
                                type="button"
                                className="flex justify-center rounded-md bg-[#E6EDF8] dark:bg-gray-700 dark:hover:bg-gray-600 px-6 py-2 text-sm font-semibold hover:bg-[#0046B5] hover:text-white leading-6 text-black dark:text-white shadow-sm"
                            >
                                <a href={`tel:${selectedSenior.phone}`}>Call</a>
                            </button>
                        ) : (
                            showApplyButton && (
                                <button
                                    type="submit"
                                    className="flex justify-center rounded-md bg-[#E6EDF8] dark:bg-gray-700 dark:hover:bg-gray-600 px-6 py-2 text-sm font-semibold hover:bg-[#0046B5] hover:text-white leading-6 text-black dark:text-white shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? 'Applying Leave...' : 'Apply Leave'}
                                </button>
                            )
                        )}

                        {/* {!showApplyButton && (
              <p className="text-red-500 text-sm mt-2 ml-4">No Casual Leave available for you.</p>
            )} */}
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ApplyLeave;
