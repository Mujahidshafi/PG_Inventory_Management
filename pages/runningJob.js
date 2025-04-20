import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 
import DateTimePicker from "@/components/DateandTimePicker";

function RunningJob() {
  const jobMenu = [
    { title: "Lot Number", value: "24J1"},
    { title: "Process ID", value: "2870"},
    { title: "Product Description", value: "YPC"},
    { title: "Location", value: "HQ-6"},
    { title: "Amount", value: "50,000 lbs"}
  ];

  return (
    <Layout title="Running Job">
      <div className= "w-screen h-[100%] flex flex-col gap-5">
        <div className= "h-16 bg-gray-100 text-white flex items-center px-6 rounded-2xl">
          <div className= "grid grid-cols-5 gap-1 items-center justify-items-center w-full">
            {jobMenu.map((job, index) => (
              <div key={index} className= "flex flex-col ">
                <span className="text-black font-semibold"> {job.title} </span>
                <span className="text-black"> {job.value} </span>
              </div>
            ))}
          </div>
        </div>
  
        <div className= "flex flex-auto gap-10 p-6" >
          <div className = "flex-1 bg-gray-100 rounded-2xl p-4">
            <div className= "w-full flex-1 w-[85%] grid grid-cols-2 bg-gray-300 text-black rounded-2xl p-2">
              
              <div className= "flex items-center justify-center"> Box 1 </div>

              <div>
                <label htmlFor="Weight">Weight</label>
                <input 
                 type ="text"
                 id="Weight" 
                 className="bg-gray-50 border-gray-300 text-black text-sm" 
                 placeholder="LB's" 
                 required
                 />
              </div>

            </div>
          </div>
          <div className= "flex-1 bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
  
    </Layout>
  );
}

export default RunningJob;