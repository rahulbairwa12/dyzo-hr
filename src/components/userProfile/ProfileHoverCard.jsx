import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { intialLetterName } from "@/helper/helper";
import { useSelector } from "react-redux";
import { djangoBaseURL } from "@/helper";
import { fetchAuthGET } from "@/store/api/apiSlice";

const ProfileHoverCard = ({ user, isCompleted = false }) => {
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const fetchedUsersRef = useRef(new Set());

  // Get current user info from Redux store
  const userInfo = useSelector((state) => state.auth.user);

  // Fetch employee details from API
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (user && (user._id || user.value)) {
        const employeeId = user._id || user.value;

        // Skip fetch if we've already fetched this user's data
        if (fetchedUsersRef.current.has(employeeId)) {
          return;
        }

        try {
          // Mark this user as being fetched
          fetchedUsersRef.current.add(employeeId);

          const data = await fetchAuthGET(`${djangoBaseURL}/employee/me/${employeeId}/`);
          if (data.status === 1 && data.data) {
            setEmployeeDetails(data.data);
          }
        } catch (error) {
          console.error("Error fetching employee details:", error);
        }
      }
    };

    fetchEmployeeData();

    return () => {
      // We don't reset fetchedUsersRef to keep track of already fetched users
      // This prevents refetching when hovering again
    };
  }, [user?._id, user?.value]); // Only depend on the user ID, not the entire user object

  // Use employee details from API if available, otherwise use passed user data
  const displayUser = employeeDetails || user;

  if (!displayUser) return null;

  const getProfileImage = (user) => {
    if (user.profile_picture) {
      // If it's already a full URL, use as is
      if (user.profile_picture.startsWith("http")) return user.profile_picture;
      // Otherwise, prepend the base URL
      return `${import.meta.env.VITE_APP_DJANGO}${user.profile_picture}`;
    }
    // Fallbacks
    return user.image || user.profilePic || "";
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Add slight delay before hiding to allow user to move cursor to the card
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);
    }, 300);
  };

  // Format name properly
  const displayName = displayUser.name || `${displayUser.first_name || ''} ${displayUser.last_name || ''}`.trim();

  // Check if current user is admin or team leader
  const canViewProfile = userInfo && (userInfo.isAdmin || userInfo.team_leader);

  return (
    <div
      className=""
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 py-3 px-3">
        <div className="flex items-center mb-2">
          {/* Avatar - smaller size */}
          {displayUser.profile_picture || displayUser.image || displayUser.profilePic ? (
            <img
              src={getProfileImage(displayUser)}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover mr-2"
            />
          ) : (
            <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full mr-2">
              <span className="text-gray-700 font-medium text-xs">
                {intialLetterName(displayUser.first_name, displayUser.last_name, displayUser.name)}
              </span>
            </div>
          )}

          {/* Role labels with wrapping - smaller */}
          <div className="flex flex-wrap gap-1">
            <span className="text-gray-700 dark:text-gray-300 text-xs bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              {displayUser.is_client ? "Client" : "Employee"}
            </span>
            {displayUser.isAdmin && (
              <span className="text-gray-700 dark:text-gray-300 text-xs bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">Admin</span>
            )}
            {displayUser.team_leader && (
              <span className="text-gray-700 dark:text-gray-300 text-xs bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">TL</span>
            )}
          </div>
        </div>

        {/* Full Name - new field */}
        <div className="flex items-center mb-2">
          <Icon icon="heroicons:user" className="text-sm mr-1.5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium dark:text-white">
            {displayName}
          </span>
        </div>

        {/* Email - smaller */}
        <div className="flex items-center mb-3 text-gray-600 dark:text-gray-400">
          <Icon icon="heroicons:envelope-solid" className="text-xs mr-1.5" />
          <span className="text-xs truncate">
            {displayUser.email}
          </span>
        </div>

        {/* Additional Info - Only show if available */}
        {displayUser.designation && (
          <div className="flex items-center mb-2 text-gray-600 dark:text-gray-400">
            <Icon icon="heroicons:briefcase" className="text-xs mr-1.5" />
            <span className="text-xs truncate">{displayUser.designation}</span>
          </div>
        )}


        {/* View Profile Button - only visible to admins and team leaders */}
        {canViewProfile && (
          <Link
            to={`/profile/${displayUser._id || displayUser.value}`}
            className="block"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="flex items-center justify-center text-xs w-full py-1.5 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              <Icon icon="heroicons:user" className="mr-1.5 text-xs" />
              View Profile
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProfileHoverCard; 