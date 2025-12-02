import axios from 'axios';
import { getAuthToken, getRefreshToken, setTokens, clearTokens, updateAccessToken } from './authToken';
import Cookies from 'js-cookie';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_APP_DJANGO,
    withCredentials: true, // Important: Include cookies in requests
});

/**
 * Complete logout function - Clears all tokens, cookies, and storage
 * Use this when user needs to be completely logged out
 */
const performCompleteLogout = () => {
    console.warn('🚪 Performing complete logout due to invalid/missing token');

    // Clear all authentication tokens
    clearTokens();

    // Clear user info cookies
    Cookies.remove('userInfo');
    Cookies.remove('userToken');

    // Clear all localStorage items
    localStorage.clear();

    // Clear session storage
    sessionStorage.clear();

    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request interceptor - Add auth headers to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = getAuthToken();
        const refreshToken = getRefreshToken();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Add refresh token header (middleware can use either header or cookie)
        if (refreshToken) {
            config.headers['X-Refresh-Token'] = refreshToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
    async (response) => {
        // ⚠️ CRITICAL: Check if response has status: 3 (unauthorized/missing token)
        // This indicates the user needs to be completely logged out
        if (response.data?.status === 3) {
            console.error('❌ API returned status 3:', response.data);
            performCompleteLogout();
            return Promise.reject(new Error(response.data?.message || 'Authorization failed'));
        }

        // Check if middleware generated a new access token in headers
        // Note: Middleware generates ONLY access token, not refresh token
        const newAccessTokenHeader = response.headers['x-new-access-token'];

        // Also check if API sent new access token in response body
        const newAccessTokenBody = response.data?.access_token;
        const isTokenRefreshResponse = newAccessTokenBody && response.data?.status === 1 && response.data?.message?.includes('access token');

        if (newAccessTokenHeader) {
            // Only update access token, refresh token remains the same
            updateAccessToken(newAccessTokenHeader);
        } else if (isTokenRefreshResponse) {
            // Update access token when API sends it in response body
            updateAccessToken(newAccessTokenBody);

            // This is a token refresh response, we need to retry the original request
            const originalRequest = response.config;
            if (!originalRequest._tokenRetried) {
                originalRequest._tokenRetried = true;
                originalRequest.headers.Authorization = `Bearer ${newAccessTokenBody}`;
                // Retry the request with the new token
                return axiosInstance(originalRequest);
            }
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // ⚠️ CRITICAL: Check if error response has status: 3 (unauthorized/missing token)
        if (error.response?.data?.status === 3) {
            console.error('❌ API returned status 3 in error response:', error.response.data);
            performCompleteLogout();
            return Promise.reject(error);
        }

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {

            // Check if the error is due to token expiration
            const errorData = error.response?.data;
            const isTokenExpired =
                errorData?.error_code === 'TOKEN_EXPIRED_NO_REFRESH' ||
                errorData?.error_code === 'INVALID_ACCESS_TOKEN' ||
                errorData?.error_code === 'ACCESS_TOKEN_DECODE_FAILED' ||
                errorData?.error_code === 'NO_ACCESS_TOKEN' ||
                errorData?.message?.includes('expired') ||
                errorData?.message?.includes('Invalid token') ||
                errorData?.message?.includes('Authorization header missing');

            if (!isTokenExpired) {
                // If it's not a token issue, just reject
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();

            if (!refreshToken) {
                console.error('❌ No refresh token available');
                isRefreshing = false;
                performCompleteLogout();
                return Promise.reject(error);
            }

            try {
                // Fallback: Try dedicated refresh endpoint
                // Note: Middleware should handle most cases automatically
                const response = await axios.post(
                    `${import.meta.env.VITE_APP_DJANGO}/refresh-token/`,
                    {},
                    {
                        headers: {
                            'X-Refresh-Token': refreshToken,
                        },
                        withCredentials: true,
                    }
                );

                if (response.data.status === 1 && response.data.access_token) {
                    const { access_token, refresh_token } = response.data;

                    // Update both tokens if backend provides them, otherwise keep existing refresh token
                    setTokens(access_token, refresh_token || refreshToken);

                    // Update the authorization header and retry
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;

                    processQueue(null, access_token);
                    isRefreshing = false;

                    return axiosInstance(originalRequest);
                } else {
                    throw new Error('Token refresh failed');
                }
            } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError);
                processQueue(refreshError, null);
                isRefreshing = false;
                performCompleteLogout();
                return Promise.reject(refreshError);
            }
        }

        // Handle other error codes that require complete logout
        if (error.response?.data?.error_code === 'USER_NOT_FOUND' ||
            error.response?.data?.error_code === 'USER_INACTIVE') {
            console.error('❌ User authentication failed');
            performCompleteLogout();
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;

