import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 
import Icon from "../ui/Icon";
import { Link } from "react-router-dom";
import { formatDateWithMonthName } from "@/helper/helper";
import Cards from "./Cards";
import EmployeeDetailModal from "./EmployeeDetailModal";
import Tooltip from "../ui/Tooltip";
import OtpModal from "./OtpModal";
import { fetchAuthPost } from "@/store/api/apiSlice";
import { djangoBaseURL } from "@/helper";
import { useSelector } from "react-redux";

export const InfoCard = ({
  employeeDetail,
  fetchEmployeeDetail,
  showPersonalInfoModal,
  setShowPersonalInfoModal,
}) => {
  const userInfo = useSelector((state) => state.auth.user);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handy booleans
  const isAdmin = userInfo?.isAdmin;
  const isSelf = employeeDetail?._id === userInfo?._id;

  // Only allow "edit personal info" if admin or self
  const onClickEdit = () => {
    if (isAdmin || isSelf) {
      setShowPersonalInfoModal(true);
    }
  };

  // Send OTP
  const otpSend = async () => {
    try {
      setIsLoading(true);
      const response = await fetchAuthPost(`${djangoBaseURL}/verify-email/`, {
        body: { email: employeeDetail?.email },
      });
      if (response.status) {
        toast.success("OTP sent to your registered email.");
        setShowOtpModal(true); 
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error("An error occurred while sending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP
  const handleOtpSubmit = async () => {
    try {
      const response = await fetchAuthPost(`${djangoBaseURL}/api/verify-otp/`, {
        body: {
          otp,
          email: employeeDetail?.email,
        },
      });
      if (response.status) {
        toast.success("OTP Verified Successfully");
        setShowOtpModal(false);
        // Refresh employee details or perform other actions
        fetchEmployeeDetail();
      } else {
        toast.error("OTP Verification Failed");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("An error occurred while verifying OTP.");
    }
  };

  return (
    <div>
      {/* 
        We pass onClick={onClickEdit} to Cards, 
        but if user is neither self nor admin, 
        that won't do anything.
      */}
      <Cards
        title="Information"
        onClick={onClickEdit} 
        className="iconOne"
      >
        <ul className="list space-y-8">
          {/* Email */}
          <li className="flex space-x-3 rtl:space-x-reverse items-center">
            <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
              <Icon icon="heroicons:envelope" />
            </div>
            <div className="flex-1">
              <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                EMAIL
              </div>
              <div className="flex items-center">
                <Link
                  to={`mailto:${employeeDetail?.email}`}
                  className="text-base text-slate-600 dark:text-slate-50 mr-2"
                  style={{
                    overflowWrap: "break-word",
                    wordBreak: "break-all",
                    maxWidth: "200px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {employeeDetail?.email}
                </Link>
                {/* If this is *my* own record, show verification icon or option */}
                {isSelf && (
                  employeeDetail?.mailVerification ? (
                    <Tooltip
                      title="Shift-away"
                      content="Your Mail is Verified"
                      placement="top"
                      className="btn btn-outline-dark"
                      arrow
                      animation="shift-away"
                    >
                      <div>
                        <Icon
                          icon="material-symbols-light:verified"
                          className="w-6 h-6 text-[#137226]"
                        />
                      </div>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title="Shift-away"
                      content="Click to verify your mail"
                      placement="top"
                      className="btn btn-outline-dark"
                      arrow
                      animation="shift-away"
                    >
                      <div onClick={otpSend}>
                        {isLoading ? (
                          <Icon
                            icon="eos-icons:loading"
                            style={{ color: "#2a62ff" }}
                            className="w-6 h-6"
                          />
                        ) : (
                          <Icon
                            icon="fluent-color:warning-16"
                            className="w-6 h-6 cursor-pointer"
                          />
                        )}
                      </div>
                    </Tooltip>
                  )
                )}
              </div>
            </div>
          </li>

          {/* Phone */}
          <li className="flex space-x-3 rtl:space-x-reverse items-center">
            <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
              <Icon icon="heroicons:phone-arrow-up-right" />
            </div>
            <div className="flex-1">
              <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                PHONE
              </div>
              <Link
                to={`tel:${employeeDetail?.phone}`}
                className="text-base text-slate-600 dark:text-slate-50"
              >
                {employeeDetail?.country_code} {employeeDetail?.phone}
              </Link>
            </div>
          </li>

          {/* DOB */}
          <li className="flex space-x-3 rtl:space-x-reverse items-center">
            <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
              <Icon icon="lucide:cake" />
            </div>
            <div className="flex-1">
              <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                Date of Birth
              </div>
              <Link
                to="#"
                className="text-base text-slate-600 dark:text-slate-50"
              >
                {employeeDetail?.date_of_birth
                  ? formatDateWithMonthName(employeeDetail?.date_of_birth)
                  : ""}
              </Link>
            </div>
          </li>

          {/*
            If you want to show Date of Joining, uncomment below:
            <li className="flex space-x-3 rtl:space-x-reverse items-center">
              <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                <Icon icon="uil:calender" />
              </div>
              <div className="flex-1">
                <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                  Date of Joining
                </div>
                <Link to="#" className="text-base text-slate-600 dark:text-slate-50">
                  {employeeDetail?.date_of_joining
                    ? formatDateWithMonthName(employeeDetail?.date_of_joining)
                    : ""}
                </Link>
              </div>
            </li>
          */}
        </ul>
      </Cards>

      {/* Edit personal info modal */}
      <EmployeeDetailModal
        employeeDetail={employeeDetail}
        showPersonalInfoModal={showPersonalInfoModal}
        setShowPersonalInfoModal={setShowPersonalInfoModal}
        fetchEmployeeDetail={fetchEmployeeDetail}
      />

      {/* OTP modal for email verification */}
      {showOtpModal && (
        <OtpModal
          otp={otp}
          setOtp={setOtp}
          onSubmit={handleOtpSubmit}
          onClose={() => setShowOtpModal(false)}
          showOtpModal={showOtpModal}
          otpSend={otpSend}
          isLoading={isLoading}
        />
      )} 
    </div>
  );
};
