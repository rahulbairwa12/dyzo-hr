import React, { useEffect, useState } from 'react';
import { useParams , useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchAPI } from '@/store/api/apiSlice';
import { Icon } from '@iconify/react';
import { formatDateWithTime } from "@/helper/helper";
import Card from '@/components/ui/Card';

function ViewScheduleInterview() {
    const { interviewId } = useParams();
    const [interviewDetails, setInterviewDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [interviewRemark, setInterviewRemark] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getInterviewDetails = async () => {
            try {
                const response = await fetchAPI(`api/interview-details/${interviewId}/`);
                if (response.status) {
                    setInterviewDetails(response.data);
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

        const fetchInterviewRemarks = async()=>{
            try {
                const remarkResponse = await fetchAPI(`api/interviews/remarks/${interviewId}/`);
                if(remarkResponse.status){
                    setInterviewRemark(remarkResponse?.data);
                }
            } catch (error) {
            
            }
        }

        fetchInterviewRemarks();

    }, [interviewId]);


    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <section className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md">
            {interviewDetails?.job_title && (
                <h2 className="text-2xl font-bold underline text-blue-500 dark:text-blue-300 text-center mb-2">
                    {interviewDetails?.job_title}
                </h2>
            )}
            {interviewDetails?.jobid && (
                <h2 className="text-xl font-semibold text-secondary dark:text-secondary text-center mb-4">
                    Job Id - #{interviewDetails?.jobid}
                </h2>
            )}
            <h2 className="text-xl font-semibold text-secondary dark:text-secondary text-center mb-4">
                Interview Details
            </h2>

            {interviewDetails?.applicationId?.applicant_name && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Applicant Name - </strong>
                    <span>{interviewDetails?.applicationId.applicant_name}</span>
                </div>
            )}

            {interviewDetails?.applicationId?.applicant_email && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Applicant Email - </strong>
                    <span>{interviewDetails?.applicationId.applicant_email}</span>
                </div>
            )}

            {interviewDetails?.applicationId?.job_title && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Job Title - </strong>
                    <span>{interviewDetails?.applicationId.job_title}</span>
                </div>
            )}

            {interviewDetails?.interview_name && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Interview Name - </strong>
                    <span>{interviewDetails?.interview_name}</span>
                </div>
            )}
            {interviewDetails?.interview_timing && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Interview Timing - </strong>
                    <span>{formatDateWithTime(interviewDetails?.interview_timing)}</span>
                </div>
            )}

            {interviewDetails?.interview_mode && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Interview Mode - </strong>
                    <span>{interviewDetails?.interview_mode}</span>
                </div>
            )}

            {interviewDetails?.interview_mode === 'walk-in' && interviewDetails?.office_address && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Address - </strong>
                    <span>{interviewDetails?.office_address}</span>
                </div>
            )}
            {interviewDetails?.interview_mode === 'Online' && interviewDetails?.meeting_link && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Meeting Link - </strong>
                    <a className="text-blue-600 dark:text-blue-400" href={interviewDetails?.meeting_link} target="_blank" rel="noopener noreferrer">
                        {interviewDetails?.meeting_link}
                    </a>
                </div>
            )}
            {interviewDetails?.interview_mode === 'telephonic' && interviewDetails?.applicationId.mobile_no && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Mobile Number - </strong>
                    <span>{interviewDetails?.applicationId.mobile_no}</span>
                </div>
            )}

            {interviewDetails?.interviewers && interviewDetails?.interviewers.length > 0 && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Interviewers - </strong>
                    <span>{interviewDetails?.interviewers.map((interviewer, index) => (
                        <span key={index}>{interviewer.first_name} {interviewer.last_name}{index < interviewDetails.interviewers.length - 1 ? ', ' : ''}</span>
                    ))}</span>
                </div>
            )}

            {interviewDetails?.is_completed !== undefined && (
                <div className="px-4 py-2 text-gray-900 dark:text-gray-300">
                    <strong className="font-semibold">Is Completed - </strong>
                    <span>{interviewDetails?.is_completed ? "Yes" : "No"}</span>
                </div>
            )}

            <div className='w-full flex justify-end'>
                <button onClick={() => navigate(`/reschedule-interview/${interviewDetails.interview_id}`)} className="flex justify-center items-center gap-2 btn btn-dark text-center dark:border-2 dark:border-white">
                    <Icon icon="uil:schedule" /> Reschedule Interview
                </button>
            </div>
            {interviewRemark && interviewRemark.length > 0 && (
    <Card title="Bordered Table" className='mt-4' noborder>
      <div className="overflow-x-auto ">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden ">
            <table className="min-w-full border border-slate-100 table-fixed dark:border-slate-700 border-collapse">
              <thead>
                <tr>
                  <th className="table-th border border-slate-100 dark:bg-slate-800 dark:border-slate-700 px-2">
                    Interview Name
                  </th>
                  <th className="table-th border border-slate-100 dark:bg-slate-800 dark:border-slate-700 px-2">
                    Interviewer
                  </th>
                  <th className="table-th border border-slate-100 dark:bg-slate-800 dark:border-slate-700 px-2">
                    Marks
                  </th>
                  <th className="table-th border border-slate-100 dark:bg-slate-800 dark:border-slate-700 px-2">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {interviewRemark?.map((remarksinfo, index) => (
                  <tr key={index}>
                    <td className="table-td border border-slate-100 dark:bg-slate-800 dark:border-slate-700 px-2">
                      {remarksinfo?.interview_id?.interview_name}
                    </td>
                    <td className="table-td border border-slate-100 dark:bg-slate-800 dark:border-slate-700 px-2">
                      {remarksinfo?.interviewer_name}
                    </td>
                    <td className="table-td border border-slate-100 dark:bg-slate-800 dark:border-slate-700 px-2">
                      {remarksinfo?.marks}
                    </td>
                    <td className="table-td border border-slate-100 dark:bg-slate-800 dark:border-slate-700 px-2">
                      {remarksinfo?.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  )}
        </section>
        
    );
}

export default ViewScheduleInterview;
