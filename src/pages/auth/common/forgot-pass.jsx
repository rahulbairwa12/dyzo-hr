import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { djangoBaseURL } from "@/helper";
import { fetchPOST } from "@/store/api/apiSlice";
import Button from "@/components/ui/Button";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is Required"),
}).required();

const ForgotPass = () => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // Track if OTP is sent
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await fetchPOST(`${djangoBaseURL}/reset/link/`, {
        body: data,
      });
      if(response.status){
        toast.success(response.message);
        setOtpSent(true); // Set to true when OTP is sent
      }
      else{
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to send recovery email");
    }finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const response = await fetchPOST(`${djangoBaseURL}/reset/link/`, {
        body: { email: formState.email }, // Send the email again for OTP
      });
      if (response.status) {
        toast.success("OTP resent successfully.");
      } else {
        toast.error("Failed to resend OTP.");
      }
    } catch (error) {
      toast.error("Error resending OTP.");
    } finally {
      setLoading(false);
    }
  };

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
      />
      
      {/* Initial Submit Button for sending OTP */}
      <Button
        text={otpSent ? "Send recovery email again" : "Send recovery email"}
        type="submit"
        className="btn btn-dark block w-full text-center"
        isLoading={loading}
      />
    </form>
  );
};

export default ForgotPass;
