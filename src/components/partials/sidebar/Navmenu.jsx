import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleActiveChat } from "@/pages/app/chat/store";
import useMobileMenu from "@/hooks/useMobileMenu";
import { fetchProjects } from "@/store/projectsSlice";
import { fetchNotifications } from "@/store/notificationsSlice";
import Submenu from "./Submenu";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import 'tippy.js/dist/tippy.css';
import useSidebar from "@/hooks/useSidebar";
import AddProject from "@/components/Projects/AddProject";

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const Navmenu = ({ menus, sidebarHovered = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const { permissions } = useSelector((state) => state.auth);
  const unread_count = useSelector((state) => state.notifications.unread_count);

  const userInfo = useSelector((state) => state.auth.user);
  const { projects } = useSelector((state) => state.projects);

  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeMultiMenu, setActiveMultiMenu] = useState(null);

  const locationName = location.pathname.replace("/", "");
  const [collapsed, setMenuCollapsed] = useSidebar();
  const [animateInboxBadge, setAnimateInboxBadge] = useState(false);
  const prevUnreadRef = useRef(0);

  // ─────────────────────────────────────────────────────────────────────────
  //  Fetch / derived logic (unchanged)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userInfo?._id) {
      dispatch(fetchProjects({ companyId: userInfo?.companyId, _id: userInfo?._id, showAll: false }));
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (userInfo?._id) {
      dispatch(fetchNotifications({
        userId: userInfo._id,
        params: { isArchive: false },
        page: 1,
        append: false,
        useCache: false,
      }));
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (unread_count > prevUnreadRef.current) {
      setAnimateInboxBadge(true);
      const t = setTimeout(() => setAnimateInboxBadge(false), 700);
      prevUnreadRef.current = unread_count;
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unread_count;
  }, [unread_count]);

  const mergeUniqueSubItems = (arr1, arr2) => {
    const seen = new Set();
    const result = [];
    for (const item of arr1) {
      if (!seen.has(item.childlink)) {
        seen.add(item.childlink);
        result.push(item);
      }
    }
    for (const item of arr2) {
      if (!seen.has(item.childlink)) {
        seen.add(item.childlink);
        result.push(item);
      }
    }
    return result;
  };

  const visibleMenu = useMemo(() => {
    const clonedMenus = cloneDeep(menus);
    const filteredMenus = clonedMenus.filter((m) => {
      if (!m.navPermissionName) return true;
      const perm = permissions[m.navPermissionName];
      return perm?.View === true || perm?.All === true;
    });

    const projectMenu = filteredMenus.find((m) => m.link === "projects");
    if (projectMenu) {
      const originalChildren = projectMenu.child
        ? projectMenu.child.filter(
          (child) =>
            child.childlink !== "/projects" &&
            child.childtitle.toLowerCase() !== "all projects"
        )
        : [];

      const projectSubItems = projects
        ? projects
          .filter((p) => p.name.toLowerCase() !== "all projects")
          .map((p) => ({
            childlink: `/project/${p._id}?tab=tasks`,
            childtitle: p.name,
            projectColor: p.projectColor || "#9CA3AF",
            projectId: p?._id
          }))
        : [];

      const merged = mergeUniqueSubItems(originalChildren, projectSubItems);

      const allProjectsItem = {
        childlink: "/tasks?from_project=true",
        childtitle: "All Tasks",
        projectColor: "#CBD5E1",
      };

      projectMenu.child = [allProjectsItem, ...merged];
    }

    const inboxMenu = filteredMenus.find((m) => m.link === "inbox");
    if (inboxMenu && unread_count > 0) {
      inboxMenu.count = unread_count;
    } else if (inboxMenu) {
      delete inboxMenu.count;
    }

    return filteredMenus;
  }, [menus, projects, permissions, unread_count]);

  // ─────────────────────────────────────────────────────────────────────────
  //  ROUTE CHANGE EFFECT: find active submenu + multi menu
  //  (fixed: prefer explicit submenu match over auto-opening Projects)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let submenuIndex = null;
    let multiMenuIndex = null;

    const normalize = (p) => (p || '').replace(/^\//, '');

    visibleMenu.forEach((menuItem, i) => {
      if (isLocationMatch(normalize(location.pathname), normalize(menuItem.link))) {
        submenuIndex = i;
      }
      if (menuItem.child) {
        menuItem.child.forEach((childItem, j) => {
          if (isLocationMatch(normalize(location.pathname), normalize(childItem.childlink))) {
            submenuIndex = i;
          }
          if (childItem.multi_menu) {
            childItem.multi_menu.forEach((nestedItem) => {
              if (isLocationMatch(normalize(location.pathname), normalize(nestedItem.multiLink))) {
                submenuIndex = i;
                multiMenuIndex = j;
              }
            });
          }
        });
      }
    });

    // Keep Projects open when expanded ONLY if no other submenu matched
    const projectsIndex = visibleMenu.findIndex((m) => m.link === 'projects');
    if (!collapsed && submenuIndex === null && projectsIndex !== -1) {
      submenuIndex = projectsIndex;
    }

    // Set document title globally based on current route
    // If on a project route, prefer the actual project name over the numeric id
    const projectMatch = location.pathname.match(/^\/project\/([^/]+)/);
    const projectIdFromPath = projectMatch?.[1];
    const currentProjectName = projectIdFromPath
      ? (projects || []).find((p) => String(p._id) === String(projectIdFromPath))?.name
      : null;

    document.title = `Dyzo | ${currentProjectName || locationName}`;
    dispatch(toggleActiveChat(false));
    if (mobileMenu) {
      setMobileMenu(false);
    }

    // apply active submenu / multi menu
    setActiveSubmenu(submenuIndex);
    setActiveMultiMenu((prev) => (prev === null ? multiMenuIndex : prev));
  }, [location, visibleMenu, dispatch, collapsed, sidebarHovered]);

  // Close when collapsed & hover ends
  useEffect(() => {
    if (collapsed && !sidebarHovered) {
      if (activeSubmenu !== null) setActiveSubmenu(null);
      if (activeMultiMenu !== null) setActiveMultiMenu(null);
    }
  }, [collapsed, sidebarHovered]);

  const isLocationMatch = (currentPath, targetPath) => {
    const cur = (currentPath || '').replace(/^\//, '');
    const tar = (targetPath || '').replace(/^\//, '');

    if (tar === "tasks" && cur === "tasks") {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get("from_project") === "true") {
        return false;
      }
    }

    if (tar === "employees" && (cur === "employees" || cur === "invite-user"))
      return true;

    return cur === tar || cur.startsWith(`${tar}/`);
  };

  const toggleSubmenu = (index) => {
    if (collapsed && !sidebarHovered) return;
    const item = visibleMenu[index];

    if (item?.link === 'projects') {
      navigate('/projects');
      return;
    }

    setActiveSubmenu((prev) => {
      const willClose = prev === index;
      return willClose ? null : index;
    });
  };

  const toggleMultiMenu = (index) => {
    setActiveMultiMenu((prev) => (prev === index ? null : index));
  };

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    setShowAddProjectModal(true);
  }, []);

  const canAddProjects = true; // in future change to userInfo?.isAdmin === true || userInfo?.isSuperAdmin === true || userInfo?.team_leader === true

  return (
    <ul>
      {visibleMenu.map((item, i) => {
        const hasChildren = !!item.child;

        // --- NEW: determine if any child route is active
        const childActive =
          item.child && item.child.some((c) =>
            isLocationMatch(locationName, c.childlink)
          );

        // open if activeSubmenu is set to this index OR a child is active
        const isOpen = activeSubmenu === i || childActive;

        // mark parent active if parent link matches OR any child is active
        const isActive = isLocationMatch(locationName, item.link) || childActive;

        const isProjects = item.link === 'projects';
        const isProjectsRoute = location.pathname === '/projects' || location.pathname.startsWith('/project/');
        const headerActive = isOpen || (isProjects && isProjectsRoute);
        const headerClosedActive = isProjects && !isOpen && isProjectsRoute;

        return (
          <li
            key={i}
            className={`single-sidebar-menu
              ${hasChildren ? "item-has-children" : ""}
              ${isOpen ? "open" : ""}
              ${isActive ? "menu-item-active" : ""}`}
          >
            {/* A) Single menu item without children */}
            {!hasChildren && !item.isHeadr && (
              <NavLink
                className="menu-link"
                to={
                  item.link === "tasks"
                    ? `${item.link}?userId=${userInfo?._id}`
                    : item.link
                }
              >
                <span className="menu-icon flex-grow-0 relative">
                  <Icon icon={item.icon} />
                  {
                    item?.count && <span className={`absolute text-[10px] leading-[14px] rounded-full px-1 bg-red-500 text-white ${item.count > 99 ? "-top-2 -right-3" : item.count > 9 ? "-top-1.5 -right-2.5 " : "-top-1 -right-1 "} ${item.link === 'inbox' && animateInboxBadge ? 'notify-pop' : ''}`}>{item.count < 100 ? item.count : "99+"}</span>
                  }
                </span>
                <div className="text-box flex-grow">{item.title}</div>
                {item.badge && (
                  <span className="menu-badge">{item.badge}</span>
                )}
              </NavLink>
            )}

            {/* B) Menu label without a link */}
            {item.isHeadr && !hasChildren && (
              <div className="menulabel">{item.title}</div>
            )}

            {/* C) Parent item with children */}
            {hasChildren && (
              <>
                {/* Custom header for Projects */}
                {isProjects ? (
                  <div
                    className={`relative flex items-center gap-2 p-3 cursor-pointer select-none 
                    ${headerActive
                        ? `${isOpen ? 'rounded-md rounded-b-none' : 'rounded-md'} bg-customPurple-50 dark:bg-slate-700/60`
                        : 'rounded-md hover:bg-[#F3EDFF]/40 dark:hover:bg-slate-700/40'}`}
                    onClick={() => toggleSubmenu(i)}
                  >
                    {headerClosedActive && (
                      <span className="absolute left-0 top-0 h-full w-[2px] bg-[#7C3AED] rounded-r" />
                    )}
                    <span className={`${headerActive ? 'text-[#7C3AED] dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}><Icon icon="si:projects-line" /></span>
                    <div className={`text-box ${headerActive ? 'text-[#7C3AED] dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'} text-sm font-medium flex-1`}>{item.title}</div>
                    {(!collapsed || sidebarHovered) && (
                      <div className={`transform transition-all duration-300 ${headerActive ? 'text-[#7C3AED] dark:text-slate-200' : ''}`}>
                        <Icon icon="heroicons-outline:chevron-right" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`menu-link ${isOpen ? "parent_active not-collapsed" : "collapsed"
                      }`}
                    onClick={() => toggleSubmenu(i)}
                  >
                    <div className="flex-1 flex items-start">
                      <span className="menu-icon">
                        <Icon icon={item.icon} />
                      </span>
                      <div className="text-box">{item.title}</div>
                    </div>
                    <div className="flex-0 flex items-center gap-2">
                      {(!collapsed || sidebarHovered) && (
                        <div
                          className={`menu-arrow transform transition-all duration-300 ${isOpen ? "rotate-90" : ""}`}
                        >
                          <Icon icon="heroicons-outline:chevron-right" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Render the Submenu */}
                <Submenu
                  activeSubmenu={activeSubmenu}
                  item={item}
                  i={i}
                  toggleMultiMenu={toggleMultiMenu}
                  activeMultiMenu={activeMultiMenu}
                  onAddProject={handleClick}
                  canAddProjects={canAddProjects}
                  renderAsBody={isProjects}
                  sidebarHovered={sidebarHovered}
                />
              </>
            )}
          </li>
        );
      })}

      <AddProject showAddProjectModal={showAddProjectModal} setShowAddProjectModal={setShowAddProjectModal} />
    </ul>
  );
};

export default Navmenu;
