import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";

// Available frequency options
const FREQUENCY_OPTIONS = [
  { value: 'not_repeatable', label: 'Not Repeatable' },
  { value: 'daily', label: 'Daily' },
  { 
    value: 'weekly', 
    label: 'Weekly',
    hasSubmenu: true,
    submenu: [
      { value: 'monday', label: 'Monday' },
      { value: 'tuesday', label: 'Tuesday' },
      { value: 'wednesday', label: 'Wednesday' },
      { value: 'thursday', label: 'Thursday' },
      { value: 'friday', label: 'Friday' },
      { value: 'saturday', label: 'Saturday' },
      { value: 'sunday', label: 'Sunday' },
    ]
  },
  { value: 'monthly', label: 'Monthly' },
 
];

const FrequencyDropdown = ({ 
  value, 
  onChange,
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [selectedValue, setSelectedValue] = useState(value || 'not_repeatable');
  const [selectedSubValue, setSelectedSubValue] = useState(null);
  const dropdownRef = useRef(null);

  // Get the label for the current value
  const getLabel = (val) => {
    // First check main options
    const mainOption = FREQUENCY_OPTIONS.find(opt => opt.value === val);
    if (mainOption) return mainOption.label;
    
    // Then check submenu options
    for (const option of FREQUENCY_OPTIONS) {
      if (option.submenu) {
        const subOption = option.submenu.find(sub => sub.value === val);
        if (subOption) return subOption.label;
      }
    }
    
    return 'Not Repeatable';
  };

  // Handle selection of a new value
  const handleSelect = (option) => {
    if (option.hasSubmenu) {
      setActiveSubmenu(activeSubmenu === option.value ? null : option.value);
      return;
    }
    
    setSelectedValue(option.value);
    setActiveSubmenu(null);
    if (onChange) {
      onChange(option.value);
    }
    setIsOpen(false);
  };

  // Handle selection from submenu
  const handleSubSelect = (option) => {
    setSelectedValue(option.value);
    setSelectedSubValue(option.value);
    if (onChange) {
      onChange(option.value);
    }
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  // Handle toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setActiveSubmenu(null);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update internal state when external value changes
  useEffect(() => {
    if (value !== selectedValue) {
      setSelectedValue(value);
      
      // Check if value is in a submenu
      for (const option of FREQUENCY_OPTIONS) {
        if (option.submenu) {
          const isSubValue = option.submenu.some(sub => sub.value === value);
          if (isSubValue) {
            setSelectedSubValue(value);
            break;
          }
        }
      }
    }
  }, [value]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500 h-full"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate">{getLabel(selectedValue)}</span>
        <Icon
          icon="heroicons-outline:chevron-down"
          className="w-4 h-4 ml-1 text-gray-500 dark:text-slate-400"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[1000] w-[200px] mt-1 bg-white dark:bg-slate-800 shadow-lg max-h-60 rounded-md py-1 border border-gray-200 dark:border-slate-700 overflow-auto focus:outline-none">
          <ul className="py-1" role="listbox">
            {FREQUENCY_OPTIONS.map((option) => (
              <li
                key={option.value}
                className="relative"
              >
                <div
                  className={`cursor-pointer select-none py-1.5 px-3 text-xs
                    ${selectedValue === option.value
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                      : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={selectedValue === option.value}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`block truncate ${selectedValue === option.value ? 'font-medium text-purple-600 dark:text-purple-400' : 'font-normal'}`}>
                      {option.label}
                    </span>
                    
                    {option.hasSubmenu && (
                      <Icon
                        icon="heroicons:chevron-right"
                        className="h-4 w-4 text-gray-400 dark:text-gray-500"
                      />
                    )}
                  </div>
                  
                  {selectedValue === option.value && !option.hasSubmenu && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <Icon
                        icon="heroicons:check"
                        className="h-4 w-4 text-purple-600 dark:text-purple-400"
                      />
                    </span>
                  )}
                </div>
                
                {/* Submenu as dropdown */}
                {option.hasSubmenu && activeSubmenu === option.value && (
                  <div className="w-full bg-white dark:bg-slate-800 shadow-inner border-t border-gray-200 dark:border-slate-700 py-1">
                    <ul className="py-1 pl-4" role="listbox">
                      {option.submenu.map((subOption) => (
                        <li
                          key={subOption.value}
                          className={`cursor-pointer select-none relative py-1.5 pl-3 pr-9 text-xs
                            ${selectedValue === subOption.value
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                              : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubSelect(subOption);
                          }}
                          role="option"
                          aria-selected={selectedValue === subOption.value}
                        >
                          <div className="flex items-center">
                            <span className={`block truncate ${selectedValue === subOption.value ? 'font-medium text-purple-600 dark:text-purple-400' : 'font-normal'}`}>
                              {subOption.label}
                            </span>
                          </div>
                          
                          {selectedValue === subOption.value && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                              <Icon
                                icon="heroicons:check"
                                className="h-4 w-4 text-purple-600 dark:text-purple-400"
                              />
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FrequencyDropdown; 