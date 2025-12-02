import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchPOST, fetchAuthGET } from "@/store/api/apiSlice";

const Unsubscribe = () => {
  const userInfo = useSelector((state) => state.auth.user);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(null); // null => unknown, true/false => known
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qpEmail = params.get("email");
    const unsubscribe_token = params.get("unsubscribe_token");
    const employeeId = String(userInfo?._id || "");

    if (!qpEmail || !unsubscribe_token) {
      // Strict: require email and token from URL only
      setStatus("error");
      setMessage("Invalid link. Missing email or token.");
      setInitializing(false);
    } else {
      setEmail(qpEmail);
      setToken(unsubscribe_token);
      // Optionally read current subscription state (does not override email/token)
      (async () => {
        try {
          if (employeeId) {
            const url = `${import.meta.env.VITE_APP_DJANGO}/employee/me/${employeeId}/?_=${Date.now()}`;
            const data = await fetchAuthGET(url, false); // false for useCache
            if (data?.status === 1 && data?.data) {
              setIsSubscribed(Boolean(data.data.is_subscribed));
            }
            setInitializing(false);
          } else {
            // If no employeeId available yet, don't block UI
            setInitializing(false);
          }
        } catch {
          setInitializing(false);
        }
      })();
    }
  }, [userInfo?._id]);

  const callApi = async (action) => {
    setLoading(true);
    setStatus("processing");
    setMessage("Processing your request...");
    // Optimistic UI update
    const prevSubscribed = isSubscribed;
    setIsSubscribed(action === "subscribe");
    try {
      const apiBase = import.meta.env.VITE_APP_DJANGO;
      const url = `${apiBase}/api/update-email-subscription/`;
      const resp = await fetchPOST(url, {
        body: JSON.stringify({ email, unsubscribe_token: token, action }),
      });

      if (resp?.detail) {
        setStatus("success");
        setMessage(resp.detail);
      } else if (resp?.message) {
        setStatus("success");
        setMessage(resp.message);
      } else if (resp?.is_subscribed === true) {
        setStatus("success");
        setMessage("You have been subscribed to email notifications.");
        setIsSubscribed(true);
      } else if (resp?.is_subscribed === false) {
        setStatus("success");
        setMessage("You have been unsubscribed from email notifications.");
        setIsSubscribed(false);
      } else {
        setStatus("success");
        setMessage("Your email preference has been updated.");
      }
    } catch (e) {
      setStatus("error");
      setMessage("Something went wrong. Please try again later.");
      // Revert optimistic update on failure
      setIsSubscribed(prevSubscribed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">
          {status === "processing" ? "Please wait" : status === "error" ? "Error" : "Email Preferences"}
        </h1>
        {message && <p className="text-gray-700 mb-4">{message}</p>}

        <div className="flex flex-col items-center justify-center gap-3 mt-2">
          {initializing ? (
            <span className="text-gray-500 text-sm">Loading...</span>
          ) : (
            <>
              <div className="text-xs text-gray-500">
                Current: {isSubscribed ? "Subscribed" : "Unsubscribed"}
              </div>
              <button
                disabled={loading || !email || !token}
                onClick={() => callApi(isSubscribed ? "unsubscribe" : "subscribe")}
                className={`px-4 py-2 rounded text-white ${loading ? "opacity-60" : ""}`}
                style={{ backgroundColor: isSubscribed ? "#ef4444" : "#10b981" }}
              >
                {loading ? "Processing..." : isSubscribed ? "Unsubscribe" : "Subscribe"}
              </button>
            </>
          )}
        </div>

        <a
          href="/"
          className="inline-block mt-5 px-4 py-2 rounded bg-primary text-white"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
};

export default Unsubscribe;


