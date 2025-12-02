
import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

const AnimatedTask = ({
  task,
  index,
  onUpdate,
  loading,
  isVisible,
  onTypingComplete,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showFlash, setShowFlash] = useState(false);

  const inputRef = useRef(null);
  const previousTitleRef = useRef(task.title);

  // Update editedTitle when task changes
  useEffect(() => {
    setEditedTitle(task.title);

  }, [task]);

  // Visibility animation
  useEffect(() => {
    if (isVisible) {
      let currentIndex = 0;
      setDisplayedTitle("");
      setIsTyping(true);

      const typingInterval = setInterval(() => {
        if (currentIndex <= task.title.length) {
          setDisplayedTitle(task.title.slice(0, currentIndex));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
        }
      }, 50);

      return () => clearInterval(typingInterval);
    }
  }, [isVisible, task.title]);

  // Handle task title updates
  useEffect(() => {
    if (task.title !== previousTitleRef.current) {
      setEditedTitle(task.title);
      setShowFlash(true);
      const timer = setTimeout(() => {
        setShowFlash(false);
      }, 1000);
      previousTitleRef.current = task.title;
      return () => clearTimeout(timer);
    }
  }, [task.title]);

  // Call onTypingComplete immediately when task is active
  useEffect(() => {
    if (isVisible && onTypingComplete) {
      onTypingComplete();
    }
  }, [isVisible, onTypingComplete]);

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onUpdate(index, editedTitle);
      toast.success("Task updated successfully!");
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditedTitle(task.title);
    }
  };

  return (
    <div
      className={`flex-1 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${showFlash ? "bg-purple-100 rounded-lg p-1" : ""} animated-task-row`}
    >
      {isEditing ? (
        <div className="flex items-center space-x-2 w-full">
          <input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleSave}
            className="flex-1 p-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:text-green-700"
            disabled={loading}
          >
            <Icon icon="heroicons:check" className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between group w-full">
          <div className="flex items-center flex-1 min-w-0">
            <span
              className={`text-[12px] md:text-sm select-none cursor-default block w-full whitespace-normal break-words ${
                task.completed ? "text-gray-400" : "text-gray-700"
              }`}
              title={task.title}
            >
              {isTyping ? (
                <span className="inline-block">
                  {displayedTitle}
                  <span className="animate-blink">|</span>
                </span>
              ) : (
                task.title
              )}
            </span>
          </div>
          <div className="flex items-center flex-shrink-0 gap-1 ml-2">
            {task.allocated_time && (
              <span className="text-[12px] md:text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                {task.allocated_time}hr
              </span>
            )}
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-gray-600 transition-opacity select-none flex-shrink-0"
              disabled={loading}
            >
              <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Delete task"
                disabled={loading}
              >
                <Icon icon="heroicons:trash" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Add this style block for mobile horizontal scroll support
if (
  typeof window !== "undefined" &&
  !document.getElementById("animated-task-style")
) {
  const style = document.createElement("style");
  style.id = "animated-task-style";
  style.innerHTML = `
    @media (max-width: 640px) {
      .animated-task-row {
      
      }
    }
    @media (min-width: 641px) {
      .animated-task-row {
        width: 100%;
        display: flex;
        align-items: center;
        border-radius: 8px;
        background-color: #fff;
        margin-bottom: 8px;
      }
    }
  `;
  document.head.appendChild(style);
}

export default AnimatedTask;
