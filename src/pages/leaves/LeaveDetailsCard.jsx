import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import Card from '@/components/ui/Card';
import dayjs from 'dayjs';
import { fetchAuthGET } from '@/store/api/apiSlice';
import TrackingParcel from '@/components/partials/widget/activity';
import HowCanAction from './HowCanAction';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import Icons from '@/components/ui/Icon';
import LeaveActions from './LeaveActions';
import EditLeaveModal from './EditLeaveModal';
import LeaveAttachment from './LeaveAttachment';
import { useNavigate } from 'react-router-dom';

const LeaveDetailsCard = ({ leave, fetchLeaves }) => {
  const baseUrl = import.meta.env.VITE_APP_DJANGO;
  const [leaveApprovalPerson, setLeaveApprovalPerson] = useState('');
  const [journeyData, setJourneyData] = useState([])
  const [schedule, setSchedule] = useState([])
  const userInfo = useSelector(state => state.auth.user);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const defaultImage = "https://api.dyzo.ai/media/images/defalut.jpg"
  const navigate = useNavigate();
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

  const fetchLeaveJourneyData = async () => {
    try {
      const journey = await fetchAuthGET(`${baseUrl}/leave/${leave.leaveId}/journeys/`);
      setJourneyData(journey.data)
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {

    const getSchedule = async () => {
      try {
        const data = await fetchAuthGET(`${baseUrl}/schedule/${userInfo?.companyId}/`);
        if (data.status) {
          setLeaveApprovalPerson(data.leave_approval_person);
          setSchedule(data);
        }
      } catch (error) {
        toast.error('Error in fetch task logs')
      }
    }

    fetchLeaveJourneyData()
    getSchedule()
  }, [])

  function formatDateWithTime(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    let amOrPm = hours > 12 ? 'PM' : 'AM';

    if (isMobile) {
      // Simpler format for mobile
      return `${day}-${month.substring(0, 3)}-${year} ${hours}:${minutes} ${amOrPm}`;
    }

    return `${day}-${month}-${year}  ${hours}:${minutes} ${amOrPm}`;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    if (isMobile) {
      // Shorter format for mobile
      return `${day} ${month.substring(0, 3)} ${year}`;
    }

    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
    return `${dayOfWeek}, ${day} ${month} ${year}`;
  };

  const countDays = (start, end) => {
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    const numDays = endDate.diff(startDate, 'day') + 1;
    return <span>{numDays} {numDays > 1 ? "Days" : "Day"}</span>;
  }

  const handleDeleteLeave = async () => {
    try {
      const data = await fetchDelete(`${baseUrl}/leave/delete/${leave.leaveId}/`);
      if (data.status) {
        toast.success(data.message);
        navigate('/leaves');
      } else {
        toast.error(data.response.data.error);
      }
    } catch (error) {
      toast.error('Error deleting leave');
    }
  };

  return (
    <div className="p-3 md:p-6 bg-white dark:bg-gray-800 rounded shadow-md">

      <div>
        <div className="space-y-3 md:space-y-5 profile-page">
          <div className="profiel-wrap px-3 md:px-[35px] pb-6 md:pb-10 md:pt-[84px] pt-6 rounded-lg bg-white dark:bg-slate-800 lg:flex lg:space-y-0 space-y-4 md:space-y-6 justify-between items-end relative z-[1]">
            <div className="bg-slate-900 dark:bg-slate-700 absolute left-0 top-0 md:h-1/2 h-[120px] md:h-[150px] w-full z-[-1] rounded-t-lg"></div>
            <div className="profile-box flex-none md:text-start text-center">
              <div className="md:flex items-end md:space-x-6 rtl:space-x-reverse">
                <div className="flex-none">
                  <div className="md:h-[186px] md:w-[186px] h-[110px] w-[110px] md:ml-0 md:mr-0 ml-auto mr-auto md:mb-0 mb-4 rounded-full ring-4 ring-slate-100 relative">
                    {leave.employeeProfilePicture ? (
                      <img
                        src={baseUrl + leave.employeeProfilePicture}
                        alt=""
                        className="w-full h-full object-cover rounded-full object-top	"
                      />
                    ) : (
                      <img
                        src={defaultImage}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                      />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-lg md:text-2xl font-medium text-slate-900 dark:text-slate-200 mb-[3px]">
                    {leave.employee_name}
                  </div>
                  <div className="text-sm font-light text-slate-600 dark:text-slate-400">
                    <span
                      className={`inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 ${leave.status === "Approved" ? "text-success-500 bg-success-500" : ""
                        } ${leave.status === "Pending" ? "text-warning-500 bg-warning-500" : ""} ${leave.status === "Rejected" ? "text-danger-500 bg-danger-500" : ""
                        }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className='flex items-center justify-end gap-3 my-2'>
                {leave.status === "Pending" && userInfo?.isAdmin &&
                  <>
                    <span onClick={() => setIsEditModalOpen(true)}><Icons icon="heroicons:pencil-square" className='w-5 md:w-6 h-5 md:h-6 cursor-pointer' /></span>
                    <span onClick={handleDeleteLeave}><Icons icon="ph:trash-light" className='w-5 md:w-6 h-5 md:h-6 cursor-pointer' /></span>
                  </>
                }
              </div>

              <div className="grid grid-cols-1 text-center md:grid-cols-3 gap-2 md:gap-3">
                <div>
                  <div className="text-xs md:text-sm text-slate-600 font-light dark:text-slate-300">
                    Leave Type
                  </div>
                  <div className="text-sm md:text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                    {leave.leave_type}
                  </div>
                </div>

                <div >
                  <div className="text-xs md:text-sm text-slate-600 font-light dark:text-slate-300">
                    Start Date
                  </div>
                  <div className="text-sm md:text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                    {formatDate(leave.start_date)}
                  </div>
                </div>

                <div>
                  <div className="text-xs md:text-sm text-slate-600 font-light dark:text-slate-300">
                    End Date
                  </div>
                  <div className="text-sm md:text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                    {formatDate(leave.end_date)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm md:text-base text-slate-900 dark:text-slate-300 font-medium mb-1"><strong>Reason:</strong></p>
          <p className="text-xs md:text-sm text-slate-600 font-light dark:text-slate-300">{leave.reason}</p>

          <LeaveActions leave={leave} userInfo={userInfo} permissions={1} fetchLeaves={fetchLeaves} fetchLeaveJourneyData={fetchLeaveJourneyData} schedule={schedule} />

          {/* <LeaveAttachment leave={leave} /> */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

            <Card title="Info" bodyClass="p-3 md:p-5">
              <ul className="list space-y-4 md:space-y-8">
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-xl md:text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="fluent-mdl2:date-time" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      Applied On
                    </div>
                    <a
                      href="mailto:someone@example.com"
                      className="text-sm md:text-base text-slate-600 dark:text-slate-50"
                    >
                      {formatDateWithTime(leave.timestamp)}
                    </a>
                  </div>
                </li>
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-xl md:text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="icon-park-twotone:add-web" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      Number of Days
                    </div>
                    <a
                      href="tel:0189749676767"
                      className="text-sm md:text-base text-slate-600 dark:text-slate-50"
                    >
                      {countDays(leave.start_date, leave.end_date)}
                    </a>
                  </div>
                </li>
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-xl md:text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="icon-park-twotone:add-web" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      Approval required
                    </div>
                    <a
                      href="tel:0189749676767"
                      className="text-sm md:text-base text-slate-600 dark:text-slate-50"
                    >
                      {leaveApprovalPerson}
                    </a>
                  </div>
                </li>
              </ul>
            </Card>

            <Card title="Attachment" bodyClass="p-3 md:p-5">
              <LeaveAttachment leave={leave} />
            </Card>

            <Card title="Leave Activity" bodyClass="p-3 md:p-5">
              <TrackingParcel journeyData={journeyData} />
            </Card>
          </div>
        </div>
      </div>


      {<EditLeaveModal activeModal={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} leave={leave} fetchLeaves={fetchLeaves} fetchLeaveJourneyData={fetchLeaveJourneyData} />}


    </div>
  );
};

export default LeaveDetailsCard;
