import React, { useState } from "react";
import { Icon } from "@iconify/react";

const CopyTaskNameButton = React.forwardRef(({
    taskName,
    taskNames = [],
    className = "",
    tooltipPosition = "top",
    tooltipDuration = 2000,
}, ref) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const tooltipPositions = {
        top: "-top-8 left-1/2 -translate-x-1/2",
        bottom: "-bottom-8 left-1/2 -translate-x-1/2",
        left: "top-1/2 -left-20 -translate-y-1/2",
        right: "top-1/2 -right-20 -translate-y-1/2",
    };

    const handleCopyTaskName = async (e) => {
        e.stopPropagation();

        setIsLoading(true);

        try {
            let namesToCopy = [];

            if (taskName) {
                // Single task name provided
                namesToCopy = [taskName];
            } else if (taskNames && Array.isArray(taskNames) && taskNames.length > 0) {
                // Multiple task names provided
                namesToCopy = taskNames;
            } else {
                throw new Error("No task name provided");
            }

            // Join task names with newlines
            const textContent = namesToCopy.join('\n');
            await copyTextToClipboard(textContent);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), tooltipDuration);
        } catch (err) {
            console.error("Failed to copy task name:", err);
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
                className={`p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600 ${className} ${isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                onClick={handleCopyTaskName}
                disabled={isLoading}
                aria-label="Copy task name"
                title="Copy task name"
            >
                <Icon
                    icon={
                        isLoading ? "mdi:loading" : isCopied ? "mdi:check" : "mdi:content-copy"
                    }
                    className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
            </button>

            {isCopied && (
                <div
                    className={`absolute ${tooltipPositions[tooltipPosition]
                        } bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg z-50 whitespace-nowrap`}
                >
                    Task name copied!
                </div>
            )}
        </div>
    );
});

export default CopyTaskNameButton;

