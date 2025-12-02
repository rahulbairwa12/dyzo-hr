import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import InputGroup from "@/components/ui/InputGroup";
import { djangoBaseURL } from "@/helper";
import { toast } from "react-toastify";
import { fetchPOST } from "@/store/api/apiSlice";

const schema = yup
  .object({
    password: yup
     .string()
     .required("Password is required")
     .min(8, "Password must be at least 8 characters")
     .max(20, "Password shouldn't be more than 20 characters"),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password'), null], "Passwords didn't match")
      .required('Confirm password is required'),
      
  })
  .required();

const UpdatePasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const navigate = useNavigate();
  const { id:token } = useParams();

  useEffect(()=>{
    setResetToken(token);
  },[token])

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetchPOST(`${djangoBaseURL}/reset/verify/`,{
        body: {
          token: resetToken,
          password: data.password
        }
      });
      if(response.status){
        toast.success(response.message);
        setTimeout(()=>{navigate('/login')},3000);
      }else{
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Something went wrong');
    }finally{
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
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
            onClick={() => setShowPassword(!showPassword)}
            icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
            className="btn-outline"
          />
        }
      />

      <InputGroup
        name="confirmPassword"
        label="Confirm Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password again"
        register={register}
        error={errors.confirmPassword}
        className="h-[48px]"
        append={
          <Button
            onClick={() => setShowPassword(!showPassword)}
            icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
            className="btn-outline"
          />
        }
      />

      <Button
        type="submit"
        text="Reset Password"
        className="btn btn-dark block w-full text-center"
        isLoading={isLoading}
      />
    </form>
  );
};

export default UpdatePasswordForm;
