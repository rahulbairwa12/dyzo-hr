import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import LeaveDetailsCard from './LeaveDetailsCard';
import { fetchAuthGET } from "@/store/api/apiSlice";
import Recentleaves from './Recentleaves.jsx'
import Cookies from 'js-cookie';
import Card from '@/components/ui/Card';

const LeaveDetail = () => {
  const { leaveId } = useParams();
  const navigate = useNavigate();
  const userInfo = useSelector(state => state.auth.user);
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseURL = import.meta.env.VITE_APP_DJANGO;

  useEffect(() => {
    fetchLeaves();
    fetchLeaveChat();
  }, [leaveId]);

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = `${baseURL}/particular/leave/${leaveId}/`;
      const data = await fetchAuthGET(apiUrl);
      setLeave(data);
    } catch (error) {
      console.error('Error fetching leave details:', error);
      setError("An error occurred while fetching leave details");

    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveChat = async () => {
    try {
      const apiUrl = `${baseURL}/api/leave/${leaveId}/chats/`;
      const data = await fetchAuthGET(apiUrl);
    } catch (error) {
      console.error('Error fetching leave chats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary my-2">
        <ToastContainer />
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl text-slate-600 dark:text-slate-300 mb-4">
              {error}
            </div>
            <button
              onClick={() => navigate('/leaves')}
              className="btn btn-primary"
            >
              Back to Leaves
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="bg-primary my-2">
        <ToastContainer />
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl text-slate-600 dark:text-slate-300 mb-4">
              Leave not available
            </div>
            <button
              onClick={() => navigate('/leaves')}
              className="btn btn-primary"
            >
              Back to Leaves
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-primary my-2">
      <ToastContainer />
      <LeaveDetailsCard leave={leave} fetchLeaves={fetchLeaves} />
      <Recentleaves leave={leave} />
    </div>
  );
};

export default LeaveDetail;
