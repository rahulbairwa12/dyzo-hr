import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import confetti from "canvas-confetti";
import "../../assets/css/shareModal.css";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// DYZO logo as inline SVG with gradient animation
const DyzoLogo = () => (
  <svg
    width="112"
    height="37"
    viewBox="0 0 112 37"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="logo-gradient"
  >
    <g clipPath="url(#clip0_22_6327)">
      <path
        d="M79.8947 7.9753C79.8947 8.29863 79.838 8.62901 79.7249 8.96641C79.6258 9.28976 79.4775 9.59202 79.2795 9.87318L64.0899 31.2982H79.4703V36.2537H55.9224V33.7865C55.9224 33.4912 55.9718 33.2031 56.0707 32.9219C56.1698 32.6268 56.3112 32.3595 56.4951 32.1205L71.7271 10.6112H57.0042V5.65566H79.8947V7.9753Z"
        className="logo-path"
      />
      <path
        d="M44.3943 24.4869V36.2537H38.0299V24.4869L26.8499 5.65566H32.4505C33.002 5.65566 33.4405 5.78921 33.7658 6.05633C34.1053 6.30937 34.374 6.63975 34.572 7.04743L39.621 16.6845C39.9604 17.3312 40.2645 17.9357 40.5332 18.4979C40.816 19.0603 41.0635 19.6227 41.2757 20.185C41.4737 19.6227 41.6999 19.0603 41.9545 18.4979C42.2232 17.9216 42.5203 17.3171 42.8456 16.6845L47.8521 7.04743C48.0218 6.71003 48.2765 6.39373 48.6158 6.09849C48.9553 5.80328 49.3938 5.65566 49.9311 5.65566H55.5742L44.3943 24.4869Z"
        className="logo-path"
      />
      <path
        d="M27.7061 20.9442C27.7061 23.1795 27.3242 25.239 26.5604 27.1229C25.8109 28.9927 24.7431 30.6024 23.3571 31.952C21.9852 33.3016 20.3305 34.3559 18.3929 35.115C16.4554 35.8742 14.3056 36.2537 11.9437 36.2537H0.106079V5.65566H11.9437C14.3056 5.65566 16.4554 6.03523 18.3929 6.79439C20.3305 7.55354 21.9852 8.61496 23.3571 9.97861C24.7431 11.3282 25.8109 12.9379 26.5604 14.8077C27.3242 16.6775 27.7061 18.723 27.7061 20.9442ZM21.172 20.9442C21.172 19.3415 20.9598 17.9005 20.5356 16.6212C20.1113 15.3419 19.5032 14.2594 18.7112 13.3737C17.9192 12.488 16.9503 11.8062 15.8048 11.3282C14.6733 10.8502 13.3863 10.6112 11.9437 10.6112H6.51284V31.2982H11.9437C13.3863 31.2982 14.6733 31.0662 15.8048 30.6023C16.9503 30.1244 17.9192 29.4424 18.7112 28.5568C19.5032 27.657 20.1113 26.5675 20.5356 25.2881C20.9598 24.009 21.172 22.5609 21.172 20.9442Z"
        className="logo-path"
      />
      <path
        d="M111.894 8.81194C107.565 7.88928 106.07 4.35434 105.571 2.78817C104.166 7.96751 99.5955 8.81194 99.5955 8.81194C103.609 9.71574 105.056 13.5373 105.582 15.0767C106.564 10.9892 110.332 9.32731 111.894 8.81194Z"
        className="logo-path"
      />
      <path
        d="M111.894 2.75398C110.31 2.4164 109.763 1.12311 109.581 0.55011C109.067 2.44503 107.394 2.75398 107.394 2.75398C108.863 3.08464 109.392 4.48279 109.584 5.04601C109.944 3.55055 111.322 2.94253 111.894 2.75398Z"
        className="logo-path"
      />
      <path
        d="M107.709 16.4761C109.303 15.9106 111.089 16.7387 111.339 18.4026C111.682 20.6789 111.517 23.0151 110.842 25.2426C109.87 28.4485 107.891 31.2608 105.194 33.2675C102.498 35.2741 99.2259 36.3698 95.8576 36.3939C92.4892 36.418 89.2016 35.3692 86.4764 33.4013C83.7513 31.4334 81.7316 28.6496 80.7134 25.458C79.6952 22.2664 79.7319 18.8345 80.8182 15.6651C81.9046 12.4957 83.9834 9.75542 86.7502 7.84565C88.6726 6.51869 90.8569 5.64113 93.1406 5.26108C94.8099 4.98327 96.1542 6.4157 96.1061 8.09752C96.0579 9.77934 94.615 11.0572 92.9927 11.5375C92.0192 11.8257 91.0914 12.2669 90.2463 12.8502C88.5552 14.0176 87.2844 15.6927 86.6204 17.6301C85.9562 19.5675 85.9337 21.6653 86.5562 23.6163C87.1786 25.5673 88.4132 27.2689 90.079 28.4718C91.7449 29.6747 93.7545 30.3159 95.8134 30.3012C97.8725 30.2864 99.8726 29.6167 101.521 28.39C103.169 27.1635 104.379 25.4443 104.973 23.4846C105.27 22.5055 105.405 21.492 105.38 20.4825C105.338 18.8005 106.115 17.0416 107.709 16.4761Z"
        className="logo-path"
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_22_6327"
        x1="67.2372"
        y1="-9.94796"
        x2="53.2186"
        y2="52.0524"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#0F6FFF" />
        <stop offset="1" stopColor="#A026FF" />
      </linearGradient>
      <clipPath id="clip0_22_6327">
        <rect width="112" height="36" fill="white" transform="translate(0 0.5)" />
      </clipPath>
    </defs>
  </svg>
)

