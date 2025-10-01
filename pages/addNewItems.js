import React, { useState } from "react";
import Layout from "../components/layout";
import AddCropForm from "../components/AddCropForm";

function addNewItems() {
  const [storageName, setStorageName] = useState("");
  const [saleItemName, setSaleItemName] = useState("");

  return (
    <div>
      <Layout title="Add New Items">
        <div className="flex gap-x-10 flex-row justify-center">
          {/* Add Storage Location (placeholder for later) */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Add Storage Location
            </h1>
            <input
              className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
              placeholder="Input"
              value={storageName}
              onChange={(e) => setStorageName(e.target.value)}
            />
            <button
              className="w-[120px] h-[45px] rounded-xl shadow border bg-white text-black font-[amiri] my-6"
              onClick={() => alert("Storage Location add coming soon")}
            >
              Add
            </button>
          </div>

          {/* ✅ Add Product (Crop Type) */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Add Product (Crop Type)
            </h1>
            <AddCropForm />
          </div>

          {/* Add Sale Item (placeholder for later) */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-black text-[20px] font-[amiri] my-7">
              Add Sale Item
            </h1>
            <input
              className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
              placeholder="Input"
              value={saleItemName}
              onChange={(e) => setSaleItemName(e.target.value)}
            />
            <button
              className="w-[120px] h-[45px] rounded-xl shadow border bg-white text-black font-[amiri] my-6"
              onClick={() => alert("Sale Item add coming soon")}
            >
              Add
            </button>
          </div>
        </div>
      </Layout>
    </div>
  );
}

export default addNewItems;
