import React, { useState } from "react";
import Layout from "../components/layout"; 
import Button from "../components/button";

function AddNewItems() {
  const [saleQuantity, setSaleQuantity] = useState("");
  const [storageLocationName, setStorageLocationName] = useState("");

  async function handleAddItems(apiRoute, payload, resetInput, actionMessage) {
    const res = await fetch(apiRoute, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      alert(actionMessage);
      resetInput("");
    } else {
      alert("ERROR: " + data.error);
    }
  }

  return (
    <Layout title="Add New Items">
      <div className="flex gap-x-10 justify-center">
        {/* Add Storage Location */}
        <div className="flex flex-col items-center">
          <h1 className="text-black text-[20px] my-7">Add Storage Location</h1>
          <input
            className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
            placeholder="Input"
            value={storageLocationName}
            onChange={(e) => setStorageLocationName(e.target.value)}
          />
          <Button
            label="Add"
            color="red"
            className="w-[120px] h-[45px] my-6"
            onClick={() =>
              handleAddItems(
                "/api/addStorageLocationList",
                { storage_location_name: storageLocationName },
                setStorageLocationName,
                "NEW STORAGE LOCATION ADDED!"
              )
            }
          />
        </div>

        {/* Add Product */}
        <div className="flex flex-col items-center">
          <h1 className="text-black text-[20px] my-7">Add Product</h1>
          <input className="p-4 w-[300px] bg-white text-black border rounded-lg my-4" placeholder="Input" />
          <Button
            label="Add"
            color="red"
            className="w-[120px] h-[45px] my-6"
          />
        </div>

        {/* Add Sale Item */}
        <div className="flex flex-col items-center">
          <h1 className="text-black text-[20px] my-7">Add Sale Item</h1>
          <input
            className="p-4 w-[300px] bg-white text-black border rounded-lg my-4"
            placeholder="Input"
            value={saleQuantity}
            onChange={(e) => setSaleQuantity(e.target.value)}
          />
          <Button
            label="Add"
            color="red"
            className="w-[120px] h-[45px] my-6"
            onClick={() =>
              handleAddItems(
                "/api/addSaleList",
                { product_quantity: saleQuantity },
                setSaleQuantity,
                "NEW SALE ITEM ADDED!"
              )
            }
          />
        </div>
      </div>
    </Layout>
  );
}

export default AddNewItems;