// Animated share button component
const ShareButton = ({ icon, label, color, onClick, className }) => {
  return (
    <motion.button
      whileHover={{
        scale: 1.03,
        y: -2,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 text-white py-3 px-4 rounded-lg font-medium",
        "transition-all duration-300 relative overflow-hidden group",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      <div className="absolute -inset-1 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-white/10 to-transparent blur-sm group-hover:animate-shimmer" />
      {icon}
      <span className="relative z-10">{label}</span>
    </motion.button>
  )
}

// Main ShareModal component
const ShareModal = ({ isOpen, onClose, taskId, taskName }) => {
  const [isCopied, setIsCopied] = useState(false)
  const modalRef = useRef(null)
  const confettiCanvasRef = useRef(null)

  // URL to share with taskId parameter and isFocused flag
  let shareUrl = '';
  if (typeof window !== "undefined") {
    shareUrl = window.location.origin + "/tasks?taskId=" + taskId + "&isFocused=true";
  }

  // Share message for different platforms
  const shareMessage = encodeURIComponent(
    `DYZO Task Sharing\n\n` +
      `I've shared an important task${taskName ? ` "${taskName}"` : ""} with you from DYZO. ` +
      `Please review it when you have a moment.\n\n` +
      `View Task: ${shareUrl}\n\n` +
      `Please update the status once you've completed it or if you need any clarification.\n\n` +
      `Thank you!`,
  )

  // Handle copy to clipboard with animation and fallback
  const copyToClipboard = () => {
    try {
      // Modern Clipboard API method with fallback
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl)
      } else {
        // Fallback for browsers without clipboard API support
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        textArea.style.position = 'fixed' // Make it invisible
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy') // Old method as fallback
        document.body.removeChild(textArea)
      }

      setIsCopied(true)

      // Trigger confetti effect
      if (confettiCanvasRef.current) {
        const canvas = confettiCanvasRef.current
        const myConfetti = confetti.create(canvas, {
          resize: true,
          useWorker: true,
        })
      }
    } catch (err) {
      console.error('Failed to copy URL: ', err)
      // Optional: Show error message to user
    }

    setTimeout(() => setIsCopied(false), 2000)
  }

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle keyboard events (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          {/* Hidden canvas for confetti */}
          <canvas
            ref={confettiCanvasRef}
            className="fixed inset-0 pointer-events-none z-[10000]"
            style={{ width: "100%", height: "100%" }}
          />

          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden relative"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 to-blue-50/80 dark:from-slate-800/50 dark:to-slate-900/50 z-0" />

            {/* Animated pattern overlay */}
            <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20 pattern-dots" />

            {/* Animated glow effects */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-700">
              <motion.h3
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"
              >
                <Icon icon="lucide:share-2" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Share Task
              </motion.h3>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
                aria-label="Close"
              >
                <Icon icon="lucide:x" className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Logo */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center py-6 relative z-10"
            >
              <div className="relative">
                <DyzoLogo />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-md rounded-full"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>

            {/* Task info */}
            {taskName && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="px-6 mb-4 relative z-10"
              >
                <div className="bg-purple-50 dark:bg-slate-700/50 rounded-lg p-3 border border-purple-100 dark:border-slate-600">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-purple-700 dark:text-purple-300">Task:</span> {taskName}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="px-6 pb-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Share this task with your team or colleagues:
                </p>

                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 group">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 pr-10 text-sm bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 transition-all"
                        onClick={(e) => e.target.select()}
                      />
                      <div className="absolute inset-0 pointer-events-none rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent bg-[length:400%_100%] animate-shimmer" />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyToClipboard}
                      className={cn(
                        "p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center relative overflow-hidden",
                        isCopied
                          ? "bg-green-100 text-green-700 dark:bg-green-800/50 dark:text-green-300"
                          : "bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-800/50",
                      )}
                      title={isCopied ? "Copied!" : "Copy Link"}
                    >
                      <motion.div
                        initial={false}
                        animate={{
                          rotate: isCopied ? 0 : 360,
                          scale: isCopied ? [1, 1.2, 1] : 1,
                        }}
                        transition={{
                          duration: 0.5,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        {isCopied ? (
                          <Icon icon="lucide:check" className="w-5 h-5" />
                        ) : (
                          <Icon icon="lucide:copy" className="w-5 h-5" />
                        )}
                      </motion.div>
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {isCopied && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 mt-1 text-xs text-green-600 dark:text-green-400 flex items-center"
                      >
                        <Icon icon="lucide:check" className="w-3 h-3 mr-1" />
                        Copied to clipboard!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-2"
                >
                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-[#25D366] hover:bg-[#20c35e] text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group"
                    onClick={() => window.open(`https://wa.me/?text=${shareMessage}`, "_blank")}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    <div className="absolute -inset-1 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-white/10 to-transparent blur-sm group-hover:animate-shimmer" />
                    <Icon icon="logos:whatsapp-icon" className="w-5 h-5" />
                    <span>Share via WhatsApp</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ShareModal; 