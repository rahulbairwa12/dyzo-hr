import React from "react";
import SimpleBar from "simplebar-react";
import { useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";

// import images
import Image1 from "@/assets/images/chat/sd1.png";
import Image2 from "@/assets/images/chat/sd2.png";
import Image3 from "@/assets/images/chat/sd3.png";
import Image4 from "@/assets/images/chat/sd4.png";
import Image5 from "@/assets/images/chat/sd5.png";
import Image6 from "@/assets/images/chat/sd6.png";

const socials = [
  {
    name: "facebook",
    icon: "bi:facebook",
    link: "#",
  },
  {
    name: "twitter",
    link: "#",
    icon: "bi:twitter",
  },
  {
    name: "instagram",
    link: "#",
    icon: "bi:instagram",
  },
];

const Info = () => {
  const { activechat, user, messFeed } = useSelector((state) => state.chat);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const sharedImages = messFeed.filter(message => message.image !== null).map(message => message.image);

  return (
    <SimpleBar className="h-full p-6">
      <h4 className="text-xl text-slate-900 font-medium mb-8">About</h4>
      <div className="h-[100px] w-[100px] rounded-full mx-auto mb-4">
        <img
          src={user.avatar}
          alt=""
          className="block w-full h-full object-cover rounded-full"
        />
      </div>
      <div className="text-center">
        <h5 className="text-base text-slate-600 dark:text-slate-300 font-medium mb-1">
          {user.fullName}
        </h5>
        <h6 className="text-xs text-slate-600 dark:text-slate-300 font-normal">
          {user.role}
        </h6>
      </div>
      <ul className="list-item mt-5 space-y-4 border-b border-slate-100 dark:border-slate-700 pb-5 -mx-6 px-6">
        <li className="flex justify-between text-sm text-slate-600 dark:text-slate-300 leading-[1]">
          <div className="flex space-x-2 items-start rtl:space-x-reverse">
            <Icon
              icon="heroicons:envelope"
              className="text-base"
            />
            <span>Email</span>
          </div>
          <div className="font-medium">{user.email}</div>
        </li>
        <li className="flex justify-between text-sm text-slate-600 dark:text-slate-300 leading-[1]">
          <div className="flex space-x-2 items-start rtl:space-x-reverse">
            <Icon icon="heroicons:phone-arrow-up-right" className="text-base" />
            <span>Phone</span>
          </div>
          <div className="font-medium">{user.phone}</div>
        </li>
        <li className="flex justify-between text-sm text-slate-600 dark:text-slate-300 leading-[1]">
          <div className="flex space-x-2 items-start rtl:space-x-reverse">
            <Icon icon="heroicons-outline:user" className="text-base" />
            <span>Members since</span>
          </div>
          <div className="font-medium">{formatDate(user.dop)}</div>
        </li>
      </ul>
      {/* <ul className="list-item space-y-3 border-b border-slate-100 dark:border-slate-700 pb-5 -mx-6 px-6 mt-5">
        {socials?.map((slink, sindex) => (
          <li
            key={sindex}
            className="text-sm text-slate-600 dark:text-slate-300 leading-[1]"
          >
            <button className="flex space-x-2 rtl:space-x-reverse">
              <Icon icon={slink.icon} className="text-base" />
              <span className="capitalize font-normal text-slate-600 dark:text-slate-300">
                {slink.name}
              </span>
            </button>
          </li>
        ))}
      </ul> */}
      <h4 className="py-4 text-sm text-secondary-500 dark:text-slate-300 font-normal">
        Shared documents
      </h4>
      <ul className="grid grid-cols-3 gap-2">
        {sharedImages.map((image, index) => (
          <li key={index} className="h-[46px]">
            <img
              src={image}
              alt={`shared-doc-${index}`}
              className="w-full h-full object-cover rounded-[3px]"
            />
          </li>
        ))}
      </ul>
    </SimpleBar>
  );
};

export default Info;
