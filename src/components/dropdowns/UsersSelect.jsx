import React, { useState, useEffect, useRef } from "react";
import moment from "moment";

const UserSelect = ({ task, index, updateExistingTask, isCompleted }) => {
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [taskDueDate, setTaskDueDate] = useState(task?.dueDate);
    const dropdownRef = useRef(null);
    const dateInputRef = useRef(null);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
        if (!isDropdownOpen && dateInputRef.current) {
            dateInputRef.current.focus(); // Focus the date input field when opening the dropdown
        }
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    };

    const handleDueDateChangeMethod = (e) => {
        task.dueDate = e.target.value;
        setTaskDueDate(e.target.value);
        updateExistingTask(task, 'dueDate');
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [task]);

    useEffect(() => {
        if (isDropdownOpen && dateInputRef.current) {
            dateInputRef.current.focus(); // Focus the date input field when the dropdown is opened
        }
    }, [isDropdownOpen]);
   
    return (
        <div className="relative">
            <div className="inline-block relative">
                <button 
                    onClick={toggleDropdown} 
                    id={`dateRangeButton-${index}`} 
                    data-dropdown-toggle="dateRangeDropdown" 
                    data-dropdown-ignore-click-outside-class="datepicker" 
                    type="button" 
                    className="inline-flex text-sm items-center min-w-[100px]"
                >
                    {moment.utc(task.dueDate).format("ddd, MMM DD")}
                </button>
            </div>

            <div 
                ref={dropdownRef} 
                id={`dateRangeDropdown-${index}`} 
                className={`z-10 ${isDropdownOpen ? '' : 'hidden'} absolute bg-white divide-y divide-gray-100 rounded-lg shadow w-48 lg:w-48 dark:bg-gray-700 dark:divide-gray-600`}
            >
                <div className="p-3" aria-labelledby={`dateRangeButton-${index}`}>
                    <div date-rangepicker="true" className="block">
                        <div className="relative">
                            <input
                                ref={dateInputRef}
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                placeholder="Due Date and Time"
                                onChange={(e) => handleDueDateChangeMethod(e)}
                                value={moment.utc(taskDueDate).format("YYYY-MM-DD")}
                                className="border block rounded-md py-1.5 px-1 text-sm text-gray-900 sm:text-sm sm:leading-6 w-[100%]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserSelect;
