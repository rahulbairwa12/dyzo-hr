import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import Textinput from "@/components/ui/Textinput";

const OTP_LENGTH = 6;

const OtpRegisterBox = ({ email, onBack, onOtpChange, error, startTimerOnMount }) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);
  const [firstMount, setFirstMount] = useState(true);

  useEffect(() => {
    if (startTimerOnMount && firstMount) {
      setResendTimer(30);
      setFirstMount(false);
      toast.success("OTP sent to your email.");
    }
  }, [startTimerOnMount, firstMount]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleGetOtp = async () => {
    setOtpLoading(true);
    try {
      const response = await fetch(`${import.meta.env ? import.meta.env.VITE_APP_DJANGO : '' || ''}/get-register-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.status) {
        toast.success(data.message || "OTP sent to your email.");
        setResendTimer(30);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        toast.error(data.message || "Failed to send OTP.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (value, idx) => {
    if (!/^[0-9]?$/.test(value)) return; // Only allow single digit
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    onOtpChange(newOtp.join(""));
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
      onOtpChange(pasted);
      setTimeout(() => {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
      }, 0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 mb-2">
      <div className="text-center mb-2">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Check your email</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          We've sent a 6-digit code to <span className="font-semibold text-slate-600 dark:text-slate-300">{email}</span>.
        </p>
      </div>
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
      {error && <span className="text-red-500 text-xs mt-1">{error.message}</span>}
      <div className="flex w-full justify-center items-center mt-2">
        {/* Resend Button */}
        <button
          type="button"
          className={`
            px-2 py-1 rounded
            ${otpLoading || resendTimer > 0
              ? "text-gray-400 cursor-not-allowed bg-transparent"
              : "text-blue-600 font-bold hover:underline hover:text-blue-800 bg-blue-50/50 transition"
            }
            text-xs
          `}
          onClick={handleGetOtp}
          disabled={otpLoading || resendTimer > 0}
          style={{ background: "none" }}
        >
          {otpLoading ? "Sending..." : resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : "Resend OTP"}
        </button>
        {/* 
          <button
            type="button"
            className="px-2 py-1 rounded text-blue-600 font-bold hover:underline hover:text-blue-800 bg-blue-50/50 transition text-xs cursor-pointer"
            onClick={() => setOtpMode(false)}
            style={{ background: "none" }}
          >
            Change email
          </button>
        */}
      </div>
    </div>
  );
};

export default OtpRegisterBox; 