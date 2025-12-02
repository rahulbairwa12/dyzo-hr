import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import { Icon } from "@iconify/react";
import { Link } from 'react-router-dom';
import { intialLetterName } from '@/helper/helper';
import { ProfilePicture } from "../ui/profilePicture";
import Tooltip from '../ui/Tooltip';

const Collaborators = ({ task, employees, onSelectionChange }) => {
  const [selectedEmployeeIDs, setSelectedEmployeeIDs] = useState([]);
  const [selectShow, setSelectShow] = useState(false);
  const selectRef = useRef(null);
  const triggerRef = useRef(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  // Sort employees alphabetically by name
  const sortedEmployees = employees?.slice().sort((a, b) => {
    const nameA = (a.first_name || a.name || a.label || '').toLowerCase();
    const nameB = (b.first_name || b.name || b.label || '').toLowerCase();
    return nameA.localeCompare(nameB);
  }) || [];

  const handleSelect = (selectedOptions) => {
    const selectedIDs = selectedOptions.map(option => option.value);
    setSelectedEmployeeIDs(selectedIDs);
    // Call onSelectionChange if needed
    if (onSelectionChange) {
      onSelectionChange(selectedIDs);
    }
  };

  useEffect(() => {
    // Use only the collaborators from backend without forcing assignBy
    let newCollaborators = task?.collaborators ?? [];
   
    setSelectedEmployeeIDs(newCollaborators);
  }, [task?.collaborators]);

  const formatOptionLabel = ({ value, label, image, first_name, last_name, name, ...user }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <ProfilePicture user={{ value, label, image, first_name, last_name, name, ...user }} className='w-5 h-[1.2rem] rounded-full' />
      <div className='px-2'>{first_name ? first_name : name ? name : label}</div>
    </div>
  );

  const showSelectEmp = (e) => {
    e.stopPropagation();
    setSelectShow(true);
  }

  const handleClickOutside = (event) => {
    if (
      selectRef.current &&
      !selectRef.current.contains(event.target) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target)
    ) {
      setSelectShow(false);
    }
  };


  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add dark mode classes to document for react-select
  useEffect(() => {
    if (selectShow) {
      const style = document.createElement('style');
      style.id = 'reactSelectDarkMode';
      style.innerHTML = `
        .dark .select__menu {
          background-color: #1e293b !important;
        }
        .dark .select__option {
          background-color: #1e293b !important;
          color: #e2e8f0 !important;
        }
        .dark .select__option--is-focused {
          background-color: #334155 !important;
        }
        .dark .select__option--is-selected {
          background-color: #7a39ff !important;
          color: white !important;
        }
        .dark .select__multi-value {
          background-color: #334155 !important;
        }
        .dark .select__multi-value__label {
          color: #e2e8f0 !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.getElementById('reactSelectDarkMode')?.remove();
      };
    }
  }, [selectShow]);

  return (
    <div className='empimages' ref={selectRef} style={{ position: 'relative', zIndex: 1050 }}>
      <div className='relative' >
        {!selectShow && (
          <div className={`flex items-center gap-1 cursor-pointer`} ref={triggerRef}
            onClick={(e) => {
              e.stopPropagation(); // Prevent bubbling here too
              showSelectEmp(e);
            }}>
            {sortedEmployees.filter(emp => selectedEmployeeIDs.includes(emp.value)).map((emp) => (
              <div key={emp.value} className='flex items-center my-2' title={emp.name || emp.first_name}>
                <Link to={`/profile/${emp._id}`} target="_blank">
                  <ProfilePicture user={emp} className='w-[25px] h-[25px] rounded-full border border-dotted' />
                </Link>
              </div>
            ))}
            <Icon icon="ph:user" className='w-[30px] h-[30px] border rounded-full p-1 text-gray-500 border-dashed hover:bg-gray-200' onClick={showSelectEmp} />
            <Icon icon="ic:round-plus" className='w-[30px] h-[30px] p-1 text-gray-500' onClick={showSelectEmp} />
          </div>
        )}

        {selectShow && (
          <div className="absolute left-0 right-0" style={{ zIndex: 9999 }}>
            <div className="relative">

            </div>
            <div className="dark:bg-slate-800 rounded-lg">
              <Select
                value={sortedEmployees.filter(option => selectedEmployeeIDs?.includes(option.value))}
                onChange={handleSelect}
                options={sortedEmployees}
                isMulti
                formatOptionLabel={formatOptionLabel}
                className={`py-2 px-2 text-sm text-gray-900 dark:text-gray-100 rounded-lg text-f13 min-w-[250px] dark:bg-slate-800`}
                classNamePrefix="select"
                placeholder="Add New Collaborator"
                isSearchable={true}
                noOptionsMessage={() => "Add Collaborator"}
                menuPlacement="auto"
                menuPortalTarget={document.body}
                onMenuOpen={() => setMenuIsOpen(true)}
                onMenuClose={() => setMenuIsOpen(false)}
                menuIsOpen={menuIsOpen}
                autoFocus={true}
                components={{
                  ClearIndicator: () => null,
                  DropdownIndicator: (props) => {
                    return (
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuIsOpen(prev => !prev);

                          // If currently open, close it
                          if (menuIsOpen) {
                            setTimeout(() => {
                              props.selectOption && props.selectOption();
                            }, 10);
                          }
                        }}
                        className="flex items-center pr-2"
                      >
                        <Icon
                          icon={menuIsOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                          className="text-gray-500 text-2xl cursor-pointer"
                        />
                      </div>
                    );
                  },
                  MultiValueLabel: ({ data }) => (
                    <Tooltip
                      content={data.name}
                      placement="top"
                      theme="dark"
                      animation="shift-away"
                    >
                      <div className="flex items-center gap-1 p-1" >
                        <ProfilePicture
                          user={data}
                          className="w-5 h-5 rounded-full"
                        />
                      </div>
                    </Tooltip>
                  ),
                }}
                styles={{
                  control: (base, { theme }) => ({
                    ...base,
                    minHeight: '38px',
                    borderRadius: '0.375rem',
                    paddingLeft: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    borderColor: document.documentElement.classList.contains('dark') ? '#475569' : '#ccc',
                    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : 'white', // slate-800
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                    boxShadow: '0 4px 11px rgba(0, 0, 0, 0.2)',
                    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : 'white', // slate-800
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999
                  }),
                  menuList: (base) => ({
                    ...base,
                    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : 'white', // slate-800
                    border: document.documentElement.classList.contains('dark') ? '1px solid #475569' : '1px solid #e2e8f0',
                    borderRadius: '0.375rem',
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: document.documentElement.classList.contains('dark') ? "#1e293b" : "#f1f1f1", // slate-800
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: document.documentElement.classList.contains('dark') ? "#475569" : "#888",
                      borderRadius: "4px",
                    }
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#f0f0f0', // slate-800
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#333',
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected
                      ? '#7a39ff'
                      : isFocused
                        ? document.documentElement.classList.contains('dark')
                          ? 'rgba(122, 57, 255, 0.2)'
                          : 'rgba(122, 57, 255, 0.1)'
                        : document.documentElement.classList.contains('dark')
                          ? '#1e293b'
                          : 'white', // slate-800
                    color: isSelected
                      ? 'white'
                      : document.documentElement.classList.contains('dark')
                        ? '#e2e8f0'
                        : '#333',
                    padding: '8px 12px',
                  }),
                  input: (base) => ({
                    ...base,
                    color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : base.color,
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: document.documentElement.classList.contains('dark') ? '#94a3b8' : base.color,
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : base.color,
                  }),
                  group: (base) => ({
                    ...base,
                    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : base.backgroundColor, // slate-800
                  }),
                  indicatorsContainer: (base) => ({
                    ...base,
                    backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : base.backgroundColor, // slate-800
                  }),
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collaborators;