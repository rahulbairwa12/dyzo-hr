import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "../src/assets/scss/app.scss";
import { BrowserRouter } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import store from "./store";
import { PermissionProvider } from "./components/userProfile/PermissionContext";
import { TourProvider } from "./components/tourguide/TourConext";
import 'shepherd.js/dist/css/shepherd.css';


// Enhanced polyfill to identify which library is using DOMNodeInserted
if (typeof window !== 'undefined') {
  // Utility function to analyze stack traces
  window.analyzeStackTrace = function(stackTrace) {
    // Common library paths to look for
    const libraryPatterns = [
      { name: "react-quill", pattern: /quill/ },
      { name: "emoji-picker-react", pattern: /emoji-picker/ },
      { name: "react-beautiful-dnd", pattern: /beautiful-dnd/ },
      { name: "react-collapse", pattern: /collapse/ },
      { name: "shepherd.js", pattern: /shepherd/ },
      { name: "react-pdf", pattern: /react-pdf/ },
      { name: "react-date-range", pattern: /date-range/ }
    ];
    
    // Check each library pattern against the stack trace
    const matches = [];
    libraryPatterns.forEach(lib => {
      if (lib.pattern.test(stackTrace)) {
        matches.push(lib.name);
      }
    });
    
    return matches.length > 0 
      ? `Likely libraries causing the issue: ${matches.join(", ")}` 
      : "Could not identify the library from the stack trace";
  };

  // Track if we've already logged detailed information
  let hasLoggedDetailed = false;
  
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'DOMNodeInserted') {
      // Only log detailed information once to avoid console spam
      if (!hasLoggedDetailed) {
        const stackTrace = new Error().stack;
        console.warn('DOMNodeInserted event is deprecated. Consider using MutationObserver instead.');
        console.warn('Stack trace:', stackTrace);
        console.warn(window.analyzeStackTrace(stackTrace));
        console.warn('To analyze other occurrences, call window.analyzeStackTrace(stackTraceString)');
        hasLoggedDetailed = true;
      }
      
      // Still allow the event listener to be registered to maintain functionality
      return originalAddEventListener.call(this, type, listener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);

// Register a minimal service worker so Chrome shows the install prompt
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}