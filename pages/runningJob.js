import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 

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
              <div className="flex flex-col">
                <label htmlFor="Weight" className = "flex items-center justify-center">Weight</label>
                <input 
                 type ="text"
                 id="Weight" 
                 className= "w-auto bg-gray-50 border-gray-300 text-black text-sm rounded-lg px-2 py-1" 
                 placeholder="LB's" 
                 required
                 />
              </div>   

            </div>
          </div>
          <div className= "flex-1 bg-gray-100 rounded-2xl"> 
            <div className= "overflow-x-auto p-10">
              <table className="w-full table-auto border-collapse text-sm text-center bg-white">
                <thead className="bg-gray-200 text-black">
                  <tr>
                    <th>Clean</th>
                    <th></th>
                    <th></th>
                    <th>Screening</th>
                    <th></th>
                    <th>Trash</th>
                  </tr>
                </thead>
                 <thead className="text-black">
                  <tr>
                    <th></th>
                    <th className="bg-gray-100 text-sm">Gravity</th>
                    <th className="bg-gray-100 text-sm">Light</th>
                    <th className="bg-gray-100 text-sm">Small</th>
                    <th className="bg-gray-100 text-sm">De Stoner Light</th>
                    <th></th>
                  </tr>
                  </thead>
                <tbody>
                  <tr>
                    <td>2,000</td>
                    <td>1,500</td>
                    <td>1,000</td>
                    <td>3,000</td>
                    <td>2,500</td>
                    <td>2,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  
    </Layout>
  );
}

export default RunningJob;