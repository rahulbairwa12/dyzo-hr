import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { fetchAuthPut } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import Loading from "../Loading";
import { Icon } from "@iconify/react";
import { logout } from "@/store/api/auth/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const FormValidationSchema = yup
    .object({
        new_password: yup.string().required("Password is required").min(6, "Password must be at least 6 characters"),
        confirm_password: yup
            .string()
            .required("Confirm password is required")
            .oneOf([yup.ref("new_password")], "Passwords must match"),
    })
    .required();

const ChangePassword = () => {
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const userInfo = useSelector((state) => state.auth.user)
    const [updating, setUpdating] = useState(false)
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        register,
        formState: { errors },
        handleSubmit,
        trigger
    } = useForm({
        resolver: yupResolver(FormValidationSchema),
        mode: "all",
    });

    const handleLogout = () => {
        localStorage.removeItem("accounts");
        localStorage.removeItem("loginCredentials");
        localStorage.removeItem("taskFilters");
        sessionStorage.clear();
        dispatch(logout());
        navigate("/login");
    };

    const onSubmit = async (data) => {
        try {
            setUpdating(true)
            const isPasswordUpdate = await fetchAuthPut(`${import.meta.env.VITE_APP_DJANGO}/employee/password/${userInfo._id}/`, { body: { password: data.new_password } })
            if (isPasswordUpdate.status) {
                toast.success(isPasswordUpdate.message)
                setTimeout(() => {
                    handleLogout()
                }, 2000);
            } else {
                toast.error(isPasswordUpdate.message)
            }
        } catch (error) {
            toast.error('Error in password change')
        } finally {
            setUpdating(false)
        }
    };

    return (
        <div>

            <ToastContainer />
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="lg:grid-cols-2 grid gap-5 grid-cols-1"
            >
                <div className="relative">
                    <Textinput
                        name="new_password"
                        label="New Password"
                        type={showNewPassword ? "text" : "password"}
                        register={register}
                        error={errors.new_password}
                        placeholder="New Password"
                        onChange={(e) => {
                            trigger("new_password");
                            register("new_password").onChange(e);
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={`absolute ${errors.new_password ? "right-9 top-10" : "right-2 top-10"}`}
                    >
                        {showNewPassword ? <Icon icon="heroicons:eye-slash" width="24" height="24" /> : <Icon icon="heroicons:eye" width="24" height="24" />}
                    </button>
                </div>
                <div className="relative">
                    <Textinput
                        name="confirm_password"
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        register={register}
                        error={errors.confirm_password}
                        placeholder="Confirm Password"
                        onChange={(e) => {
                            trigger("confirm_password");
                            register("confirm_password").onChange(e);
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute ${errors.confirm_password ? "right-9 top-10" : "right-2 top-10"}`}
                    >
                        {showConfirmPassword ? <Icon icon="heroicons:eye-slash" width="24" height="24" /> : <Icon icon="heroicons:eye" width="24" height="24" />}
                    </button>
                </div>
                <div className="lg:col-span-2 col-span-1">
                    <div className="ltr:text-left rtl:text-left">
                        <button className="btn btn-dark text-center">{updating ? 'Updating...' : 'Update'}</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ChangePassword;
