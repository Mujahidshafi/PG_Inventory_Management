import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 
import Button from "@/components/button";

function addNewItems() {
  return (
    <div>
        <Layout title="Add New Items">
          <div className="flex gap-x-10 flex-row justify-center">
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-black text-[20px] font-[amiri] my-7">
                Add Storage Location
              </h1>
              <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Input" />
              <Button
                label="Add"
                color="red"
                className="w-[120px] h-[45px] font-[amiri] items-center my-6"
              />
            </div>
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-black text-[20px] font-[amiri] my-7">
                Add Product
              </h1>
              <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Input" />
              <Button
                label="Add"
                color="red"
                className="w-[120px] h-[45px] font-[amiri] items-center my-6"
              />
            </div>
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-black text-[20px] font-[amiri] my-7">
                Add Sale Item
              </h1>
              <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Input" />
              <Button
                label="Add"
                color="red"
                className="w-[120px] h-[45px] font-[amiri] items-center my-6"
              />
            </div>
          </div>
        </Layout>
    </div>
  );
}

export default addNewItems;
