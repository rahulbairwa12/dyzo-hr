import React from 'react';

const LeaveLogs = ({ leaveId, closeModal }) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Leave Logs {leaveId}</h2>
        <button onClick={() => closeModal(false)} className="btn btn-primary">
          Close
        </button>
      </div>
    </div>
  );
};

export default LeaveLogs;
