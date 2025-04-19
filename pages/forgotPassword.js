import React from "react";
import Button from "../components/button";
import Link from "next/link";
import Image from "next/image";

function ForgotPassword() {
  return (
    <>
    <div className = "flex bg-white flex-wrap flex-col justify-between items-center">

      <div className = "flex bg-white p-6 m-[40px] flex-row w-[95%] justify-between items-center">
        <Link href="/login">
          <button className="bg-[#3D5147] text-white px-6 py-2 rounded-lg shadow-md hover:bg-[#2C3A35]">
            Back
          </button>
        </Link>
        <div className = "flex items-centerbg-white">
          <Image 
            src="/Logo.png" 
            width={150}
            height={87}
            alt="Logo" 
          />
          <span className="text-[#3D5147] text-[55px] font-medium font-[amiri] mx-8">Pleasant Grove Farms</span>
        </div>
        <div className = "w-2 h-2 bg-white"></div>
      </div>

      <div className = "flex items-center flex-col justify-center w-[424px] h-[605px] bg-[#3D5147] rounded-3xl">
        <span className="text-white text-[40px] font-[amiri] my-7">Reset Password</span>
        <span className="text-white text-[20px] font-[amiri] my-4">Enter your email address:</span>
        <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Email" />
        <Button 
          label = "Submit"
          color = "red"
          className = "w-[120px] h-[45px] font-[amiri] items-center my-6"
        />
      </div>
    </div>
    </>
  );
}

export default ForgotPassword;
