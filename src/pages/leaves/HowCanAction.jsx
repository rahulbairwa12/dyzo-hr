import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { intialLetterName } from "@/helper/helper";

const HowCanAction = ({ leave }) => {
  const [lists, setLists] = useState([]);
  const baseURL = import.meta.env.VITE_APP_DJANGO;

  useEffect(() => {
    const approvedList = leave.approved_by.map((id, index) => ({
      id,
      image: leave.approved_by_profile_pic[index],
      title: `${leave.approved_by_name[index]}`,
      status: "Approved",
    }));

    const rejectedList = leave.rejected_by.map((id, index) => ({
      id,
      image: leave.rejected_by_profile_pic[index],
      title: `${leave.rejected_by_name[index]}`,
      status: "Rejected",
    }));

    setLists([...approvedList, ...rejectedList]);
  }, [leave]);

  return (
    <div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700 -mx-6 -mb-6">
        {lists.map((item) => (
          <li
            className="flex items-center px-6 space-x-4 py-4 rtl:space-x-reverse"
            key={item.id}
          >
            <div className="flex-none flex space-x-2 items-center rtl:space-x-reverse">
              <div
                className="h-8 w-8 rounded-full text-white"
              >
                {
                  item?.image ? (
                    <img
                      src={baseURL + item.image}
                      alt=""
                      className="block w-full h-full object-cover rounded-full"
                    />
                  ) :
                    <div className="rounded-full">
                      <span className="bg-[#002D2D] text-white flex justify-center border-2 border-white items-center rounded-full font-bold text-lg leading-none w-8 h-8 bg-cover bg-center">
                        {intialLetterName("", "", item?.title)}
                      </span>
                    </div>
                }
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                {item.title}
              </span>
              <span
                className={`inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 ${item.status === "Approved"
                    ? "text-success-500 bg-success-500"
                    : ""
                  } ${item.status === "Rejected"
                    ? "text-danger-500 bg-danger-500"
                    : ""
                  }`}
              >
                {item.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HowCanAction;
