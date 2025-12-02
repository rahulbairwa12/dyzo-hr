import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { fetchAPI, fetchAuthGET, fetchPOST } from '@/store/api/apiSlice';
import { useSelector } from "react-redux";
import { ToastContainer, toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import Card from '@/components/ui/Card';
import ListSkeleton from '../table/ListSkeleton';
import { convertToLocalTime } from '@/helper/helper';
import { getAuthToken } from '@/utils/authToken';
import {
    useTable,
    useSortBy,
} from "react-table"
import AdvancedModal from '@/components/ui/AdvancedModal';
import Select from 'react-select';



function ApplicantDetail() {
    const { applicationId } = useParams();
    const companyId = useSelector(state => state.auth.user.companyId);
    const userInfo = useSelector(state => state.auth.user);
    const [applicationInfo, setApplicationInfo] = useState(null);
    const [noRecordMessage, setNoRecordMessage] = useState(null);
    const baseURL = import.meta.env.VITE_APP_DJANGO;
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [employeeNameToIdMap, setEmployeeNameToIdMap] = useState({});
    const [interviewData, setInterviewData] = useState([]);
    const [currentDate, setCurrentDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [showModalNew, setShowModalNew] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState([])
    const navigate = useNavigate();
    const [modalFields, setModalFields] = useState({
        interviewName: '',
        mode: 'online',
        meetingLink: '',
        address: '',
        mobileNumber: '',
        interviewDate: '',
        interviewTime: '',
        interviewDateTime: '',
        interviewerName: '',
    });


    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setCurrentDate(today);
    }, []);

    useEffect(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (1 + 7 - dayOfWeek) % 7 || 7); // Get next Monday
        
        const formattedDate = nextMonday.toISOString().split('T')[0]; // Format as yyyy-mm-dd
        setModalFields(prev => ({
            ...prev,
            interviewDate: formattedDate,  // Set interviewDate to next Monday
            interviewTime: "09:00" // Default time to 9 AM
        }));
    }, []);

    const fetchScheduleInterview = async () => {
        // setLoading(true);
        try {
            const interviewResponse = await fetchAPI(`api/interviews/${applicationId}/`);
            if (interviewResponse.status) {
                setInterviewData(interviewResponse.data);
            } else {
                setInterviewData([]);
            }
        } catch (error) {
            toast.error('Failed to load interview data.');
        }
    };

    useEffect(() => {
        fetchScheduleInterview()
    }, [companyId])

    useEffect(() => {
        const fetchApplicationDetails = async () => {
            // setLoading(true);
            try {
                const response = await fetchAPI(`api/applicant/${applicationId}/`);
                if (response?.status) {
                    setApplicationInfo(response?.data);

                } else {
                    setNoRecordMessage(response?.response?.data?.message);
                }
            } catch (error) {
                toast.error('Failed to load application details.');
            } finally {
                setLoading(false); // Hide loading spinner after fetching data
            }
        };

        setLoading(false);
        fetchApplicationDetails();
    }, [applicationId, companyId]);

    const getAllEmployees = useCallback(async () => {
        try {
            let data;
            if (userInfo?.isAdmin) {
                data = await fetchAuthGET(`${baseURL}/employee/list/${companyId}`);
            } else if (userInfo?.team_leader) {
                data = await fetchAuthGET(`${baseURL}/api/team/members/${userInfo?._id}`);
            }
    
            if (data.status && data.data.length > 0) {
                // Filter active employees and then map to options
                const employeeOptions = data.data
                    .filter(employee => employee.isActive) // Filter active employees
                    .map(employee => ({
                        value: employee._id,
                        label: employee.name
                    }));
                    
                setEmployees(employeeOptions);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [userInfo]);

    useEffect(() => {
        getAllEmployees();
    }, [getAllEmployees]);

    const columns = useMemo(() => [
        {
            Header: "Interview Name",
            accessor: "interview_name",
        },
        {
            Header: "Interview Time",
            accessor: "interview_timing",
            Cell: ({ value }) => {
                const formattedDate = convertToLocalTime(new Date(value), "dd MMM yyyy, h:mm a");
                return formattedDate;
            },
        },
        {
            Header: "Is Completed",
            accessor: "is_completed",
            Cell: ({ value }) => (value ? "Yes" : "No"),
        },
        {
            Header: "Action",
            accessor: "action",
            Cell: ({ row }) => {
                if (row.original.is_cancelled) {
                    return <span className='text-red-500'>Canceled</span>;
                }
                return (
                    <div className="flex space-x-3 rtl:space-x-reverse">

                        <button onClick={() => navigate(`/view-schedule-interview/${row.original.interview_id}`)} >
                            <Icon icon="mdi:eye" />
                        </button>
                        <button onClick={() => navigate(`/reschedule-interview/${row.original.interview_id}`)} >
                            <Icon icon="carbon:pen" />
                        </button>
                        <button onClick={() => openCancelInterviewModal(row.original.interview_id)}>
                            <Icon icon="ion:trash-outline" />
                        </button>
                    </div>
                );
            },
        }
    ], []);

    // Prepare data for table
    const data = useMemo(() => interviewData, [interviewData]);

    // Create table instance
    const tableInstance = useTable(
        {
            columns,
            data,
        },
        useSortBy
    );

    // Destructure table instance properties
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = tableInstance;

    const handleViewInterview = (interview) => {
        setSelectedInterview(interview);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedInterview(null);
    };

    // const handleModalInputChange = (event) => {
    //     const { name, value } = event.target;
    //     setModalFields(prev => {
    //         const updatedFields = {
    //             ...prev,
    //             [name]: value
    //         };

    //         // Update the combined interviewDateTime state
    //         if (name === 'interviewDate' || name === 'interviewTime') {
    //             const { interviewDate, interviewTime } = updatedFields;
    //             if (interviewDate && interviewTime) {
    //                 const interviewDateTime = `${interviewDate}T${interviewTime}`;
    //                 updatedFields.interviewDateTime = interviewDateTime;
    //             }
    //         }

    //         // Handle mode-specific fields visibility
    //         if (name === 'mode') {
    //             handleModeChange(value);
    //         }

    //         return updatedFields;
    //     });
    // };
    const handleModeChange = (mode) => {
        const meetingLinkField = document.getElementById('meeting-link-field');
        const addressField = document.getElementById('address-field');
        // const mobileNumberField = document.getElementById('mobile-number-field');
        if (mode === 'online') {
            meetingLinkField.style.display = 'block';
            addressField.style.display = 'none';
            // mobileNumberField.style.display = 'none';
        } else if (mode === 'onsite') {
            meetingLinkField.style.display = 'none';
            addressField.style.display = 'block';
            // mobileNumberField.style.display = 'none';
        } else if (mode === 'telephonic') {
            meetingLinkField.style.display = 'none';
            addressField.style.display = 'none';
            // mobileNumberField.style.display = 'none';
        }
    };

    const handleModalInputChange = (event) => {
        const { name, value } = event.target;
        setModalFields(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Automatically update interviewDateTime when either date or time changes
    useEffect(() => {
        if (modalFields.interviewDate && modalFields.interviewTime) {
            const interviewDateTime = `${modalFields.interviewDate}T${modalFields.interviewTime}:00`;
            setModalFields(prev => ({
                ...prev,
                interviewDateTime
            }));
        }
    }, [modalFields.interviewDate, modalFields.interviewTime]);
    
    const handleSubmit = async (event) => {
        event.preventDefault();
    
        const payload = {
            applicant_email: applicationInfo?.applicant_email,
            applicant_name: applicationInfo?.applicant_name,
            applicationId: applicationInfo?.applicationId,
            companyId: companyId,
            job_title: applicationInfo?.job_title,
            jobid: applicationInfo?.jobid,
            schedularDesignation: userInfo?.designation,
            schedularEmail: userInfo?.email,
            schedularName: userInfo?.name,
            interview_name: modalFields?.interviewName,
            interview_mode: modalFields?.mode,
            interview_timing: modalFields.interviewDateTime, // Now it should have the correct date and time
            meeting_link: modalFields?.meetingLink,
            office_address: modalFields?.address,
            mobile_number: modalFields?.mobileNumber,
            interviewers: modalFields?.interviewerName
        };
    
        try {
            const token = getAuthToken();
            const response = await fetch(`${baseURL}/api/schedule-interview/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                toast.success('Interview scheduled successfully.');
                setShowModalNew(false);
                fetchScheduleInterview();
            } else {
                toast.error(data.message || 'Failed to schedule the interview.');
            }
        } catch (error) {
            toast.error('An error occurred while scheduling the interview.');
            console.error('Error scheduling interview:', error);
        }
    };
    const [showCancelInterviewModal, setShowCancelInterviewModal] = useState(false);
    const [toCancelInterviewId, setToCancelInterviewId] = useState(null);
    const [cancelInterviewTrigger, setCancelInterviewTrigger] = useState(false);
    const openCancelInterviewModal = (interview) => {
        setToCancelInterviewId(interview);
        setShowCancelInterviewModal(true);
    };

    useEffect(() => {
    }, [toCancelInterviewId]);

    const closeCancelInterviewModal = () => {
        setShowCancelInterviewModal(false);
        setToCancelInterviewId(null);
    };
    const confirmCancelInterview = () => {
        setCancelInterviewTrigger(true);
    };
    useEffect(() => {
        const handleCancelInterview = async () => {
            try {
                const response = await fetchPOST(`${baseURL}/api/interviews/${companyId}/${toCancelInterviewId}/cancel/`, {
                    body: {
                        is_cancelled: true,
                    }
                });
                if (response.status === 1) {
                    toast.success('Interview canceled successfully.');
                    fetchScheduleInterview();
                    // fetchScheduleInterview();
                } else {
                    toast.error('Failed to cancel interview.');
                }
            } catch (error) {
                toast.error('An error occurred while canceling the interview.');
                console.error('Error canceling interview:', error);
            } finally {
                setShowCancelInterviewModal(false);
                setCancelInterviewTrigger(false);
                // Reset the trigger
            }
        };

        if (cancelInterviewTrigger) {
            handleCancelInterview();
        }
    }, [cancelInterviewTrigger, companyId, toCancelInterviewId]);

    if (!applicationInfo && !noRecordMessage) {
        return <div>Loading...</div>;
    }

    const employeeOptions = employees.map(employee => ({
        value: employee.value,
        label: employee.label
    }));

    // Handle change for multi-select
    const handleChange = selectedOptions => {
        // Convert selected options to the format you need
        const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
        handleModalInputChange({ target: { name: 'interviewerName', value: selectedValues } });
    };

    return (
        <div className="container mx-auto my-4 p-4 bg-white dark:bg-gray-900 rounded shadow">
            <div className="text-black rounded-2 flex flex-row items-center gap-2">
                <Icon icon="gg:arrow-left-o" className='w-8 h-8 cursor-pointer' onClick={() => navigate(-1)} />
                <p className="text-black font-semibold text-f20 flex">Applicant info</p>
            </div>
            <ToastContainer />
            {noRecordMessage ? (
                <h2 className="text-center text-red-500 dark:text-red-400">{noRecordMessage}</h2>
            ) : (
                <section className="p-4 bg-white dark:bg-gray-900 rounded-md ">
                    {applicationInfo?.job_title && (
                        <h2 className="text-2xl font-bold underline text-blue-500 dark:text-blue-300 text-center mb-2">
                            {applicationInfo?.job_title}
                        </h2>
                    )}
                    {applicationInfo?.jobid && (
                        <h2 className="text-xl font-semibold text-secondary dark:text-secondary text-center mb-4">
                            Job Id - #{applicationInfo?.jobid}
                        </h2>
                    )}
                    <h2 className="text-xl font-semibold text-secondary dark:text-secondary text-center mb-4">
                        Applicant Information
                    </h2>

                    {applicationInfo?.applicant_name && (
                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                            <strong className="font-semibold">Name - </strong>
                            <span>{applicationInfo?.applicant_name}</span>
                        </div>
                    )}
                    {applicationInfo?.applicant_email && (
                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                            <strong className="font-semibold">Email - </strong>
                            <a className="text-blue-600 dark:text-blue-400" href={`mailto:${applicationInfo?.applicant_email}`}>
                                {applicationInfo?.applicant_email}
                            </a>
                        </div>
                    )}
                    {applicationInfo?.mobile_no && (
                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                            <strong className="font-semibold">Mobile No. - </strong>
                            <a className="text-blue-600 dark:text-blue-400" href={`callto:${applicationInfo?.mobile_no}`}>
                                {applicationInfo?.mobile_no}
                            </a>
                        </div>
                    )}
                    {(applicationInfo?.total_experience || applicationInfo?.total_experience === 0) && (
                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                            <strong className="font-semibold">Total Experience - </strong>
                            <span>{applicationInfo?.total_experience} Years.</span>
                        </div>
                    )}
                    {applicationInfo?.skills && (
                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                            <strong className="font-semibold">Skills - </strong>
                            <span>{applicationInfo?.skills.join(', ')}</span>
                        </div>
                    )}
                    {applicationInfo?.education && applicationInfo?.education.length > 0 && (
                        <>
                            <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                <strong className="font-semibold text-lg">Education</strong>
                            </div>
                            {applicationInfo?.education.map((education, index) => (
                                <div key={index} className="text-gray-600 dark:text-gray-400 mb-4">
                                    {education?.course && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">Course - </strong>
                                            <span>{education?.course}</span>
                                        </div>
                                    )}
                                    {education?.institute && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">Institute - </strong>
                                            <span>{education?.institute}</span>
                                        </div>
                                    )}
                                    {education?.percentage && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">Percentage - </strong>
                                            <span>{education?.percentage}</span>
                                        </div>
                                    )}
                                    {education?.passingYear && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">Passing Year - </strong>
                                            <span>{education?.passingYear}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    {applicationInfo?.work_experience && applicationInfo?.work_experience.length > 0 && (
                        <>
                            <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                <strong className="font-semibold text-lg">Work Experience</strong>
                            </div>
                            {applicationInfo?.work_experience.map((work_experience, index) => (
                                <div key={index} className="text-gray-600 dark:text-gray-400 mb-4">
                                    {work_experience?.organization && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">Organization - </strong>
                                            <span>{work_experience?.organization}</span>
                                        </div>
                                    )}
                                    {work_experience?.position && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">Position - </strong>
                                            <span>{work_experience?.position}</span>
                                        </div>
                                    )}
                                    {work_experience?.place && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">Place - </strong>
                                            <span>{work_experience?.place}</span>
                                        </div>
                                    )}
                                    {work_experience?.startDate && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">Start Date - </strong>
                                            <span>{work_experience?.startDate}</span>
                                        </div>
                                    )}
                                    {work_experience?.endDate && !work_experience?.currentlyWorking && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">End Date - </strong>
                                            <span>{work_experience?.endDate}</span>
                                        </div>
                                    )}
                                    {work_experience?.currentlyWorking && (
                                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                                            <strong className="font-semibold">End Date - </strong>
                                            <span>Till Now.</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                        <strong className="font-semibold">Willing to Relocate? - </strong>
                        <span>{applicationInfo?.is_relocate ? "Yes" : "No"}</span>
                    </div>

                    {applicationInfo?.address && (
                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                            <strong className="font-semibold">Address - </strong>
                            <span>{applicationInfo?.address}</span>
                        </div>
                    )}
                    {applicationInfo?.state && (
                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                            <strong className="font-semibold">State - </strong>
                            <span>{applicationInfo?.state}</span>
                        </div>
                    )}
                    {applicationInfo?.country && (
                        <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                            <strong className="font-semibold">Country - </strong>
                            <span>{applicationInfo?.country}</span>
                        </div>
                    )}
                    {applicationInfo?.upload_resume &&
                        <div className="px-4 py-2 flex items-center gap-4 text-gray-900 dark:text-gray-300">
                            <strong className="font-semibold">Resume - </strong>
                            <div className="">
                                <a target="_blank" rel="noopener noreferrer" href={`${baseURL}${applicationInfo?.upload_resume}`} className="flex justify-center items-center gap-2 btn btn-dark text-center dark:border-2 dark:border-white">
                                    Download <Icon icon="iconoir:cloud-download" />
                                </a>
                            </div>

                        </div>
                    }
                    <div className='w-full flex justify-end'>
                        <button onClick={() => setShowModalNew(true)} className="float-right flex justify-center items-center gap-2 btn btn-dark text-center dark:border-2 dark:border-white"><Icon icon="uil:schedule" /> Schedule Interview</button>
                    </div>
                </section>
            )}


            <Card>
                <div className="overflow-x-auto -mx-6">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-x-auto">
                            <table
                                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                                {...getTableProps()}
                            >
                                <thead className="bg-slate-200 dark:bg-slate-700">
                                    {headerGroups.map(headerGroup => (
                                        <tr {...headerGroup.getHeaderGroupProps()}>
                                            {headerGroup.headers.map(column => (
                                                <th
                                                    {...column.getHeaderProps(column.getSortByToggleProps())}
                                                    scope="col"
                                                    className="table-th"
                                                >
                                                    <div className="flex">
                                                        {column.render("Header")}
                                                        <span>
                                                            {column.isSorted
                                                                ? column.isSortedDesc
                                                                    ? " 🔽"
                                                                    : " 🔼"
                                                                : ""}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody
                                    className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                                    {...getTableBodyProps()}
                                >
                                    {loading ? (
                                        <ListSkeleton />
                                    ) : rows.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-5">
                                                No interviews found!
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map(row => {
                                            prepareRow(row);
                                            return (
                                                <tr {...row.getRowProps()} className="cursor-pointer relative">
                                                    {row.cells.map(cell => (
                                                        <td {...cell.getCellProps()} className="table-td">
                                                            {cell.render("Cell")}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </Card>

            <AdvancedModal
                activeModal={isModalOpen}
                onClose={closeModal}
                className="max-w-xl"
                title="Interview Details"
            >
                {selectedInterview && (
                    <div className="text-left border my-2">
                        <div className="px-6 py-2 font-semibold text-gray-900">
                            <label htmlFor="interviewName" className="font-normal">Interview Name - </label>
                            <label htmlFor="interviewName">{selectedInterview.name}</label>
                        </div>
                        <div className="px-6 py-2 font-semibold text-gray-900">
                            <label htmlFor="interviewTime" className="font-normal">Interview Time - </label>
                            <label htmlFor="interviewTime">{selectedInterview.time}</label>
                        </div>
                        <div className="px-6 py-2 font-semibold text-gray-900">
                            <label htmlFor="isCompleted" className="font-normal">Is Completed - </label>
                            <label htmlFor="isCompleted">{selectedInterview.is_completed ? "Yes" : "No"}</label>
                        </div>
                    </div>
                )}
                <div className="flex justify-between py-4">
                    <button className="px-4 py-2 text-white bg-blue-600 rounded-md" onClick={closeModal}>Close</button>
                </div>
            </AdvancedModal>


            <AdvancedModal
                activeModal={showModalNew}
                onClose={() => setShowModalNew(false)}
                className="max-w-4xl"
                title="Schedule An Interview"
            >
                <form className="p-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4 mb-4 grid-cols-2">
                        <div className="col-span-2">
                            <label htmlFor="interview-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Interview Name</label>
                            <input
                                type="text"
                                id="interview-name"
                                name="interviewName"
                                value={modalFields.interviewName}
                                onChange={handleModalInputChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            />
                        </div>
                        <div className="col-span-2">
                            <label htmlFor="mode" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Mode</label>
                            <select
                                id="mode"
                                name="mode"
                                value={modalFields.mode}
                                onChange={handleModalInputChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            >
                                <option value="online">Online</option>
                                <option value="walk-in">On-site</option>
                                <option value="telephonic">Telephonic</option>
                            </select>
                        </div>
                        <div className="col-span-2" id="meeting-link-field" style={{ display: modalFields.mode === 'online' ? 'block' : 'none' }}>
                            <label htmlFor="meeting-link" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Meeting Link</label>
                            <input
                                type="text"
                                id="meeting-link"
                                name="meetingLink"
                                value={modalFields.meetingLink}
                                onChange={handleModalInputChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            />
                        </div>
                        <div className="col-span-2" id="address-field" style={{ display: modalFields.mode === 'walk-in' ? 'block' : 'none' }}>
                            <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Address</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={modalFields.address}
                                onChange={handleModalInputChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            />
                        </div>

                        <div className='col-span-2'>
                            <label htmlFor="interviewer-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Interviewer Employee Name
                            </label>
                            <Select
                                id="interviewer-name"
                                name="interviewerName"
                                value={employeeOptions.filter(option => modalFields.interviewerName.includes(option.value))}
                                onChange={handleChange}
                                options={employeeOptions}
                                isMulti
                                className="basic-multi-select "
                                classNamePrefix="select"
                            />
                        </div>
                        {/* <div className="col-span-2" id="mobile-number-field" style={{ display: modalFields.mode === 'telephonic' ? 'block' : 'none' }}>
                            <label htmlFor="mobile-number" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Mobile Number</label>
                            <input
                                type="text"
                                id="mobile-number"
                                name="mobileNumber"
                                value={modalFields.mobileNumber}
                                onChange={handleModalInputChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                            />
                        </div> */}
                        <div className="col-span-1">
                            <label htmlFor="interview-date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Interview Date</label>
                            <input
                                type="date"
                                id="interview-date"
                                name="interviewDate"
                                value={modalFields.interviewDate}
                                onChange={handleModalInputChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="col-span-1">
                            <label htmlFor="interview-time" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Interview Time</label>
                            <input
                            type="time"
                            id="interview-time"
                            name="interviewTime"
                            value={modalFields.interviewTime}
                            onChange={handleModalInputChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        />
                        </div>
                       
                    </div>
                    <button
                        type="submit"
                        className="float-right mb-4 btn btn-dark text-center dark:border-2 dark:border-white"
                    >
                        Save Interview
                    </button>
                </form>
            </AdvancedModal>

            <AdvancedModal
                activeModal={showCancelInterviewModal}
                onClose={closeCancelInterviewModal}
                className="max-w-md"
                title="Cancel Interview"
            >
                <h2 className="text-lg font-semibold mb-4">Are you sure you want to cancel this interview?</h2>

                <div className="flex justify-between mt-6">
                    <button
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => setShowCancelInterviewModal(false)}
                    >
                        Close
                    </button>
                    <button
                        className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        onClick={confirmCancelInterview}
                    >
                        Cancel Interview
                    </button>
                </div>
            </AdvancedModal>

        </div>
    );
}

export default ApplicantDetail;
