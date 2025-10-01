import React, { useState, useEffect } from "react";
import Layout from "../components/layout";
import Selector from "../components/Selector";

// Delete storage location by ID
async function deleteStorageLocation(id) {
  try {
    const res = await fetch("/api/delStorageLocation", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");

    alert("Storage location deleted!");
    return true;
  } catch (err) {
    console.error("Delete error:", err);
    alert(err.message);
    return false;
  }
}

// Delete sale item by ID
async function deleteSaleItem(id) {
  try {
    const res = await fetch("/api/delSaleItem", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");

    alert("Sale item deleted!");
    return true;
  } catch (err) {
    console.error("Delete error:", err);
    alert(err.message);
    return false;
  }
}

// Delete product item by ID
async function deleteProductItem(id) {
  try {
    const res = await fetch("/api/delProduct", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");

    alert("Product item deleted!");
    return true;
  } catch (err) {
    console.error("Delete error:", err);
    alert(err.message);
    return false;
  }
}

// Delete Job by Process ID
async function deleteProcess(id) {
  try {
    const res = await fetch("/api/delProcess", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");

    alert("Process deleted!");
    return true;
  } catch (err) {
    console.error("Delete error:", err);
    alert(err.message);
    return false;
  }
}

//fetch for dropdown menu
async function fetchList(apiRoute, setData) {
  try {
    const res = await fetch(apiRoute);
    const data = await res.json();
    setData(data);
  } catch (err) {
    console.error("Error fetching:", err);
  }
}

export default function DeleteItems() {
  const [storageLocationId, setStorageLocationId] = useState("");
  const [saleItemId, setSaleItemId] = useState("");
  const [productItemId, setProductItemId] = useState("");
  const [processId, setProcessId] = useState("");
  const [storageLocations, setStorageLocations] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [productItems, setProducts] = useState([]);
  const [processes, setProcesses] = useState([]);

  // Fetch lists on mount
  useEffect(() => {
    fetchList("/api/fetchStorageLocations", setStorageLocations);
    fetchList("/api/fetchSaleList", setSaleItems);
    fetchList("/api/fetchProductList", setProducts);
    fetchList("/api/fetchProcesses", setProcesses);
  }, []);

  return (
    <Layout title="Delete Items">
      <div className="flex flex-wrap items-center justify-center gap-20">
        {/* Delete Storage Location */}
        <div className="flex flex-col items-center">
          <label className="font-bold">Delete Storage Location</label>
          <Selector
            label="From"
            value={storageLocationId}
            onChange={setStorageLocationId}
            options={storageLocations.map((loc) => ({
              value: loc.id,
              label: loc.storage_location_name,
            }))}
          />
          <button
            className=" mt-4 w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]"
            onClick={async () => {
              const deleted = await deleteStorageLocation(storageLocationId);
              if (deleted) {
                fetchList("/api/fetchStorageLocations", setStorageLocations);
                setStorageLocationId("");
              }
            }}
          >

            Delete
          </button>
        </div>

        {/* Delete Product */}
        <div className="flex flex-col items-center">
          <label className="font-bold">Delete Product</label>
          <Selector
            label="From"
            value={productItemId}
            onChange={setProductItemId}
            options={productItems.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
          <button
            className=" mt-4 w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]"
            onClick={async () => {
              const deleted = await deleteProductItem(productItemId);
              if (deleted) {
                fetchList("/api/fetchProductList", setProducts);
                setProductItemId("");
              }
            }}
          >
            Delete
          </button>
        </div>

        {/* Delete Sale Item */}
        <div className="flex flex-col items-center">
          <label className="font-bold">Delete Sale Item</label>
          <Selector
            label="From"
            value={saleItemId}
            onChange={setSaleItemId}
            options={saleItems.map((item) => ({
              value: item.id,
              label: item.product_quantity,
            }))}
          />
          <button
            className=" mt-4 w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]"
            onClick={async () => {
              const deleted = await deleteSaleItem(saleItemId);
              if (deleted) {
                fetchList("/api/fetchSaleList", setSaleItems);
                setSaleItemId("");
              }
            }}
          >

            Delete
          </button>
        </div>

        {/* Delete Process */}
        <div className="flex flex-col items-center">
          <label className="font-bold">Delete Process</label>
          <Selector
            label="From"
            value={processId}
            onChange={setProcessId}
            options={processes.map((item) => ({
              value: item.process_id,
              label: item.process_id,
            }))}
          />
          <button
            className=" mt-4 w-[100px] px-6 py-2 rounded-xl shadow-md bg-[#5D1214] text-white hover:bg-[#2C3A35]"
            onClick={async () => {
              const deleted = await deleteProcess(processId);
              if (deleted) {
                fetchList("/api/fetchProcesses", setProcesses);
                setProcessId("");
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default deleteItems;

