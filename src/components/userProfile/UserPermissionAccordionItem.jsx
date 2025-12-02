import React, { useState } from 'react';
import Icon from "@/components/ui/Icon"; // Adjust the import path based on your project structure

const UserPermissionAccordionItem = ({ title, children, isAllSelected, onSelectAll }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenAccordion = (event) => {
        event.preventDefault();
        setIsOpen(!isOpen);
    };

    const handleSelectAll = (event) => {
        event.stopPropagation();
        onSelectAll(event.target.checked);
    };

    return (
        <div className="accordion rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
            <div
                className={`flex justify-between items-center cursor-pointer transition-all duration-300 font-semibold w-full text-start text-base text-gray-800 dark:text-gray-200 px-6 py-4 ${isOpen
                    ? "bg-gray-200 dark:bg-gray-800 rounded-t-lg"
                    : "bg-white dark:bg-gray-900 rounded-lg"
                    }`}
                onClick={handleOpenAccordion}
            >
                <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-blue-600 rounded-md focus:ring-blue-500 transition duration-150 ease-in-out"
                            checked={!!isAllSelected}
                            onChange={handleSelectAll}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <span className="ml-3 text-gray-800 dark:text-gray-200">{title}</span>
                    </label>
                </div>
                <span
                    className={`text-gray-500 dark:text-gray-400 text-xl transition-all duration-300 ${isOpen ? "rotate-180 transform" : ""
                        }`}
                >
                    <Icon icon="heroicons-outline:chevron-down" />
                </span>
            </div>
            {isOpen && (
                <div
                    className={`text-sm text-gray-700 dark:text-gray-300 rounded-b-lg`}
                >
                    <div className="px-6 py-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserPermissionAccordionItem;
