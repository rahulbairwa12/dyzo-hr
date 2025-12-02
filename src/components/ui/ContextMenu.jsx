import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

const ContextMenu = ({
  isOpen,
  position,
  onClose,
  items = [],
  task = null
}) => {
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (isOpen) {
      const menuWidth = 180; // approx. your min-w-[160px]
      const menuHeight = items.length * 40; // each item ~40px tall

      let left = position.x;
      let top = position.y;

      // Check horizontal overflow
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 10; // shift left
      }

      // Check vertical overflow
      if (top + menuHeight > window.innerHeight) {
        top = window.innerHeight - menuHeight - 10; // shift up
      }

      setMenuStyle({ left, top });

      // 🔹 Close menu on scroll
      const handleScroll = () => {
        onClose();
      };

      window.addEventListener("scroll", handleScroll, true);

      return () => {
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [isOpen, position, items.length, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="context-menu-container fixed z-50 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg py-1 min-w-[160px]"
      style={menuStyle}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <button
          key={index}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 ${item.disabled
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-700 dark:text-slate-300"
            }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!item.disabled && item.onClick) {
              item.onClick(task);
              onClose();
            }
          }}
          disabled={item.disabled}
        >
          {item.icon && <Icon icon={item.icon} className="w-4 h-4" />}
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ContextMenu;
