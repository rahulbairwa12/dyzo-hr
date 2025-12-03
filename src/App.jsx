import React, { lazy, Suspense, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation, Outlet, useNavigate } from "react-router-dom";
import { AuthProvider } from "./protectedRoutes/AuthContext";
import ProtectedRoute from "./protectedRoutes/ProtectedRoute";
import SuperAdminRoute from "./protectedRoutes/SuperAdminRoute";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { HelmetProvider } from "react-helmet-async";
import { Helmet } from "react-helmet-async";
const EmployeeManagement = lazy(
  () => import("./pages/manage/employees/EmployeeManagement"),
);
const Notice = lazy(() => import("./pages/manage/notices/Notice"));
const Leaves = lazy(() => import("./pages/leaves"));
const LeaveDetail = lazy(() => import("./pages/leaves/LeaveDetail"));
const Screenshot = lazy(() => import("./pages/screenshot/Screenshot"));
const RegisterStep = lazy(() => import("./pages/auth/RegisterStep"));
const VerifyOtp = lazy(() => import("./pages/auth/VerifyOtp"));
const SetPasswordScreen = lazy(() => import("./pages/auth/SetPasswordScreen"));
const ForgotPass = lazy(() => import("./pages/auth/forgot-password"));
const LockScreen = lazy(() => import("./pages/auth/lock-screen"));
const Error = lazy(() => import("./pages/404"));
const Salary = lazy(() => import("./pages/salary"));
const UpdatePassword = lazy(() => import("./pages/auth/update-password"));
const Attendance = lazy(() => import("./pages/attendance/attendance"));
const CalendarAuth = lazy(() => import("./pages/calendar/CalendarAuth"));
const Calendar = lazy(() => import("./pages/calendar/Calendar"));
import Layout from "./layout/Layout";
import AuthLayout from "./layout/AuthLayout";
import PublicRoute from "./protectedRoutes/PublicRoute";
const PricingPage = lazy(() => import("./pages/utility/pricing"));
const ComingSoonPage = lazy(() => import("./pages/utility/coming-soon"));
const UnderConstructionPage = lazy(
  () => import("./pages/utility/under-construction"),
);
const FaqPage = lazy(() => import("./pages/utility/faq"));
const Profile = lazy(() => import("./pages/userprofile/UserProfile"));
const UserProfile = lazy(() => import("./pages/userprofile/index"));
const Performance = lazy(() => import("./pages/performance/UserPerformance"));
const InviteEmployee = lazy(
  () => import("./pages/inviteemployee/InviteEmployee"),
);
const NotificationPage = lazy(() => import("./pages/utility/notifications"));
const HRControlDesk = lazy(() => import("./pages/Hr/hrcontroldesk"));
const VacancyInformation = lazy(() => import("./pages/Hr/VacancyInformation"));
const VacanciesList = lazy(() => import("./pages/Hr/ViewVacancies"));
const AddVacancy = lazy(() => import("./pages/Hr/AddVacancy"));
const ViewApplicants = lazy(() => import("./pages/Hr/ViewApplicants"));
const ApplicantInfo = lazy(() => import("./pages/Hr/ApplicantDetail"));
const EditVacancy = lazy(() => import("./pages/Hr/EditVacancy"));
const ScheduledInterviews = lazy(
  () => import("./pages/Hr/ScheduledInterviews"),
);
const InterviewRemark = lazy(() => import("./pages/Hr/InterviewRemark"));
const ViewScheduleInterview = lazy(
  () => import("./pages/Hr/ViewScheduleInterview"),
);
const RescheduleInterview = lazy(
  () => import("./pages/Hr/RescheduleInterview"),
);
const SlackIntegrationsSuccess = lazy(
  () => import("./pages/Hr/SlackIntegrationsSuccess"),
);
const SlackIntegrationsError = lazy(
  () => import("./pages/Hr/SlackIntegrationsError"),
);

