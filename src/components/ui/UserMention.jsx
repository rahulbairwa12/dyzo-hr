import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProfileCardWrapper from './ProfileCardWrapper';
import { ProfilePicture } from './profilePicture';

const UserMention = ({ userId, displayName }) => {
    const navigate = useNavigate();
    const { users, deletedUserIds } = useSelector((state) => state.users);
    
    // Find user from global users state
    const user = users?.find(u => String(u._id) === String(userId));
    
    // Check if user is deleted
    const isDeleted = deletedUserIds?.includes(Number(userId));
    
    // Get display name: use provided displayName, or get from Redux, or fallback
    let finalDisplayName = displayName;
    if (!finalDisplayName && user) {
        // Try different name fields from user object
        finalDisplayName = user.name || 
                          `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                          user.email || 
                          'Unknown User';
    } else if (!finalDisplayName) {
        finalDisplayName = 'Unknown User';
    }
    
    // Append (deleted) if user is in deleted list
    if (isDeleted && !finalDisplayName.includes('(deleted)')) {
        finalDisplayName = `${finalDisplayName} (deleted)`;
    }
    
    const userForAvatar = user || { _id: userId, name: finalDisplayName };

    // If user is deleted, render without click functionality
    if (isDeleted) {
        return (
            <span
                className="inline-flex items-center z-[10] gap-1 px-1 my-[1px] py-0.5 bg-customPurple-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 align-middle opacity-80"
                title={`${finalDisplayName} - This user has been deleted`}
            >
                <ProfilePicture user={userForAvatar} className="w-4 h-4 rounded-full grayscale" />
                <span className="text-gray-500 dark:text-gray-400">
                    {finalDisplayName}
                </span>
            </span>
        );
    }

    return (
        <ProfileCardWrapper userId={userId}>
            <span
                onClick={() => navigate(`/profile/${userId}`)}
                className="inline-flex items-center z-[10] gap-1 px-1 my-[1px] py-0.5 bg-customPurple-50 rounded cursor-pointer border border-customPurple-100 hover:bg-slate-100 dark:hover:bg-slate-700 align-middle"
                title={finalDisplayName}
            >
                <ProfilePicture user={userForAvatar} className="w-4 h-4 rounded-full" />
                <span className=" text-slate-700 dark:text-slate-300">
                    {finalDisplayName}
                </span>
            </span>
        </ProfileCardWrapper>
    );
};

export default UserMention;
