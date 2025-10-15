// pages/addNewItems.js
"use client";
import React, { useState, useTransition } from "react";
import Layout from "../components/layout";
import { supabase } from "../lib/supabase";

const normalize = (s) => s.trim().replace(/\s+/g, " ");

function AddNewItems() {
  // state
  const [storageName, setStorageName] = useState("");
  const [saleItemName, setSaleItemName] = useState("");
  const [cropName, setCropName] = useState("");

  // messages
  const [msgStorage, setMsgStorage] = useState("");
  const [msgSale, setMsgSale] = useState("");
  const [msgCrop, setMsgCrop] = useState("");

  // pending
  const [isPendingCrop, startCrop] = useTransition();

  // shared styles
  const field =
    "border p-2 rounded border-gray-400 placeholder-gray-400 w-full text-black";
  const btn =
    "bg-[#5D1214] text-white px-6 py-2 rounded-[10px] text-base font-semibold text-center hover:bg-[#3D5147] transition-all duration-300 disabled:opacity-60";

  // handlers
  const handleAddStorage = (e) => {
    e.preventDefault();
    const cleaned = normalize(storageName);
    if (!cleaned) return setMsgStorage("Enter storage location.");
    // TODO: wire to my storage table when ready
    setMsgStorage(`Saved (UI only): ${cleaned}`);
    setStorageName("");
  };

  const handleAddSaleItem = (e) => {
    e.preventDefault();
    const cleaned = normalize(saleItemName);
    if (!cleaned) return setMsgSale("Enter sale item.");
    // TODO: wire to my sale items table when ready
    setMsgSale(`Saved (UI only): ${cleaned}`);
    setSaleItemName("");
  };

  const handleAddCrop = (e) => {
    e.preventDefault();
    setMsgCrop("");
    const cleaned = normalize(cropName);
    if (!cleaned) return setMsgCrop("Enter crop name.");

    startCrop(async () => {
      // prevent duplicates (case insensitive)
      const { data: exists, error: checkErr } = await supabase
        .from("crop_types")
        .select("id")
        .ilike("name", cleaned);
      if (checkErr) {
        console.error(checkErr);
        return setMsgCrop("Error checking duplicates.");
      }
      if (exists?.length) {
        return setMsgCrop("That crop already exists.");
      }

      const { error } = await supabase
        .from("crop_types")
        .insert([{ name: cleaned, show_in_dropdown: true }]);
      if (error) {
        console.error(error);
        return setMsgCrop("Error adding crop.");
      }
      setMsgCrop(`Added: ${cleaned}`);
      setCropName("");
    });
  };

  return (
    <Layout title="Add New Items" showBack={true}>
      <div className="w-full px-8 flex flex-col items-center">
        {/* Card */}
        <div className="w-full max-w-5xl bg-white p-8 rounded-xl shadow">
          <h1 className="text-black text-3xl font-bold mb-10 text-center">
            Add New Items
          </h1>

          {/* 3 columns on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Add Storage Location */}
            <form onSubmit={handleAddStorage} className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Add Storage Location
              </h2>
              <input
                className={field}
                placeholder="Enter storage location"
                value={storageName}
                onChange={(e) => setStorageName(e.target.value)}
              />
              <button type="submit" className={btn}>
                Add
              </button>
              {msgStorage ? (
                <p className="text-sm text-center md:text-left">{msgStorage}</p>
              ) : null}
            </form>

            {/* Add Product (Crop Type) */}
            <form onSubmit={handleAddCrop} className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Add Product (Crop Type)
              </h2>
              <input
                className={field}
                placeholder="Enter crop name"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
              />
              <button
                type="submit"
                className={btn}
                disabled={isPendingCrop || !cropName.trim()}
              >
                {isPendingCrop ? "Saving…" : "Add"}
              </button>
              {msgCrop ? (
                <p className="text-sm text-center md:text-left">{msgCrop}</p>
              ) : null}
            </form>

            {/* Add Sale Item */}
            <form onSubmit={handleAddSaleItem} className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Add Sale Item
              </h2>
              <input
                className={field}
                placeholder="Enter sale item"
                value={saleItemName}
                onChange={(e) => setSaleItemName(e.target.value)}
              />
              <button type="submit" className={btn}>
                Add
              </button>
              {msgSale ? (
                <p className="text-sm text-center md:text-left">{msgSale}</p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AddNewItems;
