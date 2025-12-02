import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchAuthPost } from "@/store/api/apiSlice";
import { djangoBaseURL } from "@/helper";
import Button from "@/components/ui/Button";

const VerifyOtp = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }
    try {
      const emailPrefix = state.email.split("@")[0];
      const companyName = `${emailPrefix}'s Company`;
      const response = await fetchAuthPost(
        `${djangoBaseURL}/api/create-company-and-employee/`,
        {
          body: {
            company_name: companyName,
            email: state.email,
            otp: otp,
            first_name: state.first_name,
            last_name: state.last_name,
          },
        }
      );
      if (response.status) {
        toast.success("Account created successfully!");
        // Redirect to login or dashboard
        navigate("/login");
      } else {
        toast.error(response.message || "Signup failed.");
      }
    } catch (error) {
      toast.error("Signup failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-5">
      <label>Enter OTP sent to {state.email}</label>
      <input
        type="text"
        maxLength={6}
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
        className="w-full border rounded px-3 py-2"
      />
      <Button
        type="submit"
        text="Sign Up"
        className="btn btn-primary block w-full text-center"
      />
    </form>
  );
};

export default VerifyOtp;
