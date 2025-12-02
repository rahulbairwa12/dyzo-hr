import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleIcon from "../../assets/images/icons/google-icon.svg";

const DesktopGoogleLogin = () => {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse, "tokenResponse");
      setGoogleLoading(true);

      // Redirect to desktop app
      window.location.href = `dyzo-fiddle://${tokenResponse.access_token}`;
    },
    onError: () => {
      toast.error("Google login failed");
      window.location.href = `dyzo-fiddle://${false}`;
      setGoogleLoading(false);
    },
  });

  // ✅ Automatically trigger Google Login when the component mounts
  useEffect(() => {
    const autoLogin = async () => {
      await handleGoogleLogin();
    };
    autoLogin();
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:items-center justify-center bg-[#f9faff] py-10">
      <div className="mb-4">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-medium rounded-full px-5 py-2.5 hover:bg-gray-100 transition-all border-2 border-solid border-gray-300"
        >
          <img src={GoogleIcon} alt="Google Logo" className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default DesktopGoogleLogin;
