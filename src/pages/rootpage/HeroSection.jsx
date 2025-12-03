

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { djangoBaseURL } from "@/helper";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { fetchAuthGET, fetchAuthPost } from "@/store/api/apiSlice";
import { login, token } from "@/store/api/auth/authSlice";
import CompanyAskStep from "./CompanyAskStep";

// Direct imports instead of lazy loading for critical images

import madeinindia from "./images/made-india-icon.webp";
import googleIcon from "./images/google-icon.webp";
import easyToUse from "../../assets/images/icons/easy_to_use.svg";
import automatedReports from "../../assets/images/icons/automated_reports.svg";


const HeroSection = () => {
  // const [email, setEmail] = useState("");
  // const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState([]);
  const [loginCredentials, setLoginCredentials] = useState(null);
  const [loginType, setLoginType] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Removed validateEmail function

  // Removed handleEmailSubmit function

  // Send welcome email
  const sendWelcomeMail = async (data) => {
    try {
      await fetchAuthPost(`${djangoBaseURL}/welcome/admin/`, {
        body: {
          companyId: data.user.companyId,
          email: data.user.email,
          userName: data.user.name,
        },
      });
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  };

  // Get redirect path based on user role
  const getRedirectPath = (role) => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");
    if (redirectPath) {
      return redirectPath;
    } else if (role === "client") {
      return "/client/dashboard";
    } else if (role === "employee") {
      return "/tasks";
    }
    return "/welcome?status=new";
  };

  // Configure the Google login hook
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (googleLoading) return;
      setGoogleLoading(true);
      setLoginType("google");

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

              navigate("/welcome?status=new", { state: { showWelcome: true } });
              setTimeout(() => {
                sendWelcomeMail(userLogin);
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
          const loginResponse = await fetchAuthPost(
            `${djangoBaseURL}/api/google-userlogin/`,
            {
              body: {
                email: profile.email,
                token: tokenResponse.access_token,
              },
            }
          );

          if (loginResponse.status === 1) {
            // Single matching account
            toast.success("Logged in with Google successfully");
            dispatch(token(loginResponse.token));
            delete loginResponse?.user?.password;
            dispatch(login(loginResponse.user));

            const redirectPath = getRedirectPath(loginResponse?.user?.user_type);
            if (redirectPath === "/welcome?status=new") {
              setTimeout(() => {
                sendWelcomeMail(loginResponse);
              }, 3000);
            }
            setTimeout(() => navigate(redirectPath), 800);
          } else if (loginResponse.status === 2) {
            // Multiple accounts - show company selection
            setAccounts(loginResponse.accounts);
            setLoginCredentials(tokenResponse?.access_token);
            setStep(2);
          } else {
            // status = 0 => Error, e.g. user not found, account inactive

            toast.error(loginResponse.message || "Google login failed");
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

  const closeFullScreen = () => {
    setIsFullScreen(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  if (step === 2) {
    return (
      <CompanyAskStep
        accounts={accounts}
        loginCredentials={loginCredentials}
        loginType={loginType}
      />
    );
  }

  return (
    <div className="newHeroSection-main flex flex-col lg:flex-row gap-6 lg:gap-12 justify-between p-4 max-w-[1400px] w-full mx-auto md:mt-16 px-[30px] pt-[55px] lg:px-[20px]">
      <div className="md:w-[60%] md:mr-8 flex flex-col">
        <p className="text-[18px] text-black mb-[5px] dark:text-slate-800 font-semibold highlightText">
          Task Management Made Simple
        </p>

        <h1
          className="text-4xl md:text-5xl font-extrabold mb-4 leading-[30px] lg:leading-[55px] text-left dark:text-black-500"
          style={{ display: "block", opacity: 1 }}
        >
          <span className="highlightText">Track Tasks with Automatic</span>{" "}
          Screenshots & Time Tracking
        </h1>

        <p className="lg:text-[20px] md:text-[16px] mb-[15px] dark:text-slate-800">
          Boost productivity with automatic time tracking, task management, and
          screenshot monitoring in one powerful platform.
        </p>
        <div className="mt-6 w-full max-w-sm">
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            aria-label="Sign up with Google"
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-medium rounded-full px-5 py-2.5 hover:bg-gray-100 transition-all border-2 border-solid border-gray-300"
          >
            <img
              src={googleIcon}
              alt="Google Logo"
              className="w-5 h-5"
              width="32"
              height="32"
              fetchpriority="high"
            />
            Sign Up With Google
          </button>

          <div className="flex items-center text-center my-4">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="px-2 text-xs text-gray-500">OR</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          <button
            onClick={() => navigate("/register")}
            className="w-full bg-black-500 text-white font-medium rounded-full px-5 py-2.5 hover:bg-gray-800 transition-all"
          >
            Get Started for free
          </button>
        </div>

        <p className="text-xs dark:text-black-500 mt-4">
          Try all features for free. No credit card required.
        </p>

        <div className="flex flex-wrap justify-center space-x-0 md:space-y-0 md:space-x-4 mt-4 gap-3">
          <div className="flex items-center space-x-2 bg-gray-200 rounded-full px-4 py-2 m-0">
            <img
              src={madeinindia || "/placeholder.svg"}
              alt="Made in India"
              width="30"
              height="30"
              fetchpriority="high"
            />
            <span className="text-gray-700 text-sm font-semibold">
              Made In India
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-gray-200 rounded-full px-4 py-2 m-0">
            <img
              src={easyToUse || "/placeholder.svg"}
              alt="Easy to use"
              width="20"
              height="20"
              fetchpriority="high"
            />
            <span className="text-gray-700 text-sm font-semibold">
              Easy to use
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-gray-200 rounded-full px-4 py-2 m-0">
            <img
              src={automatedReports || "/placeholder.svg"}
              alt="Automated reports"
              width="20"
              height="20"
              fetchpriority="high"
            />
            <span className="text-gray-700 text-sm font-semibold">
              Improve Productivity
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          boxSizing: "content-box",
          maxHeight: "80vh",
          width: "100%",
          aspectRatio: "2.1068032187271397",
          padding: "40px 0 40px 0",
        }}
      >
        <iframe
          src="https://app.supademo.com/embed/cm9hz500o2088ljv5p6h312vm?embed_v=2"
          loading="lazy"
          title="Dyzo Demo"
          allow="clipboard-write"
          frameBorder="0"
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
          allowFullScreen
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        ></iframe>
      </div>

      <div id="googleSignInButton" style={{ display: "none" }}></div>
    </div>
  );
};

export default HeroSection;
