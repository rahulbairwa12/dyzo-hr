import React, { useState, useEffect, useRef } from "react";
import Select from 'react-select';
import { intialLetterName } from "../../../services/helper/helper";
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { DateRangePicker } from 'react-date-range';
import { MdOutlineDateRange } from "react-icons/md";
import moment from 'moment';

const Filters = ({handleSearch, setStartDate, setEndDate, searchLoader, isDropdownOpen, setIsDropdownOpen}) => {
    const dropdownRef = useRef(null);
    // const [selectedStatus, setSelectedStatus] = useState({}); 
    // const [curProjectsId, setCurProjectsId] = useState(0);
    // const [selectedUserId, setSelectedUserId] = useState(0)
    const [isSearch, setIsSearch] = useState(false);
    const [state, setState] = useState([
        {
          startDate: moment().subtract(7, 'days').toDate(),
          endDate: moment().add(1, 'days').toDate(),
          key: "selection"
        }
    ]);


    const handleSelect = (ranges) => {
        const { selection } = ranges;
        setState([selection]);
        const selectedStartDate = moment(selection.startDate).format('MM-DD-YYYY');
        const selectedEndDate = moment(selection.endDate).format('MM-DD-YYYY');
        setStartDate(selectedStartDate);
        setEndDate(selectedEndDate);
    };

    const dateSearchMethod = (e) => {
        e.preventDefault();
        handleSearch(e, "dateRange");
    }
    
    // const taskStatuses = [
    //     { status: 'all', color: '#3490dc', label: "All" },
    //     { status: 'pending', color: '#3490dc', label: "Pending" },
    //     { status: 'in_progress', color: '#ee951d', label: "In Progress" },
    //     { status: 'testing', color: '#d83183', label: 'Testing' },
    //     { status: 'completed', color: '#03ac66', label: "Completed" },
    //     { status: 'stuck', color: '#d8314b', label: 'Stuck' }, 
    // ]; 

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // const handleProjectChange = (project) => {
    //     let pId = project ? project.value: 0;
    //     setCurProjectsId(pId);
    // }

    // const handleUserChange = (user) => {
    //     let uId = user ? user.value: 0;
    //     setSelectedUserId(uId);
    // }

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // const formatOptionLabel = ({ value, label, image, first_name, last_name, name }) => (
    //     <div style={{ display: 'flex', alignItems: 'center' }}>
    //       {image ?
    //         <img src={`${image}`} alt={first_name} className='w-5 h-[1.2rem] rounded-full' />
    //         :
    //         <p className='w-5 h-[1.2rem] rounded-full border flex justify-center items-center font-semibold bg-slate-200 text-f14'>
    //           {intialLetterName(first_name, last_name, name)}
    //         </p>
    //       }
    //       <div className='px-2'>{first_name?first_name: name}</div>
    //     </div>
    //   );
    //   const selectionRange = {
    //     startDate: new Date(),
    //     endDate: new Date(),
    //     key: 'selection',
    //   }

    return (
        <>
            <button
                type="button"
                className="flex justify-center items-center rounded-md border-[#ccc] border 
                bg-transparent px-2 my-2 md:ml-2 w-[90px] py-2 text-f14 hover:bg-gray-100"
                onClick={toggleDropdown}
              >
                <MdOutlineDateRange className="w-5 h-5 mr-2" />  Date
               
            </button>

            <div
                id="dropdownAvatar"
                ref={dropdownRef}
                className={`z-10 ${isDropdownOpen ? 'block' : 'hidden'} absolute mt-1 left-0`}
            >
                
                <div className="md:m-2  mt-24">
                    <div className="flex flex-col">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
                            <form className="">
                                {/* <div className="relative mb-10 w-full flex items-center justify-between rounded-md">
                                    <svg
                                        className="absolute left-2 block h-5 w-5 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input
                                        type="name"
                                        name="search"
                                        className="h-12 w-full cursor-text rounded-md border border-gray-100 bg-gray-100 py-4 pr-40 pl-12 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                        placeholder="Search by task name..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                                    <div className="flex flex-col">
                                        <label htmlFor="name" className="text-sm font-medium text-stone-600">
                                            Name
                                        </label>
                                        <Select
                                            onChange={option => setSelectedUserId(option.value)}
                                            options={users}
                                            formatOptionLabel={formatOptionLabel}
                                            className="block py-2 pl-0 pr-2 sm:w-48 md:w-64 lg:w-60 text-sm text-gray-900 rounded-lg"
                                            classNamePrefix="select"
                                            placeholder="Select an employee"
                                            isSearchable={true}
                                            noOptionsMessage={() => "No Data"}
                                            //styles={customStyles}
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label htmlFor="status" className="text-sm font-medium text-stone-600">
                                            Status
                                        </label>

                                        <select
                                            id="status"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="mt-2 block w-full cursor-pointer rounded-md border border-[#ccc] bg-white px-2 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                        >
                                            {taskStatuses.map((status) => (
                                                <option key={status.status} value={status.status}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <label htmlFor="projects" className="text-sm font-medium text-stone-600">
                                            Projects
                                        </label>

                                        <Select
                                            instanceId="projectId"
                                            className="basic-single block py-2 pl-0 pr-2 sm:w-48 md:w-64 lg:w-60 text-sm text-gray-900 rounded-lg"
                                            classNamePrefix="select"
                                            options={options}
                                            onChange={(e) => handleProjectChange(e)}
                                            name="projectId"
                                            styles={{
                                                control: (base, state) => ({
                                                ...base,
                                                border: '1px solid #ccc',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    borderColor: '#666',
                                                },
                                                height: '40px',
                                                minHeight: '40px',
                                                }),
                                            }}
                                            />
                                    </div>
                                </div> */}
                                
                                <div className="mt-1 grid w-full grid-cols-1 justify-start">
                                    <label className="text-sm block font-medium text-stone-600 py-2">
                                            Select Date 
                                    </label>
                                        <DateRangePicker
                                            onChange={handleSelect}
                                            showSelectionPreview={true}
                                            moveRangeOnFirstSelection={false}
                                            months={2}
                                            ranges={state}
                                            direction="horizontal"
                                        />
                                </div>
                                <div className="mt-6 grid w-full grid-cols-2 justify-end space-x-4 md:flex">
                                    <button className="rounded-lg bg-gray-200 px-8 py-2 font-medium text-gray-700 outline-none hover:opacity-80 focus:ring">
                                        Reset
                                    </button>
                                    <button onClick ={(e)=>dateSearchMethod(e)} className="rounded-lg bg-blue-600 px-8 py-2 font-medium text-white outline-none hover:opacity-80 focus:ring">
                                        { searchLoader? 'Searching...':'Search' }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Filters;
