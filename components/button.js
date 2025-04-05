import React from "react";

function Button({label, color = "green", className = ''}){
    const baseStyles = "flex items-center justify-center px-6 py-2 rounded-xl shadow-md";
    const colorStyles = 
    {
        green: "bg-[#3D5147] text-white hover:bg-[#2C3A35]",
        red: "bg-[#5D1214] text-white hover:bg-[#2C3A35]"
    };

    return (
        <button className={`${baseStyles} ${colorStyles[color]} ${className}`}>
            {label}
        </button>
    );
}

export default Button;