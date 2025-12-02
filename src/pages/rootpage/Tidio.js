import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getAuthToken } from "@/utils/authToken";

// Global state to track if we're already in the process of removal
// This will prevent race conditions during route transitions
let tidioBeingRemoved = false;
let hasReachedProtectedRoute = false;

// Helper to completely remove Tidio from the page
function removeTidioScript() {
  // Set the global removal state
  tidioBeingRemoved = true;

  // Try hiding first to prevent flashing
  if (window.tidioChatApi) {
    try {
      window.tidioChatApi.hide();
    } catch (e) {
      console.error("[Tidio Debug] ❌ Error hiding Tidio:", e);
    }
  }

  // Remove the script tag
  const tidioScript = document.querySelector('script[src*="tidio"]');
  if (tidioScript) {
    tidioScript.remove();
  } else {
  }

  // Remove any Tidio iframes/elements
  const tidioElements = document.querySelectorAll(
    '[id^="tidio"], #tidio-chat-code, #tidio-chat, .tidio-chat-code, iframe[src*="tidio"], div[class*="tidio"]'
  );

  tidioElements.forEach((el, i) => {
    el.remove();
  });

  // Reset the Tidio object
  if (window.tidioChatApi) {
    try {
      window.tidioChatApi = null;
    } catch (e) {
      console.error("[Tidio Debug] ❌ Error cleaning up Tidio:", e);
    }
  } else {
  }

  // Clear localStorage items related to Tidio
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.includes("tidio")) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error("[Tidio Debug] Error cleaning localStorage:", e);
  }

  // Try removing any leftover scripts that might be trying to re-add Tidio
  try {
    const allScripts = document.querySelectorAll("script");
    allScripts.forEach((script) => {
      if (script.textContent && script.textContent.includes("tidio")) {
        script.remove();
      }
    });
  } catch (e) {
    console.error("[Tidio Debug] Error removing inline tidio scripts:", e);
  }

  // Reset removal state after a short delay to allow other operations to complete
  setTimeout(() => {
    tidioBeingRemoved = false;
  }, 500);

  return true; // Return success flag
}

function loadTidio() {
  // Don't load if we're in the process of removing Tidio
  if (tidioBeingRemoved) {
    return;
  }

  // Don't load if we've reached a protected route
  if (hasReachedProtectedRoute) {
    return;
  }

  if (window.tidioChatApi) {
    return;
  }

  // Check if user is logged in - don't load Tidio if logged in
  if (isUserLoggedIn()) {
    return;
  }

  const script = document.createElement("script");
  script.src = "//code.tidio.co/rqgblgqcprnwt5edogxebg1jx45xuu8n.js";
  script.id = "tidio-script";
  script.async = true;
  script.defer = true;

  // Add event listeners for script loading

  script.onerror = (err) =>
    console.error("[Tidio Debug] ❌ Tidio script failed to load:", err);

  document.body.appendChild(script);
}

// Helper function to detect if user is logged in
function isUserLoggedIn() {
  return !!getAuthToken();
}

// Helper function to detect if current path is a protected route
function isProtectedRoute(pathname) {
  return (
    pathname === "/dashboard" ||
    pathname === "/tasks" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/tasks/")
  );
}

