
"use client";
import React, { useState, useEffect } from "react";
import Layout from "../components/layout";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function EditFRStorageSuppliers() {
//states
  const [storageName, setStorageName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [msgStorage, setMsgStorage] = useState("");
  const [msgCustomer, setMsgCustomer] = useState("");

  const [storageLocationId, setStorageLocationId] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [storageLocations, setStorageLocations] = useState([]);
  const [customers, setCustomers] = useState([]);

//fetch the lists
  async function fetchList(apiRoute, setData) {
    try {
      const res = await fetch(apiRoute);
      const data = await res.json();
      setData(data || []);
    } catch (err) {
      console.error("Error fetching:", err);
    }
  }

  // lists
  useEffect(() => {
    fetchList("/api/fetchFRStorageLocation", setStorageLocations);
    fetchList("/api/fetchCustomers", setCustomers);
  }, []);

  // functions
async function handleAddStorage(e) {
  e.preventDefault();
  try {
    // Insert directly into Supabase
    const { error } = await supabase.from("field_run_storage_test").insert([
      {
        location: storageName,        // text primary key
        lot_number: [],                // default empty array
        product: [],                  // default empty array
        weight: 0,
        moisture: 0,
        date_stored: new Date().toISOString(), // default current date
      },
    ]);

    if (error) throw error;
        setMsgStorage("Storage location added!");
        setStorageName("");
        fetchList("/api/fetchFRStorageLocation", setStorageLocations);
      } catch (err) {
        setMsgStorage(err.message);
      }
    }

  async function handleAddCustomer(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/addCustomer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add customer");
      setMsgCustomer("Customer added!");
      setCustomerName("");
      fetchList("/api/fetchCustomers", setCustomers);
    } catch (err) {
      setMsgCustomer(err.message);
    }
  }

  // delete functions
  async function deleteFRStorageLocation(id) {
    try {
      const res = await fetch("/api/deleteFRStorageLocation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      alert("Storage location deleted!");
      fetchList("/api/fetchFRStorageLocation", setStorageLocations);
      setStorageLocationId("");
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteCustomer(id) {
    try {
      const res = await fetch("/api/delCustomer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      alert("Customer deleted!");
      fetchList("/api/fetchCustomers", setCustomers);
      setCustomerId("");
    } catch (err) {
      alert(err.message);
    }
  }

  // styling
  const btn =
    "bg-[#5D1214] text-white px-6 py-2 rounded-[10px] text-base font-semibold text-center hover:bg-[#3D5147] transition-all duration-300 disabled:opacity-60";
  const field =
    "border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none";
  const selectBox =
    "border border-gray-300 rounded-md px-3 py-2 text-gray-700";

  //return function
  return (
    <Layout title="Edit Storage & Customers" showBack={true}>
      <div className="w-full px-8 flex flex-col items-center">
        <div className="w-full max-w-5xl bg-white p-8 rounded-xl shadow">
          <h1 className="text-black text-3xl font-bold mb-10 text-center">
            Add / Delete Storage & Customers
          </h1>

          {/* Add in row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            {/* adding storage location */}
            <form onSubmit={handleAddStorage} className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Add Storage Location
              </h2>
              <input
                className={field}
                placeholder="Enter Storage Location"
                value={storageName}
                onChange={(e) => setStorageName(e.target.value)}
              />
              <button type="submit" className={btn} disabled={!storageName.trim()}>
                Add
              </button>
              {msgStorage && (
                <p className="text-sm text-center md:text-left">{msgStorage}</p>
              )}
            </form>

            {/* adding customer */}
            <form onSubmit={handleAddCustomer} className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Add Customer
              </h2>
              <input
                className={field}
                placeholder="Enter Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <button type="submit" className={btn} disabled={!customerName.trim()}>
                Add
              </button>
              {msgCustomer && (
                <p className="text-sm text-center md:text-left">{msgCustomer}</p>
              )}
            </form>
          </div>

          {/* delete in row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* delete FR storage location */}
            <div className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Delete Storage Location
              </h2>
              <select
                className={selectBox}
                value={storageLocationId}
                onChange={(e) => setStorageLocationId(e.target.value)}
              >
                <option value="">Select</option>
                {storageLocations.map((loc) => (
                <option key={loc.location} value={loc.location}>
                  {loc.location}
                </option>
              ))}
              </select>
              <button
                className={btn}
                disabled={!storageLocationId}
                onClick={() => deleteFRStorageLocation(storageLocationId)}
              >
                Delete
              </button>
            </div>

            {/* delete customer */}
            <div className="flex flex-col gap-3">
              <h2 className="text-black font-semibold text-lg text-center md:text-left">
                Delete Customer
              </h2>
              <select
                className={selectBox}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select</option>
                {customers.map((cust) => (
                <option key={cust.customer_id} value={cust.customer_id}>
                  {cust.name}
                </option>
              ))}
              </select>
              <button
                className={btn}
                disabled={!customerId}
                onClick={() => deleteCustomer(customerId)}
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