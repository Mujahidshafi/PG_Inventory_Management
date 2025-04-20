import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 
import Button from "@/components/button";

function cleanStorageModify() {
  return (
    <Layout title="Clean Storage Modify">
      <div className="flex flex-row gap-x-10 justify-center">
        <div className="flex flex-col items-center justify-center">
          <div>
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Field Lot Number
            </h1>
          </div>
          <div>
            <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Input" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div>
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Prodcut Description
            </h1>
          </div>
          <div>
          <div className="p-4">
          <select className="border border-black-400 rounded-lg px-4 py-[18px] w-[300px] bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              <option value="apple">Value1</option>
              <option value="banana">Value2</option>
              <option value="cherry">Value3</option>
            </select>
    </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div>
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Weight
            </h1>
          </div>
          <div>
            <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Input" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div>
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Date & Time
            </h1>
          </div>
          <div>
            <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="2/25/24 | 3:55 pm" />
          </div>
        </div>
        <div>
          <div className="w-[120px] h-[70px] bg-[#D9D9D9] rounded-md my-4"></div>
          <div>
            <Button
              label="Save"
              color="red"
              className="w-[120px] h-[45px] font-[amiri] items-center my-6"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default cleanStorageModify;
