import { useState, useRef, useEffect } from "react";
import dyzoLogo from "../../assets/images/landing_page/dyzonamelogo.png";
import { fetchPOST, fetchAuthFilePost, fetchAuthPost } from "../../store/api/apiSlice";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import moment from "moment";
import AnimatedTask from "./AnimatedTask";
import LoaderCircle from "../Loader-circle";
import Modal from "../ui/Modal";

// TaskSkeletonLoader component for task loading states
const TaskSkeletonLoader = ({ count = 6, isComplete = false }) => {
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const loadingMessages = [
    "Connecting to our AI Server...",
    "Generating tasks based on the prompts provided by you...",
    "Fetching Tasks...",
    "Finalizing your project...",
  ];

  useEffect(() => {
    // Progress bar animation that stops at 90% until API call is complete
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // If complete signal is received, go to 100%
        if (isComplete) return 100;

        // Otherwise cap at 90% to indicate waiting for API
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }

        // Normal progression
        return prev + 0.5;
      });
    }, 50); // Update every 50ms for smooth animation

    // Message sequence with timeouts
    const messageTimeouts = [
      setTimeout(() => setLoadingStep(1), 2000), // After 2 seconds
      setTimeout(() => setLoadingStep(2), 6000), // After 6 seconds (4 more seconds)
      setTimeout(() => setLoadingStep(3), 10000), // After 10 seconds (4 more seconds)
    ];

    return () => {
      clearInterval(progressInterval);
      messageTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isComplete]);

  // Effect to handle completion
  useEffect(() => {
    if (isComplete && progress < 100) {
      // Quick progress to 100% when API call finishes
      const completeInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(completeInterval);
            return 100;
          }
          return prev + 2;
        });
      }, 20);

      return () => clearInterval(completeInterval);
    }
  }, [isComplete, progress]);

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-8 sm:py-10 flex flex-col items-center justify-center">
      {/* AI Assistant Image/Icon */}
      <div className="mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center">
          <Icon
            icon="heroicons:sparkles"
            className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 animate-pulse"
          />
        </div>
      </div>

      {/* Progress Message */}
      <div className="mb-6 text-center">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
          {loadingMessages[loadingStep]}
        </h3>
        <p className="text-sm text-gray-500">
          Please wait while we prepare your tasks
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-10">
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
          <div
            className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">
            {progress === 90 && !isComplete ? "Waiting for response..." : ""}
          </span>
          <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Animated Loading Dots - Only show when not complete */}
      {(!isComplete || progress < 100) && (
        <div className="flex space-x-2 justify-center items-center mb-8">
          {[1, 2, 3].map((dot) => (
            <div
              key={dot}
              className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce"
              style={{
                animationDelay: `${0.1 * dot}s`,
                animationDuration: '0.6s'
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Task Placeholder Skeletons - Less prominent */}
      <div className="w-full max-w-md opacity-40">
        {Array(3)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="border border-gray-100 rounded-lg p-3 mb-3 flex items-center"
            >
              <div className="w-6 h-6 rounded-full bg-purple-100 flex-shrink-0 mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded-md w-1/2 animate-pulse opacity-60"></div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

// Add this inside your component file (for demo, you can move to global CSS later)
if (
  typeof window !== "undefined" &&
  !document.getElementById("zoom-animate-style")
) {
  const style = document.createElement("style");
  style.id = "zoom-animate-style";
  style.innerHTML = `
    @keyframes zoomInOut {
      0% { transform: scale(1); }
      30% { transform: scale(1.15); }
      60% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    .zoom-animate {
      animation: zoomInOut 0.4s;
    }
  `;
  document.head.appendChild(style);
}

// Simple Task component without animation
const Task = ({ task, index, onUpdate, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const inputRef = useRef(null);

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
    <div className="flex-1">
      {isEditing ? (
        <div className="flex items-center space-x-2">
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
          <span
            className={`text-[12px] md:text-sm select-none cursor-default truncate flex-1 ${task.completed ? "text-gray-400" : "text-gray-700"
              }`}
          >
            {task.title}
          </span>
          <button
            onClick={handleEdit}
            className="opacity-0 hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity select-none flex-shrink-0 ml-2"
            disabled={loading}
          >
            <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const ProjectOnboarding = () => {
  // State Management
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apiCallComplete, setApiCallComplete] = useState(false);
  const [projectDescription, setProjectDescription] = useState('');
  const [projectName, setProjectName] = useState("Untitled Project");
  const [tasks, setTasks] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [qaAnswers, setQaAnswers] = useState([]);
  const [qaInput, setQaInput] = useState("");
  const [isTasksReady, setIsTasksReady] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [continueAnim, setContinueAnim] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const continueBtnRef = useRef(null);
  const [qaSuggestionOptions, setQaSuggestionOptions] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedQASuggestion, setSelectedQASuggestion] = useState(null);
  const [zoomAnimKey, setZoomAnimKey] = useState(0);
  const inputRef = useRef(null);
  const qaInputRef = useRef(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState("");
  const projectInputRef = useRef();


  // Project Input Auto Focus
  useEffect(() => {
    if (showProjectModal && projectInputRef.current) {
      // Delay focus slightly to ensure modal is mounted
      setTimeout(() => projectInputRef.current.focus(), 500);
    }
  }, [showProjectModal]);

  // Suggestion options
  const suggestionOptions = [
    {
      label: "I want to work on my personal development",
      topic: "Personal Development",
    },
    {
      label: "I want to achieve my professional Goals",
      topic: "Professional Goals",
    },
    {
      label: "Would like to do Digital Cleanup and improve productivity",
      topic: "Digital Cleanup",
    },
    {
      label: "I want to work on my Financial Wellness",
      topic: "Financial Wellness",
    },
    {
      label: "I want to work on Mental Health & Self-Care",
      topic: "Mental Health & Self-Care",
    },
    {
      label: "I want to work on my Career Growth / Networking",
      topic: "Career Growth / Networking",
    },
  ];

  // Refs and Hooks
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.user);

  // Reset apiCallComplete when step changes
  useEffect(() => {
    setApiCallComplete(false);
  }, [step]);

  // Automatically move to step 3 when tasks are ready
  useEffect(() => {
    if (step === 2 && isTasksReady) {
      setStep(3);
    }
  }, [step, isTasksReady]);

  // Handle task visibility and sequential display
  useEffect(() => {
    if (tasks.length > 0 && currentTaskIndex < tasks.length) {
      // Only show next task after current task's typing is complete
      if (isTypingComplete || currentTaskIndex === 0) {
        const timer = setTimeout(() => {
          setVisibleTasks((prev) => [...prev, currentTaskIndex]);
          setCurrentTaskIndex((prev) => prev + 1);
          setIsTypingComplete(false);
        }, 1000); // Delay between tasks

        return () => clearTimeout(timer);
      }
    }
  }, [tasks, currentTaskIndex, isTypingComplete]);

  // Reset task visibility when new tasks are generated
  useEffect(() => {
    if (tasks.length > 0) {
      setVisibleTasks([]);
      setCurrentTaskIndex(0);
      setIsTypingComplete(false);
      setIsInitialLoad(true);
    }
  }, [tasks]);

  // Add this effect to handle input focus
  useEffect(() => {
    if (isInputFocused && projectDescription.trim()) {
      setContinueAnim(true);
    }
  }, [isInputFocused, projectDescription]);

  useEffect(() => {
    if (step === 1 && inputRef.current) {
      inputRef.current.focus();
      // Optionally, set height on mount
      // inputRef.current.style.height = 'auto';
      // inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [step]);

  useEffect(() => {
    if (step === 2 && qaInputRef.current) {
      qaInputRef.current.focus();
    }
  }, [step]);

  // Helper Functions
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  // Step 1 Handlers
  const handleDescriptionSubmit = async () => {
    if (!projectDescription.trim()) {
      toast.error("Please tell us what you're working on");
      return;
    }
    try {
      setLoading(true);
      setApiCallComplete(false); // Reset API call status
      setProjectName(projectDescription.trim());
      localStorage.setItem("project_name", projectDescription.trim());

      // Initial API call to get session ID and first question
      const requestBody = {
        user_message: projectDescription.trim(),
        requireTasks: true,
        taskCount: 3,
        project_name: projectDescription.trim(),
      };

     

      const initialResponse = await fetch(
        "https://staging.api.dyzo.ai/agent/api/task-agent/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      const initialData = await initialResponse.json();

      // Store the API's session ID
      if (initialData.session_id) {
   
        setSessionId(initialData.session_id);
        localStorage.setItem("current_session_id", initialData.session_id);
      }

      // Handle initial response
      if (initialData.response) {
     

        if (
          initialData.response.type === "questions" &&
          Array.isArray(initialData.response.questions)
        ) {
          const questions = initialData.response.questions.map(
            (q) => q.question || q
          );
          const questionText = questions.join("\n");
       
          setCurrentQuestion(questionText);
          setChatMessages([
            {
              type: "ai",
              content: questionText,
            },
          ]);

          // Set suggestions from API response
          if (Array.isArray(initialData.response.suggestions)) {
          
            setQaSuggestionOptions(initialData.response.suggestions);
            // Pre-fill the first suggestion if available
            if (initialData.response.suggestions.length > 0) {
              // setQaInput(initialData.response.suggestions[0]);
            }
          }
        } else if (initialData.response.message) {
        
          setCurrentQuestion(initialData.response.message);
          setChatMessages([
            {
              type: "ai",
              content: initialData.response.message,
            },
          ]);
        }
      }

      setStep(2);
      setApiCallComplete(true); // Mark API call as complete
    } catch (error) {
      console.error("Error in Step 1:", error);
      toast.error(error.message || "Something went wrong");
      setApiCallComplete(true); // Mark API call as complete even on error
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Handlers
  const handleQaAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!qaInput.trim()) return;
    setQaLoading(true);
    setTasksLoading(true);
    setApiCallComplete(false); // Reset API call status
    try {
      const updatedAnswers = [...qaAnswers, qaInput];
      setQaAnswers(updatedAnswers);
      setQaInput("");

      // Get the existing session ID from localStorage
      const currentSessionId = localStorage.getItem("current_session_id");
      if (!currentSessionId) {
        throw new Error("Session ID not found");
      }

      // Log the current state
   

      const requestBody = {
        user_message: qaInput,
        session_id: currentSessionId,
        requireTasks: true,
        taskCount: 3,
        previousAnswers: updatedAnswers,
        project_name: projectName,
      };

   
      const aiResponse = await fetch(
        "https://staging.api.dyzo.ai/agent/api/task-agent/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      const aiData = await aiResponse.json();
    

      // Update session ID if API returns a new one
      if (aiData.session_id && aiData.session_id !== currentSessionId) {
       
        setSessionId(aiData.session_id);
        localStorage.setItem("current_session_id", aiData.session_id);
      }

      if (aiData.response) {
        // Handle task_list response
        if (
          aiData.response.type === "task_list" &&
          Array.isArray(aiData.response.tasks)
        ) {
          const formattedTasks = aiData.response.tasks.map((task) => ({
            id:
              task.id ||
              `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: task.name || task.title || "Untitled Task",
            description: task.description || "",
            allocated_time: task.allocated_hours,
            completed: false,
            depends_on: task.depends_on || [],
          }));
     
          setTasks(formattedTasks);
          setIsTasksReady(true);
          setTasksLoading(false);
          setApiCallComplete(true); // Set API call as complete
          setChatMessages((prev) => [
            ...prev,
            {
              type: "ai",
              content: `I've generated ${formattedTasks.length} tasks for your project. You can review and modify them as needed.`,
            },
          ]);
        }
        // Handle questions response
        else if (
          aiData.response.type === "questions" &&
          Array.isArray(aiData.response.questions)
        ) {
          const questions = aiData.response.questions.map(
            (q) => q.question || q
          );
          const questionText = questions.join("\n");
        
          setCurrentQuestion(questionText);
          setChatMessages((prev) => [
            ...prev,
            { type: "ai", content: questionText },
          ]);

          // Update suggestions from API response
          if (Array.isArray(aiData.response.suggestions)) {
           
            setQaSuggestionOptions(aiData.response.suggestions);
            // Pre-fill the first suggestion if available
            if (aiData.response.suggestions.length > 0) {
              // setQaInput(aiData.response.suggestions[0]);
            }
          } else {
            // Clear suggestions if none provided
            setQaSuggestionOptions([]);
          }
          setTasksLoading(false);
        }
        // Handle tasks response
        else if (
          aiData.response.type === "tasks" &&
          Array.isArray(aiData.response.tasks)
        ) {
        
          const formattedTasks = aiData.response.tasks.map((task) => ({
            id:
              task.id ||
              `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: task.title || "Untitled Task",
            description: task.description || "",
            allocated_time: Number(task.allocated_time) || 0,
            completed: false,
          }));
          setTasks(formattedTasks);
          setIsTasksReady(true);
          setTasksLoading(false);
          setChatMessages((prev) => [
            ...prev,
            {
              type: "ai",
              content:
                "I've generated some tasks for your project. You can review and modify them as needed.",
            },
          ]);
        }
        // Handle generic response
        else if (aiData.response.message) {
        
          setCurrentQuestion(aiData.response.message);
          setChatMessages((prev) => [
            ...prev,
            { type: "ai", content: aiData.response.message },
          ]);
          setTasksLoading(false);
        }
        // If no specific type is found, try to handle as a question
        else if (typeof aiData.response === "string") {
       
          setCurrentQuestion(aiData.response);
          setChatMessages((prev) => [
            ...prev,
            { type: "ai", content: aiData.response },
          ]);
          setTasksLoading(false);
        }
      } else {
     
        const defaultMessage =
          "Please provide more details about your project.";
        setCurrentQuestion(defaultMessage);
        setChatMessages((prev) => [
          ...prev,
          { type: "ai", content: defaultMessage },
        ]);
        setTasksLoading(false);
      }
      setApiCallComplete(true); // Ensure API call is marked complete
    } catch (error) {
      console.error("Error in handleQaAnswerSubmit:", error);
      setApiCallComplete(true); // Mark API call complete even on error
      const errorMessage = "Sorry, there was an error. Please try again.";
      setCurrentQuestion(errorMessage);
      setChatMessages((prev) => [
        ...prev,
        { type: "ai", content: errorMessage },
      ]);
    } finally {
      setQaLoading(false);
    }
  };

  // Updated handleChatSubmit function
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMsg = currentMessage;
    setChatMessages((prev) => [...prev, { type: "user", content: userMsg }]);
    setCurrentMessage("");
    scrollToBottom();
    setLoading(true);

    try {


      // Get the existing session ID from localStorage
      const currentSessionId = localStorage.getItem("current_session_id");
      if (!currentSessionId) {
        throw new Error("Session ID not found");
      }

      const response = await fetch(
        "https://staging.api.dyzo.ai/agent/api/task-agent/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_message: userMsg,
            session_id: currentSessionId,
            tasks: tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              allocated_time: t.allocated_time,
            })),
            previousMessages: chatMessages.slice(-5).map((msg) => ({
              type: msg.type,
              content: msg.content,
            })),
          }),
        }
      );

      if (!response.ok) throw new Error("AI chat failed");

      const data = await response.json();
     

      // Update session ID if API returns a new one
      if (data.session_id && data.session_id !== currentSessionId) {
        setSessionId(data.session_id);
        localStorage.setItem("current_session_id", data.session_id);
      }

      if (data.response) {
        // Handle task updates
        if (
          data.response.type === "tasks" &&
          Array.isArray(data.response.tasks)
        ) {
          const updatedTasks = tasks.map((task) => {
            const aiTask = data.response.tasks.find(
              (t) =>
                (t.id && t.id === task.id) ||
                (t.reference_title &&
                  t.reference_title.toLowerCase() === task.title.toLowerCase())
            );
            if (aiTask) {
              return {
                ...task,
                title: aiTask.title || task.title,
                description: aiTask.description || task.description,
                allocated_time: aiTask.allocated_time || task.allocated_time,
              };
            }
            return task;
          });

          setTasks(updatedTasks);
          localStorage.setItem("generated_tasks", JSON.stringify(updatedTasks));
          const storedProjectInfo = localStorage.getItem("project");
          if (storedProjectInfo) {
            const parsedProjectInfo = JSON.parse(storedProjectInfo);
            localStorage.setItem(
              "project",
              JSON.stringify({ ...parsedProjectInfo, tasks: updatedTasks })
            );
          }
        }

        const aiResponse = data.response.message || "Tasks updated.";
        setChatMessages((prev) => [
          ...prev,
          { type: "ai", content: aiResponse },
        ]);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error(error.message || "Chat failed");
      setChatMessages((prev) => [
        ...prev,
        { type: "ai", content: "Sorry, error processing request." },
      ]);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskIndex, newTitle) => {
    if (taskIndex === undefined || taskIndex === null) return;

    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      if (updatedTasks[taskIndex]) {
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          title: newTitle || "Untitled Task",
        };
        localStorage.setItem("generated_tasks", JSON.stringify(updatedTasks));
      }
      return updatedTasks;
    });
    setIsInitialLoad(false); // Disable animation after edit
  };

  const handleTaskDelete = (taskId) => {
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.filter((task) => task.id !== taskId);
      localStorage.setItem("generated_tasks", JSON.stringify(updatedTasks));
      return updatedTasks;
    });
    setIsInitialLoad(false); // Disable animation after delete
  };

  // Handle typing completion
  const handleTypingComplete = () => {
    setIsTypingComplete(true);
  };

  const handleContinueToTasks = async (useDefaultProject = false) => {
    // User info null check
    if (!userInfo || !userInfo._id || !userInfo.companyId) {
      toast.error("User info missing. Please login again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use selectedQASuggestion if available, else fallback to projectName
      // const finalProjectName = selectedQASuggestion || projectName;

      let currProjectId;
      let projectNameToStore = projectNameInput.trim();

      if (!useDefaultProject) {
        if (!projectNameToStore) {
          toast.error("Project name cannot be empty.");
          setLoading(false);
          return;
        }
        // Create project
        const projectResponse = await fetchPOST(
          `${import.meta.env.VITE_APP_DJANGO}/project/`,
          {
            body: {
              name: projectNameToStore,
              companyId: userInfo.companyId,
              assignee: [userInfo._id],
              dueDate: moment().add(7, "days").format(),
              priority: "medium",
            },
          }
        );
        if (!projectResponse || !projectResponse.status) {
          toast.error(
            projectResponse?.message || "Failed to create project in database."
          );
          setLoading(false);
          return;
        }

        currProjectId = projectResponse?._id;
        setProjectId(currProjectId);

      } else {
        if (!userInfo.default_project_id) {
          toast.error("No default project found. Please enter a project name.");
          setLoading(false);
          return;
        }

        currProjectId = userInfo.default_project_id;
        projectNameToStore = "Untitled Project";
      }


      // Create selected tasks in bulk
      const nameToAlloc = new Map();
      const bulkPayload = tasks.map((taskObj) => {
        const taskName = typeof taskObj === "string" ? taskObj : taskObj.title;
        const description =
          typeof taskObj === "object" && taskObj.description
            ? taskObj.description
            : "";
        const allocated_time =
          typeof taskObj === "object" && taskObj.allocated_time
            ? taskObj.allocated_time
            : 0;

        if (taskName) nameToAlloc.set(taskName, allocated_time);

        return {
          taskName: taskName || "Untitled Task",
          description,
          userId: userInfo._id,
          projectId: currProjectId,
          assigned_users: [userInfo._id],
        };
      });

      const bulkResult = await fetchAuthPost(`${import.meta.env.VITE_APP_DJANGO}/api/bulk-create-tasks/${userInfo._id}/?fromOnboarding=true`, {
        body: { tasks: bulkPayload },
      });

      let created = [];
      if (Array.isArray(bulkResult)) created = bulkResult;
      else if (Array.isArray(bulkResult?.data)) created = bulkResult.data;
      else if (Array.isArray(bulkResult?.tasks)) created = bulkResult.tasks;

      if (!created.length) {
        throw new Error("Failed to create tasks in bulk.");
      }

      const createdTasks = created.map((task) => {
        const title = task.taskName || task.name || "Untitled Task";
        const alloc = nameToAlloc.get(title) ?? 0;
        return {
          id: task.id || task.taskId,
          title,
          description: task.description || "",
          allocated_time: alloc,
          status: "pending",
          currProjectId,
          completed: false,
        };
      });

      setTasks(createdTasks);
      localStorage.setItem("generated_tasks", JSON.stringify(createdTasks));
      // localStorage.setItem(
      //   "project",
      //   JSON.stringify({
      //     project_id: currProjectId,
      //     project_name: projectNameToStore,
      //     tasks: createdTasks,
      //   })
      // );
      localStorage.setItem("fromOnboarding", "true");
      // navigate(`/tasks?projectId=${projectId}&userId=${userInfo._id}`);

      navigate("/dashboard", { replace: true });
      setTimeout(() => navigate(`/tasks?userId=${userInfo._id}`), 0);

    } catch (error) {
      console.error("Error in handleContinueToTasks:", error);
      toast.error(
        error.message ||
        `Failed to create project or tasks. Details: ${JSON.stringify(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Render Functions
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-xl md:text-4xl font-bold text-gray-800">
                  What is your Role
                </h1>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <textarea
                    ref={inputRef}
                    value={projectDescription}
                    onChange={e => {
                      setProjectDescription(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onKeyPress={e =>
                      e.key === 'Enter' && !e.shiftKey && projectDescription.trim() && handleDescriptionSubmit()
                    }
                    placeholder="E.g., Software Developer, Teacher, Student, Freelancer, Entrepreneur"
                    className="w-full p-2 md:p-4 text-xs md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400"
                    disabled={loading}
                    rows={1} // <-- Make it taller
                    style={{ overflow: 'hidden', resize: 'none' }} // Optional: minHeight for extra control
                  />
                </div>
                {/*   <p className="text-base text-gray-600 leading-relaxed">
                  Not sure? Here are some ideas to get started.
                </p> */}
                {/* Suggestion Options */}
                {/*   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {suggestionOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setProjectDescription(option.label);
                        setProjectName(option.topic);
                        setContinueAnim(true);
                      }}
                      className="text-left p-2 md:p-4 text-xs md:text-sm bg-gray-50 hover:bg-purple-50 border border-gray-200 rounded-lg transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div> */}

                <div className="flex items-center justify-between pt-10">
                  <button
                    onClick={() => {
                      navigate("/dashboard", { replace: true });
                      setTimeout(() => navigate(`/tasks?userId=${userInfo._id}`), 0);
                    }}
                    className="text-xs md:text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Skip for now
                  </button>
                  <div className="flex flex-col gap-2 relative">
                    <button
                      ref={continueBtnRef}
                      onClick={handleDescriptionSubmit}
                      disabled={loading || !projectDescription.trim()}
                      className={`
                        px-3 md:px-8 py-1.5 md:py-3 text-xs md:text-sm bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1 md:space-x-2
                        ${zoomAnimKey > 0 ? "zoom-animate" : ""}
                      `}
                      key={zoomAnimKey}
                    >
                      {loading ? (
                        <>
                          <Icon
                            icon="eos-icons:loading"
                            className="w-3 h-3 md:w-5 md:h-5"
                          />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <Icon
                            icon="heroicons:arrow-right"
                            className="w-3 h-3 md:w-5 md:h-5"
                          />
                        </>
                      )}
                    </button>
                    {loading && (
                      <span className="text-xs absolute -bottom-10 md:-bottom-6 right-0 text-center">
                        This may take a few seconds.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 2:
        // Show loader if tasks are being generated
        if (tasksLoading) {
          return (
            <div className="w-full h-full">
              <TaskSkeletonLoader isComplete={apiCallComplete} />
            </div>
          );
        }
        return (
          <>
            {/* Q&A Section */}
            {isTasksReady ? null : (
              <div className="flex flex-col justify-between h-full">
                <div>
                  {/* Back button moved to the top */}
                  <div className="mb-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-2 border border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors text-xs sm:text-sm font-medium"
                      disabled={qaLoading}
                    >
                      <Icon
                        icon="heroicons:arrow-left"
                        className="w-3 h-3 md:w-4 md:h-4"
                      />
                      <span>Back</span>
                    </button>
                  </div>

                  {currentQuestion && (
                    <div className="border border-purple-200 rounded-xl p-2 md:p-4 mb-2 md:mb-2">
                      <div className="flex items-start space-x-2 md:space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 md:w-8 md:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Icon
                              icon="heroicons:chat-bubble-left-ellipsis"
                              className="w-3 h-3 md:w-4 md:h-4 text-purple-600"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs md:text-sm text-gray-800 font-medium">
                            AI Assistant
                          </p>
                          <p className="text-xs md:text-sm text-gray-600 mt-1">
                            {currentQuestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={handleQaAnswerSubmit}
                    className="flex flex-col space-y-2"
                  >
                    {/* Dynamic Suggestion Options from API */}
                    {qaSuggestionOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 mb-2">
                        {qaSuggestionOptions.map((option, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setQaInput(option);
                              setSelectedQASuggestion(option);
                            }}
                            className="px-3 py-1 text-xs md:text-sm bg-gray-50 hover:bg-purple-50 border border-gray-200 rounded-lg transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    <textarea
                      ref={qaInputRef}
                      value={qaInput}
                      onChange={e => {
                        setQaInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      placeholder={
                        qaLoading
                          ? 'Please wait a moment — this may take a few seconds'
                          : 'Tell us your focus area'
                      }
                      className="flex-1 p-2 md:p-4 md:mt-6 text-xs md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400"
                      disabled={qaLoading}
                      rows={2}
                      style={{ overflow: 'hidden', resize: 'none' }}
                    />
                  </form>
                </div>

                <div className="flex items-center justify-between pt-10">
                  <div>
                    <button
                      onClick={() => {
                        navigate("/dashboard", { replace: true });
                        setTimeout(() => navigate(`/tasks?userId=${userInfo._id}`), 0);
                      }}
                      className="flex items-center gap-2 p-2 md:p-4 text-gray-500 hover:text-gray-900 font-medium transition-colors"
                    >


                      <span className="text-xs sm:text-sm">Skip</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 items-center justify-center">
                    <button
                      onClick={handleQaAnswerSubmit}
                      disabled={qaLoading || !qaInput.trim()}
                      className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-purple-600 text-white text-xs md:text-sm rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      <span>Generate Tasks With AI</span>
                      {qaLoading ? (
                        <Icon
                          icon="eos-icons:loading"
                          className="w-3 h-3 md:w-5 md:h-5"
                        />
                      ) : (
                        <Icon
                          icon="heroicons:arrow-right"
                          className="w-3 h-3 md:w-5 md:h-5"
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );

      case 3:
        // Show loader if tasks are loading (AI is generating tasks)
        if (tasksLoading) {
          return (
            <div className="w-full h-full">
              <TaskSkeletonLoader isComplete={apiCallComplete} />
            </div>
          );
        }
        // Show loader if tasks are not ready
        if (!isTasksReady || !Array.isArray(tasks) || tasks.length === 0) {
          return (
            <div className="w-full h-full">
              <TaskSkeletonLoader isComplete={apiCallComplete} />
            </div>
          );
        }
        return (
          <>
            {/* Right: Task List Card */}
            <div className="bg-white rounded-xl w-full max-w-full p-2 sm:p-4 md:p-6 flex flex-col space-y-2 md:space-y-6 mx-auto">
              {/* Project Name */}
              <div className="gap-2 flex flex-col">
                <h3 className="text-base">Tasks For</h3>
                <div className="flex items-start sm:items-center">
                  {/* <div className="w-[8px] h-2 bg-green-400 rounded-full mr-2 mt-1 sm:mt-0"></div> */}
                  <span className="font-semibold text-gray-700 text-[14px] md:text-lg capitalize leading-[1.2]">
                    {projectName}
                  </span>
                </div>

                <h3 className="text-sm text-gray-400">
                  Feel free to edit these tasks if there are any changes.
                </h3>
              </div>

              {/* Task List Section */}
              <div className="flex flex-col max-h-[60vh] md:max-h-[40vh] space-y-1 md:space-y-4 overflow-y-auto pr-0 md:pr-1">
                {Array.isArray(tasks) &&
                  tasks.map((task, index) => (
                    <div
                      style={{ marginTop: "0" }}
                      key={task?.id || `task-${index}`}
                      className={`bg-white px-2 md:px-3 py-2 shadow-sm flex items-center space-x-2 md:space-x-3 mb-1 w-full group relative ${isInitialLoad ? "transition-all duration-500" : ""
                        } ${visibleTasks.includes(index)
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                        } sm:w-auto${index !== tasks.length - 1
                          ? " border-b border-gray-200"
                          : ""
                        }`}
                    >
                      {/* Serial Number */}
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-purple-600">
                          {index + 1}
                        </span>
                      </div>

                      {/* Task Content */}
                      <div className="flex-1">
                        <AnimatedTask
                          task={task}
                          index={index}
                          onUpdate={handleTaskUpdate}
                          loading={loading}
                          isVisible={visibleTasks.includes(index)}
                          onTypingComplete={handleTypingComplete}
                          isInitialLoad={isInitialLoad}
                          onDelete={handleTaskDelete}
                        />
                      </div>
                    </div>
                  ))}
                {(!Array.isArray(tasks) || tasks.length === 0) && (
                  <p className="text-gray-500 italic text-xs">
                    No tasks available.
                  </p>
                )}
              </div>

              {/* Finalize Button */}
              <div className="pt-1 md:pt-4 flex flex-col space-y-2">
                <button
                  // onClick={handleContinueToTasks}
                  onClick={() => setShowProjectModal(true)}
                  // disabled={loading}
                  className="w-full px-3 md:px-8 py-1.5 md:py-3 text-xs md:text-sm bg-black-500 text-white font-medium rounded-md transition-colors hover:bg-black-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Create {tasks?.length} Tasks
                </button>
                <button
                  onClick={() => {
                    navigate("/dashboard", { replace: true });
                    setTimeout(() => navigate(`/tasks?userId=${userInfo._id}`), 0);
                  }}
                  className="text-xs md:text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors underline text-center"
                >
                  Skip
                </button>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    if (continueAnim && continueBtnRef.current) {
      const handler = () => setContinueAnim(false);
      const btn = continueBtnRef.current;
      btn.addEventListener("animationend", handler);
      return () => btn.removeEventListener("animationend", handler);
    }
  }, [continueAnim]);

  useEffect(() => {
    // Only run on first load, and only for step 1
    if (step === 1) {
      setTimeout(() => setZoomAnimKey(zoomAnimKey => zoomAnimKey + 1), 100); // trigger first
      setTimeout(() => setZoomAnimKey(zoomAnimKey => zoomAnimKey + 1), 900); // trigger second after first ends
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-purple-50 p-2 md:p-12 font-sans flex flex-col">
      {/* Logo */}
      <div className="mb-2 md:mb-4">
        <img
          src={dyzoLogo || "/placeholder.svg"}
          alt="Dyzo logo"
          className="w-20 md:w-28"
        />
      </div>
      {/* Main Card */}
      <div className="md:w-[750px] sm:mx-auto mx-2 bg-white p-2 md:p-10 rounded-xl shadow-lg border border-gray-200 flex-1 flex flex-col">
        {/* Content Grid */}
        <div className="flex-1">{renderStepContent()}</div>
      </div>
      <Modal
        title="Project Name"
        activeModal={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setProjectNameInput("")
        }}
        centered
      >
        <div className="flex flex-col items-center space-y-4">
          <input
            ref={projectInputRef}
            type="text"
            value={projectNameInput}
            onChange={e => setProjectNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading && projectNameInput.trim() !== '') {
                handleContinueToTasks(false);
              }
            }}
            placeholder="Enter project name"
            className="w-full p-2 md:p-3 text-xs md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400"
            autoFocus
          />
          <button
            className="mt-10 px-4 py-1 sm:py-1.5 bg-purple-600 text-sm text-white rounded hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={() => handleContinueToTasks(false)}
            disabled={loading || projectNameInput.trim() === ""}
            title={projectNameInput.trim() === "" && "Please enter a project name."}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {loading ? "Creating..." : "Submit"}
          </button>
          <button
            onClick={() => handleContinueToTasks(true)}
            disabled={loading}
            className="text-xs md:text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors underline text-center"
          >
            Skip Project Name
          </button>
        </div>
      </Modal>
    </div>

  );
};

export default ProjectOnboarding;
