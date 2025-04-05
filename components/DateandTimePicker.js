import React from "react";

const DateTimePicker = ({ label, value, onChange }) => {
    const getTodayDateTime = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // Fix for timezone offset
        return new Date(now - offset).toISOString().slice(0, 16);
    };
    return (
        <div>
            {label && (
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    {label}
                </label>
            )}
            <div>
                <input
                    type="datetime-local"
                    min = {getTodayDateTime()}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-64 font-mono bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500
                    focus:border-blue-500 block ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                    dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
            </div>
        </div>
    );
};

export default DateTimePicker;