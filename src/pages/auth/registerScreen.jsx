import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchAuthPost } from "@/store/api/apiSlice";
import { djangoBaseURL } from "@/helper";
import { login, token } from "@/store/api/auth/authSlice";
import InputGroup from "@/components/ui/InputGroup";
import { useGoogleLogin } from '@react-oauth/google';
import ProudlyIndian from "@/assets/images/photos/proudly-logo.png";
import TickIcon from "@/assets/images/icons/tick-right.svg";
import { Link } from "react-router-dom";
import GoogleIcon from "../../assets/images/icons/google-icon.svg";
import dyzoLogo from "../../assets/images/logo/dyzoLogo.svg";
import OtpRegisterBox from "./OtpRegisterBox"; // adjust path if needed

const schema = yup
    .object({
        first_name: yup
            .string()
            .required("First Name is required")
            .matches(/^[a-zA-Z\s]*$/, "First Name should contain only letters and spaces")
            .min(2, "First Name must be at least 2 characters"),
        last_name: yup
            .string()
            .matches(/^[a-zA-Z\s]*$/, "Last Name should contain only letters and spaces")
            .nullable(),
        email: yup
            .string()
            .email("Invalid email")
            .required("Email is required"),
        // password: yup
        //     .string()
        //     .min(8, "Password must be at least 8 characters")
        //     .required("Please enter password"),
    })
    .required();