//Expense pages
const Expense = lazy(() => import("./pages/expense/expense"));
const ExpenseDetail = lazy(() => import("./pages/expense/expenseDetails"));
const AddExpense = lazy(() => import("./pages/expense/addExpense"));
const EditExpense = lazy(() => import("./pages/expense/editExpense"));
const AddUser = lazy(() => import("./pages/plans/add-user"));
const ModifySubscription = lazy(
  () => import("./pages/plans/ModifySubscription"),
);

//Complain page
const Complain = lazy(() => import("./pages/complain/complain"));
const ViewComplain = lazy(() => import("./pages/complain/viewComplain"));

//Reference page
const Reference = lazy(() => import("./pages/reference/reference"));
const ReferenceDetails = lazy(
  () => import("./pages/reference/referenceDetails"),
);

// app page

const EmailPage = lazy(() => import("./pages/app/email"));
const ChatPage = lazy(() => import("./pages/app/chat"));



import "./components/ui/global.css";

import Loading from "@/components/Loading";
import ClientLayout from "./layout/ClientLayout";
import TermAndCondition from "./pages/TermAndCondition";
import { EmployeeContext } from "./context/EmployeeContext";
const RootPage = lazy(() => import("./pages/rootpage/RootPage"));
import HomePage from "./pages/homePage/index";
import { UserAuthCheck } from "./context/UserAuth";
import JobApply from "./pages/Hr/JobApply";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import RefundPolicy from "./pages/RefundPolicy";
const Unsubscribe = lazy(() => import("./pages/utility/Unsubscribe"));

import ContactUs from "./pages/ContactUs";
import Invoice from "./components/invoice/Invoice";
import Onboarding from "./components/onboarding/Onboarding";
import ExtensionTermAndCondition from "./pages/ExtensionTermAndCondition";
import LoginStep from "./pages/auth/LoginStep";
import SlackLoginStep from "./pages/auth/SlackLoginStep";
import { PlanCheck } from "./context/PlanCheck";
import DesktopLoginStep from "./pages/auth/DesktopLoginStep";
import DesktopLoginSuccess from "./pages/auth/DesktopLoginSuccess";
import DesktopLoginFaild from "./pages/auth/DesktopLoginFaild";
import NewPlan from "./pages/plans/NewPlan";
import { useSelector, useDispatch } from "react-redux";
import { fetchPlanData, checkUserLimit } from "./store/planSlice";
import { notificationReceived, notificationCountsPatched } from "@/store/notificationsSlice";

import ExpiredInvitationModal from "./pages/inviteemployee/ExpiredInvitationModal";

import PushPermissionGate from "./components/notifications/PushPermissionGate";
import Swal from "sweetalert2";
import LoginForm from "./pages/auth/common/login-form";
import WhatsNewModal from "./components/WhatsNewModal";
import Changelog from "./pages/changelog";
import DownloadPage from "./pages/homePage/DownloadPage";

const Settings = lazy(() => import("./pages/settings/Setting"));
const NewSettings = lazy(() => import("./pages/settings/index"));
const CompanySetting = lazy(() => import("./components/settings/Company"));
const NotificationSettings = lazy(() => import("./components/settings/NotificationSettings"));
const LanguageSetting = lazy(() => import("./components/settings/Language"));
const ScreenshotSetting = lazy(
  () => import("./components/settings/Screenshot"),
);
const ChangePassword = lazy(
  () => import("./components/settings/ChangePassword"),
);
const LeaveSetting = lazy(() => import("./components/settings/LeaveSetting"));
const DyzoCustomizer = lazy(
  () => import("./components/settings/DyzoCustomizer"),
);
const AddressSetting = lazy(
  () => import("./components/settings/AddressSetting"),
);
const SubscriptionSetting = lazy(
  () => import("./components/settings/SubscriptionSetting"),
);
const ApiDocumentation = lazy(() => import("./pages/utility/ApiDocumentation/index"));

// Developer Portal
const DeveloperPortal = lazy(() => import("./pages/developer/DeveloperPortal"));
const DeveloperDashboard = lazy(() => import("./pages/developer/DeveloperDashboard"));



//Asana imports here

const EmployeeInviteRegister = lazy(
  () => import("./pages/inviteemployee/EmployeeInviteRegister"),
);
// Asan imports end here