const Tidio = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const intervalRef = useRef(null);
  const previousPathRef = useRef(location.pathname);
  const isLoggedIn = isUserLoggedIn();

  // Check if we're on dashboard or tasks page or logged in
  const currentPathIsProtected = isProtectedRoute(location.pathname);
  const shouldRemoveTidio = currentPathIsProtected || isLoggedIn;

  // Update global flag when protected route is accessed
  if (currentPathIsProtected && !hasReachedProtectedRoute) {
    hasReachedProtectedRoute = true;
  }

  // Detect route changes
  useEffect(() => {
    const previousPath = previousPathRef.current;
    const currentPath = location.pathname;

    // Check if we're transitioning to a protected route
    if (!isProtectedRoute(previousPath) && isProtectedRoute(currentPath)) {
      hasReachedProtectedRoute = true;
      removeTidioScript();
    }

    // Update reference for next check
    previousPathRef.current = currentPath;
  }, [location.pathname]);

  // Remove on component mount if needed
  useEffect(() => {
    if (shouldRemoveTidio) {
      removeTidioScript();
    }

    // Always try to remove Tidio when component unmounts (app closing or page refresh)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      removeTidioScript();
    };
  }, []);

  // Main effect for handling path changes and login state
  useEffect(() => {
    // If we should remove Tidio, do so immediately
    if (shouldRemoveTidio) {
      setIsVisible(false);

      // Set up an aggressive checking interval when we're on protected pages
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        const hasTidioElements =
          document.querySelectorAll(
            '[id^="tidio"], #tidio-chat, .tidio-chat-code, iframe[src*="tidio"]'
          ).length > 0;
        if (hasTidioElements) {
        }
      }, 500); // Check every 500ms on protected pages

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    // If previous interval exists and we're now on a public page, clear it
    if (intervalRef.current && !shouldRemoveTidio) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only proceed to load if Tidio hasn't been loaded yet and user is not logged in
    // Also check global flags to prevent loading after reaching protected routes
    if (
      window.tidioChatApi ||
      isLoggedIn ||
      tidioBeingRemoved ||
      hasReachedProtectedRoute
    ) {
      return;
    }

    // Use requestIdleCallback for better performance if available
    const loadWhenIdle = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(
          () => {
            loadTidio();
            setIsVisible(true);
          },
          { timeout: 10000 }
        );
      } else {
        // Fallback to setTimeout with a shorter delay

        setTimeout(() => {
          loadTidio();
          setIsVisible(true);
        }, 3000);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Load Tidio only when user has scrolled down and page is mostly loaded
          loadWhenIdle();
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    // Start observing when component is mounted

    const timer = setTimeout(() => {
      // Double-check we should still load Tidio before observing
      if (
        !tidioBeingRemoved &&
        !hasReachedProtectedRoute &&
        !isUserLoggedIn()
      ) {
        observer.observe(document.body);
      } else {
      }
    }, 2000);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      observer.disconnect();

      // If navigating to a protected page or logging in, ensure Tidio is removed
      const nowLoggedIn = isUserLoggedIn();
      const nowProtectedRoute = isProtectedRoute(location.pathname);
      if (nowLoggedIn || nowProtectedRoute) {
        removeTidioScript();
      }
    };
  }, [location.pathname, shouldRemoveTidio, isLoggedIn, isVisible]);

  // Add a storage event listener to detect login/logout
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (["token", "access_token", "userToken", "userInfo"].includes(e.key)) {
        const nowLoggedIn = isUserLoggedIn();

        if (nowLoggedIn) {
          hasReachedProtectedRoute = true; // Mark as having reached protected route
          removeTidioScript();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Add a MutationObserver to watch for Tidio being added to the DOM
  useEffect(() => {
    if (!shouldRemoveTidio) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          const hasTidioElements = Array.from(mutation.addedNodes).some(
            (node) => {
              if (node.nodeType !== Node.ELEMENT_NODE) return false;

              // Check if this is a Tidio element or contains Tidio elements
              if (node.id && node.id.includes("tidio")) return true;
              if (node.className && node.className.includes("tidio"))
                return true;

              // Check children
              return (
                node.querySelector &&
                node.querySelector(
                  '[id^="tidio"], #tidio-chat, .tidio-chat-code'
                )
              );
            }
          );

          if (hasTidioElements) {
            removeTidioScript();
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [shouldRemoveTidio]);

  // Listen for URL changes without react-router
  useEffect(() => {
    const handleUrlChange = () => {
      const currentPath = window.location.pathname;

      if (isProtectedRoute(currentPath)) {
        hasReachedProtectedRoute = true;
        removeTidioScript();
      }
    };

    window.addEventListener("popstate", handleUrlChange);

    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  return null;
};

export default Tidio;
