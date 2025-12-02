import { djangoBaseURL } from '@/helper';
import { fetchPOST } from '@/store/api/apiSlice';
import { login, token } from '@/store/authReducer';
import React, { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const SlackCompanyAskStep = ({ accounts, loginCredentials, loginType, slackCode }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const getRedirectPath = (role) => {
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("redirect");
    if (redirectPath) {
      return redirectPath;
    }
    return role === "client" ? "/tasks" : "/tasks";
  };

  const callSlackOAuthCallback = async (userData) => {
    try {
      const payload = {
        ...userData,
        code: slackCode,
      };
      const callbackResponse = await fetchPOST(`https://api.dyzo.ai/slack/oauth/callback/?code=${slackCode}`, {
        body: payload,
      });
      if (callbackResponse.status === 1) {
        toast.success(callbackResponse.message);
        setTimeout(() => {
          navigate("/slack/SlackIntegrationsSuccess");
        }, 800);
      } else {
        toast.error(callbackResponse.message);
        toast.error("Try again because token is expired");
        setTimeout(() => {
          navigate("/slack/SlackIntegrationsError");
        }, 800);
      }
    } catch (error) {
      console.error("Error in Slack OAuth callback", error);
    }
  };

  const handleSelection = async (company) => {
    const payload = { ...company, ...loginCredentials };
    let response;
    try {
      if (loginType === 'normal') {
        response = await fetchPOST(`${djangoBaseURL}/userlogin/`, { body: payload });
      } else {
        response = await fetchPOST(`${djangoBaseURL}/api/google-userlogin/`, { 
          body: { token: loginCredentials, ...payload } 
        });
      }

      if (response.status === 1) {
        toast.success(response.message);
        if (slackCode) {
          await callSlackOAuthCallback(response.user);
        }

        const userId = response?.user?._id || '';
        const companyId = response?.user?.companyId || '';

        // Optionally, you can uncomment these lines to set OneSignal tags, store the token, and dispatch login info:
        // OneSignal.User.addTag("userId", String(userId));
        // OneSignal.User.addTag("companyId", String(companyId));
        // localStorage.setItem('token', response.token);
        // dispatch(token(response.token));
        // delete response?.user?.password; // Avoid storing sensitive info
        // dispatch(login(response.user));

        // Optionally, uncomment to redirect after login:
        // const redirectPath = getRedirectPath(response?.user?.user_type);
        // setTimeout(() => navigate(redirectPath), 800);
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
                    ? (account.isAdmin ? 'Admin' : account.user_type)
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

export default SlackCompanyAskStep;
