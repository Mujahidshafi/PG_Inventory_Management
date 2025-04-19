import React from "react";
//import "../App.css";
import Button from "../components/button"; 
import Link from "next/link";
import Image from "next/image";

function login() {
  return (
    <>
      <div className="min-h-screen bg-white flex flex-col items-center justify-start">

        <div className="flex p-6 bg-white m-[40px] flex-row justify-between items-center">
          <div>
            <Image 
              src="/Logo.png" 
              width={150}
              height={87}
              alt="Logo" 
            />
          </div>
          <div>
            <span className="text-[#3D5147] text-[55px] font-medium font-[amiri] mx-8">Pleasant Grove Farms</span>
          </div>
        </div>

        <div className="flex items-center flex-col justify-center w-[424px] h-[605px] bg-[#3D5147] rounded-3xl">
          <span className="text-white text-[40px] font-[amiri] my-7">Sign In</span>
          <span className="text-white text-[20px] font-[amiri] my-4">Username</span>
          <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Username" />
          <span className="text-white text-[20px] font-[amiri] my-4">Password</span>
          <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Password" />
          <Link href="/employeeMenu">
            <Button 
              label="Log In"
              color="red"
              className="w-[120px] h-[45px] font-[amiri] items-center my-6"
            />
          </Link>
          <Link href="/forgotPassword">
            <span className="text-white underline cursor-pointer">Forgot Password?</span>
          </Link>
          <Link href="/adminMenu">
            <span className="text-white underline cursor-pointer">Admin Menu</span>
          </Link>
        </div>
        
      </div>
    </>
  );
}

export default login;
