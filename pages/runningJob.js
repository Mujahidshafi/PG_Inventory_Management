import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 

function RunningJob() {
  return (
    <Layout title="Running Job">
      <div className= "w-screen h-[100%] flex flex-col gap-5">
        <div className= "h-16 bg-gray-100 text-white flex items-center px-6 rounded-2xl">
        </div>
  
        <div className= "flex flex-auto gap-10 p-6" >
          <div className = "flex-1 bg-gray-100 rounded-2xl"></div>
          <div className= "flex-1 bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
  
    </Layout>
  );
}

export default RunningJob;