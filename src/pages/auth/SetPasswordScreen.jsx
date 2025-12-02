import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDispatch } from "react-redux";
import { fetchAuthGET, fetchAuthPost } from "@/store/api/apiSlice";
import { djangoBaseURL } from "@/helper";
import { login, token } from "@/store/api/auth/authSlice";
import Button from "@/components/ui/Button";
import InputGroup from "@/components/ui/InputGroup";
import { toast } from "react-toastify";
import TickIcon from "@/assets/images/icons/tick-right.svg";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import OtpRegisterBox from "./OtpRegisterBox";
import Textinput from "@/components/ui/Textinput";

const schema = yup.object({
  first_name: yup
    .string()
    .required("First Name is required")
    .matches(/^[a-zA-Z\s]*$/, "First Name should contain only letters and spaces")
    .min(2, "First Name must be at least 2 characters"),
  last_name: yup
    .string()
    .matches(/^[a-zA-Z\s]*$/, "Last Name should contain only letters and spaces")
    .nullable(), // <-- Not required
});

const SetPasswordScreen = () => {
  const [loading, setLoading] = useState(false);
  // const [showPassword, setShowPassword] = useState(false); // Hide password toggle
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const email = state?.email || "default@example.com";

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

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    getValues,
    clearErrors,
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onBlur"
  });

  // 30s resend timer effect
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // 1. Validation and 2. Send OTP with { email, first_name, last_name }
  const handleGetOtp = async (e) => {
    e.preventDefault();
    const valid = await trigger(["first_name", "last_name"]);
    if (!valid) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    setOtpLoading(true);
    try {
      const first_name = getValues("first_name");
      const last_name = getValues("last_name");
      const response = await fetchAuthPost(`${djangoBaseURL}/get-register-otp/`, {
        body: { email, first_name, last_name },
      });
      if (response.status) {
        // toast.success(response.message || "OTP sent to your email.");
        setResendTimer(30);
        setOtpMode(true);
      } else {
        toast.error(response.message || "Failed to send OTP.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Remove/hide password submit handler
  // const onSubmit = async (data) => {
  //   setLoading(true);
  //   try {
  //     const emailPrefix = email.split("@")[0];
  //     const companyName = `${emailPrefix}'s Company`;
  //     let passwordToSend = data.password;
  //     if (!passwordToSend) {
  //       setError("password", { type: "manual", message: "Password is required" });
  //       setLoading(false);
  //       return;
  //     }
  //     if (passwordToSend.length < 8) {
  //       setError("password", { type: "manual", message: "Password must be at least 8 characters" });
  //       setLoading(false);
  //       return;
  //     }
  //     const response = await fetchAuthPost(
  //       `${djangoBaseURL}/api/create-company-and-employee/`,
  //       {
  //         body: {
  //           company_name: companyName,
  //           email: email,
  //           password: passwordToSend,
  //         },
  //       }
  //     );
  //     if (response.status) {
  //       toast.success("Account created successfully");
  //       const userLogin = await fetchAuthPost(`${djangoBaseURL}/login/`, {
  //         body: { email: email, password: passwordToSend },
  //       });
  //       if (userLogin.status) {
  //           //         dispatch(token(userLogin.token));
  //         delete userLogin?.user?.password;
  //         dispatch(login(userLogin.user));
  //         navigate("/welcome?status=new", { state: { showWelcome: true } });
  //       } else {
  //         toast.error("Login failed. Please try again.");
  //         setTimeout(() => {
  //           navigate("/login");
  //         }, 1000);
  //       }
  //     } else {
  //       toast.error(response.message);
  //     }
  //   } catch (error) {
  //     toast.error("Email already exists!");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // 3. Create account with { ... , first_name, last_name }
  const onSubmitOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const first_name = getValues("first_name");
      const last_name = getValues("last_name");
      const emailPrefix = email.split("@")[0];
      const companyName = `${emailPrefix}'s Company`;
      if (!otp || otp.length !== 6) {
        setError("otp", { type: "manual", message: "Please enter the 6-digit OTP." });
        setLoading(false);
        return;
      }
      const response = await fetchAuthPost(
        `${djangoBaseURL}/api/create-company-and-employee/`,
        {
          body: {
            company_name: companyName,
            email: email,
            otp: otp,
            first_name,
            last_name,
          },
        }
      );
      if (response.status) {
        toast.success("Account created successfully");
        const userLogin = await fetchAuthPost(`${djangoBaseURL}/login/`, {
          body: { email: email, password: otp },
        });
        if (userLogin.status) {
          dispatch(token(userLogin.token));
          delete userLogin?.user?.password;
          dispatch(login(userLogin.user));
          navigate("/welcome?status=new", { state: { showWelcome: true } });
        } else {
          toast.error("Login failed. Please try again.");
          setTimeout(() => {
            navigate("/login");
          }, 1000);
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error?.message || "Account Already Exist!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isUserAlreadyRegistered = async () => {
      try {
        const isRegistered = await fetchAuthGET(
          `${djangoBaseURL}/api/check-email/?email=${email}`
        );
        if (isRegistered?.status) {
          toast.error(isRegistered?.message);
        }
      } catch (error) {
        console.error(error);
      }
    };

    isUserAlreadyRegistered();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9faff] py-10">
      <div className="w-full max-w-[1200px] bg-white shadow-sm rounded-md flex flex-col lg:flex-row gap-5 md:px-20 md:py-10 px-6 md:mx-6">
        {/* Left Section */}
        <div className="flex-1">
          <h3 className="text-2xl md:text-4xl font-bold text-center lg:text-left text-black-500 dark:text-black-500">
            Create an account to <br className="hidden lg:block" /> start{" "}
            <span
              className="gradient-text cursor-pointer"
              onClick={() => navigate("/")}
            >
              Dyzo
            </span>
          </h3>
          <ul className="space-y-4 hidden lg:block pt-4">
            <li className="flex items-center gap-3 mb-4">
              <img src={TickIcon} alt="tick" className="w-5" />
              <p className="text-lg font-medium text-black-500 dark:text-black-500">
                It helps you manage your daily tasks
              </p>
            </li>
            <li className="flex items-center gap-3 mb-4">
              <img src={TickIcon} alt="tick" className="w-5" />
              <p className="text-lg font-medium text-black-500 dark:text-black-500">
                Helps you automate your Timesheets and Reports
              </p>
            </li>
            <li className="flex items-center gap-3 mb-4">
              <img src={TickIcon} alt="tick" className="w-5" />
              <p className="text-lg font-medium text-black-500 dark:text-black-500">
                Get access to unlimited tasks, projects, and more
              </p>
            </li>
          </ul>
        </div>
        {/* Right Section */}
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-4 text-center text-black-500 dark:text-black-500 ">
            {/* Update heading to only mention OTP */}
            To get started, create your account with OTP
          </h2>
          <form onSubmit={otpMode ? onSubmitOtp : handleGetOtp} className="space-y-5">
            <div className="bg-gray-100 p-3 rounded-md mb-5">
              <div className="flex justify-center items-center gap-4">
                <Icon
                  icon="bi:person-fill"
                  className="text-black-500 dark:text-black-500"
                />
                <p className="text-center text-black-500 dark:text-black-500">
                  {email}
                </p>
              </div>
            </div>
            {/* First Name and Last Name fields */}
            {!otpMode && (
              <>
                <Textinput
                  name="first_name"
                  label="First Name"
                  classLabel="text-black-500 dark:text-black-500 mb-2"
                  type="text"
                  placeholder=""
                  register={register}
                  error={errors.first_name}
                  className="h-[48px] border-[#888888] text-black-500 dark:text-black-500 dark:bg-white"
                  onChange={e => {
                    register("first_name").onChange(e);
                    trigger("first_name");
                  }}
                />
                <Textinput
                  name="last_name"
                  label="Last Name"
                  classLabel="text-black-500 dark:text-black-500 mb-2"
                  type="text"
                  placeholder=""
                  register={register}
                  error={errors.last_name}
                  className="h-[48px] border-[#888888] text-black-500 dark:text-black-500 dark:bg-white"
                  onChange={e => {
                    register("last_name").onChange(e);
                    trigger("last_name");
                  }}
                />
              </>
            )}
            {/* OTP input and resend button */}
            {otpMode && (
              <OtpRegisterBox
                email={email}
                onBack={() => { setOtpMode(false); setOtp(""); clearErrors("otp"); }}
                onOtpChange={val => { setOtp(val); clearErrors("otp"); }}
                error={errors.otp}
                startTimerOnMount={true}
              />
            )}
            <Button
              type="submit"
              text={otpMode ? "Continue" : "Send OTP"}
              className="btn btn-primary w-full"
              isLoading={loading || otpLoading}
            />

            <div className="pt-3 flex flex-col md:flex-row justify-between items-center">
              <Link to={"/login"}>
                <h4 className="text-[12px] text-center text-black-500 dark:text-black-500 dark:bg-white-500">
                  Already have an account?{" "}
                  <span className="font-semibold">Sign In</span>
                </h4>
              </Link>

              <Link to={"/register"}>
                <h4 className="text-[12px] text-center text-black-500 dark:text-black-500 dark:bg-white-500">
                  Register with a new email?{" "}
                  <span className="font-semibold">Sign Up</span>
                </h4>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordScreen;
