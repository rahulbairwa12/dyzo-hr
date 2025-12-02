import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { sendNotification } from '@/helper/helper';
import { fetchAuthPut } from '@/store/api/apiSlice';

const LeaveActions = ({ leave, userInfo, permissions, fetchLeaves, schedule }) => {
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const baseUrl = window.location.origin;
  const [reason, setReason] = useState('');

  const handleApproveLeave = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const data = await fetchAuthPut(`${baseURL}/leave/approve/${leave.leaveId}/by/${userInfo._id}/`, {
        body: {
          reason: reason.trim()
        }
      });

      if (data.status === 1) {
        toast.success('Leave approved successfully');
        fetchLeaves();
        sendNotification(
          'Your leave is approved',
          'Leave approved',
          'userId',
          data?.employee,
          { 'Message': 'Leave approved' },
          `${baseUrl}/login?redirect=/leaves/leave-detail/${data.leaveId}`
        );
        setReason('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error approving leave');
    }
  };

  const handleRejectLeave = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      const data = await fetchAuthPut(`${baseURL}/leave/reject/${leave.leaveId}/by/${userInfo._id}/`, {
        body: {
          reason: reason.trim()
        }
      });

      if (data.status === 1) {
        toast.success('Leave rejected successfully');
        fetchLeaves();
        sendNotification(
          'Your leave is rejected',
          'Leave rejected',
          'userId',
          data?.employee,
          { 'Message': 'Leave rejected' },
          `${baseUrl}/login?redirect=/leaves/leave-detail/${data.leaveId}`
        );
        setReason('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error rejecting leave');
    }
  };

  const isUserInApprovalList = leave.approved_by.includes(userInfo._id);
  const isUserInRejectionList = leave.rejected_by.includes(userInfo._id);

  // Prevent user from approving or rejecting their own leave
  const isSelfLeave = leave.employee === userInfo._id;

  // Check if the leave status is pending
  const isPending = leave.status === "Pending";

  // Determine if the current user has approval permissions based on the schedule
  const canApproveOrReject = (() => {
    if (schedule.leave_approval_by === 'Admin' && userInfo.isAdmin) {
      return true;
    }
    if (userInfo.team_leader) {
      return true;
    }
    if (schedule.leave_approval_by === 'Admin and Team Leader both' && (userInfo.isAdmin || userInfo.team_leader)) {
      return true;
    }
    return false;
  })();

  // Calculate approvers needed based on schedule
  const getRequiredApprovals = () => {
    return 2; // Always require 2 approvals as requested
  };

  // Calculate progress percentage
  const requiredApprovals = getRequiredApprovals();
  const currentApprovals = leave.approved_by?.length || 0;
  const approvalPercentage = Math.min((currentApprovals / requiredApprovals) * 100, 100);

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-lg font-medium mb-4">Leave Actions</h3>

        {/* Approval Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <h4 className="text-sm font-medium">Approval Status</h4>
            <span className="text-xs font-medium text-gray-500 ml-[70px]">
              {currentApprovals} of {requiredApprovals} approvals
              {approvalPercentage === 100 && <span className="ml-2 text-green-500 font-medium">✓ Approved</span>}
            </span>
          </div>

          {/*  <div className="w-1/5 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${leave.status === "Approved" ? "bg-green-500" : leave.status === "Rejected" ? "bg-red-500" : "bg-blue-500"}`}
              style={{ width: `${approvalPercentage}%` }}
            ></div>
          </div> */}
        </div>

        {/* Approvers list with profile pictures */}
        <div className="space-y-3">
          {leave.approved_by_name && leave.approved_by_name.map((name, index) => {
            // Find the approval history for this user
            const approvalHistory = leave.approval_history?.find(
              history => history.user_name === name && history.action === 'approve'
            );

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {leave.approved_by_profile_pic && leave.approved_by_profile_pic[index] ? (
                    <img
                      src={`${baseURL}${leave.approved_by_profile_pic[index]}`}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(name)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm">{name}</span>
                    {approvalHistory && (
                      <span className="text-xs text-gray-500">
                        Reason: {approvalHistory.reason}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm bg-green-100 text-green-600 py-1 px-4 rounded-full">
                  Approved
                </span>
              </div>
            );
          })}

          {/* If no approvers yet, show pending */}
          {(!leave.approved_by_name || leave.approved_by_name.length === 0) && isPending && (
            <div className="text-sm text-gray-500 italic">No approvals yet</div>
          )}

          {/* Rejectors list with profile pictures */}
          {leave.rejected_by_name && leave.rejected_by_name.map((name, index) => {
            // Find the rejection history for this user
            const rejectionHistory = leave.approval_history?.find(
              history => history.user_name === name && history.action === 'reject'
            );

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {leave.rejected_by_profile_pic && leave.rejected_by_profile_pic[index] ? (
                    <img
                      src={`${baseURL}${leave.rejected_by_profile_pic[index]}`}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(name)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm">{name}</span>
                    {rejectionHistory && (
                      <span className="text-xs text-gray-500">
                        Reason: {rejectionHistory.reason}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm bg-red-100 text-red-600 py-1 px-4 rounded-full">
                  Rejected
                </span>
              </div>
            );
          })}
        </div>

        {/* Approval/Rejection Section */}
        <div className="mt-5 space-y-4">
          {canApproveOrReject &&
            isPending &&
            !isUserInApprovalList &&
            !isUserInRejectionList &&
            !isSelfLeave && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-1/2 px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows="2"
                    placeholder="Enter reason for approving/rejecting leave..."
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleApproveLeave}
                    disabled={!reason.trim()}
                    className={`rounded-lg px-6 py-2 transition-colors ${reason.trim()
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-green-500/50 text-white/50 cursor-not-allowed'
                      }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleRejectLeave}
                    disabled={!reason.trim()}
                    className={`rounded-lg px-6 py-2 transition-colors ${reason.trim()
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-red-500/50 text-white/50 cursor-not-allowed'
                      }`}
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default LeaveActions;
