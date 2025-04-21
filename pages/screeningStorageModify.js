import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 

function screeningStorageModify() {
    return (
      <Layout title="Screening Storage Modify">
      <div class = "flex flex-wrap items-center justify-center gap-16">
            <div class = "flex flex-col items-center">
              <label class = "font-bold">
              Field Lot Number
              </label>
            <input className="bg-white p-2 w-[175px] border rounded-lg my-2" placeholder="Input" />
            </div>

            <div class = "flex flex-col items-center">
              <label class = "font-bold">
              Product Description
              </label>
              <div class="relative inline-block text-left">
                <button type = "button" class ="inline-flex items-center text-gray-900 bg-white p-2 w-[175px] border rounded-lg my-2 hover:bg-gray-100" id = "menu-button" aria-expanded="true" aria-haspopup="true">
                Select Product
                <img
                  src="/drop_down.png"
                  alt="drop_down"
                  className="ml-8 w-[10px] h-[10px] object-contain opacity-100"
                />
                </button>
              </div>
            </div>
            

            <div class = "flex flex-col items-center">
              <label class = "font-bold ">
              Weight
              </label>
            <input className="bg-white p-2 w-[175px] border rounded-lg my-2" placeholder="Input" />
            </div>

            <div class = "flex flex-col items-center">
              <label class = "font-bold">
              Date and Time
              </label>
            <input className="bg-white p-2 w-[175px] border rounded-lg my-2" placeholder="mm/dd/yyyy | hr:min" />
            </div>

            <button
              class = "justify-center items-center w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]">
              Save
            </button>
          </div>

      </Layout>
    );
  }

export default screeningStorageModify;
