import React, { useState, useEffect } from "react";
import ProgressBar from "@/components/ui/ProgressBar";
import { fetchAuthGET } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";

import customerCrownImage from "@/assets/images/icon/crown.svg";
import Image1 from "@/assets/images/all-img/cus-1.png";
import Image2 from "@/assets/images/all-img/cus-2.png";
import Image3 from "@/assets/images/all-img/cus-3.png";
import Cuser1 from "@/assets/images/users/user-1.jpg";
import Cuser2 from "@/assets/images/users/user-2.jpg";
import Cuser3 from "@/assets/images/users/user-3.jpg";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Customer = () => {
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [performers, setPerformers] = useState([]);
  const userInfo = useSelector(state => state?.auth.user);

  const monthsTillNow = months.slice(0, new Date().getMonth() + 1);
  const baseURL = import.meta.env.VITE_APP_DJANGO;

  const getTopPerformers = async () => {
    try {
      const year = new Date().getFullYear();
      const monthIndex = months.indexOf(selectedMonth);
      const yearMonth = `${year}-${monthIndex + 1 < 10 ? "0" : ""}${monthIndex + 1}`;

      const response = await fetchAuthGET(
        `${baseURL}/api/company/${userInfo.companyId}/top-six-performers/${yearMonth}/`
      );

      const performersData = response.map((performer) => ({
        id: performer.id,
        name: performer.name,
        designation: performer.designation,
        profile_picture: performer.profile_picture ? `${baseURL}${performer.profile_picture}` : null,
        performers_percentage: performer.performers_percentage,
        position: performer.position
      }));

      setPerformers(performersData);
    } catch (error) {
    }
  };

  useEffect(() => {
    getTopPerformers();
  }, [selectedMonth]);

  const handleMonthChange = (e) => {
    setSelectedMonth(months[parseInt(e.target.value)]);
  };

  const handlePrevious = () => {
    const currentIndex = monthsTillNow.indexOf(selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(monthsTillNow[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = monthsTillNow.indexOf(selectedMonth);
    if (currentIndex < monthsTillNow.length - 1) {
      setSelectedMonth(monthsTillNow[currentIndex + 1]);
    }
  };

  const sortedPerformers = [...performers].sort((a, b) => a.position - b.position);
  const reorderedPerformers = [
    sortedPerformers.find(p => p.position === 2) || {},
    sortedPerformers.find(p => p.position === 1) || {},
    sortedPerformers.find(p => p.position === 3) || {},
  ];

  const customers = reorderedPerformers.map((performer, index) => ({
    title: performer.name || "",
    img: performer.profile_picture || [Image1, Image2, Image3][index],
    value: performer.performers_percentage || 0,
    bg: `before:bg-${index === 1 ? "warning-500" : index === 0 ? "info-500" : "success-500"}`,
    barColor: `bg-${index === 1 ? "warning-500" : index === 0 ? "info-500" : "success-500"}`,
    number: performer.position || index + 1,
    active: index === 1,
  }));

  const customers2 = sortedPerformers.slice(3).map((performer) => ({
    title: performer.name,
    img: performer.profile_picture || Cuser1,
    value: performer.performers_percentage,
    bg: "before:bg-info-500",
    barColor: "bg-info-500",
    number: performer.position,
  }));

  return (
    <div className="pb-2">
      <div className={userInfo?.isAdmin ? "inline-flex" : "hidden"}>
        <div className="flex justify-between items-center px-2 py-3">
          <div className="flex w-full justify-between gap-2">
            {selectedMonth !== monthsTillNow[0] && (
              <Icon icon="mingcute:left-fill" className="w-6 hover:cursor-pointer" onClick={handlePrevious} />
            )}
            <select
              className="bg-white dark:bg-slate-800 dark:text-slate-200 border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 w-full md:w-auto py-2 px-3 text-sm md:text-base"
              onChange={handleMonthChange}
              value={monthsTillNow.indexOf(selectedMonth)}
            >
              {monthsTillNow.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            {selectedMonth !== monthsTillNow[monthsTillNow.length - 1] && (
              <Icon icon="mingcute:right-fill" className="w-6 hover:cursor-pointer" onClick={handleNext} />
            )}
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 grid-cols-1 gap-5">
        {customers.map((item, i) => (
          <div
            key={i}
            className={`relative z-[1] text-center p-4 rounded before:w-full before:h-[calc(100%-60px)] before:absolute before:left-0 before:top-[60px)] before:rounded before:z-[-1] before:bg-opacity-[0.1] ${item.bg} dark:before:bg-opacity-[0.2]`}
          >
            <div
              className={`${
                item.active ? "ring-2 ring-[#FFC155]" : ""
              } h-[70px] w-[70px] rounded-full mx-auto mb-4 relative`}
            >
              {item.active && (
                <span className="crown absolute -top-[24px] left-1/2 -translate-x-1/2">
                  <img src={customerCrownImage} alt="" />
                </span>
              )}
              <img
                src={item.img}
                alt=""
                className="w-full h-full rounded-full"
              />
              <span className="h-[27px] w-[27px] absolute right-0 bottom-0 rounded-full bg-[#FFC155] border border-white flex flex-col items-center justify-center text-white text-xs font-medium">
                {item.number}
              </span>
            </div>
            <h4 className="text-sm text-slate-600 dark:text-slate-300 font-semibold mb-4">
              {item.title}
            </h4>
            <div className="inline-block bg-slate-900 text-white px-[10px] py-[6px] text-xs font-medium rounded-full min-w-[60px]">
              {item.value}
            </div>
            <div>
              <div className="flex justify-between text-sm font-normal dark:text-slate-300 mb-3 mt-4">
                <span>Progress</span>
                <span className="font-normal">{item.value}%</span>
              </div>
              <ProgressBar value={item.value} className={item.barColor} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 mt-5">
        {customers2.map((item, i) => (
          <div
            key={i}
            className="relative z-[1] p-4 rounded md:flex items-center bg-gray-5003 dark:bg-slate-900 md:space-x-10 md:space-y-0 space-y-3 rtl:space-x-reverse"
          >
            <div
              className={`${
                item.active ? "ring-2 ring-[#FFC155]" : ""
              } h-10 w-10 rounded-full relative`}
            >
              {item.active && (
                <span className="crown absolute -top-[14px] left-1/2 -translate-x-1/2">
                  <img src={customerCrownImage} alt="" />
                </span>
              )}
              <img
                src={item.img}
                alt=""
                className="w-full h-full rounded-full"
              />
              <span className="h-4 w-4 absolute right-0 bottom-0 rounded-full bg-[#FFC155] border border-white flex flex-col items-center justify-center text-white text-[10px] font-medium">
                {item.number}
              </span>
            </div>
            <h4 className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
              {item.title}
            </h4>
            <div className="inline-block text-center bg-slate-900 text-white px-[10px] py-[6px] text-xs font-medium rounded-full min-w-[60px]">
              {item.value}
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm font-normal dark:text-slate-300 mb-3">
                <span>Progress</span>
                <span className="font-normal">{item.value}%</span>
              </div>
              <ProgressBar value={item.value} className={item.barColor} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Customer;
