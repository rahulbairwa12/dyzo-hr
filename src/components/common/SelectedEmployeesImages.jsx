import { intialLetterName } from '@/helper/helper';
import React, { useState, useEffect, useRef } from 'react';

const SelectedEmployeesImages = ({ employees, onSelectionChange }) => {

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedEmployeeIDs, setSelectedEmployeeIDs] = useState([]);
  const apiBaseURL = process.env.REACT_APP_DJANGO;  
  const searchRef = useRef(null); // Reference to the search input and results div

  const selectedEmployees = selectedEmployeeIDs.map((id) =>
    employees?.find((e) => e._id === id)
  );

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setShowSearch(true);
  };

  const handleSelect = (employee) => {
    if (!selectedEmployeeIDs.includes(employee._id)) {
      const newSelectedEmployeeIDs = [...selectedEmployeeIDs, employee._id];
      setSelectedEmployeeIDs(newSelectedEmployeeIDs);
      onSelectionChange(newSelectedEmployeeIDs.map((id) => 
        employees.find((e) => e._id === id)
      ));
    }
    setSearchTerm('');
    setShowSearch(false);
  };

  const handleRemove = (employeeId) => {
    const newSelectedEmployeeIDs = selectedEmployeeIDs?.filter((id) => id !== employeeId);
    setSelectedEmployeeIDs(newSelectedEmployeeIDs);
    onSelectionChange(newSelectedEmployeeIDs.map((id) => 
      employees.find((e) => e._id === id)
    ));
  };

  const searchResults = employees?.filter((employee) =>
    (employee.name ? employee.name.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
    (employee.designation ? employee.designation.toLowerCase().includes(searchTerm.toLowerCase()) : false)
  );

  // Add click event listener to detect clicks outside of the search div
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className='employees'>
      <div className='relative' ref={searchRef}>
        <div className='flex border rounded-md h-[41px] px-1'>
            {selectedEmployees.map((employee) => (
                <span key={employee._id} className="tag rounded mx-1 px-1 relative">
                    {employee?.profile_picture ?
                        <img src={`${apiBaseURL + employee?.profile_picture}`} alt={employee.name} className='w-10 h-[2.5rem] rounded-full' />
                        :
                        <p className='w-10 h-[2.5rem] rounded-full border flex justify-center items-center font-semibold bg-slate-200'>
                            {intialLetterName(employee?.first_name, employee?.last_name, employee?.name)}
                        </p>
                    }
                    <button onClick={() => handleRemove(employee._id)} className='absolute top-0 right-[50%] left-[50%] translate-y-[0%] translate-x-[50%] text-slate-600 font-bold bg-white shadow-md w-5 h-[1.25rem] rounded-full flex justify-center items-center'>x</button>
                </span>
            ))}
            {selectedEmployees.length<1 && <p className='leading-[40px] text-secondary addemployees'>Add Employee</p>}
            <span onClick={() => setShowSearch(!showSearch)} className='font-bold text-f24 mx-1 rounded-full cursor-pointer my-auto'><Icon icon="material-symbols-light:add-circle-outline" /></span>
        </div>
        {showSearch && 
          <div className='absolute w-full py-2 bg-white border border-gray-200 z-40 px-2 pb-4 rounded-md'>
            <input
                type="text"
                placeholder="Search employee"
                value={searchTerm}
                onChange={handleSearch}
                className='w-full p-2 border border-[#D6D6D6] rounded placeholder:text-secondary font-normal focus:outline-none z-50'
            />
            {searchTerm && (
                <ul className='bg-white px-1'>
                    {searchResults.map((employee) => (
                        <li key={employee._id} onClick={() => handleSelect(employee)} className='text-[14px] py-2 cursor-pointer flex items-center'>
                            {employee?.profile_picture ?
                            <img src={`${apiBaseURL + employee?.profile_picture}`} alt={employee.name} className='w-8 h-[2rem] rounded-full' />
                            :
                            <p className='w-8 h-[2rem] rounded-full border flex justify-center items-center font-semibold bg-slate-200 text-[14px]'>
                                {intialLetterName(employee?.first_name, employee?.last_name, employee?.name)}
                            </p>
                            }
                            <span className='px-1'>{employee.name} - {employee.designation || 'No Designation'}</span>
                        </li>
                    ))}
                </ul>
            )}
          </div>
        }
      </div>
    </div>
  );
};

export default SelectedEmployeesImages;
