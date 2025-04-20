import React from "react";
//import "../App.css";
import Layout from "../components/layout";
import Button from "@/components/button";
import Layout from "../components/layout";
import Button from "@/components/button";

function RunningJob() {
  const jobMenu = [
    { title: "Lot Number", value: "24J1" },
    { title: "Process ID", value: "2870" },
    { title: "Product Description", value: "YPC" },
    { title: "Location", value: "HQ-6" },
    { title: "Amount", value: "50,000 lbs" },
    { title: "Lot Number", value: "24J1" },
    { title: "Process ID", value: "2870" },
    { title: "Product Description", value: "YPC" },
    { title: "Location", value: "HQ-6" },
    { title: "Amount", value: "50,000 lbs" },
  ];

  return (
    <Layout title="Running Job">
      <div className="w-screen h-[100%] flex flex-col gap-5">
        <div className="h-16 bg-gray-100 text-white flex items-center px-6 rounded-2xl">
          <div className="grid grid-cols-5 gap-1 items-center justify-items-center w-full">
      <div className="w-screen h-[100%] flex flex-col gap-5">
        <div className="h-16 bg-gray-100 text-white flex items-center px-6 rounded-2xl">
          <div className="grid grid-cols-5 gap-1 items-center justify-items-center w-full">
            {jobMenu.map((job, index) => (
              <div key={index} className="flex flex-col ">
              <div key={index} className="flex flex-col ">
                <span className="text-black font-semibold"> {job.title} </span>
                <span className="text-black"> {job.value} </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-auto gap-10 p-6">

        <div className="flex flex-auto gap-10 p-6">
          {/*Panel 1*/}
          <div className="flex-1 bg-gray-100 rounded-2xl p-4">
            <div className="w-full flex-1 w-[85%] grid grid-cols-2 bg-gray-300 text-black rounded-2xl p-2">
              <div className="flex items-center justify-center"> Box 1 </div>
          <div className="flex-1 bg-gray-100 rounded-2xl p-4">
            <div className="w-full flex-1 w-[85%] grid grid-cols-2 bg-gray-300 text-black rounded-2xl p-2">
              <div className="flex items-center justify-center"> Box 1 </div>
              <div className="flex flex-col">
                <label
                  htmlFor="Weight"
                  className="flex items-center justify-center"
                >
                  Weight
                </label>
                <input
                  type="text"
                  id="Weight"
                  className="w-auto bg-gray-50 border-gray-300 text-black text-sm rounded-lg px-2 py-1"
                  placeholder="LB's"
                  required
                />
              </div>
                <label
                  htmlFor="Weight"
                  className="flex items-center justify-center"
                >
                  Weight
                </label>
                <input
                  type="text"
                  id="Weight"
                  className="w-auto bg-gray-50 border-gray-300 text-black text-sm rounded-lg px-2 py-1"
                  placeholder="LB's"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 bg-gray-100 rounded-2xl p-4">
            {/*Panel 2*/}
            <div className="flex-1 bg-gray-100 rounded-2xl p-4">
              {/*Output Display*/}
              <div className="overflow-x-auto bg-gray-100 rounded-md text-sm text-center">

          <div className="flex-1 flex flex-col gap-4 bg-gray-100 rounded-2xl p-4">
            {/*Panel 2*/}
            <div className="flex-1 bg-gray-100 rounded-2xl p-4">
              {/*Output Display*/}
              <div className="overflow-x-auto bg-gray-100 rounded-md text-sm text-center">
                {/*Title*/}
                <div className="grid grid-cols-6 bg-gray-200 text-black font-semibold">
                  <div className="p-2">Clean</div>
                  <div className="col-span-4 p-2">Screening</div>
                  <div className="p-2">Trash</div>
                </div>
                {/*sub-title*/}
                <div className="grid grid-cols-6 bg-gray-200 text-black border-b border-gray-300 text-sm">
                  <div></div>
                  <div>Gravity</div>
                  <div>Light</div>
                  <div>Small</div>
                  <div>DE-Stoner Light</div>
                  <div></div>
                </div>
                {/*Data*/}
                <div className="grid grid-cols-6 divide-x divide-gray-400 border-t border-gray-300 text-black">
                  <div>2,000</div>
                  <div>1,500</div>
                  <div>1,000</div>
                  <div>3,000</div>
                  <div>2,500</div>
                  <div>2,000</div>
                </div>
              </div>
            </div>

            {/*Panel 3*/}
            <div className="grid grid-cols-3 bg-gray-200 rounded-2xl divide-gray-400 border-t border-gray-300">
              <div className="text-center text-sm font-semibold text-black p-2">
                Totals
              </div>
              <div className="">
                <div>Clean</div>
                <div>Screenings</div>
                <div>Trash</div>
              </div>
              <div>
                <div>7,000</div>
                <div>6,000</div>
                <div>3,500</div>
              </div>
            </div>
            {/*Bottom Panel */}
            <div className="grid grid-cols-2">
              <Button label="Save" color="red"/>
              <Button label="Complete" color="red"/>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default RunningJob;
