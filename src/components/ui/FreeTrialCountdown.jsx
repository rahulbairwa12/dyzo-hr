import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Button from '../ui/Button';

const FreeTrialCountdown = ({ onClose }) => {
  const [isClosed, setIsClosed] = useState(false);
  const userInfo = useSelector((state) => state.auth.user);
  const { subscriptionData } = useSelector((state) => state.plan);
  const navigate = useNavigate();
  const isAdmin = userInfo?.role === 'admin' || userInfo?.isAdmin;

  // Handle banner close
  const handleClose = () => {
    setIsClosed(true);
    localStorage.setItem('freeTrialBannerClosed', 'true');
    if (onClose) onClose();
  };

  // Handle upgrade button click
  const handleUpgradeClick = () => {
    if (isAdmin) {
      navigate('/plans');
    } else {
      // For non-admin users
      alert("Please contact your administrator to upgrade the plan.");
    }
  };

  // Check if the banner should be shown
  const shouldShowBanner = () => {
    // Get banner closed state from localStorage
    const hasClosedBanner = localStorage.getItem('freeTrialBannerClosed');
    
    // Return false if user closed the banner
    if (hasClosedBanner || isClosed) {
      return false;
    }

    // Check subscription status from Redux
    const isSubscriptionActive = subscriptionData?.subscription_status === 'active';

    // Show for any user with inactive subscription, regardless of company ID
    return !isSubscriptionActive;
  }

  // Don't render if banner shouldn't be shown
  if (!shouldShowBanner()) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 sm:py-3 px-3 sm:px-4 relative shadow-md">
      <button 
        className="absolute right-2 top-2 text-white hover:text-gray-200"
        onClick={handleClose}
        aria-label="Close banner"
      >
        <Icon icon="heroicons-outline:x" className="w-5 h-5" />
      </button>
      
      <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center">
        <div className="flex items-center space-x-2 mb-3 sm:mb-0 text-center sm:text-left w-full sm:w-auto">
          <Icon icon="heroicons-outline:exclamation-circle" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
          <span className="font-medium text-sm sm:text-base">
            We've moved from beta to a paid plan. Upgrade now to keep your data safe and access all features.
          </span>
        </div>
        
        <div className="flex justify-center sm:justify-end mt-2 sm:mt-0 sm:ml-4 w-full sm:w-auto">
          {isAdmin ? (
            <Button 
              text="Select A Plan"
              className="bg-white text-blue-600 hover:bg-gray-100 transition-all duration-200 font-medium rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm shadow-sm"
              onClick={handleUpgradeClick}
            />
          ) : (
            <span className="text-white text-sm sm:text-base font-medium">Please contact your administrator</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeTrialCountdown; 