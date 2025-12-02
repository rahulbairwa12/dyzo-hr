import React from "react";
import { useNavigate } from "react-router-dom";

const ExpiredInvitationModal = () => {
  const navigate = useNavigate();

  const onClose = () => {
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-8 w-[90%] max-w-sm sm:max-w-sm text-center">
        <img
          src="/app-icon.249ed5d5.jpg" // Use your logo or a relevant icon
          alt="Expired"
          className="mx-auto mb-4 w-16 h-16"
        />
        <h2 className="text-xl sm:text-2xl font-bold mb-2 text-red-600">Invitation Expired</h2>
        <p className="mb-6 text-gray-700 dark:text-gray-200 text-sm sm:text-base">
          This invitation has expired or has been deleted.<br />
          Please contact your admin for a new invitation.
        </p>
        <button
          onClick={onClose}
          className="btn btn-dark w-full"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default ExpiredInvitationModal;