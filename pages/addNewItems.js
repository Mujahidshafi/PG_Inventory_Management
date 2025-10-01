import React from "react";
//import "../App.css";
import Layout from "../components/layout"; 
import Button from "../components/button";
import {useState, useEffect} from "react";

function AddNewItems() {

  const [saleQuantity, setSaleQuantity] = useState("");
  const [storageLocationName, setStorageLocationName] = useState("");

    async function handleAddItems(apiRoute, payload, resetInput, actionMessage) {
    const res = await fetch( apiRoute,{
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      alert (actionMessage);
      resetInput("");
    } else {
      alert("ERROR: "+ data.error)
    }
  }

  return (
    <div>
        <Layout title="Add New Items">
          <div className="flex gap-x-10 flex-row justify-center">
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-black text-[20px] font-[amiri] my-7">
                Add Storage Location
              </h1>
              <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
              placeholder="Input"
              value= {storageLocationName}
              onChange={(e) => setStorageLocationName(e.target.value)}
              />
              <Button
                label="Add"
                color="red"
                className="w-[120px] h-[45px] font-[amiri] items-center my-6"
                onClick={() => handleAddItems("/api/addStorageLocationList", 
                  { storage_location_name: storageLocationName }, 
                  setStorageLocationName, 
                  "NEW STORAGE LOCATION ADDED!")}
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
              <input 
              className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" 
              placeholder="Input" 
              value= {saleQuantity}
              onChange={(e) => setSaleQuantity(e.target.value)}
              />
              <Button
                label="Add"
                color="red"
                className="w-[120px] h-[45px] font-[amiri] items-center my-6"
                onClick={() => handleAddItems("/api/addSaleList", 
                  { product_quantity: saleQuantity }, 
                  setSaleQuantity, 
                  "NEW SALE ITEM ADDED!")}
              />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
}

export default AddNewItems;
