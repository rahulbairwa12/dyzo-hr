import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { set, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchAuthPost, fetchGET, fetchPOST } from "@/store/api/apiSlice";
// Password UI removed; OTP will be used as password
import LoginImage from "@/assets/images/common/sign-in.webp";
import { Link } from "react-router-dom";
import useDarkMode from "@/hooks/useDarkMode";
import IconWhite from "@/assets/images/common/app-icon-white.png";
import Icon from "@/assets/images/common/app-icon.webp";
import { token, login } from "@/store/authReducer";
import ExpiredInvitationModal from "./ExpiredInvitationModal";


const schema = yup
  .object({
    cname: yup.string().required("Company name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
  })
  .required();

const EmployeeInviteRegister = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  // remove password UI
  const [isDark] = useDarkMode();
  const [searchParams] = useSearchParams();
  const [companyId, setCompanyId] = useState(null);
  const [inviterId, setInviterId] = useState(null);
  const [invitedEmployeeId, setInvitedEmployeeId] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const dispatch = useDispatch();
  const [isClient, setIsClient] = useState(false);
  const [projectIds, setProjectIds] = useState([]);
  const [loading, setLoading] = useState(true); // <-- Add this line
  const [companyName, setCompanyName] = useState("");

  // OTP states (like login)
  const [otpMode, setOtpMode] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  // No separate verify step; OTP will be used directly as password
  const inputRefs = useRef([]);
 

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const inviter_id = searchParams.get("inviter_id");
    const cid = searchParams.get("AcceptInvitation");
    const isClient = searchParams.get("is_client");
    const invited_employee_id = searchParams.get("invited_employee_id");
    const projectIdsParam = searchParams.get("projectIds");
    setEmail(emailParam);
    setInvitedEmployeeId(invited_employee_id);
    setCompanyId(cid);
    setInviterId(inviter_id);
    if (isClient==="true") {
      setIsClient(true);
    } else {
      setIsClient(false);
    }
    if (projectIdsParam) {
      setProjectIds(projectIdsParam.split(",").map(id => id.trim()).filter(Boolean));
    }
  }, [searchParams]);
  useEffect(() => {
    const checkInviteStatus = async () => {
      if (invitedEmployeeId) {
        setLoading(true); // <-- Start loading
        try {
          const res = await fetchGET(
            `${import.meta.env.VITE_APP_DJANGO}/invitation/${invitedEmployeeId}/`
          );

          if (res?.status == 1) {
            setLoading(false); 
          } else if (res?.status == 0) {
            navigate("/expired");
          }
        } catch (err) {
          navigate("/expired");
        }
      }
    };
    checkInviteStatus();
  }, [invitedEmployeeId, navigate]);

 

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (companyId) {
        try {
          const { company_name } = await fetchGET(
            `${import.meta.env.VITE_APP_DJANGO}/companies/${companyId}`
          );
          if (company_name) {
            setCompanyName(company_name);
            setValue("cname", company_name);
          }
        } catch (error) {
          navigate("/");
        }
      }
    };
    fetchCompanyDetails();
  }, [companyId, setValue, navigate]);

  useEffect(() => {
    if (email) {
      setValue("email", email);
    }
  }, [email, setValue]);

  // Resend countdown
  useEffect(() => {
    let t;
    if (resendTimer > 0) t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleGetOtp = async (e) => {
    e?.preventDefault?.();
    if (!email) {
      toast.error("Email missing from invitation link");
      return;
    }
    setOtpLoading(true);
    try {
      const resp = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/api/send-invite-otp/`, {
        body: { email },
      });
      if (resp?.status) {
        toast.success(resp.message || "OTP sent to your email.");
        setOtpMode(true);
        setOtpDigits(Array(6).fill(""));
        setOtp("");
        setResendTimer(30);
      } else {
        toast.error(resp?.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Robust single-box change handler – always keep exactly one numeric char or empty
  const handleOtpDigitChange = (rawValue, idx) => {
    const char = (rawValue || "").toString().replace(/\D/g, "").slice(-1); // last numeric or ''
    const next = [...otpDigits];
    next[idx] = char;
    setOtpDigits(next);
    setOtp(next.join(""));
    if (char && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    // Let form submit handle final submission
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const arr = Array(6).fill("");
    for (let i = 0; i < text.length; i++) arr[i] = text[i];
    setOtpDigits(arr);
    setOtp(arr.join(""));
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  // Removed explicit verify step; OTP is validated server-side on submit

  const WelcomeMail = async (data) => {
    try {
      const response = await fetchPOST(
        `${import.meta.env.VITE_APP_DJANGO}/welcome/`,
        {
          body: {
            companyId: data.data.companyId,
            email: data.data.email,
            adminName: data.data.name,
          },
        }
      );
    } catch (error) {
    } finally {
    }
  };

  const onSubmit = async (data) => {
    try {
      setUpdateLoading(true);
      if (!otp || otp.length !== 6) {
        toast.error("Please enter the 6-digit OTP.");
        setUpdateLoading(false);
        return;
      }
      let response;

      const body = {
        companyId: companyId,
        email: email, // Use the email state
        otp: otp, // send OTP as password as requested
        inviter_id: inviterId,
        terms: true,
        is_client: isClient,
      };
      if (projectIds.length > 0) {
        body.projectIds = projectIds;
      }

      if (isClient) {
    
        response = await fetchPOST(
          `${import.meta.env.VITE_APP_DJANGO}/employee/add/`,
          {
            body: body,
          }
        );
      } else {
        response = await fetchPOST(
          `${import.meta.env.VITE_APP_DJANGO}/employee/add/`,
          {
            body: body,
          }
        );
      }
  

      if (response?.status) {
        dispatch(login(response.data));
        toast.success(response.message);
        WelcomeMail(response);
        setTimeout(() => {
          navigate("/user-onboarding?status=new");
        }, 2000);
        reset();
      } else {
        // display precise message from server (invalid/expired/missing OTP)
        toast.error(response?.message || "Failed to join. Please try again.");
      }
    } catch (error) {
      toast.error("Error in adding employee");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return <div></div>; // Or show a loader here
  }

  return (
    <div className="loginwrapper">
        
      <div className="lg-inner-column">
        <div className="left-column relative z-[1] h-full">
          <div>
            <img
              src={LoginImage}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <div className="right-column relative">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
            <div className="auth-box h-full flex flex-col justify-center">
              <div className="mobile-logo text-center mb-6 lg:hidden block">
                <Link to="/" className="flex justify-center items-center">
                  <img
                    src={isDark ? IconWhite : Icon}
                    alt=""
                    className="w-10"
                  />
                  <h4 className="pt-2">Dyzo</h4>
                </Link>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Company Name as div field */}
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <div className="h-[48px] px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 flex items-center">
                    {companyName || "Loading..."}
                  </div>
                </div>
                
                {/* Email as div field */}
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="h-[48px] px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 flex items-center">
                    {email || "Loading..."}
                  </div>
                </div>
                {/* OTP section UI just like login, placed below email */
                }
                <div className="form-group">

                  {otpMode && (
                    <div className="flex flex-col items-center gap-2 mb-2 mt-3">
                      <label className="block text-black-500 dark:text-black-500 mb-1">Enter OTP</label>
                      <div className="flex justify-center gap-2 mb-2" onPaste={handlePaste}>
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (inputRefs.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(e.target.value, idx)}
                            onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                            onFocus={(e) => e.target.select()}
                            className="w-10 h-12 text-center border rounded text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>
                      <div className="flex w-full justify-between items-center mt-2">
                        <button
                          type="button"
                          className={`px-2 py-1 rounded ${
                            otpLoading || resendTimer > 0
                              ? 'text-gray-400 cursor-not-allowed bg-transparent'
                              : 'text-blue-600 font-bold hover:underline hover:text-blue-800 bg-blue-50/50 transition'
                          } text-sm`}
                          onClick={handleGetOtp}
                          disabled={otpLoading || resendTimer > 0}
                          style={{ background: 'none' }}
                        >
                          {otpLoading
                            ? 'Sending...'
                            : resendTimer > 0
                            ? `Resend OTP (${resendTimer}s)`
                            : 'Resend OTP'}
                        </button>
                        
                      </div>
                    </div>
                  )}
                </div>
                {/* Primary action button - Send OTP first, then Submit */}
                {!otpMode ? (
                  <Button
                    type="button"
                    onClick={handleGetOtp}
                    text={resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Send OTP'}
                    className="btn btn-dark block w-full text-center"
                    isLoading={otpLoading}
                    disabled={otpLoading || resendTimer > 0 || !email}
                  />
                ) : (
                  <Button
                    type="submit"
                    text="Join The Company"
                    className="btn btn-dark block w-full text-center"
                    isLoading={updateLoading}
                    disabled={updateLoading || otp.length !== 6}
                  />
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EmployeeInviteRegister;
