import React from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";

export const getUserProfilePicture = (user) => {
  if (!user) {
    return `https://ui-avatars.com/api/?name=User&background=random&size=96`;
  }

  // Check if user is deleted
  const name = user.name || user?.label || "";
  const isDeleted = name.toLowerCase().includes("(deleted)") || user.is_deleted;

  if (isDeleted) {
    // Return a generic user icon for deleted users (grey background, user icon)
    return `https://ui-avatars.com/api/?name=&background=9CA3AF&color=fff&size=96&bold=true&length=1`;
  }

  if (user.profile_picture) {
    return `${import.meta.env.VITE_APP_DJANGO}${user.profile_picture}`;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=96`;
};

export const ProfilePicture = ({
  user,
  userId,
  className = "w-full h-full rounded-full object-cover",
}) => {
  const { users } = useSelector((state) => state.users);

  const getUserFromRedux = () => {
    if (userId && users.length > 0) {
      return users.find(u => u._id == userId || u.value === userId);
    }
    return null;
  };

  // Use userId to get user from Redux, or fallback to user prop
  const userData = getUserFromRedux() || user;
  const isValidImage = (image) => {
    return image &&
      image !== 'null' &&
      !image.includes('null') &&
      image.trim() !== '';
  };

  const getProfileUrl = () => {
    // Check if user is deleted
    const name = userData?.name || userData?.label || "";
    const isDeleted = name.toLowerCase().includes("(deleted)") || userData?.is_deleted;

    if (isDeleted) {
      // Return a generic user icon for deleted users (grey background, no initials)
      return `https://ui-avatars.com/api/?name=&background=9CA3AF&color=fff&size=96&bold=true&length=1`;
    }

    let url = userData?.profile_picture || userData?.image;
    if (isValidImage(url)) {
      // Remove accidental spaces
      url = url.trim();
      // If already an absolute URL, use as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      // Otherwise, add base
      return `${import.meta.env.VITE_APP_DJANGO}${url}`;
    }
    return getUserProfilePicture(userData);
  };

  const profilePicUrl = getProfileUrl();

  // Check if user is deleted to render icon instead of image
  const name = userData?.name || userData?.label || "";
  const isDeleted = name.toLowerCase().includes("(deleted)") || userData?.is_deleted;

  // If user is deleted, render icon instead of image
  if (isDeleted) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-400 dark:bg-slate-600`}>
        <Icon
          icon="heroicons:user-solid"
          className="w-[60%] h-[60%] text-white"
        />
      </div>
    );
  }

  return (
    <img
      src={profilePicUrl}
      alt={userData?.name || "User"}
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        // Check if user is deleted for fallback
        const name = userData?.name || userData?.label || "";
        const isDeleted = name.toLowerCase().includes("(deleted)") || userData?.is_deleted;

        const fallbackUrl = isDeleted
          ? `https://ui-avatars.com/api/?name=&background=9CA3AF&color=fff&size=96&bold=true&length=1`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || "User")}&background=random&size=96`;
        e.target.src = fallbackUrl;
      }}
    />
  );
};
