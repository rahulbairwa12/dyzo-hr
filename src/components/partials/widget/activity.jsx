import React from "react";

const TrackingParcel = ({ journeyData }) => {

  return (
    <ul className="relative ltr:pl-2 rtl:pr-2">
      {journeyData?.map((item, i) => (
        <li
          key={i}
          className={`
               ${
                 item.status === "ok"
                   ? "before:opacity-100"
                   : " before:opacity-100"
               }

                 ltr:border-l-2 rtl:border-r-2 border-slate-100 dark:border-slate-700 pb-4 
                 last:border-none ltr:pl-[22px] rtl:pr-[22px] relative before:absolute ltr:before:left-[-8px] 
                 rtl:before:-right-2 before:top-[0px] before:rounded-full before:w-4 before:h-4
                  before:bg-slate-900 dark:before:bg-slate-600 before:leading-[2px] 
                  before:content-[url('@/assets/images/all-img/ck.svg')] `}
        >
          <div className="p-[10px] relative top-[-20px]">
            <h2 className="text-sm font-medium dark:text-slate-400-900 mb-1 text-slate-600">
              {item.action_type}
            </h2>
            <p className="text-xs capitalize dark:text-slate-400">
              {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
            </p>
            <p className="text-xs capitalize dark:text-slate-400">
              {item.actor_name}
            </p>
         
            <p className="text-xs capitalize dark:text-slate-400">
             Reason- {item.reason}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TrackingParcel;
