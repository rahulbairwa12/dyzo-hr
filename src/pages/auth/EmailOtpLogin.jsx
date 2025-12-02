import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { toast } from "react-toastify";
import { djangoBaseURL } from "@/helper";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const EmailOtpLogin = () => {
  const location = useLocation();
  const query = useQuery();
  const navigate = useNavigate();
  // console.log("URL Search Params:", query.toString()); // Check if params exist
  // console.log("Email from URL:", query.get("email")); // Check extracted email
  // console.log("Email from State:", location.state?.email); // Check state email

  // Get email from URL params or state
  const emailFromQuery = query.get("email") || "";
  const emailFromState = location.state?.email || "";
  const initialEmail = emailFromQuery || emailFromState;

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  // Ensure email is decoded (if it's URL-encoded)
  useEffect(() => {
    if (emailFromQuery) {
      const decodedEmail = decodeURIComponent(emailFromQuery);
      setEmail(decodedEmail);
    }
  }, [emailFromQuery]);

  const handleSendOtp = async (e) => {
    e.preventDefault(); // Prevents page reload
    if (!email) {
      toast.error("Please enter an email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${djangoBaseURL}/verify-email/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok && data.status) {
        toast.success(data.message || "OTP sent to your email.");
        navigate(`/email-otp-verify?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-800">
      <div className="bg-white dark:bg-slate-900 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Login via Email Verification</h2>
        <form onSubmit={handleSendOtp} className="space-y-4">
       
  {/* Replace Textinput with this temporary input */}
  <input
    type="email"
    name="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter your email"
    className="h-[48px] w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-black-500 dark:bg-white"
    required
  />
  <Button
    type="submit"
    text={loading ? "Sending..." : "Send OTP"}
    className="btn btn-dark w-full"
    isLoading={loading}
    disabled={loading}
  />
</form>
        
      </div>
    </div>
  );
};

export default EmailOtpLogin;