import React, { useState, useEffect } from 'react';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css"; // Import the Flatpickr CSS
import moment from 'moment';

const DatePicker = ({ title, initialValue, onTimeChange, disabled }) => {
  const [time, setTime] = useState(initialValue);

  useEffect(() => {
    setTime(initialValue);
  }, [initialValue]);

  const handleTimeChange = (time) => {
    const formattedTime = moment(time[0]).format("HH:mm:ss");
    setTime(formattedTime);
    onTimeChange(title, formattedTime);
  };

  return (
    <div>
      <label htmlFor={`${title}-picker`} className="form-label">
        {title}
      </label>
      <Flatpickr
        className="form-control py-2"
        value={time}
        onChange={handleTimeChange}
        id={`${title}-picker`}
        options={{
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true
        }}
        disabled={disabled}
      />
    </div>
  );
}

export default DatePicker;
