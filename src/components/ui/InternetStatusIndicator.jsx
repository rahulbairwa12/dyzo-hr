import React, { useState, useEffect } from 'react';
import { Icon } from "@iconify/react";
import Tooltip from "@/components/ui/Tooltip";

const InternetStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Function to update the state
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Only render when offline
  if (isOnline) {
    return null;
  }

  return (
    <div className="flex items-center">
      <Tooltip
        title="You are currently offline"
        content="Your internet connection is unavailable. Some features may not work properly."
        placement="bottom"
        arrow
        theme="danger"
      >
        <div className="flex items-center bg-danger-500 text-white px-1 sm:px-3 py-1 rounded-full text-xs font-medium animate-pulse">
          <Icon icon="heroicons-solid:wifi" className="text-lg sm:mr-1" />
          <span>Offline</span>
        </div>
      </Tooltip>
    </div>
  );
};

export default InternetStatusIndicator; 