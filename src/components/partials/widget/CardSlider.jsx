import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper";
import "swiper/css";
import "swiper/css/effect-cards";
import { fetchAuthGET, fetchGET } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import DOMPurify from 'dompurify';
import visaCardImage from "@/assets/images/all-img/visa-card-bg.png";
import Tooltip from "@/components/ui/Tooltip";
import { useNavigate } from "react-router-dom";
import { Icon } from '@iconify/react';
import ListSkeleton from "@/pages/table/ListSkeleton";

const CardSlider = () => {
  const [notice, setNotice] = useState([]);
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.user);
  const baseUrl = import.meta.env.VITE_APP_DJANGO;
  const [loading, setLoading] = useState(true)

  const fetchNotice = async () => {
    setLoading(true)
    try {
      const response = await fetchGET(`${baseUrl}/api/notices/${userInfo?.companyId}/`);
      if (response.status) {
        setNotice(response.data);
      }
    } catch (error) {
      toast.error('Unable to fetch the notice details');
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    if (userInfo?.companyId !== undefined) {
      fetchNotice();
    }
  }, [userInfo?.companyId]);

  const sanitizeHTML = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${formattedDate} At ${formattedTime}`;
  };

  const isNew = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    return (
      date.toDateString() === now.toDateString() ||
      date.toDateString() === yesterday.toDateString()
    );
  };

  const gradientBackgrounds = [
    "from-[#1EABEC] to-primary-500",
    "from-[#4C33F7] to-[#801FE0]",
    "from-[#FF9838] to-[#008773]",
    "from-[#FF4E50] to-[#F9D423]",
    "from-[#7F00FF] to-[#E100FF]",
    "from-[#76b852] to-[#8DC26F]",
    "from-[#1D2671] to-[#C33764]",
    "from-[#FFB75E] to-[#ED8F03]",
    "from-[#FDC830] to-[#F37335]",
    "from-[#00B4DB] to-[#0083B0]",
  ];

  return (
    <div>
      <Swiper effect={"cards"} grabCursor={true} modules={[EffectCards]}>
      {loading && <ListSkeleton />}

        { !loading && ( notice.length === 0 ? (
          <div className='text-center'>No data found</div>
        ) : (
          notice.map((item, i) => (
            <SwiperSlide key={i}>
              <div
                className={`h-auto min-h-[350px] bg-gradient-to-r ${gradientBackgrounds[i % gradientBackgrounds.length]} relative rounded-md z-[1] p-4 text-white`}
              >
                <div className="overlay absolute left-0 top-0 h-full w-full -z-[1]">
                  <img
                    src={visaCardImage}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center mb-4">
                  <Tooltip title={item.employee_name} content={item.employee_name} theme="custom-light" placement="top" className="btn btn-outline-dark" arrow animation="shift-away">
                    {item.employee_profile_picture ? (
                      <img
                        src={`${baseUrl}${item.employee_profile_picture}`}
                        alt={item.employee_name}
                        className="h-10 w-10 rounded-full mr-3 cursor-pointer"
                        onClick={() => navigate(`/profile/${item.employee}`)}
                      />
                    ) : (
                      <div className="bg-[#002D2D] h-10 w-10 rounded-full mr-3 flex items-center justify-center font-bold cursor-pointer" onClick={() => navigate(`/profile/${item.employee}`)}>
                        {item.employee_name.charAt(0)}
                      </div>
                    )}
                  </Tooltip>
                  <div>
                    <div className="font-semibold text-lg flex items-center">
                      {item.employee_name}
                      {isNew(item.created_at) && (
                        <Icon icon="clarity:new-solid" className="ml-2 text-lg h-[2rem] w-[2rem]" />
                      )}
                    </div>
                    <div className="text-xs text-opacity-75">
                      {formatDateTime(item.created_at)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 mb-4 font-semibold text-lg">
                  {item.title} 
                </div>
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={sanitizeHTML(item.note)}
                ></div>
              </div>
            </SwiperSlide>
          ))
        ))}
      </Swiper>
    </div>
  );
};

export default CardSlider;
