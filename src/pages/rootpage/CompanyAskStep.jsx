import { djangoBaseURL } from '@/helper';
import { fetchPOST } from '@/store/api/apiSlice';
import { login, token } from '@/store/api/auth/authSlice';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CompanyAskStep = ({ accounts, loginCredentials, loginType }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getRedirectPath = (role) => {
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get('redirect');
    if (redirectPath) {
      return redirectPath;
    }
    return role === 'client' ? '/client/dashboard' : '/tasks';
  };

  const handleSelection = async (company) => {
    // Merge the selected company info with the login credentials.
    const payload = { ...company, ...loginCredentials };
    let response;
    try {
      if (loginType === 'normal') {
        response = await fetchPOST(`${djangoBaseURL}/userlogin/`, { body: payload });
      } else {
        response = await fetchPOST(`${djangoBaseURL}/api/google-userlogin/`, {
          body: { token: loginCredentials, ...payload },
        });
      }

      if (response.status === 1) {
        toast.success(response.message);

        // Store token and user info
        dispatch(token(response.token));
        delete response?.user?.password; // Avoid storing sensitive info
        dispatch(login(response.user));

        // Redirect
        const redirectPath = getRedirectPath(response?.user?.user_type);
        setTimeout(() => navigate(redirectPath), 800);
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