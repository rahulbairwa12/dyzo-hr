// ------------------------------------------------------------------
// AssignToSelect.js
// ------------------------------------------------------------------

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Button from "../ui/Button";
import Tooltip from "../ui/Tooltip";
import { intialLetterName } from "@/helper/helper";
import ProfileHoverCard from "../userProfile/ProfileHoverCard";

// Import all the helper logic from your statusHelper.js
import {
  statusMapping,
  getLiveStatus,
  fetchDjangoData,

  combineEmployeeData,
} from "@/helper/statusHelper";

/**
 * Props:
 * - task
 * - users (the local array of users, each might have { _id, name, image, ... })
 * - index
 * - userId
 * - updateExistingTask
 * - companyId (optional, default 2)
 */
const AssignToSelect = ({ task, users, index, userId, updateExistingTask, isCompleted, companyId = 2, isPanelVisible }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showHoverCard, setShowHoverCard] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Django live reporting data
  const [djangoData, setDjangoData] = useState([]);



  const searchRef = useRef(null);
  const selectRef = useRef(null);
  // Add ref for positioning the hover card
  const avatarRef = useRef(null);
  const navigate = useNavigate();


  // ----------------------------
  // 1) Fetch Django data on mount
  // ----------------------------
  useEffect(() => {
    async function getDjangoData() {
      const data = await fetchDjangoData(companyId);
      setDjangoData(data || []);
    }
    getDjangoData();
  }, [companyId]);

  // ------------------------------
  // 2) Subscribe to Firebase logs


  // ------------------------------
  // 3) If userId changes, find that employee
  // ------------------------------
  useEffect(() => {

    // Find the user in the users array
    const found = users.find((u) => u._id === userId);


    // Update the selected employee state
    setSelectedEmployee(found || null);

  }, [userId, users]);

  // ------------------------------
  // 4) Close dropdown on outside click
  // ------------------------------
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
        setSearchTerm(""); // Clear search term when dropdown is closed
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------------------
  // 5) Auto-focus search input
  // ------------------------------
  useEffect(() => {
    if (showSearch && selectRef.current) {
      selectRef.current.focus();
    }
  }, [showSearch]);

  // ------------------------------
  // 6) Combine each user with Django + Firebase
  // ------------------------------
  const mergedUsers = users.map((usr) => combineEmployeeData(usr, djangoData));

  // The currently selected user, merged
  const mergedSelected = selectedEmployee
    ? combineEmployeeData(selectedEmployee, djangoData)
    : null;


  // Derive the final status string for the selected employee
  const selectedStatusString = mergedSelected ? getLiveStatus(mergedSelected) : "Offline";
  const selectedStatusObj = statusMapping[selectedStatusString] || statusMapping.Offline;

  // ------------------------------
  // 7) Search logic
  // ------------------------------
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setShowSearch(true);
  };

  const searchResults = mergedUsers.filter((employee) => {
    if (!employee) return false;
    const nameMatch = employee.label
      ? employee.label.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    const desgMatch = employee.designation
      ? employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    return nameMatch || desgMatch;
  });

  // ------------------------------
  // 8) Select user from the dropdown
  // ------------------------------
  const handleSelect = (employee) => {


    setSearchTerm("");
    setShowSearch(false);

    // Create a copy of the task to work with
    const updatedTask = {
      ...task,
      userId: employee.value // Update the userId property
    };



    setSelectedEmployee(employee);

    // Call the update function with the updated task
    if (typeof updateExistingTask === 'function') {
      updateExistingTask(updatedTask, "userId");
    } else {
      console.error("updateExistingTask is not a function:", updateExistingTask);
    }
  };

  // Handle hover events
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setShowHoverCard(true);
    }, 300); // Show after a short delay to prevent flickering on quick mouse movements
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setShowHoverCard(false);
    }, 300); // Hide after a short delay to give time to move to the card
  };

  return (
    <div className="block" key={`assignTo-${index}`}>
      <div className="relative" ref={searchRef}>
        {/* Selected Employee Display */}
        <div
          className="flex px-1 relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span
            ref={avatarRef}
            className="tag mx-1 px-1 relative flex justify-center items-center cursor-pointer"
            onClick={() => {
              if (!isPanelVisible) {
                setShowSearch(!showSearch);
                if (showSearch) {
                  setSearchTerm(""); // Clear search term when closing dropdown
                }
              }
            }}
          >
            {mergedSelected?.image ? (
              <div className="relative  ">
                <img
                  src={mergedSelected.image}
                  alt={mergedSelected.name}
                  className={`w-[30px] h-[30px] rounded-full object-cover ${isCompleted ? "opacity-60" : ""}`}
                />
                {/* Status Dot + Tooltip */}
              </div>
            ) : (
              <div className="w-[32px] h-[32px] flex items-center justify-center">
                <div className={`flex items-center sm:px-[16px] sm:py-[16px] px-1 py-1 justify-center w-[30px] h-[30px] rounded-full bg-slate-200 dark:bg-slate-600 ${isCompleted ? "opacity-60" : ""}`}>
                  <span className="text-sm">{mergedSelected && (
                    mergedSelected.first_name && mergedSelected.last_name ?
                      `${mergedSelected.first_name[0]?.toUpperCase()}${mergedSelected.last_name[0]?.toUpperCase()}` :
                      mergedSelected.name ?
                        mergedSelected.name.split(" ").length > 1 ?
                          `${mergedSelected.name.split(" ")[0][0]?.toUpperCase()}${mergedSelected.name.split(" ")[1][0]?.toUpperCase()}` :
                          `${mergedSelected.name[0]?.toUpperCase()}` :
                        "U"
                  )}</span>
                </div>
              </div>
            )}

            {/* Profile Hover Card */}
            {showHoverCard && mergedSelected && avatarRef.current && createPortal(
              <div className="fixed z-[9999]"
                style={{
                  top: avatarRef.current.getBoundingClientRect().top - 10,
                  left: avatarRef.current.getBoundingClientRect().right + 10,
                }}>
                <ProfileHoverCard
                  user={{
                    _id: mergedSelected.value || mergedSelected._id,
                    name: mergedSelected.name,
                    profilePic: mergedSelected.image,
                    role: mergedSelected.designation || "User",
                    email: mergedSelected.email,
                    department: mergedSelected.department,
                    jobTitle: mergedSelected.designation,
                    phone: mergedSelected.phone,
                    user_type: mergedSelected.user_type,
                    isAdmin: mergedSelected.isAdmin,
                    team_leader: mergedSelected.team_leader
                  }}
                  isCompleted={isCompleted}
                />
              </div>,
              document.body
            )}
          </span>
        </div>

        {/* Search Dropdown */}
        {(showSearch && !isCompleted) && (
          <div className="fixed flex flex-col w-60 lg:w-60 py-2 bg-white border border-gray-200 z-[1000] px-2 pb-4 rounded-md shadow-lg max-h-96 overflow-auto" style={{
            top: searchRef.current ? searchRef.current.getBoundingClientRect().bottom + window.scrollY + 5 : '4rem',
            left: searchRef.current ? searchRef.current.getBoundingClientRect().left + window.scrollX : '1rem',
          }}>
            <div className="block py-1 text-f14 font-semibold text-gray-700">
              ASSIGN TO
            </div>
            <input
              type="text"
              placeholder="Search employee"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-2 border border-[#D6D6D6] rounded placeholder:text-secondary font-normal focus:outline-none"
              ref={selectRef}
            />
            <Button
              className="btn-dark dark:bg-slate-800 h-min text-sm font-normal cursor-pointer block my-2"
              onClick={() => navigate("/invite-user")}
            >
              Add Employee
            </Button>

            {searchTerm ? (
              <ul className="bg-white px-1 max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((employee) => {
                    const finalStatus = getLiveStatus(employee);
                    const stObj = statusMapping[finalStatus] || statusMapping.Offline;
                    return (
                      <li
                        key={employee.value}
                        onClick={() => handleSelect(employee)}
                        className="text-[14px] py-2 cursor-pointer flex items-center hover:bg-gray-100 rounded"
                      >
                        {employee.image ? (
                          <img
                            src={employee.image}
                            alt={employee.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <p className="w-8 h-8 rounded-full border text-f13 flex justify-center items-center font-semibold bg-slate-200 text-[14px]">
                            {employee.first_name && employee.last_name ?
                              `${employee.first_name[0]?.toUpperCase()}${employee.last_name[0]?.toUpperCase()}` :
                              employee.name ?
                                employee.name.split(" ").length > 1 ?
                                  `${employee.name.split(" ")[0][0]?.toUpperCase()}${employee.name.split(" ")[1][0]?.toUpperCase()}` :
                                  `${employee.name[0]?.toUpperCase()}` :
                                "U"}
                          </p>
                        )}
                        <div className="px-1 flex flex-col">
                          <span className="text-sm font-medium">{employee.name}</span>
                          <div className="flex items-center">
                            {/* Status Dot + Tooltip */}
                            {stObj && (
                              <Tooltip
                                title={`${stObj.emoji} ${stObj.text}`}
                                content={stObj.text}
                                placement="right"
                                className="btn btn-outline-dark"
                                arrow
                                animation="shift-away"
                                theme="custom-light"
                              >
                                <span
                                  className={`mr-1 block w-2 h-2 rounded-full ring-2 ring-white ${stObj.color}`}
                                ></span>
                              </Tooltip>
                            )}
                            <span className="text-xs text-gray-500">{employee.designation || 'Team Member'}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-sm text-gray-500 py-2">No employees found.</li>
                )}
              </ul>
            ) : (
              <ul className="bg-white px-1 max-h-60 overflow-y-auto">
                {mergedUsers.length > 0 ? (
                  mergedUsers.map((employee) => {
                    const finalStatus = getLiveStatus(employee);
                    const stObj = statusMapping[finalStatus] || statusMapping.Offline;
                    return (
                      <li
                        key={employee.value}
                        onClick={() => handleSelect(employee)}
                        className="text-[14px] py-2 cursor-pointer flex items-center hover:bg-gray-100 rounded"
                      >
                        {employee.image ? (
                          <img
                            src={employee.image}
                            alt={employee.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <p className="w-8 h-8 rounded-full border text-f13 flex justify-center items-center font-semibold bg-slate-200 text-[14px]">
                            {employee.first_name && employee.last_name ?
                              `${employee.first_name[0]?.toUpperCase()}${employee.last_name[0]?.toUpperCase()}` :
                              employee.name ?
                                employee.name.split(" ").length > 1 ?
                                  `${employee.name.split(" ")[0][0]?.toUpperCase()}${employee.name.split(" ")[1][0]?.toUpperCase()}` :
                                  `${employee.name[0]?.toUpperCase()}` :
                                "U"}
                          </p>
                        )}
                        <div className="px-1 flex flex-col">
                          <span className="text-sm font-medium">{employee.name}</span>
                          <div className="flex items-center">
                            {/* Status Dot + Tooltip */}
                            {stObj && (
                              <Tooltip
                                title={`${stObj.emoji} ${stObj.text}`}
                                content={stObj.text}
                                placement="right"
                                className="btn btn-outline-dark"
                                arrow
                                animation="shift-away"
                                theme="custom-light"
                              >
                                <span
                                  className={`mr-1 block w-2 h-2 rounded-full ring-2 ring-white ${stObj.color}`}
                                ></span>
                              </Tooltip>
                            )}
                            <span className="text-xs text-gray-500">{employee.designation || 'Team Member'}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <li className="text-sm text-gray-500 py-2">No employees found.</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignToSelect;
