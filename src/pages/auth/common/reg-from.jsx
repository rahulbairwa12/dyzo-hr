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
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .required("Please enter password"),
  })
  .required();

const RegForm = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); // Loading state for Google login
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    formState: { errors },
    handleSubmit,
    watch,
    trigger,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const watchedFields = watch(["email", "password"]);

  useEffect(() => {
    if (watchedFields.email || watchedFields.password) {
      trigger();
    }
  }, [watchedFields, trigger]);

  const WelcomeMail = async (data) => {
    try {
      await fetchAuthPost(`${djangoBaseURL}/welcome/admin/`, { body: { companyId: data.user.companyId, email: data.user.email, userName: data.user.name } });
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setEmail(data.email);
      setFormData(data);

      const emailPrefix = data.email.split('@')[0];
      const companyName = `${emailPrefix}`;

      const createCompany = await fetchAuthPost(
        `${djangoBaseURL}/api/create-company-and-employee/`,
        {
          body: {
            company_name: companyName,
            email: data.email,
            password: data.password,
          },
        }
      );

      if (createCompany.status) {
        toast.success("Account created successfully");

        const userLogin = await fetchAuthPost(`${djangoBaseURL}/login/`, {
          body: { email: data.email, password: data.password },
        });
        if (userLogin.status) {
          dispatch(token(userLogin.token));
          delete userLogin?.user?.password;
          dispatch(login(userLogin.user));
          navigate("/welcome?status=new", { state: { showWelcome: true } });
          setTimeout(() => {
            WelcomeMail(userLogin);
          }, 3000);
        } else {
          toast.error("Login failed. Please try again.");
          setTimeout(() => {
            navigate("/login");
          }, 1000);
        }
      } else {
        toast.error("Error in account creation");
      }
    } catch (error) {
      toast.error("Email already exists!");
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
        const companyName = `${emailPrefix}`;

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
              WelcomeMail(userLogin);
              navigate("/welcome?status=new", { state: { showWelcome: true } });
              setTimeout(() => {
                WelcomeMail(userLogin);
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

          if (loginResponse.status) {
            toast.success("Logged in with Google successfully");
            dispatch(token(loginResponse.token));
            delete loginResponse?.user?.password;
            dispatch(login(loginResponse.user));

            const redirectPath = getRedirectPath(loginResponse?.user?.user_type);
            setTimeout(() => navigate(redirectPath), 800);
          } else {
            toast.error("No account found with this Google email. Please sign up first.");
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Textinput
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        register={register}
        error={errors.email}
        className="h-[48px]"
      />
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
      <Button
        type="submit"
        text="Create an account"
        className="btn btn-dark block w-full text-center"
        isLoading={loading}
      />
      <div className="mt-5 flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => toast.error("Google login failed")}
          render={(renderProps) => (
            <button
              onClick={renderProps.onClick}
              disabled={renderProps.disabled || googleLoading}
              className="flex items-center border rounded-lg px-5 py-2 hover:shadow-md"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
                alt="Google"
                className="h-5 w-5 mr-2"
              />
              Continue with Google
            </button>
          )}
        />
      </div>
    </form>
  );
};

export default RegForm;
