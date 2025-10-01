import React from "react";
//import "../App.css";
import Layout from "../components/layout";
import DeleteCropForm from "../components/DeleteCropForm";

function deleteItems() {
  return (
    <Layout title="Delete Items">
      <div className="flex flex-wrap items-center justify-center gap-20">
        {/* Delete Storage Location (placeholder) */}
        <div className="flex flex-col items-center">
          <label className="font-bold">Delete Storage Location</label>
          <input
            className="bg-white p-2 w-[150px] border rounded-lg my-3"
            placeholder="Input"
          />
          <button className="w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]">
            Delete
          </button>
        </div>

        {/* ✅ Delete Crop (Crop Type) */}
        <div className="flex flex-col items-center">
          <label className="font-bold mb-2">Delete Crop</label>
          <DeleteCropForm />
        </div>

        {/* Delete Sale Item (placeholder) */}
        <div className="flex flex-col items-center">
          <label className="font-bold">Delete Sale Item</label>
          <input
            className="bg-white p-2 w-[150px] border rounded-lg my-3"
            placeholder="Input"
          />
          <button className="w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]">
            Delete
          </button>
        </div>

        {/* Delete Process (placeholder) */}
        <div className="flex flex-col items-center">
          <label className="font-bold">Delete Process</label>
          <input
            className="bg-white p-2 w-[150px] border rounded-lg my-3"
            placeholder="Input"
          />
          <button className="w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]">
            Delete
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default deleteItems;