const Holiday = lazy(() => import("./pages/manage/holiday/Holiday"));
const Plans = lazy(() => import("./pages/plans/Plans"));
const PlanPage = lazy(() => import("./pages/subscriptions/PlanPage"));
const UserPlans = lazy(() => import("./pages/plans/UserPlan"));
const DesktopGoogleLogin = lazy(
  () => import("./pages/plans/DesktopGoogleLogin"),
);
const LandingPagePricing = lazy(
  () => import("./pages/Pricing"),
);
const BlackFridaySell = lazy(() => import("./pages/plans/BlackFridaySell"));
const PaymentStatus = lazy(() => import("./pages/plans/PaymentStatus"));
const AllPlans = lazy(() => import("./pages/plans/index"));
const StorageTransactionTable = lazy(
  () => import("./pages/plans/StorageTransactionTable"),
);
const UserTransactionTable = lazy(
  () => import("./pages/plans/UserTransactionTable"),
);
const InviteEmployeeOnboarding = lazy(
  () => import("./components/onboarding/InviteEmployeeOnboarding"),
);
const Thankyou = lazy(() => import("./pages/Hr/Thankyou"));

//super user route
const CompanyList = lazy(() => import("./superuser/CompanyList"));
const CompanyDetail = lazy(() => import("./superuser/CompanyDetail"));

//send notification testing route
const SendNotification = lazy(
  () => import("./pages/sendNotification/SendNotification"),
);

//Inbox
const Inbox = lazy(() => import("./pages/Inbox/index"));

// Trash


// Import addition at top with other lazy imports
const TransactionTable = lazy(() => import("./pages/plans/TransactionTable"));

// Automation

const EmailOtpLogin = React.lazy(() => import("./pages/auth/EmailOtpLogin"));
const EmailOtpVerify = React.lazy(() => import("./pages/auth/EmailOtpVerify"));

const clientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "478882105786-4chlojuitg5dad2iu4skc95uihifoj4q.apps.googleusercontent.com";
const App = () => {
  const userInfo = useSelector((state) => state.auth.user);
  const { showLimitModal } = useSelector((state) => state.plan);
  const dispatch = useDispatch();
  const companyId = Number(userInfo?.companyId);
  const wsRef = useRef(null);
  const pingRef = useRef(null);
  const navigate = useNavigate();


  const showNotificationToast = (notification) => {
    if (!notification) return;

    // ✅ Allow only these titles
    const allowedTitles = ["Chat Liked", "Chat Unliked", "Task Chat Mention", "Task Liked", "Task Unliked"];
    if (!allowedTitles.includes(notification.title)) {
      return; // skip other notifications
    }
    if (notification.sender == userInfo?._id) {
      return;
    }

    const baseURL = import.meta.env.VITE_APP_DJANGO;
    const title = notification.title || "New notification";
    const message = notification.message || "";
    const avatarPath =
      notification.sender_profile_picture ||
      notification.sender_profile ||
      notification.image ||
      "";
    const avatar =
      avatarPath && baseURL && !String(avatarPath).startsWith("http")
        ? `${baseURL}${avatarPath}`
        : avatarPath;

    // ✅ Force redirect to provided url if available
    const detailPath = notification.url_to_redirect || "/dashboard";

    // Category-based accent and icon
    const category = notification.category || "";
    const categoryToStyle = {
      success: { color: "#16a34a", emoji: "✅" },
      error: { color: "#dc2626", emoji: "⚠️" },
      warning: { color: "#f59e0b", emoji: "⚠️" },
      info: { color: "#2563eb", emoji: "🔔" },
      task: { color: "#7c3aed", emoji: "📝" },
      message: { color: "#0ea5e9", emoji: "💬" },
      leave: { color: "#10b981", emoji: "🌿" },
      project: { color: "#8b5cf6", emoji: "📁" },
    };
    const { color: accentColor, emoji } =
      categoryToStyle[category] || categoryToStyle.info;

    const html = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:4px; align-self:stretch; background:${accentColor}; border-radius:8px;"></div>
        ${avatar
        ? `<img src="${avatar}" alt="avatar" style="width:40px;height:40px;border-radius:12px;object-fit:cover;border:1px solid rgba(0,0,0,0.06)" />`
        : `<div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(37,99,235,0.08);font-size:18px;">${emoji}</div>`
      }
        <div style="display:flex; flex-direction:column; max-width:360px;">
          <div style="font-weight:700; font-size:14px; color:#0f172a; margin-bottom:2px;">${title}</div>
          <div style="font-size:12px; color:#334155; word-break:break-word; white-space:normal; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${message}</div>
        </div>
      </div>
    `;

    Swal.fire({
      toast: true,
      position: "top-end",
      background: "#ffffff",
      color: "#0f172a",
      icon: undefined,
      html,
      showConfirmButton: false,

      heightAuto: false,
      // Keep toast open ~6.5s with progress bar
      timer: 6500,
      timerProgressBar: true,
      width: 440,
      customClass: {
        popup: "swal2-toast dyzo-toast",
        timerProgressBar: "dyzo-toast-progress",
      },
      didOpen: (toast) => {
        // Play a short beep on toast open
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const audioCtx = new AudioCtx();
            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = 880; // A5
            oscillator.connect(gain);
            gain.connect(audioCtx.destination);
            // Quick attack then decay
            const now = audioCtx.currentTime;
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            oscillator.onended = () => {
              try { audioCtx.close && audioCtx.close(); } catch { }
            };
          }
        } catch { }
        toast.style.boxShadow = "0 10px 25px rgba(2,6,23,0.08)";
        toast.style.border = "1px solid rgba(2,6,23,0.06)";
        toast.style.borderRadius = "14px";
        toast.style.transform = "scale(0.92)";
        toast.style.opacity = "0";
        toast.style.transition =
          "transform 220ms ease, opacity 220ms ease";
        requestAnimationFrame(() => {
          toast.style.transform = "scale(1)";
          toast.style.opacity = "1";
        });
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
        // Make the built-in close (X) only close the toast, not redirect
        const closeBtn = toast.querySelector('.swal2-close');
        if (closeBtn) {
          closeBtn.style.outline = 'none';
          closeBtn.style.boxShadow = 'none';
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Swal.close();
          });
        }
        toast.addEventListener("click", () => {
          Swal.close();
          if (detailPath) {
            // ✅ Direct redirect
            window.location.href = detailPath;
          }
        });
      },
    });
  };

  useEffect(() => {
    if (import.meta.env.PROD && companyId !== 2) {
      setTimeout(() => {
        (function (c, l, a, r, i, t, y) {
          c[a] =
            c[a] ||
            function () {
              (c[a].q = c[a].q || []).push(arguments);
            };
          t = l.createElement(r);
          t.async = 1;
          t.src = "https://www.clarity.ms/tag/" + i;
          y = l.getElementsByTagName(r)[0];
          y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", "od76c9jkk7");
      }, 3000);
    }

    // Call fetchPlanData whenever the app loads, if companyId exists
    if (userInfo?.companyId) {
      dispatch(fetchPlanData(userInfo.companyId)).then(() => {
        // After fetching plan data, check user limits
        dispatch(checkUserLimit());
      });
    }
  }, [companyId, userInfo, dispatch]);

  useEffect(() => {
    if (!userInfo?._id) return;

    const ws = new WebSocket(`${import.meta.env.VITE_WEBSOCKET_URL}notifications/user/${userInfo._id}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      try { ws.send(JSON.stringify({ type: "ping" })); } catch { }
      pingRef.current = setInterval(() => {
        try { ws.send(JSON.stringify({ type: "ping" })); } catch { }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "notification_update") {
          const { action, notification, count, unread_count } = data;
          if (action === "created" && notification) {
            dispatch(notificationReceived(notification));
            showNotificationToast(notification);
          }
          if (typeof count === 'number' || typeof unread_count === 'number') {
            dispatch(notificationCountsPatched({ count, unread_count }));
          }
        }
      } catch { }
    };

    ws.onerror = () => { };
    ws.onclose = () => { };

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      try { ws.close(); } catch { }
      wsRef.current = null;
    };
  }, [userInfo?._id, dispatch]);

  return (
    <HelmetProvider>
      <Helmet>
        <link rel="canonical" href="https://dyzo.ai" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Helmet>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AuthLayout />}>
              <Route path="/" element={<PublicRoute />}>
                <Route path="/" element={<HomePage />} />
              </Route>

              <Route path="/home" element={<PublicRoute />}>
                <Route path="/home" element={<HomePage />} />
              </Route>
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/api-documentation" element={<ApiDocumentation />} />

              {/* Developer Portal Routes - Public */}
              <Route path="/developer" element={<DeveloperPortal />} />
              <Route path="/developer/dashboard" element={<DeveloperDashboard />} />

              <Route path="/login" element={<PublicRoute />}>
                <Route path="/login" element={<LoginStep />} />
              </Route>

              <Route path="/login-desktop" element={<DesktopLoginStep />} />

              <Route path="/register" element={<PublicRoute />}>
                <Route path="/register" element={<RegisterStep />} />
              </Route>
              <Route path="/verify-otp" element={<VerifyOtp />} />

              <Route path="/user-register" element={<PublicRoute />}>
                <Route path="/user-register" element={<SetPasswordScreen />} />
              </Route>

              <Route path="/forgot-password" element={<ForgotPass />} />
              <Route path="/updatepass/:id" element={<UpdatePassword />} />
              <Route path="/lock-screen" element={<LockScreen />} />

              <Route path="/expired" element={<ExpiredInvitationModal />} />

              <Route path="invite" element={<EmployeeInviteRegister />} />
              <Route path="welcome" element={<Onboarding />} />
              <Route
                path="user-onboarding"
                element={<InviteEmployeeOnboarding />}
              />
              <Route
                path="vacancy/:vacancyId"
                element={<VacancyInformation />}
              />
              <Route path="vacancy/apply/:jobid" element={<JobApply />} />
              <Route path="/thankyou" element={<Thankyou />} />
              <Route path="/contactus" element={<ContactUs />} />
              <Route path="/invoice" element={<Invoice />} />
              <Route path="/pricing" element={<LandingPagePricing />} />
              <Route path="/desktop-login" element={<DesktopGoogleLogin />} />
              <Route path="/login-Slack" element={<SlackLoginStep />} />
              <Route path="/email-otp-login" element={<EmailOtpLogin />} />
              <Route path="/email-otp-verify" element={<EmailOtpVerify />} />
            </Route>

            <Route element={<ProtectedRoute />}>

              <Route element={<Layout />}>
                <Route
                  element={
                    <PlanCheck>
                      <Outlet />
                    </PlanCheck>
                  }
                >
                  <Route path="dashboard" element={<HRControlDesk />} />
                  <Route path="HR-contrl-desk" element={<HRControlDesk />} />
                  <Route path="vacancies-list" element={<VacanciesList />} />
                  <Route path="Add-Vacancy" element={<AddVacancy />} />
                  <Route path="View-Applicants" element={<ViewApplicants />} />
                  <Route
                    path="ApplicantInfo/:applicationId"
                    element={<ApplicantInfo />}
                  />
                  <Route path="edit-vacancy/:jobid" element={<EditVacancy />} />
                  <Route
                    path="scheduled-interviews"
                    element={<ScheduledInterviews />}
                  />
                  <Route
                    path="Interview-remark"
                    element={<InterviewRemark />}
                  />
                  <Route
                    path="view-schedule-interview/:interviewId"
                    element={<ViewScheduleInterview />}
                  />
                  <Route
                    path="reschedule-interview/:interviewId"
                    element={<RescheduleInterview />}
                  />

                  <Route path="employees" element={<EmployeeManagement />} />
                  <Route
                    path="notices-management"
                    element={
                      <EmployeeContext>
                        <Notice />
                      </EmployeeContext>
                    }
                  />

                  {/* Leaves */}
                  <Route path="leaves" element={<Leaves />} />
                  <Route
                    path="leaves/leave-detail/:leaveId"
                    element={<LeaveDetail />}
                  />

                  {/* Salary */}
                  <Route path="salary-management" element={<Salary />} />

                  {/* Attendance */}
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="calendar" element={<CalendarAuth />} />
                  <Route path="calendar/space" element={<Calendar />} />

                  <Route path="settings" element={<NewSettings />} />
                  <Route path="profile/:userId" element={<UserProfile />} />

                  <Route path="expense" element={<Expense />} />
                  <Route
                    path="expense/:expenseId"
                    element={<ExpenseDetail />}
                  />
                  <Route path="expense/add" element={<AddExpense />} />
                  <Route
                    path="expense/edit/:expenseId"
                    element={<EditExpense />}
                  />
                  <Route path="complain" element={<Complain />} />
                  <Route
                    path="complain/:complainId"
                    element={<ViewComplain />}
                  />
                  <Route path="reference" element={<Reference />} />
                  <Route
                    path="reference/:referenceId"
                    element={<ReferenceDetails />}
                  />

                  <Route path="inbox" element={<Inbox />} />

                  {/* Settings Sub-routes */}
                  <Route path="settings/company" element={<CompanySetting />} />
                  <Route path="settings/notifications" element={<NotificationSettings />} />
                  <Route path="settings/language" element={<LanguageSetting />} />
                  <Route path="settings/screenshot" element={<ScreenshotSetting />} />
                  <Route path="settings/change-password" element={<ChangePassword />} />
                  <Route path="settings/leave" element={<LeaveSetting />} />
                  <Route
                    path="settings/customizer"
                    element={<DyzoCustomizer />}
                  />
                  <Route path="settings/address" element={<AddressSetting />} />
                  <Route
                    path="settings/subscription"
                    element={<SubscriptionSetting />}
                  />

                  <Route path="holiday" element={<Holiday />} />
                  <Route path="add-users" element={<AddUser />} />

                  {/* 404 Redirect */}
                  <Route path="*" element={<Navigate to="/404" />} />
                </Route>
              </Route>
            </Route>



            <Route
              path="/download"
              element={
                <Suspense fallback={<Loading />}>
                  <DownloadPage />
                </Suspense>
              }
            />
            <Route
              path="/terms-and-conditions"
              element={
                <Suspense fallback={<Loading />}>
                  <TermAndCondition />
                </Suspense>
              }
            />
            <Route
              path="/extension-terms-and-conditions"
              element={
                <Suspense fallback={<Loading />}>
                  <ExtensionTermAndCondition />
                </Suspense>
              }
            />

            <Route
              path="/privacy-policy"
              element={
                <Suspense fallback={<Loading />}>
                  <PrivacyPolicy />
                </Suspense>
              }
            />
            <Route
              path="/refund-policy"
              element={
                <Suspense fallback={<Loading />}>
                  <RefundPolicy />
                </Suspense>
              }
            />
            <Route
              path="/cookie-policy"
              element={
                <Suspense fallback={<Loading />}>
                  <CookiePolicy />
                </Suspense>
              }
            />
            <Route
              path="/unsubscribe"
              element={
                <Suspense fallback={<Loading />}>
                  <Unsubscribe />
                </Suspense>
              }
            />
            <Route
              path="slack/SlackIntegrationsSuccess"
              element={<SlackIntegrationsSuccess />}
            />
            <Route
              path="slack/SlackIntegrationsError"
              element={<SlackIntegrationsError />}
            />
            <Route
              path="desktop-login-success"
              element={<DesktopLoginSuccess />}
            />
            <Route path="desktop-login-faild" element={<DesktopLoginFaild />} />
            <Route
              path="/404"
              element={
                <Suspense fallback={<Loading />}>
                  <Error />
                </Suspense>
              }
            />

            <Route
              path="/coming-soon"
              element={
                <Suspense fallback={<Loading />}>
                  <ComingSoonPage />
                </Suspense>
              }
            />

            <Route
              path="/under-construction"
              element={
                <Suspense fallback={<Loading />}>
                  <UnderConstructionPage />
                </Suspense>
              }
            />
          </Routes>
        </AuthProvider>
      </GoogleOAuthProvider>
      <PushPermissionGate />
      <WhatsNewModal />
    </HelmetProvider>
  );
};

export default App;
