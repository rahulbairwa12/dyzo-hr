import { Icon } from "@iconify/react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCardWrapper from "@/components/ui/ProfileCardWrapper";
import { fetchAuthPut, fetchAuthGET, fetchAuthPost } from "@/store/api/apiSlice";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { djangoBaseURL, formatDateToDayMonthYear } from "@/helper";
import { ProfilePicture } from "../ui/profilePicture";
import Button from "../ui/Button";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import AddMemberModal from "@/components/Projects/AddMemberModal";
import ModernTooltip from "@/components/ui/ModernTooltip";
import DOMPurify from "dompurify";
import CommentWithMentions from "@/components/ui/CommentWithMentions";
import "flatpickr/dist/themes/material_green.css";
import { updateProjectMembers } from "@/store/projectsSlice";
import { useDispatch } from "react-redux";

// ensure anchor tags are safe
if (typeof window !== "undefined" && DOMPurify && DOMPurify.addHook) {
    DOMPurify.addHook("afterSanitizeAttributes", function (node) {
        if (node.tagName === "A") {
            if (!node.getAttribute("target")) node.setAttribute("target", "_blank");
            node.setAttribute("rel", "noopener noreferrer");
        }
    });
}

// Custom CSS for Flatpickr to match ProjectOverview theme
const customFlatpickrDarkStyles = `
    .flatpickr-calendar {
        background: #1e293b !important;
        border: 1px solid #334155 !important;
        border-radius: 0.5rem !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
    }
    
    .flatpickr-calendar.dark {
        background: #1e293b !important;
        color: #f8fafc !important;
    }
    
    .flatpickr-months {
        background: #1e293b !important;
        color: #f8fafc !important;
    }
    span.flatpickr-weekday{
        background: #1e293b !important;
        color: #f8fafc !important;
    }
    .flatpickr-month {
        background: #1e293b !important;
        color: #f8fafc !important;
    }
    
    .flatpickr-current-month {
        color: #f8fafc !important;
    }
    .flatpickr-days{
        border: none !important;
    }
    .dayContainer{
        border: none !important;
    }
    .flatpickr-monthDropdown-months {
        background: #1e293b !important;
        color: #f8fafc !important;
    }
    
    .flatpickr-weekdays {
        background: #1e293b !important;
    }
    
    .flatpickr-weekday {
        color: #94a3b8 !important;
    }
    
    .flatpickr-days {
        background: #1e293b !important;
    }
    
    .flatpickr-day {
        color: #f8fafc !important;
        background: #1e293b !important;
    }
    
    .flatpickr-day:hover {
        background: #334155 !important;
        color: #f8fafc !important;
    }
    
    .flatpickr-day.selected {
        background: #A259D6 !important;
        color: #ffffff !important;
        border-color: #A259D6 !important;
    }
    
    .flatpickr-day.today {
        border-color: #A259D6 !important;
    }
    
    .flatpickr-day.prevMonthDay,
    .flatpickr-day.nextMonthDay {
        color: #64748b !important;
    }
    
    .flatpickr-months .flatpickr-prev-month,
    .flatpickr-months .flatpickr-next-month {
        color: #f8fafc !important;
    }
    
    .flatpickr-months .flatpickr-prev-month:hover,
    .flatpickr-months .flatpickr-next-month:hover {
        color: #A259D6 !important;
    }
`;

