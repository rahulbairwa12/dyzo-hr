import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import CompanyAskStep from "./CompanyAskStep";
import { token, login } from "@/store/api/auth/authSlice";
import { djangoBaseURL } from "@/helper";
import { setTokens } from "@/utils/authToken";
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const OTP_LENGTH = 6;

const EmailOtpVerify = () => {
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [step, setStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [loginCredentials, setLoginCredentials] = useState(null);
    const [loginType, setLoginType] = useState("otp");
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const query = useQuery();
    const email = query.get("email") || "";
    const inputRefs = useRef([]);
    const [resendTimer, setResendTimer] = useState(0); // <-- Add this

    // Countdown effect
    useEffect(() => {
        let timer;
        if (resendTimer > 0) {
            timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendTimer]);

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

    const handleOtpChange = (value, idx) => {
        if (!/^[0-9]?$/.test(value)) return; // Only allow single digit
        const newOtp = [...otp];
        newOtp[idx] = value;
        setOtp(newOtp);
        // Move focus
        if (value && idx < OTP_LENGTH - 1) {
            inputRefs.current[idx + 1]?.focus();
        }
        if (!value && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const handleOtpKeyDown = (e, idx) => {
        if (e.key === "Backspace" && !otp[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
        if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
            inputRefs.current[idx + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData("Text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (pasted.length === OTP_LENGTH) {
            setOtp(pasted.split(""));
            setTimeout(() => {
                inputRefs.current[OTP_LENGTH - 1]?.focus();
            }, 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpValue = otp.join("");
        if (otpValue.length !== OTP_LENGTH) {
            toast.error("Please enter the 6-digit OTP.");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${djangoBaseURL}/otp-login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: otpValue }),
            });
            const data = await response.json();
            if (data.status == 1) {
                toast.success(data.message || "Login successful!");

                // Store tokens using new token management system
                if (data.access_token && data.refresh_token) {
                    setTokens(data.access_token, data.refresh_token);
                } else if (data.token) {
                    // Fallback for old token format
                    dispatch(token(data.token));
                }

                if (data.user && data.user.password) delete data.user.password;
                dispatch(login(data.user));
                const redirectPath = getRedirectPath(data?.user?.user_type, data?.user?._id);
                navigate("/dashboard", { replace: true });
                setTimeout(() => navigate(`/tasks?userId=${data?.user?._id}`), 0);
                return;
            } else if (data.status === 2) {
                // toast.info(data.message || "Select your company to continue.");
                const encodedCredentials = btoa(JSON.stringify({ email }));
                localStorage.setItem("loginCredentials", encodedCredentials);
                const encodedAccounts = btoa(JSON.stringify(data.accounts));
                localStorage.setItem("accounts", encodedAccounts);
                localStorage.setItem("loginType", "normal");
                setAccounts(data.accounts);
                setLoginCredentials({ email });
                setLoginType("otp");
                setStep(2);
                return;
            } else {
                toast.error(data.message || "Invalid OTP.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setResending(true);
        try {
            const response = await fetch(`${djangoBaseURL}/verify-email/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok && data.status) {
                toast.success(data.message || "OTP resent to your email.");
                setOtp(Array(OTP_LENGTH).fill(""));
                inputRefs.current[0]?.focus();
                setResendTimer(30); // <-- Start 30s timer
            } else {
                toast.error(data.message || "Failed to resend OTP.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        } finally {
            setResending(false);
        }
    };

    // Start timer on first render (if you want to block resend on first OTP send)
    useEffect(() => {
        setResendTimer(30);
    }, []);

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-800">
            <div className="bg-white dark:bg-slate-900 p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-center">Enter OTP</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center gap-2 mb-2" onPaste={handlePaste}>
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={el => (inputRefs.current[idx] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                className="w-10 h-12 text-center border rounded text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={digit}
                                onChange={e => handleOtpChange(e.target.value, idx)}
                                onKeyDown={e => handleOtpKeyDown(e, idx)}
                                autoFocus={idx === 0}
                            />
                        ))}
                    </div>
                    <Button
                        type="submit"
                        text={loading ? "Verifying..." : "Verify & Login"}
                        className="btn btn-dark w-full"
                        isLoading={loading}
                        disabled={loading}
                    />
                </form>
                <div className="flex flex-col items-center mt-4">
                    <span className="text-gray-500 text-sm mb-1">
                        Didn&apos;t receive OTP?
                    </span>
                    <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending || resendTimer > 0}
                        className={`
                            font-medium
                            px-4 py-2
                            rounded
                            transition-colors
                            duration-200
                            ${resending || resendTimer > 0
                                ? "text-gray-400 cursor-not-allowed bg-gray-100"
                                : "text-blue-600 hover:text-white hover:bg-blue-600 hover:underline bg-blue-50"}
                            shadow-sm
                            text-sm
                        `}
                        style={{
                            minWidth: "130px",
                        }}
                    >
                        {resending
                            ? "Resending..."
                            : resendTimer > 0
                                ? `Resend OTP (${resendTimer}s)`
                                : "Resend OTP"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailOtpVerify; 