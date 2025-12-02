import Cookies from "js-cookie";

// Backend URL
export const djangoBaseURL = import.meta.env.VITE_APP_DJANGO;

// Check login user is admin or not
export const isAdmin = () => {
  const userInfoString = Cookies.get("userInfo");
  if (!userInfoString) {
    return false;
  }
  try {
    const userInfo = JSON.parse(userInfoString);
    return userInfo?.isAdmin || false;
  } catch (error) {
    return false;
  }
};

// Function to get the user Full Name
export const getFullName = (user) => {
  if (!user) return "No User";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else {
    return `${user.name}`;
  }
};

// Function to get user image

// Function to get full user info (including user_locations)
// Use this when you need the complete user object with all fields
export const getFullUserInfo = () => {
  try {
    const fullUserInfo = localStorage.getItem('fullUserInfo');
    if (fullUserInfo && fullUserInfo !== 'undefined') {
      return JSON.parse(fullUserInfo);
    }
    // Fallback to cookie data if localStorage doesn't have full info
    const userInfoString = Cookies.get("userInfo");
    if (userInfoString && userInfoString !== 'undefined') {
      return JSON.parse(userInfoString);
    }
    return null;
  } catch (error) {
    console.error('Error getting full user info:', error);
    return null;
  }
};

// Export helper functions
export { intialLetterName, generateInitialsAvatar, formatDateToDayMonthYear } from "./helper";
