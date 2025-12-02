import React, { useState, useRef, useEffect } from 'react';
import {
  EmailShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  WhatsappShareButton
} from "react-share";
import { Icon } from "@iconify/react";

const ShareUrlButtons = ({ url }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef(null);
  const [isCopy, setIsCopy] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setIsCopy(true);
        setTimeout(()=>{setIsCopy(false);},1000);
      })
      .catch((error) => {
        setIsCopy(false)
      });
  };

  const shareIconSize = 32;

  return (
    <>
       <Icon icon="oi:share" className="w-5 h-5 text-primary" onClick={openModal}/>
       <div ref={modalRef} data-dial-init className={`fixed right-4 group z-99999 share-btn ${isModalOpen ? 'block' : 'hidden'}`}>
            <div id="speed-dial-menu-dropdown-alternative-square" className="flex flex-col py-1 mb-0 space-y-2 bg-white border border-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600">
                <ul className="text-sm text-gray-500 dark:text-gray-300">
                    {/* <li>
                      <a href="#" className="flex items-center px-2 py-0 border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white dark:border-gray-600">
                        <TwitterShareButton url={url} className='flex items-center px-5 py-2 border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white dark:border-gray-600'>
                           <Icon icon="ri:twitter-x-fill" size={shareIconSize} round="true" className='h-5 w-5 text-primary mx-2'/> <span className="text-sm text-primary font-medium">Twitter</span>
                        </TwitterShareButton>
                        </a>
                    </li> */}

                    <li>
                      <a href="#" className="flex items-center px-2 py-0 border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white dark:border-gray-600">
                        <WhatsappShareButton url={url} className='flex items-center'>
                          <Icon icon="mingcute:whatsapp-fill" size={shareIconSize} round="true" className='h-5 w-5 text-primary mx-2'/> <span className="text-sm text-primary font-medium">WhatsApp</span>
                        </WhatsappShareButton>
                      </a>
                    </li>

                    <li>
                      <a href="#" className="flex items-center px-2 py-0 border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white dark:border-gray-600">
                        <EmailShareButton url={url} className='flex items-center'>
                          <Icon icon="ph:envelope-thin" size={shareIconSize} round="true" className='h-5 w-5 text-primary mx-2'/> <span className="text-sm text-primary font-medium">Share on Email</span>
                        </EmailShareButton>
                      </a>
                    </li>

                    {/* <li>
                      <a href="#" className="flex items-center px-2 py-0 border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white dark:border-gray-600">
                        <LinkedinShareButton url={url} className='flex items-center'>
                          <Icon icon="mingcute:linkedin-fill" size={shareIconSize} round="true" className='h-5 w-5 text-primary mx-2'/> <span className="text-sm text-primary font-medium">Linkedin</span>
                        </LinkedinShareButton>
                      </a>
                    </li> */}

                    {/* <li>
                      <a href="#" onClick={()=>handleCopyUrl(url)} className="flex items-center px-2 py-0 border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white dark:border-gray-600">
                          <Icon icon="ph:link" size={shareIconSize} round="true" className='h-5 w-5 text-primary mx-2'/> <span className="text-sm text-primary font-medium"> {!isCopy?'Copy Link':'Copied'}</span>
                      </a>
                    </li> */}
                    
                </ul>
            </div>
   
      </div>
    </>
  );
};

export default ShareUrlButtons;
