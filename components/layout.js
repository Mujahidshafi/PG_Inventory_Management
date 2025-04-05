import React from "react";

const Layout = ({ title, children }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="flex items-center w-[95%] justify-between translate-y-[-3vh]">
        {/*back*/}
        <button className="bg-[#3D5147] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#2C3A35]">
          Back
        </button>

        {/*page title*/}
        <span className="text-[40px]">{title}</span>

        {/*settings*/}
        <button>
          <img
            src="/settings.png"
            alt="Settings"
            className="w-[100px] h-[40px] object-contain opacity-100 hover:opacity-50 transition"
          />
        </button>
      </div>

      {/*content box*/}
      <div className="bg-[#D9D9D9] w-[95%] h-[80vh] rounded-[30px] shadow-lg flex flex-wrap justify-center items-center gap-4 p-6">
        {children}
      </div>
    </div>
  );
};

export default Layout;
