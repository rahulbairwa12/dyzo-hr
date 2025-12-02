import { djangoBaseURL } from '@/helper';
import { fetchPOST } from '@/store/api/apiSlice';
import { login, token } from '@/store/authReducer';
import React from 'react';
import OneSignal from 'react-onesignal';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import runOneSignal from '../utility/runOnesignal';
import { setTokens } from '@/utils/authToken';

const CompanyAskStep = ({ accounts, loginCredentials, loginType }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectPath = (role) => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get('redirect');
    if (redirectPath) {
      return redirectPath;
    }
    return role === 'client' ? '/tasks' : '/dashboard';
  };

  const handleSelection = async (company) => {
    // Merge the selected company info with the login credentials.
    const payload = { ...company, ...loginCredentials };
    let response;
    try {
      if (loginType === 'normal') {
        response = await fetchPOST(`${djangoBaseURL}/userlogin/`, { body: payload });
      } else if (loginType == 'otp') {
        response = await fetchPOST(`${djangoBaseURL}/token-login/`, {
          body: { token: loginCredentials, ...payload },
        });
      } else {
        response = await fetchPOST(`${djangoBaseURL}/api/google-userlogin/`, {
          body: { token: loginCredentials, ...payload },
        });
      }

      if (response.status === 1) {
        toast.success(response.message);

        const userId = response?.user?._id || '';
        const companyId = response?.user?.companyId || '';

        // Initialize OneSignal with user ID
        await runOneSignal(userId);

        // Set additional OneSignal tags
        OneSignal.User.addTag('companyId', String(companyId));
        OneSignal.User.addTag('app_type', 'task');

        // Store tokens using new token management system
        if (response.access_token && response.refresh_token) {
          setTokens(response.access_token, response.refresh_token);
        } else if (response.token) {
          // Fallback for old token format
          dispatch(token(response.token));
        }

        delete response?.user?.password; // Avoid storing sensitive info
        dispatch(login(response.user));

        // Check for stored notification URL and redirect if present
        // const storedUrl = localStorage.getItem('postLoginRedirect');
        // if (storedUrl) {
        //   localStorage.removeItem('postLoginRedirect');
        //   console.log('Redirecting to stored notification URL after company selection login:', storedUrl);
        //   try {
        //     // Validate URL and redirect
        //     const target = new URL(storedUrl, window.location.origin);
        //     if (target.origin === window.location.origin) {
        //       // Same origin - safe to redirect
        //       window.location.assign(storedUrl);
        //     } else {
        //       // Cross-origin - still allow navigation
        //       window.location.assign(storedUrl);
        //     }
        //     return; // Exit early to prevent default redirect
        //   } catch (e) {
        //     console.warn('Invalid stored URL, falling back to default redirect:', e);
        //   }
        // }

        // Redirect
        const redirectPath = getRedirectPath(response?.user?.user_type);
        navigate(redirectPath, { replace: true });
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center dark:text-black-500">
          Please select the company you want to log in to:
        </h2>
        <ul className="space-y-4">
          {accounts?.map((account, index) => (
            <li key={index}>
              <button
                onClick={() => handleSelection(account)}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <span>{account.company_name}</span>
                <span className="text-sm italic">
                  {account.user_type === 'employee'
                    ? account.isAdmin
                      ? 'Admin'
                      : account.user_type
                    : account.user_type}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CompanyAskStep;
