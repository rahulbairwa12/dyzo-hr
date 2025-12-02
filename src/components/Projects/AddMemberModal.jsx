import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Modal from "@/components/ui/Modal";
import { ProfilePicture } from "@/components/ui/profilePicture";
import { fetchUsers } from "@/store/usersSlice";
import { Icon } from "@iconify/react";
import Button from "../ui/Button";
import Textinput from "../ui/Textinput";
import { useNavigate } from "react-router-dom";

const accessLevelOptions = [
    { value: "admin", label: "Admin" },
    { value: "editor", label: "Editor" },
    { value: "viewer", label: "Viewer" },
];

const AddMemberModal = ({ open, onClose, assignees, setAssignees, accessLevels, setAccessLevels, onSaveIfChanged, projectId = null }) => {
    const dispatch = useDispatch();
    const { users, loading } = useSelector((state) => state.users);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    // Snapshots for change detection
    const [initialIdsSnapshot, setInitialIdsSnapshot] = useState("");
    const [initialAccessSnapshot, setInitialAccessSnapshot] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const normalizeAccess = (obj) => {
        const entries = Object.entries(obj || {}).map(([k, v]) => [String(k), String(v)]);
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        return JSON.stringify(entries);
    };

    const selectedListRef = useRef(null);
    const searchInputRef = useRef(null);
    const itemRefs = useRef([]);

    useEffect(() => {
    if (!open) return;

    const timeouts = [];
    const rafs = [];

    const tryFocus = () => {
        const el = searchInputRef.current;
        if (!el) {
        console.debug("[AddMemberModal] search input not found yet");
        return false;
        }

        try {
        el.focus();
        // put cursor at end
        if (typeof el.setSelectionRange === "function") {
            const len = (el.value || "").length;
            el.setSelectionRange(len, len);
        }
        const success = document.activeElement === el;
        console.debug("[AddMemberModal] focus attempt, success:", success);
        return success;
        } catch (err) {
        console.debug("[AddMemberModal] focus error", err);
        return false;
        }
    };

    // 1) immediate
    if (tryFocus()) {
        return () => {};
    }

    // 2) next paint
    rafs.push(requestAnimationFrame(() => {
        if (tryFocus()) return;
        // 3) fallback small timeout (after animations or focus-trap finishes)
        timeouts.push(setTimeout(() => {
        if (tryFocus()) return;
        // 4) try one more paint then a longer timeout
        rafs.push(requestAnimationFrame(() => {
            tryFocus();
        }));
        timeouts.push(setTimeout(() => tryFocus(), 200));
        }, 50));
    }));

    // cleanup
    return () => {
        rafs.forEach((id) => cancelAnimationFrame(id));
        timeouts.forEach((id) => clearTimeout(id));
    };
    }, [open]);

       // Filter assignees by search
    const filteredAssignees = assignees.filter( 
        (user) =>
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase())
    );

    // Filter available users by search and not already assigned
    const filteredUsers = users.filter(
        (user) =>
            !assignees.some((u) => u._id === user._id) &&
            (user.name?.toLowerCase().includes(search.toLowerCase()) ||
                user.email?.toLowerCase().includes(search.toLowerCase()))
    );

    const combinedUsers = [
    ...filteredAssignees.map(u => ({ ...u, isSelected: true })),
    ...filteredUsers.map(u => ({ ...u, isSelected: false }))
    ];

    // keyboard navigation
    useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
        // Don't hijack keys when user is editing a dropdown
        if (document.activeElement?.tagName === "SELECT") return;

        if (combinedUsers.length === 0) return;

        if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
            prev < combinedUsers.length - 1 ? prev + 1 : prev
        );
        } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const user = combinedUsers[highlightedIndex];
        if (user.isSelected) {
            handleRemove(user._id);
        } else {
            handleSelect(user);
        }
        }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, combinedUsers, highlightedIndex]);

    useEffect(() => {
        const el = itemRefs.current[highlightedIndex];
        if (el) {
            el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
    }, [highlightedIndex]);

    useEffect(() => {
        if (open) dispatch(fetchUsers());
        setSearch('');
    }, [open, dispatch]);

    // Capture initial snapshots when opened
    useEffect(() => {
        if (open) {
            const ids = (assignees || []).map(u => u._id).sort().join(",");
            setInitialIdsSnapshot(ids);
            setInitialAccessSnapshot(normalizeAccess(accessLevels || {}));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);


    const handleSelect = (user) => {
        if (!assignees.some((u) => u._id === user._id)) {
            const next = [...assignees, user];
            setAssignees(next);
            setAccessLevels({ ...accessLevels, [user._id]: "viewer" });
            requestAnimationFrame(() => {
                if (selectedListRef.current) {
                    selectedListRef.current.scrollTop = selectedListRef.current.scrollHeight;
                }
            });
        }
    };

    const handleRemove = (userId) => {
        setAssignees(assignees.filter((u) => u._id !== userId));
        const newLevels = { ...accessLevels };
        delete newLevels[userId];
        setAccessLevels(newLevels);
    };

    const handleAccessLevelChange = (userId, level) => {
        setAccessLevels({ ...accessLevels, [userId]: level });
    };

    const hasChanges = () => {
        const currentIds = (assignees || []).map(u => u._id).sort().join(",");
        const currentAccess = normalizeAccess(accessLevels || {});
        return currentIds !== initialIdsSnapshot || currentAccess !== initialAccessSnapshot;
    };

    const handleModalClose = () => {
        setSearch('');
        
        // If parent provided a save handler, call it only when changed
        if (typeof onSaveIfChanged === "function" && hasChanges()) {
            onSaveIfChanged({ assignees, accessLevels });
        }
        onClose && onClose();
    };

    return (
        <Modal
            activeModal={open}
            onClose={handleModalClose}
            title="Add Member to the Project"
            className="max-w-lg w-full"
            themeClass="bg-white dark:bg-slate-800 border-b border-neutral-50 dark:border-slate-700"
            scrollContent={false}
            centered
        >
            <div className="flex flex-col">
                {/* Search/Select Input */}
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search Members"
                    className="w-full border border-neutral-50 dark:border-slate-700 rounded-br-none rounded-bl-none px-4 py-2 text-gray-500 dark:text-slate-300 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-[#A259D6] focus:border-transparent text-sm focus:mb-[1px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
                {/* User List */}
                {/* {filteredAssignees.length > 0 && (
                    <div ref={selectedListRef} className="flex flex-col  bg-white dark:bg-slate-800 border border-neutral-50 border-y-0 dark:border-slate-700 max-h-56 overflow-y-auto">
                        {filteredAssignees.map((user) => (
                            <div key={user._id} className="flex items-center gap-2 p-1.5 px-4 hover:bg-gray-50 dark:hover:bg-slate-700">
                                <ProfilePicture user={user} className="w-7 h-7 rounded-full" />
                                <span className="flex-1 text-customBlack-50 dark:text-customWhite-50 text-sm">{user.name}</span>
                                <select
                                    className="border border-neutral-50 dark:border-slate-700 rounded px-2 py-1 text-xs bg-white dark:bg-slate-800 text-customBlack-50 dark:text-customWhite-50"
                                    value={accessLevels[user._id] || "editor"}
                                    onChange={e => handleAccessLevelChange(user._id, e.target.value)}
                                >
                                    {accessLevelOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <button className="ml-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400" onClick={() => handleRemove(user._id)}>
                                    <Icon icon="mdi:close" />
                                </button>
                            </div>
                        ))}
                    </div>
                )} */}
                {/* <div className="bg-white dark:bg-slate-800 border border-neutral-50 dark:border-slate-700 border-b-0 max-h-56 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-slate-400">Loading...</div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user._id}
                                onClick={() => handleSelect(user)}
                                className="flex items-center px-4 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer group"
                            >
                                <ProfilePicture user={user} className="w-7 h-7 rounded-full mr-3" />
                                <span className="flex-1 text-customBlack-50 dark:text-customWhite-50 text-sm">{user.name}</span>
                                <button
                                    className="font-bold text-xl opacity-80 group-hover:opacity-100 text-gray-600 dark:text-slate-400"
                                    disabled={assignees.some((u) => u._id === user._id)}
                                >
                                    <Icon icon="mdi:plus" />
                                </button>
                            </div>
                        ))
                    )}
                </div> */}
                <div className="bg-white dark:bg-slate-800 border border-neutral-50 dark:border-slate-700 max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-gray-500 dark:text-slate-400">
                    Loading...
                    </div>
                ) : (
                    combinedUsers.length > 0 ? combinedUsers.map((user, idx) => (
                        <div
                            key={user._id}
                            ref={(el) => (itemRefs.current[idx] = el)}
                            onClick={() =>
                            user.isSelected ? handleRemove(user._id) : handleSelect(user)
                            }
                            className={`flex items-center px-4 py-1.5 cursor-pointer transition group ${
                            idx === highlightedIndex
                                ? "bg-gray-200 dark:bg-slate-700"
                                : "hover:bg-gray-50 dark:hover:bg-slate-700"
                            }`}
                        >
                            <ProfilePicture user={user} className="w-7 h-7 rounded-full mr-3" />
                            <span className="flex-1 text-customBlack-50 dark:text-customWhite-50 text-sm">
                            {user.name}
                            </span>

                            {user.isSelected ? (
                            <>
                                {/* Permission dropdown (only for selected users) */}
                                <select
                                className="border border-neutral-50 dark:border-slate-700 rounded px-2 py-1 text-xs bg-white dark:bg-slate-800 text-customBlack-50 dark:text-customWhite-50"
                                value={accessLevels[user._id] || "viewer"}
                                onClick={(e) => e.stopPropagation()}   // prevent row click from firing
                                onChange={(e) => handleAccessLevelChange(user._id, e.target.value)}
                                >
                                {accessLevelOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                    </option>
                                ))}
                                </select>

                                <button
                                className="ml-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(user._id);
                                }}
                                >
                                <Icon icon="mdi:close" />
                                </button>
                            </>
                            ) : (
                            <Icon
                                icon="mdi:plus"
                                className="text-gray-600 dark:text-slate-400"
                            />
                            )}
                        </div>
                    ))
                    :
                    <div className="flex items-center justify-center h-32 text-gray-500 dark:text-slate-400">
                    Member not found.
                    </div>
                )}
                </div>
                {/* Invite Member Button */}
                <Button
                    className="w-full py-2 rounded text-electricBlue-100 font-medium flex items-center rounded-tl-none rounded-tr-none gap-2 border border-neutral-50 dark:border-slate-700 justify-start"
                    onClick={() => {
                        handleModalClose();
                        // navigate("/invite-user");
                        const trimmedSearch = search.trim();
                        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedSearch);

                        // Build query params conditionally
                        const params = new URLSearchParams();
                        if (projectId) params.append("projectId", projectId);
                        if (isEmail && !users.some(u =>
                            u.email?.toLowerCase() === trimmedSearch.toLowerCase()
                        )) {
                            params.append("email", trimmedSearch);
                        }
                        const url = `/invite-user${params.toString() ? `?${params.toString()}` : ""}`;
                        navigate(url);
                    }}
                    icon="mdi:plus"
                    text="Invite Member"
                />
            </div>
        </Modal>
    );
};

export default AddMemberModal; 