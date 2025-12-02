// Add keyboard shortcut handling to the Layout component
// If this file doesn't exist, we'll create a new file for keyboard shortcuts

// Import necessary hooks and components
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import keyboardShortcuts, { SHORTCUTS, isEditableElement, getShortcutsList } from "../../utils/keyboardShortcuts";
import useDarkMode from "../../hooks/useDarkMode";

// Add keyboard shortcut handling to the existing Layout component
// ... existing imports and code ...

const Layout = ({ children }) => {
  // ... existing state and code ...
  
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [waitingForSecondKey, setWaitingForSecondKey] = useState(false);
  const [firstKey, setFirstKey] = useState(null);
  const navigate = useNavigate();
  const [isDark, setDarkMode] = useDarkMode();

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input, textarea, or contentEditable element
      if (isEditableElement(e.target)) {
        return;
      }

      // If we're waiting for a second key in a sequence
      if (waitingForSecondKey) {
        setWaitingForSecondKey(false);
        
        // Handle 'g' then 'd' for dashboard
        if (firstKey === 'g' && e.key.toLowerCase() === 'd') {
          navigate("/dashboard");
          toast.info("Shortcut: Go to Dashboard");
          return;
        }
        
        // Handle 'g' then 'p' for projects
        if (firstKey === 'g' && e.key.toLowerCase() === 'p') {
          navigate("/projects");
          toast.info("Shortcut: Go to Projects");
          return;
        }
        
        // Handle 'g' then 't' for tasks
        if (firstKey === 'g' && e.key.toLowerCase() === 't') {
          navigate("/tasks");
          toast.info("Shortcut: Go to Tasks");
          return;
        }
        
        // If second key doesn't match any sequence, reset and process as normal
        setFirstKey(null);
      }

      // Check for first key in a sequence
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
        setWaitingForSecondKey(true);
        setFirstKey('g');
        return;
      }

      // Handle single key shortcuts
      if (keyboardShortcuts.matchesShortcut(e, SHORTCUTS.ADD_TASK)) {
        e.preventDefault();
        
     
        
        // Create and dispatch a custom event that can be listened to by the Tasks page
        const addTaskEvent = new CustomEvent('pwpulse-add-task-shortcut');
        document.dispatchEvent(addTaskEvent);
   
        
        // Try to use the globally exposed addTask function
        if (typeof window.pwpulseAddTask === 'function') {
      
          window.pwpulseAddTask();
          toast.info("Shortcut: Add New Task");
          return;
        }
        
        // Try to use the button ref
        if (window.pwpulseAddTaskButton && window.pwpulseAddTaskButton.current) {

          window.pwpulseAddTaskButton.current.click();
          toast.info("Shortcut: Add New Task");
          return;
        }
        
        // Try to use the stored React click handler
        if (window.reactAddTaskOnClick) {

          window.reactAddTaskOnClick();
          toast.info("Shortcut: Add New Task");
          return;
        }
        
        // Try to use the stored original click handler
        if (window.originalAddTaskOnClick) {

          window.originalAddTaskOnClick();
          toast.info("Shortcut: Add New Task");
          return;
        }
        
        // Check if we're already on the tasks page
        const isOnTasksPage = window.location.pathname.includes('/tasks');
        
        if (isOnTasksPage) {
          // Try clicking the button directly
          try {
            // First try to find the button by ID (which we added in the useEffect)
            let addTaskButton = document.getElementById("keyboard-shortcut-add-task-button");
          
            
            // If not found by ID, try by data attribute
            if (!addTaskButton) {
              addTaskButton = document.querySelector('[data-shortcut-target="add-task"]');
          
            }
            
            // If not found by ID or data attribute, try other methods
            if (!addTaskButton) {
              // Method 1: Using the exact structure from the user's HTML
              addTaskButton = document.querySelector("button.btn.btn-dark.w-full.block.task-stepFirst");
            
              
              // Method 2: Using a more specific selector based on the SVG path
              if (!addTaskButton) {
                addTaskButton = document.querySelector('button.btn svg path[d="M12 4v16m8-8H4"]');
                if (addTaskButton) {
                  // Navigate up to the button element
                  addTaskButton = addTaskButton.closest('button');
                }
              
              }
              
              // Method 3: Using the text content
              if (!addTaskButton) {
                const buttons = Array.from(document.querySelectorAll('button'));
                addTaskButton = buttons.find(btn => {
                  const spanText = btn.querySelector('span > span:last-child');
                  return spanText && spanText.textContent.trim() === 'Add Task';
                });
            
              }
              
              // Method 4: Using a combination of classes and structure
              if (!addTaskButton) {
                const buttons = Array.from(document.querySelectorAll('button.btn'));
                addTaskButton = buttons.find(btn => {
                  const hasIcon = btn.querySelector('svg path[d="M12 4v16m8-8H4"]');
                  const hasText = btn.textContent.includes('Add Task');
                  return hasIcon && hasText;
                });
             
              }
            }
            
            if (addTaskButton) {

              
              // Method 1: Standard click
              addTaskButton.click();
              
              // Method 2: MouseEvent
              try {
                const clickEvent = new MouseEvent('click', {
                  view: window,
                  bubbles: true,
                  cancelable: true
                });
                addTaskButton.dispatchEvent(clickEvent);
              } catch (err) {
                console.error("Error dispatching click event:", err);
              }
            } else {
           
              // Navigate to the same page with a query parameter to trigger the add task modal
              navigate(`${window.location.pathname}?addTask=true`);
            }
          } catch (error) {
            console.error("Error trying to click Add Task button:", error);
            // Navigate to the same page with a query parameter to trigger the add task modal
            navigate(`${window.location.pathname}?addTask=true`);
          }
          
          toast.info("Shortcut: Add New Task");
        } else {
          // If not on tasks page, navigate to tasks page with query parameter
       
          navigate("/tasks?addTask=true");
          toast.info("Shortcut: Add New Task");
        }
      } else if (keyboardShortcuts.matchesShortcut(e, SHORTCUTS.ADD_PROJECT)) {
        e.preventDefault();
        navigate("/projects/add");
        toast.info("Shortcut: Add New Project");
      } else if (keyboardShortcuts.matchesShortcut(e, SHORTCUTS.VIEW_REPORTS)) {
        e.preventDefault();
        navigate("/reports");
        toast.info("Shortcut: View Reports");
      } else if (keyboardShortcuts.matchesShortcut(e, SHORTCUTS.SEARCH)) {
        e.preventDefault();
        document.querySelector(".search-input")?.focus();
        toast.info("Shortcut: Search");
      } else if (keyboardShortcuts.matchesShortcut(e, SHORTCUTS.SHOW_SHORTCUTS)) {
        e.preventDefault();
        setShowShortcutHelp(true);
      } else if (keyboardShortcuts.matchesShortcut(e, SHORTCUTS.TOGGLE_DARK_MODE)) {
        e.preventDefault();
        setDarkMode(!isDark);
        toast.info(`Shortcut: ${isDark ? 'Light' : 'Dark'} Mode Activated`);
      }
    };

    // Add event listener for keyboard shortcuts
    document.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [navigate, waitingForSecondKey, firstKey, isDark, setDarkMode]);

  // Add an ID to the Add Task button when the page loads
  useEffect(() => {
    // Function to add ID to the Add Task button
    const addIdToAddTaskButton = () => {
      // Try to find the Add Task button using the selectors
      const addTaskButton = 
        document.querySelector("button.btn.btn-dark.w-full.block.task-stepFirst") ||
        document.querySelector('button.btn svg path[d="M12 4v16m8-8H4"]')?.closest('button') ||
        Array.from(document.querySelectorAll('button')).find(btn => {
          const spanText = btn.querySelector('span > span:last-child');
          return spanText && spanText.textContent.trim() === 'Add Task';
        }) ||
        Array.from(document.querySelectorAll('button.btn')).find(btn => {
          const hasIcon = btn.querySelector('svg path[d="M12 4v16m8-8H4"]');
          const hasText = btn.textContent.includes('Add Task');
          return hasIcon && hasText;
        });

      // If found, add an ID to it and store the original click handler
      if (addTaskButton && !addTaskButton.id) {
      
        addTaskButton.id = "keyboard-shortcut-add-task-button";
        
        // Store the original onclick function
        if (addTaskButton.onclick) {
          window.originalAddTaskOnClick = addTaskButton.onclick;
        }
        
        // Get the React event handler
        const reactHandler = addTaskButton.__reactEventHandlers || 
                            addTaskButton[Object.keys(addTaskButton).find(key => key.startsWith('__reactEventHandlers'))];
        
        if (reactHandler && reactHandler.onClick) {
          window.reactAddTaskOnClick = reactHandler.onClick;
        }
        
        // Add a data attribute to make it easier to find
        addTaskButton.setAttribute('data-shortcut-target', 'add-task');
      }
    };

    // Run initially
    addIdToAddTaskButton();

    // Set up a MutationObserver to run when the DOM changes
    const observer = new MutationObserver(() => {
      addIdToAddTaskButton();
    });

    // Start observing
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // Clean up
    return () => {
      observer.disconnect();
    };
  }, []);

  // Get the list of shortcuts for the help modal
  const shortcutsList = getShortcutsList();

  return (
    <>
      {/* ... existing layout code ... */}
      
      {/* Keyboard Shortcut Help Modal */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Keyboard Shortcuts</h2>
              <button 
                onClick={() => setShowShortcutHelp(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {shortcutsList.map((shortcut) => (
                <div key={shortcut.id} className="flex justify-between">
                  <span className="dark:text-white">{shortcut.description}</span>
                  <span className="font-mono bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded dark:text-white">
                    {shortcut.display}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <a 
                href="/docs/KEYBOARD_SHORTCUTS.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View full documentation
              </a>
              <button
                onClick={() => setShowShortcutHelp(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Status indicator for key sequences */}
      {waitingForSecondKey && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-md shadow-lg z-50">
          Pressed <span className="font-mono bg-gray-700 px-2 py-1 rounded">{firstKey.toUpperCase()}</span> - waiting for next key...
        </div>
      )}
      
      {children}
    </>
  );
};

export default Layout; 