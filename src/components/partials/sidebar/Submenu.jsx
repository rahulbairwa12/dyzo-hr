import React, { useEffect, useState, useRef } from "react";
import { Collapse } from "react-collapse";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Multilevel from "./Multi";

import useSidebar from "@/hooks/useSidebar";
import { useDispatch, useSelector } from "react-redux";
import { enforceSubscriptionLimit } from "@/store/planSlice";

const Submenu = ({ activeSubmenu, item, i, toggleMultiMenu, activeMultiMenu, onAddProject, canAddProjects, renderAsBody, sidebarHovered = false }) => {
  const isProjectsMenu = item.link === "projects";
  const [searchTerm, setSearchTerm] = useState("");

  const [collapsed] = useSidebar();
  const dispatch = useDispatch();
  const location = useLocation(); // ⬅️ detect route changes
  const navigate = useNavigate();
  const userInfo = useSelector((state) => state.auth.user);
  const favouriteIds = userInfo?.fav_projects || [];

  // Keyboard navigation states
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    if (!location.pathname.includes("project")) {
      setSearchTerm("");
    }
  }, [location.pathname]);

  // Auto-focus search input when projects menu is opened
  useEffect(() => {
    if (isProjectsMenu && activeSubmenu === i && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isProjectsMenu, activeSubmenu, i]);

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  // Scroll selected item into view
  const scrollToSelectedItem = (index) => {
    if (itemRefs.current[index] && listContainerRef.current) {
      const selectedElement = itemRefs.current[index];
      const container = listContainerRef.current;

      const containerRect = container.getBoundingClientRect();
      const elementRect = selectedElement.getBoundingClientRect();

      // Check if element is above the visible area
      if (elementRect.top < containerRect.top) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
      // Check if element is below the visible area
      else if (elementRect.bottom > containerRect.bottom) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    }
  };

  // Keyboard navigation handlers
  const handleKeyDown = (e) => {
    if (!isProjectsMenu || childItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < childItems.length - 1 ? prev + 1 : 0;
          // Use setTimeout to ensure state update happens before scrolling
          setTimeout(() => scrollToSelectedItem(newIndex), 0);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : childItems.length - 1;
          // Use setTimeout to ensure state update happens before scrolling
          setTimeout(() => scrollToSelectedItem(newIndex), 0);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < childItems.length) {
          const selectedItem = childItems[selectedIndex];
          if (selectedItem.childlink) {
            navigate(selectedItem.childlink);
          } else if (selectedItem.multi_menu) {
            toggleMultiMenu(selectedIndex);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  let childItems = item.child || [];
  if (isProjectsMenu && searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    const allProjectsItem = childItems.find(
      (subItem) => subItem.childtitle?.toLowerCase() === "all projects"
    );
    const filtered = childItems.filter((subItem) => {
      const title = subItem.childtitle?.toLowerCase();
      if (title === "all projects") return false; // exclude from search matching
      return title?.includes(term);
    });
    childItems = [allProjectsItem, ...filtered].filter(Boolean);
  }
  if (isProjectsMenu) {
    childItems = [...childItems].sort((a, b) => {
      if (a.childtitle?.toLowerCase() === "all tasks") return -1; // keep "All Tasks" at very top
      if (b.childtitle?.toLowerCase() === "all tasks") return 1;

      // Get default project ID from user
      const defaultProjectId = userInfo?.default_project || userInfo?.default_project_id;

      // Check if items are the default project
      const aIsDefault = defaultProjectId && (
        String(a.projectId) === String(defaultProjectId) ||
        Number(a.projectId) === Number(defaultProjectId)
      );
      const bIsDefault = defaultProjectId && (
        String(b.projectId) === String(defaultProjectId) ||
        Number(b.projectId) === Number(defaultProjectId)
      );

      // Put default project at top (after "All Tasks")
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;

      // const aFav = favouriteIds.includes(a.projectId);
      // const bFav = favouriteIds.includes(b.projectId);

      // if (aFav && !bFav) return -1;
      // if (!aFav && bFav) return 1;
      return 0;
    });
  }

  // Clear item refs when childItems change
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, childItems.length);
  }, [childItems.length]);

  // Helper: compute an "active" boolean that considers query string for /tasks
  const computeIsActive = (subItem) => {
    try {
      // create absolute URL to parse pathname & search params reliably
      const subUrl = new URL(subItem.childlink, window.location.origin);
      const subPath = subUrl.pathname;
      const subFromProject = subUrl.searchParams.get('from_project') === 'true';
      const currentFromProject = new URLSearchParams(location.search).get('from_project') === 'true';

      // If the submenu entry points to /tasks
      if (subPath === '/tasks') {
        if (subFromProject) {
          // "All Tasks" -> active only when current has from_project=true
          return location.pathname === '/tasks' && currentFromProject === true;
        } else {
          // plain /tasks (My Tasks) -> active only when current doesn't have from_project=true
          return location.pathname === '/tasks' && currentFromProject !== true;
        }
      }

      // Default: compare pathname (ignore query for other links), and allow prefix matches
      return location.pathname === subPath || location.pathname.startsWith(subPath + '/');
    } catch (err) {
      // Fallback: basic equality
      return location.pathname === subItem.childlink;
    }
  };

  return (
    <Collapse isOpened={isProjectsMenu ? (!collapsed || sidebarHovered) : ((activeSubmenu === i) && (!collapsed || sidebarHovered))}>
      {isProjectsMenu ? (
        <div className={`rounded-md border rounded-tl-none rounded-tr-none border-neutral-50 dark:border-slate-700 overflow-hidden ${renderAsBody ? '' : ''}`}>
          {/* Panel background */}
          <div className="bg-customPurple-100 dark:bg-slate-800">
            {/* When used as standalone section, we already render header in Navmenu */}
            {/* Search */}
            <div className="px-3">
              <div className="flex items-center gap-2 py-2 border-b border-[#A389E9] dark:border-slate-600 overflow-hidden">
                <Icon icon="iconamoon:search-light" className="text-electricBlue-50 dark:text-slate-300 w-3.5 h-3.5 min-w-[14px] flex-shrink-0 font-normal" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search Projects"
                  className="flex-1 min-w-0 bg-transparent outline-none placeholder-[#A389E9] dark:placeholder-slate-400 font-normal text-sm text-[#4A148C] dark:text-slate-100"
                />
              </div>
            </div>
            {/* List */}
            <div ref={listContainerRef} className="max-h-56 overflow-y-auto px-2 py-2">
              <ul className="space-y-1">
                {childItems.map((subItem, j) => {
                  const isSelected = selectedIndex === j;
                  const isActive = location.pathname === subItem.childlink;
                  const isFavouriteProject = userInfo?.fav_projects?.includes(subItem?.projectId);

                  return (
                    <li
                      key={j}
                      ref={(el) => (itemRefs.current[j] = el)}
                      className={`flex items-start rounded-md transition-all duration-150 ${isSelected ? "bg-[#A389E9]/20 dark:bg-slate-600/30" : ""
                        }`}
                    >
                      {subItem?.multi_menu ? (
                        <div className="w-full">
                          <div
                            onClick={() => toggleMultiMenu(j)}
                            className={`${activeMultiMenu === j
                              ? "text-black dark:text-white font-medium"
                              : isSelected
                                ? "text-[#4A148C] dark:text-violet-300 font-medium"
                                : "text-slate-700 dark:text-slate-200"
                              } text-sm flex items-start gap-3 transition-all duration-150 cursor-pointer py-1 px-2 rounded-md`}
                          >
                            <span className="h-3.5 w-3.5 rounded-sm min-w-3.5" style={{ backgroundColor: subItem.projectColor || "#CBD5E1" }} />
                            <span className="flex-1 text-[13px] items-start flex gap-1">{subItem.childtitle}
                              {/* {isFavouriteProject && (
                                <Icon
                                  icon="heroicons:star-16-solid"
                                  className="w-4 h-4 text-favStar-100"
                                  title="Favourite Project"
                                />
                              )} */}
                            </span>
                            <span className={`menu-arrow transform transition-all duration-300 ${activeMultiMenu === j ? "rotate-90" : ""}`}>
                              <Icon icon="ph:caret-right" />
                            </span>
                          </div>
                          <Multilevel activeMultiMenu={activeMultiMenu} j={j} subItem={subItem} />
                        </div>
                      ) : (
                        <NavLink to={subItem.childlink} className="w-full">
                          {() => {
                            const isActiveCustom = computeIsActive(subItem);
                            const isFavouriteProject = userInfo?.fav_projects?.includes(subItem?.projectId);
                            return (
                              <span className={`text-sm flex items-start  gap-3 transition-all duration-150 py-1 px-2 rounded-md ${isActiveCustom
                                ? "font-medium text-[#4A148C] bg-[#A389E9]/20 dark:bg-slate-600/30 dark:text-violet-300"
                                : isSelected
                                  ? "font-medium text-slate-700 dark:text-violet-300"
                                  : "text-slate-700 dark:text-slate-200 hover:bg-gray-200 dark:bg-slate-600/30"
                                }`}>
                                <span className="h-3.5 w-3.5 rounded-sm min-w-3.5" style={{ backgroundColor: subItem.projectColor || "#CBD5E1" }} />
                                <span className="flex-1 text-[13px] flex items-start gap-2 justify-between">{subItem.childtitle}
                                  {/* {isFavouriteProject && (
                                    <Icon
                                      icon="heroicons:star-16-solid"
                                      className="min-w-[16px] w-4 h-4 text-favStar-100 mt-0.5"
                                      title="Favourite Project"
                                    />
                                  )} */}
                                </span>
                              </span>
                            )
                          }}
                        </NavLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          {canAddProjects && (
            <button
              type="button"
              className="w-full flex items-center gap-1.5 border-t border-neutral-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-electricBlue-100 dark:text-violet-300 text-sm hover:bg-gray-50 hover:dark:bg-slate-700 font-bold"
              onClick={(e) => {
                e.stopPropagation();
                const allowed = dispatch(enforceSubscriptionLimit());
                if (!allowed) return;
                setShowAddProjectModal(true);
              }}
            >
              <Icon icon="mdi:plus" className="w-5 h-5 min-w-[18px]" />
              <span >Add Project</span>
            </button>
          )}

        </div>
      ) : (
        <div className={isProjectsMenu ? "max-h-60 overflow-y-auto" : ""}>
          <ul className="sub-menu space-y-2">
            {childItems.map((subItem, j) => (
              <li key={j} className="block pl-3 pr-1 first:pt-2 last:pb-2">
                {subItem?.multi_menu ? (
                  <div>
                    <div
                      onClick={() => toggleMultiMenu(j)}
                      className={`${activeMultiMenu === j
                        ? "text-black dark:text-white font-medium"
                        : "text-slate-600 dark:text-slate-300"
                        } text-sm flex space-x-3 items-center transition-all duration-150 cursor-pointer rtl:space-x-reverse`}
                    >
                      <span
                        className={`${activeMultiMenu === j
                          ? "bg-slate-900 dark:bg-slate-300 ring-4 ring-opacity-[15%] ring-black-500 dark:ring-slate-300 dark:ring-opacity-20"
                          : ""
                          } h-2 w-2 rounded-full border border-slate-600 dark:border-white inline-block flex-none`}
                      ></span>
                      <span className="flex-1">{subItem.childtitle}</span>
                      <span className="flex-none">
                        <span
                          className={`menu-arrow transform transition-all duration-300 ${activeMultiMenu === j ? "rotate-90" : ""
                            }`}
                        >
                          <Icon icon="ph:caret-right" />
                        </span>
                      </span>
                    </div>
                    <Multilevel activeMultiMenu={activeMultiMenu} j={j} subItem={subItem} />
                  </div>
                ) : (
                  <NavLink to={subItem.childlink}>
                    {({ isActive }) => (
                      <span
                        className={`${isActive
                          ? "text-electricBlue-100 dark:text-white font-medium bg-electricBlue-100/10"
                          : "text-slate-600 dark:text-slate-300"
                          } text-sm flex space-x-3 items-center transition-all duration-150 rtl:space-x-reverse p-1.5 rounded-md`}
                      >
                        <span
                          className={`${isActive
                            ? "bg-electricBlue-100 dark:bg-slate-300 ring-4 ring-opacity-[15%] ring-electricBlue-100 dark:ring-slate-300 dark:ring-opacity-20"
                            : ""
                            } h-2 w-2 rounded-full border border-slate-600 dark:border-white inline-block flex-none`}
                        ></span>
                        <span className="flex-1">{subItem.childtitle}</span>
                      </span>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Collapse>
  );
};

export default Submenu;
