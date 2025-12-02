import React, { useState } from "react";

const OTPInput = ({ length, onChange, register, name, error }) => {
  const [otp, setOtp] = useState(new Array(length).fill(""));

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling) {
      element.nextSibling.focus();
    }

    onChange(newOtp.join(""));
  };

  return (
    <div className="otp-input-group">
      {otp.map((data, index) => {
        return (
          <input
            key={index}
            type="text"
            name={`${name}[${index}]`}
            maxLength="1"
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onFocus={(e) => e.target.select()}
            className={`otp-input ${error ? "has-error" : ""}`}
            {...register(name)}
          />
        );
      })}
      {error && (
        <div className="error-message text-danger-500">
          {error.message}
        </div>
      )}
    </div>
  );
};

export default OTPInput;
