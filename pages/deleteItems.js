// pages/deleteItems.js
"use client";
import React, { useState, useEffect } from "react";
import Layout from "../components/layout";

// ---- API delete helpers (unchanged logic) ----
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

// ---- fetch helper for dropdowns (forces array) ----
async function fetchList(apiRoute, setData) {
  try {
    const res = await fetch(apiRoute);
    const json = await res.json();
    const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
    setData(arr);
  } catch (err) {
    console.error("Error fetching:", err);
    setData([]);
  }
}

function DeleteItems() {
  // selected ids (text inputs)
  const [storageLocationId, setStorageLocationId] = useState("");
  const [saleItemId, setSaleItemId] = useState("");
  const [productItemId, setProductItemId] = useState("");

  // lists for suggestions
  const [storageLocations, setStorageLocations] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [productItems, setProducts] = useState([]);

  useEffect(() => {
    fetchList("/api/fetchStorageLocations", setStorageLocations);
    fetchList("/api/fetchSaleList", setSaleItems);
    fetchList("/api/fetchProductList", setProducts);
  }, []);

  const inputClass =
    "border p-2 rounded border-gray-400 placeholder-gray-400 w-full";

  const btn =
    "bg-[#5D1214] text-white px-6 py-2 rounded-[10px] text-base font-semibold text-center hover:bg-[#3D5147] transition-all duration-300 disabled:opacity-60";

  return (
    <Layout title="Delete Items" showBack={true}>
      <div className="w-full px-8 flex flex-col items-center">
        {/* Card */}
        <div className="w-full max-w-5xl bg-white p-8 rounded-xl shadow">
          <h1 className="text-black text-3xl font-bold mb-10 text-center">Delete Items</h1>

          {/* 3 columns on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Delete Storage Location */}
            <div className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Delete Storage Location
              </h2>

              <input
                className={inputClass}
                list="storageLocationList"
                placeholder="Type or paste Storage Location ID"
                value={storageLocationId}
                onChange={(e) => setStorageLocationId(e.target.value)}
              />
              {/* Suggestions */}
              <datalist id="storageLocationList">
                {(Array.isArray(storageLocations) ? storageLocations : []).map((loc) => (
                  <option
                    key={loc.id}
                    value={loc.id}
                    label={loc.storage_location_name}
                  >
                    {loc.storage_location_name}
                  </option>
                ))}
              </datalist>

              <button
                className={btn}
                disabled={!storageLocationId}
                onClick={async () => {
                  const ok = await deleteStorageLocation(storageLocationId);
                  if (ok) {
                    await fetchList("/api/fetchStorageLocations", setStorageLocations);
                    setStorageLocationId("");
                  }
                }}
              >
                Delete
              </button>
            </div>

            {/* Delete Product */}
            <div className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Delete Product
              </h2>

              <input
                className={inputClass}
                list="productList"
                placeholder="Type or paste Product ID"
                value={productItemId}
                onChange={(e) => setProductItemId(e.target.value)}
              />
              <datalist id="productList">
                {(Array.isArray(productItems) ? productItems : []).map((item) => (
                  <option key={item.id} value={item.id} label={item.name}>
                    {item.name}
                  </option>
                ))}
              </datalist>

              <button
                className={btn}
                disabled={!productItemId}
                onClick={async () => {
                  const ok = await deleteProductItem(productItemId);
                  if (ok) {
                    await fetchList("/api/fetchProductList", setProducts);
                    setProductItemId("");
                  }
                }}
              >
                Delete
              </button>
            </div>

            {/* Delete Sale Item */}
            <div className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Delete Sale Item
              </h2>

              <input
                className={inputClass}
                list="saleItemList"
                placeholder="Type or paste Sale Item ID"
                value={saleItemId}
                onChange={(e) => setSaleItemId(e.target.value)}
              />
              <datalist id="saleItemList">
                {(Array.isArray(saleItems) ? saleItems : []).map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    label={String(item.product_quantity)}
                  >
                    {String(item.product_quantity)}
                  </option>
                ))}
              </datalist>

              <button
                className={btn}
                disabled={!saleItemId}
                onClick={async () => {
                  const ok = await deleteSaleItem(saleItemId);
                  if (ok) {
                    await fetchList("/api/fetchSaleList", setSaleItems);
                    setSaleItemId("");
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DeleteItems;