const customFlatpickrStyles = `
  .flatpickr-calendar {
    background: #ffffff !important; /* white base */
    border: 2px solid #A259D644 !important; /* slate-200 */
    border-radius: 0.5rem !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
                0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
    overflow: hidden;
  }

  .flatpickr-calendar.light {
    background: #ffffff !important;
    color: #1e293b !important; /* slate-800 */
    border-radius: 0.5rem !important;
  }

  .flatpickr-months {
    background: #ffffff !important;
    color: #1e293b !important;
  }

  span.flatpickr-weekday {
    background: #ffffff !important;
    color: #475569 !important; /* slate-600 */
  }

  .flatpickr-month {
    background: #ffffff !important;
    color: #1e293b !important;
  }

  .flatpickr-current-month {
    color: #1e293b !important;
    font-weight: 600 !important;
  }

  .flatpickr-days {
    border: none !important;
    background: #ffffff !important;
  }

  .dayContainer {
    border: none !important;
  }

  .flatpickr-monthDropdown-months {
    background: #ffffff !important;
    color: #1e293b !important;
  }

  .flatpickr-weekdays {
    background: #f8fafc !important; /* light gray strip */
  }

  .flatpickr-weekday {
    color: #64748b !important; /* slate-500 */
  }

  .flatpickr-day {
    color: #1e293b !important;
    background: #ffffff !important;
    border-radius: 0.375rem !important;
    transition: all 0.2s ease;
  }

  .flatpickr-day:hover {
    background: #f3e8ff !important; /* subtle purple hover */
    color: #6b21a8 !important; /* purple-800 */
  }

  .flatpickr-day.selected {
    background: #A259D6 !important;
    color: #ffffff !important;
    border-color: #A259D6 !important;
  }

  .flatpickr-day.today {
    border-color: #A259D6 !important;
    color: #A259D6 !important;
    font-weight: 600 !important;
  }

  .flatpickr-day.selected.today, 
  .flatpickr-day.today.selected {
    background: #A259D6 !important;
    color: #fff !important;
    border-color: #A259D6 !important;
    font-weight: 700 !important;
  }

  .flatpickr-day.prevMonthDay,
  .flatpickr-day.nextMonthDay {
    color: #cbd5e1 !important; /* slate-300 */
  }

  .flatpickr-months .flatpickr-prev-month,
  .flatpickr-months .flatpickr-next-month {
    fill: #A259D6 !important;
    transition: color 0.2s ease;
  }

  .flatpickr-monthDropdown-months,
.flatpickr-monthDropdown-months option {
  background: #ffffff !important;
  color: #1e293b !important;
  font-size : 14px;
}
/* Make arrow spans visible */
.numInputWrapper .arrowUp,
.numInputWrapper .arrowDown {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 12px;
  font-size: 10px;
  cursor: pointer;
  opacity: 100;
  padding-left: 5px;
}

`;

// Inject custom styles
if (typeof document !== 'undefined') {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    const styleElement = document.createElement('style');
    styleElement.textContent = isDarkMode ? customFlatpickrDarkStyles : customFlatpickrStyles;
    document.head.appendChild(styleElement);
}

