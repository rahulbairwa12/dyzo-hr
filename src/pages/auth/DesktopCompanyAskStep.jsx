import { djangoBaseURL } from '@/helper';
import { fetchPOST } from '@/store/api/apiSlice';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const DesktopCompanyAskStep = ({ accounts, loginCredentials, loginType }) => {
  const navigate = useNavigate();

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
        navigate("/desktop-login-success");

        // Only keep needed attributes using destructuring
        const {
          salary, country_code, mailVerification, is_client, created_date, last_modification_date,
          fav_employees, fav_projects, date_of_birth, date_of_joining, admin_ids,
          isDeleted, gender, isSuperAdmin, resetPasswordLink, getEmail, ...restUser
        } = response.user || {};

        // Use restUser in cleaned user object
        const dataForDesktop = {
          ...response,
          user: restUser
        };

        // (Optional) Also delete unwanted top-level fields if needed, for extra safety
        delete dataForDesktop.permissions;
        delete dataForDesktop.salary;
        delete dataForDesktop.country_code;
        // ...repeat for other top-level fields if they exist

        // Encode for deeplink
        const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(dataForDesktop))));
        window.location.href = `dyzo-fiddle://login?data=${encodedData}`;
      } else {
        toast.error(response.message);
        navigate("/desktop-login-failed");
      }
    } catch (error) {
      console.error("Company selection error:", error);
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

export default DesktopCompanyAskStep;