import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { Icon } from "@iconify/react";
import CustomMenuList from "@/components/ui/CustomMenuList";
import AddProject from "@/components/Projects/AddProject";
import { useSelector } from "react-redux";

const ProjectSelect = ({ task, index, updateExistingTask, projects, setProjectStatuses, setIsAddProject, from = "" }) => {

  const userInfo = useSelector((state) => state.auth.user);
  const favouriteIds = userInfo?.fav_projects || [];

  const CustomSingleValue = ({ data }) => {
    const project = projects.find(p => p._id === data.value);
    const projectColor = project?.projectColor;

    // truncate with JS: show first 20 chars, then …
    const truncateText = (text, maxLength = 20) => {
      if (!text) return "";

      // For smaller screens, be more aggressive with truncation
      if (window.innerWidth < 1377) {
        // Always truncate to 4 characters for smaller screens
        if (text.length > 7) {
          return text.slice(0, 4) + '…';
        }
        return text;
      }


      // For larger screens, use character-based truncation
      return text.length > maxLength ? text.slice(0, 18) + "…" : text;
    };

    return (
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-3 h-3 rounded-[3px] flex-shrink-0 border ${projectColor
              ? 'border-gray-300 dark:border-gray-600'
              : 'border-electricBlue-100'
            } ${projectColor
              ? ''
              : 'bg-electricBlue-100'
            }`}
          style={projectColor ? { backgroundColor: projectColor } : {}}
        />
        <span
          className={` ${from === "taskpanel" ? "" : "max-w-[120px]"} truncate text-ellipsis overflow-hidden `}
          title={data.label} // tooltip with full name
        >
          {from === "taskpanel" ? data.label : truncateText(data.label, 20)}
        </span>
      </div>
    );
  };


  const CustomOption = (props) => {
    const { data, innerRef, innerProps, isFocused, isSelected } = props;
    const project = projects.find(p => p._id === data.value);
    const projectColor = project?.projectColor;
    const isFavourite = userInfo?.fav_projects?.includes(data.value);

    return (
      <div
        ref={innerRef}
        {...innerProps}
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer truncate  ${isSelected ? "bg-electricBlue-50/10 text-electricBlue-50 dark:bg-slate-600 font-semibold" : ""}
        ${isFocused && !isSelected ? "bg-gray-200 dark:bg-slate-700" : ""}`}
      >
        <div
          className="w-3 h-3 rounded-[3px] flex-shrink-0 border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: projectColor }}
        />
        <div className="flex items-center justify-between w-full">
          <span className={`${from === "taskpanel" ? "" : "truncate max-w-[160px]"}`} title={data.label}>
            {data.label}
          </span>
          {/* {isFavourite && (
          <Icon
            icon="heroicons:star-16-solid"
            className="w-3.5 h-3.5 text-favStar-100"
          />
        )} */}
        </div>
      </div>
    );
  };


  // Custom DropdownIndicator for consistent chevron that rotates when open
  const DropdownIndicator = (props) => {
    const {
      selectProps: { menuIsOpen },
    } = props;
    return (
      <div className="flex items-center pr-2">
        <Icon
          icon="heroicons-outline:chevron-down"
          className={`transition-transform duration-200 w-4 h-4 text-slate-500 dark:text-slate-400 ${menuIsOpen ? 'rotate-180' : ''}`}
        />
      </div>
    );
  };

  const [taskProjectId, setTaskProjectId] = useState(task?.projectId || "");
  const [taskProjectName, setTaskProjectName] = useState(task?.projectName || "No Project");
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const scrollPosition = useRef(0);
  // Track if this is the initial selection
  const initialSelectionMade = useRef(false);

  // Notify parent TaskPanel about modal visibility so it can disable outside-click close
  useEffect(() => {
    if (typeof setIsAddProject === "function") {
      setIsAddProject(showAddProjectModal);
    }
  }, [showAddProjectModal, setIsAddProject]);

  const handleProjectChanged = (e) => {
    // Update local state immediately
    setProjectStatuses(e.value);
    setTaskProjectId(e.value);
    setTaskProjectName(e.label);

    // Mark that a selection has been made
    initialSelectionMade.current = true;

    // Update task object and propagate to parent component
    const updatedTask = {
      ...task,
      projectId: e.value,
      projectName: e.label
    };

    // Call parent update function
    updateExistingTask(updatedTask, "projectId");
  };

  // Handle scroll locking
  const handleMenuOpen = () => {
    // Store current scroll position
    scrollPosition.current = window.pageYOffset;
    // Add styles to prevent scrolling
    const tasksPage = document.querySelector('.content-wrapper');
    if (tasksPage) {
      tasksPage.style.position = 'fixed';
      tasksPage.style.top = `-${scrollPosition.current}px`;
      tasksPage.style.left = '0';
      tasksPage.style.right = '0';
      tasksPage.style.bottom = '0';
      tasksPage.style.overflowY = 'hidden';
    }
  };

  const handleMenuClose = () => {
    // Remove styles and restore scroll position
    const tasksPage = document.querySelector('.content-wrapper');
    if (tasksPage) {
      tasksPage.style.position = '';
      tasksPage.style.top = '';
      tasksPage.style.left = '';
      tasksPage.style.right = '';
      tasksPage.style.bottom = '';
      tasksPage.style.overflowY = '';
      window.scrollTo(0, scrollPosition.current);
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Reset styles when component unmounts
      const tasksPage = document.querySelector('.content-wrapper');
      if (tasksPage) {
        tasksPage.style.position = '';
        tasksPage.style.top = '';
        tasksPage.style.left = '';
        tasksPage.style.right = '';
        tasksPage.style.bottom = '';
        tasksPage.style.overflowY = '';
      }
    };
  }, []);

  useEffect(() => {
    // If task has a projectName, use it; otherwise use "No Project"
    setTaskProjectName(task?.projectName || "No Project");

    // Handle the case where projectId is undefined or empty
    if (!task?.projectId) {
      setTaskProjectId("");
    } else {
      setTaskProjectId(task.projectId);
    }
  }, [task?.projectId, task?.projectName]); // Depend specifically on these properties

  // const options = projects.map((project) => ({
  //   value: project._id,
  //   label: project.name,
  // }));

  const options = [
    // Favourites first
    // ...projects
    //   .filter((project) => favouriteIds.includes(project._id))
    //   .map((project) => ({
    //     value: project._id,
    //     label: project.name,
    //     isFavourite: true,
    //   })),

    // Then the rest
    ...projects.map((project) => ({
      value: project._id,
      label: project.name,
      isFavourite: false,
    })),
  ];

  // Add "No Project" as the first option
  /*   options.unshift({
      value: "",
      label: "No Project",
    }); */

  const handleAddProject = () => {
    setShowAddProjectModal(true);
    if (typeof setIsAddProject === "function") {
      setIsAddProject(true);
    }
  };


  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: from === "taskpanel" ? '35px' : '28px',       // smaller height for taskpanel
      height: from === "taskpanel" ? '35px' : '28px',
      backgroundColor: 'var(--bg-color, transparent)',
      border: '1px solid var(--border-color, #e5e7eb)',
      borderRadius: '4px',
      cursor: 'pointer',
      boxShadow: 'none',
      display: 'flex',
      alignItems: 'center',    // vertical alignment
      '&:hover': {
        border: '1px solid var(--border-hover-color, #d1d5db)',
        backgroundColor: 'var(--hover-bg, rgba(0, 0, 0, 0.05))',
      },
      ...(state.isFocused && {
        border: '1px solid var(--focus-border, #9ca3af)',
        boxShadow: 'none',
      }),
      '.dark &, html.dark &': {
        '--bg-color': 'transparent',
        '--border-color': '#475569', // slate-600
        '--border-hover-color': '#64748b', // slate-500
        '--hover-bg': 'rgba(255, 255, 255, 0.05)',
        '--focus-border': '#94a3b8', // slate-400
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 6px',
      margin: 0,
      display: 'flex',
      alignItems: 'center',  // keep dot + label centered
      color: 'var(--value-color, #1e293b)',
      '.dark &, html.dark &': {
        '--value-color': '#e2e8f0',
      },
    }),
    singleValue: (base) => ({
      ...base,
      display: 'flex',
      alignItems: 'center',
      color: 'var(--text-color, #1e293b)',
      '.dark &, html.dark &': {
        '--text-color': '#e2e8f0',
      },
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: 'var(--input-color, #1e293b)',
      '.dark &, html.dark &': {
        '--input-color': '#e2e8f0',
      },
    }),
    indicatorsContainer: (base) => ({
      ...base,
      padding: 0,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: '0 4px',
      color: 'var(--indicator-color, #64748b)',
      '.dark &, html.dark &': {
        '--indicator-color': '#94a3b8',
      },
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    menu: (base) => ({
      ...base,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      border: '1px solid var(--menu-border, rgba(0, 0, 0, 0.1))',
      borderRadius: '4px',
      backgroundColor: 'var(--menu-bg, white)',
      minWidth: '200px',
      zIndex: 10000,
      fontSize: '12px',
      fontWeight: '400',
      width: '100%',
      '.dark &, html.dark &': {
        '--menu-border': 'rgba(255, 255, 255, 0.1)',
        '--menu-bg': '#334155',
      },
      marginBottom: "40px"
    }),
    option: (base, state) => ({
      ...base,
      padding: '6px 10px',   // slightly smaller for compactness
      cursor: 'pointer',
      backgroundColor: state.isSelected
        ? 'var(--selected-bg, #f3f4f6)'
        : 'var(--option-bg, white)',
      color: 'var(--option-text, #1e293b)',
      '&:hover': {
        backgroundColor: 'var(--hover-option-bg, #f3f4f6)',
      },
      '.dark &, html.dark &': {
        '--selected-bg': '#475569',
        '--option-bg': '#334155',
        '--option-text': '#e2e8f0',
        '--hover-option-bg': '#475569',
      },
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 10000,
    }),
  };


  // Calculate the current value for the Select component
  const currentValue = () => {
    // Ensure we're comparing strings to avoid type mismatches (e.g., 207 vs "207")
    const selectedOption = options.find(
      (option) =>
        String(option.value) === String(taskProjectId) ||
        String(option.value) === String(task?.projectId)
    );

    // If no matching project is found, default to "Untitled Project"
    return selectedOption || { value: "", label: "Untitled Project" };
  };

  return (
    <>
      <div className="flex items-center group relative">

        <Select
          instanceId={`project-select-${index}`}
          className="w-full min-w-[100px] text-xs"
          classNamePrefix="project-select"
          options={options}
          value={currentValue()}
          onChange={handleProjectChanged}
          styles={customStyles}
          components={{
            MenuList: (props) => (
              <CustomMenuList
                {...props}
                onButtonClick={handleAddProject}
                buttonText="Add Project"
              />
            ),
            DropdownIndicator,
            SingleValue: CustomSingleValue,
            Option: CustomOption
          }}
          placeholder="Select Project"
          noOptionsMessage={() => "No projects found"}
          isSearchable
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          menuPlacement="auto"
          menuShouldScrollIntoView={true}
          closeMenuOnScroll={false}
          defaultMenuIsOpen={false}
        />
      </div>

      <AddProject
        showAddProjectModal={showAddProjectModal}
        setShowAddProjectModal={(val) => {
          setShowAddProjectModal(val);
          if (typeof setIsAddProject === "function") {
            setIsAddProject(val);
          }
        }}
        projects={projects}
      />
    </>
  );
};

export default ProjectSelect;
