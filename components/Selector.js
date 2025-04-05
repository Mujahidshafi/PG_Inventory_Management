import React from "react";

const Selector = ( {label, options, value, onChange, placeholder = "Select an Option"}) =>{
    return (
        <div>
            {label && <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{label}</label>}
            <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500
                focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600
                dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="" disabled>
                    {placeholder}
                </option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    )
}
export default Selector;