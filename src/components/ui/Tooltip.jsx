import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import "tippy.js/themes/light-border.css";
import "tippy.js/animations/shift-away.css";
import "tippy.js/animations/scale-subtle.css";
import "tippy.js/animations/perspective-extreme.css";
import "tippy.js/animations/perspective-subtle.css";
import "tippy.js/animations/perspective.css";
import "tippy.js/animations/scale-extreme.css";
import "tippy.js/animations/scale-subtle.css";
import "tippy.js/animations/scale.css";
import "tippy.js/animations/shift-away-extreme.css";
import "tippy.js/animations/shift-away-subtle.css";
import "tippy.js/animations/shift-away.css";
import "tippy.js/animations/shift-toward-extreme.css";
import "tippy.js/animations/shift-toward-subtle.css";
import "tippy.js/animations/shift-toward.css";

// Add custom theme styles
const customThemeStyles = `
  .tippy-box[data-theme~='custom-light'] {
    background-color: #E8E5F9;
    color: #333;
    border: 1px solid #D1C7F7;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1);
  }

  .tippy-box[data-theme~='custom-light'][data-placement^='top'] > .tippy-arrow::before {
    border-top-color: #E8E5F9;
  }

  .tippy-box[data-theme~='custom-light'][data-placement^='bottom'] > .tippy-arrow::before {
    border-bottom-color: #E8E5F9;
  }

  .tippy-box[data-theme~='custom-light'][data-placement^='left'] > .tippy-arrow::before {
    border-left-color: #E8E5F9;
  }

  .tippy-box[data-theme~='custom-light'][data-placement^='right'] > .tippy-arrow::before {
    border-right-color: #E8E5F9;
  }
`;

// Inject styles into document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = customThemeStyles;
  if (!document.head.querySelector("style[data-tippy-custom]")) {
    styleElement.setAttribute("data-tippy-custom", "true");
    document.head.appendChild(styleElement);
  }
}

const Tooltip = ({
  children,
  content = "content",
  title,
  className = "btn btn-dark",
  placement = "top",
  arrow = true,
  theme = "dark",
  animation = "shift-away",
  trigger = "mouseenter focus",
  interactive = false,
  allowHTML = false,
  maxWidth = 350,
  duration = 200,
}) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // ✅ Skip tooltip completely on mobile
  if (isMobile) {
    return <>{children ? children : <button className={className}>{title}</button>}</>;
  }
  return (
    <div className="custom-tippy">
      <Tippy
        content={content}
        placement={placement}
        arrow={arrow}
        theme={theme}
        animation={animation}
        trigger={trigger}
        interactive={interactive}
        allowHTML={allowHTML}
        maxWidth={maxWidth}
        duration={duration}
      >
        {children ? children : <button className={className}>{title}</button>}
      </Tippy>
    </div>
  );
};

export default Tooltip;
