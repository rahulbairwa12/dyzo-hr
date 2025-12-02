import { fetchAuthGET, fetchAuthPatch, fetchGET, fetchPOST } from '@/store/api/apiSlice';
import { login } from '@/store/authReducer';
import { Icon } from '@iconify/react'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { toast } from "react-toastify";

const Toggle = ({ checked, onChange, disabled, label, description }) => {
  return (
    <label className={`flex items-start justify-between gap-4 py-2 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span className="flex-1">
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {description && (
          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</span>
        )}
      </span>
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only peer"
        />
        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none  peer-focus:ring-electricBlue-50/30 dark:peer-focus:ring-electricBlue-100 rounded-full peer dark:bg-gray-700 
        peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
        after:start-[2px] after:bg-white after:border-gray-300 after:border 
        after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 
        peer-checked:bg-electricBlue-50 dark:peer-checked:bg-electricBlue-50">
        </div>
    </label>
  );
};

// Custom Notifications Dropdown Component
const CustomNotificationsDropdown = ({ settings, handleChange, saving, customNotifications }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <span>Custom notifications</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 divide-y divide-neutral-50">
          {customNotifications.map((notification) => (
            <Toggle
              key={notification.key}
              checked={!!settings[notification.key]}
              onChange={handleChange(notification.key)}
              disabled={saving}
              label={notification.label}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationSettings = ({employeeDetail}) => {
    const dispatch = useDispatch();
    const [settings, setSettings] = useState({});
    const [initialSettings, setInitialSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const userInfo = useSelector((state) => state.auth.user);

    const sections = useMemo(() => ([
    {
        title: "Email",
        items: [
        { key: "email_task_updates", label: "Task updates" },
        { key: "email_project_updates", label: "Project updates" },
        { key: "email_mentions", label: "Mentions" },
        { key: "email_daily_working_hours", label: "Daily working hours" },
        ],
    },
    {
        title: "Browser",
        items: [
        { key: "browser_task_updates", label: "Task updates" },
        { key: "browser_project_updates", label: "Project updates" },
        { key: "browser_mentions", label: "Mentions" },
        ],
    },
    {
        title: "Mobile",
        items: [
        { key: "mobile_task_updates", label: "Task updates" },
        { key: "mobile_project_updates", label: "Project updates" },
        { key: "mobile_mentions", label: "Mentions" },
        ],
    },
    {
        title: "WhatsApp",
        items: [
        { key: "whatsapp_enabled", label: "Enable WhatsApp Notifications", description: "Verification required" },
        { key: "whatsapp_daily_summary", label: "Daily task summary" },
        ],
        customNotifications: [
        { key: "whatsapp_task_assign", label: "Get task assignment notifications" },
        // { key: "whatsapp_task_updates", label: "Get task update notifications" },
        { key: "whatsapp_mentions", label: "Mentions" },
        ],
    },
    // {
    //   title: "General",
    //   items: [
    //     { key: "do_not_disturb", label: "Do not disturb", description: "Silence notifications when enabled" },
    //   ],
    // },
    ]), []);

    useEffect(() => {
    let cancelled = false;
    const fetchSettings = async () => {
        try {
        setLoading(true);
        const data = await fetchAuthGET(`${import.meta.env.VITE_APP_DJANGO}/notification-settings/${employeeDetail?._id}/`, false);
        if (!cancelled) {
            if (data?.error) {
            // setError("Failed to load settings");
            } else {
            setSettings(data?.data || {});
            setInitialSettings(data?.data || {});
            // setError("");
            }
        }
        } catch (e) {
        // if (!cancelled) setError("Failed to load settings");
        } finally {
        if (!cancelled) setLoading(false);
        }
    };
    if (employeeDetail?._id) fetchSettings();
    return () => { cancelled = true; };
    }, [employeeDetail?._id]);

    const handleChange = (key) => (e) => {
        const isChecked = e.target.checked;
        setSettings((prev) => {
        const newSettings = { ...prev, [key]: isChecked };

        if (key === "do_not_disturb") {
            // If DND is enabled, disable all other settings
            if (isChecked) {
            // Store current settings before disabling them
            sections.forEach(section => {
                section.items.forEach(item => {
                if (item.key !== "do_not_disturb" && prev[item.key] !== undefined) {
                    // Preserve the state if it exists, otherwise it will be false by default
                    // This part is conceptually handled by reverting to initialSettings.
                    // For the UI, we just set them to false when DND is on.
                    newSettings[item.key] = false;
                }
                });
            });
            } else {
            // If DND is disabled, restore initial settings
            // Only restore settings other than do_not_disturb itself
            const restoredSettings = {};
            sections.forEach(section => {
                section.items.forEach(item => {
                if (item.key !== "do_not_disturb") {
                    restoredSettings[item.key] = initialSettings[item.key] !== undefined ? initialSettings[item.key] : true; // Default to true if not in initial settings
                }
                });
            });
            return { ...restoredSettings, [key]: isChecked }; // Ensure DND itself is updated
            }
        }
        return newSettings;
        });
    };

    const sendWhatsAppOtp = async () => {
    try {
        setSendingOtp(true);
        const url = `${import.meta.env.VITE_APP_DJANGO}/api/whatsapp/send-otp/${employeeDetail?._id}/`;
        const data = await fetchGET(url, false);
        if (data?.status === 0) {
        toast.success(data?.message || "OTP sent successfully");
        const waLink = data?.wa_link || data?.waLink || data?.link;
        if (waLink) window.open(waLink, "_blank", "noopener,noreferrer");
        setOtpModalOpen(true);
        } else {
        toast.error(data?.message || "Failed to send OTP");
        setSettings((prev) => ({ ...prev, whatsapp_enabled: false }));
        }
    } catch (err) {
        toast.error("Failed to send OTP");
        setSettings((prev) => ({ ...prev, whatsapp_enabled: false }));
    } finally {
        setSendingOtp(false);
    }
    };
    
    // WhatsApp OTP: verify
    const verifyWhatsAppOtp = async () => {
    try {
        if (!otp) {
        toast.error("Enter OTP");
        return;
        }
        setVerifyingOtp(true);
        const url = `${import.meta.env.VITE_APP_DJANGO}/api/whatsapp/verify-otp/${employeeDetail?._id}/`;
        const data = await fetchPOST(url, { body: { otp: Number(otp) } });
        if (data?.status === 0) {
        toast.success(data?.message || "WhatsApp verified");
        setSettings((prev) => ({
            ...prev,
            whatsapp_verified: true,
            whatsapp_enabled: true,
            whatsapp_daily_summary: true,
        }));
        // Update employeeDetail in auth state and cookies
        try {
            dispatch(login({ ...(employeeDetail || {}), whatsapp_verified: true }));
        } catch (_) { }
        setOtpModalOpen(false);
        setOtp("");
        } else {
        toast.error(data?.message || "Verification failed");
        setSettings((prev) => ({ ...prev, whatsapp_enabled: false })); // 🔁 revert
        }
    } catch (err) {
        toast.error("Verification failed");
    } finally {
        setVerifyingOtp(false);
    }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        setSaving(true);
        const response = await fetchAuthPatch(
        `${import.meta.env.VITE_APP_DJANGO}/notification-settings/${employeeDetail?._id}/`,
        { body: settings }
        );
    
        if (response.status == 1) {
        setSettings(response.data);
        setInitialSettings(response.data); // Update initial settings on successful save
        // setError("");
        toast.success("Settings saved successfully!");
        } else {
        // setError(response.message || "Failed to save settings");
        toast.error(response.message || "Failed to save settings");
        }

    } catch (e) {
        // setError("Failed to save settings");
        toast.error("Failed to save settings");
    } finally {
        setSaving(false);
    }
    };

    if (loading) {
        return (
        <div className="bg-white rounded-md p-4 min-h-[80vh]">
        <div className="border border-neutral-50 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md p-4">
            <div className="h-8 w-60 bg-slate-200 dark:bg-slate-700 rounded mb-4 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-slate-100 dark:bg-slate-700/50 rounded mb-2 animate-pulse" />
                ))}
            </div>
        </div>
        </div>
        );
    };

  return (
    <>
        <div className="border rounded-lg p-4 my-4 space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-4">
                        <h5 className="text-lg">Do not disturb</h5>
                        <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings["do_not_disturb"]}
                            onChange={handleChange("do_not_disturb")}
                            className="sr-only peer"
                        />
                        <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none  peer-focus:ring-electricBlue-50/30 dark:peer-focus:ring-electricBlue-100 rounded-full peer dark:bg-gray-700 
                        peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                        peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                        after:start-[2px] after:bg-white after:border-gray-300 after:border 
                        after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 
                        peer-checked:bg-electricBlue-50 dark:peer-checked:bg-electricBlue-50">
                        </div>
                        </label>
                    </div>
                    <p className="text-gray-500 text-sm">Silence notifications when enabled</p>
                </div>
                <button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded disabled:opacity-60"
                    disabled={saving}
                    onClick={handleSubmit}
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections?.map((section , i)=>(
                    <div key={i} className="border rounded-lg">
                        <div className="border-b px-4 py-2">
                            <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
                        </div>
                        <div className="px-4">
                            {
                                section?.title === "WhatsApp" ? 
                                <>
                                    <Toggle
                                        key="whatsapp_enabled"
                                        checked={!!settings.whatsapp_enabled}
                                        onChange={(e) => {
                                            const next = e.target.checked;
                                            const isWaVerified = !!(settings.whatsapp_verified || (employeeDetail && employeeDetail.whatsapp_verified));
                                            if (next) {
                                              if (isWaVerified) {
                                                setSettings((prev) => ({ ...prev, whatsapp_enabled: true }));
                                              } else{
                                                setSettings((prev) => ({ ...prev, whatsapp_enabled: true }));
                                                sendWhatsAppOtp().catch(() => {
                                                  // If sending fails, revert immediately
                                                  setSettings((prev) => ({ ...prev, whatsapp_enabled: false }));
                                                });
                                              }
                                            }else {
                                              // Turning OFF
                                              setSettings((prev) => ({ ...prev, whatsapp_enabled: false }));
                                            }
                                        }}
                                        disabled={saving || sendingOtp}
                                        label="Enable WhatsApp Notifications"
                                        description={(settings.whatsapp_verified || (employeeDetail && employeeDetail.whatsapp_verified)) ? "Verified" : "Verification required"}
                                    />

                                    <Toggle
                                        key="whatsapp_daily_summary"
                                        checked={!!settings.whatsapp_daily_summary}
                                        onChange={handleChange("whatsapp_daily_summary")}
                                        disabled={saving || !(settings.whatsapp_verified || (employeeDetail && employeeDetail.whatsapp_verified))}
                                        label="Daily task summary"
                                    />

                                    {(settings.whatsapp_verified || (employeeDetail && employeeDetail.whatsapp_verified)) && (
                                        <CustomNotificationsDropdown
                                            settings={settings}
                                            handleChange={handleChange}
                                            saving={saving}
                                            customNotifications={section.customNotifications}
                                        />
                                    )}
                                </> : 
                                section.items.map((item) => (
                                    <Toggle
                                        key={item.key}
                                        checked={settings[item.key]}
                                        onChange={handleChange(item.key)}
                                        disabled={saving || (settings.do_not_disturb && item.key !== "do_not_disturb")}
                                        label={item.label}
                                        description={item.description}
                                    />
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
        </div>
         {/* OTP Modal */}
        {otpModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black-500/40">
            <div className="bg-white rounded-md w-full max-w-sm p-4 shadow-lg">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Verify WhatsApp</h4>
              <p className="text-xs text-slate-600 mb-3">Enter the OTP you received on WhatsApp.</p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!verifyingOtp) verifyWhatsAppOtp();
                  }
                }}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Enter OTP"
              />
              <div className="flex items-center justify-end gap-2">
                <button type="button" className="px-3 py-1.5 text-sm rounded bg-slate-100" 
                onClick={() => { 
                  setOtpModalOpen(false); 
                  setOtp(""); 
                  setSettings((prev) => ({ ...prev, whatsapp_enabled: false })); // 🔁 revert
                }}>
                  Cancel
                </button>
                <button type="button" className="px-3 py-1.5 text-sm rounded bg-violet-600 text-white disabled:opacity-60" disabled={verifyingOtp} onClick={verifyWhatsAppOtp}>
                  {verifyingOtp ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  )
}

export default NotificationSettings