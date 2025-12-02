import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className = "",
  onClose = null,
  isopen = false,
  minimal = false,
}) => {
  const [isOpen, setIsOpen] = useState(isopen);
  const [dropdownPosition, setDropdownPosition] = useState("right");
  const [verticalPosition, setVerticalPosition] = useState("bottom");
  const [menuStyles, setMenuStyles] = useState({});
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both the button and the dropdown menu
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        if (onClose) onClose();
      }
    };

    if (isOpen) {
      // Use a slight delay to avoid immediate closure on open
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Calculate dropdown position
  const updatePosition = useCallback(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dropdownWidth = 180; // Estimated dropdown width
      const dropdownHeight = Math.min(options.length * 40 + 20, 200); // Reduced max height

      // Check horizontal positioning
      const spaceOnRight = viewportWidth - buttonRect.right;
      const spaceOnLeft = buttonRect.left;

      let leftPosition;
      if (spaceOnRight < dropdownWidth && spaceOnLeft > dropdownWidth) {
        setDropdownPosition("left");
        leftPosition = buttonRect.right - dropdownWidth;
      } else {
        setDropdownPosition("right");
        leftPosition = buttonRect.left;
      }

      // Check vertical positioning relative to viewport
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      let topPosition;
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setVerticalPosition("top");
        topPosition = buttonRect.top - dropdownHeight - 4; // 4px gap
      } else {
        setVerticalPosition("bottom");
        topPosition = buttonRect.bottom + 4; // 4px gap
      }

      // Set fixed positioning styles for portal
      setMenuStyles({
        position: 'fixed',
        left: `${leftPosition}px`,
        top: `${topPosition}px`,
        zIndex: 9999,
      });
    }
  }, [isOpen, options.length]);

  // Update position when dropdown opens or on scroll/resize
  useEffect(() => {
    updatePosition();

    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true); // Use capture to catch all scroll events
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      if (onClose) onClose();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={
          minimal
            ? `w-full flex items-center text-xs font-medium text-gray-700 dark:text-slate-300 cursor-pointer bg-transparent border-none p-0 focus:outline-none ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`
            : `w-full px-2 py-1.5 text-left bg-white dark:bg-slate-700
               border border-slate-300 dark:border-slate-500 rounded
               text-xs font-medium transition-all duration-200
               ${
                 disabled
                   ? "opacity-50 cursor-not-allowed"
                   : "hover:border-slate-400 dark:hover:border-slate-400 cursor-pointer"
               }
               ${
                 isOpen
                   ? "border-blue-500 ring-1 ring-blue-500/20"
                   : "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
               }
               text-gray-900 dark:text-white
               min-h-[36px] flex items-center justify-between`
        }
      >
        <div
          className={
            minimal ? "flex items-center w-full" : "flex items-center space-x-2"
          }
        >
          {selectedOption ? (
            <>
              <div
                className={
                  minimal
                    ? "w-2 h-2 rounded-full flex-shrink-0 mr-1.5"
                    : "w-2.5 h-2.5 rounded-full flex-shrink-0"
                }
                style={{ backgroundColor: selectedOption.color }}
              />
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 truncate">
              {placeholder}
            </span>
          )}
        </div>
        {!minimal && (
          <Icon
            icon="heroicons:chevron-down"
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
        {minimal && (
          <Icon
            icon="heroicons-outline:chevron-down"
            className="ml-1 w-3 h-3 text-gray-500"
          />
        )}
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-md shadow-lg min-w-[160px] max-w-[200px] dropdown-options"
          style={{
            ...menuStyles,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          <div className="py-1 flex flex-col">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`
                  w-full px-3 py-2.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-600
                  focus:bg-slate-100 dark:focus:bg-slate-600 focus:outline-none
                  transition-colors duration-150 block
                  ${
                    option.value === value
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-gray-900 dark:text-white"
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="truncate">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomDropdown;
