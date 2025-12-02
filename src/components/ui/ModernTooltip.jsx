import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away.css";

// Custom style for the tooltip
const customTooltipClass = `
  px-3 py-2 rounded-lg shadow-lg bg-white text-gray-900 text-sm font-medium
  border border-gray-200
  dark:bg-gray-900 dark:text-white dark:border-gray-700
`;

// Add custom theme styles
const customThemeStyles = `
  .tippy-box[data-theme~='custom-light'] {
    background-color: #EDEDED !important;
    color: #333;
    border: 1px solid #D1C7F7;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1);
  }
  .tippy-box[data-theme~='custom-light'][data-placement^='top'] > .tippy-arrow::before {
    border-top-color: #EDEDED !important;
  }
  .tippy-box[data-theme~='custom-light'][data-placement^='bottom'] > .tippy-arrow::before {
    border-bottom-color: #EDEDED !important;
  }
  .tippy-box[data-theme~='custom-light'][data-placement^='left'] > .tippy-arrow::before {
    border-left-color: #EDEDED !important;
  }
  .tippy-box[data-theme~='custom-light'][data-placement^='right'] > .tippy-arrow::before {
    border-right-color: #EDEDED !important;
  }

  /* Custom Dark Theme */
  .tippy-box[data-theme~='custom-dark'] {
    background-color: #1e293b !important;
    color: #f3f3f3;
    border: 1px solid #44485a;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 14px 0 rgba(0,0,0,0.4);
  }
  .tippy-box[data-theme~='custom-dark'][data-placement^='top'] > .tippy-arrow::before {
    border-top-color: #1e293b !important;
  }
  .tippy-box[data-theme~='custom-dark'][data-placement^='bottom'] > .tippy-arrow::before {
    border-bottom-color: #1e293b !important;
  }
  .tippy-box[data-theme~='custom-dark'][data-placement^='left'] > .tippy-arrow::before {
    border-left-color: #1e293b !important;
  }
  .tippy-box[data-theme~='custom-dark'][data-placement^='right'] > .tippy-arrow::before {
    border-right-color: #1e293b !important;
  }

  .dark .tippy-box[data-theme~='custom-light'] {
    background-color: #1e293b !important;
    color: #f3f3f3;
    border: 1px solid #44485a;
  }
  .dark .tippy-box[data-theme~='custom-light'][data-placement^='top'] > .tippy-arrow::before {
    border-top-color: #1e293b !important;
  }
  .dark .tippy-box[data-theme~='custom-light'][data-placement^='bottom'] > .tippy-arrow::before {
    border-bottom-color: #1e293b !important;
  }
  .dark .tippy-box[data-theme~='custom-light'][data-placement^='left'] > .tippy-arrow::before {
    border-left-color: #1e293b !important;
  }
  .dark .tippy-box[data-theme~='custom-light'][data-placement^='right'] > .tippy-arrow::before {
    border-right-color: #1e293b !important;
  }
`;

// Inject styles into document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = customThemeStyles;
  if (!document.head.querySelector("style[data-modern-tippy-custom]")) {
    styleElement.setAttribute("data-modern-tippy-custom", "true");
    document.head.appendChild(styleElement);
  }
}

const ModernTooltip = ({
  children,
  content = "content",
  title,
  className = "btn btn-dark",
  placement = "top",
  arrow = true,
  theme = "custom-light", // ignore theme, use custom class
  animation = "shift-away",
  trigger = "mouseenter focus",
  interactive = false,
  allowHTML = false,
  maxWidth = 300,
  duration = 200,
  ...rest
}) => {
  return (
    <div>
      <Tippy
        content={content}
        placement={placement}
        arrow={arrow}
        animation={animation}
        trigger={trigger}
        interactive={interactive}
        allowHTML={allowHTML}
        maxWidth={maxWidth}
        duration={duration}
        className="modern-tippy-box"
        theme={theme}
        {...rest}
      >
        {children ? children : <button className={className}>{title}</button>}
      </Tippy>
    </div>
  );
};

export default ModernTooltip;
