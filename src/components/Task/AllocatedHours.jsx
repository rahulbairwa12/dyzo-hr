import React, { useState, useEffect } from 'react';

export default function AllocatedHours({ task, updateTaskDetails }) {
    const [hours, setHours] = useState(1);
  
    useEffect(()=>{
        task?.allocated_time ? setHours(task?.allocated_time) : setHours(1);
    },[])

    const handleHoursChange = (e)=>{
        setHours(e.target.value);
        updateTaskDetails(e.target.value, 'allocated_time');
    }

  return (
   
      <div className="relative">
       <input onChange={(e) => handleHoursChange(e)} step="0.5" min="0" type="number" id="number-input" value={hours} aria-describedby="helper-text-explanation" className="w-[90px] bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2.5" placeholder="01"  />
      </div>
   
  );
}
