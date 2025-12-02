import React, { useState, useEffect } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/material_green.css'; // Import the Flatpickr CSS

const DatePickerStartAndEndDate = ({ initialStartDate, initialEndDate, onRangeChange }) => {
    const [startDate, setStartDate] = useState(new Date(initialStartDate));
    const [endDate, setEndDate] = useState(new Date(initialEndDate));

    useEffect(() => {
        setStartDate(new Date(initialStartDate));
    }, [initialStartDate]);

    useEffect(() => {
        setEndDate(new Date(initialEndDate));
    }, [initialEndDate]);

    const handleStartDateChange = (selectedDates) => {
        const date = new Date(selectedDates[0]);
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())); // Set time to midnight UTC
        setStartDate(utcDate);
        onRangeChange([utcDate, endDate]);
    };

    const handleEndDateChange = (selectedDates) => {
        const date = new Date(selectedDates[0]);
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())); // Set time to midnight UTC
        setEndDate(utcDate);
        onRangeChange([startDate, utcDate]);
    };

    return (
        <div className="flex items-center space-x-2">
            <Flatpickr
                className="form-control py-2 w-32 sm:w-36"
                value={startDate}
                onChange={handleStartDateChange}
                options={{
                    dateFormat: 'd/m/Y',
                }}
                placeholder="Start Date"
            />
            <span className="mx-2">to</span>
            <Flatpickr
                className="form-control py-2 w-32 sm:w-36"
                value={endDate}
                onChange={handleEndDateChange}
                options={{
                    dateFormat: 'd/m/Y',
                }}
                placeholder="End Date"
            />
        </div>
    );
};

export default DatePickerStartAndEndDate;
