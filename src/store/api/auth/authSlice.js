import { createSlice } from "@reduxjs/toolkit";
import Cookies from 'js-cookie';
import { clearTokens } from '../../../utils/authToken';

// Load user data from cookie
const loadUserFromCookie = () => {
  const user = Cookies.get('userInfo');
  return user === undefined ? null : JSON.parse(user);
};

// Load user data Token from cookie
const loadUserTokenFromCookie = () => {
  const userToken = Cookies.get('userToken');
  return userToken ? userToken : null;
};

// Load checkStatus check  
const checkStatus = () => {
  const user = Cookies.get('userInfo');
  return user ? true : false;
};

// Save user data to cookie
// const saveUserToCookie = (user) => {
//   Cookies.set('userInfo', JSON.stringify(user), { expires: 7 });
// };

const saveUserToCookie = (user) => {
  const expiresDays = 7;

  // Calculate the expiration date
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + expiresDays);

  // Remove large/unnecessary fields to avoid cookie size limit (4KB)
  const essentialUserData = { ...user };
  delete essentialUserData.user_locations; // Remove locations array which can be very large
  delete essentialUserData.unsubscribe_token; // Not needed for authentication

  // Save essential user info cookie with expiration
  Cookies.set('userInfo', JSON.stringify(essentialUserData), { expires: expiresDays });

  // Save expiration timestamp (UTC string) to localStorage
  localStorage.setItem('userInfoExpires', expireDate.toUTCString());

  // Store full user data in localStorage for components that might need it
  localStorage.setItem('fullUserInfo', JSON.stringify(user));
};

// Save user token to cookie
const saveUserTokenCookie = (token) => {
  Cookies.set('userToken', token, { expires: 7 });
};

const initialState = {
  loggedIn: checkStatus(),
  user: loadUserFromCookie(),
  userToken: loadUserTokenFromCookie()
};


export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.loggedIn = true;
      state.user = action.payload;
      saveUserToCookie(action.payload);
    },
    update: (state, action) => {
      state.loggedIn = true;
      state.user = action.payload;
      saveUserToCookie(action.payload);
    },
    token: (state, action) => {
      state.loggedIn = true;
      state.userToken = action.payload;
      saveUserTokenCookie(action.payload);
    },
    logout: (state) => {
      state.loggedIn = false;
      state.user = null;
      state.userToken = null;

      // Clear all authentication tokens (access_token, refresh_token, etc.)
      clearTokens();

      // Clear user info cookies
      Cookies.remove('userInfo');

      // Clear all localStorage items
      localStorage.clear();

      // Clear session storage
      sessionStorage.clear();
    },
  },
});

export const { login, token, logout, update } = authSlice.actions;
export default authSlice.reducer;
