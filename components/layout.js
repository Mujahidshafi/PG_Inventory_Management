import React from "react";
import { useRouter } from "next/router";
const Layout = ({ title, children, onSettingsClick, showBack }) => {

  const router = useRouter();
  return (

    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <div className="flex items-center w-[95%] justify-between translate-y-[-3vh] mt-6">
        {/*back*/}
        
        {/* Only show Back button if showBack is true */}
        {showBack ? (
          <button
            onClick={() => router.back()}
            className="bg-[#3D5147] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#2C3A35]"
          >
            Back
          </button>
        ) : <div />}  {/* Empty div keeps spacing */}

        {/*page title*/}

        <span className="text-[40px] text-black">{title}</span>

        {/*Only show settings icon if onSettingsClick exists */}
        {onSettingsClick ? (
          <button onClick={onSettingsClick}>
            <img
              src="/settings.png"
              alt="Settings"
              className="w-[40px] h-[40px] object-contain opacity-100 hover:opacity-50 transition"
            />
          </button>
        ) : <div />}
      </div>


      {/*content box*/}
      <div className="bg-[#D9D9D9] w-[95%] h-[80vh] rounded-[30px] shadow-lg flex flex-wrap justify-center items-center gap-4 p-6">
        {children}
      </div>
    </div>
  );
};

export default Layout;
