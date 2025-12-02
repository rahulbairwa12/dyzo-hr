// client/src/screens/LoginScreen.jsx
import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useGoogleLogin } from "@react-oauth/google";
import Cookies from "js-cookie";

// Custom components (replace these with your own)
import Textinput from "@/components/ui/Textinput";
import InputGroup from "@/components/ui/InputGroup";
import Button from "@/components/ui/Button";

// Redux slices, e.g., token & login actions
import { token, login } from "@/store/api/auth/authSlice";

// API helpers
import { fetchPOST, fetchAuthPost } from "@/store/api/apiSlice";
import { djangoBaseURL } from "@/helper";

import GoogleIcon from "../../assets/images/icons/google-icon.svg";
import dyzoLogo from "../../assets/images/logo/dyzoLogo.svg";

// Validation schema
const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().required("Password is required"),
  })
  .required();

const SlackLoginScreen = ({
  handleUpdateStepCount,
  setAccounts,
  setLoginCredentials,
  setLoginType,
  slackCode
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = useSelector((state) => state.auth.user);

  const {
    register,
    formState: { errors },
    handleSubmit,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  // Decide where to go after login based on user_type
  const getRedirectPath = (role, userId='') => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    if (redirectPath) {
      return redirectPath; // e.g. yoursite.com/login?redirect=/somewhere
    } else if (role === "client") {
      return "/tasks";
    } else if (role === "employee") {
      return `/tasks?userId=${userId}`;
    }
    // fallback
    return "/";
  };

  const callSlackOAuthCallback = async (userData) => {
    try {
      const payload = {
        ...userData,
        code: slackCode,  // include the Slack code in the payload
      };
      const callbackResponse = await fetchPOST(`https://api.dyzo.ai/slack/oauth/callback/?code=${slackCode}`, {
        body: payload,
      });
      if(callbackResponse.status == 1) {
        
        toast.success(callbackResponse.message);
        setTimeout(() => {
          navigate("/slack/SlackIntegrationsSuccess");
        }, 800);
      }else{
        toast.error(callbackResponse.message);
        toast.error("Try again because token is expired");
        setTimeout(() => {
          navigate("/slack/SlackIntegrationsError");
        }, 800);
      }
      // You may choose to do something with the callbackResponse if needed.
    } catch (error) {
      console.error("Error in Slack OAuth callback", error);
    }
  };



  // Normal email/password login
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setLoginType("normal");
      // Suppose your Django endpoint for email/password is /userlogin/
      const response = await fetchPOST(`${djangoBaseURL}/userlogin/`, {
        body: data,
      });
      if (response.status === 1) {
        toast.success(response.message);
        if(slackCode) {
          await callSlackOAuthCallback(response.user);
        }

        // Tag user for OneSignal (optional)
        let userId = response?.user?._id || "";
        // OneSignal.User.addTag("userId", String(userId));

        // Store tokens
        // localStorage.setItem("token", response.token);
        // dispatch(token(response.token));

        // delete response?.user?.password;
        // dispatch(login(response.user));

        // If single account, redirect
        // const redirectPath = getRedirectPath(response?.user?.user_type, response?.user?._id);
        // setTimeout(() => {
        //   navigate(redirectPath);
        // }, 800);
      } else if (response.status === 2) {
        // If multiple accounts (the logic you mentioned for multi-accounts)
        setAccounts(response.accounts);
        setLoginCredentials(data);
        handleUpdateStepCount(2);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // GOOGLE LOGIN - Using new /api/google-userlogin/
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (googleLoading) return;
      setGoogleLoading(true);
      setLoginType("google");
      try {
        // 1. Call the new GoogleUserLoginAPIView once
        const loginResponse = await fetchAuthPost(
          `${djangoBaseURL}/api/google-userlogin/`,
          {
            body: {
              token: tokenResponse.access_token,
            },
          }
        );


        // 2. Check response status
        if (loginResponse.status == 1) {
          // Single matching account
          toast.success("Logged in with Google successfully");
          if(slackCode) {
            await callSlackOAuthCallback(loginResponse.user);
          }

          // localStorage.setItem("token", loginResponse.token);
          // dispatch(token(loginResponse.token));

          // delete loginResponse?.user?.password;
          // dispatch(login(loginResponse.user));

          // const redirectPath = getRedirectPath(loginResponse?.user_type);
          // setTimeout(() => {
          //   navigate(redirectPath);
          // }, 800);
        } else if (loginResponse.status === 2) {
          // Multiple accounts found. The API returns an array of possible accounts:
          // e.g. loginResponse.accounts = [ { user_type: 'employee', company_name: 'X', company_id: 1 }, { ... } ]
          // toast.info("Multiple accounts found. Please select one.");

          // Option 1: Show a modal or a new screen to choose user_type + company_id
          // Option 2: Hard-code or store them in state if you want.
          setAccounts(loginResponse.accounts);
          setLoginCredentials(tokenResponse?.access_token);
          handleUpdateStepCount(2);
          // For example, you could show a dropdown to pick which account to use.
          // Then call the same endpoint with token + user_type + company_id.
        } else {
          // status = 0 => Error, e.g. user not found, account inactive
          toast.error(loginResponse.message || "Google login failed");
        }
      } catch (err) {
        console.error("Google login error:", err);
        toast.error("An error occurred during Google login.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      toast.error("Google login failed");
      setGoogleLoading(false);
    },
  });

  // If user is already logged in, redirect
  // useEffect(() => {
  //   let cookieToken = Cookies.get("userToken");
  //   if (cookieToken && userInfo) {
  //     const redirectPath = getRedirectPath(userInfo?.user_type);
  //     navigate(redirectPath);
  //   }
  // }, [navigate, userInfo]);

  return (
    <div className="min-h-screen flex flex-col lg:items-center justify-center bg-[#f9faff] py-10">
      {/* Login Box */}
      <div className="w-full max-w-[1200px] bg-white shadow-sm rounded-md flex flex-col lg:flex-row gap-5 md:px-20 md:py-10 px-2 md:mx-6">
        {/* Left Section */}
        <div className="flex w-full md:w-1/2">
          <div>
            <Link to="/">
              <img src={dyzoLogo} alt="dyzoLogo" className="w-[12.5rem]" />
            </Link>
            <h3 className="text-2xl md:text-3xl font-semibold text-center lg:text-left pt-6 lg:pt-10 dark:text-black-500">
              Step Into Productivity
            </h3>
          </div>
        </div>
        {/* Right Section */}
        <div className="flex-1 flex flex-col justify-center">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <button
                type="button"
                className="flex justify-center items-center gap-4 w-full border rounded-md bg-[#f3f3f3] py-2"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                <div className="flex justify-center items-center gap-2">
                  <img src={GoogleIcon} alt="google" className="w-8 mx-auto" />
                  <span className="dark:text-black-500">
                    Sign In with Google
                  </span>
                </div>
              </button>
            </div>

            <div className="or-divider">
              <hr className="line" />
              <span className="or-text">OR</span>
              <hr className="line" />
            </div>

            <Textinput
              name="email"
              label="Email"
              classLabel="dark:text-black-500 mb-2"
              type="email"
              placeholder="Enter your email"
              register={register}
              error={errors.email}
              className="h-[48px] dark:text-black-500 dark:bg-white"
              autoComplete="on"
              onChange={(e) => {
                trigger("email");
                register("email").onChange(e);
              }}
            />

            <InputGroup
              name="password"
              label="Password"
              classLabel="dark:text-black-500 mb-2"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              register={register}
              onChange={(e) => {
                trigger("password");
                register("password").onChange(e);
              }}
              error={errors.password}
              className="h-[48px] text-black-500 dark:text-black-500 dark:bg-white"
              append={
                <Button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
                  className="btn-outline dark:text-black-500 dark:bg-white"
                />
              }
              inputRef={passwordRef}
              onKeyDown={(event) =>
                event.key === "Enter" && handleSubmit(onSubmit)()
              }
            />



            <Button
              type="submit"
              text="Sign in"
              className="btn btn-primary block w-full text-center"
              isLoading={isLoading}
              disabled={isLoading}
            />

          </form>
        </div>
      </div>
    </div>
  );
};

export default SlackLoginScreen;
