import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import { formatDateWithTime } from '@/helper/helper';
import { intialLetterName } from '@/helper/initialLetterName';
import { useSelector } from 'react-redux';

const ScreenShotCard = forwardRef(({ item, index, openImageViewModal }, ref) => {
  const userInfo = useSelector((state) => state.auth.user);
  const { project_name, taskName, dateCreated,createdTime, url, employee_profile_pic, employee_name, productivity } = item;

  const handleIconClick = (e) => {
    e.stopPropagation();
    openImageViewModal(index);
  };
  function cleanIsoTimestamp(isoTimestamp) {
    return isoTimestamp.replace("T", " ").replace("Z", "");
  }
  

  return (
    <div ref={ref} className="relative  border-2 border-black-500 dark:border-white rounded overflow-hidden w-auto">
      <div className="mb-6 relative group">
        <img
          src={url}
          alt={`${project_name} - ${taskName}`}
          className="max-w-96 max-h-56 h-60 w-full block object-cover"
          onClick={handleIconClick}
          loading="lazy"
        />

        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="bg-white p-2 m-2 rounded-full" onClick={handleIconClick}>
            <Icon icon="hugeicons:view" className="text-black text-2xl" />
          </button>
          {userInfo?.isAdmin && (
            <button className="bg-white p-2 m-2 rounded-full">
              <Icon icon="ph:trash-light" className="text-black text-2xl" />
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-between mb-4 p-2">
        <div>
          <div className="text-xl text-slate-900 dark:text-white capitalize">
            {project_name}
          </div>
        </div>
        <Link to="#">
          <span className="inline-flex leading-5 text-slate-500 dark:text-slate-400 text-sm font-normal">
            <Icon
              icon="heroicons-outline:calendar"
              className="text-secondary-500 ltr:mr-2 rtl:ml-2 text-lg"
            />
            {createdTime !== null ? cleanIsoTimestamp(createdTime) : cleanIsoTimestamp(dateCreated)}
          </span>
        </Link>
      </div>

      <div className="card-text mt-4 p-2 text-justify">
        <p>{taskName}</p>
        <div className="mt-4 space-x-4 rtl:space-x-reverse">
          <div className='flex gap-2'>
            <div>
              {employee_profile_pic ? (
                <img
                  src={`${import.meta.env.VITE_APP_DJANGO}${employee_profile_pic}`}
                  alt="Employee"
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className='h-10 w-10 rounded-full text-sm bg-[#002D2D] text-white dark:bg-[#002D2D] flex flex-col items-center justify-center font-medium -tracking-[1px]'>
                  {intialLetterName(item?.firstname, item?.lastname, employee_name)}
                </span>
              )}
            </div>
            <div>
              <span className="text-sm text-slate-900 dark:text-white capitalize">
                {employee_name}
                <div className="w-[100px] bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden my-1">
                  <div className={`bg-blue-500 text-sm text-center p-1 leading-none rounded-[30px] text-white`} style={{ width: `${productivity?.toFixed(0)}%` }}>
                    {productivity?.toFixed(0)}%
                  </div>
                </div>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ScreenShotCard;