const ProjectOverview = ({ projectData, setProjectData, permissions, isDefaultProject,setActiveTab }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({
        description: projectData?.description || "",
        dueDate: projectData?.dueDate || ""
    });
    const [isSaving, setIsSaving] = useState(false);
    const userInfo = useSelector((state) => state.auth.user);
    const [journey, setJourney] = useState([]);
    const [journeyLoading, setJourneyLoading] = useState(true);
    const [journeyError, setJourneyError] = useState(false);
    const [leftColumnHeight, setLeftColumnHeight] = useState(0);
    const leftColumnRef = useRef(null);
    const rightColumnRef = useRef(null);
    const [modalOpen, setModalOpen] = useState(false);
    // New state for assignees and access levels
    const [assignees, setAssignees] = useState([]);
    const [accessLevels, setAccessLevels] = useState({});

    const editorRef = useRef(null);
    const [isDescEmpty, setIsDescEmpty] = useState(true);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Live project stats fetched from task-stats endpoint
    const [projectStats, setProjectStats] = useState({
        total_tasks: Number(projectData?.total_tasks) || 0,
        completed_tasks: Number(projectData?.completed_tasks) || 0,
        pending_tasks: Math.max(
            0,
            (Number(projectData?.total_tasks) || 0) - (Number(projectData?.completed_tasks) || 0)
        ),
        total_hours: Number(projectData?.total_hours) || 0,
    });

    useEffect(() => {
        if (isEditing && editorRef.current) {
            editorRef.current.innerHTML = DOMPurify.sanitize(editedData.description || "");
            const empty = (editorRef.current.textContent || "").trim().length === 0;
            setIsDescEmpty(empty);
        }
    }, [isEditing]);

    // Function to fetch journey data
    const fetchJourneyData = async () => {
        setJourneyLoading(true);
        setJourneyError(false);
        try {
            const data = await fetchAuthGET(`${djangoBaseURL}/projects/${projectData._id}/journey/`, false);
            if (data.status === 1) {
                setJourney(data.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            } else {
                setJourney([]);
                setJourneyError(true);
            }
        } catch (err) {
            setJourney([]);
            setJourneyError(true);
        } finally {
            setJourneyLoading(false);
        }
    };

    // Fetch latest task stats from API whenever Overview mounts or project changes
    const fetchProjectStats = useCallback(async () => {
        if (!projectData?._id) return;
        try {
            const data = await fetchAuthGET(`${djangoBaseURL}/projects/${projectData._id}/task-stats/`);
            if (data && data.status === 1) {
                const total_tasks = Number(data.total_tasks) || 0;
                const completed_tasks = Number(data.completed_tasks) || 0;
                const pending_tasks =
                    typeof data.pending_tasks === "number"
                        ? Number(data.pending_tasks) || 0
                        : Math.max(0, total_tasks - completed_tasks);
                const total_hours = Number(data.total_hours) || 0;
                setProjectStats({ total_tasks, completed_tasks, pending_tasks, total_hours });
            }
        } catch (_) {
            // keep previous stats on failure
        }
    }, [projectData?._id]);

    useEffect(() => {
        fetchProjectStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchProjectStats]);

    // Pre-fill assignees and accessLevels when modal opens
    useEffect(() => {
        if (modalOpen && projectData) {
            setAssignees(projectData.assignee_details || []);
            setAccessLevels(projectData.accessLevels || projectData.accessLevels || {});
        }
    }, [modalOpen, projectData]);

    // Close modal without saving; actual save will be triggered by AddMemberModal only if changed
    const handleModalClose = () => {
        setModalOpen(false);
    };

    // Called by AddMemberModal ONLY when data changed
    const handleMembersSaveIfChanged = async ({ assignees: newAssignees, accessLevels: newAccessLevels }) => {
        if (!projectData) return;
        try {
            const result = await dispatch(updateProjectMembers({
                projectId: projectData._id,
                userId: userInfo._id,
                assignees: newAssignees.map(u => u._id),  // Ensure these are IDs
                accessLevels: newAccessLevels
            })).unwrap();

            // Update local projectData state with the response to persist across tab changes
            const updatedProject = {
                ...projectData,
                ...result,
                // Ensure assignee_details is included
                assignee_details: result.assignee_details || newAssignees,
                assignee: result.assignee || newAssignees.map(u => u._id),
                accessLevels: result.accessLevels || newAccessLevels
            };
            setProjectData(updatedProject);
            fetchJourneyData();
        } catch (error) {
            console.error("Error updating project members:", error);
            toast.error("Error updating project members");
        }
    };
    useEffect(() => {
        fetchJourneyData();
    }, []);

    // Expose fetchJourneyData function to parent component
    useEffect(() => {
        if (setProjectData) {
            setProjectData(prev => ({
                ...prev,
                refreshJourney: fetchJourneyData,
                refreshProjectStats: fetchProjectStats
            }));
        }
    }, [setProjectData, fetchProjectStats]);

    // Listen for dark mode changes and reload Flatpickr theme
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'darkMode') {
                // Force re-render of Flatpickr instances
                const flatpickrInstances = document.querySelectorAll('.flatpickr-input');
                flatpickrInstances.forEach(input => {
                    if (input._flatpickr) {
                        input._flatpickr.redraw();
                    }
                });
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Measure left column height and apply to right column
    useEffect(() => {
        const updateHeight = () => {
            if (leftColumnRef.current) {
                const height = leftColumnRef.current.offsetHeight;
                setLeftColumnHeight(height);
            }
        };

        // Initial measurement
        updateHeight();

        // Re-measure on window resize
        window.addEventListener('resize', updateHeight);

        // Cleanup
        return () => window.removeEventListener('resize', updateHeight);
    }, [projectData, journey]); // Re-measure when data changes

    if (!projectData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">No project data available</div>
            </div>
        );
    }

    // Calculate pending tasks (from live stats)
    const pendingTasks = projectStats.pending_tasks;

    const stats = [
        {
            label: "Total Hours",
            value: projectStats.total_hours?.toLocaleString() || "0",
            icon: 'sidekickicons:arrow-path-clock-solid',
        },
        {
            label: "Total Tasks",
            value: projectStats.total_tasks?.toLocaleString() || "0",
            icon: 'hugeicons:task-02',
        },
        {
            label: "Completed Tasks",
            value: projectStats.completed_tasks?.toLocaleString() || "0",
            icon: 'hugeicons:task-done-02',
        },
        {
            label: "Pending Tasks",
            value: pendingTasks?.toLocaleString() || "0",
            icon: 'hugeicons:task-remove-02',
        },
    ];



    const handleEdit = () => {
        setEditedData({
            description: projectData.description || "",
            dueDate: projectData.dueDate || ""
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedData({
            description: projectData.description || "",
            dueDate: projectData.dueDate || ""
        });
    };

    // const handleDueDateChange = (selectedDates) => {
    //     if (selectedDates[0]) {
    //         const dateOnly = selectedDates[0] // Get only date part
    //         setEditedData({ ...editedData, dueDate: dateOnly });
    //     }
    // };
    const handleDueDateChange = (selectedDates) => {
        if (selectedDates[0]) {
            // Extract just the date part (year-month-day) without timezone
            const selectedDate = selectedDates[0];
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateOnly = `${year}-${month}-${day}`;

            setEditedData({ ...editedData, dueDate: dateOnly });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Ensure links are transformed before saving
            let finalDescription = editedData.description;
            try {
                const transformed = await transformLinks(editedData.description);
                finalDescription = transformed || editedData.description;
            } catch (_) { /* noop */ }
            const response = await fetchAuthPut(
                `${djangoBaseURL}/project-v2/${projectData._id}/${userInfo._id}/`,
                {
                    body: JSON.stringify({
                        description: finalDescription,
                        dueDate: editedData.dueDate // This will be date only, not timestamp
                    })
                }
            );

            if (response.status === 1) {
                setProjectData(prev => ({
                    ...prev,
                    description: response?.data?.description,
                    dueDate: response?.data?.dueDate
                }))
                toast.success("Project updated successfully");
                setIsEditing(false);
                // Refresh journey data
                fetchJourneyData();
            } else {
                toast.error("Failed to update project");
            }
        } catch (error) {
            toast.error("Error updating project");
            console.error("Update error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Expand safe allowlist to preserve CSS and structure
    const SAFE_ALLOWED_TAGS = [
        "a", "b", "i", "em", "strong", "br",
        "p", "span", "div", "ul", "ol", "li"
    ];

    const SAFE_ALLOWED_ATTR = [
        "href", "target", "rel", "class", "style"
    ];

    const transformLinks = async (content) => {
        if (!content) return content;

        // If content already has anchors, sanitize and return
        if (/<a\s+[^>]*href=/i.test(content)) {
            return DOMPurify.sanitize(content, { ALLOWED_TAGS: SAFE_ALLOWED_TAGS, ALLOWED_ATTR: SAFE_ALLOWED_ATTR });
        }

        // try server-side transformation first
        try {
            const data = await fetchAuthPost(`${djangoBaseURL}/change-message/`, {
                body: { message: content }
            });
            if (data?.status === 1 && data?.message) {
                // If server returned anchors, trust it (but sanitize)
                if (/<a\s+[^>]*href=/i.test(data.message)) {
                    return DOMPurify.sanitize(data.message, { ALLOWED_TAGS: SAFE_ALLOWED_TAGS, ALLOWED_ATTR: SAFE_ALLOWED_ATTR });
                }
                // if server returned plain text (no anchors) - fall through to client fallback
            }
        } catch (err) {
            // network/error -> fallback to client side
            console.warn("transformLinks server failed, falling back to client", err);
        }

        // client-side fallback: linkify text nodes and sanitize
        const linked = linkifyContent(content);
        return DOMPurify.sanitize(linked, { ALLOWED_TAGS: SAFE_ALLOWED_TAGS, ALLOWED_ATTR: SAFE_ALLOWED_ATTR });
    };

    // Handle paste in description to transform links immediately
    const handleDescriptionPaste = async (e) => {
        const pasteText = e.clipboardData?.getData('text');
        if (!pasteText) return;
        const hasLink = /https?:\/\/[^\s]+/i.test(pasteText);
        if (!hasLink) return; // let default paste proceed for non-links

        e.preventDefault();
        const target = e.target;
        const start = target.selectionStart;
        const end = target.selectionEnd;

        const before = editedData.description.slice(0, start);
        const after = editedData.description.slice(end);

        const transformed = await transformLinks(pasteText);
        const newValue = `${before}${transformed}${after}`;

        setEditedData(prev => ({ ...prev, description: newValue }));

        // attempt to restore caret
        setTimeout(() => {
            try {
                const pos = (before + transformed).length;
                target.selectionStart = pos;
                target.selectionEnd = pos;
            } catch (_) { }
        }, 0);
    };

    // Convert URLs *inside text nodes* to <a> while preserving existing HTML
    const linkifyContent = (content) => {
        if (!content) return content;
        // if already contains an anchor, nothing to do
        if (/<a\s+[^>]*href=/i.test(content)) return content;

        const container = document.createElement("div");
        container.innerHTML = content;

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        const urlRegex = /((https?:\/\/|www\.)[^\s<]+)/gi;
        let node;
        const textNodes = [];
        while ((node = walker.nextNode())) textNodes.push(node);

        textNodes.forEach((textNode) => {
            const str = textNode.nodeValue;
            if (!str || !urlRegex.test(str)) return;

            urlRegex.lastIndex = 0;
            let lastIndex = 0;
            const frag = document.createDocumentFragment();
            let match;
            while ((match = urlRegex.exec(str)) !== null) {
                const index = match.index;
                const url = match[0];
                if (index > lastIndex) {
                    frag.appendChild(document.createTextNode(str.slice(lastIndex, index)));
                }
                const a = document.createElement("a");
                let href = url;
                if (!/^https?:\/\//i.test(href)) href = "http://" + href; // support "www.foo.com"
                a.setAttribute("href", href);
                a.textContent = url;
                frag.appendChild(a);
                lastIndex = index + url.length;
            }
            if (lastIndex < str.length) {
                frag.appendChild(document.createTextNode(str.slice(lastIndex)));
            }
            textNode.parentNode.replaceChild(frag, textNode);
        });

        // convert newlines to <br> (if you expect plain \n)
        return container.innerHTML.replace(/\r\n|\r|\n/g, "<br>");
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left Column - Main Content */}
            <div ref={leftColumnRef} className="xl:col-span-2 space-y-4 ">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 border border-neutral-50 dark:border-slate-700 p-3 sm:p-4 rounded-md bg-white dark:bg-slate-800">
                    {stats.map((stat) => (
                        <div key={stat.label} className="p-2 sm:p-3">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="bg-customPurple-50 dark:bg-slate-600 dark:text-white text-electricBlue-50 p-1.5 sm:p-2 rounded-md flex-shrink-0">
                                    <Icon icon={stat.icon} className="w-4 h-4 sm:w-6 sm:h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm sm:text-lg font-bold truncate text-customBlack-50 dark:text-customWhite-50">{stat.value}</div>
                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 truncate">{stat.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Project Information */}
                <div className="bg-white dark:bg-slate-800 border border-neutral-50 dark:border-slate-700 rounded-md p-4 sm:p-6">
                    <div className="flex flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-customBlack-50 dark:text-customWhite-50">Project Information</h3>
                        {!isEditing ? permissions?.canEditProjectDetails && (
                            <button
                                onClick={permissions?.canEditProjectDetails && handleEdit}
                                className="flex items-center gap-1 text-sm text-gray-600 border border-neutral-50 p-1 px-2 rounded-md dark:border-slate-700 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors self-start sm:self-auto"
                            >
                                <Icon icon="mdi:pencil" className="w-3.5 h-3.5" />
                                Edit
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                <button
                                    onClick={handleCancel}
                                    className="px-0 py-1 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-3 py-1 text-sm bg-[#A259D6] text-white rounded hover:bg-[#8e4bb8] transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-8 mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 justify-between sm:justify-start">
                            <span className="text-sm text-gray-600 dark:text-slate-400">Project Created:</span>
                            <span className="text-sm text-gray-500 dark:text-slate-500">{formatDateToDayMonthYear(projectData.dateAdded)}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-between sm:justify-start">
                            <span className="text-sm text-gray-600 dark:text-slate-400">Due Date:</span>
                            <div className="relative">
                                {isEditing ? (
                                    <>
                                        <Flatpickr
                                            className="w-32 sm:w-44 border border-neutral-50 dark:border-slate-700 rounded px-3 pr-8 py-2 text-customBlack-50 dark:text-customWhite-50 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A259D6] focus:border-transparent hide-caret text-sm"
                                            value={editedData.dueDate ? new Date(editedData.dueDate) : null}
                                            onChange={handleDueDateChange}
                                            options={{
                                                dateFormat: "Y-m-d",
                                                altInput: true,
                                                altFormat: "d M, Y",
                                                allowInput: true,
                                                clickOpens: true,
                                                minDate: "today",
                                                disableMobile: true,
                                                static: true,
                                                onClose: () => { },
                                                theme: localStorage.getItem('darkMode') === 'true' ? 'dark' : 'material_blue',
                                                className: localStorage.getItem('darkMode') === 'true' ? 'dark-theme' : ''
                                            }}
                                            readOnly={true}
                                        />
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                                            <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </>
                                ) : (
                                    <div className="w-full sm:w-44 border border-neutral-50 dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-800 flex items-center justify-between">
                                        <span className="text-sm text-customBlack-50 dark:text-customWhite-50">{formatDateToDayMonthYear(projectData.dueDate)}</span>
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" className="text-gray-400 dark:text-slate-500">
                                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                                            <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    <div className="mb-4 sm:mb-6 border border-neutral-50 dark:border-slate-700 rounded-md p-2 sm:p-3">
                        <label className="text-sm font-medium block mb-2 text-customBlack-50 dark:text-customWhite-50">
                            Description:
                        </label>

                        {isEditing ? (
                            <div className="relative">
                                {/* The editor */}
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            document.execCommand("insertLineBreak"); // force <br> instead of <div>
                                            setTimeout(() => {
                                                const el = editorRef.current;
                                                if (!el) return;

                                                // Is caret at bottom?
                                                const { scrollTop, scrollHeight, clientHeight } = el;
                                                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

                                                if (isAtBottom) {
                                                    el.scrollTo({
                                                        top: el.scrollHeight,
                                                        behavior: "smooth",
                                                    });
                                                }
                                            }, 0);
                                        }
                                    }}
                                    onPaste={async (e) => {
                                        e.preventDefault();
                                        const pasteText = e.clipboardData?.getData("text");
                                        if (!pasteText) return;

                                        const el = editorRef.current;
                                        if (!el) return;

                                        // ✅ check scroll position before inserting
                                        const { scrollTop, scrollHeight, clientHeight } = el;
                                        const wasAtBottom = scrollTop + clientHeight >= scrollHeight - 5;

                                        let htmlToInsert = pasteText;
                                        if (/https?:\/\/[^\s]+/i.test(pasteText)) {
                                            try { htmlToInsert = await transformLinks(pasteText); } catch (_) { }
                                        }

                                        const sel = window.getSelection();
                                        if (sel && sel.rangeCount) {
                                            sel.deleteFromDocument();
                                            const range = sel.getRangeAt(0);
                                            range.insertNode(range.createContextualFragment(htmlToInsert));
                                            range.collapse(false);
                                            sel.removeAllRanges();
                                            sel.addRange(range);
                                        }

                                        const html = el.innerHTML || "";
                                        setEditedData(prev => ({ ...prev, description: html }));
                                        const empty = (el.textContent || "").trim().length === 0;
                                        setIsDescEmpty(empty);

                                        // ✅ only scroll if user was already at bottom
                                        if (wasAtBottom) {
                                            setTimeout(() => {
                                                el.scrollTo({
                                                    top: el.scrollHeight,
                                                    behavior: "smooth",
                                                });
                                            }, 0);
                                        }
                                    }}
                                    onInput={() => {
                                        const html = editorRef.current?.innerHTML || "";
                                        setEditedData(prev => ({ ...prev, description: html }));
                                        const empty = (editorRef.current?.textContent || "").trim().length === 0;
                                        setIsDescEmpty(empty);
                                    }}
                                    className="w-full text-gray-500 dark:text-slate-300 text-sm bg-transparent prose dark:prose-invert 
                                        max-w-none h-[200px] p-2 focus:outline-none overflow-y-auto break-words"
                                    style={{ whiteSpace: "pre-wrap" }}   // ✅ keep newlines like <textarea>
                                />
                                {/* Placeholder overlay (only when empty) */}
                                {isDescEmpty && (
                                    <span className="pointer-events-none absolute left-2 top-2 text-gray-400 text-sm select-none">
                                        Add description here...
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                {/* View mode placeholder logic */}
                                {(() => {
                                    // for emptiness check - strip tags
                                    const sanitizedForEmpty = DOMPurify.sanitize(projectData.description || "", { ALLOWED_TAGS: [] }).trim();
                                    const isViewEmpty = sanitizedForEmpty.length === 0;

                                    // for display - allow anchors and a few safe tags
                                    const sanitizedForView = DOMPurify.sanitize(projectData.description || "", {
                                        ALLOWED_TAGS: SAFE_ALLOWED_TAGS,
                                        ALLOWED_ATTR: SAFE_ALLOWED_ATTR,
                                    });
                                    return (
                                        <>
                                            {isViewEmpty && (
                                                <span className="pointer-events-none absolute left-2 top-2 text-gray-400 text-sm select-none">
                                                    Add description here...
                                                </span>
                                            )}
                                            <div
                                                className="w-full text-gray-500 dark:text-slate-300 text-sm bg-transparent prose dark:prose-invert
                                                max-w-none h-[200px] p-2 overflow-y-auto whitespace-pre-wrap"
                                                dangerouslySetInnerHTML={{ __html: sanitizedForView }}
                                            />
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Project Members */}
                </div>
                <div className="bg-white dark:bg-slate-800 border border-neutral-50 dark:border-slate-700 rounded-md p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3"  onClick={()=> setActiveTab("members")}>
                            <ModernTooltip
                                content={
                                    projectData.assignee_details && projectData.assignee_details.length > 0
                                        ? (
                                            <div>
                                                {projectData.assignee_details.map((u, idx) => {
                                                    const name = u.name || u.fullName || u.email || "No Name";
                                                    const capitalized = name.replace(/\b\w/g, c => c.toUpperCase());
                                                    return (
                                                        <div key={idx} className="flex items-center gap-2 mb-1">
                                                            <ProfilePicture user={u} className="w-7 h-7 rounded-full border-2 dark:border-slate-700 dark:border border-white object-cover" />
                                                            <span className="dark:text-white font-normal">{capitalized}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                        : "No members"
                                }
                                theme="custom-light"
                            >
                                <div className="flex -space-x-2">
                                    {projectData.assignee_details?.slice(0, 4).map((member) => (
                                        <ProfilePicture key={member._id} user={member} className="w-8 h-8 rounded-full" />
                                    ))}
                                    {projectData.assignee_details?.length > 4 && (
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                            <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">+{projectData.assignee_details.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            </ModernTooltip>
                        </div>
                        {
                            permissions && permissions?.canManageMembers && !isDefaultProject &&
                            <Button
                                icon="heroicons-outline:plus"
                                text="Add Members"
                                className="bg-electricBlue-100 dark:border-slate-700 dark:border text-white py-1.5 px-3 rounded-md flex items-center border-2 border-solid self-start sm:self-auto"
                                iconClass="font-bold text-lg mr-1"
                                onClick={() => setModalOpen(true)}
                            />
                        }
                    </div>
                </div>
            </div>

            {/* Right Column - Timeline */}
            {
                permissions && permissions?.canViewActivityLog &&
                <div
                    ref={rightColumnRef}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 shadow-sm xl:block min-h-[400px] xl:min-h-0"
                    style={{ height: leftColumnHeight > 0 ? `${leftColumnHeight}px` : 'auto' }}
                >
                    <h3 className="text-sm sm:text-lg font-semibold text-customBlack-50 dark:text-customWhite-50 mb-3">What's the status?</h3>

                    <div className="space-y-4 sm:space-y-6 h-full">
                        {journeyLoading ? (
                            <div className="flex items-center justify-center h-16">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-slate-300"></div>
                            </div>
                        ) : (journeyError || journey.length === 0) ? (
                            <div className="flex flex-col items-center justify-center text-center border border-neutral-50 dark:border-slate-700 rounded-md p-6 bg-white dark:bg-slate-800">
                                <Icon icon="mdi:information-outline" className="w-8 h-8 mb-2 text-gray-400 dark:text-slate-400" />
                                <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300">No activity found.</p>
                            </div>
                        ) : (
                            <div className="relative overflow-y-auto pr-2 h-[calc(100%-45px)]">
                                <ul className="space-y-3 sm:space-y-4 relative">
                                    {/* Vertical timeline line - positioned relative to the list */}
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-600" style={{ height: '100%' }}></div>
                                    {journey.map((entry, index) => {
                                        // Define action type icons
                                        const PROJECT_JOURNEY_ACTIONS = {
                                            "created": "si:projects-line",
                                            "name": "si:projects-duotone",
                                            "due_date": "uiw:date",
                                            "assignee_removed": "hugeicons:user-remove-01",
                                            "assignee_added": "f7:person-2",
                                            "access_updated": "hugeicons:user-settings-01",
                                            "note_added": "hugeicons:note-edit",
                                            "project_updated": "si:projects-line",
                                            "color": "fluent-mdl2:color"
                                        };

                                        const getActionIcon = (actionType) => {
                                            return PROJECT_JOURNEY_ACTIONS[actionType] || "si:projects-line";
                                        };

                                        return (
                                            <li key={entry.id} className="flex items-start gap-3 relative">
                                                {/* Icon with border to connect to timeline */}
                                                <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-neutral-50 dark:bg-slate-600 flex items-center justify-center border-2 border-white dark:border-slate-800 relative z-10`}>
                                                    <Icon icon={getActionIcon(entry.action_type)} className="w-3 h-3 sm:w-4 sm:h-4 text-black dark:text-slate-300" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs mb-1 break-words text-customBlack-50 dark:text-customWhite-50">
                                                        <CommentWithMentions rawHtml={entry.comment} />
                                                    </div>
                                                    <div className="text-xs text-gray-400 dark:text-slate-500">
                                                        {formatDateToDayMonthYear(entry.timestamp)}
                                                        {" "}
                                                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            }
            <AddMemberModal
                open={modalOpen}
                onClose={handleModalClose}
                assignees={assignees}
                setAssignees={setAssignees}
                accessLevels={accessLevels}
                setAccessLevels={setAccessLevels}
                onSaveIfChanged={handleMembersSaveIfChanged}
            />
        </div>
    );
};

export default ProjectOverview;

