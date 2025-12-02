import Cookies from 'js-cookie';

/**
 * Get access token from localStorage
 * @returns {string|null} The access token or null if not found
 */
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Get refresh token from cookie
 * @returns {string|null} The refresh token or null if not found
 */
export const getRefreshToken = () => {
  return Cookies.get('refresh_token');
};

/**
 * Get authentication token (access token) from storage
 * Priority: localStorage (access_token) -> Cookies (userToken) -> localStorage (token)
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  // Primary: access token from localStorage
  const accessToken = getAccessToken();
  if (accessToken) {
    return accessToken;
  }

  // Fallback to old cookie-based token for backward compatibility
  const cookieToken = Cookies.get('userToken');
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to old localStorage token
  const localToken = localStorage.getItem('token');
  if (localToken) {
    return localToken;
  }

  return null;
};

/**
 * Store access token in localStorage
 * @param {string} token - The access token to store
 */
export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

/**
 * Store refresh token in HTTP-only cookie (via backend)
 * Note: This is primarily set by the backend, but we can also set it client-side if needed
 * @param {string} token - The refresh token to store
 */
export const setRefreshToken = (token) => {
  if (token) {
    // Set cookie with secure options
    Cookies.set('refresh_token', token, {
      expires: 2 * 365, // 7 days
      secure: window.location.protocol === 'https:', // Only send over HTTPS in production
      sameSite: 'Lax', // CSRF protection
    });
  } else {
    Cookies.remove('refresh_token');
  }
};

/**
 * Store both access and refresh tokens
 * @param {string} accessToken - The access token
 * @param {string} refreshToken - The refresh token (optional)
 */
export const setTokens = (accessToken, refreshToken) => {
  setAccessToken(accessToken);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
};

/**
 * Update only the access token (used when middleware generates new access token)
 * @param {string} accessToken - The new access token
 */
export const updateAccessToken = (accessToken) => {
  setAccessToken(accessToken);
};

/**
 * Clear all authentication tokens and user info
 */
export const clearTokens = () => {
  // Clear new token system
  localStorage.removeItem('access_token');
  Cookies.remove('refresh_token');

  // Clear old tokens for backward compatibility
  localStorage.removeItem('token');
  localStorage.removeItem('userToken');
  Cookies.remove('userToken');

  // Also clear user info cookie to prevent auto-login
  Cookies.remove('userInfo');
};

/**
 * Get authorization header object for API requests
 * @returns {Object} Headers object with Authorization bearer token
 */
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get full headers including refresh token for API requests
 * @returns {Object} Headers object with Authorization and X-Refresh-Token
 */
export const getAuthHeaders = () => {
  const accessToken = getAuthToken();
  const refreshToken = getRefreshToken();

  const headers = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (refreshToken) {
    headers['X-Refresh-Token'] = refreshToken;
  }

  return headers;
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} True if token exists, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

