import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 

function deleteItems() {
    return (
      <Layout title="Delete Items">
        <div class = "flex flex-wrap items-center justify-center gap-20">
            <div class = "flex flex-col items-center">
              <label class = "font-bold">
              Delete Storage Location
              </label>
            <input className="bg-white p-2 w-[150px] border rounded-lg my-3" placeholder="Input" />
            <button
              class = "w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]">
              Delete
            </button>
            </div>

            <div class = "flex flex-col items-center">
              <label class = "font-bold">
              Delete Product
              </label>
            <input className="bg-white p-2 w-[150px] border rounded-lg my-3" placeholder="Input" />
            <button
              class = "w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]">
              Delete
            </button>
            </div>
            
            <div class = "flex flex-col items-center">
              <label class = "font-bold ">
              Delete Sale Item
              </label>
            <input className="bg-white p-2 w-[150px] border rounded-lg my-3" placeholder="Input" />
            <button
              class = "w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]">
              Delete
            </button>
            </div>

            <div class = "flex flex-col items-center">
              <label class = "font-bold">
              Delete Process
              </label>
            <input className="bg-white p-2 w-[150px] border rounded-lg my-3" placeholder="Input" />
            <button
              class = "w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]">
              Delete
            </button>
            </div>
          </div>
        
      </Layout>
    );
  }

export default deleteItems;