import React, { useState, useRef, useEffect } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchAuthPost, fetchPOST } from "@/store/api/apiSlice";
import OneSignal from 'react-onesignal';
import { login, token } from "@/store/api/auth/authSlice";
import Cookies from "js-cookie";
import InputGroup from "@/components/ui/InputGroup";
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { djangoBaseURL } from "@/helper";
import { setTokens } from "@/utils/authToken";

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup.string().required("Password is required"),
  })
  .required();

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const passwordRef = useRef(null);
  const baseUrl = import.meta.env.VITE_APP_DJANGO;
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
    mode: "onChange",
  });

  const getRedirectPath = (role) => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    if (redirectPath) {
      return redirectPath;
    } else if (role === "client") {
      return "/tasks";
    } else if (role === "employee") {
      return "/tasks";
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetchPOST(`${baseUrl}/login/`, { body: data });
      if (response.status) {
        toast.success(response.message);
        let userId = response?.user?._id ? response?.user?._id : '';
        OneSignal.User.addTag("userId", String(userId));
        OneSignal.User.addTag("companyId", String(response?.user?.companyId));
        OneSignal.User.addTag("app_type", "task");

        // Store tokens using new token management system
        if (response.access_token && response.refresh_token) {
          setTokens(response.access_token, response.refresh_token);
        } else if (response.token) {
          // Fallback for old token format
          dispatch(token(response.token));
        }

        delete response?.user?.password;
        dispatch(login(response.user));
        const redirectPath = getRedirectPath(response?.user?.user_type);
        setTimeout(() => { navigate(redirectPath) }, 800);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const WelcomeMail = async (data) => {
    try {
      await fetchAuthPost(`${djangoBaseURL}/welcome/admin/`, {
        body: {
          companyId: data.user.companyId,
          email: data.user.email,
          userName: data.user.name,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (googleLoading) return; // Prevent multiple requests
      setGoogleLoading(true);
      try {
        // Step 1: Fetch user info from Google
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
              Accept: "application/json",
            },
          }
        );
        const profile = await userInfoResponse.json();

        // Step 2: Attempt to create account
        const generatedPassword = Math.random().toString(36).slice(-8);
        const emailPrefix = profile.email.split("@")[0];
        const companyName = `${emailPrefix}'s Company`;

        try {
          const createCompany = await fetchAuthPost(
            `${djangoBaseURL}/api/create-company-and-employee/`,
            {
              body: {
                company_name: companyName,
                email: profile.email,
                password: generatedPassword,
              },
            }
          );

          if (createCompany.status) {
            // Account created successfully, attempt login
            const userLogin = await fetchAuthPost(`${djangoBaseURL}/login/`, {
              body: { email: profile.email, password: generatedPassword },
            });

            if (userLogin.status) {
              toast.success("Logged in with Google successfully");
              dispatch(token(userLogin.token));
              delete userLogin?.user?.password;
              dispatch(login(userLogin.user));

              setTimeout(() => {
                WelcomeMail(userLogin);
                navigate("/welcome?status=new", { state: { showWelcome: true } });
              }, 3000);
            } else {
              toast.error("Login failed after Google account creation. Please try again.");
              setTimeout(() => navigate("/login"), 1000);
            }
          } else {
            throw new Error("Account creation failed.");
          }
        } catch (error) {
          // Step 3: Handle duplicate account error by logging in the user
          const loginResponse = await fetchAuthPost(`${djangoBaseURL}/api/google-userlogin/`, {
            body: {
              email: profile.email,
              token: tokenResponse.access_token,
            },
          });

          if (loginResponse.status) {
            toast.success("Logged in with Google successfully");
            dispatch(token(loginResponse.token));
            delete loginResponse?.user?.password;
            dispatch(login(loginResponse.user));

            const redirectPath = getRedirectPath(loginResponse?.user?.user_type);
            setTimeout(() => navigate(redirectPath), 800);
          } else {
            toast.error("No account found with this Google email. Please sign up first.");
          }
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

  useEffect(() => {
    let token = Cookies.get('userToken');
    if (token && userInfo) {
      const redirectPath = getRedirectPath(userInfo?.user_type);
      navigate(redirectPath);
    }
  }, [navigate, userInfo]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Textinput
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        register={register}
        error={errors.email}
        className="h-[48px]"
        autoComplete="on"
      />
      <InputGroup
        name="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        register={register}
        error={errors.password}
        className="h-[48px]"
        append={
          <Button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
            className="btn-outline"
          />
        }
        inputRef={passwordRef}
        onKeyDown={(event) => event.key === 'Enter' && handleSubmit(onSubmit)()}
      />
      <div className="flex justify-end items-center gap-4 mt-2">
        <Link
          to="/forgot-password"
          className="text-sm text-slate-800 dark:text-slate-400 font-medium underline hover:text-blue-500 transition-colors"
        >
          Forgot Password?
        </Link>
        <span className="h-4 border-l border-gray-300 mx-2"></span>
        <Link
          to="/email-otp-login"
          className="text-sm text-blue-600 font-medium underline hover:text-blue-800 transition-colors"
        >
          Login via Email Verification
        </Link>
      </div>

      <Button
        type="submit"
        text="Sign in"
        className="btn btn-dark block w-full text-center"
        isLoading={isLoading}
        disabled={isLoading}
      />

      <div className="mt-5 flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => toast.error("Google login failed")}
          render={(renderProps) => (
            <button
              onClick={renderProps.onClick}
              disabled={renderProps.disabled || googleLoading}
              className="flex items-center border rounded-lg px-5 py-2 hover:shadow-md"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
                alt="Google"
                className="h-5 w-5 mr-2"
              />
              Continue with Google
            </button>
          )}
        />
      </div>
    </form>
  );
};

export default LoginForm;