const RegisterScreen = ({
    handleUpdateStepCount,
    setAccounts,
    setLoginCredentials,
    setLoginType,
}) => {
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [email, setEmail] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // const [showPassword, setShowPassword] = useState(false); // Hide password toggle
    const [otpMode, setOtpMode] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const {
        register,
        formState: { errors },
        handleSubmit,
        watch,
        trigger,
        getValues,
    } = useForm({
        resolver: yupResolver(schema),
        mode: "onBlur",
    });

    const watchedFields = watch(["email"/*, "password"*/]);

    // useEffect(() => {
    //     if (watchedFields.email /*|| watchedFields.password*/) {
    //         trigger();
    //     }
    // }, [watchedFields, trigger]);

    const WelcomeMail = async (data) => {
        try {
            await fetchAuthPost(`${djangoBaseURL}/welcome/admin/`, { body: { companyId: data.user.companyId, email: data.user.email, userName: data.user.name } });
        } catch (error) {
            console.error(error);
        }
    };

    // Hide password submit handler
    // const onSubmit = async (data) => {
    //     try {
    //         setLoading(true);
    //         setEmail(data.email);

    //         const emailPrefix = data.email.split('@')[0];
    //         const companyName = `${emailPrefix}'s Company`;

    //         const createCompany = await fetchAuthPost(
    //             `${djangoBaseURL}/api/create-company-and-employee/`,
    //             {
    //                 body: {
    //                     company_name: companyName,
    //                     email: data.email,
    //                     password: data.password,
    //                 },
    //             }
    //         );

    //         if (createCompany.status) {
    //             toast.success("Account created successfully");

    //             const userLogin = await fetchAuthPost(`${djangoBaseURL}/login/`, {
    //                 body: { email: data.email, password: data.password },
    //             });
    //             if (userLogin.status) {
    //                     //                 dispatch(token(userLogin.token));
    //                 delete userLogin?.user?.password;
    //                 dispatch(login(userLogin.user));
    //                 setTimeout(() => {
    //                     WelcomeMail(userLogin);
    //                     navigate("/welcome?status=new", { state: { showWelcome: true } });
    //                 }, 30);
    //             } else {
    //                 toast.error("Login failed. Please try again.");
    //                 setTimeout(() => {
    //                     navigate("/login");
    //                 }, 1000);
    //             }
    //         } else {

    //             const userLogin = await fetchAuthPost(`${djangoBaseURL}/login/`, {
    //                 body: { email: data.email, password: data.password },
    //             });
    //             if (userLogin.status === 1) {
    //                     //                 dispatch(token(userLogin.token));
    //                 delete userLogin?.user?.password;
    //                 dispatch(login(userLogin.user));
    //                 const redirectPath = getRedirectPath(response?.user?.user_type);
    //                 setTimeout(() => {
    //                     navigate(redirectPath);
    //                   }, 800);
    //             } else if (userLogin.status === 2) {

    //                 setAccounts(userLogin.accounts);
    //                 setLoginCredentials({ email: data.email, password: data.password });
    //                 setLoginType("normal");
    //                 handleUpdateStepCount(2);
    //             } else {
    //                 toast.error(`${createCompany.message} and ${userLogin.message}`);


    //                 setTimeout(() => {
    //                     navigate("/login");
    //                 }, 1000);
    //             }
    //         }
    //     } catch (error) {
    //         toast.error("Email already exists!");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // Update handleGetOtp to check for email validity
    const handleGetOtp = async () => {
        const emailValue = getValues("email");
        const firstName = getValues("first_name");
        const lastName = getValues("last_name");

        // Check if email is entered and valid
        if (!emailValue || errors.email) {
            toast.error("Enter the valid  email");
            return;
        }

        // Check for numbers in first name or last name
        const hasNumber = /\d/;
        if ((firstName && hasNumber.test(firstName)) || (lastName && hasNumber.test(lastName))) {
            toast.error("First Name and Last Name should not contain numbers.");
            return;
        }

        setOtpLoading(true);
        try {
            const response = await fetchAuthPost(`${djangoBaseURL}/get-register-otp/`, {
                body: { email: emailValue },
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

    const onSubmitOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const emailValue = getValues("email");
            const firstName = getValues("first_name");
            const lastName = getValues("last_name");
            if (!otp || otp.length !== 6) {
                toast.error("Please enter the 6-digit OTP.");
                setLoading(false);
                return;
            }
            const emailPrefix = emailValue.split("@")[0];
            const companyName = `${emailPrefix}'s Company`;

            const createCompany = await fetchAuthPost(
                `${djangoBaseURL}/api/create-company-and-employee/`,
                {
                    body: {
                        company_name: companyName,
                        email: emailValue,
                        otp: otp,
                        first_name: firstName,
                        last_name: lastName,
                    },
                }
            );

            if (createCompany.status) {
                toast.success("Account created successfully!");

                const userLogin = await fetchAuthPost(`${djangoBaseURL}/login/`, {
                    body: { email: emailValue, password: otp },
                });
                if (userLogin.status) {
                    dispatch(token(userLogin.token));
                    delete userLogin?.user?.password;
                    dispatch(login(userLogin.user));
                    setTimeout(() => {
                        WelcomeMail(userLogin);
                        navigate("/welcome?status=new", { state: { showWelcome: true } });
                    }, 30);
                } else {
                    toast.error("Login failed. Please try again.");
                    setTimeout(() => {
                        navigate("/login");
                    }, 1000);
                }
            } else {
                toast.error(`${createCompany.message}`);
                setLoading(false);
                return; // Do not navigate or reset otpMode here!
            }
        } catch (error) {
            toast.error("OTP registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getRedirectPath = (role) => {
        const params = new URLSearchParams(location.search);
        const redirectPath = params.get("redirect");
        if (redirectPath) {
            return redirectPath;
        } else if (role === "client") {
            return "/tasks";
        } else if (role === "employee") {
            return "/tasks";
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            if (googleLoading) return; // Prevent multiple requests
            setGoogleLoading(true);
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

                            setTimeout(() => {
                                WelcomeMail(userLogin);
                                navigate("/welcome?status=new", { state: { showWelcome: true } });
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
                    const loginResponse = await fetchAuthPost(`${djangoBaseURL}/api/google-userlogin/`, {
                        body: {
                            email: profile.email,
                            token: tokenResponse.access_token,
                        },
                    });

                    if (loginResponse.status === 1) {
                        toast.success("Logged in with Google successfully");
                        dispatch(token(loginResponse.token));
                        delete loginResponse?.user?.password;
                        dispatch(login(loginResponse.user));

                        const redirectPath = getRedirectPath(loginResponse?.user?.user_type);
                        setTimeout(() => navigate(redirectPath), 800);
                    } else if (loginResponse.status === 2) {
                        setAccounts(loginResponse.accounts);
                        setLoginCredentials(tokenResponse?.access_token);
                        handleUpdateStepCount(2);
                        // For example, you could show a dropdown to pick which account to use.
                        // Then call the same endpoint with token + user_type + company_id.
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

    // Helper function to handle successful login
    const handleSuccessfulLogin = (loginResponse) => {
        toast.success("Logged in with Google successfully");
        dispatch(token(loginResponse.token));
        delete loginResponse?.user?.password;
        dispatch(login(loginResponse.user));

        const redirectPath = getRedirectPath(loginResponse?.user?.user_type);
        setTimeout(() => navigate(redirectPath), 800);
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-white">
            {/* Top actions */}
            <div className="absolute top-7 left-7 z-50">
                <Link to={'/'}>
                    <img src={dyzoLogo} alt="dyzoLogo" className="w-28 sm:w-32" />
                </Link>
            </div>
            <div className="absolute top-9 right-3 sm:right-7 text-sm text-slate-600 z-50">
                <span className="hidden sm:inline font-bold">Already have an account?</span>
                <Link to={'/login'} className="sm:ml-2 px-3 sm:px-5 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition">Sign in</Link>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[150%]">
                <svg
                    className="absolute bottom-0 left-0 w-full h-full"
                    viewBox="0 0 1200 600"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.95" />
                            <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#7A39FF" stopOpacity="0.95" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0,450 C400,400 800,500 1200,450 L1200,600 L0,600 Z"
                        fill="url(#waveGradient)"
                    />
                </svg>
                <div className="absolute inset-0 opacity-25 mix-blend-overlay bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1.2px)] [background-size:16px_16px] animate-dots"></div>
            </div>

            {/* Center card */}
            <div className="relative mx-auto flex min-h-screen w-full max-w-[1120px] items-center justify-center px-3 sm:px-6">
                <div className="w-full max-w-[560px] rounded-2xl border border-slate-100 bg-white/90 p-6 sm:p-8 shadow-xl backdrop-blur">
                    <h1 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl mb-5">Create your account</h1>


                    <form onSubmit={otpMode ? onSubmitOtp : (e) => { e.preventDefault(); handleGetOtp(); }} className="space-y-4 w-full">
                        <div>
                            <button
                                type="button"
                                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 py-2.5 transition hover:bg-slate-100"
                                onClick={handleGoogleLogin}
                                disabled={googleLoading}
                            >
                                <div className="flex items-center gap-2">
                                    <img src={GoogleIcon} alt="google" className="w-6" />
                                    <span className="text-slate-700">Sign Up with Google</span>
                                </div>
                            </button>
                        </div>

                        <div className="or-divider my-3 flex items-center">
                            <hr className="flex-1 border-slate-200" />
                            <span className="mx-2 text-xs text-slate-400">OR</span>
                            <hr className="flex-1 border-slate-200" />
                        </div>

                        {/* Fields when not in OTP mode */}
                        {!otpMode && (
                            <>
                                <Textinput
                                    name="first_name"
                                    label="First Name"
                                    classLabel="mb-1 text-slate-700"
                                    type="text"
                                    placeholder="Enter your first name"
                                    register={register}
                                    error={errors.first_name}
                                    className="h-[48px] border-neutral-50 rounded-md text-black-500 dark:text-black-500 dark:bg-white"
                                    onChange={register("first_name").onChange}
                                />
                                <Textinput
                                    name="last_name"
                                    label="Last Name"
                                    classLabel="mb-1 text-slate-700"
                                    type="text"
                                    placeholder="Enter your last name"
                                    register={register}
                                    error={errors.last_name}
                                    className="h-[48px] border-neutral-50 rounded-md text-black-500 dark:text-black-500 dark:bg-white"
                                    onChange={register("last_name").onChange}
                                />
                                <Textinput
                                    name="email"
                                    label="Email"
                                    classLabel="mb-1 text-slate-700"
                                    type="email"
                                    placeholder="Enter your email"
                                    register={register}
                                    error={errors.email}
                                    className="h-[48px] border-neutral-50 rounded-md text-black-500 dark:text-black-500 dark:bg-white"
                                    onChange={register("email").onChange}
                                />
                                <Button
                                    type="submit"
                                    text="Start your free trial"
                                    className="btn btn-primary block w-full !h-12 !rounded-lg !bg-indigo-600 hover:!bg-indigo-700 text-center"
                                    isLoading={otpLoading}
                                />
                                <div className="mb-3 flex justify-center">
                                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700">No credit card needed</span>
                                </div>
                            </>
                        )}

                        {/* OTP mode */}
                        {otpMode && (
                            <>
                                <OtpRegisterBox
                                    otp={otp}
                                    setOtp={setOtp}
                                    otpLoading={otpLoading}
                                    resendTimer={resendTimer}
                                    onSubmitOtp={onSubmitOtp}
                                    handleGetOtp={handleGetOtp}
                                    email={getValues("email")}
                                    onBack={() => { setOtpMode(false); setOtp(""); }}
                                    onOtpChange={val => setOtp(val)}
                                    error={errors.otp}
                                    startTimerOnMount={true}
                                />
                                <Button
                                    type="submit"
                                    text="Create Account"
                                    className="btn btn-primary block w-full !h-12 !rounded-lg !bg-indigo-600 hover:!bg-indigo-700 text-center"
                                    isLoading={loading}
                                />
                                <div className="text-center mt-2">
                                    <button
                                        type="button"
                                        className="text-sm text-slate-600 hover:text-indigo-600 hover:underline"
                                        onClick={() => setOtpMode(false)}
                                    >
                                        Entered wrong details? Go Back
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="text-center text-xs text-slate-500">By clicking the button above, you agree to our <a href="/terms-and-conditions" className="text-indigo-600 hover:text-indigo-700">Terms of Service</a> and <a href="/privacy-policy" className="text-indigo-600 hover:text-indigo-700">Privacy Policy</a>.</div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterScreen;
