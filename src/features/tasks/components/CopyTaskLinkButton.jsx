import React, { useState } from "react";
import { Icon } from "@iconify/react";

const CopyTaskLinkButton = React.forwardRef(({
  taskUrl,
  taskIds,
  baseUrl,
  className = "",
  tooltipPosition = "top",
  tooltipDuration = 2000,
  taskNames = [],
}, ref) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tooltipPositions = {
    top: "-top-8 left-1/2 -translate-x-1/2",
    bottom: "-bottom-8 left-1/2 -translate-x-1/2",
    left: "top-1/2 -left-20 -translate-y-1/2",
    right: "top-1/2 -right-20 -translate-y-1/2",
  };

  // Function to format URL to match the required pattern
  const formatTaskUrl = (url) => {
    try {
      // Parse the URL
      const urlObj = new URL(url);

      // Get the redirect parameter
      const redirectPath = urlObj.searchParams.get('redirect');

      if (redirectPath) {
        // Parse the redirect path as a URL
        const redirectUrl = new URL(redirectPath, urlObj.origin);

        // Get taskId from redirect URL
        const taskId = redirectUrl.searchParams.get('taskId');

        if (taskId) {
          // Construct the new URL format
          const newUrl = `${urlObj.origin}${redirectUrl.pathname}?taskId=${taskId}&isFocused=true`;
          return newUrl;
        }
      }

      // If we can't parse properly, return the original URL
      return url;
    } catch (error) {
      console.error("Error formatting URL:", error);
      return url;
    }
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();

    setIsLoading(true);

    try {
      // Determine a base without query for constructing links when only IDs are provided
      const currentBasePath = `${window.location.origin}${window.location.pathname}`;
      const finalBasePath = baseUrl || currentBasePath;

      let linksToCopy = [];

      if (taskUrl) {
        // Prefer provided taskUrl, normalized if it contains redirect params
        linksToCopy = [formatTaskUrl(taskUrl)];
      } else if (taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
        // Build links from IDs without calling any API
        linksToCopy = taskIds.map((id) => `${finalBasePath}?taskId=${id}&isFocused=true`);
      } else {
        // Fallback to current URL normalized
        linksToCopy = [formatTaskUrl(window.location.href)];
      }

      // Only copy links (no task names)
      const textContent = linksToCopy.join('\n');
      await copyTextToClipboard(textContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), tooltipDuration);
    } catch (err) {
      console.error("Failed to copy task links:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyTextToClipboard = async (textContent) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textContent);
      } else {
        fallbackCopyText(textContent);
      }
    } catch (err) {
      console.error("Clipboard API failed:", err);
      fallbackCopyText(textContent);
    }
  };

  const fallbackCopyText = (textContent) => {
    const textArea = document.createElement("textarea");
    textArea.value = textContent;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        className={`p-1 rounded-full -mt-[4px] text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600 ${className} ${isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        onClick={handleCopyLink}
        disabled={isLoading}
        aria-label="Copy task links"
        title="Copy task links"
      >
        <Icon
          icon={
            isLoading ? "mdi:loading" : isCopied ? "mdi:check" : "mdi:link-variant"
          }
          className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
        />
      </button>

      {isCopied && (
        <div
          className={`absolute ${tooltipPositions[tooltipPosition]
            } bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg z-50 whitespace-nowrap`}
        >
          Task links copied!
        </div>
      )}
    </div>
  );
});

export default CopyTaskLinkButton;