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
import OneSignal from 'react-onesignal';
import runOneSignal from '../utility/runOnesignal';

// Custom components (replace these with your own)
import Textinput from "@/components/ui/Textinput";
import InputGroup from "@/components/ui/InputGroup";
import Button from "@/components/ui/Button";

// Redux slices, e.g., token & login actions
import { token, login } from "@/store/api/auth/authSlice";

// API helpers
import { fetchPOST, fetchAuthPost } from "@/store/api/apiSlice";
import { djangoBaseURL } from "@/helper";
import { setTokens } from "@/utils/authToken";

import GoogleIcon from "../../assets/images/icons/google-icon.svg";
import dyzoLogo from "../../assets/images/logo/dyzo-web-logo.png";
import CompanyAskStep from "./CompanyAskStep";

// Validation schema
const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is required"),
    // password: yup.string().required("Password is required"),
  })
  .required();

const LoginScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill("")); // For the 6 input boxes
  const inputRefs = useRef([]); // To manage focus between boxes
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [step, setStep] = useState(1);
  const [accounts, setAccountsState] = useState([]);
  const [loginCreds, setLoginCreds] = useState(null);
  const [loginTypeState, setLoginTypeState] = useState('');

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
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });

  // ADD THIS useEffect FOR THE TIMER
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Decide where to go after login based on user_type
  const getRedirectPath = (role, userId = '') => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    if (redirectPath) {
      return redirectPath; // Always use redirect param if present
    } else if (role === "client") {
      return "/tasks";
    } else if (role === "employee") {
      return `/dashboard`;
    }
    // fallback
    return "/";
  };

  // Normal email/password login
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);


      const response = await fetchPOST(`${djangoBaseURL}/login/`, {
        body: data,
      });

  

      if (response.status === 1) {
        toast.success(response.message);
        let userId = response?.user?._id ? response?.user?._id : '';

        await runOneSignal(userId);

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

        // Check for stored notification URL and redirect if present
        const storedUrl = localStorage.getItem('postLoginRedirect');
        if (storedUrl) {
          localStorage.removeItem('postLoginRedirect');
       
          try {
            // Validate URL and redirect
            const target = new URL(storedUrl, window.location.origin);
            if (target.origin === window.location.origin) {
              // Same origin - safe to redirect
              window.location.assign(storedUrl);
            } else {
              // Cross-origin - still allow navigation
              window.location.assign(storedUrl);
            }
            return; // Exit early to prevent default redirect
          } catch (e) {
            console.warn('Invalid stored URL, falling back to default redirect:', e);
          }
        }

        // If single account, redirect
        const redirectPath = getRedirectPath(response?.user?.user_type, response?.user?._id);
        setTimeout(() => {
          navigate(redirectPath);
        }, 800);
      } else if (response.status === 2) {
        // If multiple accounts (the logic you mentioned for multi-accounts)
        setAccountsState(response.accounts);
        setLoginCreds(data);
        setLoginTypeState("normal");
        setStep(2);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };


  // GOOGLE LOGIN - Using new /api/google-userlogin/
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (googleLoading) return;
      setGoogleLoading(true);

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
        if (loginResponse.status === 1) {
          // Single matching account
          toast.success("Logged in with Google successfully");

          const userId = loginResponse?.user?._id || '';
          await runOneSignal(userId);
          OneSignal.User.addTag("userId", String(userId));
          OneSignal.User.addTag("companyId", String(loginResponse?.user?.companyId));
          OneSignal.User.addTag("app_type", "task");

          // Store tokens using new token management system
          if (loginResponse.access_token && loginResponse.refresh_token) {
            setTokens(loginResponse.access_token, loginResponse.refresh_token);
          } else if (loginResponse.token) {
            // Fallback for old token format
            dispatch(token(loginResponse.token));
          }

          delete loginResponse?.user?.password;
          dispatch(login(loginResponse.user));

          // Check for stored notification URL and redirect if present
          const storedUrl = localStorage.getItem('postLoginRedirect');
          if (storedUrl) {
            localStorage.removeItem('postLoginRedirect');
          
            try {
              const target = new URL(storedUrl, window.location.origin);
              if (target.origin === window.location.origin) {
                window.location.assign(storedUrl);
              } else {
                window.location.assign(storedUrl);
              }
              return; // Exit early to prevent default redirect
            } catch (e) {
              console.warn('Invalid stored URL, falling back to default redirect:', e);
            }
          }

          const redirectPath = getRedirectPath(loginResponse?.user_type);
          setTimeout(() => {
            navigate(redirectPath);
          }, 800);
        } else if (loginResponse.status === 2) {
          setAccountsState(loginResponse.accounts);
          setLoginCreds(tokenResponse.access_token);
          setLoginTypeState("google");
          setStep(2);
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

  const handleEmailOtpLogin = (e) => {
    e.preventDefault();
    const email = getValues("email");
    if (!email) {
      toast.error("Please enter your email to continue with OTP login.");
      return;
    }
    navigate(`/email-otp-login?email=${encodeURIComponent(email)}`);
  };

  const handleGetOtp = async (e) => {
    e.preventDefault();
    const isFormValid = await trigger("email"); // Manually trigger validation
    if (!isFormValid) {
      return; // Validation failed, the error will be shown on the input field
    }
    const emailValue = getValues("email");
    if (!emailValue || errors.email) {
      toast.error("Enter a valid email");
      return;
    }
    setOtpLoading(true);
    try {
      const response = await fetchAuthPost(`${djangoBaseURL}/verify-email/`, {
        body: { email: emailValue },
      });
      if (response.status) {
        toast.success(response.message || "OTP sent to your email.");
        setResendTimer(30);
        setOtpMode(true);
        setOtpDigits(Array(6).fill("")); // Clear OTP boxes
        setOtp("");
      } else {
        toast.error(response.message || "Failed to send OTP.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpDigitChange = (value, idx) => {
    if (!/^[0-9]?$/.test(value)) return; // Only allow numbers
    const newOtpDigits = [...otpDigits];
    newOtpDigits[idx] = value;
    setOtpDigits(newOtpDigits);
    setOtp(newOtpDigits.join("")); // Update the final OTP string

    // Move focus to the next box
    if (value && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    // Move focus to the previous box on backspace
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    // Submit on Enter key press
    if (e.key === 'Enter') {
      e.preventDefault();
      handleOtpLogin(e);
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData("text");
    const pastedDigits = pastedData.replace(/\D/g, "").slice(0, 6);
    if (pastedDigits.length === 6) {
      const newDigits = pastedDigits.split("");
      setOtpDigits(newDigits);
      setOtp(newDigits.join(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const emailValue = getValues("email");
      if (!otp || otp.length !== 6) {
        toast.error("Please enter the 6-digit OTP.");
        setIsLoading(false);
        return;
      }
      const response = await fetchAuthPost(`${djangoBaseURL}/otp-login/`, {
        body: { email: emailValue, otp },
      });
      if (response.status === 1) {
        toast.success(response.message);

        const userId = response?.user?._id || '';
        await runOneSignal(userId);
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
        // Check for stored notification URL and redirect if present
        const storedUrl = localStorage.getItem('postLoginRedirect');
      
        if (storedUrl) {
          localStorage.removeItem('postLoginRedirect');
       
          try {
            const target = new URL(storedUrl, window.location.origin);
            if (target.origin === window.location.origin) {
              window.location.assign(storedUrl);
            } else {
              window.location.assign(storedUrl);
            }
            return; // Exit early to prevent default redirect
          } catch (e) {
            console.warn('Invalid stored URL, falling back to default redirect:', e);
          }
        }

        const redirectPath = getRedirectPath(response?.user?.user_type, response?.user?._id);
        setTimeout(() => {
          navigate(redirectPath);
        }, 800);
      } else if (response.status === 2) {
        setAccountsState(response.accounts);
        setLoginCreds({ email: emailValue });
        setLoginTypeState("otp");
        setStep(2);
        return;
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already logged in, redirect
  useEffect(() => {
    let cookieToken = Cookies.get("userToken");
    if (cookieToken && userInfo) {
      const redirectPath = getRedirectPath(userInfo?.user_type);
      navigate(redirectPath);
    }
  }, [navigate, userInfo]);

  if (step === 2) {
    return (
      <CompanyAskStep
        accounts={accounts}
        loginCredentials={loginCreds}
        loginType={loginTypeState}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Top actions */}
      <div className="absolute top-7 left-7 z-50">
        <Link to="/">
          <img src={dyzoLogo} alt="dyzoLogo" className="w-28 sm:w-32" />
        </Link>
      </div>
      <div className="absolute top-9 right-3 sm:right-7 text-sm text-slate-600 z-50">
        <span className="hidden sm:inline font-bold">Don't have an account?</span>
        <Link to="/register" className="sm:ml-2 px-3 sm:px-5 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition">Sign up</Link>
      </div>

      {/* Brand gradient shapes (custom Dyzo style) with wavy effect */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[150%]">
        <svg
          className="absolute bottom-0 left-0 w-full h-full"
          viewBox="0 0 1200 600"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#7A39FF" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path
            d="M0,450 C400,400 800,500 1200,450 L1200,600 L0,600 Z"
            fill="url(#waveGradient)"
          />
        </svg>
        <div className="absolute inset-0 opacity-25 mix-blend-overlay bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1.2px)] [background-size:16px_16px] animate-dots"></div>
      </div>

      {/* Center card */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1120px] items-center justify-center px-3 sm:px-6">
        <div className="w-full max-w-[520px] rounded-2xl border border-slate-100 bg-white/90 p-6 sm:p-8 shadow-xl backdrop-blur">
          <h1 className="mb-1 text-center text-2xl font-bold text-slate-900 sm:text-3xl">Login Here!</h1>
          <div className="mb-3 flex justify-center">
          </div>
          <form onSubmit={otpMode ? handleOtpLogin : handleGetOtp} className="space-y-4 w-full">
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 py-2.5 transition hover:bg-slate-100"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                <div className="flex justify-center items-center gap-2">
                  <img src={GoogleIcon} alt="google" className="w-6" />
                  <span className="text-slate-700">
                    Sign In with Google
                  </span>
                </div>
              </button>
            </div>

            <div className="or-divider my-3 flex items-center">
              <hr className="flex-1 border-slate-200" />
              <span className="mx-2 text-xs text-slate-400">OR</span>
              <hr className="flex-1 border-slate-200" />
            </div>

            {/* Email input always visible */}
            <Textinput
              name="email"
              label="Email"
              classLabel="mb-1 text-slate-700"
              type="email"
              placeholder="Enter your email"
              register={register}
              error={errors.email}
              className="h-[48px] border-neutral-50 rounded-md text-black-500 dark:text-black-500 dark:bg-white"
              autoComplete="on"
              onChange={register("email").onChange}
              disabled={otpMode}
            />

            {/* OTP input only in OTP mode */}
            {otpMode && (
              <div className="mb-2 flex flex-col items-center gap-2">
                <label className="mb-1 block text-slate-700">Enter OTP</label>
                <div className="mb-2 flex justify-center gap-2" onPaste={handlePaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="h-12 w-10 rounded border border-slate-300 text-center text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
                <div className="flex w-full justify-between items-center mt-2">
                  {/* Resend Button */}
                  <button
                    type="button"
                    className={`rounded px-2 py-1 ${otpLoading || resendTimer > 0 ? "cursor-not-allowed bg-transparent text-slate-400" : "bg-indigo-50/60 font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition"} text-sm`}
                    onClick={handleGetOtp}
                    disabled={otpLoading || resendTimer > 0}
                    style={{ background: "none" }}
                  >
                    {otpLoading ? "Sending..." : resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : "Resend OTP"}
                  </button>
                  {/* Back Button */}
                  <button
                    type="button"
                    className="cursor-pointer rounded px-2 py-1 text-indigo-600 hover:text-indigo-700 hover:underline transition text-sm"
                    onClick={() => {
                      setOtpMode(false);
                      setOtpDigits(Array(6).fill(""));
                      setOtp("");
                    }}
                    style={{ background: "none" }}
                  >
                    Change email
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              text="Log In"
              className="btn btn-primary block w-full !h-12 !rounded-lg !bg-indigo-600 hover:!bg-indigo-700 text-center"
              isLoading={isLoading || otpLoading}
              disabled={isLoading || otpLoading}
            />

            <div className="text-center text-xs text-slate-500">By clicking the button above, you agree to our <a href="/terms-and-conditions" className="text-indigo-600 hover:text-indigo-700">Terms of Service</a> and <a href="/privacy-policy" className="text-indigo-600 hover:text-indigo-700">Privacy Policy</a>.</div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;