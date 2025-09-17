import React from "react";

const DateTimeField = ({ id = "dateTime", label = "Date & Time", value, onChange }) => {
  const getTodayDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000; 
    return new Date(now - offset).toISOString().slice(0, 16);
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor={id} className="block text-center -mb-5">{label}</label><br />
      <input
        id={id}
        type="datetime-local"
        min={getTodayDateTime()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-400 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
    </div>
  );
};

export default DateTimeField;