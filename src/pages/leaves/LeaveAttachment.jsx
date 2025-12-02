import React, { useCallback, useState, useEffect } from 'react';
import { ImageCrousal } from '@/components/partials/screenshot/ImageCrousal';

const LeaveAttachment = ({ leave }) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const baseURL = import.meta.env.VITE_APP_DJANGO;
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const openImageViewer = useCallback((index) => {
    setCurrentImage(index);
    setIsViewerOpen(true);
  }, []);

  const closeImageViewer = () => {
    setCurrentImage(0);
    setIsViewerOpen(false);
  };

  const renderAttachment = (attachmentUrl) => {
    if (!attachmentUrl) return null;
    
    const fileExtension = attachmentUrl.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
    
    if (isImage) {
      return (
        <div className="flex justify-center md:justify-start items-center w-full">
          <div 
            className="relative group overflow-hidden rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => openImageViewer(0)}
          >
            <img
              src={`${baseURL}${attachmentUrl}`}
              alt="Attachment"
              className="max-w-full w-auto object-contain max-h-[200px] md:max-h-[300px]"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
              <div className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
                Click to view
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const parts = attachmentUrl.split('/');
      const fileName = parts[parts.length - 1];
      
      return (
        <a
          href={`${baseURL}${attachmentUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          <span className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <span className="truncate">{fileName}</span>
        </a>
      );
    }
  };

  return (
    <div className="w-full">
      {leave.attachment ? (
        renderAttachment(leave.attachment)
      ) : (
        <div className="flex items-center justify-center py-6 text-gray-500 dark:text-gray-400 text-sm italic">
          No attachments
        </div>
      )}
      
      {isViewerOpen && (
        <ImageCrousal
          imageList={[`${baseURL}${leave.attachment}`]}
          initialSlide={currentImage}
          closeModal={closeImageViewer}
        />
      )}
    </div>
  );
};

export default LeaveAttachment;
