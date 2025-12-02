import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import changelog from "../data/changelog.json";

const CURRENT_VERSION = changelog[0].version;

export default function WhatsNewModal({ shouldShow, onClose, onVersionSeen }) {
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (shouldShow) {
      setShow(true);
      // Add slight delay for smooth animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [shouldShow]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShow(false);
      onClose?.();
      onVersionSeen?.();
    }, 300);
  }

  const handleViewAllUpdates = () => {
    // Update version when user clicks "View all updates"
    onVersionSeen?.();
    // Navigate to changelog
    window.location.href = '/changelog';
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-customPurple-150/30 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-3">
      <div
        className={`relative bg-gradient-to-br from-customWhite-100 via-white to-customPurple-50 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-hidden`}
      >

        {/* Enhanced header with multiple gradients - compact */}
        <div className="relative bg-gradient-to-br from-electricBlue-100 via-electricBlue-50 to-customPurple-150 rounded-t-xl p-4 sm:px-6 py-4 sm:py-5 overflow-hidden">
          {/* Background pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-customPurple-50/40 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-1.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl sm:rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border border-white/20">
                <div className="absolute inset-0 bg-gradient-to-br from-electricBlue-50/30 to-customPurple-150/30 rounded-xl sm:rounded-2xl"></div>
                <Icon icon="mdi:sparkles" className="text-lg sm:text-xl text-white relative z-10" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1">What's New</h2>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-1.5 h-1.5 bg-customGreen-50 rounded-full animate-pulse"></div>
                  <p className="text-customWhite-50 text-xs sm:text-sm font-medium">v{CURRENT_VERSION}</p>
                  <span className="text-customWhite-50/70 text-xs">•</span>
                  <span className="text-customWhite-50 text-xs sm:text-sm font-medium">{new Date(changelog[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 hover:bg-white/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm"
            >
              <Icon icon="mdi:close" className="text-base sm:text-lg" />
            </button>
          </div>
        </div>

        {/* Content section with enhanced styling - compact and scrollable */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 relative flex flex-col h-[calc(80vh-14rem)] overflow-y-auto">
          {/* Enhanced categorized updates section */}
          <div className="space-y-4 sm:space-y-5 flex-1">
            {/* Features Section */}
            {changelog[0].features && changelog[0].features.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Icon icon="mdi:star" className="text-electricBlue-100 text-base sm:text-lg" />
                  <h3 className="text-customBlack-100 font-bold text-sm sm:text-base">New Features</h3>
                  <div className="ml-auto px-2 py-1 bg-electricBlue-100/10 rounded-full">
                    <span className="text-electricBlue-100 text-xs font-semibold">{changelog[0].features.length}</span>
                  </div>
                </div>
                {changelog[0].features.map((feature, index) => (
                  <div key={index} className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-electricBlue-50/10 via-white/40 to-customPurple-50/10 rounded-xl sm:rounded-2xl border border-electricBlue-100/20 hover:border-electricBlue-100/40 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-electricBlue-50 to-electricBlue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200">
                      <Icon icon="mdi:plus" className="text-white text-xs sm:text-sm" />
                    </div>
                    <p className="text-customGray-300 text-xs sm:text-sm leading-relaxed group-hover:text-customGray-200 transition-colors duration-200">{typeof feature === 'string' ? feature : feature.title}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Improvements Section */}
            {changelog[0].improvements && changelog[0].improvements.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Icon icon="mdi:trending-up" className="text-customGreen-100 text-base sm:text-lg" />
                  <h3 className="text-customBlack-100 font-bold text-sm sm:text-base">Improvements</h3>
                  <div className="ml-auto px-2 py-1 bg-customGreen-100/10 rounded-full">
                    <span className="text-customGreen-100 text-xs font-semibold">{changelog[0].improvements.length}</span>
                  </div>
                </div>
                {changelog[0].improvements.map((improvement, index) => (
                  <div key={index} className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-customGreen-50/10 via-white/40 to-customPurple-50/10 rounded-xl sm:rounded-2xl border border-customGreen-100/20 hover:border-customGreen-100/40 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-customGreen-50 to-customGreen-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200">
                      <Icon icon="mdi:arrow-up" className="text-white text-xs sm:text-sm" />
                    </div>
                    <p className="text-customGray-300 text-xs sm:text-sm leading-relaxed group-hover:text-customGray-200 transition-colors duration-200">{typeof improvement === 'string' ? improvement : improvement.title}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Bug Fixes Section */}
            {changelog[0].bugFixes && changelog[0].bugFixes.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Icon icon="mdi:bug-check" className="text-customRed-50 text-base sm:text-lg" />
                  <h3 className="text-customBlack-100 font-bold text-sm sm:text-base">Bug Fixes</h3>
                  <div className="ml-auto px-2 py-1 bg-customRed-50/10 rounded-full">
                    <span className="text-customRed-50 text-xs font-semibold">{changelog[0].bugFixes.length}</span>
                  </div>
                </div>
                {changelog[0].bugFixes.map((bugFix, index) => (
                  <div key={index} className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-customRed-50/10 via-white/40 to-customPurple-50/10 rounded-xl sm:rounded-2xl border border-customRed-50/20 hover:border-customRed-50/40 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-customRed-50 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200">
                      <Icon icon="mdi:check" className="text-white text-xs sm:text-sm" />
                    </div>
                    <p className="text-customGray-300 text-xs sm:text-sm leading-relaxed group-hover:text-customGray-200 transition-colors duration-200">{typeof bugFix === 'string' ? bugFix : bugFix.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced action buttons - fixed at bottom */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-t from-white/95 to-white/80 backdrop-blur-sm border-t border-gray-200/50 flex-shrink-0">
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-electricBlue-100 via-electricBlue-50 to-electricBlue-100 hover:from-electricBlue-50 hover:via-electricBlue-100 hover:to-electricBlue-50 text-white font-bold py-2.5 sm:py-3.5 px-4 sm:px-5 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              <Icon icon="mdi:rocket-launch" className="text-base sm:text-lg" />
              Got it!
            </button>

            <button
              onClick={handleViewAllUpdates}
              className="w-full bg-gradient-to-r from-customWhite-50 to-customWhite-100 hover:from-customWhite-100 hover:to-customWhite-50 text-customGray-300 hover:text-customGray-200 font-semibold py-2 sm:py-3 px-4 sm:px-5 rounded-xl sm:rounded-2xl border-2 border-neutral-50 hover:border-electricBlue-100/50 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 group"
            >
              <Icon icon="mdi:history" className="text-sm sm:text-base" />
              View all updates
              <Icon icon="mdi:arrow-right" className="text-sm sm:text-base group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
