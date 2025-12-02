import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import Tooltip from './Tooltip';
import { useSelector } from 'react-redux';
import { fetchAuthGET } from '@/store/api/apiSlice';

const MiniTrialCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('Loading trial information...');
  const userInfo = useSelector((state) => state.auth.user);
  
  // Only show for company ID 2
  if (userInfo?.companyId !== 2) {
    return null;
  }

  useEffect(() => {
    // Fetch company details to get creation date
    const fetchCompanyDetails = async () => {
      if (!userInfo?.companyId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const apiUrl = `https://api.dyzo.ai/company/${userInfo.companyId}/`;
        const response = await fetchAuthGET(apiUrl);
        
        if (response && response.created_at) {
          calculateTrialPeriod(response.created_at);
        } else {
          // Fallback to a default date if API returns incomplete data
          const defaultCreatedAt = new Date();
          defaultCreatedAt.setDate(defaultCreatedAt.getDate() - 5); // Assume 5 days already used
          calculateTrialPeriod(defaultCreatedAt.toISOString());
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
        // Fallback to a default date if API fails
        const defaultCreatedAt = new Date();
        defaultCreatedAt.setDate(defaultCreatedAt.getDate() - 5); // Assume 5 days already used
        calculateTrialPeriod(defaultCreatedAt.toISOString());
      }
    };

    fetchCompanyDetails();
  }, [userInfo?.companyId]);

  const calculateTrialPeriod = (createdAt) => {
    // Parse the creation date safely
    let creationDate;
    try {
      creationDate = new Date(createdAt);
      // Check if date is valid
      if (isNaN(creationDate.getTime())) {
        console.error('Invalid date format:', createdAt);
        creationDate = new Date(); // Fallback to current date
        creationDate.setDate(creationDate.getDate() - 5); // Assume 5 days used
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      creationDate = new Date();
      creationDate.setDate(creationDate.getDate() - 5); // Fallback
    }
    
    // Calculate end date (creation date + 15 days)
    const endDate = new Date(creationDate);
    endDate.setDate(endDate.getDate() + 15);
    const formattedEndDate = endDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = endDate - now;

      if (difference > 0) {
        const newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
        
        setTimeLeft(newTimeLeft);
        setTooltipContent(`Your free trial ends on ${formattedEndDate} (${newTimeLeft.days} days left)`);
        setIsExpired(false);
      } else {
        // Trial has expired
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setTooltipContent('Your free trial has expired. Upgrade to Pro!');
        setIsExpired(true);
      }
      setLoading(false);
    };

    // Initial calculation
    calculateTimeLeft();

    // Update every minute instead of every second to be more efficient
    const timer = setInterval(calculateTimeLeft, 60000);

    // Clear interval on component unmount
    return () => clearInterval(timer);
  };

  if (loading) {
    return (
      <Tooltip
        title="Trial Period"
        content="Loading trial information..."
        placement="bottom"
        arrow
        animation="shift-away"
      >
        <div className="flex items-center rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 text-xs font-medium animate-pulse">
          <Icon icon="eos-icons:loading" className="mr-1" />
          <span>Loading...</span>
        </div>
      </Tooltip>
    );
  }

  if (isExpired) {
    return (
      <Tooltip
        title="Trial Expired"
        content="Your free trial has expired. Upgrade to Pro!"
        placement="bottom"
        arrow
        animation="shift-away"
      >
        <Link 
          to="/plans"
          className="flex items-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 text-xs font-medium"
        >
          <Icon icon="heroicons:exclamation-circle" className="mr-1" />
          <span>Expired</span>
        </Link>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title="Trial Period"
      content={tooltipContent}
      placement="bottom"
      arrow
      animation="shift-away"
    >
      <Link 
        to="/plans"
        className="flex items-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 text-xs font-medium"
      >
        <Icon icon="heroicons:clock" className="mr-1 animate-pulse" />
        <span>{timeLeft.days}d {timeLeft.hours}h</span>
      </Link>
    </Tooltip>
  );
};

export default MiniTrialCountdown; 