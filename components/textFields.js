import React from "react";
import { useRouter } from "next/router";

const TextFields = ({ id, label, type = "text", value, onChange, placeholder }) => {
    return (
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor={id} className="block text-center -mb-5">{label}</label><br />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-400 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
      </div>
    );
  };
  
  export default TextFields;
  