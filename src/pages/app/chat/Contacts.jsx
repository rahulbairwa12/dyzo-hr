import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { openChat, fetchMessages } from "./store";
import { useNavigate } from "react-router-dom";

const Contacts = ({ contact }) => {
  const { fullName, avatar, status, lastmessage, unreadmessage, lastmessageTime } = contact;
  const dispatch = useDispatch();

  const navigate = useNavigate(); 

  const handleClick = () => {
    dispatch(openChat({ contact, activechat: true }));
    dispatch(fetchMessages(contact.id)); 
  };

  const formatDateToLocalTime = (utcDateString) => {
    if (!utcDateString) return "";

    const date = new Date(utcDateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      // If the date is today, show the time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      // If the date is yesterday, show "Yesterday"
      return 'Yesterday';
    } else {
      // Otherwise, show the date in the format "DD MMM"
      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    }
  };

  return (
    <div
      className="block w-full py-5 focus:ring-0 outline-none cursor-pointer group transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-600 dark:hover:bg-opacity-70"
      onClick={handleClick}
    >
      <div className="flex space-x-3 px-6 rtl:space-x-reverse">
        <div className="flex-none">
          <div className="h-10 w-10 rounded-full relative">
            <span
              className={`status ring-1 ring-white inline-block h-[10px] w-[10px] rounded-full absolute -right-0 top-0
                ${status === "active" ? "bg-success-500" : "bg-secondary-500"}
              `}
            ></span>
            <img
              src={avatar}
              alt=""
              className="block w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
        <div className="flex-1 text-start flex">
          <div className="flex-1">
            <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px]">
              {fullName}
            </span>
            <span className="block text-slate-600 dark:text-slate-300 text-xs font-normal">
              {lastmessage.slice(0, 14) + "..."}
            </span>
          </div>
          <div className="flex-none ltr:text-right rtl:text-end">
            {lastmessageTime && (
              <span className="block text-xs text-slate-400 dark:text-slate-400 font-normal">
                {formatDateToLocalTime(lastmessageTime)}
              </span>
            )}
            {unreadmessage > 0 && (
              <span className="inline-flex flex-col items-center justify-center text-[10px] font-medium w-4 h-4 bg-[#FFC155] text-white rounded-full">
                {unreadmessage}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
