import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchAPI, patchAPI, fetchAuthGET } from '@/store/api/apiSlice'; // Adjust import based on your setup
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { Icon } from '@iconify/react';

function RescheduleInterview() {
    const navigate = useNavigate();
    const { interviewId } = useParams();
    const userInfo = useSelector((state) => state.auth.user);
    const companyId = useSelector((state) => state.auth.user.companyId);
    const [modalFields, setModalFields] = useState({
        interviewName: '',
        mode: 'online',
        meetingLink: '',
        address: '',
        interviewDate: '',
        interviewTime: '',
        interviewerName: [],
    });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const baseURL = import.meta.env.VITE_APP_DJANGO;

    useEffect(() => {
        const getInterviewDetails = async () => {
            try {
                const response = await fetchAPI(`api/interview-details/${interviewId}`);
                if (response.status) {
                    const interviewDateTime = new Date(response.data.interview_timing);
                    const interviewDate = interviewDateTime.toISOString().split('T')[0];
                    const interviewTime = interviewDateTime.toISOString().split('T')[1].split('Z')[0];
    
                    const interviewerNames = response.data.interviewers?.map((interviewer) => ({
                        value: interviewer._id, // Ensure this matches the employee's _id
                        label: interviewer.name,
                    })) || [];
    
                    setModalFields((prevState) => ({
                        ...prevState,
                        interviewName: response.data.interview_name || '',
                        mode: response.data.interview_mode || 'online',
                        meetingLink: response.data.meeting_link || '',
                        address: response.data.office_address || '',
                        interviewDate: interviewDate || '',
                        interviewTime: interviewTime || '',
                        interviewerName: interviewerNames, // Update interviewer names properly
                    }));
                } else {
                    toast.error('Failed to fetch interview details.');
                }
            } catch (error) {
                toast.error('An error occurred while fetching interview details.');
                console.error('Error fetching interview details:', error); 
            } finally {
                setLoading(false); 
            }
        };
    
        getInterviewDetails();
        getAllEmployees(); // Fetch employees for the Select dropdown
    }, [interviewId]);

    const getAllEmployees = useCallback(async () => {
        try {
            let data;
            if (userInfo?.isAdmin) {
                data = await fetchAuthGET(`${baseURL}/employee/list/${companyId}`);
            } else if (userInfo?.team_leader) {
                data = await fetchAuthGET(`${baseURL}/api/team/members/${userInfo?._id}`);
            }

            if (data.status && data.data.length > 0) {
                const employeeOptions = data.data
                    .filter((employee) => employee.isActive)
                    .map((employee) => ({
                        value: employee._id,
                        label: employee.name,
                    }));
                setEmployees(employeeOptions);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    }, [userInfo]);

    const handleChange = (selectedOptions) => {
        setModalFields((prevState) => ({
            ...prevState,
            interviewerName: selectedOptions || [], // Ensure this updates the state with the selected options
        }));
    };

    const handleModalInputChange = (event) => { 
        const { name, value } = event.target;
        setModalFields((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const interviewTiming = `${modalFields.interviewDate}T${modalFields.interviewTime}Z`;

        const payload = {
            interview_id: interviewId,
            interview_timing: interviewTiming,
            interview_mode: modalFields.mode,
            meeting_link: modalFields.mode === 'online' ? modalFields.meetingLink : null,
            office_address: modalFields.mode === 'walk-in' ? modalFields.address : null,
            interview_name: modalFields.interviewName,
            is_passed: 'pending',
            is_completed: false,
            is_cancelled: false,
            applicationId: 7,
            jobid: 1,
            companyId: companyId,
            interviewers: modalFields.interviewerName.map((interviewer) => interviewer.value),
        }; 

        try {
            const response = await patchAPI(`api/reschedule-interviews/${companyId}/${interviewId}/`, payload);
            if (response.status) {
                toast.success('Interview rescheduled successfully.');
            } else {
                toast.error('Failed to reschedule the interview.'); 
            }
        } catch (error) {
            toast.error('An error occurred while rescheduling the interview.');
            console.error('Error rescheduling interview:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="flex flex-row items-center gap-2 mb-4">
                <Icon icon="gg:arrow-left-o" className="w-8 h-8 cursor-pointer" onClick={() => navigate(-1)} />
                <p className="text-black font-semibold text-f20">Reschedule Interview</p>
            </div>
            <form className="p-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 mb-4 grid-cols-2">
                    {/* Interview Name */}
                    <div className="col-span-2">
                        <label htmlFor="interview-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Interview Name
                        </label>
                        <input
                            type="text"
                            id="interview-name"
                            name="interviewName"
                            value={modalFields.interviewName}
                            onChange={handleModalInputChange}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                        />
                    </div>
                    {/* Mode */}
                    <div className="col-span-2">
                        <label htmlFor="mode" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Mode
                        </label>
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
                    {/* Interviewers */}
                    <div className="col-span-2">
                        <label htmlFor="interviewer-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Interviewer Name
                        </label>
                        <Select
                            id="interviewer-name"
                            name="interviewerName"
                            value={modalFields.interviewerName} // Ensure this matches the expected format
                            onChange={handleChange}
                            options={employees} // Ensure this provides options in the { value, label } format
                            isMulti
                            className="basic-multi-select"
                            classNamePrefix="select"
                        />
                    </div>
                    {/* Interview Date */}
                    <div className="col-span-1">
                        <label htmlFor="interview-date" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Interview Date
                        </label>
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
                    {/* Interview Time */}
                    <div className="col-span-1">
                        <label htmlFor="interview-time" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Interview Time
                        </label>
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
                <button type="submit" className="float-right mb-4 btn btn-dark text-center dark:border-2 dark:border-white">
                    Reschedule Interview
                </button>
            </form>
        </div>
    );
}

export default RescheduleInterview;
