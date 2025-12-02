import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import Icon from '@/components/ui/Icon';
import SwiperCore, { Navigation, Pagination, Keyboard, Zoom } from 'swiper';

SwiperCore.use([Navigation, Pagination, Keyboard, Zoom]);

export const ImageCrousal = ({ imageList, initialSlide, closeModal }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(initialSlide);
  const [isMobile, setIsMobile] = useState(false);
  const swiperRef = useRef(null);

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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleFullscreen = () => {
    setFullscreen(prev => !prev);
  };

  const goToNextSlide = () => {
    if (activeSlide < imageList.length - 1) {
      if (swiperRef.current && swiperRef.current.swiper) {
        swiperRef.current.swiper.slideNext();
      }
    }
  };

  const goToPrevSlide = () => {
    if (activeSlide > 0) {
      if (swiperRef.current && swiperRef.current.swiper) {
        swiperRef.current.swiper.slidePrev();
      }
    }
  };

  const goToSlide = (index) => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideTo(index);
    }
  };

  // Handle keyboard navigation (desktop only)
  useEffect(() => {
    if (isMobile) return; // Skip keyboard controls on mobile
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight' && activeSlide < imageList.length - 1) goToNextSlide();
      if (e.key === 'ArrowLeft' && activeSlide > 0) goToPrevSlide();
      if (e.key === '+') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') handleResetZoom();
      if (e.key === 'f') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide, imageList.length, closeModal, isMobile]);

  // Function to download current image
  const downloadCurrentImage = () => {
    const link = document.createElement('a');
    link.href = imageList[activeSlide];
    link.download = `image-${activeSlide + 1}.jpg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[99999]">
      {/* Dark overlay with blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={closeModal}
      ></div>
      
      {/* Main viewer container */}
      <div className={`relative flex flex-col bg-gray-900 rounded-lg overflow-hidden shadow-2xl z-10 transition-all duration-300 ${
        fullscreen || isMobile ? 'w-screen h-[93vh]' : 'w-[92%] h-[90%] max-w-7xl'
      }`}>
        {/* Header with title and controls */}
        <div className={`${isMobile ? 'h-10' : 'h-12 md:h-14'} bg-gray-800 px-2 md:px-4 flex items-center justify-between border-b border-gray-700`}>
          <div className="text-white font-medium flex items-center">
            <Icon icon="heroicons-outline:photograph" className={`${isMobile ? 'text-sm' : ''} mr-1 md:mr-2 text-blue-400`} />
            <span className="hidden md:inline">Image Viewer</span>
            <span className={`ml-1 md:ml-3 text-gray-400 text-xs`}>
              {activeSlide + 1} / {imageList.length}
            </span>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            {!isMobile && (
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <Icon icon={fullscreen ? "heroicons-outline:arrows-shrink" : "heroicons-outline:arrows-expand"} className="text-xl" />
            </button>
            )}
            <button
              onClick={closeModal}
              className={`${isMobile ? 'p-1' : 'p-2'} rounded-md hover:bg-red-700 bg-gray-700 text-white transition-colors`}
              title="Close"
              aria-label="Close image viewer"
            >
              <Icon icon="heroicons-outline:x" className={`${isMobile ? 'text-base' : 'text-xl'}`} />
            </button>
          </div>
        </div>
        
        {/* Toolbar - Only show on desktop */}
        {!isMobile && (
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-1">
          <div className="flex items-center mr-6 border-r border-gray-700 pr-6">
            <button
                className="p-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={goToPrevSlide}
              disabled={activeSlide === 0}
              title="Previous"
            >
              <Icon icon="heroicons-outline:chevron-left" className="text-xl" />
            </button>
            <button
                className="p-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={goToNextSlide}
              disabled={activeSlide === imageList.length - 1}
              title="Next"
            >
              <Icon icon="heroicons-outline:chevron-right" className="text-xl" />
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <Icon icon="heroicons-outline:minus" className="text-xl" />
            </button>
            <div className="text-white min-w-16 text-center">
              {Math.round(zoomLevel * 100)}%
            </div>
            <button
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <Icon icon="heroicons-outline:plus" className="text-xl" />
            </button>
            <button
              className="p-2 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white transition-colors ml-1"
              onClick={handleResetZoom}
              title="Reset Zoom"
            >
              <Icon icon="heroicons-outline:refresh" className="text-xl" />
            </button>
          </div>
          
          <div className="flex ml-auto">
            <button
              className="flex items-center p-2 rounded-md hover:bg-blue-600 bg-blue-700 text-white transition-colors"
              title="Download Image"
                onClick={downloadCurrentImage}
            >
              <Icon icon="heroicons-outline:download" className="text-xl mr-1" />
              <span>Download</span>
            </button>
          </div>
        </div>
        )}

        {/* Main image container */}
        <div className="flex-1 overflow-hidden bg-gray-950 relative">
          <Swiper
            ref={swiperRef}
            spaceBetween={0}
            slidesPerView={1}
            initialSlide={initialSlide}
            onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
            className="w-full h-full"
            keyboard={{ enabled: !isMobile }}
            zoom={true}
            centeredSlides={true}
            allowTouchMove={true}
          >
            {imageList.map((image, index) => (
              <SwiperSlide key={index} className="flex items-center justify-center">
                <div className="swiper-zoom-container flex items-center justify-center w-full h-full">
                  <img 
                    src={image} 
                    alt={`Image ${index + 1}`} 
                    className="max-w-full max-h-full object-contain transition-transform duration-300"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Floating navigation arrows - only show on desktop */}
          {!isMobile && (
            <>
          <button 
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/30 w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all backdrop-blur-sm z-10 md:flex hidden disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={goToPrevSlide}
            disabled={activeSlide === 0}
          >
            <Icon icon="heroicons-outline:chevron-left" className="text-2xl" />
          </button>
          <button 
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/30 w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all backdrop-blur-sm z-10 md:flex hidden disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={goToNextSlide}
            disabled={activeSlide === imageList.length - 1}
          >
            <Icon icon="heroicons-outline:chevron-right" className="text-2xl" />
          </button>
            </>
          )}
          
          {/* Mobile Controls - only show on mobile */}
          {isMobile && (
            <>
              {/* Mobile Navigation Buttons */}
              <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 flex justify-between px-2 z-10 pointer-events-none">
                {activeSlide > 0 && (
                  <button
                    className="p-2 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm pointer-events-auto"
                    onClick={goToPrevSlide}
                  >
                    <Icon icon="heroicons-outline:chevron-left" className="text-sm" />
                  </button>
                )}
                {activeSlide < imageList.length - 1 && (
                  <button
                    className="p-2 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm pointer-events-auto"
                    onClick={goToNextSlide}
                  >
                    <Icon icon="heroicons-outline:chevron-right" className="text-sm" />
                  </button>
                )}
              </div>
              
              {/* Mobile Action Buttons */}
              <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
                <button
                  className="p-2 rounded-full bg-gray-800/80 text-white shadow-lg backdrop-blur-sm"
                  onClick={handleZoomIn}
                >
                  <Icon icon="heroicons-outline:plus" className="text-sm" />
                </button>
                <button
                  className="p-2 rounded-full bg-gray-800/80 text-white shadow-lg backdrop-blur-sm"
                  onClick={handleZoomOut}
                >
                  <Icon icon="heroicons-outline:minus" className="text-sm" />
                </button>
                <button
                  className="p-2 rounded-full bg-blue-600/90 text-white shadow-lg backdrop-blur-sm"
                  onClick={downloadCurrentImage}
                >
                  <Icon icon="heroicons-outline:download" className="text-sm" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer with thumbnails - Only show if multiple images */}
        {imageList.length > 1 && (
          <div className={`${isMobile ? 'h-12' : 'h-16'} bg-gray-800 border-t border-gray-700 flex items-center px-2 overflow-x-auto`}>
          {imageList.map((image, index) => (
            <div 
              key={index}
                className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mx-1 cursor-pointer rounded overflow-hidden flex-shrink-0 border-2 transition-all ${
                activeSlide === index ? 'border-blue-500 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              onClick={() => goToSlide(index)}
            >
              <img 
                src={image} 
                alt={`Thumbnail ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};
