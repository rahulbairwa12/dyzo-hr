import React, { useEffect } from "react";
import { djangoBaseURL } from "@/helper";

const Loader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="loader"></div>
    <style jsx>{`
      .loader {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-left-color: #000;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);

const CalendarAuth = () => {
  useEffect(() => {
    const redirectToGoogleAuth = () => {
      window.location.href = `${djangoBaseURL}/api/calendar/auth/`;
    };

    redirectToGoogleAuth();
  }, []);

  return (
    <div>
      <Loader />
    </div>
  );
};

export default CalendarAuth;
